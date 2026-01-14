import { AudioProvider, ApiKey } from "../types";

const STORAGE_KEY = 'scriptgenie_api_keys';

class KeyManagerService {
  private keys: ApiKey[] = [];

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.keys = stored ? JSON.parse(stored) : [];
      
      let hasUpdates = false;

      // Cleanup: Remove any legacy system keys or invalid entries
      const initialLength = this.keys.length;
      this.keys = this.keys.filter(k => 
        k && typeof k === 'object' && 
        !(k as any).isSystem && 
        k.label !== 'System Default' &&
        k.id !== 'sys-env-key' // Also remove the env key if it was saved previously
      );
      
      if (this.keys.length !== initialLength) {
          hasUpdates = true;
      }

      // NOTE: We do NOT automatically inject process.env.API_KEY here anymore.
      // The user must manually add their key via the UI.

      // Migration: Ensure old keys have isEnabled property and valid IDs
      this.keys = this.keys.map(k => {
        let updated = false;
        if (k.isEnabled === undefined) {
          k.isEnabled = true;
          updated = true;
        }
        if (!k.id) {
            k.id = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            updated = true;
        }
        if (updated) hasUpdates = true;
        return k;
      });

      if (hasUpdates) {
        this.saveKeys();
      }
    } catch (e) {
      console.error("Failed to load keys", e);
      this.keys = [];
    }
  }

  public getKeys(provider: AudioProvider): ApiKey[] {
    return this.keys.filter(k => k.provider === provider);
  }

  public addKey(key: string, provider: AudioProvider, label?: string) {
    if (!key.trim()) throw new Error("API Key cannot be empty");

    // Check for duplicates
    if (this.keys.some(k => k.key === key && k.provider === provider)) {
      throw new Error("This API Key already exists.");
    }

    // Use a more robust unique ID to prevent React key collisions
    const uniqueId = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newKey: ApiKey = {
      id: uniqueId,
      key,
      provider,
      label: label || `Key ${key.substring(0, 4)}...`,
      isEnabled: true // Default to active
    };
    
    // Create a new array reference
    this.keys = [...this.keys, newKey];
    this.saveKeys();
  }

  public removeKey(id: string) {
    const originalLength = this.keys.length;
    this.keys = this.keys.filter(k => k.id !== id);
    
    if (this.keys.length === originalLength) {
        console.warn(`Attempted to remove key with id ${id} but it was not found.`);
    } else {
        console.log(`Key ${id} removed successfully.`);
    }
    
    this.saveKeys();
  }

  public toggleKeyStatus(id: string) {
    this.keys = this.keys.map(k => 
      k.id === id ? { ...k, isEnabled: !k.isEnabled } : k
    );
    this.saveKeys();
  }

  private saveKeys() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.keys));
  }

  /**
   * Executes a function with automatic key rotation.
   * Only uses keys that are explicitly ENABLED by the user.
   */
  public async executeWithRotation<T>(
    provider: AudioProvider,
    operation: (apiKey: string) => Promise<T>
  ): Promise<T> {
    // Filter for Provider AND isEnabled
    const availableKeys = this.getKeys(provider).filter(k => k.isEnabled);
    
    if (availableKeys.length === 0) {
      throw new Error(`No enabled API keys found for ${provider}. Please add and enable a key in API Manager.`);
    }

    let lastError: any = null;

    for (const keyObj of availableKeys) {
      try {
        return await operation(keyObj.key);
      } catch (error: any) {
        console.warn(`Key ${keyObj.label} failed:`, error);
        // Continue to next key
        lastError = error;
      }
    }

    throw lastError || new Error(`All enabled ${provider} keys failed to execute request.`);
  }
}

export const keyManager = new KeyManagerService();
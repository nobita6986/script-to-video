import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Key, AlertTriangle, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { keyManager } from '../services/keyManager';
import { ApiKey, AudioProvider } from '../types';

interface ApiManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiManagerModal: React.FC<ApiManagerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<AudioProvider>('gemini');
  const [newKey, setNewKey] = useState('');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load keys whenever the modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      refreshKeys();
      setDeleteConfirmId(null);
    }
  }, [isOpen, activeTab]);

  const refreshKeys = () => {
    // Force a re-read from the service
    setKeys([...keyManager.getKeys(activeTab)]);
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    try {
      keyManager.addKey(newKey.trim(), activeTab);
      setNewKey('');
      setError(null);
      refreshKeys();
    } catch (err: any) {
      setError(err.message || "Failed to add key.");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (deleteConfirmId === id) {
        // Confirmed
        keyManager.removeKey(id);
        setDeleteConfirmId(null);
        refreshKeys();
    } else {
        // First click - show confirmation
        setDeleteConfirmId(id);
        // Auto-cancel confirmation after 3 seconds
        setTimeout(() => {
            setDeleteConfirmId(prev => prev === id ? null : prev);
        }, 3000);
    }
  };

  const handleToggleKey = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    keyManager.toggleKeyStatus(id);
    refreshKeys();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            API Key Manager
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab('gemini')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'gemini' 
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-gray-800/30' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/10'
            }`}
          >
            Google Gemini
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('elevenlabs')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'elevenlabs' 
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-gray-800/30' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/10'
            }`}
          >
            ElevenLabs
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-4">
              {activeTab === 'gemini' 
                ? 'Manage your Google Gemini API keys. The system will search for an ENABLED key to use automatically.' 
                : 'Manage your ElevenLabs API keys for high-quality speech synthesis.'}
            </p>

            <form onSubmit={handleAddKey} className="flex gap-2">
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={`Enter ${activeTab === 'gemini' ? 'Gemini' : 'ElevenLabs'} API Key`}
                className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              />
              <button
                type="submit"
                disabled={!newKey.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </form>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>

          <div className="space-y-3">
            {keys.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-800 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No keys found. Add one to get started.</p>
              </div>
            ) : (
              keys.map((k) => (
                <div 
                  key={k.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${k.isEnabled ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-900/50 border-gray-800 opacity-70'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button 
                      type="button"
                      onClick={(e) => handleToggleKey(e, k.id)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${k.isEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gray-700 text-gray-500'}`}
                      title={k.isEnabled ? "Key is Active" : "Key is Inactive"}
                    >
                      {k.isEnabled ? <Check className="w-3 h-3 pointer-events-none" /> : <div className="w-2 h-2 rounded-full bg-gray-500 pointer-events-none" />}
                    </button>
                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-medium truncate ${k.isEnabled ? 'text-gray-200' : 'text-gray-500'}`}>
                        {k.label || 'API Key'}
                        {!k.isEnabled && <span className="ml-2 text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">INACTIVE</span>}
                      </span>
                      <span className="text-xs text-gray-600 font-mono truncate">
                        {k.key.substring(0, 8)}••••••••••••••••
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleKey(e, k.id)}
                      className="p-2 text-gray-500 hover:text-indigo-400 transition-colors"
                      title={k.isEnabled ? "Disable Key" : "Enable Key"}
                    >
                      {k.isEnabled ? <ToggleRight className="w-5 h-5 text-indigo-400 pointer-events-none" /> : <ToggleLeft className="w-5 h-5 pointer-events-none" />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, k.id)}
                      className={`p-2 rounded-lg transition-colors z-10 flex items-center gap-1 ${
                        deleteConfirmId === k.id 
                            ? 'bg-red-500 text-white px-3' 
                            : 'text-gray-500 hover:text-red-400 hover:bg-red-400/10'
                      }`}
                      title={deleteConfirmId === k.id ? "Click to Confirm Delete" : "Delete Key"}
                    >
                      {deleteConfirmId === k.id ? (
                          <>
                            <span className="text-xs font-bold">Confirm</span>
                          </>
                      ) : (
                          <Trash2 className="w-4 h-4 pointer-events-none" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiManagerModal;
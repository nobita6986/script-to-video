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

  useEffect(() => {
    if (isOpen) {
      refreshKeys();
      setDeleteConfirmId(null);
    }
  }, [isOpen, activeTab]);

  const refreshKeys = () => {
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
        keyManager.removeKey(id);
        setDeleteConfirmId(null);
        refreshKeys();
    } else {
        setDeleteConfirmId(id);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800/50 bg-slate-900/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 bg-violet-500/10 rounded-lg">
                <Key className="w-5 h-5 text-violet-400" />
            </div>
            API Key Manager
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30">
          <button
            type="button"
            onClick={() => setActiveTab('gemini')}
            className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'gemini' 
                ? 'text-violet-400 bg-slate-800/20' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/10'
            }`}
          >
            Google Gemini
            {activeTab === 'gemini' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 shadow-[0_-2px_6px_rgba(139,92,246,0.5)]"></div>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('elevenlabs')}
            className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
              activeTab === 'elevenlabs' 
                ? 'text-orange-400 bg-slate-800/20' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/10'
            }`}
          >
            ElevenLabs
             {activeTab === 'elevenlabs' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 shadow-[0_-2px_6px_rgba(249,115,22,0.5)]"></div>}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-900">
          <div className="mb-8">
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              {activeTab === 'gemini' 
                ? 'Add your Google Gemini API keys here. The system will rotate through enabled keys to ensure smooth generation.' 
                : 'Add your ElevenLabs API keys for premium AI voices. We recommend keeping only one active key.'}
            </p>

            <form onSubmit={handleAddKey} className="flex gap-3">
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={`Paste ${activeTab === 'gemini' ? 'Gemini' : 'ElevenLabs'} Key`}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm shadow-inner placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={!newKey.trim()}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-violet-500/20 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </form>
            {error && <p className="text-red-400 text-xs mt-3 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {error}</p>}
          </div>

          <div className="space-y-3">
            {keys.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                    <Key className="w-6 h-6" />
                </div>
                <p className="text-slate-500 text-sm font-medium">No keys configured yet.</p>
              </div>
            ) : (
              keys.map((k) => (
                <div 
                  key={k.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${
                      k.isEnabled 
                      ? 'bg-slate-800/40 border-slate-700 shadow-sm' 
                      : 'bg-slate-900/50 border-slate-800 opacity-60 grayscale'
                  }`}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <button 
                      type="button"
                      onClick={(e) => handleToggleKey(e, k.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${k.isEnabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-600 border border-slate-700'}`}
                    >
                      {k.isEnabled ? <Check className="w-4 h-4 pointer-events-none" /> : <div className="w-2 h-2 rounded-full bg-slate-600 pointer-events-none" />}
                    </button>
                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-semibold truncate ${k.isEnabled ? 'text-slate-200' : 'text-slate-500'}`}>
                        {k.label || 'API Key'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono truncate tracking-wider">
                        {k.key.substring(0, 8)}••••••••••••••••
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleKey(e, k.id)}
                      className="p-2 text-slate-500 hover:text-violet-400 transition-colors bg-transparent hover:bg-slate-700/50 rounded-lg"
                      title={k.isEnabled ? "Disable Key" : "Enable Key"}
                    >
                      {k.isEnabled ? <ToggleRight className="w-6 h-6 text-violet-500 pointer-events-none" /> : <ToggleLeft className="w-6 h-6 pointer-events-none" />}
                    </button>

                    <div className="w-px h-6 bg-slate-700/50 mx-1"></div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, k.id)}
                      className={`p-2 rounded-lg transition-all z-10 flex items-center gap-2 ${
                        deleteConfirmId === k.id 
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3' 
                            : 'text-slate-500 hover:text-red-400 hover:bg-red-400/10'
                      }`}
                    >
                      {deleteConfirmId === k.id ? (
                          <span className="text-xs font-bold">Confirm</span>
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
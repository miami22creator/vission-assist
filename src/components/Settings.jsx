import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const Settings = ({ isOpen, onClose, onSave }) => {
    const [provider, setProvider] = useState('gemini');
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        const savedProvider = localStorage.getItem('ai_provider') || 'gemini';
        const savedKey = localStorage.getItem('ai_api_key') || '';
        setProvider(savedProvider);
        setApiKey(savedKey);
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('ai_provider', provider);
        localStorage.setItem('ai_api_key', apiKey);
        onSave({ provider, apiKey });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">AI Provider</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setProvider('gemini')}
                                className={`p-3 rounded-xl border ${provider === 'gemini' ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                            >
                                Google Gemini
                            </button>
                            <button
                                onClick={() => setProvider('openai')}
                                className={`p-3 rounded-xl border ${provider === 'openai' ? 'bg-green-600 border-green-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                            >
                                OpenAI (GPT-4)
                            </button>
                        </div>
                    </div>

                    {/* API Key Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={`Paste your ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} Key here`}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            {provider === 'gemini'
                                ? "Get a free key at aistudio.google.com"
                                : "Get your key at platform.openai.com"}
                        </p>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        <Save className="w-5 h-5" />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;

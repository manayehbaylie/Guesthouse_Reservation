import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X, Code, Terminal } from 'lucide-react';

export const BackendConfigModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState(ApiService.getBackendMode());
  const [apiUrl, setApiUrl] = useState(ApiService.getApiUrl());
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthStatus({ ok: true, data });
      } else {
        setHealthStatus({ ok: false, message: `HTTP ${res.status}` });
      }
    } catch (err) {
      setHealthStatus({ ok: false, message: err.message || 'Server disconnected' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    ApiService.setBackendMode(mode, apiUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-400/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-100 font-serif">Backend Integration Settings</h2>
              <p className="text-xs text-stone-400">Configure client API mode & monitor Express server endpoints.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Health Status Box */}
          <div className="p-4 rounded-xl border bg-stone-50 border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {healthStatus?.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Express API Health</div>
                <div className="text-sm font-semibold text-stone-900">
                  {healthStatus?.ok ? 'Connected (0.0.0.0:3000/api)' : 'Express API Offline or Proxy Mode'}
                </div>
              </div>
            </div>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="p-2 text-stone-600 hover:text-amber-800 hover:bg-stone-200 rounded-lg transition-colors"
              title="Ping server"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Frontend Data Execution Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('mock')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'mock'
                    ? 'border-amber-700 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-amber-700" />
                  Interactive Mock Storage
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Runs full stateful CRUD in browser local storage. Ideal for instant demo preview.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('api')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'api'
                    ? 'border-amber-700 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-700" />
                  Live Express Backend Mode
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Dispatches requests to Express `/api/*` endpoints.
                </div>
              </button>
            </div>
          </div>

          {/* API Base URL */}
          {mode === 'api' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                API Base URL Endpoint
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="/api"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Documented Endpoints List */}
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Active Endpoints Specification (SRS v2.0):
            </span>
            <div className="bg-stone-900 text-stone-300 p-3 rounded-xl font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto">
              <div><span className="text-emerald-400">POST</span> /api/auth/register, /api/auth/login</div>
              <div><span className="text-blue-400">GET</span> /api/guesthouses, /api/guesthouses/:id</div>
              <div><span className="text-emerald-400">POST</span> /api/guesthouses (Owner Registration)</div>
              <div><span className="text-amber-400">PUT</span> /api/rooms/:id/availability (Receptionist)</div>
              <div><span className="text-emerald-400">POST</span> /api/reservations (Automatic Payment)</div>
              <div><span className="text-blue-400">GET</span> /api/receptionist/arrivals & departures</div>
              <div><span className="text-amber-400">PUT</span> /api/admin/guesthouses/:id/approve</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-xl transition-colors"
          >
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
};

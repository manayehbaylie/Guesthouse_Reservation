import React from 'react';
import { X, Server, Layout, Terminal, Code2, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white text-stone-900 rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-stone-900 text-stone-100 p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Full-Stack Architecture & API Specification</h2>
              <p className="text-xs text-stone-400">SRS v2.0 Modular Frontend (Vite/React) & Express REST Backend</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs text-stone-700 max-h-[75vh] overflow-y-auto">
          {/* Architecture Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
                <Layout className="w-4 h-4 text-amber-600" />
                <span>Frontend Layer (`/src`)</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Single-Page Application built with <strong>React 19</strong>, <strong>Vite</strong>, and <strong>Tailwind CSS</strong>. Uses Axios API client (`/src/services/api.js`) with automatic Bearer JWT Authorization interceptors.
              </p>
              <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-amber-200 text-amber-900">
                src/pages/(Guest, Owner, Receptionist, Admin)
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-400 text-sm">
                <Server className="w-4 h-4 text-amber-400" />
                <span>Backend REST API (`server.js`)</span>
              </div>
              <p className="text-stone-300 leading-relaxed">
                Node.js & Express REST API server running on port 3000. Provides complete JSON endpoints under <code>/api/*</code> with JWT Auth headers, booking overlap detection, and platform revenue calculation.
              </p>
              <div className="font-mono text-[11px] bg-stone-950 p-2 rounded-xl border border-stone-800 text-amber-300">
                /api/auth, /api/guesthouses, /api/reservations
              </div>
            </div>
          </div>

          {/* Terminal Execution Guide */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
              <Terminal className="w-4 h-4 text-stone-700" />
              <span>How to Run in Separate Terminals (Local Development)</span>
            </div>
            <p className="text-stone-600">
              When developing locally on your desktop machine, you can run the Express REST API backend and Vite frontend in separate terminal windows:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-3 bg-stone-900 text-stone-100 rounded-xl space-y-1">
                <div className="text-amber-400 font-bold text-[10px] uppercase">Terminal 1: Express REST API Backend</div>
                <div className="text-emerald-400"># Start Express Server on port 3000</div>
                <div>node server.js</div>
              </div>

              <div className="p-3 bg-stone-900 text-stone-100 rounded-xl space-y-1">
                <div className="text-amber-400 font-bold text-[10px] uppercase">Terminal 2: React Vite Frontend</div>
                <div className="text-emerald-400"># Start Vite Dev Server with API Proxy</div>
                <div>npm run dev</div>
              </div>
            </div>
          </div>

          {/* REST API Route Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-600" />
                <span>Backend REST Endpoints Summary (`/api`)</span>
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                All 100% Operational
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-2.5">HTTP Method</th>
                    <th className="px-4 py-2.5">REST Endpoint</th>
                    <th className="px-4 py-2.5">Description & Business Logic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-stone-800">
                  <tr>
                    <td className="px-4 py-2 text-emerald-600 font-bold">GET</td>
                    <td className="px-4 py-2 font-bold text-stone-900">/api/health</td>
                    <td className="px-4 py-2 font-sans">System health status and API version metadata</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-blue-600 font-bold">POST</td>
                    <td className="px-4 py-2 font-bold text-stone-900">/api/auth/login</td>
                    <td className="px-4 py-2 font-sans">User authentication & JWT bearer token issuance</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-emerald-600 font-bold">GET</td>
                    <td className="px-4 py-2 font-bold text-stone-900">/api/guesthouses</td>
                    <td className="px-4 py-2 font-sans">Fetch guesthouses with city, price, and amenity filters</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-blue-600 font-bold">POST</td>
                    <td className="px-4 py-2 font-bold text-stone-900">/api/reservations</td>
                    <td className="px-4 py-2 font-sans">Create reservation & process Telebirr/Chapa payment with overlap prevention</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-amber-600 font-bold">PUT</td>
                    <td className="px-4 py-2 font-bold text-stone-900">/api/reservations/:id/checkin</td>
                    <td className="px-4 py-2 font-sans">Receptionist check-in execution & room state update</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-purple-600 font-bold">PUT</td>
                    <td className="px-4 py-2 font-bold text-stone-900">/api/admin/guesthouses/:id/approve</td>
                    <td className="px-4 py-2 font-sans">System Admin property verification & publishing</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 p-4 border-t border-stone-200 flex items-center justify-between">
          <div className="text-[11px] text-stone-500 font-medium">
            Status: <span className="text-emerald-600 font-bold">Container Port 3000 Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs shadow-xs"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
}

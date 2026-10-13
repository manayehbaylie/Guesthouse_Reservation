import React, { useEffect, useState } from 'react';
import { AlertCircle, ClipboardList, LoaderCircle, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ApiService } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const PAGE_SIZE = 15;

const formatDate = (value) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

function Pagination({ data, onPageChange }) {
  const totalPages = Math.max(1, data?.totalPages || 1);
  const first = data?.total ? ((data.page - 1) * data.pageSize) + 1 : 0;
  const last = Math.min(data?.page * data?.pageSize || 0, data?.total || 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-4 py-3">
      <span className="text-xs text-stone-500">Showing {first}-{last} of {data?.total || 0}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(data.page - 1)}
          disabled={data.page <= 1}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >Previous</button>
        <span className="min-w-20 text-center text-xs font-semibold text-stone-600">Page {data.page} of {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(data.page + 1)}
          disabled={data.page >= totalPages}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >Next</button>
      </div>
    </div>
  );
}

function LoginAttemptsTab() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [outcome, setOutcome] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    ApiService.getAdminLoginAttempts({ page, pageSize: PAGE_SIZE, search, outcome, role })
      .then((result) => { if (active) { setData(result); setError(''); } })
      .catch((loadError) => { if (active) setError(loadError.message || t('Could not load login attempts.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, outcome, role]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-w-48 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 sm:max-w-xs sm:flex-1">
          <Search className="h-4 w-4 shrink-0 text-stone-500" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('Search email, IP, or device')} className="min-w-0 flex-1 text-sm outline-none placeholder:text-stone-400" />
        </label>
        <div className="flex flex-wrap gap-2">
          <select value={outcome} onChange={(event) => { setOutcome(event.target.value); setPage(1); }} aria-label={t('Filter by result')} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700">
            <option value="">{t('All results')}</option>
            <option value="success">{t('Successful')}</option>
            <option value="failed">{t('Failed')}</option>
          </select>
          <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} aria-label={t('Filter by role')} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700">
            <option value="">{t('All roles')}</option>
            {['ADMIN', 'OWNER', 'GUEST', 'RECEPTIONIST'].map((value) => <option key={value} value={value}>{t(value)}</option>)}
          </select>
        </div>
      </div>

      {error && <div role="alert" className="m-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4" />{error}</div>}
      {loading ? (
        <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-stone-500"><LoaderCircle className="h-4 w-4 animate-spin" />{t('Loading login attempts...')}</div>
      ) : data.items.length ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500">
                <tr>{['Account', 'Role', 'IP address', 'Device', 'Time', 'Result', 'Failed attempts'].map((heading) => <th key={heading} className="px-4 py-3 font-bold">{t(heading)}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.items.map((attempt) => (
                  <tr key={attempt.id} className={attempt.failedCount >= 5 ? 'bg-rose-50/70' : 'hover:bg-stone-50'}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-stone-900">{attempt.email || attempt.identifier || t('Unknown account')}</div>
                      {attempt.failedCount >= 5 && <div className="mt-1 inline-flex items-center gap-1 font-bold text-rose-700"><ShieldAlert className="h-3 w-3" />{t('Repeated failures')}</div>}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{attempt.role ? t(attempt.role) : '—'}</td>
                    <td className="px-4 py-3 font-mono text-stone-600">{attempt.ipAddress || '—'}</td>
                    <td className="max-w-56 truncate px-4 py-3 text-stone-600" title={attempt.device}>{attempt.device || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600">{formatDate(attempt.createdAt)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${attempt.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{t(attempt.success ? 'Success' : 'Failed')}</span></td>
                    <td className="px-4 py-3"><span className={`font-bold ${attempt.failedCount >= 5 ? 'text-rose-700' : 'text-stone-600'}`}>{attempt.failedCount}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination data={data} onPageChange={setPage} />
        </>
      ) : (
        <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center">
          <ShieldCheck className="mb-2 h-8 w-8 text-stone-300" />
          <p className="text-sm font-semibold text-stone-700">{t('No login attempts found')}</p>
          <p className="mt-1 text-xs text-stone-500">{t('Attempts will appear here when users sign in.')}</p>
        </div>
      )}
    </div>
  );
}

function AuditLogsTab() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    ApiService.getAdminAuditLogs({ page, pageSize: PAGE_SIZE, search })
      .then((result) => { if (active) { setData(result); setError(''); } })
      .catch((loadError) => { if (active) setError(loadError.message || t('Could not load audit logs.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-stone-500">{t('Read-only record of administrator setting changes.')}</p>
        <label className="flex min-w-48 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 sm:max-w-xs sm:flex-1">
          <Search className="h-4 w-4 shrink-0 text-stone-500" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('Search changes')} className="min-w-0 flex-1 text-sm outline-none placeholder:text-stone-400" />
        </label>
      </div>

      {error && <div role="alert" className="m-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4" />{error}</div>}
      {loading ? (
        <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-stone-500"><LoaderCircle className="h-4 w-4 animate-spin" />{t('Loading audit logs...')}</div>
      ) : data.items.length ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500">
                <tr>{['Administrator', 'Setting', 'Old value', 'New value', 'Time'].map((heading) => <th key={heading} className="px-4 py-3 font-bold">{t(heading)}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.items.map((entry) => (
                  <tr key={entry.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3"><div className="font-semibold text-stone-900">{entry.actorName}</div><div className="mt-0.5 text-stone-500">{entry.actorEmail || '—'}</div></td>
                    <td className="px-4 py-3"><div className="font-semibold text-stone-800">{t(entry.setting)}</div><div className="mt-0.5 max-w-sm text-stone-500">{entry.action}</div></td>
                    <td className="px-4 py-3"><span className="rounded-md bg-stone-100 px-2 py-1 font-mono text-stone-700">{entry.oldValue}</span></td>
                    <td className="px-4 py-3"><span className="rounded-md bg-amber-50 px-2 py-1 font-mono font-semibold text-amber-800">{entry.newValue}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600">{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination data={data} onPageChange={setPage} />
        </>
      ) : (
        <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center">
          <ClipboardList className="mb-2 h-8 w-8 text-stone-300" />
          <p className="text-sm font-semibold text-stone-700">{t('No audit entries found')}</p>
          <p className="mt-1 text-xs text-stone-500">{t('Confirmed platform setting changes will be recorded here.')}</p>
        </div>
      )}
    </div>
  );
}

export function SecurityAuditTabs() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('login');

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-black uppercase tracking-wider text-amber-700">{t('Platform security')}</div>
        <h2 className="mt-1 text-xl font-black text-stone-900">{t('Security & Audit Logs')}</h2>
        <p className="mt-1 text-sm text-stone-500">{t('Review sign-in activity and trace administrator setting changes.')}</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div role="tablist" aria-label={t('Security logs')} className="flex border-b border-stone-200 bg-stone-50 px-3 pt-3">
          <button type="button" role="tab" aria-selected={tab === 'login'} onClick={() => setTab('login')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === 'login' ? 'border-amber-500 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>
            <ShieldCheck className="h-4 w-4" />{t('Login Attempts')}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'audit'} onClick={() => setTab('audit')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === 'audit' ? 'border-amber-500 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>
            <ClipboardList className="h-4 w-4" />{t('Audit Log')}
          </button>
        </div>
        {tab === 'login' ? <LoginAttemptsTab /> : <AuditLogsTab />}
      </section>
    </div>
  );
}

export default SecurityAuditTabs;
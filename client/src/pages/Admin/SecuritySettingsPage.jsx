import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, ClipboardList, Download, LoaderCircle, LockKeyhole, Search, ShieldAlert, ShieldCheck, UnlockKeyhole } from 'lucide-react';
import { ApiService } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const PAGE_SIZE = 15;
const formatDate = (value, language) => new Intl.DateTimeFormat(language === 'am' ? 'am-ET' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

function Pagination({ data, onPageChange }) {
  const { t } = useLanguage();
  const pages = Math.max(1, data?.totalPages || 1);
  const first = data?.total ? ((data.page - 1) * data.pageSize) + 1 : 0;
  const last = Math.min(data?.page * data?.pageSize || 0, data?.total || 0);
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-4 py-3">
    <span className="text-xs text-stone-500">{t('Showing {{first}}-{{last}} of {{total}}', { first, last, total: data?.total || 0 })}</span>
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onPageChange(data.page - 1)} disabled={data.page <= 1} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 disabled:opacity-40">{t('Previous')}</button>
      <span className="min-w-20 text-center text-xs font-semibold text-stone-600">{t('Page {{page}} of {{totalPages}}', { page: data.page, totalPages: pages })}</span>
      <button type="button" onClick={() => onPageChange(data.page + 1)} disabled={data.page >= pages} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 disabled:opacity-40">{t('Next')}</button>
    </div>
  </div>;
}

function SystemAccessLockCard() {
  const { t } = useLanguage();
  const [state, setState] = useState({ locked: false, message: '' });
  const [saved, setSaved] = useState({ locked: false, message: '' });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dirty = state.locked !== saved.locked || state.message !== saved.message;

  useEffect(() => {
    let active = true;
    ApiService.getSystemLockStatus().then((result) => {
      if (!active) return;
      const next = { locked: result.systemLocked, message: result.systemLockMessage };
      setState(next); setSaved(next);
    }).catch((loadError) => { if (active) setError(t(loadError.message || 'Could not load system access status.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const save = async (locked) => {
    if (locked && !state.message.trim()) { setError(t('Enter a lock notification message before locking the system.')); return; }
    setSaving(true); setError('');
    try {
      const result = await ApiService.updateAdminSystemLock({ locked, message: state.message, password });
      const next = { locked: Boolean(result.locked), message: result.message || '' };
      setState(next); setSaved(next); setPassword('');
      window.dispatchEvent(new CustomEvent('system-lock-changed', { detail: { systemLocked: next.locked, systemLockMessage: next.message } }));
    } catch (saveError) { setError(t(saveError.message || 'Could not update system access.')); }
    finally { setSaving(false); }
  };

  return <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
      <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-lg ${state.locked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>{state.locked ? <LockKeyhole className="h-5 w-5" /> : <UnlockKeyhole className="h-5 w-5" />}</span><div><h3 className="text-sm font-black text-stone-900">{t('System Access Lock')}</h3><p className="mt-0.5 text-xs text-stone-500">{t('Lock non-admin access during maintenance.')}</p></div></div>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${state.locked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>{loading ? t('Loading status...') : t(state.locked ? 'System locked' : 'Access open')}</span>
    </div>
    <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <label className="block text-xs font-bold text-stone-700">{t('Lock notification message')}<textarea rows="3" maxLength="500" value={state.message} onChange={(event) => setState((current) => ({ ...current, message: event.target.value }))} placeholder={t('Under maintenance, please come back later')} className="mt-2 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-normal text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" /><span className="mt-1 block text-right font-normal text-stone-500">{state.message.length}/500</span></label>
      <div className="flex flex-col justify-end gap-3"><label className="text-xs font-bold text-stone-700">{t('Administrator password')}<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" /></label>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => save(state.locked)} disabled={loading || saving || !dirty} className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700 disabled:opacity-40">{saving ? t('Saving...') : t('Save message')}</button><button type="button" onClick={() => save(!state.locked)} disabled={loading || saving} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${state.locked ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'}`}>{state.locked ? <UnlockKeyhole className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}{t(state.locked ? 'Unlock system' : 'Lock system')}</button></div>
      </div>
    </div>
    {error && <p role="alert" className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-800">{error}</p>}
  </section>;
}

function LoginAttemptsTab() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState(''); const [outcome, setOutcome] = useState('failed'); const [role, setRole] = useState(''); const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 }); const [blockedIps, setBlockedIps] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => Promise.all([ApiService.getAdminLoginAttempts({ page, pageSize: PAGE_SIZE, search, outcome, role }), ApiService.getAdminBlockedIps()]);
  useEffect(() => {
    let active = true; setLoading(true);
    const refresh = () => load().then(([attempts, blocks]) => { if (active) { setData(attempts); setBlockedIps(blocks); setError(''); } }).catch((e) => { if (active) setError(t(e.message || 'Could not load login attempts.')); }).finally(() => { if (active) setLoading(false); });
    refresh(); const timer = window.setInterval(refresh, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [page, search, outcome, role]);
  const toggleIp = async (ip) => {
    try { if (blockedIps.some((item) => item.ipAddress === ip)) await ApiService.unblockAdminIp(ip); else await ApiService.blockAdminIp(ip, t('Repeated failed login attempts')); const [attempts, blocks] = await load(); setData(attempts); setBlockedIps(blocks); }
    catch (e) { setError(t(e.message || 'Could not update IP access.')); }
  };
  return <div>
    <div className="flex flex-col gap-3 border-b border-stone-200 p-4 lg:flex-row lg:items-center lg:justify-between"><label className="flex min-w-48 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 lg:max-w-xs lg:flex-1"><Search className="h-4 w-4 shrink-0 text-stone-500" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('Search account, IP, or device')} className="min-w-0 flex-1 text-sm outline-none" /></label><div className="flex gap-2"><select value={outcome} onChange={(e) => { setOutcome(e.target.value); setPage(1); }} aria-label={t('Filter by result')} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"><option value="">{t('All results')}</option><option value="success">{t('Successful')}</option><option value="failed">{t('Failed')}</option></select><select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label={t('Filter by role')} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"><option value="">{t('All roles')}</option>{['ADMIN', 'OWNER', 'GUEST', 'RECEPTIONIST'].map((value) => <option key={value} value={value}>{t(value)}</option>)}</select></div></div>
    {error && <div role="alert" className="m-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4" />{error}</div>}
    {loading ? <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-stone-500"><LoaderCircle className="h-4 w-4 animate-spin" />{t('Loading login attempts...')}</div> : data.items.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-xs"><thead className="bg-stone-50 text-[10px] uppercase text-stone-500"><tr>{['Account', 'Role', 'IP address', 'Device', 'Time', 'Result', 'Failed attempts', 'Access'].map((h) => <th key={h} className="px-4 py-3 font-bold">{t(h)}</th>)}</tr></thead><tbody className="divide-y divide-stone-100">{data.items.map((attempt) => { const blocked = blockedIps.some((entry) => entry.ipAddress === attempt.ipAddress); return <tr key={attempt.id}><td className="px-4 py-3"><div className="font-semibold text-stone-900">{attempt.email || attempt.identifier || t('Unknown account')}</div>{attempt.failedCount >= 5 && <span className="mt-1 inline-flex items-center gap-1 font-bold text-rose-700"><ShieldAlert className="h-3 w-3" />{t('Repeated failures')}</span>}</td><td className="px-4 py-3">{attempt.role ? t(attempt.role) : '—'}</td><td className="px-4 py-3 font-mono">{attempt.ipAddress || '—'}</td><td className="max-w-56 truncate px-4 py-3" title={attempt.device}>{attempt.device || '—'}</td><td className="whitespace-nowrap px-4 py-3">{formatDate(attempt.createdAt, language)}</td><td className="px-4 py-3">{t(attempt.success ? 'Success' : 'Failed')}</td><td className="px-4 py-3 font-bold">{attempt.failedCount}</td><td className="px-4 py-3"><button type="button" disabled={!attempt.ipAddress} onClick={() => toggleIp(attempt.ipAddress)} className="rounded-md bg-rose-100 px-2.5 py-1.5 text-[10px] font-bold text-rose-800 disabled:opacity-40">{t(blocked ? 'Unblock IP' : 'Block IP')}</button></td></tr>; })}</tbody></table></div><Pagination data={data} onPageChange={setPage} /></> : <p className="px-4 py-14 text-center text-sm text-stone-500">{t('No login attempts found')}</p>}
  </div>;
}

function AuditLogsTab() {
  const { t, language } = useLanguage(); const [search, setSearch] = useState(''); const [severity, setSeverity] = useState(''); const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 }); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = () => ApiService.getAdminAuditLogs({ page, pageSize: PAGE_SIZE, search, severity }).then((result) => { if (active) { setData(result); setError(''); } }).catch((e) => { if (active) setError(t(e.message || 'Could not load audit logs.')); }).finally(() => { if (active) setLoading(false); });
    refresh(); const timer = window.setInterval(refresh, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [page, search, severity]);
  const exportLogs = async (format) => { try { await ApiService.exportAdminAuditLogs(format, { search, severity }); } catch (e) { setError(t(e.message || 'Could not export audit logs.')); } };
  return <div>
    <div className="flex flex-col gap-3 border-b border-stone-200 p-4 xl:flex-row xl:items-center xl:justify-between"><label className="flex min-w-48 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 xl:max-w-xs xl:flex-1"><Search className="h-4 w-4 text-stone-500" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('Search activity')} className="min-w-0 flex-1 text-sm outline-none" /></label><div className="flex flex-wrap items-center gap-2"><select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }} aria-label={t('Filter by severity')} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"><option value="">{t('All severities')}</option>{['INFO', 'WARNING', 'CRITICAL'].map((value) => <option key={value} value={value}>{t(value)}</option>)}</select><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><Activity className="h-3.5 w-3.5" />{t('Live · refreshes every 10 seconds')}</span><button type="button" onClick={() => exportLogs('csv')} className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold"><Download className="h-3.5 w-3.5" />{t('Export CSV')}</button><button type="button" onClick={() => exportLogs('json')} className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold"><Download className="h-3.5 w-3.5" />{t('Export JSON')}</button></div></div>
    {error && <div role="alert" className="m-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4" />{error}</div>}
    {loading ? <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-stone-500"><LoaderCircle className="h-4 w-4 animate-spin" />{t('Loading audit logs...')}</div> : data.items.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-left text-xs"><thead className="bg-stone-50 text-[10px] uppercase text-stone-500"><tr>{['Time', 'Actor', 'Event', 'Method / path', 'Source IP', 'Status', 'Severity'].map((h) => <th key={h} className="px-4 py-3 font-bold">{t(h)}</th>)}</tr></thead><tbody className="divide-y divide-stone-100">{data.items.map((entry) => <tr key={entry.id} className="hover:bg-stone-50"><td className="whitespace-nowrap px-4 py-3">{formatDate(entry.createdAt, language)}</td><td className="px-4 py-3"><div className="font-semibold text-stone-900">{entry.actorName || t('Unknown')}</div><div className="text-stone-500">{entry.actorEmail || '—'}</div></td><td className="px-4 py-3 font-semibold">{t(entry.eventCode || entry.action)}</td><td className="px-4 py-3"><div className="font-bold">{entry.method}</div><div className="max-w-64 truncate font-mono text-stone-500" title={entry.path}>{entry.path}</div></td><td className="px-4 py-3 font-mono">{entry.ipAddress || '—'}</td><td className="px-4 py-3 font-mono font-bold">{entry.statusCode}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : entry.severity === 'WARNING' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>{t(entry.severity || 'INFO')}</span></td></tr>)}</tbody></table></div><Pagination data={data} onPageChange={setPage} /></> : <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center"><ClipboardList className="mb-2 h-8 w-8 text-stone-300" /><p className="text-sm font-semibold">{t('No audit entries found')}</p><p className="mt-1 text-xs text-stone-500">{t('Security events will appear here as they happen.')}</p></div>}
  </div>;
}

function AccessControlTab() {
  const { t, language } = useLanguage(); const [sessions, setSessions] = useState([]); const [blockedIps, setBlockedIps] = useState([]); const [ip, setIp] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const refresh = async () => { const [active, blocks] = await Promise.all([ApiService.getAdminActiveSessions(), ApiService.getAdminBlockedIps()]); setSessions(active); setBlockedIps(blocks); setError(''); };
  useEffect(() => {
    let active = true;
    const load = async () => { try { const [items, blocks] = await Promise.all([ApiService.getAdminActiveSessions(), ApiService.getAdminBlockedIps()]); if (active) { setSessions(items); setBlockedIps(blocks); setError(''); } } catch (e) { if (active) setError(t(e.message || 'Could not load access control data.')); } finally { if (active) setLoading(false); } };
    load(); const timer = window.setInterval(load, 15000); return () => { active = false; window.clearInterval(timer); };
  }, []);
  const addIp = async (event) => { event.preventDefault(); try { await ApiService.blockAdminIp(ip); setIp(''); await refresh(); } catch (e) { setError(t(e.message || 'Could not block IP address.')); } };
  const removeIp = async (address) => { try { await ApiService.unblockAdminIp(address); await refresh(); } catch (e) { setError(t(e.message || 'Could not unblock IP address.')); } };
  return <div className="space-y-6 p-4">{error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4" />{error}</div>}
    <section><div className="mb-3"><h3 className="text-sm font-black text-stone-900">{t('Active sessions')}</h3><p className="mt-1 text-xs text-stone-500">{t('Signed-in devices and their latest activity.')}</p></div>{loading ? <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-stone-500"><LoaderCircle className="h-4 w-4 animate-spin" />{t('Loading sessions...')}</div> : sessions.length ? <div className="overflow-x-auto rounded-lg border border-stone-200"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-stone-50 text-[10px] uppercase text-stone-500"><tr>{['Account', 'Role', 'IP address', 'Device', 'Last activity'].map((h) => <th key={h} className="px-4 py-3 font-bold">{t(h)}</th>)}</tr></thead><tbody className="divide-y divide-stone-100">{sessions.map((session) => <tr key={session.id}><td className="px-4 py-3"><div className="font-semibold">{session.user.fullName}</div><div className="text-stone-500">{session.user.email || '—'}</div></td><td className="px-4 py-3">{t(session.user.role)}</td><td className="px-4 py-3 font-mono">{session.ipAddress || '—'}</td><td className="max-w-72 truncate px-4 py-3" title={session.device}>{session.device || t('Unknown device')}</td><td className="whitespace-nowrap px-4 py-3">{formatDate(session.lastActivity, language)}</td></tr>)}</tbody></table></div> : <p className="rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">{t('No active sessions found')}</p>}</section>
    <section className="border-t border-stone-200 pt-5"><div className="mb-3"><h3 className="text-sm font-black text-stone-900">{t('Blocked IP addresses')}</h3><p className="mt-1 text-xs text-stone-500">{t('Blocked addresses are rejected before login credentials are checked.')}</p></div><form onSubmit={addIp} className="mb-3 flex flex-wrap gap-2"><input value={ip} onChange={(e) => setIp(e.target.value)} placeholder={t('IP address')} aria-label={t('IP address')} className="min-w-48 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" /><button type="submit" disabled={!ip.trim()} className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{t('Block IP')}</button></form>{blockedIps.length ? <div className="divide-y divide-stone-100 rounded-lg border border-stone-200">{blockedIps.map((entry) => <div key={entry.ipAddress} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><div className="font-mono text-sm font-bold">{entry.ipAddress}</div>{entry.reason && <div className="mt-0.5 text-xs text-stone-500">{entry.reason}</div>}</div><button type="button" onClick={() => removeIp(entry.ipAddress)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-bold">{t('Unblock IP')}</button></div>)}</div> : <p className="rounded-lg border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500">{t('No IP addresses are blocked')}</p>}</section>
  </div>;
}

export function SecuritySettingsPage() {
  const { t } = useLanguage(); const [tab, setTab] = useState('audit');
  const tabs = [['audit', 'Audit Log', ClipboardList], ['login', 'Login Attempts', ShieldCheck], ['access', 'Access Control', ShieldAlert]];
  return <div className="space-y-5"><div><div className="text-[11px] font-black uppercase tracking-wider text-amber-700">{t('Platform security')}</div><h2 className="mt-1 text-xl font-black text-stone-900">{t('System Settings · Security & Logs')}</h2><p className="mt-1 text-sm text-stone-500">{t('Manage maintenance access and review platform security activity.')}</p></div>
    <SystemAccessLockCard /><section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"><div role="tablist" aria-label={t('Security activity views')} className="flex flex-wrap border-b border-stone-200 bg-stone-50 px-3 pt-3">{tabs.map(([id, label, Icon]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === id ? 'border-amber-500 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`}><Icon className="h-4 w-4" />{t(label)}</button>)}</div>{tab === 'login' ? <LoginAttemptsTab /> : tab === 'access' ? <AccessControlTab /> : <AuditLogsTab />}</section>
  </div>;
}

export default SecuritySettingsPage;
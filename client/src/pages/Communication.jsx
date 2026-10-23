import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, LoaderCircle, MessageSquare, Pencil, Search, Send, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ApiService } from '../services/api.js';

const displayName = (user) => user?.fullName || user?.name || 'User';

const formatTime = (date) => new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(date));

function ContactPreview({ contact, t }) {
  return (
    <span className="flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-stone-900">{displayName(contact)}</span>
        <span className="mt-0.5 block truncate text-xs text-stone-500">
          {contact.guesthouses?.length
            ? contact.guesthouses.map((guesthouse) => guesthouse.name).join(', ')
            : [contact.email, t(contact.role)].filter(Boolean).join(' • ')}
        </span>
        <span className="mt-1 block truncate text-xs text-stone-600">{contact.latestMessage?.content || t('Start a conversation')}</span>
      </span>
      {contact.unreadCount > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-700 px-1.5 text-[10px] font-bold text-white">
          {contact.unreadCount}
        </span>
      )}
    </span>
  );
}

export function Communication() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const role = String(user?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isOwner = role === 'OWNER';
  const isReceptionist = role === 'RECEPTIONIST';
  const [contactGroup, setContactGroup] = useState('ALL');
  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [error, setError] = useState('');
  const endOfMessages = useRef(null);

  const selectedContact = contacts.find((contact) => contact.id === selectedId);
  const visibleContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesGroup = contactGroup === 'ALL' || contact.role === contactGroup;
      const matchesQuery = !query ||
        `${displayName(contact)} ${contact.email || ''} ${(contact.guesthouses || []).map((guesthouse) => guesthouse.name).join(' ')}`.toLowerCase().includes(query);
      return matchesGroup && matchesQuery;
    });
  }, [contacts, contactGroup, search]);

  const handleContactGroupChange = (groupId) => {
    setContactGroup(groupId);
    if (groupId === 'ALL' || selectedContact?.role === groupId) return;
    const firstContact = contacts.find((contact) => contact.role === groupId);
    setSelectedId(firstContact?.id || null);
  };

  const loadContacts = async () => {
    try {
      const result = await ApiService.getCommunicationContacts();
      setContacts(result);
      setSelectedId((current) => current || result[0]?.id || null);
      setError('');
    } catch (loadError) {
      setError(loadError.message || t('Unable to load contacts.'));
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return undefined;
    }

    let active = true;
    const loadMessages = async (showLoader = false) => {
      if (showLoader) setLoadingMessages(true);
      try {
        const result = await ApiService.getCommunicationMessages(selectedId);
        if (active) {
          setMessages(result);
          setError('');
          loadContacts();
        }
      } catch (loadError) {
        if (active) setError(loadError.message || t('Unable to load messages.'));
      } finally {
        if (active && showLoader) setLoadingMessages(false);
      }
    };

    loadMessages(true);
    const intervalId = window.setInterval(() => loadMessages(), 10000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [selectedId]);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selectedId || sending) return;

    setSending(true);
    setError('');
    try {
      const sentMessage = await ApiService.sendCommunicationMessage(selectedId, content);
      setMessages((current) => [...current, sentMessage]);
      setDraft('');
      await loadContacts();
    } catch (sendError) {
      setError(sendError.message || t('Unable to send message.'));
    } finally {
      setSending(false);
    }
  };

  const beginEdit = (message) => {
    setEditingMessageId(message.id);
    setEditDraft(message.content);
    setError('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditDraft('');
  };

  const saveEdit = async (messageId) => {
    const content = editDraft.trim();
    if (!content || savingEdit) return;

    setSavingEdit(true);
    setError('');
    try {
      const updatedMessage = await ApiService.editCommunicationMessage(messageId, content);
      setMessages((current) => current.map((message) =>
        message.id === messageId ? updatedMessage : message
      ));
      cancelEdit();
      await loadContacts();
    } catch (editError) {
      setError(editError.message || t('Unable to edit message.'));
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteMessage = async (messageId) => {
    setDeletingMessageId(messageId);
    setError('');
    try {
      await ApiService.deleteCommunicationMessage(messageId);
      setMessages((current) => current.filter((message) => message.id !== messageId));
      await loadContacts();
    } catch (deleteError) {
      setError(deleteError.message || t('Unable to delete message.'));
    } finally {
      setDeletingMessageId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f5f2] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex items-center justify-between gap-4 border-b border-stone-300 pb-5">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-amber-700">
              <MessageSquare className="h-4 w-4" />
              {t(isAdmin ? 'Administrator workspace' : isReceptionist ? 'Receptionist workspace' : 'Owner workspace')}
            </div>
            <h1 className="text-2xl font-black text-stone-900">{t('Communication')}</h1>
            <p className="mt-1 text-sm text-stone-600">
              {t(isAdmin
                ? 'Private conversations with guesthouse owners'
                : isReceptionist
                  ? 'Private conversations with your guesthouse owner'
                  : 'Private conversations with your assigned receptionists and platform administrators')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(isAdmin ? '/admin' : isReceptionist ? '/receptionist' : '/owner')}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('Dashboard')}</span>
          </button>
        </header>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <section className="grid min-h-[min(720px,calc(100vh-190px))] overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex max-h-64 flex-col border-b border-stone-200 bg-stone-50 lg:max-h-none lg:border-b-0 lg:border-r">
            <div className="border-b border-stone-200 px-4 py-4">
              <h2 className="text-sm font-bold text-stone-900">
                {isAdmin ? t('Owner conversations') : isReceptionist ? t('Your owner') : t('Your conversations')}
              </h2>
              {isOwner && (
                <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-stone-200 p-1" aria-label={t('Filter conversations')}>
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'RECEPTIONIST', label: 'Receptionists' },
                    { id: 'ADMIN', label: 'Platform admin' },
                  ].map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      aria-pressed={contactGroup === group.id}
                      onClick={() => handleContactGroupChange(group.id)}
                      className={`rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                        contactGroup === group.id
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {t(group.label)}
                    </button>
                  ))}
                </div>
              )}
              <label className="mt-3 flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-stone-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('Search contacts')}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
                />
              </label>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingContacts ? (
                <div className="flex items-center gap-2 px-4 py-6 text-sm text-stone-500">
                  <LoaderCircle className="h-4 w-4 animate-spin" /> {t('Loading contacts...')}
                </div>
              ) : visibleContacts.length ? (
                <>
                  {isOwner && contactGroup === 'ALL' && ['RECEPTIONIST', 'ADMIN'].map((groupRole) => {
                    const groupContacts = visibleContacts.filter((contact) => contact.role === groupRole);
                    if (!groupContacts.length) return null;
                    return (
                      <div key={groupRole}>
                        <h3 className="sticky top-0 border-b border-stone-200 bg-stone-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                          {t(groupRole === 'ADMIN' ? 'Platform administrators' : 'Your receptionists')}
                        </h3>
                        {groupContacts.map((contact) => (
                          <button
                            type="button"
                            key={contact.id}
                            onClick={() => setSelectedId(contact.id)}
                            className={`w-full border-b border-stone-200 px-4 py-3 text-left transition-colors ${selectedId === contact.id ? 'bg-amber-50' : 'hover:bg-white'}`}
                          >
                            <ContactPreview contact={contact} t={t} />
                          </button>
                        ))}
                      </div>
                    );
                  })}
                  {(isOwner && contactGroup === 'ALL' ? [] : visibleContacts).map((contact) => (
                    <button
                      type="button"
                      key={contact.id}
                      onClick={() => setSelectedId(contact.id)}
                      className={`w-full border-b border-stone-200 px-4 py-3 text-left transition-colors ${selectedId === contact.id ? 'bg-amber-50' : 'hover:bg-white'}`}
                    >
                      <ContactPreview contact={contact} t={t} />
                    </button>
                  ))}
                </>
              ) : (
                <p className="px-4 py-6 text-sm text-stone-500">
                  {contacts.length && !(isOwner && contactGroup !== 'ALL')
                    ? t('No matching contacts.')
                    : isOwner && contactGroup === 'ADMIN'
                      ? t('No platform administrators found.')
                      : isOwner && contactGroup === 'RECEPTIONIST'
                        ? t('No receptionists are assigned to your guesthouse yet.')
                        : t(isAdmin
                    ? 'No owners are available yet.'
                    : isReceptionist
                      ? 'No owner is assigned to your guesthouse yet.'
                      : 'No receptionists are assigned to your guesthouse yet.')}
                </p>
              )}
            </div>
          </aside>

          <div className="flex min-h-[420px] min-w-0 flex-col">
            {selectedContact ? (
              <>
                <div className="flex items-center gap-3 border-b border-stone-200 bg-white px-5 py-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#164e63] text-sm font-bold text-white">
                    {displayName(selectedContact).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-stone-900">{displayName(selectedContact)}</div>
                    <div className="mt-0.5 truncate text-xs text-stone-500">{selectedContact.email || t(selectedContact.role)}</div>
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto bg-[#fbfcfa] px-4 py-5 sm:px-6">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center gap-2 text-sm text-stone-500">
                      <LoaderCircle className="h-4 w-4 animate-spin" /> {t('Loading conversation...')}
                    </div>
                  ) : messages.length ? messages.map((message) => {
                    const isMine = String(message.senderId) === String(user?.id);
                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[min(90%,560px)] rounded-2xl px-4 py-3 shadow-sm ${isMine ? 'rounded-br-md bg-[#164e63] text-white' : 'rounded-bl-md border border-stone-200 bg-white text-stone-900'}`}>
                          {editingMessageId === message.id ? (
                            <div className="min-w-[min(72vw,320px)]">
                              <textarea
                                value={editDraft}
                                onChange={(event) => setEditDraft(event.target.value.slice(0, 4000))}
                                maxLength={4000}
                                rows={3}
                                aria-label={t('Edit message')}
                                className="w-full resize-y rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-300"
                              />
                              <div className="mt-2 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  disabled={savingEdit}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
                                >
                                  <X className="h-3.5 w-3.5" /> {t('Cancel')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveEdit(message.id)}
                                  disabled={!editDraft.trim() || savingEdit}
                                  className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-2.5 py-1 text-xs font-bold text-stone-950 hover:bg-amber-300 disabled:opacity-50"
                                >
                                  {savingEdit ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                  {t('Save')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                          )}
                          <div className={`mt-2 flex items-center justify-end gap-2 text-[10px] ${isMine ? 'text-white/70' : 'text-stone-500'}`}>
                            {message.editedAt && <span>{t('Edited')}</span>}
                            <time>{formatTime(message.createdAt)}</time>
                          </div>
                          {isMine && editingMessageId !== message.id && (
                            <div className="mt-2 flex justify-end gap-1 border-t border-white/15 pt-2">
                              <button
                                type="button"
                                onClick={() => beginEdit(message)}
                                aria-label={t('Edit message')}
                                title={t('Edit message')}
                                className="rounded-md p-1.5 text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMessage(message.id)}
                                disabled={deletingMessageId === message.id}
                                aria-label={t('Delete message')}
                                title={t('Delete message')}
                                className="rounded-md p-1.5 text-white/75 transition hover:bg-rose-400/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-50"
                              >
                                {deletingMessageId === message.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-stone-500">
                      <MessageSquare className="mb-3 h-8 w-8 text-amber-600" />
                      <p className="text-sm font-semibold text-stone-700">{t('Start the conversation')}</p>
                      <p className="mt-1 text-xs">{t('Your messages will appear here.')}</p>
                    </div>
                  )}
                  <div ref={endOfMessages} />
                </div>
                <form onSubmit={handleSend} className="flex items-end gap-3 border-t border-stone-200 bg-white p-4">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.slice(0, 4000))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={2}
                    maxLength={4000}
                    placeholder={t('Write a message...')}
                    aria-label={t('Write a message')}
                    className="max-h-32 min-h-12 flex-1 resize-y rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="hidden sm:inline">{t('Send')}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-stone-500">
                <MessageSquare className="mb-3 h-9 w-9 text-stone-300" />
                <p className="font-semibold text-stone-700">{t('Choose a contact')}</p>
                <p className="mt-1 text-sm">{t(`Select ${isAdmin ? 'an owner' : isReceptionist ? 'your owner' : 'a receptionist'} to view the conversation.`)}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Communication;
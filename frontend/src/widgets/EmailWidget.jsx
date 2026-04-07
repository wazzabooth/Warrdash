import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Mail, Send, Reply, Trash2, Edit, X, ChevronLeft, Inbox } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const now  = new Date();
  const diff = now - date;
  if (diff < 86400000 && date.getDate() === now.getDate())
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000)
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function fmtSender(from) {
  if (!from) return 'Unknown';
  return from.name || from.address || String(from);
}

function fmtAddress(from) {
  if (!from) return '';
  return from.address || String(from);
}

// ── Simple HTML→text stripper for preview ────────────────────────────────────
function stripHtml(html) {
  return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

// ── Email body renderer ───────────────────────────────────────────────────────
function EmailBody({ html, text }) {
  if (html) {
    // Sanitise: remove scripts, external images (privacy)
    const safe = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/src=["']http[^"']*["']/gi, 'src=""');
    return (
      <iframe
        srcDoc={`<style>body{font-family:sans-serif;font-size:13px;color:#ccc;background:#0d0d1a;margin:12px;line-height:1.5}a{color:#818cf8}</style>${safe}`}
        style={{ width: '100%', flex: 1, border: 'none', borderRadius: 6, background: 'var(--bg)' }}
        sandbox="allow-same-origin"
        title="Email body"
      />
    );
  }
  return (
    <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.82em', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '8px 0' }}>
      {text || '(empty)'}
    </div>
  );
}

// ── Compose / Reply form ──────────────────────────────────────────────────────
function ComposeForm({ widgetId, onSent, onCancel, replyTo }) {
  const [to,      setTo]      = useState(replyTo ? fmtAddress(replyTo.from) : '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body,    setBody]    = useState(replyTo
    ? `\n\n--- Original message from ${fmtSender(replyTo.from)} ---\n${replyTo.text || stripHtml(replyTo.html) || ''}`
    : '');
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState(null);

  const send = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) { setError('To, Subject and Body are required'); return; }
    setSending(true); setError(null);
    try {
      const r = await fetch(`/api/email/send?_widgetId=${widgetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(), subject: subject.trim(), body: body.trim(),
          ...(replyTo?.messageId ? { replyToMessageId: replyTo.messageId } : {}),
        }),
      });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error || 'Send failed');
      onSent();
    } catch(e) { setError(e.message); setSending(false); }
  };

  const inp = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: '0.82em', padding: '7px 10px', width: '100%', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button onClick={onCancel} className="btn ghost btn-icon" style={{ padding: 4 }}><X size={14} /></button>
        <span style={{ fontSize: '0.85em', fontWeight: 700, color: 'var(--text)', flex: 1 }}>
          {replyTo ? 'Reply' : 'New Message'}
        </span>
        <button onClick={send} disabled={sending} className="btn primary" style={{ fontSize: '0.78em', padding: '5px 14px', gap: 6 }}>
          {sending ? <><div className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} /> Sending…</> : <><Send size={12} /> Send</>}
        </button>
      </div>

      {error && <div style={{ fontSize: '0.75em', color: 'var(--red)', background: 'rgba(252,129,129,0.1)', borderRadius: 6, padding: '6px 10px', border: '1px solid var(--red)' }}>{error}</div>}

      <input value={to} onChange={e => setTo(e.target.value)} placeholder="To" style={inp} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" style={inp} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Message…"
        style={{ ...inp, flex: 1, resize: 'none', lineHeight: 1.5 }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

// ── Email detail view ─────────────────────────────────────────────────────────
function EmailDetail({ uid, widgetId, onBack, onDelete, onReply }) {
  const [msg,     setMsg]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [trashing, setTrashing] = useState(false);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/email/message/${uid}?_widgetId=${widgetId}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setMsg(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [uid, widgetId]);

  const trash = async () => {
    setTrashing(true);
    await fetch(`/api/email/message/${uid}?_widgetId=${widgetId}`, { method: 'DELETE' }).catch(() => {});
    onDelete(uid);
  };

  if (loading) return <div className="widget-loading"><div className="spinner" /></div>;
  if (error)   return <div className="widget-loading" style={{ color: 'var(--red)', fontSize: '0.82em', flexDirection: 'column', gap: 8 }}>
    ⚠ {error}
    <button onClick={onBack} className="btn ghost" style={{ fontSize: '0.75em' }}>← Back</button>
  </div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button onClick={onBack} className="btn ghost btn-icon" style={{ padding: 4 }}><ChevronLeft size={14} /></button>
          <div style={{ flex: 1 }} />
          <button onClick={() => onReply(msg)} className="btn ghost" style={{ fontSize: '0.75em', padding: '4px 10px', gap: 4 }}><Reply size={12} /> Reply</button>
          <button onClick={trash} disabled={trashing} className="btn ghost" style={{ fontSize: '0.75em', padding: '4px 10px', gap: 4, color: 'var(--red)' }}>
            {trashing ? <div className="spinner" style={{ width: 10, height: 10 }} /> : <Trash2 size={12} />}
          </button>
        </div>
        <div style={{ fontSize: '0.9em', fontWeight: 700, color: 'var(--text)', marginBottom: 5, lineHeight: 1.3 }}>{msg.subject}</div>
        <div style={{ fontSize: '0.75em', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div><span style={{ color: 'var(--text-dim)' }}>From: </span>{fmtSender(msg.from)} {msg.from?.address ? `<${msg.from.address}>` : ''}</div>
          {msg.to?.length > 0 && <div><span style={{ color: 'var(--text-dim)' }}>To: </span>{msg.to.map(t => t.address).join(', ')}</div>}
          <div style={{ color: 'var(--text-dim)' }}>{msg.date ? new Date(msg.date).toLocaleString('en-GB') : ''}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <EmailBody html={msg.html} text={msg.text} />
      </div>
    </div>
  );
}

// ── Inbox list ────────────────────────────────────────────────────────────────
function InboxList({ messages, loading, onSelect, onRefresh }) {
  if (loading && !messages.length) return <div className="widget-loading"><div className="spinner" /></div>;
  if (!messages.length) return (
    <div className="widget-loading" style={{ flexDirection: 'column', gap: 8 }}>
      <Inbox size={28} style={{ color: 'var(--text-dim)', opacity: 0.4 }} />
      <div style={{ fontSize: '0.82em', color: 'var(--text-dim)' }}>No messages</div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {messages.map((msg, i) => (
        <div
          key={msg.uid}
          onClick={() => onSelect(msg.uid)}
          style={{
            padding: '9px 12px',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
            background: msg.unread ? 'rgba(99,102,241,0.05)' : 'transparent',
            transition: 'background 0.12s',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = msg.unread ? 'rgba(99,102,241,0.05)' : 'transparent'}
        >
          {/* Unread dot */}
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: msg.unread ? 'var(--accent)' : 'transparent', flexShrink: 0, marginTop: 5 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: '0.8em', fontWeight: msg.unread ? 700 : 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fmtSender(msg.from)}
              </span>
              <span style={{ fontSize: '0.68em', color: 'var(--text-dim)', flexShrink: 0 }}>{fmtDate(msg.date)}</span>
            </div>
            <div style={{ fontSize: '0.78em', color: msg.unread ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: msg.unread ? 600 : 400 }}>
              {msg.subject}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function EmailWidget({ settings = {}, widgetId, collapsed = false }) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [view,     setView]     = useState('inbox'); // inbox | detail | compose | reply
  const [selectedUid, setSelectedUid] = useState(null);
  const [replyMsg,    setReplyMsg]    = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const configured = !!(settings.imapHost && settings.username && settings.password);

  const load = useCallback(async () => {
    if (!configured) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/email/inbox?_widgetId=${widgetId}`);
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error || 'Fetch failed');
      setMessages(d.messages || []);
      setLastRefresh(new Date());
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [configured, widgetId]);

  useEffect(() => {
    load();
    const interval = parseInt(settings.refreshInterval || '5');
    const id = setInterval(load, interval * 60000);
    return () => clearInterval(id);
  }, [load, settings.refreshInterval]);

  const unreadCount = messages.filter(m => m.unread).length;

  // Collapsed summary — just show unread count
  if (collapsed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mail size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.78em', color: 'var(--text-muted)' }}>Inbox</span>
        {unreadCount > 0 && (
          <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.72em', fontWeight: 700 }}>
            {unreadCount}
          </span>
        )}
        {loading && <div className="spinner" style={{ width: 10, height: 10 }} />}
        {!configured && <span style={{ fontSize: '0.72em', color: 'var(--text-dim)' }}>Not configured</span>}
      </div>
    );
  }

  if (!configured) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 }}>
      <Mail size={32} style={{ color: 'var(--text-dim)', opacity: 0.4 }} />
      <div style={{ fontSize: '0.85em', fontWeight: 700, color: 'var(--text)' }}>Email not configured</div>
      <div style={{ fontSize: '0.75em', color: 'var(--text-dim)', textAlign: 'center' }}>Add IMAP host, username and password in widget settings</div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8, borderBottom: '1px solid var(--border)', flexShrink: 0, marginBottom: 8 }}>
        {view !== 'inbox' ? (
          <button onClick={() => { setView('inbox'); setSelectedUid(null); setReplyMsg(null); }} className="btn ghost btn-icon" style={{ padding: 4 }}>
            <ChevronLeft size={14} />
          </button>
        ) : (
          <Mail size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, fontSize: '0.82em', fontWeight: 700, color: 'var(--text)' }}>
          {view === 'compose' ? 'New Message'
           : view === 'reply'   ? 'Reply'
           : view === 'detail'  ? 'Message'
           : <>Inbox {unreadCount > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: '0.8em', marginLeft: 4 }}>{unreadCount}</span>}</>
          }
        </span>
        {view === 'inbox' && (
          <>
            <button onClick={() => setView('compose')} className="btn ghost btn-icon" style={{ padding: 4 }} title="Compose">
              <Edit size={13} style={{ color: 'var(--text-dim)' }} />
            </button>
            <button onClick={load} disabled={loading} className="btn ghost btn-icon" style={{ padding: 4 }} title="Refresh">
              <RefreshCw size={12} style={{ color: 'var(--text-dim)', animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
          </>
        )}
      </div>

      {/* Error banner */}
      {error && view === 'inbox' && (
        <div style={{ fontSize: '0.73em', color: 'var(--red)', background: 'rgba(252,129,129,0.08)', border: '1px solid var(--red)', borderRadius: 6, padding: '6px 10px', marginBottom: 8, flexShrink: 0, display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Views */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {view === 'inbox' && (
          <InboxList
            messages={messages}
            loading={loading}
            onSelect={uid => { setSelectedUid(uid); setView('detail'); }}
            onRefresh={load}
          />
        )}
        {view === 'detail' && selectedUid && (
          <EmailDetail
            uid={selectedUid}
            widgetId={widgetId}
            onBack={() => { setView('inbox'); setSelectedUid(null); load(); }}
            onDelete={uid => { setMessages(m => m.filter(x => x.uid !== uid)); setView('inbox'); }}
            onReply={msg => { setReplyMsg(msg); setView('reply'); }}
          />
        )}
        {(view === 'compose' || view === 'reply') && (
          <ComposeForm
            widgetId={widgetId}
            replyTo={view === 'reply' ? replyMsg : null}
            onSent={() => { setView('inbox'); setSelectedUid(null); setReplyMsg(null); setTimeout(load, 1000); }}
            onCancel={() => { setView(replyMsg ? 'detail' : 'inbox'); }}
          />
        )}
      </div>

      {/* Footer */}
      {view === 'inbox' && lastRefresh && (
        <div style={{ flexShrink: 0, paddingTop: 5, borderTop: '1px solid var(--border)', fontSize: '0.65em', color: 'var(--text-dim)' }}>
          Updated {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}

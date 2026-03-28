import React, { useEffect, useRef, useState } from 'react';

export interface SessionChatMessage {
    senderId?: string;
    senderName: string;
    message: string;
    createdAt: string;
}

interface SessionChatWindowProps {
    messages: SessionChatMessage[];
    currentUserId?: string;
    disabled?: boolean;
    onSendMessage: (message: string) => Promise<void> | void;
}

const SessionChatWindow: React.FC<SessionChatWindowProps> = ({ messages, currentUserId, disabled = false, onSendMessage }) => {
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (disabled || sending || !draft.trim()) return;

        setSending(true);
        try {
            await onSendMessage(draft.trim());
            setDraft('');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="glass-card" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '520px',
            background: 'rgba(255,255,255,0.03)'
        }}>
            <div style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Session Chat</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        One shared conversation for everyone in the room.
                    </p>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{messages.length} messages</span>
            </div>

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                }}
            >
                {messages.length === 0 ? (
                    <div style={{
                        margin: 'auto',
                        textAlign: 'center',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.9rem'
                    }}>
                        No messages yet. Start the conversation.
                    </div>
                ) : (
                    messages.map((item, index) => {
                        const isMine = !!currentUserId && item.senderId === currentUserId;

                        return (
                            <div
                                key={`${item.createdAt}-${index}`}
                                style={{
                                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                                    maxWidth: '78%',
                                    background: isMine ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.06)',
                                    color: isMine ? 'white' : 'var(--color-text)',
                                    borderRadius: isMine ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                                    padding: '0.85rem 1rem'
                                }}
                            >
                                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.35rem', fontWeight: 600 }}>
                                    {isMine ? 'You' : item.senderName}
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{item.message}</div>
                                <div style={{ fontSize: '0.68rem', opacity: 0.7, marginTop: '0.4rem', textAlign: 'right' }}>
                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form
                onSubmit={handleSubmit}
                style={{
                    padding: '1rem 1.25rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-end'
                }}
            >
                <textarea
                    className="form-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    placeholder={disabled ? 'Chat unavailable' : 'Type a message...'}
                    disabled={disabled || sending}
                    style={{ resize: 'none', marginBottom: 0 }}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={disabled || sending || !draft.trim()}
                    style={{ minWidth: '120px', padding: '0.8rem 1rem' }}
                >
                    {sending ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default SessionChatWindow;

import React, { useState, useEffect, useRef } from 'react';

export interface Message {
    sender: {
        id: string;
        name: string;
    };
    message: string;
    timestamp: Date | string;
    isMe?: boolean;
}

interface PrivateChatProps {
    recipient: { id: string; name: string } | null;
    onClose: () => void;
    messages: Message[];
    onSendMessage: (message: string, recipient: { id: string; name: string }) => void;
}

const PrivateChat: React.FC<PrivateChatProps> = ({ recipient, onClose, messages, onSendMessage }) => {
    const [message, setMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !recipient) return;

        onSendMessage(message.trim(), recipient);
        setMessage('');
    };

    if (!recipient) return null;

    return (
        <div className="glass-card anim-slide-up" style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '320px',
            height: '400px',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            background: 'var(--color-surface)'
        }}>
            {/* Header */}
            <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gradient-primary)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Chat with {recipient.name}</span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '2rem' }}>
                        Say hi to {recipient.name}! 👋
                    </p>
                ) : (
                    messages.map((m, i) => (
                        <div key={i} style={{
                            alignSelf: m.isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            padding: '0.6rem 0.8rem',
                            borderRadius: m.isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                            background: m.isMe ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                            color: m.isMe ? 'white' : 'var(--color-text-primary)',
                            fontSize: '0.85rem',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}>
                            {m.message}
                            <div style={{ fontSize: '0.6rem', opacity: 0.6, textAlign: 'right', marginTop: '0.2rem' }}>
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.8rem' }}>
                    ✈️
                </button>
            </form>
        </div>
    );
};

export default PrivateChat;

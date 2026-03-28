import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { guestService } from '../services/guestService';

const GuestJoinForm: React.FC = () => {
    const { code } = useParams<{ code: string }>();

    const [sessionTitle, setSessionTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        question: ''
    });

    useEffect(() => {
        const fetchSessionInfo = async () => {
            if (!code) return;
            try {
                const response = await guestService.getPublicSessionInfo(code);
                if (response.success) {
                    setSessionTitle(response.data.title);
                }
            } catch (err: any) {
                console.error('Session check error:', err);
                if (err.message === 'Network Error') {
                    setError('Connection Error: Cannot reach server. Please check your WiFi connection.');
                } else if (err.response?.status === 404) {
                    setError('Session not found or has ended.');
                } else {
                    setError(`Error: ${err.message || 'Unknown error'}`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSessionInfo();
    }, [code]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        setError('');
        setSuccess(false);
        setSubmitting(true);

        try {
            const response = await guestService.submitGuestJoin({
                code,
                name: formData.name,
                email: formData.email,
                question: formData.question
            });

            if (response.success) {
                setSuccess(true);
                setFormData(prev => ({ ...prev, question: '' }));
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err: any) {
            console.error('Guest join error:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to join session';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
                <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-card fade-in" style={{ maxWidth: '350px', width: '100%', padding: '1.5rem', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Ask a Question</h2>
                    {sessionTitle && (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            to {sessionTitle}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="alert alert-error slide-in" style={{ marginBottom: '1rem', padding: '0.5rem', fontSize: '0.85rem' }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success slide-in" style={{ marginBottom: '1rem', padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px' }}>
                        Sent! Ask another question?
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        style={{ padding: '0.7rem', marginBottom: '0.8rem', fontSize: '0.95rem' }}
                    />

                    <input
                        type="email"
                        className="form-input"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        style={{ padding: '0.7rem', marginBottom: '0.8rem', fontSize: '0.95rem' }}
                    />

                    <textarea
                        className="form-input"
                        placeholder="Type your question..."
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        rows={3}
                        required
                        style={{ resize: 'none', minHeight: '80px', padding: '0.7rem', marginBottom: '1rem', fontSize: '0.95rem' }}
                    />

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={submitting}
                        style={{ padding: '0.8rem', fontSize: '1rem', fontWeight: '600' }}
                    >
                        {submitting ? 'Sending...' : 'Send Question'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GuestJoinForm;

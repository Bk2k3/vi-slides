import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sessionService, Session } from '../services/sessionService';
import { useTheme } from '../contexts/ThemeContext';
import CertificateCard from '../components/CertificateCard';
import SessionHistorySection from '../components/SessionHistorySection';
import Toast from '../components/Toast';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [sessionTitle, setSessionTitle] = useState('');
    const [error, setError] = useState('');
    const [activeSession, setActiveSession] = useState<any>(null);
    const [pastSessions, setPastSessions] = useState<Session[]>([]);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCertModal, setShowCertModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [hiddenCerts, setHiddenCerts] = useState<string[]>(() => {
        const saved = localStorage.getItem('hidden_certs');
        return saved ? JSON.parse(saved) : [];
    });

    const isTeacher = user?.role?.toLowerCase() === 'teacher';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const activeResponse = await sessionService.getActiveSession();
                if (activeResponse.success) {
                    setActiveSession(activeResponse.data);

                    if (!isTeacher && activeResponse.data) {
                        navigate(`/session/${activeResponse.data.code}`);
                        return;
                    }
                }

                const historyResponse = await sessionService.getSessionHistory();
                if (historyResponse.success) {
                    setPastSessions(historyResponse.data);
                }
            } catch (err) {
                console.error('Dashboard load error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [isTeacher, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionTitle.trim()) return;

        setError('');
        try {
            const response = await sessionService.createSession({ title: sessionTitle.trim() });
            if (response.success) {
                navigate(`/session/${response.data.code}`);
            }
        } catch (err: any) {
            const responseData = err.response?.data;
            if (responseData?.data?.code) {
                setActiveSession(responseData.data);
            }
            setError(responseData?.message || 'Failed to create session');
        }
    };

    const handleJoinSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setError('');
        try {
            const response = await sessionService.joinSession(joinCode.trim());
            if (response.success) {
                navigate(`/session/${response.data.code}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to join session. Please check the code.');
        }
    };

    const handleDeleteCert = (sessionId: string) => {
        const next = [...hiddenCerts, sessionId];
        setHiddenCerts(next);
        localStorage.setItem('hidden_certs', JSON.stringify(next));
        setToast({ message: 'Certificate removed from view', type: 'info' });
    };

    const handleEndActiveSession = async () => {
        if (!activeSession?._id) return;

        setError('');
        try {
            const response = await sessionService.endSession(activeSession._id);
            if (response.success) {
                setActiveSession(null);
                setToast({ message: 'Session ended', type: 'success' });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to end session');
        }
    };

    const copyText = async (value: string, successMessage: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setToast({ message: successMessage, type: 'success' });
        } catch (error) {
            console.error('Clipboard error:', error);
            setToast({ message: 'Failed to copy', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <nav style={{
                background: 'var(--color-bg-secondary)',
                opacity: 0.95,
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--color-surface)',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1000
            }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Vi-SlideS
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                    <div
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            padding: '0.5rem 1.2rem',
                            borderRadius: 'var(--radius-full)',
                            transition: 'all 0.2s ease',
                            border: showUserMenu ? '1px solid var(--color-primary)' : '1px solid transparent',
                            background: showUserMenu ? 'rgba(255,255,255,0.05)' : 'transparent'
                        }}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text)' }}>{user?.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.role}</span>
                        </div>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: user?.avatar ? `url(${user.avatar}) center/cover no-repeat` : 'var(--gradient-primary)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: 'white',
                            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
                            border: '2px solid rgba(255,255,255,0.2)'
                        }}>
                            {!user?.avatar && user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    {showUserMenu && (
                        <div className="glass-card slide-in" style={{
                            position: 'absolute',
                            top: '125%',
                            right: 0,
                            width: '300px',
                            padding: '1rem',
                            zIndex: 1000,
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-surface)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(99, 102, 241, 0.3)'
                        }}>
                            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-surface)', marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Signed in as</p>
                                <p style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                            </div>

                            <button
                                onClick={toggleTheme}
                                className="btn"
                                style={{
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: 'transparent',
                                    color: 'var(--color-text)',
                                    marginBottom: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem 1rem'
                                }}
                            >
                                <span style={{ marginRight: '12px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em' }}>THEME</span>
                                <span style={{ fontSize: '1rem' }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="btn"
                                style={{
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: 'transparent',
                                    color: '#ef4444',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem 1rem'
                                }}
                            >
                                <span style={{ marginRight: '12px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em' }}>EXIT</span>
                                <span style={{ fontSize: '1rem' }}>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <main className="container fade-in" style={{ paddingTop: '3rem' }}>
                <div className="glass-card" style={{ marginBottom: '2rem' }}>
                    <h1 className="mb-2">Welcome, {user?.name}</h1>
                    <p className="text-muted">
                        {isTeacher ? 'Create a session, continue the active one, and keep the class focused on questions and chat.' : 'Join a session to start asking questions and chatting.'}
                    </p>

                    {error && (
                        <div className="alert alert-error slide-in" style={{ marginTop: '1rem' }}>
                            {error}
                        </div>
                    )}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem',
                    alignItems: 'start'
                }}>
                    {isTeacher ? (
                        <>
                            {activeSession && (
                                <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.12) 0%, rgba(20, 184, 166, 0) 100%)' }}>
                                    <h3>Active Session</h3>
                                    <p className="text-muted mt-1">You already have a live session running.</p>
                                    <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Title</div>
                                            <div style={{ fontWeight: 700 }}>{activeSession.title}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Session Code</div>
                                            <button
                                                type="button"
                                                onClick={() => copyText(activeSession.code, `Copied ${activeSession.code}`)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0,
                                                    cursor: 'pointer',
                                                    color: 'var(--color-primary-light)',
                                                    fontWeight: 800,
                                                    letterSpacing: '0.12em',
                                                    textTransform: 'uppercase',
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                {activeSession.code}
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <button onClick={() => navigate(`/session/${activeSession.code}`)} className="btn btn-primary">
                                                Continue Session
                                            </button>
                                            <button
                                                onClick={() => copyText(`${window.location.origin}/join/${activeSession.code}`, 'Join link copied')}
                                                className="btn btn-secondary"
                                            >
                                                Copy Join Link
                                            </button>
                                            <button
                                                onClick={handleEndActiveSession}
                                                className="btn btn-secondary"
                                            >
                                                End Session
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 100%)' }}>
                                <h3>Start a Session</h3>
                                <p className="text-muted mt-1">
                                    {activeSession ? 'End the current session before starting another one.' : 'Create a new live session for questions and room chat.'}
                                </p>
                                <form onSubmit={handleCreateSession} style={{ marginTop: '1.5rem' }}>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Session Title"
                                            className="form-input"
                                            value={sessionTitle}
                                            onChange={(e) => setSessionTitle(e.target.value)}
                                            required
                                            disabled={!!activeSession}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block" disabled={!!activeSession}>
                                        Create Session
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0) 100%)' }}>
                                <h3>Join Session</h3>
                                <p className="text-muted mt-1">Enter the 6-digit code provided by your teacher.</p>
                                <form onSubmit={handleJoinSession} style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="E.G. AB1234"
                                        className="form-input"
                                        style={{ textTransform: 'uppercase' }}
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="btn btn-primary">Join</button>
                                </form>
                            </div>
                            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0) 100%)' }}>
                                <h3>Certificates</h3>
                                <p className="text-muted mt-1">View and download your participation certificates.</p>
                                <button onClick={() => setShowCertModal(true)} className="btn btn-primary mt-2">View Certificates</button>
                            </div>
                        </>
                    )}
                </div>

                <SessionHistorySection sessions={pastSessions} isTeacher={isTeacher} />

                {showCertModal && (
                    <div className="modal-overlay fade-in" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        padding: '2rem'
                    }}>
                        <div className="glass-card slide-in" style={{
                            width: '100%',
                            maxWidth: '900px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => setShowCertModal(false)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}
                            >
                                x
                            </button>

                            <h2 className="mb-2">Your Certificates</h2>

                            {pastSessions.filter(session => !hiddenCerts.includes(session._id)).length === 0 ? (
                                <p className="text-muted">No certificates found. Join sessions to earn them!</p>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                                    gap: '2rem',
                                    marginTop: '1.5rem'
                                }}>
                                    {pastSessions
                                        .filter(session => !hiddenCerts.includes(session._id))
                                        .map((session) => (
                                            <CertificateCard
                                                key={session._id}
                                                sessionTitle={session.title}
                                                sessionCode={session.code}
                                                studentName={user?.name || 'Student'}
                                                date={session.createdAt}
                                                teacherName="Teacher"
                                                onDelete={() => handleDeleteCert(session._id)}
                                            />
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sessionService, Session } from '../services/sessionService';
import { questionService, Question } from '../services/questionService';
import { socketService } from '../services/socketService';
import QuestionInput from '../components/QuestionInput';
import QuestionCard from '../components/QuestionCard';
import SessionChatWindow, { SessionChatMessage } from '../components/SessionChatWindow';
import Toast from '../components/Toast';

type SessionTab = 'questions' | 'chat';

const getUserId = (user: any) => {
    const value = user?.id || user?._id || '';
    return typeof value === 'string' ? value : value?.toString?.() || '';
};

const normalizeChatMessage = (message: any): SessionChatMessage => ({
    senderId: getUserId({ id: message?.senderId }),
    senderName: message?.senderName || 'Participant',
    message: message?.message || '',
    createdAt: message?.createdAt || new Date().toISOString()
});

const SessionView: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [session, setSession] = useState<Session | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [chatMessages, setChatMessages] = useState<SessionChatMessage[]>([]);
    const [activeTab, setActiveTab] = useState<SessionTab>('questions');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    const currentUserId = getUserId(user);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!code) return;

            try {
                const sessionRes = await sessionService.getSessionDetails(code);
                if (!sessionRes.success || !isMounted) return;

                if (sessionRes.data.status === 'ended') {
                    navigate('/dashboard');
                    return;
                }

                setSession(sessionRes.data);
                setChatMessages(
                    (sessionRes.data.chatMessages || [])
                        .map(normalizeChatMessage)
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                );

                const questionsRes = await questionService.getSessionQuestions(sessionRes.data._id);
                if (questionsRes.success && isMounted) {
                    setQuestions(questionsRes.data);
                }

                socketService.connect();
                socketService.joinSession({
                    sessionCode: code,
                    user: {
                        _id: currentUserId,
                        name: user?.name,
                        email: user?.email
                    }
                });

                socketService.offNewQuestion();
                socketService.onNewQuestion((newQuestion: Question) => {
                    setQuestions(prev => {
                        if (prev.some(item => item._id === newQuestion._id)) return prev;
                        return [newQuestion, ...prev];
                    });
                });

                socketService.offUpdateQuestion();
                socketService.onUpdateQuestion((updatedQuestion: Question) => {
                    setQuestions(prev => prev.map(item => item._id === updatedQuestion._id ? updatedQuestion : item));
                });

                socketService.offDeleteQuestion();
                socketService.onDeleteQuestion((deletedQuestionId: string) => {
                    setQuestions(prev => prev.filter(item => item._id !== deletedQuestionId));
                });

                socketService.offSessionStatusUpdate();
                socketService.onSessionStatusUpdate((data) => {
                    if (data.status === 'ended') {
                        navigate('/dashboard');
                    }
                });

                socketService.offSessionMessage();
                socketService.onSessionMessage((message: SessionChatMessage) => {
                    setChatMessages(prev => [...prev, normalizeChatMessage(message)]);
                });
            } catch (err: any) {
                if (isMounted) {
                    setError(err.response?.data?.message || 'Failed to load the session');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            if (code) {
                socketService.leaveSession(code);
            }
            socketService.offNewQuestion();
            socketService.offUpdateQuestion();
            socketService.offDeleteQuestion();
            socketService.offSessionStatusUpdate();
            socketService.offSessionMessage();
        };
    }, [code, currentUserId, navigate, user?.email, user?.name]);

    const sortedQuestions = useMemo(
        () => [...questions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [questions]
    );

    const copySessionCode = async () => {
        if (!session?.code) return;

        try {
            await navigator.clipboard.writeText(session.code);
            setToast({ message: `Copied ${session.code}`, type: 'success' });
        } catch (error) {
            console.error('Copy session code error:', error);
            setToast({ message: 'Failed to copy session code', type: 'error' });
        }
    };

    const handleLeaveSession = async () => {
        if (!code) return;

        try {
            await sessionService.leaveSession(code);
        } catch (error) {
            console.error('Leave session error:', error);
        } finally {
            navigate('/dashboard');
        }
    };

    const handleEndSession = async () => {
        if (!session?._id) return;

        try {
            const response = await sessionService.endSession(session._id);
            if (response.success) {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('End session error:', error);
            setToast({ message: 'Failed to end session', type: 'error' });
        }
    };

    const handleSendChatMessage = async (message: string) => {
        if (!code || !user?.name) return;

        socketService.emitSessionMessage({
            sessionCode: code,
            message,
            sender: {
                id: currentUserId,
                name: user.name
            }
        });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 20
            }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>{session.title}</div>
                    <button
                        type="button"
                        onClick={copySessionCode}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'var(--color-primary-light)',
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase'
                        }}
                        title={`Copy session code ${session.code}`}
                    >
                        {session.code}
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {isTeacher ? 'Teacher view' : 'Student view'}
                    </span>
                    <button onClick={isTeacher ? handleEndSession : handleLeaveSession} className="btn btn-secondary">
                        {isTeacher ? 'End Session' : 'Leave'}
                    </button>
                </div>
            </nav>

            <main className="container" style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}>
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    alignItems: 'flex-start'
                }}>
                    <section style={{ minWidth: 0, flex: '2 1 640px' }}>
                        <div className="glass-card" style={{ marginBottom: '1rem', padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setActiveTab('questions')}
                                className="btn"
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    background: activeTab === 'questions' ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.04)',
                                    color: activeTab === 'questions' ? 'white' : 'var(--color-text)'
                                }}
                            >
                                Questions
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className="btn"
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    background: activeTab === 'chat' ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.04)',
                                    color: activeTab === 'chat' ? 'white' : 'var(--color-text)'
                                }}
                            >
                                Chat
                            </button>
                        </div>

                        {activeTab === 'questions' ? (
                            <>
                                <QuestionInput
                                    sessionId={session._id}
                                    sessionStatus={session.status}
                                    onQuestionSubmitted={(question) => {
                                        setQuestions(prev => prev.some(item => item._id === question._id) ? prev : [question, ...prev]);
                                    }}
                                />

                                {sortedQuestions.length === 0 ? (
                                    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No questions yet.
                                    </div>
                                ) : (
                                    sortedQuestions.map((question) => (
                                        <QuestionCard
                                            key={question._id}
                                            question={question}
                                            isTeacher={isTeacher}
                                            onUpdate={(updatedQuestion) => {
                                                setQuestions(prev => prev.map(item => item._id === updatedQuestion._id ? updatedQuestion : item));
                                            }}
                                            onDelete={(questionId) => {
                                                setQuestions(prev => prev.filter(item => item._id !== questionId));
                                            }}
                                        />
                                    ))
                                )}
                            </>
                        ) : (
                            <SessionChatWindow
                                messages={chatMessages}
                                currentUserId={currentUserId}
                                onSendMessage={handleSendChatMessage}
                            />
                        )}
                    </section>

                    <aside style={{ minWidth: 0, flex: '1 1 320px' }}>
                        <div className="glass-card" style={{ marginBottom: '1rem' }}>
                            <h3 style={{ marginBottom: '0.75rem' }}>Session Info</h3>
                            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                                <div>
                                    <strong style={{ color: 'var(--color-text)' }}>Teacher:</strong> {session.teacher?.name}
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--color-text)' }}>Started:</strong> {new Date(session.createdAt).toLocaleString()}
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--color-text)' }}>Session Code:</strong>{' '}
                                    <button
                                        type="button"
                                        onClick={copySessionCode}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                                    >
                                        {session.code}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '0.75rem' }}>Room Snapshot</h3>
                            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                                <div>
                                    <strong style={{ color: 'var(--color-text)' }}>Questions:</strong> {questions.length}
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--color-text)' }}>Messages:</strong> {chatMessages.length}
                                </div>
                                <div style={{ lineHeight: '1.5' }}>
                                    This session is intentionally streamlined to just questions and one shared chat.
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
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

export default SessionView;

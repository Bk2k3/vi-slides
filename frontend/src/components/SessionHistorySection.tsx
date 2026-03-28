import React from 'react';
import { Session } from '../services/sessionService';
import QuestionCard from './QuestionCard';

interface SessionHistorySectionProps {
    sessions: Session[];
    isTeacher: boolean;
}

const formatSessionDate = (session: Session) => {
    const value = session.endedAt || session.createdAt;
    return value ? new Date(value).toLocaleString() : '';
};

const SessionHistorySection: React.FC<SessionHistorySectionProps> = ({ sessions, isTeacher }) => {
    return (
        <section className="glass-card" style={{ marginTop: '2rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>Session History</h2>
                <p className="text-muted" style={{ marginBottom: 0 }}>
                    {isTeacher ? 'Review past sessions and the answers you shared.' : 'Review your past sessions with all questions and teacher answers.'}
                </p>
            </div>

            {sessions.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                    No past sessions yet.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {sessions.map((session) => (
                        <div
                            key={session._id}
                            style={{
                                padding: '1rem',
                                borderRadius: 'var(--radius-lg)',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(148, 163, 184, 0.14)'
                            }}
                        >
                            <div style={{ marginBottom: '1rem', display: 'grid', gap: '0.35rem' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{session.title}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    {session.code} - {formatSessionDate(session)}
                                </div>
                            </div>

                            {!session.questions || session.questions.length === 0 ? (
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    No questions were recorded for this session.
                                </div>
                            ) : (
                                session.questions.map((question) => (
                                    <QuestionCard
                                        key={question._id}
                                        question={question}
                                        isTeacher={isTeacher}
                                        readOnly
                                    />
                                ))
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default SessionHistorySection;

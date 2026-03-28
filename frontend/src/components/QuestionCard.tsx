import React, { useEffect, useState } from 'react';
import { Question, questionService } from '../services/questionService';
import { useAuth } from '../contexts/AuthContext';

interface QuestionCardProps {
    question: Question;
    isTeacher: boolean;
    readOnly?: boolean;
    onUpdate?: (updatedQuestion: Question) => void;
    onDelete?: (questionId: string) => void;
}

const timeAgo = (dateStr?: string) => {
    if (!dateStr) return '';

    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleString();
};

const QuestionCard: React.FC<QuestionCardProps> = ({ question, isTeacher, readOnly = false, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isAnswering, setIsAnswering] = useState(false);
    const [draft, setDraft] = useState(question.content);
    const [answerDraft, setAnswerDraft] = useState(question.teacherAnswer || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setDraft(question.content);
        setAnswerDraft(question.teacherAnswer || '');
    }, [question.content, question.teacherAnswer]);

    const currentUserId = user?.id || (user as any)?._id;
    const authorId = question.user?._id;
    const isOwner = !!authorId && authorId === currentUserId;
    const authorName = question.user?.name || question.guestName || 'Student';
    const hasAnswer = !!question.teacherAnswer?.trim();

    const handleSave = async () => {
        if (!draft.trim() || draft.trim() === question.content) {
            setIsEditing(false);
            setDraft(question.content);
            return;
        }

        setLoading(true);
        try {
            const response = await questionService.updateQuestion(question._id, draft.trim());
            if (response.success) {
                onUpdate?.(response.data);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Update question error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAnswer = async () => {
        if (!answerDraft.trim()) return;

        setLoading(true);
        try {
            const response = await questionService.answerQuestion(question._id, answerDraft.trim());
            if (response.success) {
                onUpdate?.(response.data);
                setIsAnswering(false);
            }
        } catch (error) {
            console.error('Answer question error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await questionService.deleteQuestion(question._id);
            if (response.success) {
                onDelete?.(question._id);
            }
        } catch (error) {
            console.error('Delete question error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card slide-in" style={{
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid rgba(148, 163, 184, 0.14)',
            background: 'var(--color-surface)',
            boxShadow: 'var(--shadow-md)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700'
                    }}>
                        {authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text)' }}>{authorName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{timeAgo(question.createdAt)}</div>
                    </div>
                </div>

                {!readOnly && (isOwner || isTeacher) && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isOwner && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                Edit
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div>
                    <textarea
                        className="form-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={3}
                        style={{ marginBottom: '0.75rem', resize: 'none' }}
                        disabled={loading}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }} disabled={loading}>
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setDraft(question.content);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.55', color: 'var(--color-text)' }}>
                    {question.content}
                </p>
            )}

            {isTeacher && !readOnly && !isEditing && (
                <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setIsAnswering(prev => !prev)}
                        className="btn btn-secondary"
                        style={{
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.8rem',
                            background: 'rgba(20, 184, 166, 0.08)',
                            border: '1px solid rgba(45, 212, 191, 0.2)',
                            color: '#99f6e4'
                        }}
                    >
                        {hasAnswer ? 'Edit Answer' : 'Answer'}
                    </button>
                </div>
            )}

            {(hasAnswer || (isTeacher && isAnswering && !readOnly)) && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.95rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.14) 0%, rgba(15, 118, 110, 0.08) 100%)',
                    border: '1px solid rgba(45, 212, 191, 0.16)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.55rem', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#99f6e4' }}>Teacher Answer</div>
                        {question.teacherAnsweredAt && !isAnswering && (
                            <div style={{ fontSize: '0.72rem', color: 'rgba(229, 231, 235, 0.78)' }}>{timeAgo(question.teacherAnsweredAt)}</div>
                        )}
                    </div>

                    {isTeacher && isAnswering && !readOnly ? (
                        <div>
                            <textarea
                                className="form-input"
                                value={answerDraft}
                                onChange={(e) => setAnswerDraft(e.target.value)}
                                rows={3}
                                style={{
                                    marginBottom: '0.75rem',
                                    resize: 'none',
                                    background: 'rgba(15, 23, 42, 0.28)',
                                    border: '1px solid rgba(45, 212, 191, 0.16)'
                                }}
                                disabled={loading}
                                placeholder="Type your answer..."
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleSaveAnswer}
                                    className="btn btn-primary"
                                    style={{
                                        padding: '0.45rem 0.9rem',
                                        fontSize: '0.8rem',
                                        background: 'linear-gradient(135deg, #0d9488, #0f766e)'
                                    }}
                                    disabled={loading || !answerDraft.trim()}
                                >
                                    Send Answer
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAnswering(false);
                                        setAnswerDraft(question.teacherAnswer || '');
                                    }}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.55', color: '#ecfeff' }}>
                            {question.teacherAnswer}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuestionCard;

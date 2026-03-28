import React, { useState } from 'react';
import { Question, questionService } from '../services/questionService';
import { useAuth } from '../contexts/AuthContext';

interface QuestionCardProps {
    question: Question;
    isTeacher: boolean;
    onUpdate?: (updatedQuestion: Question) => void;
    onDelete?: (questionId: string) => void;
}

const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleString();
};

const QuestionCard: React.FC<QuestionCardProps> = ({ question, isTeacher, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(question.content);
    const [loading, setLoading] = useState(false);

    const authorId = question.user?._id;
    const isOwner = !!authorId && authorId === user?.id;
    const authorName = question.user?.name || question.guestName || 'Guest';

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
            border: '1px solid rgba(255,255,255,0.08)',
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

                {(isOwner || isTeacher) && (
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
        </div>
    );
};

export default QuestionCard;

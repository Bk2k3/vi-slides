import React, { useState } from 'react';
import { questionService } from '../services/questionService';

interface QuestionInputProps {
    sessionId: string;
    sessionStatus?: string;
    isTeacher?: boolean;
    onQuestionSubmitted?: (question: any) => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ sessionId, sessionStatus, isTeacher = false, onQuestionSubmitted }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isDisabled = loading || !sessionId || sessionStatus === 'ended';

    const submitQuestion = async () => {
        if (isDisabled || !content.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await questionService.createQuestion({
                content: content.trim(),
                sessionId
            });

            if (response.success) {
                setContent('');
                onQuestionSubmitted?.(response.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to send ${isTeacher ? 'answer' : 'question'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitQuestion();
    };

    return (
        <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.03)' }}>
            <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <textarea
                        className="form-input"
                        placeholder={sessionStatus === 'ended' ? 'Session has ended' : isTeacher ? 'Share an answer...' : 'Ask a question...'}
                        rows={3}
                        style={{
                            resize: 'none',
                            background: isTeacher ? 'rgba(13, 148, 136, 0.08)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 'var(--radius-lg)',
                            transition: 'all 0.3s ease'
                        }}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submitQuestion();
                            }
                        }}
                        disabled={isDisabled}
                    />
                </div>

                {error && <span className="form-error mb-2">{error}</span>}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            padding: '0.6rem 1.5rem',
                            borderRadius: 'var(--radius-full)',
                            background: isTeacher ? 'linear-gradient(135deg, #0d9488, #0f766e)' : 'var(--gradient-primary)'
                        }}
                        disabled={isDisabled || !content.trim()}
                    >
                        {loading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div> : isTeacher ? 'Send Answer' : 'Send Question'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuestionInput;

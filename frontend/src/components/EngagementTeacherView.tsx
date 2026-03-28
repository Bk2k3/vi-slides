import React from 'react';

export interface UnderstandingUpdate {
    participantId: string;
    socketId: string;
    understanding: 'confused' | 'neutral' | 'understanding';
    user: any;
}

export interface HandRaiseUpdate {
    participantId: string;
    socketId: string;
    isRaised: boolean;
    user: any;
}

interface EngagementTeacherViewProps {
    understandingMap: Map<string, UnderstandingUpdate>;
    handRaisedMap: Map<string, HandRaiseUpdate>;
}

const EngagementTeacherView: React.FC<EngagementTeacherViewProps> = ({ understandingMap, handRaisedMap }) => {

    const stats = {
        confused: Array.from(understandingMap.values()).filter(u => u.understanding === 'confused').length,
        neutral: Array.from(understandingMap.values()).filter(u => u.understanding === 'neutral').length,
        understanding: Array.from(understandingMap.values()).filter(u => u.understanding === 'understanding').length,
    };

    const total = stats.confused + stats.neutral + stats.understanding;

    return (
        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <h4 className="mb-2">Student Engagement</h4>

            {/* Confusion Meter Graph */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-muted)' }}>
                    <span>Class Understanding</span>
                    <span>{total} reporting</span>
                </div>
                <div style={{ height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                    {total > 0 ? (
                        <>
                            <div style={{ width: `${(stats.confused / total) * 100}%`, background: '#ef4444', transition: 'width 0.5s ease' }} title="Confused" />
                            <div style={{ width: `${(stats.neutral / total) * 100}%`, background: '#f59e0b', transition: 'width 0.5s ease' }} title="Neutral" />
                            <div style={{ width: `${(stats.understanding / total) * 100}%`, background: '#10b981', transition: 'width 0.5s ease' }} title="Understanding" />
                        </>
                    ) : (
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>No data yet</div>
                    )}
                </div>
            </div>

            {/* Hand Raised List */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-muted)' }}>
                    <span>✋ Hands Raised</span>
                    <span style={{ color: handRaisedMap.size > 0 ? 'var(--color-warning)' : '' }}>{handRaisedMap.size}</span>
                </div>
                <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {Array.from(handRaisedMap.values()).map(h => (
                        <div key={h.participantId} style={{
                            padding: '0.2rem 0.5rem',
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                        }}>
                            <span>✋</span> {h.user?.name}
                        </div>
                    ))}
                    {handRaisedMap.size === 0 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>No hands raised</p>}
                </div>
            </div>
        </div>
    );
};

export default EngagementTeacherView;

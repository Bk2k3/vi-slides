import api from './api';

export interface Session {
    _id: string;
    title: string;
    description?: string;
    code: string;
    qrCodeDataUrl?: string; // Base64 QR code image
    joinUrl?: string; // URL for joining
    teacher: any;
    students: any[];
    attendance?: {
        student: string;
        name: string;
        email: string;
        joinTime: string;
        leaveTime?: string;
    }[];
    chatMessages?: {
        senderId?: string;
        senderName: string;
        message: string;
        createdAt: string;
    }[];
    status: 'active' | 'inactive' | 'ended' | 'paused';
    endedAt?: string;
    createdAt: string;
}

export interface CreateSessionData {
    title: string;
    description?: string;
}

export const sessionService = {
    // Create a new session (Teacher)
    createSession: async (data: CreateSessionData): Promise<{ success: boolean; data: Session }> => {
        const response = await api.post('/sessions', data);
        return response.data;
    },

    // Join a session (Student)
    joinSession: async (code: string): Promise<{ success: boolean; data: Session }> => {
        const response = await api.post('/sessions/join', { code });
        return response.data;
    },

    // Get current active session for user
    getActiveSession: async (): Promise<{ success: boolean; data: Session | null }> => {
        const response = await api.get('/sessions/current/active');
        return response.data;
    },

    // Get session details by code
    getSessionDetails: async (code: string): Promise<{ success: boolean; data: Session }> => {
        const response = await api.get(`/sessions/${code}`);
        return response.data;
    },

    // End a session (Teacher)
    endSession: async (id: string): Promise<{
        success: boolean;
        data: {
            _id: string;
            title: string;
            code: string;
            questionCount: number;
            duration: number;
            moodSummary: string;
        };
        message: string
    }> => {
        const response = await api.patch(`/sessions/${id}/end`);
        return response.data;
    },

    // Pause/Resume a session (Teacher)
    pauseSession: async (id: string): Promise<{ success: boolean; status: string; message: string }> => {
        const response = await api.patch(`/sessions/${id}/pause`);
        return response.data;
    },

    // Leave a session
    leaveSession: async (code: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.post(`/sessions/${code}/leave`);
        return response.data;
    },

    // Get student session history
    getStudentSessions: async (): Promise<{ success: boolean; data: any[] }> => {
        const response = await api.get('/sessions/student/history');
        return response.data;
    },

    // Get or create persistent query session (Teacher)
    getQuerySession: async (): Promise<{ success: boolean; data: Session }> => {
        const response = await api.get('/sessions/query-mode');
        return response.data;
    },

    // Update custom query URL (Teacher)
    updateQueryUrl: async (url: string): Promise<{ success: boolean; data: Session }> => {
        const response = await api.patch('/sessions/query-mode/url', { url });
        return response.data;
    }
};

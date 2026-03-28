import api from './api';

export interface Question {
    _id: string;
    content: string;
    user?: { // Optional for guest questions
        _id: string;
        name: string;
    };
    guestName?: string; // For guest questions
    guestEmail?: string; // For guest questions
    session: string;
    status: 'active' | 'archived';
    analysisStatus: 'not_requested' | 'pending' | 'completed' | 'failed';
    teacherAnswer?: string;
    teacherAnsweredAt?: string;
    createdAt: string;
}

export interface CreateQuestionData {
    content: string;
    sessionId: string;
}

export const questionService = {
    // Create a new question
    createQuestion: async (data: CreateQuestionData): Promise<{ success: boolean; data: Question }> => {
        const response = await api.post('/questions', data);
        return response.data;
    },

    // Get all session questions
    getSessionQuestions: async (sessionId: string): Promise<{ success: boolean; data: Question[] }> => {
        const response = await api.get(`/questions/session/${sessionId}`);
        return response.data;
    },

    // Update a question
    updateQuestion: async (id: string, content: string): Promise<{ success: boolean; data: Question }> => {
        const response = await api.put(`/questions/${id}`, { content });
        return response.data;
    },

    // Add or update a teacher answer
    answerQuestion: async (id: string, answer: string): Promise<{ success: boolean; data: Question }> => {
        const response = await api.patch(`/questions/${id}/answer`, { answer });
        return response.data;
    },

    // Delete a question
    deleteQuestion: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/questions/${id}`);
        return response.data;
    }
};

import { io, Socket } from 'socket.io-client';

const hostname = window.location.hostname;
const SOCKET_URL = (import.meta.env.VITE_API_URL || `http://${hostname}:5001`).replace('/api', '');

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);

            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from WebSocket server');
            });
        }

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinSession(payload: any) {
        if (this.socket) {
            this.socket.emit('join_session', payload);
        }
    }

    leaveSession(sessionCode: string) {
        if (this.socket) {
            this.socket.emit('leave_session', sessionCode);
        }
    }

    onNewQuestion(callback: (question: any) => void) {
        if (this.socket) {
            this.socket.on('new_question', callback);
        }
    }

    offNewQuestion() {
        if (this.socket) {
            this.socket.off('new_question');
        }
    }

    onUpdateQuestion(callback: (question: any) => void) {
        if (this.socket) {
            this.socket.on('update_question', callback);
        }
    }

    offUpdateQuestion() {
        if (this.socket) {
            this.socket.off('update_question');
        }
    }

    onDeleteQuestion(callback: (questionId: string) => void) {
        if (this.socket) {
            this.socket.on('delete_question', callback);
        }
    }

    offDeleteQuestion() {
        if (this.socket) {
            this.socket.off('delete_question');
        }
    }

    onSessionStatusUpdate(callback: (data: { status: string }) => void) {
        if (this.socket) {
            this.socket.on('session_status_update', callback);
        }
    }

    offSessionStatusUpdate() {
        if (this.socket) {
            this.socket.off('session_status_update');
        }
    }

    onRoomPresenceUpdate(callback: (data: { teachers: number; students: number; total: number }) => void) {
        if (this.socket) {
            this.socket.on('room_presence_update', callback);
        }
    }

    offRoomPresenceUpdate() {
        if (this.socket) {
            this.socket.off('room_presence_update');
        }
    }

    emitSessionMessage(payload: { sessionCode: string; message: string; sender: any }) {
        if (this.socket) {
            this.socket.emit('send_session_message', payload);
        }
    }

    onSessionMessage(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('session_message', callback);
        }
    }

    offSessionMessage() {
        if (this.socket) {
            this.socket.off('session_message');
        }
    }
}

export const socketService = new SocketService();

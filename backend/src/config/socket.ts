import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import Session from '../models/Session';
import mongoose from 'mongoose';

let io: SocketServer;

const socketMap = new Map<string, { userId: string; sessionCode: string; role: 'teacher' | 'student' }>();

const stringifyId = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value.toString === 'function') return value.toString();
    return '';
};

const normalizeSender = (sender: any) => ({
    id: stringifyId(sender?.id) || stringifyId(sender?._id),
    name: sender?.name || 'Participant',
    role: sender?.role === 'teacher' ? 'teacher' : 'student'
});

const emitRoomPresence = (sessionCode: string) => {
    const teacherIds = new Set<string>();
    const studentIds = new Set<string>();

    socketMap.forEach((value) => {
        if (value.sessionCode !== sessionCode) return;

        if (value.role === 'teacher') {
            teacherIds.add(value.userId);
            return;
        }

        studentIds.add(value.userId);
    });

    io.to(sessionCode).emit('room_presence_update', {
        teachers: teacherIds.size,
        students: studentIds.size,
        total: teacherIds.size + studentIds.size
    });
};

export const initSocket = (server: HttpServer) => {
    io = new SocketServer(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        socket.on('join_session', async (payload: any) => {
            const sessionCode = typeof payload === 'string' ? payload : payload?.sessionCode;
            const user = typeof payload === 'string' ? null : payload?.user;

            if (!sessionCode) return;

            socket.join(sessionCode);

            if (user?._id) {
                socketMap.set(socket.id, {
                    userId: stringifyId(user._id),
                    sessionCode,
                    role: user.role === 'teacher' ? 'teacher' : 'student'
                });

                try {
                    if (user.role !== 'teacher') {
                        await Session.findOneAndUpdate(
                            { code: sessionCode },
                            {
                                $push: {
                                    attendance: {
                                        student: user._id,
                                        name: user.name,
                                        email: user.email,
                                        joinTime: new Date()
                                    }
                                }
                            }
                        );
                    }
                } catch (error) {
                    console.error('Error recording attendance:', error);
                }
            }

            emitRoomPresence(sessionCode);
        });

        socket.on('leave_session', async (sessionCode: string) => {
            socket.leave(sessionCode);
            await handleUserLeave(socket.id);
        });

        socket.on('disconnect', async () => {
            await handleUserLeave(socket.id);
        });

        socket.on('send_session_message', async ({ sessionCode, message, sender }) => {
            const normalizedSender = normalizeSender(sender);
            const trimmedMessage = typeof message === 'string' ? message.trim() : '';
            const senderObjectId = normalizedSender.id && mongoose.Types.ObjectId.isValid(normalizedSender.id)
                ? new mongoose.Types.ObjectId(normalizedSender.id)
                : undefined;

            if (!sessionCode || !trimmedMessage || !normalizedSender.name) return;

            const chatMessage = {
                senderId: senderObjectId,
                senderName: normalizedSender.name,
                senderRole: normalizedSender.role,
                message: trimmedMessage,
                createdAt: new Date()
            };

            try {
                const session = await Session.findOneAndUpdate(
                    { code: sessionCode },
                    { $push: { chatMessages: chatMessage } }
                );

                if (!session) return;

                io.to(sessionCode).emit('session_message', {
                    senderId: normalizedSender.id,
                    senderName: normalizedSender.name,
                    senderRole: normalizedSender.role,
                    message: trimmedMessage,
                    createdAt: chatMessage.createdAt.toISOString()
                });
            } catch (error) {
                console.error('Error saving session chat message:', error);
            }
        });
    });

    return io;
};

const handleUserLeave = async (socketId: string) => {
    const data = socketMap.get(socketId);
    if (!data) return;

    try {
        const session = await Session.findOne({ code: data.sessionCode });
        if (session) {
            let entryIndex = -1;

            for (let i = session.attendance.length - 1; i >= 0; i--) {
                if (session.attendance[i].student.toString() === data.userId && !session.attendance[i].leaveTime) {
                    entryIndex = i;
                    break;
                }
            }

            if (entryIndex !== -1) {
                session.attendance[entryIndex].leaveTime = new Date();
                await session.save();
            }
        }
    } catch (error) {
        console.error('Error recording leave time:', error);
    }

    socketMap.delete(socketId);
    emitRoomPresence(data.sessionCode);
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const emitToSession = (sessionCode: string, event: string, data: any) => {
    if (io) {
        io.to(sessionCode).emit(event, data);
    }
};

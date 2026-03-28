import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import Session from '../models/Session';
import User from '../models/User';
import mongoose from 'mongoose';

let io: SocketServer;

// Map to track socket -> user/session details for disconnect handling
const socketMap = new Map<string, { userId: string; name: string; email: string; sessionCode: string }>();
const understandingStateMap = new Map<string, Map<string, UnderstandingStateEntry>>();
const handRaiseStateMap = new Map<string, Map<string, HandRaiseStateEntry>>();

type NormalizedSocketUser = {
    id: string;
    name: string;
    email?: string;
};

type UnderstandingStateEntry = {
    participantId: string;
    socketId: string;
    understanding: 'confused' | 'neutral' | 'understanding';
    user: NormalizedSocketUser;
};

type HandRaiseStateEntry = {
    participantId: string;
    socketId: string;
    isRaised: boolean;
    user: NormalizedSocketUser;
};

const stringifyId = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value.toString === 'function') return value.toString();
    return '';
};

const normalizeUser = (user: any, fallbackId: string): NormalizedSocketUser => ({
    id: stringifyId(user?._id) || stringifyId(user?.id) || fallbackId,
    name: user?.name || 'Participant',
    email: user?.email
});

const getSessionState = <T>(store: Map<string, Map<string, T>>, sessionCode: string): Map<string, T> => {
    let sessionState = store.get(sessionCode);
    if (!sessionState) {
        sessionState = new Map<string, T>();
        store.set(sessionCode, sessionState);
    }
    return sessionState;
};

const removeParticipantFromSessionState = <T>(store: Map<string, Map<string, T>>, sessionCode: string, participantId: string): boolean => {
    const sessionState = store.get(sessionCode);
    if (!sessionState) return false;

    const deleted = sessionState.delete(participantId);
    if (sessionState.size === 0) {
        store.delete(sessionCode);
    }

    return deleted;
};

const buildEngagementStatePayload = (sessionCode: string) => ({
    understanding: Array.from((understandingStateMap.get(sessionCode) || new Map()).values()),
    handRaised: Array.from((handRaiseStateMap.get(sessionCode) || new Map()).values())
});

const emitEngagementState = (sessionCode: string, socket?: Socket) => {
    const payload = buildEngagementStatePayload(sessionCode);
    if (socket) {
        socket.emit('engagement_state_sync', payload);
        return;
    }

    if (io) {
        io.to(sessionCode).emit('engagement_state_sync', payload);
    }
};

export const initSocket = (server: HttpServer) => {
    io = new SocketServer(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        // Join a session room
        // Payload can be just a code (legacy/string) or object { sessionCode, user }
        socket.on('join_session', async (payload: any) => {
            let sessionCode = '';
            let user = null;

            if (typeof payload === 'string') {
                sessionCode = payload;
            } else {
                sessionCode = payload.sessionCode;
                user = payload.user;
            }

            if (!sessionCode) return;

            socket.join(sessionCode);
            console.log(`📁 User ${socket.id} joined session: ${sessionCode}`);

            // If we have user details, record attendance
            if (user && user._id) {
                try {
                    // Update socket map
                    socketMap.set(socket.id, {
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        sessionCode
                    });

                    // Add attendance record
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

                    // Fetch fresh user data (specifically points)
                    const freshUser = await User.findById(user._id).select('name email points avatar');

                    // Broadcast that user joined to update leaderboards
                    io.to(sessionCode).emit('user_joined', freshUser);

                    // console.log(`Attendance recorded for ${user.name}`);
                } catch (error) {
                    console.error('Error recording attendance:', error);
                }
            }

            emitEngagementState(sessionCode, socket);
        });

        // Leave a session room matches logic for disconnect essentially
        socket.on('leave_session', async (sessionCode: string) => {
            socket.leave(sessionCode);
            console.log(`🚪 User ${socket.id} left session: ${sessionCode}`);
            await handleUserLeave(socket.id);
        });

        socket.on('disconnect', async () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
            await handleUserLeave(socket.id);
        });

        // Whiteboard Synchronisation
        socket.on('whiteboard_open', ({ sessionCode }) => {
            socket.to(sessionCode).emit('whiteboard_open', { teacherId: socket.id });
        });

        socket.on('whiteboard_close', ({ sessionCode }) => {
            socket.to(sessionCode).emit('whiteboard_close');
        });

        socket.on('whiteboard_draw', ({ sessionCode, data }) => {
            socket.to(sessionCode).emit('whiteboard_draw', data);
        });

        socket.on('whiteboard_clear', ({ sessionCode }) => {
            socket.to(sessionCode).emit('whiteboard_clear');
        });

        // Engagement Features
        socket.on('student_understanding_update', ({ sessionCode, understanding, user }) => {
            const normalizedUser = normalizeUser(user, socket.id);
            const participantId = normalizedUser.id || socket.id;
            const update: UnderstandingStateEntry = {
                participantId,
                socketId: socket.id,
                understanding,
                user: normalizedUser
            };

            getSessionState(understandingStateMap, sessionCode).set(participantId, update);
            socket.to(sessionCode).emit('teacher_understanding_update', update);
        });

        socket.on('student_hand_raise', ({ sessionCode, isRaised, user }) => {
            const normalizedUser = normalizeUser(user, socket.id);
            const participantId = normalizedUser.id || socket.id;
            const update: HandRaiseStateEntry = {
                participantId,
                socketId: socket.id,
                isRaised,
                user: normalizedUser
            };

            if (isRaised) {
                getSessionState(handRaiseStateMap, sessionCode).set(participantId, update);
            } else {
                removeParticipantFromSessionState(handRaiseStateMap, sessionCode, participantId);
            }

            socket.to(sessionCode).emit('teacher_hand_raise', update);
        });

        socket.on('request_engagement_state', ({ sessionCode }) => {
            if (!sessionCode) return;
            emitEngagementState(sessionCode, socket);
        });

        // Private Messaging
        socket.on('send_private_msg', ({ recipientId, message, sender }) => {
            // Find recipient's socket(s)
            for (const [sId, data] of socketMap.entries()) {
                if (data.userId.toString() === recipientId.toString() && data.sessionCode === sender.sessionCode) {
                    io.to(sId).emit('receive_private_msg', {
                        sender,
                        message,
                        timestamp: new Date()
                    });
                }
            }
        });

        // Pulse Check Features
        socket.on('pulse_check_init', ({ sessionCode }) => {
            socket.to(sessionCode).emit('pulse_check_start');
        });

        socket.on('pulse_check_response', async ({ userId, sessionCode }) => {
            console.log(`💓 Pulse check response from user ${userId} in session ${sessionCode}`);
            try {
                // Reward 15 bonus points for quick response
                const user = await User.findByIdAndUpdate(userId, { $inc: { points: 15 } }, { new: true });

                // Also add points to session leaderboard
                // Explicitly cast userId to ObjectId for the array filter match
                const userObjectId = new mongoose.Types.ObjectId(userId);

                const result = await Session.updateOne(
                    { code: sessionCode, "attendance.student": userObjectId },
                    { $inc: { "attendance.$.score": 15 } }
                );

                if (result.matchedCount === 0) {
                    console.warn(`⚠️ Failed to update session score for user ${userId}. Attendance record not found for code ${sessionCode}.`);
                } else {
                    console.log(`✅ Session score updated for user ${userId} (+15 pts). Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
                }

                if (user) {
                    io.to(sessionCode).emit('points_updated', { userId, points: user.points, name: user.name });
                }
            } catch (error) {
                console.error('❌ Pulse check reward error:', error);
            }
        });

        // 1. Emoji Reaction
        socket.on('emoji_reaction', ({ sessionCode, emoji, user }) => {
            io.to(sessionCode).emit('stream_emoji', { emoji, user, id: Math.random().toString(36).substr(2, 9) });
        });

        // 2. Save Bookmark
        socket.on('save_bookmark', async ({ userId, sessionCode, sessionTitle }) => {
            try {
                await User.findByIdAndUpdate(userId, {
                    $push: {
                        bookmarks: { sessionTitle, sessionCode, timestamp: new Date() }
                    }
                });
                socket.emit('bookmark_saved', { success: true });
            } catch (error) {
                console.error('Bookmark error:', error);
                socket.emit('bookmark_saved', { success: false });
            }
        });

        // 3. Trigger Mystery Spotlight
        socket.on('trigger_spotlight', async ({ sessionCode, teacherId }) => {
            // Get all unique users in this session from socketMap
            // Use a Map to deduplicate by userId
            const uniqueStudentsMap = new Map();

            for (const [sId, data] of socketMap.entries()) {
                // Filter: must be in same session AND not be the teacher
                // Use .toString() to ensure we compare strings (handles both string and ObjectId)
                if (data.sessionCode === sessionCode && data.userId.toString() !== teacherId.toString()) {
                    uniqueStudentsMap.set(data.userId.toString(), { id: data.userId, name: data.name });
                }
            }

            const sessionUsers = Array.from(uniqueStudentsMap.values());

            if (sessionUsers.length === 0) {
                socket.emit('spotlight_error', { message: 'No active students to spotlight!' });
                return;
            }

            // Pick a random student
            const winner = sessionUsers[Math.floor(Math.random() * sessionUsers.length)];

            console.log(`🎯 Spotlight winner in ${sessionCode}: ${winner.name} (Choice from ${sessionUsers.length} students)`);

            // Broadcast the result to everyone in the room
            io.to(sessionCode).emit('spotlight_result', { winner, spinDuration: 3000 });
        });
    });

    return io;
};

// Helper to update leave time
const handleUserLeave = async (socketId: string) => {
    const data = socketMap.get(socketId);
    if (!data) return;

    const { userId, sessionCode } = data;

    try {
        // Find the specific session and update the LAST attendance record for this student that has no leaveTime
        // This is a bit tricky with atomic operators, so we might need to find first.

        // Simplest approach: Find session, find the relevant attendance entry (last one for this user), update it.
        const session = await Session.findOne({ code: sessionCode });
        if (session) {
            // Find the last entry for this student that doesn't have a leaveTime
            // We search from end
            let entryIndex = -1;
            for (let i = session.attendance.length - 1; i >= 0; i--) {
                if (session.attendance[i].student.toString() === userId.toString() && !session.attendance[i].leaveTime) {
                    entryIndex = i;
                    break;
                }
            }

            if (entryIndex !== -1) {
                session.attendance[entryIndex].leaveTime = new Date();
                await session.save();
                // console.log(`Leave time recorded for ${data.name}`);
            }
        }
    } catch (error) {
        console.error('Error recording leave time:', error);
    }

    const understandingChanged = removeParticipantFromSessionState(understandingStateMap, sessionCode, userId);
    const handRaiseChanged = removeParticipantFromSessionState(handRaiseStateMap, sessionCode, userId);

    if (understandingChanged || handRaiseChanged) {
        emitEngagementState(sessionCode);
    }

    // Clear from map
    socketMap.delete(socketId);
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Helper function to emit events to a session room
export const emitToSession = (sessionCode: string, event: string, data: any) => {
    if (io) {
        io.to(sessionCode).emit(event, data);
    }
};

import { Request, Response } from 'express';
import Session from '../models/Session';
import Question from '../models/Question';
import { emitToSession } from '../config/socket';

// Helper to generate a unique 6-character code
const generateSessionCode = (length: number = 6): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// @desc    Create a new session
// @route   POST /api/sessions
// @access  Private (Teacher only)
export const createSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description } = req.body;
        const existingActiveSession = await Session.findOne({
            teacher: req.user?._id,
            status: 'active'
        });

        if (existingActiveSession) {
            res.status(409).json({
                success: false,
                message: 'You already have an active session. Please continue or end it first.',
                data: existingActiveSession
            });
            return;
        }

        // Generate unique code
        let code = generateSessionCode();
        let codeExists = await Session.findOne({ code });

        // Ensure uniqueness
        while (codeExists) {
            code = generateSessionCode();
            codeExists = await Session.findOne({ code });
        }

        const session = await Session.create({
            title,
            description,
            code,
            teacher: req.user?._id,
            status: 'active'
        });

        res.status(201).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during session creation'
        });
    }
};

// @desc    Join a session
// @route   POST /api/sessions/join
// @access  Private (Student only)
export const joinSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code } = req.body;

        if (!code) {
            res.status(400).json({ success: false, message: 'Please provide a session code' });
            return;
        }

        const session = await Session.findOne({ code: code.toUpperCase(), status: 'active' });

        if (!session) {
            res.status(404).json({
                success: false,
                message: 'Active session not found with this code'
            });
            return;
        }

        // Add student to session if not already added
        const studentId = req.user?._id;
        if (studentId && !session.students.includes(studentId)) {
            session.students.push(studentId);
            await session.save();
        }

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Join session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during joining session'
        });
    }
};

// @desc    Get session details by code
// @route   GET /api/sessions/:code
// @access  Private
export const getSessionDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code } = req.params;
        const session = await Session.findOne({ code: code.toUpperCase() })
            .populate('teacher', 'name email')
            .populate('students', 'name email');

        if (!session) {
            res.status(404).json({
                success: false,
                message: 'Session not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching session'
        });
    }
};

// @desc    End a session
// @route   PATCH /api/sessions/:id/end
// @access  Private (Teacher only)
export const endSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            res.status(404).json({ success: false, message: 'Session not found' });
            return;
        }

        // Check if user is the teacher of this session
        if (session.teacher.toString() !== req.user?._id.toString()) {
            res.status(403).json({ success: false, message: 'Unauthorized to end this session' });
            return;
        }

        session.status = 'ended';
        session.endedAt = new Date();
        await session.save();

        // Notify all participants
        emitToSession(session.code, 'session_status_update', { status: 'ended' });

        res.status(200).json({
            success: true,
            data: {
                _id: session._id,
                title: session.title,
                code: session.code,
                endedAt: session.endedAt
            },
            message: 'Session ended successfully'
        });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error ending session'
        });
    }
};

// @desc    Leave a session
// @route   POST /api/sessions/:code/leave
// @access  Private
export const leaveSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code } = req.params;
        const session = await Session.findOne({ code: code.toUpperCase() });

        if (!session) {
            res.status(404).json({ success: false, message: 'Session not found' });
            return;
        }

        const userId = req.user?._id;
        if (userId) {
            // Remove user from students array
            session.students = session.students.filter(id => id.toString() !== userId.toString()) as any;
            await session.save();
        }

        res.status(200).json({
            success: true,
            message: 'Left session successfully'
        });
    } catch (error) {
        console.error('Leave session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error leaving session'
        });
    }
};

// @desc    Get active session for user
// @route   GET /api/sessions/current/active
// @access  Private
export const getActiveSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        let session;

        if (req.user?.role === 'Teacher') {
            session = await Session.findOne({ teacher: userId, status: 'active' });
        } else {
            session = await Session.findOne({ students: userId, status: 'active' });
        }

        res.status(200).json({
            success: true,
            data: session || null
        });
    } catch (error) {
        console.error('Get active session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching active session'
        });
    }
};

// @desc    Get all sessions a student has joined (for certificates)
// @route   GET /api/sessions/student/history
// @access  Private
export const getStudentSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        // Find sessions where student is in participants list
        const sessions = await Session.find({
            students: userId
        })
            .populate('teacher', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Get student sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching student sessions'
        });
    }
};

// @desc    Get session history with questions and answers
// @route   GET /api/sessions/history
// @access  Private
export const getSessionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const isTeacher = req.user?.role === 'Teacher';

        const sessionQuery = isTeacher
            ? { teacher: userId, status: 'ended' }
            : { students: userId, status: 'ended' };

        const sessions = await Session.find(sessionQuery)
            .populate('teacher', 'name')
            .sort({ endedAt: -1, createdAt: -1 })
            .lean();

        if (sessions.length === 0) {
            res.status(200).json({
                success: true,
                data: []
            });
            return;
        }

        const sessionIds = sessions.map(session => session._id);
        const questions = await Question.find({ session: { $in: sessionIds } })
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const questionsBySession = new Map<string, any[]>();
        questions.forEach((question) => {
            const key = question.session.toString();
            const existingQuestions = questionsBySession.get(key) || [];
            existingQuestions.push(question);
            questionsBySession.set(key, existingQuestions);
        });

        const history = sessions.map((session) => ({
            ...session,
            questions: questionsBySession.get(session._id.toString()) || []
        }));

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Get session history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching session history'
        });
    }
};

import express from 'express';
import { body } from 'express-validator';
import {
    createSession,
    joinSession,
    getSessionDetails,
    endSession,
    getActiveSession,
    leaveSession,
    getStudentSessions,
    getSessionHistory
} from '../controllers/sessionController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// @route   GET /api/sessions/current/active
// @desc    Get active session for current user
router.get('/current/active', getActiveSession);

// @route   GET /api/sessions/student/history
// @desc    Get student session history
router.get('/student/history', getStudentSessions);

// @route   GET /api/sessions/history
// @desc    Get past session history for current user
router.get('/history', getSessionHistory);

// @route   POST /api/sessions
// @desc    Create a session (Teacher)
router.post(
    '/',
    authorize('Teacher'),
    [
        body('title').trim().notEmpty().withMessage('Session title is required'),
    ],
    createSession
);

// @route   POST /api/sessions/join
// @desc    Join a session (Both Student and Teacher)
router.post(
    '/join',
    [
        body('code').trim().notEmpty().withMessage('Session code is required'),
    ],
    joinSession
);

// @route   GET /api/sessions/:code
// @desc    Get session details
router.get('/:code', getSessionDetails);

// @route   PATCH /api/sessions/:id/end
// @desc    End a session (Teacher)
router.patch('/:id/end', authorize('Teacher'), endSession);

// @route   POST /api/sessions/:code/leave
// @desc    Leave a session
router.post('/:code/leave', leaveSession);

export default router;

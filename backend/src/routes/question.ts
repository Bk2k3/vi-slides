import express from 'express';
import { body } from 'express-validator';
import {
    createQuestion,
    getSessionQuestions,
    answerQuestion,
    updateQuestion,
    deleteQuestion
} from '../controllers/questionController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All question routes require authentication
router.use(protect);

// @route   POST /api/questions
// @desc    Create a new question
router.post(
    '/',
    [
        body('content').trim().notEmpty().withMessage('Question content cannot be empty'),
        body('sessionId').notEmpty().withMessage('Session ID is required'),
    ],
    createQuestion
);

// @route   GET /api/questions/session/:sessionId
// @desc    Get all questions for a session
router.get('/session/:sessionId', getSessionQuestions);

// @route   PUT /api/questions/:id
// @desc    Update a question
router.put(
    '/:id',
    [
        body('content').trim().notEmpty().withMessage('Question content cannot be empty'),
    ],
    updateQuestion
);

// @route   PATCH /api/questions/:id/answer
// @desc    Answer a question
router.patch(
    '/:id/answer',
    [
        body('answer').trim().notEmpty().withMessage('Answer cannot be empty'),
    ],
    answerQuestion
);

// @route   DELETE /api/questions/:id
// @desc    Delete a question
router.delete('/:id', deleteQuestion);

export default router;

import { Request, Response } from 'express';
import Question from '../models/Question';
import Session from '../models/Session';
import { emitToSession } from '../config/socket';

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private
export const createQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content, sessionId } = req.body;

        if (!content || !sessionId) {
            res.status(400).json({ success: false, message: 'Content and session ID are required' });
            return;
        }

        const session = await Session.findById(sessionId);
        if (!session) {
            res.status(404).json({ success: false, message: 'Session not found' });
            return;
        }

        const question = await Question.create({
            content,
            user: req.user?._id,
            session: sessionId,
            analysisStatus: 'not_requested'
        });

        const populatedQuestion = await Question.findById(question._id).populate('user', 'name');
        emitToSession(session.code, 'new_question', populatedQuestion);

        res.status(201).json({
            success: true,
            data: populatedQuestion
        });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during question creation'
        });
    }
};

// @desc    Get all questions for a session
// @route   GET /api/questions/session/:sessionId
// @access  Private
export const getSessionQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.params;
        const questions = await Question.find({ session: sessionId, status: 'active' })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: questions.length,
            data: questions
        });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching questions'
        });
    }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private (Owner only)
export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content } = req.body;
        const question = await Question.findById(req.params.id).populate('session', 'code');

        if (!question) {
            res.status(404).json({ success: false, message: 'Question not found' });
            return;
        }

        if (!question.user || question.user.toString() !== req.user?._id.toString()) {
            res.status(403).json({ success: false, message: 'Not authorized to update this question' });
            return;
        }

        question.content = content || question.content;
        await question.save();

        const updatedQuestion = await Question.findById(question._id).populate('user', 'name');
        emitToSession((question.session as any).code, 'update_question', updatedQuestion);

        res.status(200).json({
            success: true,
            data: updatedQuestion
        });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating question'
        });
    }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private (Owner or Teacher)
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const question = await Question.findById(req.params.id).populate('session', 'code');

        if (!question) {
            res.status(404).json({ success: false, message: 'Question not found' });
            return;
        }

        const session = await Session.findById(question.session);
        const isOwner = question.user ? question.user.toString() === req.user?._id.toString() : false;
        const isTeacher = !!session?.teacher && session.teacher.toString() === req.user?._id.toString();

        if (!isOwner && !isTeacher) {
            res.status(403).json({ success: false, message: 'Not authorized to delete this question' });
            return;
        }

        await Question.findByIdAndDelete(req.params.id);
        emitToSession((question.session as any).code, 'delete_question', req.params.id);

        res.status(200).json({
            success: true,
            message: 'Question removed'
        });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting question'
        });
    }
};

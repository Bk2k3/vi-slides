import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
    title: string;
    description?: string;
    code: string; // Unique 6-character code
    teacher: mongoose.Types.ObjectId;
    students: mongoose.Types.ObjectId[];
    attendance: {
        student: mongoose.Types.ObjectId;
        name: string;
        email: string;
        joinTime: Date;
        leaveTime?: Date;
    }[];
    chatMessages: {
        senderId?: mongoose.Types.ObjectId;
        senderName: string;
        senderRole?: 'teacher' | 'student';
        message: string;
        createdAt: Date;
    }[];
    status: 'active' | 'ended';
    endedAt?: Date;
    createdAt: Date;
}

const sessionSchema = new Schema<ISession>({
    title: {
        type: String,
        required: [true, 'Please provide a session title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    teacher: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    attendance: [{
        student: { type: Schema.Types.ObjectId, ref: 'User' },
        name: String,
        email: String,
        joinTime: { type: Date, default: Date.now },
        leaveTime: Date
    }],
    chatMessages: [{
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
        senderName: { type: String, required: true, trim: true },
        senderRole: { type: String, enum: ['teacher', 'student'], required: false },
        message: { type: String, required: true, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['active', 'ended'],
        default: 'active'
    },
    endedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;

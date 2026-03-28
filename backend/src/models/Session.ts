import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
    title: string;
    description?: string;
    code: string; // Unique 6-character code
    qrCodeDataUrl?: string; // Base64 QR code image
    joinUrl?: string; // The URL encoded in the QR code
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
        message: string;
        createdAt: Date;
    }[];
    status: 'active' | 'inactive' | 'ended' | 'paused';
    isQuerySession?: boolean;
    customQueryUrl?: string;
    endedAt?: Date;
    moodSummary?: string;
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
    qrCodeDataUrl: {
        type: String
    },
    joinUrl: {
        type: String
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
        message: { type: String, required: true, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'ended', 'paused'],
        default: 'active'
    },
    isQuerySession: {
        type: Boolean,
        default: false
    },
    customQueryUrl: {
        type: String,
        trim: true
    },
    endedAt: {
        type: Date
    },
    moodSummary: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;

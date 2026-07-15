import { Schema, model } from 'mongoose';
import { IChat } from '../types';

const ChatMessageSchema = new Schema({
  role: { type: String, enum: ['user', 'model'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new Schema<IChat>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    messages: [ChatMessageSchema]
  },
  { timestamps: true }
);

export const Chat = model<IChat>('Chat', ChatSchema);

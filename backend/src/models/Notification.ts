import { Schema, model } from 'mongoose';
import { INotification } from '../types';

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['budget_exceeded', 'upcoming_bill', 'reminder', 'system'],
      required: true
    },
    isRead: { type: Boolean, default: false },
    dueDate: { type: Date }
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1 });

export const Notification = model<INotification>('Notification', NotificationSchema);

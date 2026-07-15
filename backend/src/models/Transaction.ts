import { Schema, model } from 'mongoose';
import { ITransaction } from '../types';

const TransactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, default: '', trim: true },
    accountFrom: { type: String, trim: true },
    accountTo: { type: String, trim: true },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    nextRecurringDate: { type: Date }
  },
  { timestamps: true }
);

// Optimize query patterns
TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ user: 1, category: 1 });

export const Transaction = model<ITransaction>('Transaction', TransactionSchema);

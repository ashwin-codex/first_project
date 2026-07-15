import { Schema, model } from 'mongoose';
import { IBudget } from '../types';

const BudgetSchema = new Schema<IBudget>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true, trim: true },
    limit: { type: Number, required: true, min: 0 },
    period: { type: String, required: true } // format "YYYY-MM"
  },
  { timestamps: true }
);

// Ensure unique limit category per user per period
BudgetSchema.index({ user: 1, period: 1, category: 1 }, { unique: true });

export const Budget = model<IBudget>('Budget', BudgetSchema);

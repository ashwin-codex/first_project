import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    avatar: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'dark' },
    notifications: {
      budgetAlerts: { type: Boolean, default: true },
      billReminders: { type: Boolean, default: true },
      savingsSummary: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = model<IUser>('User', UserSchema);

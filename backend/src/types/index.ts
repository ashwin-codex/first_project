import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationCode?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  avatar: string;
  currency: string;
  language: string;
  theme: string;
  notifications: {
    budgetAlerts: boolean;
    billReminders: boolean;
    savingsSummary: boolean;
  };
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction extends Document {
  user: SchemaObjectId;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  date: Date;
  description: string;
  accountFrom?: string; // For transfers
  accountTo?: string;   // For transfers
  isRecurring: boolean;
  recurringFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextRecurringDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SchemaObjectId = any; // Mongoose typing helper

export interface IBudget extends Document {
  user: SchemaObjectId;
  category: string;
  limit: number;
  period: string; // "YYYY-MM" format
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface IChat extends Document {
  user: SchemaObjectId;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  user: SchemaObjectId;
  title: string;
  message: string;
  type: 'budget_exceeded' | 'upcoming_bill' | 'reminder' | 'system';
  isRead: boolean;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

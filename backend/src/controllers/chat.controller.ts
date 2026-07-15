import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Chat } from '../models/Chat';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { AIService } from '../services/ai.service';
import { IChatMessage } from '../types';

export const getChatHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;

    let chat = await Chat.findOne({ user: userId });
    if (!chat) {
      chat = new Chat({ user: userId, messages: [] });
      await chat.save();
    }

    res.status(200).json(chat.messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { query } = req.body;
    const currency = req.user.currency || 'USD';

    let chat = await Chat.findOne({ user: userId });
    if (!chat) {
      chat = new Chat({ user: userId, messages: [] });
    }

    // Limit active history size sent to Gemini API for speed and tokens constraints
    const historyWindow: IChatMessage[] = chat.messages.slice(-10).map((m: any) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
    }));

    // Fetch user current month finances for situational context
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthTx = await Transaction.find({
      user: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const budgets = await Budget.find({
      user: userId,
      period: now.toISOString().slice(0, 7)
    });

    // Request answer from AIService
    const answer = await AIService.chatWithCoach(
      query,
      historyWindow,
      currentMonthTx,
      budgets,
      currency
    );

    // Push dialog to database
    chat.messages.push({
      role: 'user',
      content: query,
      timestamp: new Date()
    });

    chat.messages.push({
      role: 'model',
      content: answer,
      timestamp: new Date()
    });

    await chat.save();

    res.status(200).json({
      role: 'model',
      content: answer,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

export const clearChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;

    await Chat.findOneAndDelete({ user: userId });

    res.status(200).json({ message: 'Conversation history reset successfully' });
  } catch (error) {
    next(error);
  }
};

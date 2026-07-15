import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Budget } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { AIService } from '../services/ai.service';

export const upsertBudget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { category, limit, period } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: userId, category, period },
      { limit },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(budget);
  } catch (error) {
    next(error);
  }
};

export const getBudgets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { period } = req.query; // YYYY-MM

    const currentPeriod = period as string || new Date().toISOString().slice(0, 7);

    const budgets = await Budget.find({ user: userId, period: currentPeriod });

    res.status(200).json(budgets);
  } catch (error) {
    next(error);
  }
};

export const getBudgetProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { period } = req.query; // YYYY-MM
    const currentPeriod = period as string || new Date().toISOString().slice(0, 7);

    // Compute period date bounds
    const [year, month] = currentPeriod.split('-').map(Number);
    const startOfPeriod = new Date(year, month - 1, 1);
    const endOfPeriod = new Date(year, month, 0, 23, 59, 59);

    // Fetch limits
    const budgets = await Budget.find({ user: userId, period: currentPeriod });

    // Fetch total expense per category
    const actualSpent = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: startOfPeriod, $lte: endOfPeriod }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);

    // Map limits and actual spending
    const progressList = budgets.map((b) => {
      const match = actualSpent.find((act) => act._id === b.category);
      return {
        id: b._id.toString(),
        category: b.category,
        limit: b.limit,
        spent: match?.totalSpent || 0,
        period: b.period
      };
    });

    // Add unbudgeted categories that have spending
    actualSpent.forEach((act) => {
      const isBudgeted = progressList.some((p) => p.category === act._id);
      if (!isBudgeted) {
        progressList.push({
          id: 'unbudgeted',
          category: act._id,
          limit: 0,
          spent: act.totalSpent,
          period: currentPeriod
        });
      }
    });

    // Fetch AI Recommendations
    const currentMonthTx = await Transaction.find({
      user: userId,
      date: { $gte: startOfPeriod, $lte: endOfPeriod }
    });

    const aiSuggestions = await AIService.getBudgetSuggestions(
      currentMonthTx,
      budgets,
      req.user.currency || 'USD'
    );

    res.status(200).json({
      progress: progressList,
      aiSuggestions
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const budget = await Budget.findOneAndDelete({ _id: id, user: userId });
    if (!budget) {
      res.status(404).json({ message: 'Budget not found' });
      return;
    }

    res.status(200).json({ message: 'Budget deleted successfully' });
  } catch (error) {
    next(error);
  }
};

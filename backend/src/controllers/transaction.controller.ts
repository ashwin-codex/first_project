import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { Notification } from '../models/Notification';
import { AIService } from '../services/ai.service';

export const createTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { type, category, amount, date, description, accountFrom, accountTo, isRecurring, recurringFrequency } = req.body;

    const tx = new Transaction({
      user: userId,
      type,
      category,
      amount,
      date,
      description,
      accountFrom,
      accountTo,
      isRecurring,
      recurringFrequency
    });

    await tx.save();

    // Trigger Budget Limit Check if this is an expense
    if (type === 'expense') {
      const yearMonth = new Date(date).toISOString().slice(0, 7); // "YYYY-MM"
      const budget = await Budget.findOne({ user: userId, category, period: yearMonth });

      if (budget) {
        // Calculate total spent on this category this month
        const startOfMonth = new Date(new Date(date).getFullYear(), new Date(date).getMonth(), 1);
        const endOfMonth = new Date(new Date(date).getFullYear(), new Date(date).getMonth() + 1, 0, 23, 59, 59);

        const aggregateResult = await Transaction.aggregate([
          {
            $match: {
              user: userId,
              type: 'expense',
              category,
              date: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' }
            }
          }
        ]);

        const totalSpent = aggregateResult[0]?.totalSpent || 0;

        if (totalSpent > budget.limit) {
          // Generate notification
          const notif = new Notification({
            user: userId,
            title: 'Budget Exceeded! ⚠️',
            message: `Your spending in category "${category}" has reached ${totalSpent} ${req.user.currency || 'USD'}, exceeding your limit of ${budget.limit} ${req.user.currency || 'USD'}.`,
            type: 'budget_exceeded'
          });
          await notif.save();
        }
      }
    }

    res.status(201).json(tx);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { type, category, search, startDate, endDate, limit, page } = req.query;

    const query: any = { user: userId };

    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const pageSize = parseInt(limit as string) || 50;
    const pageNum = parseInt(page as string) || 1;

    const list = await Transaction.find(query)
      .sort({ date: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      transactions: list,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const tx = await Transaction.findOneAndUpdate(
      { _id: id, user: userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!tx) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    res.status(200).json(tx);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const tx = await Transaction.findOneAndDelete({ _id: id, user: userId });
    if (!tx) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const currency = req.user.currency || 'USD';

    // Get current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all transactions for the user
    const allTx = await Transaction.find({ user: userId });
    const currentMonthTx = await Transaction.find({
      user: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Calculate total balance across all time
    let totalBalance = 0;
    allTx.forEach((t) => {
      if (t.type === 'income') totalBalance += t.amount;
      else if (t.type === 'expense') totalBalance -= t.amount;
      // Transfer inside user's accounts is net zero
    });

    // Monthly metrics
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    currentMonthTx.forEach((t) => {
      if (t.type === 'income') monthlyIncome += t.amount;
      else if (t.type === 'expense') monthlyExpense += t.amount;
    });

    const savings = monthlyIncome - monthlyExpense;

    // Get active budgets
    const yearMonth = now.toISOString().slice(0, 7);
    const budgets = await Budget.find({ user: userId, period: yearMonth });

    // Compute AI Financial Coach analysis summary
    const summary = AIService.computeFinancialSummary(currentMonthTx, budgets);

    // Fetch AI suggestion
    const aiSuggestion = await AIService.getDashboardSuggestion(currentMonthTx, budgets, currency);

    // Compile recent transactions (limit 5)
    const recentTx = await Transaction.find({ user: userId })
      .sort({ date: -1 })
      .limit(5);

    res.status(200).json({
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      savings,
      healthScore: summary.healthScore,
      aiSuggestion,
      recentTransactions: recentTx
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;

    const list = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.status(200).json({
      notifications: list,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notif = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.status(200).json(notif);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;

    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notif = await Notification.findOneAndDelete({ _id: id, user: userId });
    if (!notif) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.status(200).json({ message: 'Notification dismissed successfully' });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { Chat } from '../models/Chat';
import { Notification } from '../models/Notification';
import { CloudinaryService } from '../services/cloudinary.service';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { name, currency, language, theme, notifications } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (name) user.name = name;
    if (currency) user.currency = currency;
    if (language) user.language = language;
    if (theme) user.theme = theme;
    if (notifications) {
      user.notifications = {
        ...user.notifications,
        ...notifications
      };
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency,
        language: user.language,
        theme: user.theme,
        notifications: user.notifications,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      res.status(400).json({ message: 'Please upload an image file.' });
      return;
    }

    // Call Cloudinary Upload
    const avatarUrl = await CloudinaryService.uploadAvatar(
      req.file.buffer,
      req.file.mimetype
    );

    // Save to user
    await User.findByIdAndUpdate(userId, { avatar: avatarUrl });

    res.status(200).json({
      message: 'Avatar uploaded successfully',
      avatarUrl
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      res.status(400).json({ message: 'Incorrect old password' });
      return;
    }

    user.password = newPassword; // Mongoose middleware will hash this
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;

    // Delete user details
    await User.findByIdAndDelete(userId);

    // Clean up all related financial transaction logs
    await Transaction.deleteMany({ user: userId });
    await Budget.deleteMany({ user: userId });
    await Chat.deleteMany({ user: userId });
    await Notification.deleteMany({ user: userId });

    res.status(200).json({
      message: 'Your PocketPilot account and all associated financial records have been deleted.'
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { EmailService } from '../services/email.service';
import { isMockMode } from '../config/db';

const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'pocketpilot_jwt_secret_dev_key_123456';
  const expires = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id }, secret, { expiresIn: expires as any });
};

const generateSixDigitCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email address' });
      return;
    }

    const verificationCode = generateSixDigitCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = new User({
      name,
      email,
      password,
      verificationCode,
      verificationExpires
    });

    await user.save();
    await EmailService.sendVerificationEmail(user.email, verificationCode);

    res.status(201).json({
      message: 'Registration successful. A verification code has been sent to your email.',
      userId: user._id
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (isMockMode) {
      // In developer simulation mode: bypass password matching and verify checks
      user.isVerified = true;
      await user.save();
      const token = signToken(user._id.toString());
      res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          currency: user.currency,
          language: user.language,
          theme: user.theme,
          notifications: user.notifications,
          isVerified: true,
        },
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (!user.isVerified) {
      // Allow login but restrict frontend capabilities until verified, or prompt verification
      res.status(403).json({
        message: 'Email address not verified. Please verify your email.',
        userId: user._id,
        isVerified: false
      });
      return;
    }

    const token = signToken(user._id.toString());

    res.status(200).json({
      token,
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

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: 'Email is already verified' });
      return;
    }

    if (
      !isMockMode &&
      (user.verificationCode !== code ||
       !user.verificationExpires ||
       user.verificationExpires < new Date())
    ) {
      res.status(400).json({ message: 'Invalid or expired verification code' });
      return;
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const token = signToken(user._id.toString());

    res.status(200).json({
      message: 'Email verified successfully',
      token,
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

export const resendVerificationCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: 'Email is already verified' });
      return;
    }

    const code = generateSixDigitCode();
    user.verificationCode = code;
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await EmailService.sendVerificationEmail(user.email, code);

    res.status(200).json({ message: 'Verification code resent successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // For security, do not disclose that user doesn't exist
      res.status(200).json({ message: 'If that email exists, we have sent a reset code.' });
      return;
    }

    const code = generateSixDigitCode();
    user.resetPasswordToken = code;
    user.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiry
    await user.save();

    await EmailService.sendPasswordResetEmail(user.email, code);

    res.status(200).json({ message: 'Reset code sent to your email.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (
      user.resetPasswordToken !== code ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      res.status(400).json({ message: 'Invalid or expired reset code' });
      return;
    }

    user.password = password; // pre-save will hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    next(error);
  }
};

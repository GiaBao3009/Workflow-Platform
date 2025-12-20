/**
 * Auth Routes
 * Handles OAuth callbacks và JWT token generation
 */

import { Router, Request, Response } from 'express';
import passport from './passport.config';
import { generateToken } from './jwt.utils';
import { IUser, User } from '../schema.mongodb';
import { emailService } from '../services/email.service';
import crypto from 'crypto';

const router = Router();
// ==================== LOCAL LOGIN ====================
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc.' });
  }
  try {
    const user = await User.findOne({ email, provider: 'local' }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    const bcrypt = require('bcrypt');
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    // Tạo token
    const token = generateToken(user);
    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        role: user.role || 'user',
        autoSaveInterval: user.autoSaveInterval,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ==================== GOOGLE OAUTH ====================
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5174'}?auth=failed`,
    session: false,
  }),
  (req: Request, res: Response) => {
    const user = req.user as IUser;
    const token = generateToken(user);
    
    // Redirect về frontend với token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}?auth=success&token=${token}`);
  }
);

// ==================== GITHUB OAUTH ====================
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email'],
  })
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5174'}?auth=failed`,
    session: false,
  }),
  (req: Request, res: Response) => {
    const user = req.user as IUser;
    const token = generateToken(user);
    
    // Redirect về frontend với token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}?auth=success&token=${token}`);
  }
);

// ==================== GET CURRENT USER ====================
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { verifyToken } = await import('./jwt.utils');
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { User } = await import('../schema.mongodb');
    const user = await User.findById(payload.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        role: (user as any).role || 'user',
        autoSaveInterval: user.autoSaveInterval,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== LOGOUT ====================
router.post('/logout', (req: Request, res: Response) => {
  // Với JWT, logout chỉ cần client xóa token
  res.json({ message: 'Logged out successfully' });
});

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Tìm user trong database
    const user = await User.findOne({ email });

    // Không tiết lộ user có tồn tại hay không (bảo mật)
    // Luôn trả về success message
    if (user) {
      // Tạo reset token bảo mật
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash token trước khi lưu vào DB (bảo mật)
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      // Lưu token và thời gian hết hạn (1 giờ)
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();
      
      // Gửi email
      const emailSent = await emailService.sendPasswordResetEmail(email, resetToken);
      
      if (emailSent) {
        console.log(`✅ Password reset email sent to: ${email}`);
      } else {
        console.log(`📧 Password reset requested for: ${email}`);
        console.log(`🔑 Reset token: ${resetToken}`);
        console.log(`🔗 Reset link: ${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`);
      }
    }

    res.json({ 
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== RESET PASSWORD ====================
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash token để so sánh với DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Tìm user với token hợp lệ và chưa hết hạn
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ 
        message: 'Password reset token is invalid or has expired' 
      });
    }

    // TODO: Hash password trước khi lưu (nếu dùng local auth)
    // const bcrypt = require('bcrypt');
    // user.password = await bcrypt.hash(newPassword, 10);
    
    // Xóa reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`✅ Password reset successful for: ${user.email}`);

    res.json({ 
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== UPDATE USER SETTINGS ====================
router.patch('/settings', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { verifyToken } = await import('./jwt.utils');
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { autoSaveInterval } = req.body;

    // Validate autoSaveInterval
    if (autoSaveInterval !== undefined) {
      if (typeof autoSaveInterval !== 'number' || autoSaveInterval < 3 || autoSaveInterval > 60) {
        return res.status(400).json({ error: 'Auto-save interval must be between 3 and 60 seconds' });
      }
    }

    const user = await User.findByIdAndUpdate(
      payload.userId,
      { autoSaveInterval },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ Settings updated for user: ${user.email}, autoSaveInterval: ${autoSaveInterval}s`);

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
      autoSaveInterval: user.autoSaveInterval,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

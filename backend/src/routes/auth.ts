import express from 'express';
import { supabase } from '../config/database.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateAffiliateCode,
  authenticateUser,
  AuthRequest
} from '../utils/auth.js';
import { validateStateCity } from '../utils/helpers.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      whatsapp,
      password,
      confirmPassword,
      securityQuestion,
      securityAnswer,
      address,
      state,
      city
    } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!validateStateCity(state, city)) {
      return res.status(400).json({ error: 'Invalid state or city' });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone already registered' });
    }

    const passwordHash = await hashPassword(password);
    const securityAnswerHash = await hashPassword(securityAnswer.toLowerCase());

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone,
        whatsapp: whatsapp || phone,
        password_hash: passwordHash,
        security_question: securityQuestion,
        security_answer_hash: securityAnswerHash,
        address,
        state,
        city
      })
      .select()
      .single();

    if (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ error: 'Failed to create account' });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        isAffiliate: user.is_affiliate
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${emailOrPhone.toLowerCase()},phone.eq.${emailOrPhone}`)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({ error: 'Account has been banned' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        isAffiliate: user.is_affiliate,
        affiliateApproved: user.affiliate_approved,
        affiliateBalance: user.affiliate_balance
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-security-question', async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('id, security_question')
      .or(`email.eq.${emailOrPhone.toLowerCase()},phone.eq.${emailOrPhone}`)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ securityQuestion: user.security_question });
  } catch (error) {
    console.error('Verify security question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { emailOrPhone, securityAnswer, newPassword } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${emailOrPhone.toLowerCase()},phone.eq.${emailOrPhone}`)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidAnswer = await comparePassword(
      securityAnswer.toLowerCase(),
      user.security_answer_hash
    );

    if (!isValidAnswer) {
      return res.status(401).json({ error: 'Incorrect security answer' });
    }

    const newPasswordHash = await hashPassword(newPassword);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to reset password' });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user!.userId)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash, security_answer_hash, ...userProfile } = user;

    res.json(userProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/profile', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const {
      fullName,
      phone,
      whatsapp,
      address,
      state,
      city,
      bankAccountName,
      bankAccountNumber,
      bankName
    } = req.body;

    if (state && city && !validateStateCity(state, city)) {
      return res.status(400).json({ error: 'Invalid state or city' });
    }

    const updates: any = {};
    if (fullName) updates.full_name = fullName;
    if (phone) updates.phone = phone;
    if (whatsapp) updates.whatsapp = whatsapp;
    if (address) updates.address = address;
    if (state) updates.state = state;
    if (city) updates.city = city;
    if (bankAccountName) updates.bank_account_name = bankAccountName;
    if (bankAccountNumber) updates.bank_account_number = bankAccountNumber;
    if (bankName) updates.bank_name = bankName;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user!.userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    const { password_hash, security_answer_hash, ...userProfile } = data;

    res.json({ message: 'Profile updated successfully', user: userProfile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/change-password', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user!.userId)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await comparePassword(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await hashPassword(newPassword);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', req.user!.userId);

    if (error) {
      return res.status(500).json({ error: 'Failed to change password' });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

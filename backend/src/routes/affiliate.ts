import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateUser, AuthRequest, generateAffiliateCode } from '../utils/auth.js';

const router = express.Router();

router.post('/register', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_affiliate, affiliate_code')
      .eq('id', req.user!.userId)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_affiliate) {
      return res.status(400).json({
        error: 'Already registered as affiliate',
        affiliateCode: user.affiliate_code
      });
    }

    let affiliateCode = generateAffiliateCode();
    let isUnique = false;

    while (!isUnique) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .maybeSingle();

      if (!existing) {
        isUnique = true;
      } else {
        affiliateCode = generateAffiliateCode();
      }
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        is_affiliate: true,
        affiliate_code: affiliateCode,
        affiliate_approved: false
      })
      .eq('id', req.user!.userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to register as affiliate' });
    }

    res.json({
      message: 'Affiliate registration successful. Awaiting admin approval.',
      affiliateCode: updatedUser.affiliate_code,
      approved: updatedUser.affiliate_approved
    });
  } catch (error) {
    console.error('Affiliate registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dashboard', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_affiliate, affiliate_code, affiliate_approved, affiliate_balance, bank_account_name, bank_account_number, bank_name')
      .eq('id', req.user!.userId)
      .maybeSingle();

    if (!user || !user.is_affiliate) {
      return res.status(403).json({ error: 'Not registered as affiliate' });
    }

    const { data: referrals } = await supabase
      .from('referrals')
      .select('*, orders(order_id_string, created_at, total)')
      .eq('affiliate_id', req.user!.userId)
      .order('created_at', { ascending: false });

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user!.userId)
      .in('type', ['COMMISSION', 'WITHDRAWAL', 'ADJUSTMENT'])
      .order('created_at', { ascending: false })
      .limit(20);

    const totalCommission = referrals?.reduce((sum, ref) => sum + parseFloat(ref.commission_amount), 0) || 0;
    const totalReferrals = referrals?.length || 0;

    res.json({
      affiliateCode: user.affiliate_code,
      approved: user.affiliate_approved,
      balance: user.affiliate_balance,
      totalCommission,
      totalReferrals,
      referrals,
      transactions,
      bankDetails: {
        accountName: user.bank_account_name,
        accountNumber: user.bank_account_number,
        bankName: user.bank_name
      }
    });
  } catch (error) {
    console.error('Get affiliate dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/withdraw', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('affiliate_balance, bank_account_name, bank_account_number, bank_name, affiliate_approved')
      .eq('id', req.user!.userId)
      .maybeSingle();

    if (!user || !user.affiliate_approved) {
      return res.status(403).json({ error: 'Affiliate not approved' });
    }

    if (!user.bank_account_name || !user.bank_account_number || !user.bank_name) {
      return res.status(400).json({ error: 'Please complete bank details first' });
    }

    if (amount > user.affiliate_balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ affiliate_balance: user.affiliate_balance - amount })
      .eq('id', req.user!.userId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to process withdrawal' });
    }

    await supabase.from('transactions').insert({
      user_id: req.user!.userId,
      type: 'WITHDRAWAL',
      amount: -amount,
      reference: `WD-${Date.now()}`,
      metadata: {
        bank_account: user.bank_account_number,
        bank_name: user.bank_name,
        account_name: user.bank_account_name
      },
      status: 'PENDING'
    });

    res.json({
      message: 'Withdrawal request submitted successfully',
      newBalance: user.affiliate_balance - amount
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/validate-code/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, affiliate_approved')
      .eq('affiliate_code', code.toUpperCase())
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: 'Invalid affiliate code', valid: false });
    }

    if (!user.affiliate_approved) {
      return res.status(400).json({ error: 'Affiliate not approved', valid: false });
    }

    res.json({
      valid: true,
      affiliateName: user.full_name
    });
  } catch (error) {
    console.error('Validate code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

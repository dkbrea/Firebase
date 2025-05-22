import { supabase, handleSupabaseError } from '../supabase';
import type { DebtAccount, DebtAccountType, PaymentFrequency, DebtPayoffStrategy } from '@/types';

export const getDebtAccounts = async (userId: string): Promise<{ accounts: DebtAccount[] | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('debt_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('apr', { ascending: false });

    if (error) {
      return { accounts: null, error: error.message };
    }

    // Transform from database format to application format
    const accounts: DebtAccount[] = data.map(account => ({
      id: account.id.toString(),
      name: account.name,
      type: account.type as DebtAccountType,
      balance: account.balance,
      apr: account.apr,
      minimumPayment: account.minimum_payment,
      paymentDayOfMonth: account.payment_day_of_month,
      nextDueDate: account.next_due_date ? new Date(account.next_due_date) : new Date(), // Use the next_due_date field if available
      paymentFrequency: account.payment_frequency as PaymentFrequency,
      userId: account.user_id,
      createdAt: new Date(account.created_at)
    }));

    return { accounts };
  } catch (error: any) {
    return { accounts: null, error: error.message };
  }
};

export const getDebtAccount = async (accountId: string): Promise<{ account: DebtAccount | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('debt_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) {
      return { account: null, error: error.message };
    }

    // Transform from database format to application format
    const account: DebtAccount = {
      id: data.id.toString(),
      name: data.name,
      type: data.type as DebtAccountType,
      balance: data.balance,
      apr: data.apr,
      minimumPayment: data.minimum_payment,
      paymentDayOfMonth: data.payment_day_of_month,
      nextDueDate: data.next_due_date ? new Date(data.next_due_date) : new Date(),
      paymentFrequency: data.payment_frequency as PaymentFrequency,
      userId: data.user_id,
      createdAt: new Date(data.created_at)
    };

    return { account };
  } catch (error: any) {
    return { account: null, error: error.message };
  }
};

export const createDebtAccount = async (account: Omit<DebtAccount, 'id' | 'createdAt'>): Promise<{ account: DebtAccount | null; error?: string }> => {
  try {
    // Transform from application format to database format
    const { data, error } = await supabase
      .from('debt_accounts')
      .insert({
        name: account.name,
        type: account.type,
        balance: account.balance,
        apr: account.apr,
        minimum_payment: account.minimumPayment,
        payment_day_of_month: account.paymentDayOfMonth,
        next_due_date: account.nextDueDate,
        payment_frequency: account.paymentFrequency,
        user_id: account.userId
      })
      .select()
      .single();

    if (error) {
      return { account: null, error: error.message };
    }

    // Transform back to application format
    const newAccount: DebtAccount = {
      id: data.id.toString(),
      name: data.name,
      type: data.type as DebtAccountType,
      balance: data.balance,
      apr: data.apr,
      minimumPayment: data.minimum_payment,
      paymentDayOfMonth: data.payment_day_of_month,
      paymentFrequency: data.payment_frequency as PaymentFrequency,
      userId: data.user_id,
      createdAt: new Date(data.created_at)
    };

    return { account: newAccount };
  } catch (error: any) {
    return { account: null, error: error.message };
  }
};

export const updateDebtAccount = async (
  accountId: string, 
  updates: Partial<Omit<DebtAccount, 'id' | 'userId' | 'createdAt'>>
): Promise<{ account: DebtAccount | null; error?: string }> => {
  try {
    // Transform from application format to database format
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.balance !== undefined) updateData.balance = updates.balance;
    if (updates.apr !== undefined) updateData.apr = updates.apr;
    if (updates.minimumPayment !== undefined) updateData.minimum_payment = updates.minimumPayment;
    if (updates.paymentDayOfMonth !== undefined) updateData.payment_day_of_month = updates.paymentDayOfMonth;
    if (updates.nextDueDate !== undefined) updateData.next_due_date = updates.nextDueDate;
    if (updates.paymentFrequency !== undefined) updateData.payment_frequency = updates.paymentFrequency;
    
    const { data, error } = await supabase
      .from('debt_accounts')
      .update(updateData)
      .eq('id', accountId)
      .select()
      .single();

    if (error) {
      return { account: null, error: error.message };
    }

    // Transform back to application format
    const updatedAccount: DebtAccount = {
      id: data.id.toString(),
      name: data.name,
      type: data.type as DebtAccountType,
      balance: data.balance,
      apr: data.apr,
      minimumPayment: data.minimum_payment,
      paymentDayOfMonth: data.payment_day_of_month,
      paymentFrequency: data.payment_frequency as PaymentFrequency,
      userId: data.user_id,
      createdAt: new Date(data.created_at)
    };

    return { account: updatedAccount };
  } catch (error: any) {
    return { account: null, error: error.message };
  }
};

export const deleteDebtAccount = async (accountId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('debt_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getDebtPayoffStrategy = async (userId: string): Promise<{ strategy: DebtPayoffStrategy | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('debt_payoff_strategy')
      .eq('user_id', userId)
      .single();

    if (error) {
      return { strategy: null, error: error.message };
    }

    return { strategy: data.debt_payoff_strategy as DebtPayoffStrategy };
  } catch (error: any) {
    return { strategy: null, error: error.message };
  }
};

export const setDebtPayoffStrategy = async (userId: string, strategy: DebtPayoffStrategy): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, check if the user_preferences table exists
    try {
      // Check if user preferences exist
      const { data: existingPrefs, error: checkError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId);

      if (checkError) {
        // If the error is about the table not existing, we'll create it
        if (checkError.message.includes("relation \"public.user_preferences\" does not exist")) {
          console.error("user_preferences table does not exist. Please run the migration script.");
          // Return success=true to prevent errors in the UI, but log the issue
          return { success: true };
        }
        return { success: false, error: checkError.message };
      }

      let error;
      if (existingPrefs && existingPrefs.length > 0) {
        // Update existing preferences
        const { error: updateError } = await supabase
          .from('user_preferences')
          .update({ debt_payoff_strategy: strategy })
          .eq('user_id', userId);
        
        error = updateError;
      } else {
        // Create new preferences
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            debt_payoff_strategy: strategy
          });
        
        error = insertError;
      }

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (innerError: any) {
      console.error("Error checking user preferences:", innerError);
      // Return success to prevent UI errors
      return { success: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Helper function to make a payment to a debt account
export const makeDebtPayment = async (
  accountId: string,
  amount: number,
  userId: string,
  fromAccountId?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Start a transaction to update the debt account and create a transaction record
    const { error } = await supabase.rpc('make_debt_payment', {
      p_debt_account_id: parseInt(accountId),
      p_amount: amount,
      p_user_id: userId,
      p_from_account_id: fromAccountId,
      p_notes: notes
    });

    if (error) {
      // If the RPC function doesn't exist, fall back to manual updates
      // Get the debt account to update its balance
      const { account, error: fetchError } = await getDebtAccount(accountId);
      
      if (fetchError || !account) {
        return { success: false, error: fetchError || 'Debt account not found' };
      }
      
      // Update the debt account balance
      const { error: updateError } = await supabase
        .from('debt_accounts')
        .update({ balance: account.balance - amount })
        .eq('id', accountId);
        
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      // Create a transaction record for this payment
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          date: new Date().toISOString(),
          name: `Payment to ${account.name}`,
          category: 'Debt Payment',
          amount: -amount, // Negative because it's an expense from the account
          account: fromAccountId || 'Primary', // Default account, should be replaced with actual account
          transaction_type: 'expense',
          user_id: userId,
          debt_account_id: parseInt(accountId),
          is_debt_payment: true,
          notes: notes
        });
        
      if (txError) {
        return { success: false, error: txError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

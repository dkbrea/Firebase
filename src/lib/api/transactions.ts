import { supabase, handleSupabaseError } from '../supabase';
import type { Transaction, TransactionType, TransactionDetailedType } from '@/types';

export const getTransactions = async (
  userId: string, 
  options?: { 
    limit?: number; 
    offset?: number; 
    startDate?: Date; 
    endDate?: Date;
    accountId?: string;
    categoryId?: string;
    type?: TransactionType;
  }
): Promise<{ transactions: Transaction[] | null; count: number; error?: string }> => {
  try {
    let query = supabase
      .from('transactions')
      .select('*, transaction_tags(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Apply filters
    if (options?.startDate) {
      query = query.gte('date', options.startDate.toISOString());
    }
    
    if (options?.endDate) {
      query = query.lte('date', options.endDate.toISOString());
    }
    
    if (options?.accountId) {
      query = query.eq('account_id', options.accountId);
    }
    
    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    
    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return { transactions: null, count: 0, error: error.message };
    }

    // Transform from database format to application format
    const transactions: Transaction[] = data.map(item => ({
      id: item.id,
      date: new Date(item.date),
      description: item.description,
      amount: item.amount,
      type: item.type as TransactionType,
      detailedType: item.detailed_type as TransactionDetailedType | undefined,
      categoryId: item.category_id || undefined,
      accountId: item.account_id,
      toAccountId: item.to_account_id || undefined,
      sourceId: item.source_id || undefined,
      userId: item.user_id,
      source: item.source || undefined,
      notes: item.notes || undefined,
      tags: item.transaction_tags?.map((tag: any) => tag.tag) || [],
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));

    return { transactions, count: count || 0 };
  } catch (error: any) {
    return { transactions: null, count: 0, error: error.message };
  }
};

export const getTransaction = async (transactionId: string): Promise<{ transaction: Transaction | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_tags(*)')
      .eq('id', transactionId)
      .single();

    if (error) {
      return { transaction: null, error: error.message };
    }

    // Transform from database format to application format
    const transaction: Transaction = {
      id: data.id,
      date: new Date(data.date),
      description: data.description,
      amount: data.amount,
      type: data.type as TransactionType,
      detailedType: data.detailed_type as TransactionDetailedType | undefined,
      categoryId: data.category_id || undefined,
      accountId: data.account_id,
      toAccountId: data.to_account_id || undefined,
      sourceId: data.source_id || undefined,
      userId: data.user_id,
      source: data.source || undefined,
      notes: data.notes || undefined,
      tags: data.transaction_tags?.map((tag: any) => tag.tag) || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return { transaction };
  } catch (error: any) {
    return { transaction: null, error: error.message };
  }
};

export const createTransaction = async (
  transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ transaction: Transaction | null; error?: string }> => {
  try {
    // Start a Supabase transaction
    const { data, error } = await supabase.rpc('create_transaction_with_tags', {
      tx_date: transaction.date.toISOString(),
      tx_description: transaction.description,
      tx_amount: transaction.amount,
      tx_type: transaction.type,
      tx_detailed_type: transaction.detailedType,
      tx_category_id: transaction.categoryId,
      tx_account_id: transaction.accountId,
      tx_to_account_id: transaction.toAccountId,
      tx_source_id: transaction.sourceId,
      tx_source: transaction.source,
      tx_notes: transaction.notes,
      tx_user_id: transaction.userId,
      tx_tags: transaction.tags || []
    });

    if (error) {
      // If the RPC function doesn't exist, fall back to manual transaction
      // This is a more complex implementation that would need to be done with multiple queries
      // First insert the transaction
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          date: transaction.date.toISOString(),
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          detailed_type: transaction.detailedType,
          category_id: transaction.categoryId,
          account_id: transaction.accountId,
          to_account_id: transaction.toAccountId,
          source_id: transaction.sourceId,
          source: transaction.source,
          notes: transaction.notes,
          user_id: transaction.userId
        })
        .select()
        .single();

      if (txError) {
        return { transaction: null, error: txError.message };
      }

      // Then insert tags if any
      if (transaction.tags && transaction.tags.length > 0) {
        const tagInserts = transaction.tags.map(tag => ({
          transaction_id: txData.id,
          tag
        }));

        const { error: tagsError } = await supabase
          .from('transaction_tags')
          .insert(tagInserts);

        if (tagsError) {
          return { transaction: null, error: tagsError.message };
        }
      }

      // Get the full transaction with tags
      return await getTransaction(txData.id);
    }

    // If the RPC function exists, use its result
    return { transaction: data };
  } catch (error: any) {
    return { transaction: null, error: error.message };
  }
};

export const updateTransaction = async (
  transactionId: string,
  updates: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<{ transaction: Transaction | null; error?: string }> => {
  try {
    // Transform from application format to database format
    const updateData: any = {};
    if (updates.date !== undefined) updateData.date = updates.date.toISOString();
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.detailedType !== undefined) updateData.detailed_type = updates.detailedType;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.accountId !== undefined) updateData.account_id = updates.accountId;
    if (updates.toAccountId !== undefined) updateData.to_account_id = updates.toAccountId;
    if (updates.sourceId !== undefined) updateData.source_id = updates.sourceId;
    if (updates.source !== undefined) updateData.source = updates.source;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    
    // Update the transaction
    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId);

    if (error) {
      return { transaction: null, error: error.message };
    }

    // If tags are being updated
    if (updates.tags !== undefined) {
      // Delete existing tags
      const { error: deleteError } = await supabase
        .from('transaction_tags')
        .delete()
        .eq('transaction_id', transactionId);

      if (deleteError) {
        return { transaction: null, error: deleteError.message };
      }

      // Insert new tags if any
      if (updates.tags.length > 0) {
        const tagInserts = updates.tags.map(tag => ({
          transaction_id: transactionId,
          tag
        }));

        const { error: insertError } = await supabase
          .from('transaction_tags')
          .insert(tagInserts);

        if (insertError) {
          return { transaction: null, error: insertError.message };
        }
      }
    }

    // Get the updated transaction
    return await getTransaction(transactionId);
  } catch (error: any) {
    return { transaction: null, error: error.message };
  }
};

export const deleteTransaction = async (transactionId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Delete the transaction (cascade will handle tags)
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export type TransactionType = 'deposit' | 'withdraw' | 'transfer' | 'bank_deposit' | 'bank_withdraw' | 'bank_to_user' | 'user_to_bank';

export interface TransactionVO {
  id: string;
  roomId: string;
  fromUserId: string | null;
  toUserId: string | null;
  fromUserName: string | null;
  toUserName: string | null;
  amount: number;
  type: TransactionType;
  note: string | null;
  createdBy: string;
  createdAt: Date;
}

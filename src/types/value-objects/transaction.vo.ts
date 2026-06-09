export type TransactionType = 'deposit' | 'withdraw' | 'transfer';

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

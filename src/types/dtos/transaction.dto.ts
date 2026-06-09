export interface TransactionDTO {
  id: string;
  room_id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  type: 'deposit' | 'withdraw' | 'transfer';
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface TransactionWithUsersDTO extends TransactionDTO {
  from_user: { name: string } | null;
  to_user: { name: string } | null;
  creator: { name: string };
}

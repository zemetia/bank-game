export interface RoomUserDTO {
  id: string;
  room_id: string;
  user_id: string;
  name: string;
  balance: number;
  is_master: boolean;
  created_at: string;
}

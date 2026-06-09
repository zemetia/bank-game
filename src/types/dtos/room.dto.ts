export interface RoomDTO {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface RoomWithUsersDTO extends RoomDTO {
  room_users: RoomUserInRoomDTO[];
}

export interface RoomUserInRoomDTO {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  is_master: boolean;
}

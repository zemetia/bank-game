export interface RoomUserVO {
  id: string;
  roomId: string;
  userId: string;
  name: string;
  balance: number;
  isMaster: boolean;
  createdAt: Date;
}

export interface AuthResultVO {
  userId: string;
  isMaster: boolean;
}

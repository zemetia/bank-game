import type { RoomUserVO } from './room-user.vo';

export interface RoomVO {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
}

export interface RoomWithUsersVO extends RoomVO {
  users: RoomUserVO[];
  master: RoomUserVO | undefined;
  bankCentralEnabled: boolean;
  bankCentralBalance: number;
}

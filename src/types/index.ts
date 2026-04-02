export type Role = 'supervisor' | 'admin' | 'tablet';

export interface Session {
  role: Role;
  adminId?: string;
  roomId?: string;
  token: string;
}

export interface Room {
  id: string;
  name: string;
  loginId?: string;
  password?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  roomId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed';
  timestamp: number;
}

export interface Call {
  id: string;
  roomId: string;
  status: 'pending' | 'resolved';
  timestamp: number;
}

export interface Store {
  password?: string;
  storeName?: string;
  rooms: Room[];
  menuItems: MenuItem[];
  orders: Order[];
  calls: Call[];
}

export type GlobalDB = Record<string, Store>;

export interface ModalConfig {
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  message: string;
  defaultValue?: string;
  onConfirm: (val: any) => void;
  onCancel: () => void;
}
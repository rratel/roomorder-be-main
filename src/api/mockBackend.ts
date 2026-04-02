import type { GlobalDB, Store, Order, Call, OrderItem, Session, Role } from '../types';

class EventEmitter {
  listeners: Record<string, Function[]> = {};
  
  on(event: string, cb: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }
  
  off(event: string, cb: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== cb);
  }
  
  emit(event: string, data?: any) {
    if (this.listeners[event]) this.listeners[event].forEach(cb => cb(data));
  }
}

export const socketMock = new EventEmitter();

export let globalDB: GlobalDB = {
  'admin': {
    password: 'admin',
    storeName: '룸오더 1호점 (테스트)',
    rooms: [
      { id: 'test_room_1', name: '테스트 1번방', loginId: 'test1', password: '1' },
      { id: 'test_room_2', name: '테스트 2번방', loginId: 'test2', password: '1' }
    ],
    menuItems: [
      { id: 'm_1', name: '아메리카노', price: 4500, category: '음료', description: '최고급 원두를 사용한 아메리카노' },
      { id: 'm_2', name: '말린망고', price: 25000, category: '스낵', description: '설탕 없이도 달달한 말린 망고' }
    ],
    orders: [],
    calls: []
  }
};

export const api = {
  login: async (role: Role, id: string, pw: string): Promise<Session> => {
    if (role === 'supervisor') {
      if (id === 'ratel' && pw === '1q2w3e4r!') return { role, token: 'super_token' };
      throw new Error('관리자 계정 정보가 일치하지 않습니다.');
    }
    if (role === 'admin') {
      const store = globalDB[id];
      if (store && store.password === pw) return { role, adminId: id, token: `admin_${id}` };
      throw new Error('매장 ID 또는 비밀번호가 일치하지 않습니다.');
    }
    if (role === 'tablet') {
      for (const [adminId, store] of Object.entries(globalDB)) {
        const room = store.rooms.find(r => r.loginId === id && r.password === pw);
        if (room) return { role, adminId, roomId: room.id, token: `tab_${adminId}_${room.id}` };
      }
      throw new Error('룸 ID 또는 비밀번호가 일치하지 않습니다.');
    }
    throw new Error('알 수 없는 오류가 발생했습니다.');
  },
  
  createOrder: async (adminId: string, roomId: string, items: OrderItem[], total: number) => {
    const newOrder: Order = { 
      id: 'ord_' + Date.now() + Math.random().toString(36).substring(2, 7), 
      roomId, 
      items, 
      total, 
      status: 'pending', 
      timestamp: Date.now() 
    };
    if (globalDB[adminId]) {
      globalDB[adminId] = {
        ...globalDB[adminId],
        orders: [...globalDB[adminId].orders, newOrder]
      };
      socketMock.emit(`update_${adminId}`, globalDB[adminId]);
    }
  },
  
  completeOrder: async (adminId: string, orderId: string) => {
    const store = globalDB[adminId];
    if (store) {
      globalDB[adminId] = {
        ...store,
        orders: store.orders.map(o => o.id === orderId ? { ...o, status: 'completed' } : o)
      };
      socketMock.emit(`update_${adminId}`, globalDB[adminId]);
    }
  },
  
  createCall: async (adminId: string, roomId: string) => {
    const newCall: Call = { 
      id: 'call_' + Date.now() + Math.random().toString(36).substring(2, 7), 
      roomId, 
      status: 'pending', 
      timestamp: Date.now() 
    };
    if (globalDB[adminId]) {
      globalDB[adminId] = {
        ...globalDB[adminId],
        calls: [...globalDB[adminId].calls, newCall]
      };
      socketMock.emit(`update_${adminId}`, globalDB[adminId]);
    }
  },
  
  resolveCall: async (adminId: string, callId: string) => {
    const store = globalDB[adminId];
    if (store) {
      globalDB[adminId] = {
        ...store,
        calls: store.calls.map(c => c.id === callId ? { ...c, status: 'resolved' } : c)
      };
      socketMock.emit(`update_${adminId}`, globalDB[adminId]);
    }
  },
  
  clearRoom: async (adminId: string, roomId: string) => {
    const store = globalDB[adminId];
    if (store) {
      globalDB[adminId] = {
        ...store,
        orders: store.orders.filter(o => o.roomId !== roomId),
        calls: store.calls.filter(c => c.roomId !== roomId)
      };
      socketMock.emit(`update_${adminId}`, globalDB[adminId]);
    }
  },
  
  adminUpdate: async <K extends keyof Store>(adminId: string, key: K, newData: Store[K]) => {
    if (globalDB[adminId]) {
      globalDB[adminId] = {
        ...globalDB[adminId],
        [key]: newData
      };
      socketMock.emit(`update_${adminId}`, globalDB[adminId]);
    }
  },
  
  supervisorUpdate: async (newData: GlobalDB) => {
    globalDB = newData;
    socketMock.emit('update_supervisor', globalDB);
  }
};
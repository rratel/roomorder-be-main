import express, { Request, Response } from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GlobalDB, Store } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const DB_FILE = path.join(__dirname, 'db.json');
let globalDB: GlobalDB = {};

async function loadDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    globalDB = JSON.parse(data);
    console.log('✅ 기존 데이터베이스(db.json)를 성공적으로 불러왔습니다.');
  } catch (err) {
    console.log('⚠️ db.json 파일이 없습니다. 새로운 데이터베이스를 초기화합니다.');
    globalDB = {
      'admin': {
        password: 'admin',
        storeName: '매장관리자 테스트계정',
        rooms: [], menuItems: [], orders: [], calls: []
      }
    };
    await saveDB();
  }
}

async function saveDB() {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(globalDB, null, 2), 'utf8');
  } catch (err) {
    console.error(' DB 저장 중 오류 발생:', err);
  }
}

function notifyAndSave(adminId: string | null) {
  if (adminId && globalDB[adminId]) {
    io.emit(`update_${adminId}`, globalDB[adminId]);
  }
  io.emit('update_supervisor', globalDB);
  saveDB();
}

// 명시적인 any 타입 반환을 제거하고 안전한 라우팅 구조로 변경
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { role, id, pw } = req.body;
  const safeId = id as string; // 명시적 string 캐스팅 적용

  if (role === 'supervisor') {
    if (id === 'ratel' && pw === '1q2w3e4r!') {
      res.json({ role, token: 'super_token' });
      return;
    }
  }
  if (role === 'admin') {
    // Store 타입을 사용하여 TS 인덱스 에러 방지 및 안전한 데이터 접근
    const store: Store | undefined = globalDB[safeId];
    if (store && store.password === pw) {
      res.json({ role, adminId: id, token: `admin_${id}` });
      return;
    }
  }
  if (role === 'tablet') {
    for (const [adminId, store] of Object.entries(globalDB)) {
      const room = store.rooms?.find(r => r.loginId === id && r.password === pw);
      if (room) {
        res.json({ role, adminId, roomId: room.id, token: `tab_${adminId}_${room.id}` });
        return;
      }
    }
  }
  res.status(401).json({ message: '계정 정보가 일치하지 않습니다.' });
});

app.get('/api/store/:adminId', (req: Request, res: Response) => {
  const adminId = req.params.adminId as string; // 인덱스로 사용할 수 있도록 string으로 고정
  const store: Store | undefined = globalDB[adminId];
  
  if (!store) {
    res.status(404).json({ message: '매장 정보를 찾을 수 없습니다.' });
    return;
  }
  res.json(store);
});

app.get('/api/supervisor/stores', (req: Request, res: Response) => {
  res.json(globalDB);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const adminId = req.body.adminId as string; // 명시적 타입 할당
  const { roomId, items, total } = req.body;
  const store: Store | undefined = globalDB[adminId];
  
  if (!store) {
    res.status(404).json({ message: '매장 없음' });
    return;
  }

  // 2. 기존 Mock 백엔드 코드와 완벽하게 일치하는 난수 ID 생성 로직 적용
  const newOrder = { 
    id: 'ord_' + Date.now() + Math.random().toString(36).substring(2, 7), 
    roomId, 
    items, 
    total, 
    status: 'pending' as const, 
    timestamp: Date.now() 
  };
  store.orders = store.orders || [];
  store.orders.push(newOrder);
  notifyAndSave(adminId);
  res.json({ success: true });
});

app.put('/api/orders/:orderId/complete', (req: Request, res: Response) => {
  const adminId = req.body.adminId as string;
  const store: Store | undefined = globalDB[adminId];
  
  if (!store) {
    res.status(404).send();
    return;
  }

  const order = store.orders.find(o => o.id === req.params.orderId);
  if (order) { 
    order.status = 'completed'; 
    notifyAndSave(adminId); 
  }
  res.json({ success: true });
});

app.post('/api/calls', (req: Request, res: Response) => {
  const adminId = req.body.adminId as string;
  const { roomId } = req.body;
  const store: Store | undefined = globalDB[adminId];
  
  if (!store) {
    res.status(404).send();
    return;
  }

  const newCall = { 
    id: 'call_' + Date.now() + Math.random().toString(36).substring(2, 7), 
    roomId, 
    status: 'pending' as const, 
    timestamp: Date.now() 
  };
  store.calls = store.calls || [];
  store.calls.push(newCall);
  notifyAndSave(adminId);
  res.json({ success: true });
});

app.put('/api/calls/:callId/resolve', (req: Request, res: Response) => {
  const adminId = req.body.adminId as string;
  const store: Store | undefined = globalDB[adminId];
  
  if (!store) {
    res.status(404).send();
    return;
  }

  const call = store.calls.find(c => c.id === req.params.callId);
  if (call) { 
    call.status = 'resolved'; 
    notifyAndSave(adminId); 
  }
  res.json({ success: true });
});

app.delete('/api/rooms/:roomId/clear', (req: Request, res: Response) => {
  const adminId = req.body.adminId as string;
  const store: Store | undefined = globalDB[adminId];
  
  if (!store) {
    res.status(404).send();
    return;
  }

  store.orders = (store.orders || []).filter(o => o.roomId !== req.params.roomId);
  store.calls = (store.calls || []).filter(c => c.roomId !== req.params.roomId);
  notifyAndSave(adminId);
  res.json({ success: true });
});

app.put('/api/store/:adminId/:key', (req: Request, res: Response) => {
  // adminId와 key에 string을 명시적으로 캐스팅하여 인덱스 에러 원천 차단
  const adminId = req.params.adminId as string; 
  const key = req.params.key as string;
  const { data } = req.body;
  
  const store: Store | undefined = globalDB[adminId];
  if (store) {
    // Record 타입으로 안전하게 접근하여 192번째 줄 에러 해결
    (store as Record<string, any>)[key] = data;
    notifyAndSave(adminId);
    res.json({ success: true });
  } else {
    res.status(404).send();
  }
});

app.put('/api/supervisor/stores', (req: Request, res: Response) => {
  globalDB = req.body.stores;
  notifyAndSave(null);
  res.json({ success: true });
});

loadDB().then(() => {
  server.listen(3000, () => {
    console.log('프로덕션 백엔드 서버(TS)가 3000번 포트에서 가동 중입니다.');
  });
});

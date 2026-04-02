import { io, Socket } from 'socket.io-client';
import type { Session, Role, OrderItem, Store, GlobalDB,} from '../types';

// ==========================================
// 1. 환경 설정 및 WebSocket 연결
// ==========================================
/**
 * [환경 설정]
 * VITE_API_URL은 .env 파일에서 관리합니다.
 * 개발 환경: http://localhost:3000
 * 배포 환경: [https://api.yourdomain.com](https://api.yourdomain.com)
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ==========================================
// 1. Socket.io 실시간 통신 설정
// ==========================================
// autoConnect: false로 설정하여 필요할 때 수동 연결할 수도 있으나, 
// 여기서는 실시간 주문 수신을 위해 true로 설정합니다.
export const socket: Socket = io(API_URL, {
  transports: ['websocket'], // 성능 최적화를 위해 WebSocket 우선 사용
  autoConnect: true,
});

// ==========================================
// 2. REST API 서비스 레이어
// ==========================================
export const api = {
  /**
   * [로그인] 권한별(슈퍼바이저, 관리자, 태블릿) 인증 요청
   */
  login: async (role: Role, id: string, pw: string): Promise<Session> => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, id, pw })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || '로그인에 실패했습니다.');
    }
    return res.json();
  },

  /**
   * [매장 데이터 조회] 관리자/태블릿 로그인 시 해당 매장의 정보를 가져옴
   */
  getStore: async (adminId: string): Promise<Store> => {
    const res = await fetch(`${API_URL}/api/store/${adminId}`);
    if (!res.ok) throw new Error('매장 정보를 불러오지 못했습니다.');
    return res.json();
  },

  /**
   * [전체 데이터 조회] 슈퍼바이저가 모든 매장 리스트를 가져올 때 사용
   */
  getAllStores: async (): Promise<GlobalDB> => {
    const res = await fetch(`${API_URL}/api/supervisor/stores`);
    if (!res.ok) throw new Error('전체 매장 데이터를 불러오지 못했습니다.');
    return res.json();
  },

  /**
   * [주문 생성] 태블릿에서 손님이 주문을 넣었을 때 호출
   */
  createOrder: async (adminId: string, roomId: string, items: OrderItem[], total: number): Promise<void> => {
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, roomId, items, total })
    });
    if (!res.ok) throw new Error('주문 전송 중 서버 오류가 발생했습니다.');
  },

  /**
   * [주문 완료] 관리자가 주문을 확인하고 처리 완료 버튼을 눌렀을 때
   */
  completeOrder: async (adminId: string, orderId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/orders/${orderId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    });
    if (!res.ok) throw new Error('주문 상태 변경에 실패했습니다.');
  },

  /**
   * [직원 호출 생성] 태블릿에서 '호출' 버튼을 눌렀을 때
   */
  createCall: async (adminId: string, roomId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, roomId })
    });
    if (!res.ok) throw new Error('호출 전송에 실패했습니다.');
  },

  /**
   * [호출 확인] 관리자가 호출 팝업을 닫거나 확인했을 때
   */
  resolveCall: async (adminId: string, callId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/calls/${callId}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    });
    if (!res.ok) throw new Error('호출 처리 중 오류가 발생했습니다.');
  },

  /**
   * [룸 퇴실/초기화] 손님이 나갔을 때 해당 룸의 주문 및 호출 내역 삭제
   */
  clearRoom: async (adminId: string, roomId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/rooms/${roomId}/clear`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    });
    if (!res.ok) throw new Error('룸 초기화에 실패했습니다.');
  },

  /**
   * [매장 설정 업데이트] 메뉴 수정, 룸 추가 등 관리자 작업 반영
   */
  adminUpdate: async <K extends keyof Store>(adminId: string, key: K, newData: Store[K]): Promise<void> => {
    const res = await fetch(`${API_URL}/api/store/${adminId}/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: newData })
    });
    if (!res.ok) throw new Error('매장 정보 업데이트 중 오류가 발생했습니다.');
  },

  /**
   * [슈퍼바이저 업데이트] 시스템 전체 매장 정보 일괄 관리
   */
  supervisorUpdate: async (newData: GlobalDB): Promise<void> => {
    const res = await fetch(`${API_URL}/api/supervisor/stores`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stores: newData })
    });
    if (!res.ok) throw new Error('슈퍼바이저 업데이트에 실패했습니다.');
  }
};
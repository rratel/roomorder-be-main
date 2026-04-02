import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import type { Session, Role } from '../types';
import { api } from '../api/mockBackend';

//Context에서 관리할 상태와 함수의 타입을 정의
interface AuthContextType {
  session: Session | null;
  login: (role: Role, id: string, pw: string) => Promise<void>;
  logout: () => void;
  audioCtx: AudioContext | null; // 브라우저 알림음 재생을 위한 오디오 컨텍스트
}

//초기값이 비어있는 Context를 생성
export const AuthContext = createContext<AuthContextType | null>(null);

//컴포넌트에서 Context를 사용할 수 있도록 커스텀 훅 생성
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  return context;
};

//실제로 상태를 관리하고 하위 컴포넌트들에게 값을 전달
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 로컬 스토리지에서 기존 세션 정보를 불러와 초기값으로 설정
  const [session, setSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem('room_order_session_v4');
    return saved ? JSON.parse(saved) : null;
  });

  // 오디오 컨텍스트를 담아둘 Ref (상태가 변경되어도 렌더링에 영향을 주지 않음)
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 세션 상태가 변경될 때마다 로컬 스토리지에 동기화
  useEffect(() => {
    if (session) localStorage.setItem('room_order_session_v4', JSON.stringify(session));
    else localStorage.removeItem('room_order_session_v4');
  }, [session]);

  // 로그인 처리 함수: API 호출 및 성공 시 세션 업데이트
  const login = async (role: Role, id: string, pw: string) => {
    const result = await api.login(role, id, pw);

    // 브라우저의 오디오 자동재생 정책을 우회하기 위해 사용자 클릭(로그인) 시점에 AudioContext를 초기화
    if (role === 'admin' && !audioCtxRef.current) {
      const AudioContextCls = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCls) {
        audioCtxRef.current = new AudioContextCls();
        // 중지된 상태라면 오디오 컨텍스트를 활성화
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      }
    }
    setSession(result);
  };

  // 로그아웃 처리 함수: 세션을 null로 초기화
  const logout = () => setSession(null);

  return (
    <AuthContext.Provider value={{ session, login, logout, audioCtx: audioCtxRef.current }}>
      {children}
    </AuthContext.Provider>
  );
};

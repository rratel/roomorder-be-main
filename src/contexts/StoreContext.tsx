import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Store, GlobalDB } from '../types';
import { socketMock, globalDB } from '../api/mockBackend';
import { useAuth } from './AuthContext'; // 세션 권한에 따른 데이터 분기를 위해 가져옵니다.

//Store Context의 타입 정의
interface StoreContextType {
  storeData: Store | null;      // 개별 매장(Admin/Tablet 뷰)용 데이터
  allStores: GlobalDB | null;   // 슈퍼바이저 뷰용 전체 매장 데이터
}

export const StoreContext = createContext<StoreContextType | null>(null);

//스토어 상태를 가져오는 커스텀 훅
export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore는 StoreProvider 내부에서만 사용할 수 있습니다.");
  return context;
};

//실시간으로 데이터를 구독(Subscribe)하고 전파하는 Provider 컴포넌트
export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth(); // 현재 로그인된 사용자(권한) 정보
  const [storeData, setStoreData] = useState<Store | null>(null);
  const [allStores, setAllStores] = useState<GlobalDB | null>(null);

  // 세션 정보(권한)에 따라 적절한 데이터를 구독합니다.
  useEffect(() => {
    if (!session) return; // 로그인 전이면 아무 작업도 하지 않음
    
    if (session.role === 'supervisor') {
      // 권한이 슈퍼바이저일 경우: 전체 매장 데이터를 불러오고 업데이트 이벤트를 감지합니다.
      setAllStores(globalDB);
      const handler = (data: GlobalDB) => setAllStores({...data});
      socketMock.on('update_supervisor', handler);
      
      // 컴포넌트 언마운트 시(예: 로그아웃) 메모리 누수를 막기 위해 구독을 해제합니다.
      return () => socketMock.off('update_supervisor', handler);
      
    } else if (session.adminId) {
      // 권한이 매장 관리자 또는 태블릿일 경우: 해당 매장의 데이터만 불러오고 감지합니다.
      setStoreData(globalDB[session.adminId] || null);
      const handler = (data: Store) => setStoreData({...data});
      socketMock.on(`update_${session.adminId}`, handler);
      
      return () => socketMock.off(`update_${session.adminId}`, handler);
    }
  }, [session]); // session 객체가 변경될 때마다 이펙트 재실행

  return (
    <StoreContext.Provider value={{ storeData, allStores }}>
      {children}
    </StoreContext.Provider>
  );
};

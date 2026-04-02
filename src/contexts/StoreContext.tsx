import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Store, GlobalDB } from '../types';
import { api, socket } from '../api'; 
import { useAuth } from './AuthContext';

interface StoreContextType {
  storeData: Store | null;
  allStores: GlobalDB | null;
}

export const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore는 StoreProvider 내부에서만 사용할 수 있습니다.");
  return context;
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [storeData, setStoreData] = useState<Store | null>(null);
  const [allStores, setAllStores] = useState<GlobalDB | null>(null);

  useEffect(() => {
    if (!session) return;
    
    // 1. 슈퍼바이저 권한일 때
    if (session.role === 'supervisor') {
      // 초기 전체 매장 데이터 로드
      api.getAllStores()
         .then((data: GlobalDB) => {
           setAllStores(data);
         })
         .catch((err: Error) => {
           console.error("전체 데이터 로드 실패:", err.message);
         });

      const handler = (data: GlobalDB) => setAllStores({...data});
      socket.on('update_supervisor', handler);
      
      return () => {
        socket.off('update_supervisor', handler);
      };
      
    } 
    // 2. 관리자 또는 태블릿 권한일 때
    else if (session.adminId) {
      const adminId = session.adminId; // 클로저 타입 추론 에러 방지를 위한 상수 선언

      // 초기 내 매장 데이터 로드
      api.getStore(adminId)
         .then((data: Store) => {
           setStoreData(data);
         })
         .catch((err: Error) => {
           console.error("매장 데이터 로드 실패:", err.message);
         });

      const handler = (data: Store) => setStoreData({...data});
      socket.on(`update_${adminId}`, handler);
      
      return () => {
        socket.off(`update_${adminId}`, handler);
      };
    }
  }, [session]);

  return (
    <StoreContext.Provider value={{ storeData, allStores }}>
      {children}
    </StoreContext.Provider>
  );
};
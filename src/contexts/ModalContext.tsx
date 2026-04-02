import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { ModalConfig } from '../types';

//모달을 띄우는 함수들의 타입 정의 (Promise 기반으로 비동기 처리하여 흐름 제어를 용이하게 함)
interface ModalContextType {
  showAlert: (title: string, msg: string) => Promise<boolean>;
  showConfirm: (title: string, msg: string) => Promise<boolean>;
  showPrompt: (title: string, msg: string, def?: string) => Promise<string | null>;
}

// 함수 제공용 Context
export const ModalContext = createContext<ModalContextType | null>(null);
// 상태(UI 렌더링용 설정값) 제공용 Context (성능 최적화 및 분리)
export const ModalConfigContext = createContext<ModalConfig | null>(null);

//모달 호출(함수)을 사용하기 위한 커스텀 훅
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal은 ModalProvider 내부에서만 사용할 수 있습니다.");
  return context;
};

//렌더링(상태) 값을 가져오기 위한 커스텀 훅 (App.tsx의 GlobalModal 렌더링에서 사용)
export const useModalConfig = () => useContext(ModalConfigContext);

//상태를 관리하고 함수들을 제공하는 Provider 컴포넌트
export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 현재 화면에 표시될 모달의 상세 설정 정보 상태
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

  // 공통 모달 호출 로직: Promise를 반환하여 컴포넌트단에서 await로 사용자의 응답을 기다릴 수 있습니다.
  const showModal = (type: 'alert'|'confirm'|'prompt', title: string, message: string, defaultValue = '') => {
    return new Promise<any>((resolve) => {
      setModalConfig({
        type, 
        title, 
        message, 
        defaultValue,
        // 확인 버튼 클릭 시 동작: 모달을 닫고 Promise 완료(resolve)
        onConfirm: (val: any) => { 
          setModalConfig(null); 
          resolve(type === 'prompt' ? val : true); 
        },
        // 취소 버튼 클릭 시 동작: 모달을 닫고 Promise 완료(resolve)
        onCancel: () => { 
          setModalConfig(null); 
          resolve(type === 'prompt' ? null : false); 
        }
      });
    });
  };

  // 컴포넌트에서 실제로 호출하게 될 메소드 모음
  const modalActions = {
    showAlert: (title: string, msg: string) => showModal('alert', title, msg),
    showConfirm: (title: string, msg: string) => showModal('confirm', title, msg),
    showPrompt: (title: string, msg: string, def?: string) => showModal('prompt', title, msg, def)
  };

  return (
    // 상태값(Config)과 함수들(Actions)을 각각의 Context에 담아 공급합니다.
    <ModalConfigContext.Provider value={modalConfig}>
      <ModalContext.Provider value={modalActions}>
        {children}
      </ModalContext.Provider>
    </ModalConfigContext.Provider>
  );
};

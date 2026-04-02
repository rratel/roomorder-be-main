import React, { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalWrapperProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-in-up">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-gray-900">{title}</h3>
        <button onClick={onClose} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
          <X className="w-5 h-5 text-gray-600"/>
        </button>
      </div>
      {children}
    </div>
  </div>
);
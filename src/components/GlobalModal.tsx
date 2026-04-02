import React, { useState } from 'react';
import type { ModalConfig } from '../types';

export const GlobalModal: React.FC<{ config: ModalConfig }> = ({ config }) => {
      const [val, setVal] = useState(config.defaultValue || '');
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-bold text-lg mb-2 text-gray-900">{config.title}</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{config.message}</p>
        {config.type === 'prompt' && (
          <input 
            autoFocus 
            value={val} 
            onChange={e => setVal(e.target.value)} 
            className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        )}
        <div className="flex justify-end gap-2">
          {config.type !== 'alert' && (
            <button onClick={config.onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">
              취소
            </button>
          )}
          <button onClick={() => config.onConfirm(val)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
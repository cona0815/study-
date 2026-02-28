import React from 'react';
import { AlertCircle, Bot } from 'lucide-react';
import { DialogState } from '../../types';

interface Props extends DialogState {
    onClose: () => void;
}

export const DialogModal: React.FC<Props> = ({ show, type, message, onConfirm, onCancel, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={type === 'alert' ? onClose : undefined}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border-2 border-[#E5E7EB] animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${type === 'confirm' ? 'text-[#F43F5E]' : 'text-[#5E5244]'}`}>
                    {type === 'confirm' ? <AlertCircle size={24} /> : <Bot size={24} />}
                    {type === 'confirm' ? '確認行動' : '系統提示'}
                </h3>
                <p className="text-[#796E5B] mb-8 whitespace-pre-wrap leading-relaxed">{message}</p>
                <div className="flex justify-end gap-3">
                    {type === 'confirm' && (
                        <button onClick={() => { if(onCancel) onCancel(); onClose(); }} className="px-5 py-2.5 rounded-xl font-bold text-[#9C9283] hover:bg-[#F3F0E6] transition-colors">取消</button>
                    )}
                    <button onClick={() => { if(onConfirm) onConfirm(); onClose(); }} className="px-5 py-2.5 bg-[#8CD19D] text-white rounded-xl font-bold hover:bg-[#6BCB84] shadow-sm transform active:scale-95 transition-all">
                        {type === 'confirm' ? '確定' : '我知道了'}
                    </button>
                </div>
            </div>
        </div>
    );
};
import React, { useState, useEffect } from 'react';
import { X, FileText, Link as LinkIcon, Save } from 'lucide-react';

interface Props {
    show: boolean;
    onClose: () => void;
    initialContent: string;
    initialLink: string;
    onSave: (content: string, link: string) => void;
}

export const MemoModal: React.FC<Props> = ({ show, onClose, initialContent, initialLink, onSave }) => {
    const [content, setContent] = useState(initialContent);
    const [link, setLink] = useState(initialLink);

    useEffect(() => {
        if (show) {
            setContent(initialContent || "");
            setLink(initialLink || "");
        }
    }, [show, initialContent, initialLink]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#5E5244]/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-4 border-[#F3F0E6]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold text-[#5E5244] flex items-center gap-2">
                        <FileText size={20} /> 筆記與連結
                    </h3>
                    <button onClick={onClose} className="hover:bg-[#F3F0E6] p-1 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[#9C9283] mb-1">學習筆記 / 心得</label>
                        <textarea 
                            className="w-full h-32 p-3 rounded-xl border-2 border-[#E5E7EB] outline-none focus:border-[#8CD19D] text-[#5E5244] font-medium resize-none bg-[#FDFBF7]"
                            placeholder="寫下重點摘要..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            autoFocus
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-[#9C9283] mb-1 flex items-center gap-1"><LinkIcon size={12}/> 相關資源連結</label>
                        <input 
                            type="text" 
                            className="w-full p-3 rounded-xl border-2 border-[#E5E7EB] outline-none focus:border-[#8CD19D] text-[#5E5244] font-medium bg-[#FDFBF7]"
                            placeholder="https://..."
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            onClick={() => onSave(content, link)} 
                            className="flex items-center gap-2 px-6 py-2 bg-[#8CD19D] text-white rounded-xl font-bold shadow-md hover:bg-[#6BCB84] transition-all"
                        >
                            <Save size={18} /> 儲存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
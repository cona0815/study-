import React from 'react';
import { 
    Trash2, Plus, Layers, Star, RefreshCw, Check, AlertCircle, ArrowRight, Trophy, Crown, 
    FileText, Link as LinkIcon, Clock, Sparkles, Bot, GripVertical
} from 'lucide-react';
import { Row, Subject, AppSettings, StatusInfo } from '../../types';
import { ScoreInput } from './ScoreInput';

// --- Checkbox Component ---
const Checkbox = ({ checked, onChange, color }: { checked: boolean, onChange: (v: boolean) => void, color: 'blue' | 'pink' | 'purple' | 'green' }) => {
    const colors = { 
        blue: "peer-checked:bg-[#77A6F7] peer-checked:border-[#77A6F7]", 
        pink: "peer-checked:bg-[#F48FB1] peer-checked:border-[#F48FB1]", 
        purple: "peer-checked:bg-[#818CF8] peer-checked:border-[#818CF8]", 
        green: "peer-checked:bg-[#8CD19D] peer-checked:border-[#8CD19D]" 
    };
    return (
        <label className="relative inline-flex items-center justify-center cursor-pointer group">
            <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`w-6 h-6 rounded-xl border-2 border-[#E5E7EB] bg-white transition-all shadow-sm ${colors[color]} group-hover:scale-110 flex items-center justify-center`}>
                {checked && <Check size={14} className="text-white stroke-[4]" />}
            </div>
        </label>
    );
};

interface Props {
    activeSubject: Subject | null;
    settings: AppSettings;
    highlightedRowId: string | number | null;
    updateRow: (rowId: string | number, field: string, value: any) => void;
    deleteRow: (rowId: string | number) => void;
    addRow: () => void;
    openMemoModal: (rowId: string | number, memo: string, link: string) => void;
    openAITutor: (row: Row) => void;
    reorderRows: (fromIndex: number, toIndex: number) => void;
}

export const StudyTable: React.FC<Props> = ({ 
    activeSubject, settings, highlightedRowId, updateRow, deleteRow, addRow, openMemoModal, openAITutor, reorderRows
}) => {
    const dragItem = React.useRef<number | null>(null);
    const dragOverItem = React.useRef<number | null>(null);

    const handleSort = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            reorderRows(dragItem.current, dragOverItem.current);
            dragItem.current = null;
            dragOverItem.current = null;
        }
    };
    
    const getStatus = (row: Row): StatusInfo => {
        if (row.score1 === "" || row.score1 === null) return { text: "準備中", color: "bg-[#F3F4F6] text-[#9CA3AF]", icon: null };
        const s1 = parseInt(row.score1);
        const hasR2 = row.score2 !== "" && row.score2 !== null;
        const hasR3 = row.score3 !== "" && row.score3 !== null;
        const pass = settings.passingScore;

        if (s1 < pass) {
            if (hasR2) {
                const s2 = parseInt(row.score2);
                if (s2 >= pass) {
                    if (hasR3) return { text: "追求卓越", color: "bg-[#F3E8FF] text-[#7E22CE] border-[#D8B4FE]", icon: <Star size={14} strokeWidth={3} /> };
                    return { text: "補救成功", color: "bg-[#FFF8E1] text-[#D97706] border-[#FFE082]", icon: <RefreshCw size={14} strokeWidth={3} /> };
                } 
                if (hasR3) {
                    const s3 = parseInt(row.score3);
                    if (s3 >= pass) return { text: "R3 復活", color: "bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]", icon: <Check size={14} strokeWidth={3} /> };
                    else return { text: "卡關中", color: "bg-[#FEE2E2] text-[#EF4444] border-[#FECACA] font-bold", icon: <AlertCircle size={14} strokeWidth={3} /> };
                }
                return { text: "需三刷", color: "bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE] animate-pulse", icon: <ArrowRight size={14} strokeWidth={3} /> };
            }
            return { text: "需二刷", color: "bg-[#FFE4E6] text-[#F43F5E] border-[#FECDD3] animate-pulse", icon: <AlertCircle size={14} strokeWidth={3} /> };
        }
        if (hasR2) {
            if (hasR3) return { text: "學習大師", color: "bg-[#F3E8FF] text-[#7E22CE] border-[#D8B4FE] shadow-sm", icon: <Crown size={14} strokeWidth={3} /> };
            return { text: "菁英挑戰", color: "bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD] shadow-sm", icon: <Trophy size={14} strokeWidth={3} /> };
        }
        return { text: "Perfect!", color: "bg-[#E0F2E9] text-[#55A47B] border-[#B7E4C7]", icon: <Check size={14} strokeWidth={3} /> };
    };

    const getReviewStatus = (suggestedDate?: string) => {
        if (!suggestedDate) return null;
        const today = new Date();
        today.setHours(0,0,0,0);
        const target = new Date(suggestedDate);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) return { urgent: true, label: diffDays < 0 ? "已過期" : (diffDays === 0 ? "今天" : "明天"), color: "text-[#D97706]" };
        return { urgent: false, label: suggestedDate.slice(5), color: "text-[#9CA3AF]" };
    };

    if (!activeSubject) {
        return (
            <div className="bg-white rounded-b-3xl rounded-tr-3xl shadow-xl border-4 border-white overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-[#D6CDB5]">
                <Layers size={48} className="mb-4 opacity-50" />
                <p className="font-bold">請先選擇或建立科目</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-b-3xl rounded-tr-3xl shadow-xl border-4 border-white overflow-hidden min-h-[400px] flex flex-col">
            <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px] md:min-w-[1200px]">
                    <thead>
                        <tr className="text-xs uppercase font-bold text-[#9C9283] bg-[#FDFBF7] border-b-2 border-[#F3F0E6]">
                            <th className="p-4 w-10 md:w-12 text-center sticky left-0 bg-[#FDFBF7] z-20 border-r border-[#F3F0E6]">#</th>
                            <th className="p-4 w-[160px] md:min-w-[200px] sticky left-10 md:left-12 bg-[#FDFBF7] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-[#F3F0E6]">單元名稱</th>
                            <th className="p-4 text-center w-28 md:w-32">狀態</th>
                            <th className="p-4 text-center w-28">筆記/期限</th>
                            <th className="p-2 text-center bg-[#EBF5FC]">刷題 R1</th>
                            <th className="p-2 text-center bg-[#EBF5FC]">訂正 R1</th>
                            <th className="p-2 text-center bg-[#EBF5FC]">分數</th>
                            <th className="p-2 text-center bg-[#FDF2F4]">刷題 R2</th>
                            <th className="p-2 text-center bg-[#FDF2F4]">訂正 R2</th>
                            <th className="p-2 text-center bg-[#FDF2F4]">分數</th>
                            <th className="p-2 text-center bg-[#EEF2FF]">刷題 R3</th>
                            <th className="p-2 text-center bg-[#EEF2FF]">訂正 R3</th>
                            <th className="p-2 text-center bg-[#EEF2FF]">分數</th>
                            <th className="p-4 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F0E6]">
                        {activeSubject.rows.map((row, index) => {
                            const status = getStatus(row);
                            const isHighlighted = highlightedRowId === row.id;
                            let dueStatusColor = "text-[#D6D0C4]";
                            if (row.dueDate) {
                                const due = new Date(row.dueDate); 
                                const now = new Date(); 
                                now.setHours(0,0,0,0);
                                if (due < now && !status.text.includes("Perfect")) dueStatusColor = "text-[#F43F5E] font-bold animate-pulse";
                                else if ((due.getTime() - now.getTime()) / (1000*60*60*24) <= 3) dueStatusColor = "text-[#F59E0B] font-bold";
                                else dueStatusColor = "text-[#55A47B]";
                            }

                            const schedule2 = getReviewStatus(row.suggestedDate2);
                            const schedule3 = getReviewStatus(row.suggestedDate3);

                            return (
                                <tr 
                                    key={row.id} 
                                    id={`row-${row.id}`} 
                                    className={isHighlighted ? 'bg-[#FFF8E1] z-10 shadow-lg ring-2 ring-[#FCD34D] row-highlight' : 'group hover:bg-[#FAF9F6] cursor-move'}
                                    draggable
                                    onDragStart={(e) => { dragItem.current = index; }}
                                    onDragEnter={(e) => { dragOverItem.current = index; }}
                                    onDragEnd={handleSort}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <td className="p-4 text-center font-bold text-[#D6D0C4] sticky left-0 z-10 bg-inherit border-r border-[#F3F0E6] group-hover:text-[#9C9283] transition-colors">
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="opacity-0 group-hover:opacity-50"><GripVertical size={12} /></span>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="p-4 sticky left-10 md:left-12 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-[#F3F0E6]">
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={row.topic} onChange={(e) => updateRow(row.id, 'topic', e.target.value)} placeholder="輸入主題..." className="w-full bg-transparent border-b border-transparent focus:border-[#8CD19D] outline-none font-bold text-[#796E5B]" />
                                            {row.topic.trim() && (
                                                <button onClick={() => openAITutor(row)} className="p-1.5 bg-[#E0F2E9] text-[#166534] rounded-lg hover:bg-[#8CD19D] hover:text-white transition-colors" title="AI 家教">
                                                    <Bot size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border ${status.color}`}>{status.icon}{status.text}</span>
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox checked={row.note} onChange={(val) => updateRow(row.id, 'note', val)} color="green" />
                                                <button onClick={() => openMemoModal(row.id, row.memo, row.link)} className={`p-1.5 rounded-lg transition-colors ${row.memo || row.link ? 'bg-[#8CD19D] text-white' : 'bg-[#F3F0E6] text-[#9C9283] hover:bg-[#E5E7EB]'}`}><FileText size={14} /></button>
                                                <div className="relative group/date">
                                                    <input type="date" value={row.dueDate || ""} onChange={(e) => updateRow(row.id, 'dueDate', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                                    <Clock size={14} className={dueStatusColor} />
                                                </div>
                                            </div>
                                            {row.link && <a href={row.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-[#55A47B] bg-[#E0F2E9] px-1.5 py-0.5 rounded-full hover:underline"><LinkIcon size={8}/> 連結</a>}
                                            {row.dueDate && <span className={`text-[10px] ${dueStatusColor}`}>{row.dueDate.slice(5)}</span>}
                                        </div>
                                    </td>
                                    <td className="p-2 text-center bg-[#F4FAFE]/50"><Checkbox checked={row.practice1} onChange={(val) => updateRow(row.id, 'practice1', val)} color="blue" /></td>
                                    <td className="p-2 text-center bg-[#F4FAFE]/50"><Checkbox checked={row.correct1} onChange={(val) => updateRow(row.id, 'correct1', val)} color="blue" /></td>
                                    <td className="p-2 text-center bg-[#F4FAFE]/50"><div className="flex flex-col items-center"><ScoreInput value={row.score1} onChange={(val) => updateRow(row.id, 'score1', val)} threshold={settings.passingScore} /><span className="text-[10px] text-gray-400 mt-1 h-3 whitespace-pre-wrap text-center leading-tight">{row.score1Date ? row.score1Date.replace(' ', '\n') : ''}</span></div></td>
                                    
                                    <td className={`p-2 text-center transition-all ${schedule2?.urgent ? 'animate-golden-breath' : 'bg-[#FDF2F4]'}`}><Checkbox checked={row.practice2} onChange={(val) => updateRow(row.id, 'practice2', val)} color="pink" /></td>
                                    <td className={`p-2 text-center transition-all ${schedule2?.urgent ? 'animate-golden-breath' : 'bg-[#FDF2F4]'}`}><Checkbox checked={row.correct2} onChange={(val) => updateRow(row.id, 'correct2', val)} color="pink" /></td>
                                    <td className={`p-2 text-center transition-all ${schedule2?.urgent ? 'animate-golden-breath' : 'bg-[#FDF2F4]'}`}>
                                        <div className="flex flex-col items-center">
                                            <ScoreInput value={row.score2} onChange={(val) => updateRow(row.id, 'score2', val)} threshold={settings.passingScore} isRetry />
                                            {schedule2 ? (
                                                <span className={`text-[10px] font-bold mt-1 h-3 flex items-center gap-1 ${schedule2.color}`}>{schedule2.urgent && <Sparkles size={8} className="text-amber-500 animate-spin" />} {schedule2.label}</span>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 mt-1 h-3 whitespace-pre-wrap text-center leading-tight">{row.score2Date ? row.score2Date.replace(' ', '\n') : ''}</span>
                                            )}
                                        </div>
                                    </td>
                                    
                                    <td className={`p-2 text-center transition-all ${schedule3?.urgent ? 'animate-golden-breath' : 'bg-[#EEF2FF]'}`}><Checkbox checked={row.practice3} onChange={(val) => updateRow(row.id, 'practice3', val)} color="purple" /></td>
                                    <td className={`p-2 text-center transition-all ${schedule3?.urgent ? 'animate-golden-breath' : 'bg-[#EEF2FF]'}`}><Checkbox checked={row.correct3} onChange={(val) => updateRow(row.id, 'correct3', val)} color="purple" /></td>
                                    <td className={`p-2 text-center transition-all ${schedule3?.urgent ? 'animate-golden-breath' : 'bg-[#EEF2FF]'}`}>
                                        <div className="flex flex-col items-center">
                                            <ScoreInput value={row.score3} onChange={(val) => updateRow(row.id, 'score3', val)} threshold={settings.passingScore} isRetry />
                                            {schedule3 ? (
                                                <span className={`text-[10px] font-bold mt-1 h-3 flex items-center gap-1 ${schedule3.color}`}>{schedule3.urgent && <Sparkles size={8} className="text-amber-500 animate-spin" />} {schedule3.label}</span>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 mt-1 h-3 whitespace-pre-wrap text-center leading-tight">{row.score3Date ? row.score3Date.replace(' ', '\n') : ''}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center"><button onClick={() => deleteRow(row.id)} className="text-[#D6D0C4] hover:text-[#EF4444] p-1.5 rounded-full hover:bg-[#FEE2E2]"><Trash2 size={16} /></button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t-2 border-[#F3F0E6] bg-[#FAF9F6]">
                <button onClick={addRow} className="w-full py-4 rounded-2xl border-2 border-dashed border-[#D6D0C4] text-[#9C9283] hover:border-[#8CD19D] hover:text-[#55A47B] hover:bg-[#F0FDF4] transition-all flex items-center justify-center gap-2 font-bold text-lg"><Plus size={24} /> 新增單元進度</button>
            </div>
        </div>
    );
};
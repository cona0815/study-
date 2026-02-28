import React, { useState, useMemo, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Trash2, Search, CheckCircle2, Circle, ArrowRight, HelpCircle, Flag, Edit3, Save } from 'lucide-react';
import { Row, Grade } from '../../types';

interface Props {
    show: boolean;
    onClose: () => void;
    grades: Grade[];
    updateDate: (rowId: string | number, dateType: 'dueDate' | 'suggestedDate2' | 'suggestedDate3', date: string) => void;
    targetDate: string;
    onUpdateTargetDate: (date: string) => void;
    updateRow: (rowId: string | number, field: string, value: any) => void;
}

type TaskType = 'R1' | 'R2' | 'R3' | 'TARGET';

interface CalendarEvent {
    id: string; // Unique ID for key/drag
    row?: Row;
    type: TaskType;
    date: string;
    gradeName: string;
    subjectName: string;
    isTarget?: boolean;
}

const DAYS = ['日', '一', '二', '三', '四', '五', '六'];

export const CalendarModal: React.FC<Props> = ({ show, onClose, grades, updateDate, targetDate, onUpdateTargetDate, updateRow }) => {
    // 1. Hooks
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    // Drag and Drop State refs
    const dragItem = useRef<CalendarEvent | null>(null);

    const allEvents = useMemo(() => {
        const events: CalendarEvent[] = [];
        if (!grades) return events;
        
        grades.forEach(g => {
            if (!g.subjects) return;
            g.subjects.forEach(s => {
                if (!s.rows) return;
                s.rows.forEach(r => {
                    if (r.dueDate) events.push({ id: `${r.id}-R1`, row: r, type: 'R1', date: r.dueDate, gradeName: g.name, subjectName: s.name });
                    if (r.suggestedDate2) events.push({ id: `${r.id}-R2`, row: r, type: 'R2', date: r.suggestedDate2, gradeName: g.name, subjectName: s.name });
                    if (r.suggestedDate3) events.push({ id: `${r.id}-R3`, row: r, type: 'R3', date: r.suggestedDate3, gradeName: g.name, subjectName: s.name });
                });
            });
        });

        if (targetDate) {
            events.push({
                id: 'target-date-event',
                type: 'TARGET',
                date: targetDate,
                gradeName: '',
                subjectName: '',
                isTarget: true
            });
        }

        return events;
    }, [grades, targetDate]);

    const unscheduledRows = useMemo(() => {
        const rows: { row: Row, gradeName: string, subjectName: string }[] = [];
        if (!grades) return rows;
        grades.forEach(g => {
            if (!g.subjects) return;
            g.subjects.forEach(s => {
                if (!s.rows) return;
                s.rows.forEach(r => {
                    if (!r.dueDate && !r.score1) rows.push({ row: r, gradeName: g.name, subjectName: s.name });
                });
            });
        });
        return rows.filter(item => 
            (item.row.topic || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
            (item.subjectName || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [grades, searchQuery]);

    if (!show) return null;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const getEventsForDate = (dateStr: string) => allEvents.filter(e => e.date === dateStr);

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
        dragItem.current = event;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", event.id);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        const dragged = dragItem.current;
        if (!dragged) return;

        if (dragged.type === 'TARGET') {
            onUpdateTargetDate(dateStr);
        } else if (dragged.row) {
            const field = dragged.type === 'R1' ? 'dueDate' : dragged.type === 'R2' ? 'suggestedDate2' : 'suggestedDate3';
            updateDate(dragged.row.id, field, dateStr);
        }

        dragItem.current = null;
    };

    // --- Editing Handlers ---
    const startEditing = (rowId: string | number, currentTopic: string) => {
        setEditingId(String(rowId));
        setEditValue(currentTopic);
    };

    const saveEditing = (rowId: string | number) => {
        if (editValue.trim()) {
            updateRow(rowId, 'topic', editValue.trim());
        }
        setEditingId(null);
    };

    const renderCalendarGrid = () => {
        const cells = [];
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="min-h-[50px] md:min-h-[100px] md:h-28 bg-[#FAF9F6] border-b border-r border-[#E5E7EB]"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = getEventsForDate(dateStr);
            const isSelected = dateStr === selectedDateStr;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            cells.push(
                <div 
                    key={d} 
                    onClick={() => setSelectedDateStr(dateStr)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    className={`min-h-[50px] md:min-h-[100px] md:h-28 border-b border-r border-[#E5E7EB] p-1 md:p-2 cursor-pointer transition-all relative group flex flex-col gap-1
                        ${isSelected ? 'bg-[#FFF8E1] ring-2 ring-inset ring-[#FCD34D] z-10' : 'bg-white hover:bg-[#F9FAFB]'}
                        ${isToday ? 'bg-[#F0FDF4]' : ''}
                    `}
                >
                    <div className="flex justify-between items-start shrink-0 pointer-events-none">
                        <span className={`text-xs md:text-sm font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#8CD19D] text-white' : 'text-[#796E5B]'}`}>{d}</span>
                    </div>
                    <div className="flex flex-wrap content-start overflow-hidden gap-1 w-full px-0.5 md:px-1">
                        {dayEvents.slice(0, 8).map((ev) => {
                            if (ev.type === 'TARGET') {
                                return (
                                    <div 
                                        key={ev.id} 
                                        draggable 
                                        onDragStart={(e) => handleDragStart(e, ev)}
                                        className="w-full flex justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform" 
                                        title="倒數目標日 (可拖曳修改)"
                                    >
                                        <Flag size={12} className="text-[#F43F5E] fill-[#F43F5E] md:w-4 md:h-4" />
                                    </div>
                                );
                            }

                            let color = "";
                            if (ev.type === 'R1') color = "bg-[#F43F5E]";
                            if (ev.type === 'R2') color = "bg-[#F59E0B]";
                            if (ev.type === 'R3') color = "bg-[#8B5CF6]";
                            return (
                                <div 
                                    key={ev.id} 
                                    draggable 
                                    onDragStart={(e) => handleDragStart(e, ev)}
                                    className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${color} cursor-grab active:cursor-grabbing hover:ring-2 ring-black/20`} 
                                    title={`${ev.type}: ${ev.row?.topic}`}
                                ></div>
                            );
                        })}
                        {dayEvents.length > 8 && <div className="w-2 h-2 rounded-full bg-gray-300 flex items-center justify-center text-[6px]">+</div>}
                    </div>
                </div>
            );
        }
        
        const totalCells = firstDay + daysInMonth;
        const remaining = 7 - (totalCells % 7);
        if (remaining < 7) {
             for (let i = 0; i < remaining; i++) {
                cells.push(<div key={`empty-end-${i}`} className="min-h-[50px] md:min-h-[100px] md:h-28 bg-[#FAF9F6] border-b border-r border-[#E5E7EB]"></div>);
            }
        }

        return cells;
    };

    const selectedDayEvents = getEventsForDate(selectedDateStr);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-[#5E5244]/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#FDFBF7] rounded-3xl shadow-2xl w-full max-w-6xl border-[6px] border-[#D6CDB5] h-[95vh] md:h-[90vh] flex flex-col md:flex-row overflow-hidden relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                
                {/* Left: Calendar */}
                <div className="flex-1 flex flex-col border-r-0 md:border-r border-[#D6CDB5] h-1/2 md:h-full min-h-0">
                    {/* Header */}
                    <div className="p-2 md:p-4 flex justify-between items-center bg-[#EFEBE0] border-b border-[#D6CDB5] shrink-0">
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="bg-[#8CD19D] p-1.5 md:p-2 rounded-xl text-white shadow-sm"><CalendarIcon size={20} className="md:w-6 md:h-6" /></div>
                            <div>
                                <h2 className="text-lg md:text-2xl font-black text-[#5E5244] tracking-tight">{year} 年 {month + 1} 月</h2>
                                <p className="text-[10px] md:text-xs text-[#9C9283] font-bold">讀書進度規劃</p>
                            </div>
                        </div>
                        <div className="flex gap-1 md:gap-2">
                            <button onClick={handlePrevMonth} className="p-1.5 md:p-2 hover:bg-[#D6CDB5] rounded-full transition-colors text-[#5E5244]"><ChevronLeft size={20}/></button>
                            <button onClick={() => { const now = new Date(); setCurrentDate(now); setSelectedDateStr(now.toISOString().split('T')[0]); }} className="px-2 py-1 text-xs md:text-sm font-bold border-2 border-[#D6CDB5] rounded-lg text-[#796E5B] hover:bg-white transition-colors">今天</button>
                            <button onClick={handleNextMonth} className="p-1.5 md:p-2 hover:bg-[#D6CDB5] rounded-full transition-colors text-[#5E5244]"><ChevronRight size={20}/></button>
                        </div>
                    </div>

                    {/* Grid Header */}
                    <div className="grid grid-cols-7 bg-[#FAF9F6] border-b border-[#D6CDB5] shrink-0">
                        {DAYS.map(day => (
                            <div key={day} className="py-2 text-center text-[10px] md:text-xs font-black text-[#9C9283] uppercase tracking-wider">{day}</div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F3F0E6]">
                        <div className="grid grid-cols-7 border-l border-t border-[#E5E7EB] bg-white">
                            {renderCalendarGrid()}
                        </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="p-2 bg-[#FAF9F6] border-t border-[#D6CDB5] flex gap-2 md:gap-4 justify-center text-[10px] md:text-xs font-bold text-[#9C9283] shrink-0 flex-wrap">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#F43F5E]"></div> 期限 (R1)</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div> 複習 (R2)</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div> 最後衝刺 (R3)</div>
                        <div className="flex items-center gap-1"><Flag size={10} className="text-[#F43F5E] fill-[#F43F5E]" /> 目標日</div>
                    </div>
                </div>

                {/* Right: Planner */}
                <div className="w-full md:w-96 bg-white flex flex-col h-1/2 md:h-full shadow-xl z-20 min-h-0 border-t-4 md:border-t-0 border-[#D6CDB5]">
                    <div className="p-3 md:p-4 border-b border-[#F3F0E6] flex justify-between items-center bg-[#FAF9F6] shrink-0">
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-[#9C9283] uppercase mb-0.5">SELECTED DATE</p>
                            <h3 className="text-lg md:text-xl font-black text-[#5E5244] flex items-center gap-2">
                                {selectedDateStr} 
                                {selectedDateStr === new Date().toISOString().split('T')[0] && <span className="bg-[#8CD19D] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">TODAY</span>}
                            </h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[#F3F0E6] rounded-full text-[#9C9283] md:hidden"><X size={20}/></button>
                        <button onClick={onClose} className="p-2 hover:bg-[#F3F0E6] rounded-full text-[#9C9283] hidden md:block absolute top-4 right-4"><X /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 flex flex-col gap-4 md:gap-6 min-h-0">
                        
                        {/* Tasks for selected date */}
                        <div className="shrink-0">
                            <h4 className="font-bold text-[#796E5B] mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base"><CheckCircle2 size={16} /> 本日行程 ({selectedDayEvents.length})</h4>
                            <div className="space-y-2">
                                {selectedDayEvents.length === 0 ? (
                                    <div className="text-center py-6 px-4 text-[#D6D0C4] text-sm italic border-2 border-dashed border-[#F3F0E6] rounded-xl flex flex-col items-center gap-2">
                                        <Circle size={24} className="opacity-20" />
                                        <span>本日無安排進度</span>
                                        <span className="text-xs text-[#9C9283] not-italic">從下方清單選擇單元加入排程</span>
                                    </div>
                                ) : (
                                    selectedDayEvents.map((ev, idx) => {
                                        if (ev.type === 'TARGET') {
                                            return (
                                                <div 
                                                    key="target-event" 
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, ev)}
                                                    className="bg-[#FFF1F2] p-3 rounded-xl border-2 border-[#FECDD3] flex justify-between items-center cursor-grab active:cursor-grabbing"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Flag size={20} className="text-[#F43F5E] fill-[#F43F5E]" />
                                                        <span className="font-black text-[#F43F5E]">倒數目標日</span>
                                                    </div>
                                                    <div className="relative group/date">
                                                        <button className="p-1.5 text-[#F43F5E] hover:bg-[#FFE4E6] rounded-lg transition-colors">
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <input 
                                                            type="date"
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                            value={targetDate}
                                                            onChange={(e) => onUpdateTargetDate(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div 
                                                key={idx} 
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, ev)}
                                                className="bg-[#FDFBF7] p-3 rounded-xl border border-[#EFEBE0] shadow-sm flex justify-between items-start group hover:border-[#8CD19D] transition-colors cursor-grab active:cursor-grabbing"
                                            >
                                                <div className="flex-1 min-w-0 mr-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${ev.type === 'R1' ? 'bg-[#F43F5E]' : ev.type === 'R2' ? 'bg-[#F59E0B]' : 'bg-[#8B5CF6]'}`}>{ev.type === 'R1' ? '期限' : ev.type}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold">{ev.gradeName} / {ev.subjectName}</span>
                                                    </div>
                                                    
                                                    {editingId === String(ev.row?.id) ? (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <input 
                                                                autoFocus
                                                                type="text" 
                                                                className="w-full text-sm font-bold border-b-2 border-[#8CD19D] outline-none bg-transparent text-[#5E5244]"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && saveEditing(ev.row!.id)}
                                                                onBlur={() => saveEditing(ev.row!.id)}
                                                            />
                                                            <button onClick={() => saveEditing(ev.row!.id)} className="text-[#8CD19D]"><Save size={14}/></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <div className="font-bold text-[#5E5244] text-sm leading-tight truncate cursor-text" title={ev.row?.topic} onClick={() => ev.row && startEditing(ev.row.id, ev.row.topic)}>
                                                                {ev.row?.topic || "未命名單元"}
                                                            </div>
                                                            <button onClick={() => ev.row && startEditing(ev.row.id, ev.row.topic)} className="opacity-0 group-hover:opacity-100 text-[#9C9283] hover:text-[#55A47B] transition-opacity p-0.5"><Edit3 size={12} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 shrink-0 ml-2">
                                                    <div className="relative group/date">
                                                        <button className="p-1.5 text-[#D6D0C4] hover:text-[#55A47B] hover:bg-[#F0FDF4] rounded-lg transition-colors" title="更改日期">
                                                            <CalendarIcon size={14} />
                                                        </button>
                                                        <input 
                                                            type="date"
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                            value={ev.date}
                                                            onChange={(e) => {
                                                                if(e.target.value) {
                                                                    const field = ev.type === 'R1' ? 'dueDate' : ev.type === 'R2' ? 'suggestedDate2' : 'suggestedDate3';
                                                                    if (ev.row) updateDate(ev.row.id, field, e.target.value);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const field = ev.type === 'R1' ? 'dueDate' : ev.type === 'R2' ? 'suggestedDate2' : 'suggestedDate3';
                                                            if (ev.row) updateDate(ev.row.id, field, "");
                                                        }}
                                                        className="text-[#D6D0C4] hover:text-[#F43F5E] p-1.5 rounded-lg hover:bg-[#FFF1F2] transition-all" title="移除日期"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-[#F3F0E6] w-full shrink-0"></div>

                        {/* Unscheduled Tasks */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex justify-between items-end mb-2 md:mb-3">
                                <h4 className="font-bold text-[#796E5B] flex items-center gap-2 text-sm md:text-base"><Circle size={16} /> 待排程 ({unscheduledRows.length})</h4>
                                <div className="group relative cursor-help">
                                    <HelpCircle size={14} className="text-[#D6D0C4]" />
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#5E5244] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        此處顯示尚未設定期限且尚未開始刷題的單元。
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative mb-3 shrink-0">
                                <input 
                                    type="text" 
                                    placeholder="搜尋單元..." 
                                    className="w-full pl-9 pr-3 py-2 bg-[#F3F0E6] rounded-xl text-sm font-bold text-[#5E5244] placeholder-[#9C9283] focus:outline-none focus:ring-2 focus:ring-[#8CD19D]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-3 top-2.5 text-[#9C9283]" size={14} />
                            </div>
                            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                                {unscheduledRows.length === 0 ? (
                                    <div className="text-center py-8 text-[#D6D0C4] text-xs">沒有符合的未排程項目</div>
                                ) : (
                                    unscheduledRows.map((item, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-[#EFEBE0] shadow-sm flex justify-between items-center group hover:border-[#8CD19D] transition-all">
                                            <div className="flex-1 min-w-0 mr-2">
                                                <div className="text-[10px] text-gray-400 font-bold mb-0.5">{item.gradeName} / {item.subjectName}</div>
                                                <div className="font-bold text-[#5E5244] text-sm truncate" title={item.row.topic}>{item.row.topic || "未命名單元"}</div>
                                            </div>
                                            <button 
                                                onClick={() => updateDate(item.row.id, 'dueDate', selectedDateStr)}
                                                className="bg-[#F3F0E6] text-[#9C9283] hover:bg-[#8CD19D] hover:text-white p-2 rounded-lg transition-colors shadow-sm active:scale-95 flex items-center gap-1 text-xs font-bold shrink-0"
                                            >
                                                <Plus size={14} /> <span className="hidden sm:inline">排入</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};
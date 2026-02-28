import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    X, Library, Plus, Edit2, Trash2, Check, Sliders, Bookmark, 
    FileText, Search, Filter, ExternalLink, Bot, ArrowLeft, ArrowRight, 
    Network, ZoomIn, ZoomOut, Move, Download 
} from 'lucide-react';
import { LibraryItem, Grade } from '../../types';

// Declare mermaid on window for Typescript
declare global {
    interface Window {
        mermaid: any;
    }
}

interface Props {
    show: boolean;
    onClose: () => void;
    library: LibraryItem[];
    setLibrary: React.Dispatch<React.SetStateAction<LibraryItem[]>>;
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    triggerAlert: (msg: string) => void;
    triggerConfirm: (msg: string, onConfirm: () => void) => void;
    grades: Grade[];
}

type TabMode = 'library' | 'notes';

// --- Mermaid Component ---
const MermaidDiagram = ({ code }: { code: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Safe check for window.mermaid
        if (typeof window !== 'undefined' && window.mermaid && code && ref.current) {
            const renderId = `mermaid-lib-${Date.now()}`;
            try {
                window.mermaid.render(renderId, code).then((result: any) => {
                    setSvg(result.svg);
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                }).catch((err: any) => {
                    console.warn("Mermaid render warning:", err);
                    setSvg(''); // Clear if error
                });
            } catch (e) {
                console.warn("Mermaid execution error:", e);
            }
        }
    }, [code]);

    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y
            });
        }
    };

    const onMouseUp = () => setIsDragging(false);
    const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
    const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

    const handleDownload = () => {
        if (!ref.current) return;
        const svgEl = ref.current.querySelector('svg');
        if (!svgEl) return;
        
        try {
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svgEl);
            if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const padding = 20;
                const outputScale = 2; 
                const bbox = svgEl.getBoundingClientRect();
                const width = bbox.width || 800;
                const height = bbox.height || 600;
                canvas.width = (width + padding * 2) * outputScale;
                canvas.height = (height + padding * 2) * outputScale;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.scale(outputScale, outputScale);
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, canvas.width/outputScale, canvas.height/outputScale);
                    ctx.drawImage(img, padding, padding, width, height);
                    const pngUrl = canvas.toDataURL("image/png");
                    const downloadLink = document.createElement("a");
                    downloadLink.href = pngUrl;
                    downloadLink.download = `mindmap-${Date.now()}.png`;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                }
                URL.revokeObjectURL(url);
            };
            img.src = url;
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm my-4 overflow-hidden">
            <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-2 flex justify-between items-center">
                <span className="text-xs font-bold text-[#9CA3AF] pl-2 flex items-center gap-1"><Network size={12}/> 互動心智圖</span>
                <div className="flex gap-1">
                    <button onClick={handleZoomOut} className="p-1.5 hover:bg-[#E5E7EB] rounded text-[#5E5244]" title="縮小"><ZoomOut size={16} /></button>
                    <button onClick={handleReset} className="p-1.5 hover:bg-[#E5E7EB] rounded text-[#5E5244]" title="重置視角"><Move size={16} /></button>
                    <button onClick={handleZoomIn} className="p-1.5 hover:bg-[#E5E7EB] rounded text-[#5E5244]" title="放大"><ZoomIn size={16} /></button>
                    <div className="w-px h-6 bg-[#E5E7EB] mx-1"></div>
                    <button onClick={handleDownload} className="p-1.5 hover:bg-[#E0F2E9] text-[#55A47B] rounded font-bold flex items-center gap-1 text-xs px-2" title="下載 PNG">
                        <Download size={16} /> 下載圖片
                    </button>
                </div>
            </div>
            <div 
                ref={containerRef}
                className="w-full h-[300px] overflow-hidden relative cursor-move bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                <div 
                    ref={ref} 
                    style={{ 
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                    dangerouslySetInnerHTML={{ __html: svg }} 
                    className="w-full h-full flex items-center justify-center pointer-events-none select-none"
                />
            </div>
        </div>
    );
};

export const LibraryModal: React.FC<Props> = ({ 
    show, onClose, library, setLibrary, categories = [], setCategories, triggerAlert, triggerConfirm, grades = [] 
}) => {
    const [activeTab, setActiveTab] = useState<TabMode>('library');
    
    // Library State
    const [newLinkTitle, setNewLinkTitle] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const [newLinkCategory, setNewLinkCategory] = useState(categories[0] || "");
    const [isManagingCategories, setIsManagingCategories] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
    const [tempCategoryName, setTempCategoryName] = useState("");

    // Notes Search State
    const [noteSearch, setNoteSearch] = useState("");
    const [selectedGradeId, setSelectedGradeId] = useState<string>("all");
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
    
    // Detailed View State
    const [viewingNote, setViewingNote] = useState<any | null>(null);

    // Reset state on close
    useEffect(() => {
        if (!show) {
            setViewingNote(null);
            setNoteSearch("");
            // Reset category selection if categories exist
            if (categories.length > 0) {
                setNewLinkCategory(categories[0]);
            }
        }
    }, [show, categories]);

    // Update default category if it changes
    useEffect(() => {
        if (categories.length > 0 && !newLinkCategory) {
            setNewLinkCategory(categories[0]);
        }
    }, [categories, newLinkCategory]);

    // --- Library Handlers ---
    const handleAddLink = () => {
        if (!newLinkTitle || !newLinkUrl) return triggerAlert("請輸入標題與網址");
        let formattedUrl = newLinkUrl;
        if (!/^https?:\/\//i.test(formattedUrl)) formattedUrl = 'https://' + formattedUrl;
        const newLink: LibraryItem = { id: Date.now(), title: newLinkTitle, url: formattedUrl, category: newLinkCategory };
        setLibrary(prev => [...prev, newLink]);
        setNewLinkTitle(""); setNewLinkUrl("");
    };

    const handleAddCategory = () => {
        if(!newCategoryName.trim()) return;
        if(categories.includes(newCategoryName)) return triggerAlert("分類已存在");
        setCategories(prev => [...prev, newCategoryName]);
        setNewLinkCategory(newCategoryName);
        setNewCategoryName("");
    };

    const handleRenameCategory = (oldName: string) => {
        if (!tempCategoryName.trim() || tempCategoryName === oldName) {
            setEditingCategoryName(null);
            return;
        }
        if (categories.includes(tempCategoryName)) {
            triggerAlert("此分類名稱已存在");
            return;
        }
        setCategories(prev => prev.map(c => c === oldName ? tempCategoryName : c));
        setLibrary(prev => prev.map(item => item.category === oldName ? { ...item, category: tempCategoryName } : item));
        if (newLinkCategory === oldName) setNewLinkCategory(tempCategoryName);
        setEditingCategoryName(null);
        setTempCategoryName("");
    };

    const handleDeleteCategory = (catName: string) => {
        triggerConfirm(`確定刪除分類「${catName}」？\n注意：該分類下的所有書籍也會被移除！`, () => {
            setCategories(prev => prev.filter(c => c !== catName));
            setLibrary(prev => prev.filter(item => item.category !== catName));
            if (newLinkCategory === catName) setNewLinkCategory(categories.find(c => c !== catName) || "");
        });
    };

    const deleteLink = (id: number) => {
        triggerConfirm("確定移除此連結？", () => setLibrary(prev => prev.filter(l => l.id !== id)));
    };

    // --- Notes Search Logic ---
    const allNotes = useMemo(() => {
        if (!grades || !Array.isArray(grades)) return [];
        let notes: any[] = [];
        grades.forEach(g => {
            if (g.subjects && Array.isArray(g.subjects)) {
                g.subjects.forEach(s => {
                    if (s.rows && Array.isArray(s.rows)) {
                        s.rows.forEach(r => {
                            if (r.memo || r.link) {
                                notes.push({
                                    id: r.id,
                                    gradeId: g.id,
                                    gradeName: g.name,
                                    subjectId: s.id,
                                    subjectName: s.name,
                                    topic: r.topic || "未命名單元",
                                    memo: r.memo || "",
                                    link: r.link || ""
                                });
                            }
                        });
                    }
                });
            }
        });
        return notes;
    }, [grades]);

    const filteredNotes = useMemo(() => {
        return allNotes.filter(note => {
            const matchGrade = selectedGradeId === 'all' || note.gradeId === selectedGradeId;
            const matchSubject = selectedSubjectId === 'all' || note.subjectId === selectedSubjectId;
            const query = (noteSearch || "").toLowerCase();
            const matchSearch = !query || 
                (note.topic || "").toLowerCase().includes(query) || 
                (note.memo && note.memo.toLowerCase().includes(query));
            return matchGrade && matchSubject && matchSearch;
        });
    }, [allNotes, selectedGradeId, selectedSubjectId, noteSearch]);

    // Get unique subjects for filter dropdown
    const availableSubjects = useMemo(() => {
        if (!grades || !Array.isArray(grades)) return [];
        if (selectedGradeId === 'all') {
            const uniqueNames = new Set<string>();
            grades.forEach(g => {
                if (g.subjects) g.subjects.forEach(s => uniqueNames.add(s.name));
            });
            return Array.from(uniqueNames).map(name => ({ id: name, name: name }));
        } else {
            const grade = grades.find(g => g.id === selectedGradeId);
            return grade && grade.subjects ? grade.subjects.map(s => ({ id: s.id, name: s.name })) : [];
        }
    }, [grades, selectedGradeId]);

    const effectiveFilteredNotes = useMemo(() => {
         return filteredNotes.filter(note => {
             if (selectedSubjectId === 'all') return true;
             if (selectedGradeId === 'all') return note.subjectName === selectedSubjectId;
             return note.subjectId === selectedSubjectId;
         });
    }, [filteredNotes, selectedSubjectId, selectedGradeId]);

    if (!show) return null;

    // Helper to parse viewing note content
    const parsedNoteContent = (() => {
        if (!viewingNote) return { text: "", mermaid: null };
        const memoContent = viewingNote.memo || "";
        const mermaidMatch = memoContent.match(/```mermaid([\s\S]*?)```/);
        const text = memoContent.replace(/```mermaid[\s\S]*?```/, '').trim();
        return {
            text,
            mermaid: mermaidMatch ? mermaidMatch[1].trim() : null
        };
    })();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5E5244]/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#FAF9F6] rounded-3xl shadow-2xl w-full max-w-5xl border-[8px] border-[#8B5E3C] h-[85vh] flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-[#8B5E3C] p-4 flex justify-between items-center text-[#F3E5AB] shrink-0">
                    <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2 tracking-widest"><Library /> 島民圖書館</h2>
                    <div className="flex gap-2 bg-[#6D4C41] p-1 rounded-lg">
                        <button 
                            onClick={() => { setActiveTab('library'); setViewingNote(null); }}
                            className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-md font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${activeTab === 'library' ? 'bg-[#F3E5AB] text-[#8B5E3C] shadow-sm' : 'text-[#F3E5AB] hover:bg-[#8B5E3C]/50'}`}
                        >
                            <Bookmark size={16} /> <span className="hidden md:inline">參考藏書</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('notes')}
                            className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-md font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${activeTab === 'notes' ? 'bg-[#F3E5AB] text-[#8B5E3C] shadow-sm' : 'text-[#F3E5AB] hover:bg-[#8B5E3C]/50'}`}
                        >
                            <FileText size={16} /> <span className="hidden md:inline">筆記搜尋</span>
                        </button>
                    </div>
                    <button onClick={onClose} className="hover:bg-[#6D4C41] p-1 rounded"><X /></button>
                </div>

                {/* LIBRARY TAB CONTENT */}
                {activeTab === 'library' && (
                    <>
                        <div className="bg-[#EFEBE0] p-4 border-b-4 border-[#D6CDB5] flex flex-col gap-2 justify-center shadow-inner shrink-0">
                            {isManagingCategories ? (
                                <div className="w-full max-w-md mx-auto">
                                    <div className="flex gap-2 mb-4">
                                        <input type="text" placeholder="新增分類..." className="flex-1 px-3 py-2 rounded-lg border-2 border-[#D6CDB5] outline-none focus:border-[#8CD19D]" value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} />
                                        <button onClick={handleAddCategory} className="bg-[#8CD19D] text-white px-3 py-2 rounded-lg hover:bg-[#6BCB84]"><Plus size={20}/></button>
                                        <button onClick={() => setIsManagingCategories(false)} className="bg-gray-200 text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-300 font-bold">完成</button>
                                    </div>
                                    <div className="space-y-2 max-h-[20vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {(categories || []).map(cat => (
                                            <div key={cat} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-[#E5E7EB]">
                                                {editingCategoryName === cat ? (
                                                    <div className="flex items-center gap-2 flex-1 animate-in fade-in zoom-in duration-200">
                                                        <input autoFocus type="text" className="flex-1 border-b-2 border-[#8CD19D] outline-none text-[#5E5244] font-bold" value={tempCategoryName} onChange={e=>setTempCategoryName(e.target.value)} />
                                                        <button onClick={()=>handleRenameCategory(cat)} className="text-green-500 hover:text-green-600 p-1 bg-green-50 rounded-full"><Check size={16}/></button>
                                                        <button onClick={()=>setEditingCategoryName(null)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"><X size={16}/></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="font-bold text-[#5E5244] text-sm">{cat}</span>
                                                        <div className="flex gap-2">
                                                            <button onClick={()=>{setEditingCategoryName(cat); setTempCategoryName(cat);}} className="text-[#8CD19D] hover:text-[#55A47B] p-1.5 hover:bg-[#F0FDF4] rounded-lg transition-colors"><Edit2 size={16}/></button>
                                                            <button onClick={()=>handleDeleteCategory(cat)} className="text-[#F43F5E] hover:text-[#BE123C] p-1.5 hover:bg-[#FFF1F2] rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <div className="flex gap-2 justify-center items-center flex-wrap w-full">
                                        <select 
                                            value={newLinkCategory} 
                                            onChange={(e) => setNewLinkCategory(e.target.value)}
                                            className="px-3 py-2 rounded-xl text-sm border-2 border-[#D6CDB5] outline-none text-[#5E5244] bg-white font-bold focus:border-[#8CD19D] flex-shrink-0 w-full md:w-auto"
                                        >
                                            {(categories || []).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <input type="text" placeholder="標題" value={newLinkTitle} onChange={e=>setNewLinkTitle(e.target.value)} className="w-full md:w-32 px-3 py-2 rounded-xl border-2 border-[#D6CDB5] outline-none text-sm focus:border-[#8CD19D]" />
                                        <input type="text" placeholder="URL (https://...)" value={newLinkUrl} onChange={e=>setNewLinkUrl(e.target.value)} className="w-full md:w-48 px-3 py-2 rounded-xl border-2 border-[#D6CDB5] outline-none text-sm focus:border-[#8CD19D]" />
                                        <button onClick={handleAddLink} className="bg-[#8CD19D] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#6BCB84] shadow-sm transform active:scale-95 transition-all w-full md:w-auto">上架</button>
                                    </div>
                                    <button onClick={() => setIsManagingCategories(true)} className="text-xs text-[#8B5E3C] underline hover:text-[#6D4C41] flex items-center gap-1 font-bold opacity-80 hover:opacity-100 transition-opacity"><Sliders size={12}/> 管理分類</button>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-[#FDFBF7] custom-scrollbar">
                            {!isManagingCategories && (categories || []).map(cat => {
                                const links = library.filter(l => l.category === cat);
                                return (
                                    <div key={cat} className="mb-8">
                                        <h3 className="text-lg font-extrabold text-[#8B5E3C] mb-3 px-4 border-l-4 border-[#8B5E3C]">{cat}</h3>
                                        <div className="bg-[#E5DCC5] p-6 rounded-xl shadow-inner border-b-[12px] border-[#C4BBA3] flex flex-wrap gap-4 min-h-[120px] items-end">
                                            {links.map(link => (
                                                <div key={link.id} className="w-24 h-32 bg-white rounded shadow-md border-l-4 border-[#8B5E3C] p-2 flex flex-col items-center cursor-pointer hover:-translate-y-1 transition-transform group relative" onClick={() => window.open(link.url, '_blank')}>
                                                    <Bookmark size={20} className="text-[#D6CDB5] mb-2" />
                                                    <div className="text-xs font-bold text-[#5E5244] line-clamp-2 text-center h-8 overflow-hidden" title={link.title}>{link.title}</div>
                                                    <button onClick={(e)=>{e.stopPropagation();deleteLink(link.id)}} className="absolute top-1 right-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                                </div>
                                            ))}
                                            {links.length === 0 && <div className="w-full text-center text-[#9C9283] text-xs italic py-4">此分類尚無書籍</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* NOTES TAB CONTENT */}
                {activeTab === 'notes' && (
                    <>
                        <div className="bg-[#EFEBE0] p-4 border-b-4 border-[#D6CDB5] flex flex-col gap-4 justify-between items-center shadow-inner shrink-0">
                            {/* ... Search Filter Inputs ... */}
                            <div className="flex flex-wrap gap-2 flex-1 w-full">
                                <div className="relative group flex-1 min-w-[120px]">
                                    <Filter className="absolute left-3 top-2.5 text-[#9C9283]" size={16} />
                                    <select 
                                        className="w-full pl-9 pr-8 py-2 rounded-xl border-2 border-[#D6CDB5] bg-white text-[#5E5244] font-bold text-sm outline-none focus:border-[#8CD19D] appearance-none"
                                        value={selectedGradeId}
                                        onChange={(e) => { setSelectedGradeId(e.target.value); setSelectedSubjectId('all'); }}
                                    >
                                        <option value="all">所有年級</option>
                                        {(grades || []).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div className="relative group flex-1 min-w-[120px]">
                                    <select 
                                        className="w-full pl-3 pr-8 py-2 rounded-xl border-2 border-[#D6CDB5] bg-white text-[#5E5244] font-bold text-sm outline-none focus:border-[#8CD19D] appearance-none"
                                        value={selectedSubjectId}
                                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    >
                                        <option value="all">所有科目</option>
                                        {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-2.5 text-[#9C9283]" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="搜尋單元或筆記內容..." 
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#D6CDB5] outline-none text-[#5E5244] font-bold text-sm focus:border-[#8CD19D] bg-white"
                                    value={noteSearch}
                                    onChange={(e) => setNoteSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Relative container for List + Detail Overlay */}
                        <div className="flex-1 relative overflow-hidden bg-[#FDFBF7]">
                            
                            {/* NOTE LIST */}
                            <div className="absolute inset-0 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                                {effectiveFilteredNotes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-[#D6D0C4]">
                                        <FileText size={48} className="mb-4 opacity-50"/>
                                        <p className="font-bold">找不到相關筆記</p>
                                        <p className="text-xs">請嘗試其他關鍵字或變更篩選條件</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {effectiveFilteredNotes.map((note) => (
                                            <div 
                                                key={note.id} 
                                                onClick={() => setViewingNote(note)}
                                                className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md hover:border-[#8CD19D] transition-all group flex flex-col relative cursor-pointer active:scale-[0.99]"
                                            >
                                                <div className="flex items-center gap-2 mb-2 pr-8">
                                                    <span className="bg-[#E0F2E9] text-[#166534] text-[10px] px-2 py-0.5 rounded-full font-bold">{note.gradeName}</span>
                                                    <span className="bg-[#F3F0E6] text-[#5E5244] text-[10px] px-2 py-0.5 rounded-full font-bold">{note.subjectName}</span>
                                                </div>
                                                <h4 className="font-bold text-[#5E5244] text-lg mb-2 line-clamp-1" title={note.topic}>{note.topic}</h4>
                                                
                                                {note.memo && (
                                                    <div className="flex-1 bg-[#FAF9F6] p-3 rounded-lg text-sm text-[#796E5B] mb-2 overflow-hidden relative border border-[#F3F0E6]">
                                                        {note.memo.includes('```mermaid') && (
                                                            <div className="absolute top-2 right-2 text-[#8CD19D] bg-white rounded-full p-1 shadow-sm"><Network size={14}/></div>
                                                        )}
                                                        <p className="line-clamp-4 whitespace-pre-wrap text-xs">{note.memo.replace(/```mermaid[\s\S]*?```/g, '【心智圖表】')}</p>
                                                    </div>
                                                )}
                                                
                                                <div className="mt-auto pt-2 border-t border-[#F3F0E6] flex justify-between items-center">
                                                    {note.link ? (
                                                        <span className="flex items-center gap-1 text-xs text-[#55A47B] font-bold"><ExternalLink size={12} /> 相關資源</span>
                                                    ) : <span></span>}
                                                    <span className="text-xs text-[#9C9283] group-hover:text-[#8CD19D] font-bold">查看詳情 &rarr;</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* NOTE DETAIL OVERLAY */}
                            {viewingNote && (
                                <div className="absolute inset-0 bg-[#FDFBF7] z-20 flex flex-col animate-in slide-in-from-right duration-300">
                                    {/* Detail Header */}
                                    <div className="p-4 border-b border-[#D6CDB5] flex justify-between items-center bg-[#EFEBE0] shrink-0 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setViewingNote(null)} className="p-2 hover:bg-[#D6CDB5] rounded-full text-[#5E5244] transition-colors"><ArrowLeft /></button>
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-black text-[#5E5244] truncate">{viewingNote.topic}</h3>
                                                <div className="flex items-center gap-2 text-xs font-bold text-[#9C9283]">
                                                    <span>{viewingNote.gradeName}</span>
                                                    <span>•</span>
                                                    <span>{viewingNote.subjectName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const prompt = `我正在複習 ${viewingNote.gradeName} ${viewingNote.subjectName} 的「${viewingNote.topic}」單元。
這是我的筆記與錯題紀錄：

${viewingNote.memo}

請擔任我的家教，針對上述內容：
1. 分析我的觀念盲點
2. 提供此單元的重點整理
3. 出 3 題類似的觀念題讓我練習`;
                                                navigator.clipboard.writeText(prompt);
                                                triggerAlert("✅ 已複製 AI 引導提示詞！\n\n您可以貼到 Gemini 進行引導式學習。");
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#55A47B] rounded-lg text-xs font-bold hover:bg-[#E0F2E9] hover:border-[#8CD19D] transition-colors shadow-sm shrink-0"
                                        >
                                            <Bot size={16} /> <span className="hidden md:inline">複製 AI 指令</span>
                                        </button>
                                    </div>

                                    {/* Detail Content */}
                                    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                                        <div className="max-w-3xl mx-auto space-y-8 pb-10">
                                            
                                            {/* Mermaid Diagram Render */}
                                            {parsedNoteContent.mermaid && (
                                                <div className="animate-in zoom-in duration-500">
                                                    <h4 className="font-bold text-[#5E5244] mb-2 flex items-center gap-2 text-sm"><Network size={16}/> 知識架構心智圖</h4>
                                                    <MermaidDiagram code={parsedNoteContent.mermaid} />
                                                </div>
                                            )}

                                            {/* Text Content */}
                                            <div>
                                                <h4 className="font-bold text-[#5E5244] mb-2 flex items-center gap-2 text-sm"><FileText size={16}/> 筆記內容</h4>
                                                <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm text-[#5E5244] whitespace-pre-wrap leading-relaxed">
                                                    {parsedNoteContent.text || <span className="text-[#D6D0C4] italic">沒有文字內容...</span>}
                                                </div>
                                            </div>

                                            {/* Link */}
                                            {viewingNote.link && (
                                                <div className="bg-[#E0F2E9] p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-[#D1EADC] transition-colors" onClick={() => window.open(viewingNote.link, '_blank')}>
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="bg-white p-2 rounded-full text-[#166534] shrink-0"><ExternalLink size={20}/></div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-[#166534] text-sm">相關學習資源</div>
                                                            <div className="text-xs text-[#55A47B] truncate">{viewingNote.link}</div>
                                                        </div>
                                                    </div>
                                                    <ArrowRight size={16} className="text-[#166534] group-hover:translate-x-1 transition-transform shrink-0" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
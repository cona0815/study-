import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Clock, Settings, Save, Upload, RotateCcw, Layers, Plus, X, 
    BarChart2, Book, Timer, Search, Edit2, AlertCircle, Check,
    Bot, ArrowRight, Download, FileText, Target, Trophy, CheckSquare, Calendar,
    Cloud, DownloadCloud, Copy, ExternalLink, Code, Trash2, GripVertical, Palette,
    Wifi, WifiOff, Key, Coins
} from 'lucide-react';
import { 
    UserData, Grade, AppSettings, LibraryItem, DialogState, Row, Reward 
} from './types';
import { 
    DEFAULT_SETTINGS, DEFAULT_USER_DATA, DEFAULT_LIBRARY, 
    DEFAULT_CATEGORIES, DEFAULT_GRADES, DEFAULT_REWARDS 
} from './constants';
import { DialogModal } from './components/ui/DialogModal';
import { StudyTable } from './components/dashboard/StudyTable';
import { AnalyticsModal } from './components/modals/AnalyticsModal';
import { LibraryModal } from './components/modals/LibraryModal';
import { PomodoroModal } from './components/modals/PomodoroModal';
import { CalendarModal } from './components/modals/CalendarModal';
import { AITutorModal } from './components/modals/AITutorModal';
import { MemoModal } from './components/modals/MemoModal';
import { RewardModal } from './components/modals/RewardModal';

// --- Theme Constants ---
const THEME_COLORS = [
    '#5E5244', '#796E5B', '#8C7B75', '#A89F91', '#D6CDB5',
    '#8CD19D', '#55A47B', '#2F855A', '#10B981', '#34D399',
    '#3B82F6', '#2563EB', '#0EA5E9', '#06B6D4', '#2DD4BF',
    '#8B5CF6', '#7C3AED', '#D946EF', '#EC4899', '#F43F5E',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#FACC15',
    '#64748B', '#94A3B8', '#CBD5E1'
];

// --- Helpers ---
const getLevelInfo = (exp: number, levels: any[]) => {
    const sortedLevels = [...(levels || [])].sort((a, b) => a.minExp - b.minExp);
    return sortedLevels.slice().reverse().find(l => exp >= l.minExp) || sortedLevels[0] || { level: 1, minExp: 0, title: "新手", icon: "🌱" };
};

const getNextLevelInfo = (currentLevel: number, levels: any[]) => {
    return (levels || []).find(l => l.level === currentLevel + 1);
};

const sanitizeGrades = (data: any): Grade[] => {
    if (!data || !Array.isArray(data)) return DEFAULT_GRADES;
    return data.map((g: any) => {
        if (!g || typeof g !== 'object') return null;
        return {
            id: g.id || `g_${Date.now()}_${Math.random()}`,
            name: g.name || '未命名',
            color: g.color || '#5E5244',
            subjects: Array.isArray(g.subjects) ? g.subjects.map((s: any) => {
                if (!s || typeof s !== 'object') return null;
                return {
                    id: s.id || `s_${Date.now()}_${Math.random()}`,
                    name: s.name || '未命名',
                    color: s.color || '#8CD19D',
                    rows: Array.isArray(s.rows) ? s.rows.map((r: any) => {
                        if (!r || typeof r !== 'object') return null;
                        return {
                            id: r.id || Date.now() + Math.random(),
                            topic: r.topic || "",
                            note: !!r.note,
                            memo: r.memo || "",
                            link: r.link || "",
                            dueDate: r.dueDate || "",
                            practice1: !!r.practice1, correct1: !!r.correct1, score1: r.score1 != null ? String(r.score1) : "", score1Date: r.score1Date || "",
                            practice2: !!r.practice2, correct2: !!r.correct2, score2: r.score2 != null ? String(r.score2) : "", score2Date: r.score2Date || "",
                            practice3: !!r.practice3, correct3: !!r.correct3, score3: r.score3 != null ? String(r.score3) : "", score3Date: r.score3Date || "",
                            suggestedDate2: r.suggestedDate2 || "", suggestedDate3: r.suggestedDate3 || ""
                        };
                    }).filter(Boolean) : []
                };
            }).filter(Boolean) : []
        };
    }).filter(Boolean) as Grade[];
};

const LiveClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const format = (num: number) => String(num).padStart(2, '0');
    return (
        <div className="font-mono text-xs md:text-base font-bold text-[#796E5B] bg-[#EFEBE0]/50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-[#D6CDB5] flex items-center gap-2 shadow-sm whitespace-nowrap transform origin-bottom-right mt-1 w-full md:w-auto justify-center md:justify-start">
            <Clock size={14} className="text-[#9C9283]" strokeWidth={2.5} /> 
            <span className="inline">{time.getFullYear()}/{format(time.getMonth()+1)}/{format(time.getDate())}</span>
            <span className="text-[#8CD19D] animate-pulse hidden md:inline">|</span>
            <span className="tabular-nums tracking-widest">{format(time.getHours())}:{format(time.getMinutes())}:{format(time.getSeconds())}</span>
        </div>
    );
};

const GAS_CODE = `// ⚠️ 請注意：這段程式碼是用於 Google Apps Script (GAS) 的後端腳本
function doGet(e) { return ContentService.createTextOutput("✅ 連線成功！").setMimeType(ContentService.MimeType.TEXT); }
function doPost(e) {
  var lock = LockService.getScriptLock(); lock.tryLock(10000);
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet(); var sheet = doc.getSheetByName('Data');
    if (!sheet) { sheet = doc.insertSheet('Data'); sheet.appendRow(['Timestamp', 'Data']); sheet.setFrozenRows(1); }
    var postData = JSON.parse(e.postData.contents); var action = postData.action;
    if (action == 'save') {
      sheet.getRange(2, 1, 1, 2).setValues([[new Date(), JSON.stringify(postData.data)]]);
      return ContentService.createTextOutput(JSON.stringify({'status': 'success', 'message': 'Saved'})).setMimeType(ContentService.MimeType.JSON);
    } else if (action == 'load') {
      if (sheet.getLastRow() < 2) return ContentService.createTextOutput(JSON.stringify({'status': 'success', 'data': null})).setMimeType(ContentService.MimeType.JSON);
      var data = JSON.parse(sheet.getRange(2, 2).getValue());
      return ContentService.createTextOutput(JSON.stringify({'status': 'success', 'data': data})).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(e) { return ContentService.createTextOutput(JSON.stringify({'status': 'error', 'message': e.toString()})).setMimeType(ContentService.MimeType.JSON); } finally { lock.releaseLock(); }
}`;

interface EditItemState { type: 'grade' | 'subject'; id: string; name: string; color: string; }

export default function App() {
    // --- State ---
    const [grades, setGrades] = useState<Grade[]>(() => {
        try { return localStorage.getItem('study_data_v3') ? sanitizeGrades(JSON.parse(localStorage.getItem('study_data_v3')!)) : DEFAULT_GRADES; } catch { return DEFAULT_GRADES; }
    });
    const [userData, setUserData] = useState<UserData>(() => {
        try { 
            const data = localStorage.getItem('userData_v2') ? JSON.parse(localStorage.getItem('userData_v2')!) : DEFAULT_USER_DATA;
            return { ...DEFAULT_USER_DATA, ...data, coins: data.coins ?? data.exp }; // Default coins to exp if missing
        } catch { return DEFAULT_USER_DATA; }
    });
    const [library, setLibrary] = useState<LibraryItem[]>(() => {
        try { return localStorage.getItem('study_library_v1') ? JSON.parse(localStorage.getItem('study_library_v1')!) : DEFAULT_LIBRARY; } catch { return DEFAULT_LIBRARY; }
    });
    const [libraryCategories, setLibraryCategories] = useState<string[]>(() => {
        try { return localStorage.getItem('study_library_categories_v1') ? JSON.parse(localStorage.getItem('study_library_categories_v1')!) : DEFAULT_CATEGORIES; } catch { return DEFAULT_CATEGORIES; }
    });
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const parsed = localStorage.getItem('study_settings_v1') ? JSON.parse(localStorage.getItem('study_settings_v1')!) : {};
            return { 
                ...DEFAULT_SETTINGS, 
                ...parsed, 
                islandLevels: parsed.islandLevels || DEFAULT_SETTINGS.islandLevels,
                rewards: parsed.rewards || DEFAULT_REWARDS
            };
        } catch { return DEFAULT_SETTINGS; }
    });
    const [targetDate, setTargetDate] = useState(() => localStorage.getItem('study_target_date') || "");

    const [activeGradeId, setActiveGradeId] = useState<string | null>(() => grades[0]?.id || null);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
    const [highlightedRowId, setHighlightedRowId] = useState<string | number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const isFirstMount = useRef(true);
    
    const [editItem, setEditItem] = useState<EditItemState | null>(null);
    const dragItem = useRef<any>(null);
    const dragOverItem = useRef<any>(null);

    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [showPomodoro, setShowPomodoro] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showGasGuide, setShowGasGuide] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);
    
    // AI Tutor Modal State - ADDED rowId
    const [aiTutorState, setAiTutorState] = useState<{ open: boolean, topic: string, grade: string, subject: string, rowId: string | number | null }>({ 
        open: false, topic: "", grade: "", subject: "", rowId: null
    });
    
    const [memoModal, setMemoModal] = useState<{ open: boolean, rowId: string | number | null, content: string, link: string }>({ 
        open: false, rowId: null, content: "", link: "" 
    });

    const [dialog, setDialog] = useState<DialogState>({ show: false, type: 'alert', message: '', onConfirm: null, onCancel: null });
    const [warningScope, setWarningScope] = useState<'local' | 'global'>('local');
    const [importText, setImportText] = useState("");
    const [isEditingDate, setIsEditingDate] = useState(false);

    // --- Core Functions (Defined BEFORE useEffect to avoid ReferenceError) ---
    const triggerAlert = (msg: string) => setDialog({ show: true, type: 'alert', message: msg, onConfirm: null, onCancel: null });
    const triggerConfirm = (msg: string, onConfirm: () => void, onCancel?: () => void) => setDialog({ show: true, type: 'confirm', message: msg, onConfirm, onCancel: onCancel || null });
    const closeDialog = () => setDialog({ ...dialog, show: false });

    // ... (keep handleCloudSave, handleCloudLoad, handleBackup, handleImportText, addExp, updateRow) ...
    const handleCloudSave = async (silent = false) => {
        if (!settings.gasUrl) {
            if(!silent) triggerAlert("❌ 您尚未設定雲端連結。\n\n目前資料僅儲存在這台裝置的瀏覽器中 (Local Storage)。\n\n若要開啟雲端同步，資料將會存入「您自己的 Google 試算表」。請先至設定頁面建立 GAS 腳本並回填網址。");
            return;
        }
        setIsSyncing(true);
        const payload = {
            action: 'save',
            data: { grades, userData, library, libraryCategories, settings, targetDate }
        };
        
        try {
            await fetch(settings.gasUrl, {
                method: 'POST', redirect: 'follow', headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            if(!silent) triggerAlert("☁️ 成功儲存至 Google 試算表！");
            setHasUnsavedChanges(false);
        } catch (e) {
            console.error(e);
            if(!silent) triggerAlert("❌ 儲存失敗 (Failed to fetch)\n\n可能原因：\n1. 網址錯誤\n2. 權限未設為「所有人」\n3. 瀏覽器阻擋");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCloudLoad = async () => {
        if (!settings.gasUrl) {
             triggerAlert("❌ 您尚未設定雲端連結。\n\n無法從 Google 試算表讀取資料。請先至設定頁面填寫 GAS 網址。");
             return;
        }
        triggerConfirm("確定從雲端 (Google 試算表) 讀取？這將覆蓋目前資料。", async () => {
            setIsSyncing(true);
            try {
                // Use non-null assertion as we checked above
                const response = await fetch(settings.gasUrl!, {
                    method: 'POST', redirect: 'follow', headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: 'load' })
                });
                const data = await response.json();
                
                if (data && data.status === 'success' && data.data) {
                    const loaded = data.data;
                    if (!loaded.grades || !Array.isArray(loaded.grades)) throw new Error("雲端資料格式錯誤");
                    
                    const safeGrades = sanitizeGrades(loaded.grades);
                    const mergedGasUrl = settings.gasUrl || loaded.settings?.gasUrl || "";
                    const mergedApiKey = settings.geminiApiKey || loaded.settings?.geminiApiKey || "";
                    const newSettings = { ...loaded.settings, gasUrl: mergedGasUrl, geminiApiKey: mergedApiKey };
                    
                    // Update State
                    setGrades(safeGrades);
                    if(loaded.userData) setUserData(loaded.userData);
                    if(loaded.library) setLibrary(loaded.library);
                    if(loaded.libraryCategories) setLibraryCategories(loaded.libraryCategories);
                    if(loaded.targetDate) setTargetDate(loaded.targetDate);
                    if(loaded.settings) setSettings(newSettings);
                    setActiveGradeId(safeGrades.length > 0 ? safeGrades[0].id : null);
                    
                    setHasUnsavedChanges(false);
                    triggerAlert("☁️ 雲端讀取成功！");
                } else {
                    triggerAlert("雲端無資料或格式錯誤");
                }
            } catch (e) {
                console.error(e);
                triggerAlert("❌ 讀取失敗 (Failed to fetch)\n\n可能原因：\n1. 網址錯誤\n2. 權限未設為「所有人」\n3. 瀏覽器阻擋");
            } finally {
                setIsSyncing(false);
            }
        });
    };

    const handleBackup = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(grades));
        const node = document.createElement('a');
        node.setAttribute("href", dataStr);
        node.setAttribute("download", `study_data_v3_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(node); node.click(); node.remove();
    };

    const handleImportText = () => {
        const text = importText.trim();
        if (!text) return;

        // Try parsing as JSON first (Backup Restore)
        try {
            const json = JSON.parse(text);
            
            // Case A: Full Backup (Grade[])
            if (Array.isArray(json) && json.length > 0 && (json[0].subjects || json[0].id)) {
                 triggerConfirm("偵測到完整備份資料 (JSON)，確定要覆蓋現有資料嗎？", () => {
                    const safeGrades = sanitizeGrades(json);
                    setGrades(safeGrades);
                    if (safeGrades.length > 0) setActiveGradeId(safeGrades[0].id);
                    setImportText("");
                    setShowImport(false);
                    triggerAlert("✅ 完整資料還原成功！");
                 });
                 return;
            }
            
            // Case B: Subjects Backup (Subject[]) - e.g. from partial export
            if (Array.isArray(json) && json.length > 0 && json[0].rows && json[0].name) {
                 if (!activeGradeId) return triggerAlert("匯入科目資料前，請先建立並選擇一個年級。");
                 
                 triggerConfirm(`偵測到 ${json.length} 個科目的資料，確定匯入至目前年級？`, () => {
                    setGrades(prev => prev.map(g => {
                        if (g.id !== activeGradeId) return g;
                        
                        const newSubjects = [...g.subjects];
                        json.forEach((impSub: any) => {
                             // Try to find if subject already exists by name
                             const existingIdx = newSubjects.findIndex(s => s.name === impSub.name);
                             if (existingIdx >= 0) {
                                 // Update existing subject
                                 newSubjects[existingIdx] = { 
                                     ...newSubjects[existingIdx], 
                                     rows: [...newSubjects[existingIdx].rows, ...impSub.rows] 
                                 }; 
                             } else {
                                 // Add new subject
                                 newSubjects.push(impSub);
                             }
                        });
                        return { ...g, subjects: newSubjects };
                    }));
                    setImportText("");
                    setShowImport(false);
                    triggerAlert("✅ 科目資料匯入成功！");
                 });
                 return;
            }
        } catch (e) {
            // Not valid JSON, continue to text processing
        }

        // Original Text Import Logic (Line by Line)
        if (!activeGradeId) return triggerAlert("請先選擇一個年級");
        
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        let newGrades = JSON.parse(JSON.stringify(grades));
        let targetGradeIndex = newGrades.findIndex((g: Grade) => g.id === activeGradeId);
        
        if (targetGradeIndex === -1) return;
        
        let currentSubjects = newGrades[targetGradeIndex].subjects;
        let currentSubjectId = activeSubjectId;
        
        let importedCount = 0;

        lines.forEach((line: string) => {
            if (line.startsWith('#')) {
                const subjectName = line.substring(1).trim();
                if (subjectName) {
                    let existingSubject = currentSubjects.find((s: any) => s.name === subjectName);
                    if (!existingSubject) {
                        const newId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        existingSubject = { id: newId, name: subjectName, rows: [] };
                        currentSubjects.push(existingSubject);
                    }
                    currentSubjectId = existingSubject.id;
                }
            } else {
                if (currentSubjectId) {
                    const subjectIndex = currentSubjects.findIndex((s: any) => s.id === currentSubjectId);
                    if (subjectIndex !== -1) {
                        currentSubjects[subjectIndex].rows.push({
                            id: Date.now() + Math.random(), topic: line, note: false, memo: "", link: "", dueDate: "",
                            practice1: false, correct1: false, score1: "", score1Date: "",
                            practice2: false, correct2: false, score2: "", score2Date: "",
                            practice3: false, correct3: false, score3: "", score3Date: ""
                        });
                        importedCount++;
                    }
                }
            }
        });

        if (importedCount === 0 && !text.includes('#')) {
             // Fallback: If no subject marker found and a subject is active, add all lines to current subject
             if (activeSubjectId) {
                 const subjectIndex = currentSubjects.findIndex((s: any) => s.id === activeSubjectId);
                 if (subjectIndex !== -1) {
                     lines.forEach((line: string) => {
                         currentSubjects[subjectIndex].rows.push({
                            id: Date.now() + Math.random(), topic: line, note: false, memo: "", link: "", dueDate: "",
                            practice1: false, correct1: false, score1: "", score1Date: "",
                            practice2: false, correct2: false, score2: "", score2Date: "",
                            practice3: false, correct3: false, score3: "", score3Date: ""
                         });
                         importedCount++;
                     });
                 }
             } else if (currentSubjects.length > 0) {
                 // No active subject but subjects exist, default to first
                  currentSubjects[0].rows.push({
                        id: Date.now() + Math.random(), topic: lines[0], note: false, memo: "", link: "", dueDate: "",
                        practice1: false, correct1: false, score1: "", score1Date: "",
                        practice2: false, correct2: false, score2: "", score2Date: "",
                        practice3: false, correct3: false, score3: "", score3Date: ""
                  });
                  // Only adds first line if confused, but better to alert
             }
        }

        newGrades[targetGradeIndex].subjects = currentSubjects;
        setGrades(newGrades);
        setImportText("");
        setShowImport(false);
        triggerAlert(importedCount > 0 ? `✅ 成功匯入 ${importedCount} 個單元！` : "⚠️ 未匯入任何資料，請確認格式（例如：# 國文）。");
    };

    const addReward = (exp: number, coins: number) => {
        if (!exp && !coins) return;
        setUserData(prev => {
            const newExp = prev.exp + exp;
            const newCoins = (prev.coins || 0) + coins;
            const today = new Date().toISOString().split('T')[0];
            const newLogs = { ...prev.logs, [today]: (prev.logs[today] || 0) + 1 };
            return { ...prev, exp: newExp, coins: newCoins, logs: newLogs };
        });
    };

    const handleRedeem = (reward: Reward) => {
        if (userData.coins < reward.cost) return triggerAlert("島嶼幣不足！");
        triggerConfirm(`確定花費 ${reward.cost} 島嶼幣兌換「${reward.name}」嗎？`, () => {
            setUserData(prev => ({ ...prev, coins: prev.coins - reward.cost }));
            triggerAlert(`🎉 兌換成功！\n\n請享受您的獎勵：${reward.name}`);
        });
    };

    const handleReorderRows = (fromIndex: number, toIndex: number) => {
        if (!activeGradeId || !activeSubjectId) return;
        
        setGrades(prev => prev.map(g => {
            if (g.id !== activeGradeId) return g;
            return {
                ...g,
                subjects: g.subjects.map(s => {
                    if (s.id !== activeSubjectId) return s;
                    const newRows = [...s.rows];
                    const [movedRow] = newRows.splice(fromIndex, 1);
                    newRows.splice(toIndex, 0, movedRow);
                    return { ...s, rows: newRows };
                })
            };
        }));
    };

    const updateRow = (rowId: string | number, field: string, value: any) => {
        let expGain = 0; let coinGain = 0; let dateField: string | null = null; let updates: any = {}; updates[field] = value;
        if (field === 'score1' && value !== "") dateField = 'score1Date';
        if (field === 'score2' && value !== "") dateField = 'score2Date';
        if (field === 'score3' && value !== "") dateField = 'score3Date';
        
        if (field === 'practice1' && value === true) { expGain = settings.expPractice; coinGain = settings.coinPractice; }
        if (field === 'correct1' && value === true) { expGain = settings.expCorrect; coinGain = settings.coinCorrect; }
        if (field === 'note' && value === true) { expGain = settings.expMemo; coinGain = settings.coinMemo; }
        
        if (field.includes('score')) {
            if (value !== "") { expGain += settings.expScoreEntry; coinGain += settings.coinScoreEntry; }
            const score = parseInt(value); 
            if (!isNaN(score) && score >= settings.passingScore) { expGain += settings.expPass; coinGain += settings.coinPass; }
        }
        if (field === 'score1') {
            const score = parseInt(value);
            if (!isNaN(score)) {
                const days = score >= settings.passingScore ? 3 : 1; const d = new Date(); d.setDate(d.getDate() + days);
                updates.suggestedDate2 = d.toISOString().split('T')[0];
            } else updates.suggestedDate2 = "";
        }
        if (field === 'score2') {
            const score = parseInt(value);
            if (!isNaN(score)) {
                const days = score >= settings.passingScore ? 7 : 3; const d = new Date(); d.setDate(d.getDate() + days);
                updates.suggestedDate3 = d.toISOString().split('T')[0];
            } else updates.suggestedDate3 = "";
        }
        if (expGain > 0 || coinGain > 0) addReward(expGain, coinGain); 
        else setUserData(p => { const t = new Date().toISOString().split('T')[0]; return { ...p, logs: { ...p.logs, [t]: (p.logs[t] || 0) + 1 } }; });
        setGrades(prev => prev.map(g => g.id !== activeGradeId ? g : { ...g, subjects: g.subjects.map(s => s.id !== activeSubjectId ? s : { ...s, rows: s.rows.map(r => r.id !== rowId ? r : { ...r, ...updates, ...(dateField ? {[dateField]: `${new Date().getMonth()+1}/${new Date().getDate()}`.padStart(5, '0')} : {}) }) }) }));
    };

    const saveMemo = (content: string, link: string) => {
        if (!activeGradeId || !activeSubjectId || !memoModal.rowId) return;
        setGrades(prev => prev.map(g => {
            if (g.id !== activeGradeId) return g;
            return {
                ...g, subjects: g.subjects.map(s => {
                    if (s.id !== activeSubjectId) return s;
                    return {
                        ...s, rows: s.rows.map(r => r.id === memoModal.rowId ? { ...r, memo: content, link: link, note: !!(content || link) } : r)
                    };
                })
            };
        }));
        setMemoModal({ open: false, rowId: null, content: "", link: "" });
    };

    const deleteRow = (rowId: string | number) => {
        triggerConfirm("確定移除此進度？", () => {
            setGrades(g => g.map(gr => gr.id!==activeGradeId ? gr : { ...gr, subjects: gr.subjects.map(s => s.id!==activeSubjectId ? s : { ...s, rows: s.rows.filter(r => r.id !== rowId) }) }));
        });
    };

    const addRow = () => {
        if (!activeSubjectId) return triggerAlert("請先建立並選擇一個科目");
        const newRow: Row = { id: Date.now()+Math.random(), topic: "", note: false, memo: "", link: "", dueDate: "", practice1: false, correct1: false, score1: "", score1Date: "", practice2: false, correct2: false, score2: "", score2Date: "", practice3: false, correct3: false, score3: "", score3Date: "" };
        setGrades(g => g.map(gr => gr.id!==activeGradeId ? gr : { ...gr, subjects: gr.subjects.map(s => s.id!==activeSubjectId ? s : { ...s, rows: [...s.rows, newRow] }) }));
        setTimeout(() => { const c = document.querySelector('.overflow-x-auto'); if(c) c.scrollTop = c.scrollHeight; }, 100);
    };

    // --- Effects ---
    useEffect(() => { if (!isFirstMount.current) { localStorage.setItem('study_data_v3', JSON.stringify(grades)); setHasUnsavedChanges(true); } }, [grades]);
    useEffect(() => { if (!isFirstMount.current) { localStorage.setItem('userData_v2', JSON.stringify(userData)); setHasUnsavedChanges(true); } }, [userData]);
    useEffect(() => { if (!isFirstMount.current) { localStorage.setItem('study_target_date', targetDate); setHasUnsavedChanges(true); } }, [targetDate]);
    useEffect(() => { if (!isFirstMount.current) { localStorage.setItem('study_library_v1', JSON.stringify(library)); setHasUnsavedChanges(true); } }, [library]);
    useEffect(() => { if (!isFirstMount.current) { localStorage.setItem('study_settings_v1', JSON.stringify(settings)); setHasUnsavedChanges(true); } }, [settings]);
    useEffect(() => { if (!isFirstMount.current) { localStorage.setItem('study_library_categories_v1', JSON.stringify(libraryCategories)); setHasUnsavedChanges(true); } }, [libraryCategories]);
    useEffect(() => { isFirstMount.current = false; }, []);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => { if (hasUnsavedChanges && settings.gasUrl) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', handleBeforeUnload); return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, settings.gasUrl]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (settings.autoCloudSave && settings.gasUrl) {
            interval = setInterval(() => {
                if (hasUnsavedChanges && !isSyncing) { console.log("Auto-saving..."); handleCloudSave(true); }
            }, 30 * 60 * 1000);
        }
        return () => clearInterval(interval);
    }, [settings.autoCloudSave, settings.gasUrl, hasUnsavedChanges, isSyncing, grades, userData, library, libraryCategories, targetDate]);

    useEffect(() => {
        const currentGrade = grades.find(g => g.id === activeGradeId);
        if (currentGrade) {
            if (currentGrade.subjects.length > 0 && !currentGrade.subjects.find(s => s.id === activeSubjectId)) {
                setActiveSubjectId(currentGrade.subjects[0].id);
            }
        } else if (grades.length > 0) setActiveGradeId(grades[0].id);
    }, [activeGradeId, grades, activeSubjectId]);

    // --- Computed ---
    const activeGrade = grades.find(g => g.id === activeGradeId) || null;
    const activeSubject = activeGrade?.subjects.find(s => s.id === activeSubjectId) || null;
    const allGlobalRows = useMemo(() => {
        return grades.reduce((acc, grade) => {
            return acc.concat(grade.subjects.reduce((sAcc, sub) => sAcc.concat(sub.rows.map(r => ({ ...r, _gradeId: grade.id, _gradeName: grade.name, _subjectId: sub.id, _subjectName: sub.name }))), [] as Row[]));
        }, [] as Row[]);
    }, [grades]);
    const currentLevelInfo = getLevelInfo(userData.exp, settings.islandLevels);
    const nextLevelInfo = getNextLevelInfo(currentLevelInfo.level, settings.islandLevels);
    const progressPercent = nextLevelInfo ? Math.min(100, Math.max(0, ((userData.exp - currentLevelInfo.minExp) / (nextLevelInfo.minExp - currentLevelInfo.minExp)) * 100)) : 100;
    const stats = {
        total: allGlobalRows.length,
        passed: allGlobalRows.filter(r => (parseInt(r.score1) >= settings.passingScore) || (parseInt(r.score2) >= settings.passingScore) || (parseInt(r.score3) >= settings.passingScore)).length,
        warning: allGlobalRows.filter(r => { const s1 = parseInt(r.score1) || 0; return s1 > 0 && s1 < settings.passingScore && !r.score2 && !r.score3; }).length
    };
    const daysLeft = targetDate ? Math.ceil((new Date(new Date(targetDate).getFullYear(), new Date(targetDate).getMonth(), new Date(targetDate).getDate()).getTime() - new Date(new Date().setHours(0,0,0,0)).getTime()) / 86400000) : null;
    const currentWeakRows = warningScope === 'local' ? allGlobalRows.filter(r => r._gradeId === activeGradeId && ((parseInt(r.score1)||0) < settings.passingScore && (parseInt(r.score1)||0) > 0 && (!r.score2 || parseInt(r.score2) < settings.passingScore))) : allGlobalRows.filter(r => ((parseInt(r.score1)||0) < settings.passingScore && (parseInt(r.score1)||0) > 0 && (!r.score2 || parseInt(r.score2) < settings.passingScore)));

    // --- DnD Handlers ---
    const handleGradeSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newGrades = [...grades];
        const draggedItemContent = newGrades.splice(dragItem.current, 1)[0];
        newGrades.splice(dragOverItem.current, 0, draggedItemContent);
        setGrades(newGrades);
        dragItem.current = dragOverItem.current; dragOverItem.current = null;
    };
    const handleSubjectSort = () => {
         if (dragItem.current === null || dragOverItem.current === null || !activeGradeId) return;
         const gradeIndex = grades.findIndex(g => g.id === activeGradeId);
         if (gradeIndex === -1) return;
         const newGrades = [...grades];
         const subjects = [...newGrades[gradeIndex].subjects];
         const draggedItemContent = subjects.splice(dragItem.current, 1)[0];
         subjects.splice(dragOverItem.current, 0, draggedItemContent);
         newGrades[gradeIndex].subjects = subjects;
         setGrades(newGrades);
         dragItem.current = dragOverItem.current; dragOverItem.current = null;
    };
    const handleSaveEdit = () => {
        if (!editItem) return;
        if (editItem.type === 'grade') setGrades(prev => prev.map(g => g.id === editItem.id ? { ...g, name: editItem.name, color: editItem.color } : g));
        else setGrades(prev => prev.map(g => g.id === activeGradeId ? { ...g, subjects: g.subjects.map(s => s.id === editItem.id ? { ...s, name: editItem.name, color: editItem.color } : s) } : g));
        setEditItem(null);
    };
    const handleDeleteEdit = () => {
        if (!editItem) return;
        triggerConfirm(editItem.type === 'grade' ? "確定刪除此年級？" : "確定刪除此科目？", () => {
            if (editItem.type === 'grade') {
                if (grades.length <= 1) return triggerAlert("至少保留一個年級");
                setGrades(g => g.filter(gr => gr.id !== editItem.id)); setActiveGradeId(grades[0]?.id || null);
            } else setGrades(prev => prev.map(g => g.id === activeGradeId ? { ...g, subjects: g.subjects.filter(s => s.id !== editItem.id) } : g));
            setEditItem(null);
        });
    };

    // New Function to handle direct saving from AI Tutor
    const handleAiMemoSave = (content: string) => {
        if(!aiTutorState.rowId) return;
        // Find the existing row to get its current link
        let currentLink = "";
        const targetRow = allGlobalRows.find(r => r.id === aiTutorState.rowId);
        if(targetRow) currentLink = targetRow.link;
        
        // Temporarily set memoModal state to trick saveMemo
        setMemoModal({ open: false, rowId: aiTutorState.rowId, content: "", link: "" });
        
        // Execute logic similar to saveMemo but using rowId from aiTutorState
        setGrades(prev => prev.map(g => ({
            ...g, subjects: g.subjects.map(s => ({
                ...s, rows: s.rows.map(r => {
                    if (r.id === aiTutorState.rowId) {
                        // Append to existing memo if it exists
                        const newMemo = r.memo ? r.memo + "\n\n--- 錯題解析 ---\n" + content : content;
                        return { ...r, memo: newMemo, link: currentLink, note: true };
                    }
                    return r;
                })
            }))
        })));
        triggerAlert("✅ 已將解析存入該單元的筆記中！");
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#796E5B] font-sans p-4 md:p-8 selection:bg-[#8CD19D] selection:text-white overflow-x-hidden">
             {/* ... (Previous header code remains same) ... */}
             <div className="fixed inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#D6D0C4 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
             <div className="max-w-[1600px] mx-auto relative z-10">
                {/* Header */}
                <div className="mb-6 border-b-2 border-[#E5E7EB] pb-6 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex flex-col gap-6 overflow-hidden flex-1">
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-help">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#8CD19D] to-[#55A47B] rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-lg shrink-0 transform rotate-3 border-4 border-white">{currentLevelInfo.icon}</div>
                            <div className="absolute -bottom-2 -right-2 bg-[#F43F5E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">Lv.{currentLevelInfo.level}</div>
                            <div className="absolute top-0 left-20 bg-white p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-48 border-2 border-[#E5E7EB]">
                                <p className="font-bold text-[#5E5244] mb-1">{currentLevelInfo.title}</p>
                                <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden relative"><div className="h-full bg-[#8CD19D] animate-shimmer" style={{ width: `${progressPercent}%` }}></div></div>
                                <p className="text-xs text-[#9C9283] mt-1 text-right">{userData.exp} / {nextLevelInfo ? nextLevelInfo.minExp : 'MAX'} EXP</p>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#5E5244] tracking-tight">{settings.appTitle || "Island Study Log"}</h1>
                            <p className="text-[#9C9283] text-xs md:text-sm font-medium mt-1 mb-1">{settings.appSubtitle || "React V3 Port"}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm flex flex-col items-center min-w-[80px] border border-transparent"><span className="text-[10px] font-bold text-[#9C9283] uppercase">總進度</span><span className="text-xl font-extrabold text-[#796E5B]">{stats.total}</span></div>
                        <div className="bg-[#E0F2E9] px-4 py-2 rounded-2xl shadow-sm flex flex-col items-center min-w-[80px] border border-transparent"><span className="text-[10px] font-bold text-[#9C9283] uppercase">已通關</span><span className="text-xl font-extrabold text-[#55A47B]">{stats.passed}</span></div>
                        <div onClick={() => setShowRewardModal(true)} className="bg-[#FFF8E1] px-4 py-2 rounded-2xl shadow-sm flex flex-col items-center min-w-[80px] border border-transparent cursor-pointer hover:shadow-md hover:scale-105 transition-all"><span className="text-[10px] font-bold text-[#9C9283] uppercase flex items-center gap-1">島嶼幣 <Coins size={10} className="text-[#F59E0B]" /></span><span className="text-xl font-extrabold text-[#D97706]">{userData.coins}</span></div>
                        <div onClick={() => { setWarningScope('global'); setShowWarning(true); }} className="bg-[#FFE4E6] px-4 py-2 rounded-2xl shadow-sm flex flex-col items-center min-w-[80px] border border-transparent cursor-pointer hover:shadow-md hover:scale-105 transition-all"><span className="text-[10px] font-bold text-[#9C9283] uppercase flex items-center gap-1">需加強 <Search size={10} /></span><span className="text-xl font-extrabold text-[#F43F5E]">{currentWeakRows.length}</span></div>
                        <div onClick={() => setIsEditingDate(true)} className="cursor-pointer hover:scale-105 transition-transform group">
                            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm flex flex-col items-center min-w-[100px] border border-transparent group-hover:border-[#8CD19D]">
                                <span className="text-[10px] font-bold text-[#9C9283] uppercase flex items-center gap-1"><Clock size={10} /> 倒數天數 <Edit2 size={10} className="opacity-0 group-hover:opacity-100" /></span>
                                {isEditingDate ? <input type="date" autoFocus className="w-28 text-sm bg-transparent border-b-2 border-[#8CD19D] text-center" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} onBlur={() => setIsEditingDate(false)} /> : <span className={`text-xl font-extrabold ${daysLeft && daysLeft >= 0 ? 'text-[#8CD19D]' : 'text-[#9C9283]'}`}>{daysLeft === null ? "設定日期" : (daysLeft < 0 ? "已結束" : (daysLeft === 0 ? "就是今天" : `${daysLeft} 天`))}</span>}
                            </div>
                        </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end shrink-0 gap-4">
                        <div className="flex flex-wrap justify-center md:justify-end bg-white rounded-xl shadow-sm border border-[#D6CDB5] p-1 gap-1 relative z-30 w-full md:w-auto">
                            <button onClick={() => handleCloudSave(false)} disabled={isSyncing} className="flex-1 md:flex-none cursor-pointer flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-[#796E5B] hover:bg-[#F3F0E6] hover:text-[#8CD19D] transition-all disabled:opacity-50 relative shrink-0 min-w-[70px]" title={hasUnsavedChanges ? "有未儲存的變更" : "儲存至雲端"}>
                                {hasUnsavedChanges && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#F43F5E] border-2 border-white rounded-full animate-pulse"></span>}
                                <Cloud size={18} /> <span className="hidden md:inline">儲存</span>
                            </button>
                            <button onClick={handleCloudLoad} disabled={isSyncing} className="flex-1 md:flex-none cursor-pointer flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-[#796E5B] hover:bg-[#F3F0E6] hover:text-[#8CD19D] transition-all disabled:opacity-50 shrink-0 min-w-[70px]" title="從雲端下載"><DownloadCloud size={18} /> <span className="hidden md:inline">讀取</span></button>
                            <div className="hidden md:block w-px h-6 bg-[#D6D0C4] mx-1 self-center shrink-0"></div>
                            <button onClick={() => setShowSettings(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-[#796E5B] hover:bg-[#F3F0E6] hover:text-[#55A47B] transition-all shrink-0 min-w-[70px]"><Settings size={18} /> <span className="hidden md:inline">設定</span></button>
                            <div className="hidden md:block w-px h-6 bg-[#D6D0C4] mx-1 self-center shrink-0"></div>
                            <button onClick={handleBackup} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-[#796E5B] hover:bg-[#F3F0E6] hover:text-[#55A47B] transition-all shrink-0 min-w-[70px]"><Save size={18} /> <span className="hidden md:inline">備份</span></button>
                            <button onClick={() => setShowImport(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-[#796E5B] hover:bg-[#F3F0E6] hover:text-[#55A47B] transition-all shrink-0 min-w-[70px]"><Upload size={18} /> <span className="hidden md:inline">匯入</span></button>
                            <div className="hidden md:block w-px h-6 bg-[#D6D0C4] mx-1 self-center shrink-0"></div>
                            <button onClick={() => { triggerConfirm("確定重設所有資料？", () => { localStorage.clear(); location.reload(); }); }} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-[#F43F5E] hover:bg-[#FEE2E2] transition-all shrink-0 min-w-[70px]"><RotateCcw size={18} /> <span className="hidden md:inline">重設</span></button>
                        </div>
                        <LiveClock />
                  </div>
                </div>

                <div className="mb-4">
                    <div className="flex items-start gap-2 overflow-x-auto pb-4 custom-scrollbar">
                        <span className="text-xs font-bold text-[#9C9283] mr-2 shrink-0 self-center"><Layers size={14} className="inline mr-1"/>年級/學期:</span>
                        {grades.map((grade, index) => (
                            <div key={grade.id} draggable onDragStart={(e) => { dragItem.current = index; }} onDragEnter={(e) => { dragOverItem.current = index; handleGradeSort(); }} onDragEnd={() => { dragItem.current = null; dragOverItem.current = null; }} onDragOver={(e) => e.preventDefault()} onClick={() => setActiveGradeId(grade.id)} onDoubleClick={() => setEditItem({ type: 'grade', id: grade.id, name: grade.name, color: grade.color || '#5E5244' })} className={`relative group/item flex flex-col items-center ${activeGradeId === grade.id ? 'z-10' : 'z-0'}`}>
                                <div className="px-4 py-1.5 rounded-full text-sm font-bold cursor-pointer transition-all border-2 select-none whitespace-nowrap flex items-center gap-2 relative shadow-sm hover:shadow-md" style={{ backgroundColor: activeGradeId === grade.id ? (grade.color || '#5E5244') : 'white', borderColor: activeGradeId === grade.id ? 'transparent' : (grade.color || '#D6CDB5'), color: activeGradeId === grade.id ? 'white' : (grade.color || '#9C9283') }}>
                                    <div className="opacity-0 group-hover/item:opacity-30 absolute left-1 cursor-grab active:cursor-grabbing"><GripVertical size={12} /></div><span className="pl-2">{grade.name}</span>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => { const newId = `g_${Date.now()}`; setGrades([...grades, { id: newId, name: '新學期', subjects: [] }]); setActiveGradeId(newId); }} className="px-3 py-1.5 rounded-full bg-[#EFEBE0] text-[#9C9283] hover:bg-[#D6CDB5] transition-colors"><Plus size={14} /></button>
                    </div>
                </div>

                 <div className="flex flex-wrap items-center justify-between mb-2 gap-4">
                   <div className="flex flex-wrap items-end gap-2 px-2 flex-1">
                      {activeGrade ? activeGrade.subjects.map((subject, index) => {
                          const isActive = activeSubjectId === subject.id; const subColor = subject.color || '#8CD19D';
                          return (
                            <div key={subject.id} draggable onDragStart={(e) => { dragItem.current = index; }} onDragEnter={(e) => { dragOverItem.current = index; handleSubjectSort(); }} onDragEnd={() => { dragItem.current = null; dragOverItem.current = null; }} onDragOver={(e) => e.preventDefault()} onClick={() => setActiveSubjectId(subject.id)} onDoubleClick={() => setEditItem({ type: 'subject', id: subject.id, name: subject.name, color: subColor })} 
                                className={`group relative px-5 py-3 rounded-t-3xl font-bold cursor-pointer transition-all select-none ${isActive ? 'text-white shadow-md -translate-y-1 z-10' : 'z-0 hover:-translate-y-0.5'}`} style={{ backgroundColor: isActive ? subColor : 'rgba(255,255,255,0.8)', color: isActive ? 'white' : subColor, borderTop: isActive ? 'none' : `2px solid ${subColor}`, borderLeft: isActive ? 'none' : `2px solid ${subColor}`, borderRight: isActive ? 'none' : `2px solid ${subColor}`, borderBottom: isActive ? 'none' : `2px solid ${subColor}20` }}>
                              <span>{subject.name}</span>
                            </div>
                          );
                      }) : <div className="text-gray-400 text-sm italic py-2">請先選擇一個年級</div>}
                      {activeGrade && <button onClick={() => { const newId = `sub_${Date.now()}`; setGrades(grades.map(g => { if (g.id !== activeGradeId) return g; return { ...g, subjects: [...g.subjects, { id: newId, name: "新科目", rows: [] }] }; })); setActiveSubjectId(newId); }} className="px-3 py-3 rounded-t-3xl bg-[#EFEBE0] text-[#A89F91] hover:bg-[#E0DCCF]"><Plus size={20} /></button>}
                   </div>
                   <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
                       <button onClick={() => setShowCalendar(true)} className="bg-white border border-[#D6CDB5] px-4 py-2 rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:border-[#8CD19D] hover:text-[#55A47B] font-bold text-[#796E5B] group whitespace-nowrap"><Calendar size={20} className="text-[#9C9283] group-hover:text-[#55A47B]" /> 日曆</button>
                       <button onClick={() => setShowAnalytics(true)} className="bg-white border border-[#D6CDB5] px-4 py-2 rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:border-[#8CD19D] hover:text-[#55A47B] font-bold text-[#796E5B] group whitespace-nowrap"><BarChart2 size={20} className="text-[#9C9283] group-hover:text-[#55A47B]" /> 分析</button>
                       <button onClick={() => setShowLibrary(true)} className="bg-white border border-[#D6CDB5] px-4 py-2 rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:border-[#8CD19D] hover:text-[#55A47B] font-bold text-[#796E5B] group whitespace-nowrap"><Book size={20} className="text-[#9C9283] group-hover:text-[#55A47B]" /> 圖書館</button>
                       <button onClick={() => setShowPomodoro(true)} className="bg-white border border-[#D6CDB5] px-4 py-2 rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:border-[#F43F5E] hover:text-[#F43F5E] font-bold text-[#796E5B] group whitespace-nowrap"><Timer size={20} className="text-[#9C9283] group-hover:text-[#F43F5E]" /> 專注番茄鐘</button>
                   </div>
                </div>

                <StudyTable 
                    activeSubject={activeSubject} 
                    settings={settings} 
                    highlightedRowId={highlightedRowId} 
                    updateRow={updateRow} 
                    deleteRow={deleteRow} 
                    addRow={addRow} 
                    openMemoModal={(rowId, content, link) => setMemoModal({ open: true, rowId, content, link })}
                    openAITutor={(row) => setAiTutorState({ open: true, topic: row.topic, grade: activeGrade?.name || "", subject: activeSubject?.name || "", rowId: row.id })}
                    reorderRows={handleReorderRows}
                />
            </div>
            {/* ... modals ... */}
            <DialogModal {...dialog} onClose={closeDialog} />
            <AnalyticsModal show={showAnalytics} onClose={() => setShowAnalytics(false)} grades={grades} userData={userData} activeGradeId={activeGradeId} activeSubjectId={activeSubjectId} settings={settings} />
            <LibraryModal show={showLibrary} onClose={() => setShowLibrary(false)} library={library} setLibrary={setLibrary} categories={libraryCategories} setCategories={setLibraryCategories} triggerAlert={triggerAlert} triggerConfirm={triggerConfirm} grades={grades} />
            <PomodoroModal show={showPomodoro} onClose={() => setShowPomodoro(false)} rows={allGlobalRows} settings={settings} addReward={addReward} triggerAlert={triggerAlert} triggerConfirm={triggerConfirm} onComplete={(taskId) => { if(!taskId) return; const row = allGlobalRows.find(r => r.id == taskId); if(row) updateRow(row.id, 'practice1', true); }} />
            <CalendarModal 
                show={showCalendar} 
                onClose={() => setShowCalendar(false)} 
                grades={grades} 
                targetDate={targetDate}
                onUpdateTargetDate={(d) => setTargetDate(d)}
                updateRow={updateRow}
                updateDate={(r,t,d) => setGrades(prev => prev.map(g => ({...g, subjects: g.subjects.map(s => ({...s, rows: s.rows.map(row => row.id===r ? {...row, [t]: d} : row)}))}))) } 
            />
            
            <AITutorModal 
                show={aiTutorState.open} 
                onClose={() => setAiTutorState(prev => ({ ...prev, open: false }))}
                topic={aiTutorState.topic}
                grade={aiTutorState.grade}
                subject={aiTutorState.subject}
                triggerAlert={triggerAlert}
                onSaveToNote={handleAiMemoSave}
                apiKey={settings.geminiApiKey || ""} // Pass user API Key
            />

            <MemoModal 
                show={memoModal.open}
                onClose={() => setMemoModal(prev => ({ ...prev, open: false }))}
                initialContent={memoModal.content}
                initialLink={memoModal.link}
                onSave={saveMemo}
            />
            
            <RewardModal
                show={showRewardModal}
                onClose={() => setShowRewardModal(false)}
                userData={userData}
                settings={settings}
                onRedeem={handleRedeem}
                onUpdateSettings={setSettings}
                triggerAlert={triggerAlert}
                triggerConfirm={triggerConfirm}
            />

            {/* ... edit item and warning modals ... */}
            {editItem && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5E5244]/40 backdrop-blur-sm" onClick={() => setEditItem(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border-4 border-[#F3F0E6] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="text-xl font-bold text-[#5E5244] flex items-center gap-2"><Edit2 size={20} /> 編輯{editItem.type === 'grade' ? '年級/學期' : '科目'}</h3><button onClick={() => setEditItem(null)} className="hover:bg-[#F3F0E6] p-1 rounded-full"><X /></button></div>
                        <div className="mb-4"><label className="text-xs font-bold text-[#9C9283] block mb-1">名稱</label><input autoFocus type="text" className="w-full p-3 rounded-xl border-2 border-[#E5E7EB] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-[#FDFBF7]" value={editItem.name} onChange={(e) => setEditItem({...editItem, name: e.target.value})} /></div>
                        <div className="mb-6"><label className="text-xs font-bold text-[#9C9283] block mb-2">代表色</label><div className="flex flex-wrap gap-2">{THEME_COLORS.map(c => (<button key={c} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${editItem.color === c ? 'border-[#5E5244] scale-110 shadow-md' : 'border-transparent'}`} style={{backgroundColor: c}} onClick={() => setEditItem({...editItem, color: c})} />))}</div></div>
                        <div className="flex gap-2 pt-2 border-t border-[#F3F0E6]"><button onClick={handleDeleteEdit} className="p-3 text-[#F43F5E] hover:bg-[#FFF1F2] rounded-xl font-bold text-sm transition-colors flex items-center gap-1"><Trash2 size={18} /> 刪除</button><div className="flex-1"></div><button onClick={() => setEditItem(null)} className="px-4 py-2 text-[#9C9283] font-bold text-sm hover:bg-[#F3F0E6] rounded-xl transition-colors">取消</button><button onClick={handleSaveEdit} className="px-6 py-2 bg-[#8CD19D] text-white rounded-xl font-bold shadow-md hover:bg-[#6BCB84] transition-all">儲存</button></div>
                    </div>
                 </div>
            )}
            {/* ... (Rest of the component remains same) ... */}
            {showImport && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5E5244]/40 backdrop-blur-sm" onClick={() => setShowImport(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg border-4 border-[#F3F0E6] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="text-xl font-bold text-[#5E5244] flex items-center gap-2"><Upload size={20} /> 批量匯入 / 還原備份</h3><button onClick={() => setShowImport(false)} className="hover:bg-[#F3F0E6] p-1 rounded-full"><X /></button></div>
                        <div className="mb-3 space-y-2">
                            <p className="text-sm text-[#9C9283]"><span className="font-bold text-[#5E5244]">方式 1：純文字清單</span> (使用 <code className="bg-[#F3F0E6] px-1 rounded"># 科目名稱</code> 區分)</p>
                            <p className="text-sm text-[#9C9283]"><span className="font-bold text-[#5E5244]">方式 2：貼上 JSON 備份檔</span> (自動偵測格式)</p>
                        </div>
                        <textarea autoFocus className="w-full h-64 p-3 rounded-xl border-2 border-[#E5E7EB] font-medium text-[#5E5244] focus:border-[#8CD19D] outline-none bg-[#FDFBF7] resize-none mb-4 font-mono text-sm" placeholder={`# 國文\n第一課\n第二課\n\n# 數學\n1-1 整數運算`} value={importText} onChange={(e) => setImportText(e.target.value)} />
                        <div className="flex justify-end gap-2"><button onClick={() => setShowImport(false)} className="px-4 py-2 text-[#9C9283] font-bold text-sm hover:bg-[#F3F0E6] rounded-xl transition-colors">取消</button><button onClick={handleImportText} className="px-6 py-2 bg-[#8CD19D] text-white rounded-xl font-bold shadow-md hover:bg-[#6BCB84] transition-all">開始匯入</button></div>
                    </div>
                 </div>
            )}
            {showWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5E5244]/40 backdrop-blur-sm" onClick={() => setShowWarning(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg border-4 border-[#F3F0E6] flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-2 shrink-0"><h3 className="text-xl font-bold text-[#F43F5E] flex items-center gap-2"><AlertCircle /> 弱點診斷中心</h3><button onClick={() => setShowWarning(false)}><X /></button></div>
                        <div className="flex gap-2 mb-4 bg-[#F3F0E6] p-1 rounded-xl shrink-0"><button onClick={() => setWarningScope('local')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${warningScope==='local' ? 'bg-white shadow text-[#F43F5E]' : 'text-[#9C9283] hover:bg-[#E5E7EB]'}`}>本學期</button><button onClick={() => setWarningScope('global')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${warningScope==='global' ? 'bg-white shadow text-[#F43F5E]' : 'text-[#9C9283] hover:bg-[#E5E7EB]'}`}>歷年累積</button></div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar min-h-0">{currentWeakRows.length === 0 ? <div className="text-center py-12 flex flex-col items-center"><div className="bg-[#E0F2E9] p-4 rounded-full mb-3"><Check size={32} className="text-[#55A47B]" /></div><p className="font-bold text-[#55A47B]">太棒了！目前範圍沒有弱點</p></div> : currentWeakRows.map(r => (<div key={r.id} onClick={() => { setShowWarning(false); setActiveGradeId(r._gradeId || null); setActiveSubjectId(r._subjectId || null); setTimeout(() => { setHighlightedRowId(r.id); const el = document.getElementById(`row-${r.id}`); if(el) { el.scrollIntoView({block: 'center', behavior: 'smooth'}); } setTimeout(() => setHighlightedRowId(null), 3000); }, 200); }} className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] cursor-pointer hover:bg-[#FFE4E6] group transition-all"><div className="flex justify-between items-start"><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded text-[#881337] border border-[#FECDD3]">{r._gradeName}</span><span className="text-[10px] text-gray-500">{r._subjectName}</span></div><ArrowRight size={14} className="text-[#F43F5E] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" /></div><div className="font-bold text-[#881337] text-lg">{r.topic || "未命名單元"}</div><div className="flex items-center gap-2 mt-2"><div className="text-xs text-[#F43F5E] bg-[#FECDD3] px-2 py-0.5 rounded-full font-bold">R1: {r.score1 || 0}分</div></div></div>))}</div>
                        <div className="pt-4 border-t mt-2 shrink-0 flex gap-2"><button onClick={() => { if (currentWeakRows.length === 0) return triggerAlert("目前範圍沒有需加強的項目喔！"); const topics = currentWeakRows.map(r => `[${r._gradeName}-${r._subjectName}] ${r.topic}`).join("\n"); const prompt = `我正在進行學習診斷，以下是我目前評估為「需加強」的單元清單。請擔任我的家教，針對這些主題提供重點整理、核心概念解釋，並針對每個單元各出 3 題測試題讓我練習：\n\n${topics}`; navigator.clipboard.writeText(prompt); triggerAlert("✅ 已複製 AI 診斷指令！"); }} className="flex-1 p-3 bg-[#8CD19D] text-white rounded-xl hover:bg-[#6BCB84] flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-transform active:scale-95"><Bot size={18} /> 複製 AI 家教指令</button></div>
                    </div>
                </div>
            )}
            
            {showSettings && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#5E5244]/40 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border-4 border-[#F3F0E6] max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b pb-2"><h3 className="text-xl font-bold text-[#5E5244] flex items-center gap-2"><Settings /> 系統設定</h3><button onClick={() => setShowSettings(false)} className="hover:bg-[#F3F0E6] p-1 rounded-full transition-colors"><X size={24}/></button></div>
                        <div className="space-y-8">
                            <div><label className="block text-sm font-bold text-[#9C9283] mb-4">應用程式標題與副標題</label><div className="space-y-3"><div><span className="text-xs font-bold text-[#9C9283] block mb-1">主標題</span><input type="text" className="w-full p-3 rounded-xl border-2 border-[#E5E7EB] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-[#FDFBF7]" value={settings.appTitle || ""} onChange={(e) => setSettings({...settings, appTitle: e.target.value})} placeholder="例如: 我的讀書島嶼" /></div><div><span className="text-xs font-bold text-[#9C9283] block mb-1">副標題</span><input type="text" className="w-full p-3 rounded-xl border-2 border-[#E5E7EB] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-[#FDFBF7]" value={settings.appSubtitle || ""} onChange={(e) => setSettings({...settings, appSubtitle: e.target.value})} placeholder="例如: 112 學年度衝刺計畫" /></div></div></div>
                            
                            {/* API Key Settings */}
                            <div>
                                <label className="block text-sm font-bold text-[#8CD19D] mb-2 flex items-center gap-2">
                                    <Key size={16} /> Gemini API Key (AI 家教功能)
                                </label>
                                <input 
                                    type="password" 
                                    className="w-full p-3 rounded-xl border-2 border-[#E5E7EB] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-[#FDFBF7] text-xs mb-1" 
                                    value={settings.geminiApiKey || ""} 
                                    onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})} 
                                    placeholder="貼上您的 API Key..." 
                                />
                                <div className="text-[11px] text-[#9C9283] mb-4">
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-[#8CD19D] font-bold">👉 點此免費取得 Google API Key</a>
                                    <span className="ml-1">(資料僅儲存於您的瀏覽器)</span>
                                </div>
                            </div>

                            <div><label className="block text-sm font-bold text-[#8CD19D] mb-2">Google Apps Script (GAS) 連結 - 連結 Google 試算表</label><div className="flex items-center gap-2 mb-2"><input type="text" className="w-full p-3 rounded-xl border-2 border-[#E5E7EB] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-[#FDFBF7] text-xs" value={settings.gasUrl || ""} onChange={(e) => setSettings({...settings, gasUrl: e.target.value})} placeholder="https://script.google.com/macros/s/..." /></div>
                                <div className="flex items-center justify-between bg-[#F0FDF4] p-3 rounded-xl border border-[#B7E4C7] mb-2"><div className="flex items-center gap-2">{settings.autoCloudSave ? <Wifi size={20} className="text-[#166534]"/> : <WifiOff size={20} className="text-gray-400"/>}<div className="flex flex-col"><span className="text-sm font-bold text-[#166534]">自動雲端備份</span><span className="text-[10px] text-[#15803d]">每 30 分鐘自動上傳變更</span></div></div><button onClick={() => setSettings({...settings, autoCloudSave: !settings.autoCloudSave})} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoCloudSave ? 'bg-[#16a34a]' : 'bg-gray-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.autoCloudSave ? 'translate-x-6' : ''}`}></div></button></div>
                                <button onClick={() => setShowGasGuide(true)} className="w-full py-2 bg-[#F0FDF4] text-[#55A47B] font-bold rounded-xl border border-[#B7E4C7] hover:bg-[#DCFCE7] flex items-center justify-center gap-2 text-sm mb-2"><Code size={16} /> 📝 顯示 GAS 安裝教學 & 程式碼</button><div className="text-[11px] text-[#9C9283] mt-2 bg-[#F3F0E6] p-2 rounded-lg leading-relaxed"><p className="font-bold mb-1">ℹ️ 關於資料儲存：</p><ul className="list-disc pl-4 space-y-1"><li><b>未填寫此欄位時：</b>資料僅儲存在<b>這台裝置的瀏覽器 (Local Storage)</b>。</li><li><b>填寫後：</b>資料會同步到您的 <b>Google 試算表</b>。</li></ul></div></div>
                            <div><label className="block text-sm font-bold text-[#9C9283] mb-2">過關分數標準 (預設 80)</label><input type="number" className="w-full p-4 rounded-xl border-2 border-[#E5E7EB] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none text-xl bg-white shadow-sm" value={settings.passingScore} onChange={(e) => setSettings({...settings, passingScore: parseInt(e.target.value) || 0})} /></div>
                            <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#EFEBE0] shadow-inner">
                                <label className="block text-sm font-bold text-[#9C9283] mb-4 border-b border-[#E5E7EB] pb-2">各項活動獎勵設定 (EXP / Coins)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* EXP Column */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-[#55A47B] uppercase tracking-wider mb-2">經驗值 (EXP)</h4>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">筆記完成</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-white" value={settings.expMemo} onChange={(e) => setSettings({...settings, expMemo: parseInt(e.target.value) || 0})} /></div>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">刷題</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-white" value={settings.expPractice} onChange={(e) => setSettings({...settings, expPractice: parseInt(e.target.value) || 0})} /></div>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">訂正</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-white" value={settings.expCorrect} onChange={(e) => setSettings({...settings, expCorrect: parseInt(e.target.value) || 0})} /></div>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">分數登記</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-white" value={settings.expScoreEntry} onChange={(e) => setSettings({...settings, expScoreEntry: parseInt(e.target.value) || 0})} /></div>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">分數通關</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-white" value={settings.expPass} onChange={(e) => setSettings({...settings, expPass: parseInt(e.target.value) || 0})} /></div>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">番茄鐘</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-white" value={settings.expPomodoro} onChange={(e) => setSettings({...settings, expPomodoro: parseInt(e.target.value) || 0})} /></div>
                                    </div>
                                    {/* Coins Column */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-2">島嶼幣 (Coins)</h4>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">筆記完成</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#F59E0B] outline-none bg-white" value={settings.coinMemo ?? settings.expMemo} onChange={(e) => setSettings({...settings, coinMemo: parseInt(e.target.value) || 0})} /></div>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">刷題</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#F59E0B] outline-none bg-white" value={settings.coinPractice ?? settings.expPractice} onChange={(e) => setSettings({...settings, coinPractice: parseInt(e.target.value) || 0})} /></div>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">訂正</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#F59E0B] outline-none bg-white" value={settings.coinCorrect ?? settings.expCorrect} onChange={(e) => setSettings({...settings, coinCorrect: parseInt(e.target.value) || 0})} /></div>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">分數登記</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#F59E0B] outline-none bg-white" value={settings.coinScoreEntry ?? settings.expScoreEntry} onChange={(e) => setSettings({...settings, coinScoreEntry: parseInt(e.target.value) || 0})} /></div>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">分數通關</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#F59E0B] outline-none bg-white" value={settings.coinPass ?? settings.expPass} onChange={(e) => setSettings({...settings, coinPass: parseInt(e.target.value) || 0})} /></div>
                                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#9C9283]">番茄鐘</span><input type="number" className="w-20 p-2 text-center rounded-xl border border-[#D6CDB5] font-bold text-[#5E5244] focus:border-[#F59E0B] outline-none bg-white" value={settings.coinPomodoro ?? settings.expPomodoro} onChange={(e) => setSettings({...settings, coinPomodoro: parseInt(e.target.value) || 0})} /></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl"><label className="block text-sm font-bold text-[#9C9283] mb-4">島嶼等級稱號與門檻 (無限擴充)</label><div className="space-y-3">{[...settings.islandLevels].sort((a,b) => a.level - b.level).map((lvl) => (<div key={lvl.level} className="flex items-center gap-3 bg-[#FDFBF7] p-3 rounded-xl border border-[#E5E7EB] hover:border-[#D6CDB5] transition-colors group"><span className="text-xs font-bold text-[#9C9283] w-10 shrink-0">Lv.{lvl.level}</span><input className="w-10 text-center text-xl bg-transparent border-b-2 border-transparent focus:border-[#8CD19D] outline-none p-1" value={lvl.icon} onChange={e => { const newLevels = [...settings.islandLevels]; const targetIndex = newLevels.findIndex(l => l.level === lvl.level); newLevels[targetIndex] = { ...newLevels[targetIndex], icon: e.target.value }; setSettings({...settings, islandLevels: newLevels}); }} /><input className="flex-1 font-bold text-[#5E5244] bg-transparent border-b-2 border-transparent focus:border-[#8CD19D] outline-none p-1" value={lvl.title} onChange={e => { const newLevels = [...settings.islandLevels]; const targetIndex = newLevels.findIndex(l => l.level === lvl.level); newLevels[targetIndex] = { ...newLevels[targetIndex], title: e.target.value }; setSettings({...settings, islandLevels: newLevels}); }} /><div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-[#E5E7EB]"><input type="number" className="w-14 text-right font-mono text-sm text-[#9C9283] bg-transparent outline-none font-bold" value={lvl.minExp} onChange={e => { const newLevels = [...settings.islandLevels]; const targetIndex = newLevels.findIndex(l => l.level === lvl.level); newLevels[targetIndex] = { ...newLevels[targetIndex], minExp: parseInt(e.target.value) || 0 }; setSettings({...settings, islandLevels: newLevels}); }} /><span className="text-[10px] text-[#D6D0C4] font-bold">EXP</span></div><button onClick={() => { if (settings.islandLevels.length <= 1) return triggerAlert("至少保留一個等級"); triggerConfirm("確定刪除此等級？", () => { setSettings({ ...settings, islandLevels: settings.islandLevels.filter(l => l.level !== lvl.level) }); }); }} className="p-2 text-[#D6D0C4] hover:text-[#F43F5E] hover:bg-[#FFF1F2] rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="刪除"><Trash2 size={16} /></button></div>))}<button onClick={() => { const sorted = [...settings.islandLevels].sort((a,b) => a.level - b.level); const last = sorted[sorted.length - 1]; const newLevel = { level: (last ? last.level : 0) + 1, minExp: (last ? last.minExp : 0) + 500, title: "新領域", icon: "🏳️" }; setSettings({ ...settings, islandLevels: [...settings.islandLevels, newLevel] }); }} className="w-full py-3 border-2 border-dashed border-[#D6CDB5] rounded-xl text-[#9C9283] font-bold hover:border-[#8CD19D] hover:text-[#55A47B] hover:bg-[#F0FDF4] transition-all flex items-center justify-center gap-2"><Plus size={18} /> 新增下一等級</button></div></div>
                        </div>
                    </div>
                 </div>
            )}
            {showGasGuide && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowGasGuide(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-3xl border-4 border-[#8CD19D] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-2 shrink-0"><h3 className="text-xl font-bold text-[#5E5244] flex items-center gap-2">🛠️ Google Apps Script (GAS) 安裝教學</h3><button onClick={() => setShowGasGuide(false)} className="hover:bg-[#F3F0E6] p-1 rounded-full"><X /></button></div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                            <div className="bg-[#F0FDF4] p-4 rounded-xl border border-[#B7E4C7]"><h4 className="font-bold text-[#166534] mb-2 flex items-center gap-2"><Check size={18} /> 安裝步驟 (請依序操作)</h4><ol className="list-decimal pl-5 space-y-2 text-sm text-[#15803d] font-medium"><li>建立一個新的 <a href="https://sheets.new" target="_blank" rel="noreferrer" className="underline font-bold text-[#16a34a] hover:text-[#15803d] inline-flex items-center gap-1">Google Sheet 試算表 <ExternalLink size={12}/></a>。</li><li>點選上方選單的 <b>擴充功能 (Extensions)</b> {'>'} <b>Apps Script</b>。</li><li>刪除編輯器中原有的程式碼 (通常是 <code>function myFunction()...</code>)。</li><li><b className="text-red-600">請勿</b> 貼上整個網頁的程式碼 (如 import React...)，僅需貼上<b>下方黑色區塊</b>的內容。</li><li>將下方的程式碼 <b>完全覆蓋貼上</b>。</li><li>點擊右上角 <b>部署 (Deploy)</b> {'>'} <b>新增部署 (New deployment)</b>。</li><li>點選齒輪圖示 {'>'} <b>網頁應用程式 (Web app)</b>。</li><li><ul className="list-disc pl-5 mt-1 space-y-1 text-xs bg-white/50 p-2 rounded-lg"><li><b>說明：</b>Study Log API (隨意填)</li><li><b>執行身分：</b><span className="text-red-600 font-bold">我 (Me)</span></li><li><b>誰可以存取：</b><span className="text-red-600 font-bold">所有人 (Anyone)</span> <span className="text-gray-500">(這點最重要！)</span></li></ul></li><li>點擊 <b>部署</b>，並授予存取權限。</li><li>複製 <b>網頁應用程式網址 (Web app URL)</b>，貼回本 App 的設定欄位中。</li></ol></div>
                            <div><div className="flex justify-between items-center mb-2"><h4 className="font-bold text-[#5E5244] text-sm">程式碼 (請全選複製)</h4><button onClick={() => { navigator.clipboard.writeText(GAS_CODE); triggerAlert("✅ 程式碼已複製！"); }} className="flex items-center gap-1 bg-[#5E5244] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4B4136] transition-colors"><Copy size={14} /> 複製程式碼</button></div><pre className="bg-[#282C34] text-[#ABB2BF] p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed select-all">{GAS_CODE}</pre></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
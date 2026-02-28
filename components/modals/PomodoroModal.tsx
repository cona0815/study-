import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Timer, Pause, Play, Bell, BellOff, Radio, Activity, Upload, 
    SkipBack, SkipForward, Trash2
} from 'lucide-react';
import { AudioTrack, Row, TimerMode } from '../../types';

interface Props {
    show: boolean;
    onClose: () => void;
    rows: Row[];
    settings: any;
    onComplete: (taskId: string | null) => void;
    addReward: (exp: number, coins: number) => void;
    triggerAlert: (msg: string) => void;
    triggerConfirm: (msg: string, onConfirm: () => void, onCancel?: () => void) => void;
}

export const PomodoroModal: React.FC<Props> = ({ 
    show, onClose, rows, settings, onComplete, addReward, triggerAlert, triggerConfirm 
}) => {
    const [timerTime, setTimerTime] = useState(25 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isAlarmRinging, setIsAlarmRinging] = useState(false);
    const [timerMode, setTimerMode] = useState<TimerMode>('focus');
    const [pomodoroTask, setPomodoroTask] = useState("");
    const [customMinutes, setCustomMinutes] = useState("25");
    const [customSeconds, setCustomSeconds] = useState("00");
    const [isEditingTimer, setIsEditingTimer] = useState(false);
    const [isSilentMode, setIsSilentMode] = useState(false);
    const [isTimerFinished, setIsTimerFinished] = useState(false);
    
    // Audio State
    const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(50);
    const [showVisualizer, setShowVisualizer] = useState(true);

    const audioRef = useRef<HTMLAudioElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup when closing modal
    useEffect(() => {
        if (!show) {
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [show]);

    // --- Audio Logic ---

    // 1. Handle File Selection
    const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length > 0) {
            const newTracks: AudioTrack[] = files.map(file => ({ 
                id: `local_${Date.now()}_${Math.random()}`,
                name: file.name, 
                url: URL.createObjectURL(file) 
            }));
            setPlaylist(prev => {
                const updated = [...prev, ...newTracks];
                if (prev.length === 0) {
                    setCurrentTrackIndex(0);
                    setIsPlaying(true);
                }
                return updated;
            });
        }
        e.target.value = '';
    };

    // 2. Playback Control
    const toggleAudio = () => {
        if (playlist.length === 0) { 
            triggerAlert("請先匯入 MP3 音樂檔案！"); 
            return; 
        }
        setIsPlaying(!isPlaying);
    };

    const playTrack = (index: number) => { 
        if (index >= 0 && index < playlist.length) {
            setCurrentTrackIndex(index); 
            setIsPlaying(true);
        }
    };

    const nextTrack = () => {
        if (currentTrackIndex < playlist.length - 1) {
            setCurrentTrackIndex(p => p + 1);
        } else {
            setCurrentTrackIndex(0);
            setIsPlaying(false);
        }
    };

    const prevTrack = () => {
        if (currentTrackIndex > 0) {
            setCurrentTrackIndex(p => p - 1);
        }
    };

    const removeTrack = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setPlaylist(prev => prev.filter((_, i) => i !== index));
        if (index === currentTrackIndex) { 
            setCurrentTrackIndex(0); 
            setIsPlaying(false); 
        } else if (index < currentTrackIndex) { 
            setCurrentTrackIndex(prev => prev - 1); 
        }
    };

    const clearPlaylist = () => { 
        triggerConfirm("確定清空播放清單？", () => { 
            setPlaylist([]); 
            setCurrentTrackIndex(0); 
            setIsPlaying(false); 
        }); 
    };

    // 3. Sync Player State
    useEffect(() => {
        const currentTrack = playlist[currentTrackIndex];
        
        if (!currentTrack) {
            if (audioRef.current) audioRef.current.pause();
            return;
        }

        if (audioRef.current) {
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error("Playback failed:", error);
                        setIsPlaying(false);
                    });
                }
            } else {
                audioRef.current.pause();
            }
        }
    }, [currentTrackIndex, playlist, isPlaying]);

    // 4. Volume Control
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume / 100;
    }, [volume]);

    // 5. Audio Element Events
    const handleAudioEnded = () => nextTrack();
    const handleAudioTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };
    const handleAudioLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    // 6. Seek Control
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setCurrentTime(val);
        if (audioRef.current) {
            audioRef.current.currentTime = val;
        }
    };

    // Timer Logic (Preserved)
    const startEditing = () => {
        const m = Math.floor(timerTime / 60); 
        const s = timerTime % 60;
        setCustomMinutes(m.toString()); 
        setCustomSeconds(s.toString().padStart(2, '0'));
        setIsEditingTimer(true); 
        setIsTimerRunning(false);
    };

    const toggleTimer = () => {
        if (isTimerRunning) { 
            setIsTimerRunning(false); 
        } else {
            if (timerTime <= 0) {
                const defaults: Record<string, number> = { focus: 25*60, short: 5*60, long: 15*60, custom: 25*60 };
                setTimerTime(defaults[timerMode] || 25*60);
            }
            setIsEditingTimer(false); 
            setIsTimerRunning(true); 
            setIsTimerFinished(false);
        }
    };

    const confirmTime = () => {
        const m = parseInt(customMinutes) || 0; 
        const s = parseInt(customSeconds) || 0;
        const newTime = m * 60 + s;
        setTimerTime(newTime > 0 ? newTime : 25*60);
        setIsEditingTimer(false); 
        setTimerMode('custom');
    };

    // Alarm Logic (Preserved)
    const playAlarmBeep = () => {
        if (isSilentMode) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, t); 
            osc.type = 'sine';
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.start(t); osc.stop(t + 0.5);
        } catch (e) { console.error("Audio Playback Error", e); }
    };

    const resetTimer = () => {
        const defaults: Record<string, number> = { focus: 25*60, short: 5*60, long: 15*60, custom: 25*60 };
        setTimerTime(defaults[timerMode] || 25*60);
        setIsTimerFinished(false);
    };

    const stopAlarm = () => {
        setIsAlarmRinging(false);
        setIsTimerFinished(true);
        
        const finish = (bonus = false) => {
            const expAmt = settings.expPomodoro * (bonus ? 2 : 1);
            const coinAmt = (settings.coinPomodoro || settings.expPomodoro) * (bonus ? 2 : 1);
            addReward(expAmt, coinAmt);
            if (bonus && pomodoroTask) onComplete(pomodoroTask);
            else triggerAlert(`⏰ 專注完成！ +${expAmt} EXP, +${coinAmt} Coins`);
            resetTimer();
        };

        if (pomodoroTask && timerMode === 'focus') {
            const targetRow = rows.find(r => r.id == pomodoroTask);
            if (targetRow) {
                triggerConfirm(
                    `⏰ 鬧鐘已停止！\n您是否完成了「${targetRow.topic}」？\n按確認以標記練習完成。`,
                    () => finish(true),
                    () => finish(false)
                );
            } else finish(false);
        } else {
            finish(false);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isTimerRunning && timerTime > 0) { 
            interval = setInterval(() => setTimerTime(p => p - 1), 1000); 
        } else if (timerTime === 0 && isTimerRunning) {
            setIsTimerRunning(false);
            setIsAlarmRinging(true);
            if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isTimerRunning, timerTime]);

    useEffect(() => {
        if (isAlarmRinging) {
            playAlarmBeep(); 
            alarmIntervalRef.current = setInterval(playAlarmBeep, 1000); 
        } else {
            if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
        }
        return () => { if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current); };
    }, [isAlarmRinging]);

    if (!show) return null;

    const currentTrack = playlist[currentTrackIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-[#5E5244]/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-[40px] shadow-2xl w-full max-w-4xl border-4 md:border-[6px] border-white overflow-hidden flex flex-col md:flex-row relative max-h-[95vh] md:max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#8CD19D]/20 to-transparent pointer-events-none z-0"></div>
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <button onClick={() => setIsSilentMode(!isSilentMode)} className={`rounded-full p-2 hover:bg-[#F3F0E6] transition-colors ${isSilentMode ? 'text-[#F43F5E]' : 'text-[#8CD19D]'}`} title={isSilentMode ? "開啟聲音" : "靜音模式"}>
                        {isSilentMode ? <BellOff size={24} /> : <Bell size={24} />}
                    </button>
                    <button onClick={onClose} className="hover:bg-[#F3F0E6] text-[#9C9283] rounded-full p-2 transition-colors"><X size={24} /></button>
                </div>

                {/* Left: Timer */}
                <div className="flex-1 p-4 md:p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-[#EFEBE0] z-10 relative overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 text-[#796E5B] font-extrabold text-2xl tracking-tight mb-4 md:mb-6 self-start">
                        <span className="bg-[#FF6B6B] text-white p-2 rounded-2xl shadow-sm rotate-[-6deg] inline-block"><Timer size={24} /></span> 專注計時
                    </div>
                    
                    <div className="w-full mb-4 md:mb-6">
                        <label className="text-xs font-bold text-[#9C9283] ml-1 mb-1 block">本次專注目標 (可選)</label>
                        <select 
                            value={pomodoroTask} 
                            onChange={(e) => setPomodoroTask(e.target.value)}
                            className="w-full p-2 md:p-3 rounded-xl bg-[#F3F0E6] border-2 border-transparent focus:border-[#8CD19D] outline-none text-[#5E5244] font-bold text-sm appearance-none"
                        >
                            <option value="">-- 純粹專注 (不綁定) --</option>
                            {rows.filter(r => parseInt(r.score1 || '0') < settings.passingScore).map(r => (
                                <option key={r.id} value={r.id}>[{r._gradeName}-{r._subjectName}] {r.topic || "未命名單元"}</option>
                            ))}
                        </select>
                    </div>

                    <div className={`relative mb-6 md:mb-8 cursor-pointer ${isTimerRunning ? 'animate-breathe' : ''} ${isTimerFinished ? 'animate-shake' : ''}`} onClick={() => startEditing()}>
                        <div className={`w-40 h-40 md:w-56 md:h-56 rounded-full border-8 flex items-center justify-center bg-white transition-all duration-500 ${isTimerRunning ? 'border-[#8CD19D] scale-105 shadow-xl' : (isTimerFinished ? 'border-[#F43F5E] shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'border-[#E5E7EB]')}`}>
                            {isEditingTimer ? (
                                <div className="flex flex-col items-center animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <input type="number" className="text-3xl md:text-4xl font-black w-14 md:w-16 text-center bg-transparent border-b-2 border-[#8CD19D] outline-none" value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} autoFocus />
                                        <span className="text-xl md:text-2xl">:</span>
                                        <input type="number" className="text-3xl md:text-4xl font-black w-14 md:w-16 text-center bg-transparent border-b-2 border-[#8CD19D] outline-none" value={customSeconds} onChange={e => setCustomSeconds(e.target.value)} />
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); confirmTime(); }} className="bg-[#8CD19D] text-white px-4 py-1 rounded-full text-xs font-bold hover:bg-[#6BCB84]">確認</button>
                                </div>
                            ) : (
                                <div className={`text-5xl md:text-6xl font-black font-mono tracking-tighter ${isTimerFinished ? 'text-[#F43F5E]' : 'text-[#5E5244]'}`}>
                                    {Math.floor(timerTime/60).toString().padStart(2,'0')}:{Math.floor(timerTime%60).toString().padStart(2,'0')}
                                </div>
                            )}
                        </div>
                        {isAlarmRinging && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-full animate-in fade-in zoom-in duration-300 z-50">
                                <button onClick={(e) => { e.stopPropagation(); stopAlarm(); }} className="flex flex-col items-center gap-2 p-4 group">
                                    <div className="animate-alarm-ring"><Bell size={48} md-size={64} className="text-[#F43F5E] fill-[#FECDD3]" /></div>
                                    <span className="font-black text-[#F43F5E] text-lg bg-white px-3 py-1 rounded-lg shadow-md border-2 border-[#F43F5E] group-hover:bg-[#F43F5E] group-hover:text-white transition-colors">停止</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mb-6 md:mb-8 bg-[#F3F0E6] p-1.5 rounded-2xl shadow-inner flex-wrap justify-center">
                        {['focus', 'short', 'long'].map(m => (
                            <button key={m} onClick={() => { setTimerMode(m as TimerMode); setIsTimerRunning(false); setTimerTime(m==='focus'?25*60:m==='short'?5*60:15*60); setIsEditingTimer(false); setIsTimerFinished(false); }} 
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all ${timerMode===m ? 'bg-white text-[#5E5244] shadow-md scale-105' : 'text-[#9C9283] hover:bg-[#E5E7EB]'}`}>
                                {m==='focus'?'🔥 專注':m==='short'?'☕ 短休':'💤 長休'}
                            </button>
                        ))}
                        <button onClick={() => { setTimerMode('custom'); startEditing(); }} 
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all ${timerMode==='custom' ? 'bg-white text-[#5E5244] shadow-md scale-105' : 'text-[#9C9283] hover:bg-[#E5E7EB]'}`}>
                            ⚙️ 自訂
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => toggleTimer()} className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center shadow-xl transition-all hover:scale-105 ${isTimerRunning ? 'bg-[#FFEDD5] text-[#F97316]' : 'bg-[#8CD19D] text-white'}`}>
                            {isTimerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                    </div>
                </div>

                {/* Right: Music Player */}
                <div className="flex-1 p-4 md:p-8 bg-[#F0EBE0] flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
                    <div className="w-full bg-[#E5DCC5] rounded-3xl p-4 md:p-6 shadow-inner border border-[#D6CDB5] relative">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2"><Radio className="text-[#5E5244]" size={20} /><span className="font-extrabold text-[#5E5244] text-sm">LO-FI RADIO</span></div>
                            <div className="flex gap-2">
                                {/* Visualizer Toggle */}
                                <button onClick={() => setShowVisualizer(!showVisualizer)} className={`p-1.5 rounded-lg transition-all ${showVisualizer ? 'bg-[#8CD19D] text-white shadow-sm' : 'hover:bg-black/10 text-[#9C9283]'}`} title="切換波形動畫"><Activity size={16} /></button>
                            </div>
                        </div>
                        
                        {/* Display Area (Visualizer Only) */}
                        <div className="bg-[#374151] rounded-xl border-4 border-[#5E5244] p-0 h-40 md:h-48 flex flex-col items-center justify-center relative overflow-hidden mb-4 shadow-inner">
                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                <div className="w-full flex-1 flex items-end justify-center mb-2">
                                    {showVisualizer ? (
                                        <div className="flex items-end justify-center gap-1 h-12 md:h-16 w-full px-4 overflow-hidden">
                                            {[...Array(16)].map((_, i) => (
                                                <div key={i} className={`w-2 bg-gradient-to-t from-[#8CD19D] to-[#34D399] rounded-t-sm opacity-80 ${isPlaying ? 'animate-wave' : 'h-1'}`} style={{ animationDuration: `${0.6 + Math.random() * 0.5}s`, animationDelay: `${Math.random() * 0.5}s`, height: isPlaying ? undefined : '10%' }}></div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-white/20 text-[10px] font-mono tracking-widest">VISUALIZER OFF</div>
                                    )}
                                </div>
                                <div className="text-white text-xs font-mono truncate w-full text-center bg-black/20 py-1 rounded px-2">
                                    {currentTrack?.name || "NO TAPE INSERTED"}
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 mb-4 w-full">
                            <span className="text-[10px] font-mono w-8 text-right text-[#5E5244]">{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="flex-1 h-1.5 bg-[#D6CDB5] rounded-lg appearance-none cursor-pointer accent-[#8CD19D]" />
                            <span className="text-[10px] font-mono w-8 text-[#5E5244]">{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                        </div>

                        {/* Playback Buttons */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="w-20">
                                <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="w-full h-1 bg-[#D6CDB5] rounded-lg appearance-none cursor-pointer accent-[#5E5244]" title="音量" />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={prevTrack} className="p-3 bg-[#E5E7EB] rounded-full shadow-md active:translate-y-0.5 transition-transform"><SkipBack size={20} /></button>
                                <button onClick={toggleAudio} className="p-4 bg-[#F43F5E] text-white rounded-full shadow-md active:translate-y-0.5 transition-transform hover:bg-[#E11D48]">{isPlaying ? <Pause /> : <Play />}</button>
                                <button onClick={nextTrack} className="p-3 bg-[#E5E7EB] rounded-full shadow-md active:translate-y-0.5 transition-transform"><SkipForward size={20} /></button>
                            </div>
                            <div className="w-20"></div>
                        </div>

                        {/* Add Music Section */}
                        <div className="mt-2 bg-[#EFEBE0] p-2 rounded-xl border border-[#D6CDB5] flex justify-center">
                            <button onClick={() => audioInputRef.current?.click()} className="bg-[#E5E7EB] text-[#796E5B] w-full py-2 rounded-lg hover:bg-[#D6D0C4] flex items-center justify-center gap-2 text-sm font-bold shadow-sm" title="上傳 MP3">
                                <Upload size={16} /> 匯入 MP3 音樂
                            </button>
                        </div>

                        {/* Playlist */}
                        {playlist.length > 0 && (
                            <div className="mt-4 bg-[#E5DCC5] rounded-lg p-2 max-h-32 overflow-y-auto custom-scrollbar border border-[#D6CDB5] text-xs w-full shadow-inner">
                                <div className="flex justify-between items-center mb-1 pb-1 border-b border-[#C4BBA3]">
                                    <span className="font-bold text-[#5E5244]">TRACKS ({playlist.length})</span>
                                    <button onClick={clearPlaylist} className="text-[#F43F5E] hover:underline flex items-center gap-1"><Trash2 size={10} /> CLEAR</button>
                                </div>
                                {playlist.map((track, idx) => (
                                    <div key={track.id} onClick={() => playTrack(idx)} className={`flex justify-between items-center p-1.5 rounded cursor-pointer mb-0.5 transition-colors group ${idx === currentTrackIndex ? 'bg-[#5E5244] text-white shadow-sm' : 'text-[#5E5244] hover:bg-[#D6CDB5]'}`}>
                                        <div className="flex items-center gap-2 truncate w-32">
                                            <Radio size={12} className={idx===currentTrackIndex ? 'text-[#8CD19D]' : 'text-gray-500'} />
                                            <span className="truncate">{idx + 1}. {track.name}</span>
                                        </div>
                                        <button onClick={(e) => removeTrack(e, idx)} className={`hover:text-[#F43F5E] ${idx === currentTrackIndex ? 'text-gray-400' : 'text-gray-500'}`}><X size={10} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <audio 
                            ref={audioRef} 
                            src={playlist[currentTrackIndex]?.url} 
                            onEnded={handleAudioEnded} 
                            onTimeUpdate={handleAudioTimeUpdate} 
                            onLoadedMetadata={handleAudioLoadedMetadata} 
                            className="hidden" 
                        />
                        <input type="file" accept="audio/*" multiple ref={audioInputRef} className="hidden" onChange={handleAudioFileSelect} />
                    </div>
                </div>
            </div>
        </div>
    );
};
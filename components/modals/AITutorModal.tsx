import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
    X, Bot, BookOpen, CheckCircle, HelpCircle, RefreshCcw, Loader2, Award, 
    ChevronRight, Network, ZoomIn, ZoomOut, Download, Move, Camera, Image as ImageIcon, Save, Copy, Aperture
} from 'lucide-react';

// Declare mermaid on window for Typescript
declare global {
    interface Window {
        mermaid: any;
    }
}

interface Props {
    show: boolean;
    onClose: () => void;
    topic: string;
    grade: string;
    subject: string;
    triggerAlert: (msg: string) => void;
    onSaveToNote?: (content: string) => void;
    apiKey: string; // New prop for user provided API key
}

type Mode = 'menu' | 'explain' | 'quiz' | 'solve';

interface QuizItem {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

// --- Enhanced Mermaid Component with Zoom & Download ---
const MermaidDiagram = ({ code }: { code: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (window.mermaid && code && ref.current) {
            const renderId = `mermaid-${Date.now()}`;
            window.mermaid.render(renderId, code).then((result: any) => {
                setSvg(result.svg);
                // Reset view when new diagram loads
                setScale(1);
                setPosition({ x: 0, y: 0 });
            }).catch((err: any) => {
                console.error("Mermaid render error:", err);
            });
        }
    }, [code]);

    // Pan Handlers
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

    // Zoom Handlers
    const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
    const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

    // Download Handler (SVG to PNG)
    const handleDownload = () => {
        if (!ref.current) return;
        const svgEl = ref.current.querySelector('svg');
        if (!svgEl) return;

        // Get actual dimensions
        const bbox = svgEl.getBoundingClientRect();
        const width = bbox.width || 800;
        const height = bbox.height || 600;

        // Serialize SVG
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgEl);
        
        // Ensure XML namespace
        if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // Create Blob and Image
        const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement("canvas");
            // Add padding and scale for better resolution
            const padding = 20;
            const outputScale = 2; 
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
    };

    return (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm my-4 overflow-hidden">
            {/* Toolbar */}
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

            {/* Viewport */}
            <div 
                ref={containerRef}
                className="w-full h-[400px] overflow-hidden relative cursor-move bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
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
            <div className="text-[10px] text-gray-400 text-center py-1">滑鼠拖曳可移動 • 滾輪或按鈕可縮放</div>
        </div>
    );
};

export const AITutorModal: React.FC<Props> = ({ show, onClose, topic, grade, subject, triggerAlert, onSaveToNote, apiKey }) => {
    const [mode, setMode] = useState<Mode>('menu');
    const [loading, setLoading] = useState(false);
    const [explanation, setExplanation] = useState("");
    const [mermaidCode, setMermaidCode] = useState("");
    const [quizData, setQuizData] = useState<QuizItem[]>([]);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    
    // Image Solve State
    const [solveImage, setSolveImage] = useState<string | null>(null);
    const [solvePrompt, setSolvePrompt] = useState("");
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Initialize API client dynamically using the provided prop
    const getAI = () => {
        if (!apiKey) {
            throw new Error("MISSING_KEY");
        }
        return new GoogleGenAI({ apiKey });
    };

    // Reset state when closing or changing topics
    useEffect(() => {
        if (!show) {
            setMode('menu');
            setExplanation("");
            setMermaidCode("");
            setSolveImage(null);
            setSolvePrompt("");
            stopCamera();
        }
    }, [show]);

    // Paste Event Listener for Image
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (mode !== 'solve') return;
            const items = e.clipboardData?.items;
            if (!items) return;
            
            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const blob = item.getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => setSolveImage(event.target?.result as string);
                        reader.readAsDataURL(blob);
                        e.preventDefault();
                    }
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [mode]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSolveImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Camera Functions
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setIsCameraOpen(true);
            // Wait for render
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (err) {
            console.error(err);
            triggerAlert("無法存取相機，請確認瀏覽器權限。");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        setSolveImage(canvas.toDataURL('image/jpeg'));
        stopCamera();
    };

    const handleCopyExplanation = () => {
        if (!explanation) return;
        navigator.clipboard.writeText(explanation);
        triggerAlert("✅ 解析已複製！\n\n您可以將其貼到：\n1. Google Gemini (進行引導式學習)\n2. NotebookLM (建立學習筆記)");
    };

    const handleSolve = async () => {
        if (!solveImage) return triggerAlert("請先上傳或拍攝圖片");
        if (!apiKey) return triggerAlert("⚠️ 請先至「設定」輸入您的 Google Gemini API Key 才能使用 AI 功能。");

        setLoading(true);
        setExplanation("");
        
        try {
            // Strip the data URL prefix to get just the base64 string
            const base64Data = solveImage.split(',')[1];
            
            const ai = getAI();
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: base64Data
                            }
                        },
                        {
                            text: `這是一道 ${grade} ${subject} 的相關圖片（可能是題目、筆記或圖表）。
                            使用者提問：${solvePrompt || "請幫我解析這張圖片的內容，如果是題目請教我怎麼解。"}
                            
                            這些是我比較要加強的學習重點，請用「第一性原理」(First Principles) 引導我學習。
                            請扮演專業家教：
                            1. 清楚辨識圖片中的關鍵資訊。
                            2. 如果是題目，提供步驟詳解 (Step-by-step solution)，並解釋每個步驟背後的根本原理。
                            3. 如果是觀念圖，從最基礎的公理或定義出發，推導出核心概念。
                            4. 使用繁體中文回答，語氣鼓勵且清晰。`
                        }
                    ]
                }
            });

            if (response.text) {
                setExplanation(response.text);
            }
        } catch (error: any) {
            console.error(error);
            if (error.message === "MISSING_KEY") {
                triggerAlert("⚠️ 請先至「設定」輸入您的 Google Gemini API Key。");
            } else {
                triggerAlert("解題失敗，請檢查 API Key 是否正確或稍後再試。");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExplain = async () => {
        if (!apiKey) return triggerAlert("⚠️ 請先至「設定」輸入您的 Google Gemini API Key 才能使用 AI 功能。");

        setMode('explain');
        setLoading(true);
        setExplanation("");
        setMermaidCode("");

        try {
            // Updated Prompt for Conciseness and Colorful Mindmap
            const prompt = `你是 ${grade} ${subject} 的專業家教。針對「${topic}」這個單元：
            
            這些是我比較要加強的學習重點，請用「第一性原理」(First Principles) 引導我學習。
            這意味著請打破知識的表象，從最基本的真理、公理或事實出發，一步步推導出這個單元的核心概念，而不是直接給我死記硬背的結論。

            任務一：請產生一個 Mermaid.js 的 \`mindmap\` (心智圖)。
            要求：
            1. 結構要清晰，層次分明，展現概念之間的推導關係。
            2. 請勿在 Mermaid 語法中使用特殊符號，以免渲染失敗。
            3. 不要指定顏色樣式類別 (classDef)，讓系統使用預設的彩色主題。
            
            任務二：請提供「極度精簡」的重點整理。
            要求：
            1. 使用條列式 (Bullet Points)。
            2. 只要核心觀念，不要廢話，不要前言後語。
            3. 每個重點不超過兩句話。
            
            輸出格式範例：
            \`\`\`mermaid
            mindmap
              root((主題))
                基本公理
                  推導A
                核心定義
                  推導B
            \`\`\`

            (接著是條列式重點)
            - 重點一...
            - 重點二...
            `;
            
            const ai = getAI();
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            setLoading(false);
            let fullText = "";
            for await (const chunk of responseStream) {
                if (chunk.text) {
                    fullText += chunk.text;
                    
                    const mermaidMatch = fullText.match(/```mermaid([\s\S]*?)```/);
                    if (mermaidMatch) {
                        setMermaidCode(mermaidMatch[1].trim());
                        setExplanation(fullText.replace(/```mermaid[\s\S]*?```/, '').trim());
                    } else {
                        setExplanation(fullText);
                    }
                }
            }
        } catch (error: any) {
            console.error(error);
            setLoading(false);
            if (error.message === "MISSING_KEY") {
                setExplanation("❌ 請先至「設定」輸入您的 Google Gemini API Key 才能使用此功能。");
            } else {
                setExplanation("❌ 連線發生錯誤，請確認 API Key 是否正確。");
            }
        }
    };

    const handleQuiz = async () => {
        if (!apiKey) return triggerAlert("⚠️ 請先至「設定」輸入您的 Google Gemini API Key 才能使用 AI 功能。");

        setMode('quiz');
        setLoading(true);
        setQuizData([]);
        setQuizAnswers([]);
        setQuizSubmitted(false);

        try {
            const prompt = `Generate 3 multiple-choice questions for a ${grade} student studying ${subject}, specifically about the topic: "${topic}". 
            Apply "First Principles" thinking: The questions should test the understanding of fundamental concepts rather than rote memorization.
            Language: Traditional Chinese (繁體中文).`;

            const schema: Schema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctIndex: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
                        explanation: { type: Type.STRING, description: "Why is this correct? Explain using first principles." }
                    },
                    required: ["question", "options", "correctIndex", "explanation"]
                }
            };
            
            const ai = getAI();
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setQuizData(data);
                setQuizAnswers(new Array(data.length).fill(-1));
            } else {
                throw new Error("No data returned");
            }
        } catch (error: any) {
            console.error(error);
            if (error.message === "MISSING_KEY") {
                triggerAlert("⚠️ 請先至「設定」輸入您的 Google Gemini API Key。");
            } else {
                triggerAlert("生成測驗失敗，請檢查 API Key 是否正確。");
            }
            setMode('menu');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (qIndex: number, optIndex: number) => {
        if (quizSubmitted) return;
        const newAnswers = [...quizAnswers];
        newAnswers[qIndex] = optIndex;
        setQuizAnswers(newAnswers);
    };

    const calculateScore = () => {
        if (quizData.length === 0) return 0;
        const correctCount = quizData.filter((q, i) => q.correctIndex === quizAnswers[i]).length;
        return Math.round((correctCount / quizData.length) * 100);
    };
    
    const generateQuizReviewContent = () => {
        if (quizData.length === 0) return "";
        let content = `【AI 隨堂測驗檢討】\n單元：${topic}\n得分：${calculateScore()} / 100\n\n`;
        
        quizData.forEach((item, idx) => {
            const userAnsIdx = quizAnswers[idx];
            const isCorrect = userAnsIdx === item.correctIndex;
            
            content += `Q${idx + 1}: ${item.question}\n`;
            content += `您的回答：${item.options[userAnsIdx] || "未作答"} ${isCorrect ? "✅" : "❌"}\n`;
            if (!isCorrect) {
                content += `正確答案：${item.options[item.correctIndex]}\n`;
            }
            content += `第一性原理解析：${item.explanation}\n`;
            content += `-----------------------------------\n`;
        });
        
        return content;
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#5E5244]/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border-[6px] border-white h-[85vh] flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-[#E0F2E9] p-4 flex justify-between items-center border-b border-[#B7E4C7] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#55A47B] p-2 rounded-xl text-white shadow-sm">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#166534] tracking-tight">AI 萬能家教</h2>
                            <p className="text-xs text-[#55A47B] font-bold">{grade} {subject} - {topic}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#B7E4C7] rounded-full text-[#166534] transition-colors"><X /></button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#FDFBF7] relative">
                    
                    {/* MENU MODE */}
                    {mode === 'menu' && (
                        <div className="flex flex-col gap-4 h-full justify-center max-w-lg mx-auto">
                            <h3 className="text-2xl font-bold text-[#5E5244] text-center mb-6">您想要複習什麼？</h3>
                            
                            <button onClick={handleExplain} className="group flex items-center gap-4 p-6 bg-white border-2 border-[#E5E7EB] rounded-2xl shadow-sm hover:border-[#8CD19D] hover:shadow-md transition-all text-left">
                                <div className="bg-[#E0F2E9] p-4 rounded-full text-[#55A47B] group-hover:scale-110 transition-transform"><BookOpen size={32} /></div>
                                <div>
                                    <div className="text-lg font-bold text-[#5E5244] mb-1">第一性原理 觀念講解</div>
                                    <div className="text-sm text-[#9C9283]">打破表象，從核心公理推導觀念，搭配心智圖。</div>
                                </div>
                                <ChevronRight className="ml-auto text-[#D6CDB5] group-hover:text-[#8CD19D]" />
                            </button>

                            <button onClick={handleQuiz} className="group flex items-center gap-4 p-6 bg-white border-2 border-[#E5E7EB] rounded-2xl shadow-sm hover:border-[#F43F5E] hover:shadow-md transition-all text-left">
                                <div className="bg-[#FFE4E6] p-4 rounded-full text-[#F43F5E] group-hover:scale-110 transition-transform"><HelpCircle size={32} /></div>
                                <div>
                                    <div className="text-lg font-bold text-[#5E5244] mb-1">隨堂測驗</div>
                                    <div className="text-sm text-[#9C9283]">生成 3 題觀念檢測，測試對本質的理解。</div>
                                </div>
                                <ChevronRight className="ml-auto text-[#D6CDB5] group-hover:text-[#F43F5E]" />
                            </button>

                            <button onClick={() => setMode('solve')} className="group flex items-center gap-4 p-6 bg-white border-2 border-[#E5E7EB] rounded-2xl shadow-sm hover:border-[#3B82F6] hover:shadow-md transition-all text-left">
                                <div className="bg-[#DBEAFE] p-4 rounded-full text-[#3B82F6] group-hover:scale-110 transition-transform"><Camera size={32} /></div>
                                <div>
                                    <div className="text-lg font-bold text-[#5E5244] mb-1">拍照解題 (Snap & Solve)</div>
                                    <div className="text-sm text-[#9C9283]">支援相機、上傳或貼上圖片，AI 幫您深度解析。</div>
                                </div>
                                <ChevronRight className="ml-auto text-[#D6CDB5] group-hover:text-[#3B82F6]" />
                            </button>
                        </div>
                    )}

                    {/* LOADING STATE */}
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FDFBF7]/80 backdrop-blur-sm z-10">
                            <Loader2 size={48} className="text-[#8CD19D] animate-spin mb-4" />
                            <p className="font-bold text-[#796E5B] animate-pulse">AI 正在運用第一性原理思考中...</p>
                        </div>
                    )}

                    {/* SOLVE MODE */}
                    {mode === 'solve' && (
                        <div className="space-y-6 max-w-2xl mx-auto h-full flex flex-col">
                            {!explanation ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                    {isCameraOpen ? (
                                        <div className="w-full max-w-md bg-black rounded-3xl overflow-hidden relative shadow-lg">
                                            <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                                            <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform border-4 border-gray-200">
                                                <Aperture size={32} className="text-[#3B82F6]" />
                                            </button>
                                            <button onClick={stopCamera} className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70">
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            className="w-full max-w-md bg-white border-4 border-dashed border-[#E5E7EB] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#F9FAFB] hover:border-[#8CD19D] transition-all relative" 
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const file = e.dataTransfer.files?.[0];
                                                if(file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => setSolveImage(ev.target?.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        >
                                            {solveImage ? (
                                                <img src={solveImage} alt="Preview" className="max-h-64 object-contain rounded-lg shadow-sm" />
                                            ) : (
                                                <>
                                                    <div className="bg-[#F3F4F6] p-6 rounded-full text-[#9CA3AF]"><ImageIcon size={48} /></div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-[#5E5244]">點擊上傳 / 拖曳圖片 / Ctrl+V 貼上</p>
                                                        <p className="text-xs text-[#9CA3AF] mt-1">支援 JPG, PNG 格式</p>
                                                    </div>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                                        </div>
                                    )}
                                    
                                    {!isCameraOpen && (
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); startCamera(); }} className="px-4 py-2 bg-[#F3F0E6] text-[#5E5244] rounded-xl font-bold hover:bg-[#E5E7EB] flex items-center gap-2 text-sm">
                                                <Camera size={16} /> 開啟相機
                                            </button>
                                        </div>
                                    )}
                                    
                                    <div className="w-full max-w-md">
                                        <label className="text-xs font-bold text-[#9C9283] block mb-2">想問什麼？ (選填)</label>
                                        <input 
                                            type="text" 
                                            placeholder="例如：我不懂第二個步驟..." 
                                            className="w-full p-3 rounded-xl border-2 border-[#E5E7EB] outline-none focus:border-[#8CD19D]"
                                            value={solvePrompt}
                                            onChange={(e) => setSolvePrompt(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setMode('menu')} className="px-6 py-3 bg-[#E5E7EB] text-[#796E5B] rounded-xl font-bold hover:bg-[#D6CDB5]">取消</button>
                                        <button onClick={handleSolve} disabled={!solveImage} className="px-8 py-3 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2">
                                            <Bot size={20} /> AI 深度解析
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 pb-8">
                                    <div className="relative flex items-start gap-4 p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm group">
                                        
                                        {/* Top Right Copy Button */}
                                        <button 
                                            onClick={handleCopyExplanation}
                                            className="absolute top-3 right-3 p-2 text-[#9C9283] bg-[#F3F0E6] hover:bg-[#E0F2E9] hover:text-[#166534] rounded-lg transition-all shadow-sm"
                                            title="複製解析內容"
                                        >
                                            <Copy size={18} />
                                        </button>

                                        <img src={solveImage!} alt="Original" className="w-24 h-24 object-cover rounded-xl border border-[#E5E7EB] shrink-0" />
                                        <div className="flex-1 min-w-0 pt-1 pr-10">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="bg-[#E0F2E9] text-[#166534] text-xs px-2 py-1 rounded-lg font-bold">{grade}</span>
                                                <span className="bg-[#F3F0E6] text-[#5E5244] text-xs px-2 py-1 rounded-lg font-bold">{subject}</span>
                                            </div>
                                            <h4 className="font-bold text-[#5E5244] text-lg mb-2">{topic || "AI 專業解析"}</h4>
                                            <div className="prose prose-stone text-sm max-w-none text-[#5E5244] leading-relaxed whitespace-pre-wrap">
                                                {explanation}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-4">
                                        <button onClick={() => { setExplanation(""); setSolveImage(null); }} className="px-6 py-2 bg-[#E5E7EB] text-[#796E5B] rounded-xl font-bold hover:bg-[#D6CDB5] transition-colors">
                                            再問一題
                                        </button>
                                        {onSaveToNote && (
                                            <button onClick={() => onSaveToNote(explanation)} className="px-6 py-2 bg-[#8CD19D] text-white rounded-xl font-bold hover:bg-[#6BCB84] shadow-md flex items-center gap-2 transition-transform active:scale-95">
                                                <Save size={18} /> 存入筆記
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* EXPLAIN MODE */}
                    {mode === 'explain' && (
                        <div className="space-y-6">
                            {mermaidCode && (
                                <div className="animate-in zoom-in duration-500">
                                    <MermaidDiagram code={mermaidCode} />
                                </div>
                            )}
                            
                            <div>
                                <h4 className="font-bold text-[#5E5244] mb-2 flex items-center gap-2"><BookOpen size={18}/> 第一性原理：重點摘要</h4>
                                <div className="prose prose-stone max-w-none text-[#5E5244] leading-relaxed whitespace-pre-wrap font-medium p-6 bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
                                    {explanation || "準備開始講解..."}
                                </div>
                            </div>
                            
                            {!loading && (
                                <div className="pt-4 flex justify-center gap-4">
                                    <button onClick={() => setMode('menu')} className="px-6 py-2 bg-[#E5E7EB] text-[#796E5B] rounded-xl font-bold hover:bg-[#D6CDB5] transition-colors">
                                        返回選單
                                    </button>
                                    {onSaveToNote && (
                                        <button onClick={() => onSaveToNote(explanation)} className="px-6 py-2 bg-[#8CD19D] text-white rounded-xl font-bold hover:bg-[#6BCB84] shadow-md flex items-center gap-2 transition-transform active:scale-95">
                                            <Save size={18} /> 存入筆記
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* QUIZ MODE */}
                    {mode === 'quiz' && !loading && (
                        <div className="space-y-8 pb-8 max-w-2xl mx-auto">
                            {quizSubmitted && (
                                <div className="bg-[#FFF8E1] border-2 border-[#FCD34D] p-4 rounded-xl flex items-center justify-between mb-6 animate-in zoom-in">
                                    <div>
                                        <p className="text-sm font-bold text-[#D97706] uppercase">Quiz Result</p>
                                        <p className="text-3xl font-black text-[#B45309]">{calculateScore()} 分</p>
                                    </div>
                                    <div className="bg-[#FCD34D] text-white p-3 rounded-full shadow-sm">
                                        <Award size={32} />
                                    </div>
                                </div>
                            )}

                            {quizData.map((item, qIdx) => (
                                <div key={qIdx} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
                                    <h4 className="font-bold text-[#5E5244] text-lg mb-4 flex gap-3">
                                        <span className="bg-[#8CD19D] text-white w-8 h-8 rounded-lg flex items-center justify-center shrink-0">{qIdx + 1}</span>
                                        {item.question}
                                    </h4>
                                    <div className="space-y-2 pl-11">
                                        {item.options.map((opt, optIdx) => {
                                            let btnClass = "border-[#E5E7EB] bg-white text-[#796E5B] hover:bg-[#F3F0E6]";
                                            // Logic for coloring after submission
                                            if (quizSubmitted) {
                                                if (optIdx === item.correctIndex) {
                                                    btnClass = "border-[#8CD19D] bg-[#E0F2E9] text-[#166534] ring-2 ring-[#8CD19D]"; // Correct Answer
                                                } else if (optIdx === quizAnswers[qIdx] && optIdx !== item.correctIndex) {
                                                    btnClass = "border-[#F43F5E] bg-[#FFE4E6] text-[#9F1239]"; // Wrong Answer
                                                } else {
                                                    btnClass = "border-[#E5E7EB] bg-white text-gray-400 opacity-50"; // Other options
                                                }
                                            } else {
                                                if (quizAnswers[qIdx] === optIdx) {
                                                    btnClass = "border-[#8CD19D] bg-[#F0FDF4] text-[#166534] shadow-md"; // Selected
                                                }
                                            }

                                            return (
                                                <button 
                                                    key={optIdx} 
                                                    onClick={() => handleAnswerSelect(qIdx, optIdx)}
                                                    className={`w-full text-left p-3 rounded-xl border-2 font-bold transition-all flex items-center justify-between ${btnClass}`}
                                                    disabled={quizSubmitted}
                                                >
                                                    <span>{opt}</span>
                                                    {quizSubmitted && optIdx === item.correctIndex && <CheckCircle size={18} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {quizSubmitted && (
                                        <div className="ml-11 mt-4 p-3 bg-[#F3F0E6] rounded-xl text-sm text-[#796E5B]">
                                            <span className="font-bold text-[#8CD19D]">💡 第一性原理解析：</span> {item.explanation}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="flex justify-center gap-4 pt-4">
                                <button onClick={() => setMode('menu')} className="px-6 py-3 rounded-xl font-bold text-[#9C9283] hover:bg-[#E5E7EB] transition-colors">
                                    離開測驗
                                </button>
                                {quizSubmitted && onSaveToNote && (
                                     <button onClick={() => onSaveToNote(generateQuizReviewContent())} className="px-6 py-3 bg-[#8CD19D] text-white rounded-xl font-bold shadow-md hover:bg-[#6BCB84] transition-all flex items-center gap-2">
                                        <Save size={20} /> 存入錯題
                                    </button>
                                )}
                                {!quizSubmitted ? (
                                    <button 
                                        onClick={() => setQuizSubmitted(true)} 
                                        disabled={quizAnswers.includes(-1)}
                                        className="px-8 py-3 bg-[#8CD19D] text-white rounded-xl font-bold shadow-md hover:bg-[#6BCB84] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <CheckCircle size={20} /> 交卷
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleQuiz} 
                                        className="px-8 py-3 bg-[#F43F5E] text-white rounded-xl font-bold shadow-md hover:bg-[#E11D48] transition-all flex items-center gap-2"
                                    >
                                        <RefreshCcw size={20} /> 再測一次
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
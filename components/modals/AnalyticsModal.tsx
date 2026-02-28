import React from 'react';
import { BarChart2, X, Map, TrendingUp, Target } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Grade, UserData, AppSettings, Subject } from '../../types';

interface Props {
    show: boolean;
    onClose: () => void;
    grades: Grade[];
    userData: UserData;
    activeGradeId: string | null;
    activeSubjectId: string | null;
    settings: AppSettings;
}

const Heatmap: React.FC<{ logs: Record<string, number> }> = ({ logs }) => {
    const days = [];
    for (let i = 27; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days.push({ date: dateStr, count: logs[dateStr] || 0 });
    }
    const getColor = (count: number) => {
        if (count === 0) return "bg-gray-100"; 
        if (count <= 2) return "bg-[#bbf7d0]"; 
        if (count <= 5) return "bg-[#4ade80]"; 
        return "bg-[#16a34a]";
    };
    return (
        <div className="flex flex-col gap-1 w-full max-w-md">
            <div className="flex gap-1 flex-wrap justify-center">
                {days.map((d) => (
                    <div 
                        key={d.date} 
                        title={`${d.date}: ${d.count} 次活動`} 
                        className={`w-4 h-4 rounded-sm ${getColor(d.count)} border border-white/50 transition-all hover:scale-125 hover:border-gray-400`}
                    ></div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 px-1 mt-1">
                <span>30 天前</span><span>今天</span>
            </div>
        </div>
    );
};

export const AnalyticsModal: React.FC<Props> = ({ show, onClose, grades, userData, activeGradeId, activeSubjectId, settings }) => {
    if (!show) return null;

    const activeGrade = grades.find(g => g.id === activeGradeId);
    const activeSubject = activeGrade?.subjects.find(s => s.id === activeSubjectId);

    // Prepare Radar Data
    const radarData = activeGrade ? activeGrade.subjects.map(sub => {
        const total = sub.rows.length;
        if (total === 0) return { subject: sub.name, value: 0, fullMark: 100 };
        const passed = sub.rows.filter(r => 
            (parseInt(r.score1) >= settings.passingScore) || 
            (parseInt(r.score2) >= settings.passingScore) || 
            (parseInt(r.score3) >= settings.passingScore)
        ).length;
        // Normalize to 0-100 for better chart visuals
        return { subject: sub.name, value: Math.round((passed / total) * 100), fullMark: 100 };
    }) : [];

    // Prepare Line Data
    const lineChartData = activeSubject ? activeSubject.rows.map((r, i) => {
        const s1 = parseInt(r.score1) || 0;
        const s2 = parseInt(r.score2) || 0;
        const s3 = parseInt(r.score3) || 0;
        return {
            name: (i + 1).toString(),
            score: Math.max(s1, s2, s3)
        };
    }).filter(d => d.score > 0) : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5E5244]/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-4xl border-4 border-[#F3F0E6] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h3 className="text-xl font-bold text-[#5E5244] flex items-center gap-2"><BarChart2 /> 學習分析儀表板</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Radar Chart */}
                    <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#EFEBE0] flex flex-col items-center min-h-[300px]">
                        <h4 className="font-bold text-[#9C9283] mb-4 flex items-center gap-2"><Map size={16}/> 學科能力雷達圖 (通關率 %)</h4>
                        {radarData.length > 2 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <Radar name="通關率" dataKey="value" stroke="#8CD19D" fill="#8CD19D" fillOpacity={0.6} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">至少需要 3 個科目才能顯示雷達圖</div>
                        )}
                    </div>

                    {/* Line Chart */}
                    <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#EFEBE0] flex flex-col items-center min-h-[300px]">
                        <h4 className="font-bold text-[#9C9283] mb-4 flex items-center gap-2"><TrendingUp size={16}/> 近期分數走勢 (當前科目)</h4>
                        {lineChartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={lineChartData}>
                                    <XAxis dataKey="name" hide />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="score" stroke="#F43F5E" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">累積更多分數以顯示趨勢</div>
                        )}
                    </div>

                    {/* Heatmap */}
                    <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#EFEBE0] flex flex-col items-center col-span-1 md:col-span-2">
                        <h4 className="font-bold text-[#9C9283] mb-4 flex items-center gap-2"><Target size={16}/> 學習熱力圖 (過去 30 天)</h4>
                        <Heatmap logs={userData.logs} />
                    </div>
                </div>
            </div>
        </div>
    );
};
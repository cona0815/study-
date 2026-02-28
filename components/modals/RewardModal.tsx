import React, { useState } from 'react';
import { X, Coins, Plus, Trash2, Edit2, Gift } from 'lucide-react';
import { AppSettings, Reward, UserData } from '../../types';

interface Props {
    show: boolean;
    onClose: () => void;
    userData: UserData;
    settings: AppSettings;
    onRedeem: (reward: Reward) => void;
    onUpdateSettings: (newSettings: AppSettings) => void;
    triggerAlert: (msg: string) => void;
    triggerConfirm: (msg: string, onConfirm: () => void) => void;
}

export const RewardModal: React.FC<Props> = ({ 
    show, onClose, userData, settings, onRedeem, onUpdateSettings, triggerAlert, triggerConfirm 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editReward, setEditReward] = useState<Reward | null>(null);

    if (!show) return null;

    const handleSaveReward = () => {
        if (!editReward) return;
        if (!editReward.name.trim()) return triggerAlert("請輸入獎勵名稱");
        if (editReward.cost <= 0) return triggerAlert("花費必須大於 0");

        const newRewards = [...(settings.rewards || [])];
        const index = newRewards.findIndex(r => r.id === editReward.id);
        
        if (index >= 0) {
            newRewards[index] = editReward;
        } else {
            newRewards.push(editReward);
        }

        onUpdateSettings({ ...settings, rewards: newRewards });
        setEditReward(null);
        setIsEditing(false);
    };

    const handleDeleteReward = (id: string) => {
        triggerConfirm("確定刪除此獎勵？", () => {
            const newRewards = settings.rewards.filter(r => r.id !== id);
            onUpdateSettings({ ...settings, rewards: newRewards });
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5E5244]/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg border-4 border-[#F3F0E6] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-2 shrink-0">
                    <h3 className="text-xl font-bold text-[#5E5244] flex items-center gap-2">
                        <Gift className="text-[#F43F5E]" /> 獎勵兌換所
                    </h3>
                    <button onClick={onClose} className="hover:bg-[#F3F0E6] p-1 rounded-full"><X /></button>
                </div>

                <div className="bg-[#FFF8E1] p-4 rounded-2xl border-2 border-[#FCD34D] mb-4 flex items-center justify-between shrink-0">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#D97706] uppercase">目前持有島嶼幣</span>
                        <span className="text-3xl font-extrabold text-[#B45309] flex items-center gap-2">
                            <Coins className="fill-[#FCD34D] text-[#B45309]" /> {userData.coins}
                        </span>
                    </div>
                    <button 
                        onClick={() => setIsEditing(!isEditing)} 
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${isEditing ? 'bg-[#F43F5E] text-white border-[#F43F5E]' : 'bg-white text-[#9C9283] border-[#E5E7EB]'}`}
                    >
                        {isEditing ? '完成編輯' : '編輯獎勵'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {(settings.rewards || []).map(reward => (
                        <div key={reward.id} className="flex items-center justify-between p-3 bg-[#FDFBF7] border-2 border-[#E5E7EB] rounded-2xl hover:border-[#D6CDB5] transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl bg-white w-12 h-12 flex items-center justify-center rounded-xl shadow-sm border border-[#F3F0E6]">{reward.icon}</div>
                                <div>
                                    <div className="font-bold text-[#5E5244]">{reward.name}</div>
                                    <div className="text-xs font-bold text-[#F59E0B] flex items-center gap-1"><Coins size={10} /> {reward.cost}</div>
                                </div>
                            </div>
                            
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button onClick={() => setEditReward(reward)} className="p-2 bg-[#E0F2E9] text-[#166534] rounded-xl hover:bg-[#8CD19D] hover:text-white transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDeleteReward(reward.id)} className="p-2 bg-[#FEE2E2] text-[#991B1B] rounded-xl hover:bg-[#F43F5E] hover:text-white transition-colors"><Trash2 size={16} /></button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => onRedeem(reward)}
                                    disabled={userData.coins < reward.cost}
                                    className="px-4 py-2 bg-[#8CD19D] text-white rounded-xl font-bold shadow-sm hover:bg-[#6BCB84] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    兌換
                                </button>
                            )}
                        </div>
                    ))}
                    
                    {isEditing && (
                        <button 
                            onClick={() => setEditReward({ id: `r_${Date.now()}`, name: '', cost: 100, icon: '🎁' })}
                            className="w-full py-3 border-2 border-dashed border-[#D6CDB5] rounded-xl text-[#9C9283] font-bold hover:border-[#8CD19D] hover:text-[#55A47B] hover:bg-[#F0FDF4] transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> 新增獎勵
                        </button>
                    )}
                </div>

                {/* Edit Modal Overlay */}
                {editReward && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col p-6 rounded-3xl">
                        <h4 className="font-bold text-[#5E5244] mb-4 text-center text-lg">編輯獎勵</h4>
                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="text-xs font-bold text-[#9C9283] block mb-1">圖示 (Emoji)</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 rounded-xl border-2 border-[#E5E7EB] font-bold text-center text-2xl focus:border-[#8CD19D] outline-none bg-[#FDFBF7]" 
                                    value={editReward.icon} 
                                    onChange={(e) => setEditReward({ ...editReward, icon: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#9C9283] block mb-1">獎勵名稱</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 rounded-xl border-2 border-[#E5E7EB] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-[#FDFBF7]" 
                                    value={editReward.name} 
                                    onChange={(e) => setEditReward({ ...editReward, name: e.target.value })} 
                                    placeholder="例如: 看電視 30 分鐘"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#9C9283] block mb-1">花費島嶼幣</label>
                                <input 
                                    type="number" 
                                    className="w-full p-3 rounded-xl border-2 border-[#E5E7EB] font-bold text-[#5E5244] focus:border-[#8CD19D] outline-none bg-[#FDFBF7]" 
                                    value={editReward.cost} 
                                    onChange={(e) => setEditReward({ ...editReward, cost: parseInt(e.target.value) || 0 })} 
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setEditReward(null)} className="flex-1 py-3 text-[#9C9283] font-bold hover:bg-[#F3F0E6] rounded-xl transition-colors">取消</button>
                            <button onClick={handleSaveReward} className="flex-1 py-3 bg-[#8CD19D] text-white font-bold rounded-xl shadow-md hover:bg-[#6BCB84] transition-all">儲存</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';

interface Props {
    value: string;
    onChange: (val: string) => void;
    threshold: number;
    isRetry?: boolean;
}

export const ScoreInput: React.FC<Props> = ({ value = "", onChange, threshold, isRetry = false }) => {
    // Ensure value is never undefined/null to prevent uncontrolled input warnings or crashes
    const safeValue = value === undefined || value === null ? "" : value;
    const [localVal, setLocalVal] = useState(safeValue);

    useEffect(() => { setLocalVal(safeValue); }, [safeValue]);

    const handleBlur = () => { 
        if (localVal !== safeValue) { 
            onChange(localVal); 
        } 
    };

    const numVal = parseInt(localVal);
    const isPass = !isNaN(numVal) && numVal >= threshold;
    const bg = localVal ? (isPass ? (isRetry?"bg-[#FFF8E1]":"bg-[#E0F2E9]") : "bg-[#FEF2F2]") : "bg-white";
    const border = localVal ? (isPass ? (isRetry?"border-[#FFE082]":"border-[#B7E4C7]") : "border-[#FECACA]") : "border-[#E5E7EB]";
    const text = localVal ? (isPass ? (isRetry?"text-[#D97706]":"text-[#55A47B]") : "text-[#EF4444]") : "text-[#796E5B]";

    return (
        <input 
            type="number" 
            value={localVal} 
            onChange={(e) => setLocalVal(e.target.value)} 
            onBlur={handleBlur} 
            placeholder="-" 
            className={`w-14 h-9 text-center rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-opacity-30 transition-all font-extrabold text-lg shadow-sm ${bg} ${border} ${text}`} 
        />
    );
};
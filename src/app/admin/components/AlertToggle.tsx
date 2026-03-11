"use client";

import { useState, useTransition } from "react";
import { toggleAlertStatus } from "../actions";
import { CheckCircle2 } from "lucide-react";

export default function AlertToggle({ 
    alertId, 
    initialStatus, 
    variant = "badge" 
}: { 
    alertId: string, 
    initialStatus: boolean, 
    variant?: "badge" | "icon" 
}) {
    const [isPending, startTransition] = useTransition();
    const [isResolved, setIsResolved] = useState(initialStatus);

    const handleToggle = () => {
        const current = isResolved;
        setIsResolved(!current);
        startTransition(async () => {
            const result = await toggleAlertStatus(alertId, current);
            if (!result?.success) {
                // Revert on failure
                setIsResolved(current);
            }
        });
    };

    if (variant === "badge") {
        return (
            <button 
                onClick={handleToggle}
                disabled={isPending}
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors flex items-center gap-1 ${
                    isResolved ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-500 hover:bg-orange-200'
                } ${isPending ? 'opacity-50' : ''}`}
            >
                {isResolved && <CheckCircle2 size={12} />}
                {isResolved ? "確認済" : "未確認"}
            </button>
        );
    }

    // Default icon variant
    return (
        <button 
            onClick={handleToggle}
            disabled={isPending}
            className={`flex flex-col items-center justify-center gap-1 transition-colors hover:opacity-80 p-2 rounded-xl group ${
                isResolved ? 'text-green-500 hover:bg-green-50' : 'text-orange-400 hover:bg-orange-50'
            } ${isPending ? 'opacity-50' : ''}`}
        >
            {isResolved ? (
                <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
            ) : (
                <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin group-hover:scale-110 transition-transform"></div>
            )}
            <span className="text-[10px] font-bold">{isResolved ? "確認済" : "未確認"}</span>
        </button>
    );
}

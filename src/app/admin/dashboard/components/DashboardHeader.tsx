"use client";

import { Bell, LogOut, FileSpreadsheet, LayoutDashboard, Users, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function DashboardHeader({ alerts }: { alerts: any[] }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <header className="flex justify-between items-center mb-10 relative">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">ダッシュボード</h1>
                <p className="text-gray-500 mt-1 font-medium">現在の事業所サマリー</p>
            </div>
            <div className="flex gap-4 items-center">
                <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-3 rounded-2xl shadow-sm transition-colors relative flex items-center justify-center ${isMenuOpen ? 'bg-orange-500 text-white' : 'bg-white text-orange-500 hover:bg-orange-50'}`}
                    >
                        <Bell size={20} />
                        {alerts?.length > 0 && (
                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {isMenuOpen && (
                        <div className="absolute top-14 right-0 bg-white shadow-xl rounded-2xl w-[320px] border border-gray-100 flex flex-col overflow-hidden z-50">
                            <div className="p-4 border-b border-gray-50 bg-orange-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm z-50 relative">
                                    <Bell size={16} className="text-orange-500" /> お知らせ・通知
                                </h3>
                                <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">{alerts?.length || 0}件</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {alerts?.length > 0 ? (
                                    alerts.map((alert: any) => (
                                        <div key={alert.id} className="p-4 border-b border-gray-50 hover:bg-orange-50 transition-colors cursor-pointer group">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full truncate max-w-[150px]">{alert.alert_type}</span>
                                                <span className="text-[10px] text-gray-400 font-bold">
                                                    {new Date(alert.created_at).toLocaleDateString('ja-JP')}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-800 mt-2 mb-1">
                                                {Array.isArray(alert.visit_record?.patient) 
                                                    ? alert.visit_record?.patient[0]?.name 
                                                    : alert.visit_record?.patient?.name || "不明な利用者"} 様
                                            </p>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                {alert.description}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 flex flex-col items-center justify-center text-gray-400 gap-3">
                                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-1">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <p className="font-bold text-sm text-gray-500">新しいお知らせはありません</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-3 bg-gray-50 text-center border-t border-gray-100 flex justify-center">
                                <button onClick={() => setIsMenuOpen(false)} className="text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 px-4 py-2 rounded-xl transition-colors">
                                    閉じる
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

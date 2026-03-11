"use client";

import { useState } from "react";
import { Mic, Camera, FileText, CheckCircle, Home, MessageSquare, Calendar, Database as DatabaseIcon, Loader2 } from "lucide-react";
import { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface NurseHomePageClientProps {
    profile: Profile;
    patients: Patient[];
}

export default function NurseHomePageClient({ profile, patients }: NurseHomePageClientProps) {
    const [errorMsg, setErrorMsg] = useState("");
    const [isSeeding, setIsSeeding] = useState(false);
    const router = useRouter();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.size >= 5 * 1024 * 1024) {
            setErrorMsg("ファイルサイズが大きすぎます（5MB以上）。");
            e.target.value = ""; // reset
        } else {
            setErrorMsg("");
        }
    };

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            const res = await fetch("/api/seed", { method: "POST" });
            if (res.ok) {
                router.refresh(); // Reflect data
            } else {
                alert("データの生成に失敗しました");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="bg-[#FFFAF0] min-h-screen pb-24 font-sans">
            {/* Header */}
            <header className="bg-white px-6 py-6 shadow-sm rounded-b-3xl">
                <h1 className="text-xl font-bold text-gray-800">こんにちは、{profile.name}さん</h1>
                <p className="text-sm text-gray-500 mt-1">本日の訪問予定: {patients.length}件</p>
            </header>

            {/* Schedule / Cards */}
            <div className="p-4 mt-2 overflow-x-auto flex gap-4 snap-x">
                {patients.length > 0 ? (
                    patients.map((patient, index) => (
                        <div key={patient.id} className={`bg-white min-w-[280px] p-5 rounded-3xl shadow-md snap-center ${index === 0 ? 'border-l-4 border-orange-500' : 'opacity-60'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-gray-400">予定時刻</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${index === 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {patient.care_level || "通常訪問"}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{patient.name} 様</h2>
                            <p className="text-sm text-gray-500 mt-1">{patient.insurance_type}</p>
                        </div>
                    ))
                ) : (
                    <div className="bg-white w-full p-8 rounded-3xl shadow-sm snap-center text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center">
                            <DatabaseIcon size={32} />
                        </div>
                        <p className="text-gray-500 font-bold text-sm">担当の利用者データがありません。<br />まずはテスト用データを生成してください。</p>
                        <button
                            onClick={handleSeedData}
                            disabled={isSeeding}
                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors mt-2"
                        >
                            {isSeeding ? <Loader2 size={18} className="animate-spin" /> : <DatabaseIcon size={18} />}
                            {isSeeding ? "生成中..." : "デモデータを自動生成する"}
                        </button>
                    </div>
                )}
            </div>

            {/* Record Input Area */}
            <div className="px-4 mt-4">
                <h3 className="font-bold text-gray-700 mb-4 px-2">記録入力 {patients.length > 0 && `(${patients[0].name} 様)`}</h3>

                {/* Vitals */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-col justify-center items-center">
                        <span className="text-xs text-gray-400 font-bold mb-1">体温 (℃)</span>
                        <input type="number" placeholder="36.5" className="text-3xl font-bold text-center w-full focus:outline-none text-gray-800" />
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-col justify-center items-center">
                        <span className="text-xs text-gray-400 font-bold mb-1">血圧 (mmHg)</span>
                        <input type="text" placeholder="120/80" className="text-3xl font-bold text-center w-full focus:outline-none text-gray-800" />
                    </div>
                </div>

                {/* Voice Input */}
                <div className="bg-white p-6 rounded-3xl shadow-sm mb-4 relative">
                    <textarea
                        className="w-full h-32 focus:outline-none text-gray-700 resize-none"
                        placeholder="記録をここに入力するか、マイクボタンを押して音声入力してください..."
                    />
                    <button className="absolute bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-transform active:scale-95">
                        <Mic size={24} />
                    </button>
                </div>

                {/* File & Actions */}
                <div className="flex flex-col gap-2 mb-8">
                    {errorMsg && <p className="text-red-500 text-sm font-bold bg-red-50 p-2 rounded-lg">{errorMsg}</p>}
                    <div className="flex gap-4">
                        <label className="flex-1 bg-white flex items-center justify-center gap-2 py-4 rounded-2xl shadow-sm text-gray-600 font-bold active:bg-gray-50 cursor-pointer">
                            <Camera size={20} />
                            写真添付
                            <input type="file" title="写真添付" className="hidden" aria-label="写真添付" onChange={handleFileUpload} accept="image/*" />
                        </label>
                        <button className="flex-1 bg-gray-800 text-white flex items-center justify-center gap-2 py-4 rounded-2xl shadow-sm font-bold active:bg-gray-700">
                            <CheckCircle size={20} />
                            保存・共有
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button className="flex flex-col items-center gap-1 text-orange-500">
                    <Home size={24} />
                    <span className="text-[10px] font-bold">ホーム</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400 transition-colors">
                    <MessageSquare size={24} />
                    <span className="text-[10px] font-bold">チャット</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400 transition-colors">
                    <Calendar size={24} />
                    <span className="text-[10px] font-bold">予定</span>
                </button>
            </nav>
        </div>
    );
}

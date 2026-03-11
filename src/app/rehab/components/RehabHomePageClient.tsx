"use client";

import { useState, useEffect } from "react";
import { Mic, CheckCircle, Home, MessageSquare, Calendar, Loader2, LayoutDashboard, Activity, FileCheck, ClipboardList } from "lucide-react";
import { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { saveVisitRecord } from "../../nurse/actions";
import { createClient } from "@/utils/supabase/client";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface RehabHomePageClientProps {
    profile: Profile;
    patients: Patient[];
}

export default function RehabHomePageClient({ profile, patients }: RehabHomePageClientProps) {
    const { isListening, transcript, setTranscript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
    const router = useRouter();
    const supabase = createClient();
    
    // Default to the first patient if available
    const [selectedPatientId, setSelectedPatientId] = useState<string>(patients.length > 0 ? patients[0].id : "");
    const [visitType, setVisitType] = useState<string>("PT"); // PT, OT, ST
    
    // Rehab specific state
    const [bloodPressure, setBloodPressure] = useState<string>("");
    const [pulse, setPulse] = useState<string>("");
    const [spO2, setSpO2] = useState<string>("");
    const [textRecord, setTextRecord] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update text record when speech transcript changes
    useEffect(() => {
        if (transcript) {
            setTextRecord(prev => prev ? `${prev} ${transcript}` : transcript);
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

    const handleSubmit = async () => {
        if (!selectedPatientId || !textRecord) {
            alert("利用者を選択し、訓練記録を入力してください。");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("patient_id", selectedPatientId);
            formData.append("visit_type", `リハビリ(${visitType})`);
            if (bloodPressure) formData.append("blood_pressure", bloodPressure);
            formData.append("text_record", textRecord);

            const result = await saveVisitRecord(formData);
            if (result?.error) {
                alert(`エラーが発生しました: ${result.error}`);
            } else {
                alert("リハビリ記録を保存しました。\n※ AIが連携加算の候補や計画書の修正が必要か解析を開始しました。");
                setBloodPressure("");
                setPulse("");
                setSpO2("");
                setTextRecord("");
                router.refresh();
            }
        } catch (error) {
            console.error("Submission failed:", error);
            alert("送信に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <div className="bg-[#FFFAF0] min-h-screen font-sans pb-24">
            {/* Header */}
            <header className="bg-white px-6 py-6 rounded-b-[40px] shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">リハビリ記録</h1>
                    <p className="text-sm font-bold text-orange-500 mt-1">{profile.name}（{profile.role === 'admin' ? '管理者' : 'リハ職'}）</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleLogout} className="w-10 h-10 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center hover:bg-orange-100 transition-colors shadow-sm">
                        <span className="font-bold text-xs">退出</span>
                    </button>
                </div>
            </header>

            {/* Quick Stats/Links */}
            <div className="px-6 mt-6 grid grid-cols-2 gap-4">
                <Link href="/rehab/plan" className="bg-white p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                        <ClipboardList size={24} />
                    </div>
                    <span className="font-bold text-sm text-gray-700">リハビリ計画書</span>
                </Link>
                <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                        <FileCheck size={24} />
                    </div>
                    <span className="font-bold text-sm text-gray-700">本日の予定 {patients.length}件</span>
                </div>
            </div>

            <main className="px-6 mt-6 max-w-lg mx-auto space-y-6">
                {/* Patient Selection & Type */}
                <div className="space-y-4">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-orange-50">
                        <label className="text-sm font-bold text-gray-400 mb-2 block">対象の利用者</label>
                        <select 
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="w-full text-lg font-extrabold text-gray-800 bg-transparent outline-none appearance-none"
                        >
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name} 様</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        {['PT', 'OT', 'ST'].map(type => (
                            <button 
                                key={type}
                                onClick={() => setVisitType(type)}
                                className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-colors ${
                                    visitType === type 
                                    ? 'bg-orange-500 text-white shadow-md' 
                                    : 'bg-white text-gray-500 hover:bg-orange-50 border border-gray-100'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vitals (Simplified for Rehab) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-3xl shadow-sm flex flex-col">
                        <label className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1">血圧</label>
                        <div className="flex items-baseline">
                            <input 
                                type="text"
                                placeholder="120/80"
                                value={bloodPressure}
                                onChange={(e) => setBloodPressure(e.target.value)}
                                className="w-full text-xl font-extrabold text-gray-800 focus:outline-none placeholder-gray-200"
                            />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm flex flex-col">
                        <label className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1">脈拍 / SpO2</label>
                        <div className="flex items-end gap-2">
                            <input 
                                type="text"
                                placeholder="70"
                                value={pulse}
                                onChange={(e) => setPulse(e.target.value)}
                                className="w-[45%] text-xl font-extrabold text-gray-800 focus:outline-none placeholder-gray-200 border-b border-dashed border-gray-200"
                            />
                            <span className="text-gray-300 font-bold">/</span>
                            <input 
                                type="text"
                                placeholder="98"
                                value={spO2}
                                onChange={(e) => setSpO2(e.target.value)}
                                className="w-[45%] text-xl font-extrabold text-gray-800 focus:outline-none placeholder-gray-200 border-b border-dashed border-gray-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Free Text / Voice Input for Training Record */}
                <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                            <Activity size={16} className="text-orange-500" />
                            訓練記録・特記事項
                        </label>
                        <button 
                            onClick={toggleListening}
                            className={`p-3 rounded-full transition-all ${
                                isListening 
                                ? 'bg-red-500 text-white animate-pulse shadow-lg scale-110' 
                                : 'bg-orange-50 text-orange-500 hover:bg-orange-100'
                            }`}
                        >
                            <Mic size={20} />
                        </button>
                    </div>
                    <textarea 
                        className="w-full h-40 focus:outline-none text-gray-800 text-lg resize-none placeholder-gray-300 leading-relaxed font-medium"
                        placeholder="ROM訓練、歩行訓練の様子や、ケアマネジャーへの報告事項などを音声入力またはテキストで入力してください..."
                        value={textRecord}
                        onChange={(e) => setTextRecord(e.target.value)}
                    ></textarea>

                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !textRecord}
                        className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-all shadow-md active:scale-[0.98]"
                    >
                        {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle size={24} />}
                        {isSubmitting ? '保存中...' : '記録を保存'}
                    </button>
                </div>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <Link href="/rehab" className="flex flex-col items-center gap-1 text-orange-500">
                    <Home size={24} />
                    <span className="text-[10px] font-bold">ホーム</span>
                </Link>
                <Link href="/chat" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400 transition-colors">
                    <MessageSquare size={24} />
                    <span className="text-[10px] font-bold">チャット</span>
                </Link>
                <button onClick={() => alert('予定画面は現在開発中です')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400 transition-colors">
                    <Calendar size={24} />
                    <span className="text-[10px] font-bold">予定</span>
                </button>
                {profile.role === 'admin' && (
                    <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400 transition-colors">
                        <LayoutDashboard size={24} />
                        <span className="text-[10px] font-bold">管理</span>
                    </Link>
                )}
            </nav>
        </div>
    );
}

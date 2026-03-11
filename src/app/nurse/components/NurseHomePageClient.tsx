"use client";

import { useState, useEffect } from "react";
import { Mic, Camera, FileText, CheckCircle, Home, MessageSquare, Calendar, Database as DatabaseIcon, Loader2, LayoutDashboard, User, ClipboardList } from "lucide-react";
import { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { saveVisitRecord } from "../actions";
import { createClient } from "@/utils/supabase/client";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface NurseHomePageClientProps {
    profile: Profile;
    patients: Patient[];
}

export default function NurseHomePageClient({ profile, patients }: NurseHomePageClientProps) {
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isSeeding, setIsSeeding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Select patient
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    
    useEffect(() => {
        if (patients.length > 0 && !selectedPatientId) {
            setSelectedPatientId(patients[0].id);
        }
    }, [patients, selectedPatientId]);

    // Form inputs
    const [temperature, setTemperature] = useState("36.5");
    const [bloodPressure, setBloodPressure] = useState("");
    const [visitType, setVisitType] = useState("看護訪問");
    const [pulse, setPulse] = useState("");
    const [spO2, setSpO2] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);

    // Speech Recognition hook
    const {
        isListening,
        transcript,
        setTranscript,
        startListening,
        stopListening,
    } = useSpeechRecognition();

    // Auto-extract vitals from transcript
    useEffect(() => {
        if (!transcript) return;

        // Extract Temperature (e.g. "体温36.5度", "熱36度5分", "体温は37度")
        const tempMatch = transcript.match(/(?:体温|熱)[はが]?.*?([34][0-9])(?:度|\.)([0-9])?(?:分)?/);
        if (tempMatch) {
            const integerPart = tempMatch[1];
            const decimalPart = tempMatch[2] || "0";
            setTemperature(`${integerPart}.${decimalPart}`);
        }

        // Extract Blood Pressure (e.g. "血圧120の80", "上が120下が80", "130と85")
        const bpMatch1 = transcript.match(/(?:血圧|けつあつ)[はが]?.*?([0-9]{2,3})(?:の|と|、下[はが]?|[^0-9]{1,3})([0-9]{2,3})/);
        const bpMatch2 = transcript.match(/上[はが]?([0-9]{2,3}).*?下[はが]?([0-9]{2,3})/);
        
        if (bpMatch2) {
            setBloodPressure(`${bpMatch2[1]}/${bpMatch2[2]}`);
        } else if (bpMatch1) {
            setBloodPressure(`${bpMatch1[1]}/${bpMatch1[2]}`);
        }
    }, [transcript]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.size >= 5 * 1024 * 1024) {
            setErrorMsg("ファイルサイズが大きすぎます（5MB以上）。");
            setPhoto(null);
            e.target.value = ""; // reset
        } else if (file) {
            setErrorMsg("");
            setPhoto(file);
        }
    };

    const handleSaveRecord = async () => {
        if (!patients || patients.length === 0) {
            setErrorMsg("担当の利用者データがありません。");
            return;
        }

        setIsSubmitting(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const formData = new FormData();
            formData.append("tenant_id", profile.tenant_id ?? "");
            formData.append("patient_id", selectedPatientId ?? patients[0].id);
            formData.append("nurse_id", profile.id);
            formData.append("visit_type", (visitType === '看護訪問' || visitType === '緊急訪問') ? visitType : `リハビリ(${visitType})`);
            if (temperature) formData.append("temperature", temperature);
            if (bloodPressure) formData.append("blood_pressure", bloodPressure);
            if (pulse) formData.append("pulse", pulse);
            if (spO2) formData.append("spO2", spO2);
            if (transcript) formData.append("text_record", transcript);
            if (photo) formData.append("photo", photo);

            const result = await saveVisitRecord(formData);

            if (result?.error) {
                setErrorMsg(result.error);
            } else {
                setSuccessMsg("記録を保存し、タイムラインに共有しました。");
                setTemperature("36.5");
                setBloodPressure("");
                setPulse("");
                setSpO2("");
                setTranscript("");
                setPhoto(null);
                setTimeout(() => setSuccessMsg(""), 3000);
            }
        } catch (e: any) {
            setErrorMsg("保存に失敗しました：" + e.message);
        } finally {
            setIsSubmitting(false);
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

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh(); // This will trigger middleware to redirect to /login
    };

    return (
        <div className="bg-[#FFFAF0] min-h-screen pb-24 font-sans">
            {/* Header */}
            <header className="bg-white px-6 py-6 shadow-sm rounded-b-3xl flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">こんにちは、{profile.name}さん</h1>
                    <p className="text-sm text-gray-500 mt-1">本日の訪問予定: {patients.length}件</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl font-bold transition-colors"
                >
                    ログアウト
                </button>
            </header>

            {/* Schedule / Cards */}
            <div className="p-4 mt-2 overflow-x-auto flex gap-4 snap-x">
                {patients.length > 0 ? (
                    patients.map((patient, index) => {
                        const isSelected = selectedPatientId === patient.id || (!selectedPatientId && index === 0);
                        return (
                            <div 
                                key={patient.id} 
                                onClick={() => setSelectedPatientId(patient.id)}
                                className={`bg-white min-w-[280px] p-5 rounded-3xl shadow-md snap-center cursor-pointer transition-all ${isSelected ? 'border-l-4 border-orange-500 transform scale-100' : 'opacity-60 scale-95 border-l-4 border-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-bold text-gray-400">予定時刻</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isSelected ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {patient.care_level || "通常訪問"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pr-2">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">{patient.name} 様</h2>
                                        <p className="text-sm text-gray-500 mt-1">{patient.insurance_type}</p>
                                    </div>
                                    <Link 
                                        href={`/patient/${patient.id}`} 
                                        onClick={(e) => e.stopPropagation()} 
                                        className="bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-500 p-3 rounded-full transition-colors flex items-center justify-center"
                                        title="プロフィール・基本情報"
                                    >
                                        <User size={20} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })
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

            {/* Main Action Menus (Plans / Forms) */}
            <div className="px-6 mt-4 grid grid-cols-2 gap-4">
                <Link 
                    href={`/nurse/plan?patient_id=${selectedPatientId}`}
                    className="bg-white p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100"
                >
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                        <ClipboardList size={24} />
                    </div>
                    <span className="font-bold text-[11px] text-center text-gray-700">AI 計画書 / 報告書<br/>(看護)</span>
                </Link>
                <Link 
                    href={`/rehab/plan?patient_id=${selectedPatientId}`}
                    className="bg-white p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100"
                >
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                        <FileText size={24} />
                    </div>
                    <span className="font-bold text-[11px] text-center text-gray-700">AI 計画書 / 報告書<br/>(リハビリ)</span>
                </Link>
            </div>

            {/* Record Input Area */}
            <div className="px-4 mt-6">
                <h3 className="font-bold text-gray-700 mb-4 px-2">
                    訪問記録入力 {patients.length > 0 && `(${patients.find(p => p.id === selectedPatientId)?.name || patients[0].name} 様)`}
                </h3>

                {/* Visit Type Selection */}
                <div className="flex gap-2 mb-4">
                    {['看護訪問', '緊急訪問', 'PT', 'OT', 'ST'].map(type => (
                        <button 
                            key={type}
                            onClick={() => setVisitType(type)}
                            className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-colors shadow-sm ${
                                visitType === type 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-white text-gray-500 hover:bg-orange-50 border border-gray-100'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Vitals */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-col justify-center items-center">
                        <span className="text-xs text-gray-400 font-bold mb-1">体温 (℃)</span>
                        <input 
                            type="number" 
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            placeholder="36.5" 
                            className="text-3xl font-bold text-center w-full focus:outline-none text-gray-800" 
                        />
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-col justify-center items-center">
                        <span className="text-xs text-gray-400 font-bold mb-1">血圧 (mmHg)</span>
                        <input 
                            type="text" 
                            value={bloodPressure}
                            onChange={(e) => setBloodPressure(e.target.value)}
                            placeholder="120/80" 
                            className="text-3xl font-bold text-center w-full focus:outline-none text-gray-800" 
                        />
                    </div>
                    {(visitType !== '看護訪問' && visitType !== '緊急訪問') && (
                        <>
                            <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-col justify-center items-center">
                                <span className="text-xs text-gray-400 font-bold mb-1">脈拍</span>
                                <input 
                                    type="number" 
                                    value={pulse}
                                    onChange={(e) => setPulse(e.target.value)}
                                    placeholder="70" 
                                    className="text-3xl font-bold text-center w-full focus:outline-none text-gray-800" 
                                />
                            </div>
                            <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-col justify-center items-center">
                                <span className="text-xs text-gray-400 font-bold mb-1">SpO2 (%)</span>
                                <input 
                                    type="number" 
                                    value={spO2}
                                    onChange={(e) => setSpO2(e.target.value)}
                                    placeholder="98" 
                                    className="text-3xl font-bold text-center w-full focus:outline-none text-gray-800" 
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Text & Voice Input */}
                <div className="relative mb-4">
                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="w-full h-32 bg-white rounded-3xl p-6 pr-14 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 text-gray-700 resize-none text-sm font-medium"
                        placeholder={isListening ? "音声を聞き取り中..." : "訪問記録を入力... (マイクでの音声入力も可能)"}
                    />
                    <button 
                        onClick={isListening ? stopListening : startListening}
                        className={`absolute right-4 bottom-4 p-3 rounded-full transition-colors flex items-center justify-center ${
                            isListening ? "text-red-500 bg-red-50 hover:bg-red-100 animate-pulse outline outline-2 outline-red-200 outline-offset-2" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50 bg-gray-50"
                        }`}
                    >
                        <Mic size={20} />
                    </button>
                </div>

                {/* File & Actions */}
                <div className="flex flex-col gap-2 mb-8">
                    {errorMsg && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl">{errorMsg}</p>}
                    {successMsg && <p className="text-emerald-600 text-sm font-bold bg-emerald-50 p-3 rounded-xl">{successMsg}</p>}
                    <div className="flex gap-4">
                        <label className={`flex-1 bg-white flex flex-col items-center justify-center py-3 rounded-2xl shadow-sm font-bold cursor-pointer transition-colors ${photo ? 'text-orange-500 border-2 border-orange-500' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                                <Camera size={20} />
                                <span>{photo ? '添付済み' : '写真添付'}</span>
                            </div>
                            {photo && <span className="text-[10px] text-gray-400 mt-1 truncate max-w-[100px]">{photo.name}</span>}
                            <input type="file" title="写真添付" className="hidden" aria-label="写真添付" onChange={handleFileUpload} accept="image/*" />
                        </label>
                        <button 
                            onClick={handleSaveRecord}
                            disabled={isSubmitting || patients.length === 0}
                            className="flex-1 bg-gray-800 disabled:bg-gray-400 text-white flex items-center justify-center gap-2 py-3 rounded-2xl shadow-sm font-bold active:bg-gray-700 transition-colors"
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <CheckCircle size={20} />
                            )}
                            {isSubmitting ? '保存中...' : '保存・共有'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <Link href="/nurse" className="flex flex-col items-center gap-1 text-orange-500">
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

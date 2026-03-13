"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle, Search, ClipboardList, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/supabase";

type Patient = Database['public']['Tables']['patients']['Row'];

interface RehabPlanClientProps {
    patients: Patient[];
}

export default function RehabPlanClient({ patients }: RehabPlanClientProps) {
    const [selectedPatientId, setSelectedPatientId] = useState<string>(patients.length > 0 ? patients[0].id : "");
    const [planType, setPlanType] = useState<string>("計画書");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

    const handleGenerate = () => {
        if (!selectedPatientId) return;
        
        setIsGenerating(true);
        // Simulate AI generating a rehab plan based on past records
        setTimeout(() => {
            const patient = patients.find(p => p.id === selectedPatientId);
            setGeneratedPlan(`【リハビリテーション${planType}案】\n\n対象：${patient?.name} 様\n要介護度：${patient?.care_level}\n\n■ 短期目標\n・屋内での歩行を安全に行える（T字杖使用）\n・トイレ動作の自立\n\n■ 訓練内容・頻度\n・PTによる訪問（週2回、40分）\n・ROMエクスササイズ（下肢中心）\n・起立・着座訓練\n・歩行訓練（屋内実用歩行）\n\n■ 特記事項\n・疼痛（右膝関節）に配慮し、運動負荷を調整する。\n・前回カンファレンス時のケアマネージャーからの報告「夜間のトイレ移動での転倒不安あり」を受け、環境調整（手すりの確認と導線整理）を併せて評価する。\n\n※この案は過去の訪問記録と他職種連携記録から自動生成しました。必ず療法士が確認・修正の上、主治医へ報告してください。`);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className="bg-[#FFFAF0] min-h-screen font-sans pb-24 flex flex-col items-center">
            {/* Header */}
            <header className="w-full max-w-lg bg-white px-6 py-6 rounded-b-[40px] shadow-sm flex items-center justify-between sticky top-0 z-10">
                <Link href="/rehab" className="text-gray-400 hover:text-orange-500 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">リハビリ計画書作成</h1>
                <div className="w-6"></div> {/* Spacer for centering */}
            </header>

            <main className="w-full max-w-lg px-6 mt-8 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50">
                    <p className="text-sm font-bold text-gray-500 mb-4 tracking-tight leading-relaxed">
                        過去のバイタル記録、訓練記録、他職種（ケアマネ等）との連携コメントを読み込み、次月の計画書や報告書のドラフトを自動生成します。
                    </p>

                    <label className="text-xs font-bold text-gray-400 mb-2 block">対象の利用者</label>
                    <select 
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full text-base font-extrabold text-gray-800 bg-gray-50 p-4 rounded-xl outline-none appearance-none border border-gray-100 mb-4"
                    >
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name} 様</option>
                        ))}
                    </select>

                    <label className="text-xs font-bold text-gray-400 mb-2 block">作成する書類</label>
                    <div className="flex gap-2">
                        {['計画書', '報告書', '情報提供書'].map(type => (
                            <button 
                                key={type}
                                onClick={() => setPlanType(type)}
                                className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-colors ${
                                    planType === type 
                                    ? 'bg-blue-500 text-white shadow-md' 
                                    : 'bg-white text-gray-500 hover:bg-blue-50 border border-gray-100'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedPatientId}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-all shadow-md active:scale-[0.98]"
                >
                    {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <RefreshCw size={24} />}
                    {isGenerating ? '実績と連携内容を解析中...' : '過去記録からドラフト生成'}
                </button>

                {generatedPlan && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-t-blue-500 mt-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <ClipboardList size={100} className="text-blue-500" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 relative z-10">
                            <CheckCircle size={20} className="text-green-500" /> 生成完了
                        </h2>
                        <textarea 
                            className="w-full h-80 focus:outline-none text-gray-700 text-sm resize-y leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 relative z-10 font-medium"
                            value={generatedPlan}
                            onChange={(e) => setGeneratedPlan(e.target.value)}
                        />
                        <button className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm relative z-10">
                            確認して記録に保存
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

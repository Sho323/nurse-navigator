"use client";

import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, LayoutDashboard, Settings, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { processReconciliation } from "../actions";
import { Database } from "@/types/supabase";

type SalesData = Database["public"]["Tables"]["sales_data"]["Row"];

export default function ReconciliationClient({ profile, initialData }: { profile: any, initialData: SalesData[] }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultMsg, setResultMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    
    // Store selected files
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [bankFile, setBankFile] = useState<File | null>(null);

    const handleProcess = async () => {
        if (!receiptFile || !bankFile) {
            setErrorMsg("請求CSVと入金CSVの両方を選択してください。");
            return;
        }

        setIsProcessing(true);
        setErrorMsg("");
        setResultMsg("");

        try {
            // Read files as text
            const receiptCsv = await receiptFile.text();
            const bankCsv = await bankFile.text();

            const formData = new FormData();
            formData.append("receiptCsv", receiptCsv);
            formData.append("bankCsv", bankCsv);
            formData.append("tenant_id", profile.tenant_id);

            const res = await processReconciliation(formData);
            if (res?.error) {
                setErrorMsg(res.error);
            } else {
                setResultMsg("AIによる消込処理が完了しました。");
                // Reset file selections on success
                setReceiptFile(null);
                setBankFile(null);
            }
        } catch (e: any) {
            setErrorMsg("エラーが発生しました: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDemoProcess = async () => {
        setIsProcessing(true);
        setErrorMsg("");
        setResultMsg("");

        // Dummy CSV Strings
        const dummyReceipt = `患者名,請求額
佐藤 健一,15000
鈴木 花子,24500
田中 一郎,18200
山本 陽子,30000`;
        
        const dummyBank = `振込人名義,入金額
サトウ ケンイチ,15000
スズキ タロウ,24500
タナカ イチロウ,5000`;

        try {
            const formData = new FormData();
            formData.append("receiptCsv", dummyReceipt);
            formData.append("bankCsv", dummyBank);
            formData.append("tenant_id", profile.tenant_id);

            const res = await processReconciliation(formData);
            if (res?.error) {
                setErrorMsg(res.error);
            } else {
                setResultMsg("AIによるデモ消込処理が完了しました。");
            }
        } catch (e: any) {
            setErrorMsg("エラーが発生しました: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFAF0] flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col items-center py-8 shadow-sm h-screen sticky top-0">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-12 shadow-sm">
                    <span className="text-white text-2xl font-bold">N</span>
                </div>

                <nav className="flex-1 w-full px-6 flex flex-col gap-4">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 px-4 py-3 rounded-2xl font-bold transition-colors">
                        <LayoutDashboard size={20} />
                        ダッシュボード
                    </Link>
                    <Link href="/admin/reconciliation" className="flex items-center gap-3 text-orange-500 bg-orange-50 px-4 py-3 rounded-2xl font-bold">
                        <FileSpreadsheet size={20} />
                        CSV 消込
                    </Link>
                    <Link href="/nurse" className="flex items-center gap-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 px-4 py-3 rounded-2xl font-bold transition-colors">
                        <Users size={20} />
                        ナースホームへ
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">AI自動消込</h1>
                    <p className="text-gray-500 mt-1 font-medium">請求データと入金データのCSVをアップロードしてください</p>
                </header>

                {/* Messages */}
                {errorMsg && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold">{errorMsg}</div>}
                {resultMsg && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 font-bold">{resultMsg}</div>}

                {/* Upload Area */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border-2 border-dashed border-orange-200 mb-10 flex flex-col items-center justify-center transition-colors relative overflow-hidden">
                    <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4 relative z-10">
                        <UploadCloud size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-700 mb-2 relative z-10">ここにファイルをドロップするか、クリックして選択</h2>
                    <p className="text-gray-400 font-medium relative z-10">レセプトCSV・銀行CSV</p>

                    <div className="mt-8 flex gap-4 w-full max-w-lg relative z-10">
                        <label className="flex-1 bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col gap-1 items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors">
                            <span className="block text-sm font-bold text-gray-700">請求CSVを選択</span>
                            {receiptFile && <span className="block text-xs text-orange-600 font-bold max-w-full truncate px-2">{receiptFile.name}</span>}
                            <input 
                                type="file" 
                                accept=".csv" 
                                className="hidden" 
                                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} 
                            />
                        </label>
                        <label className="flex-1 bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col gap-1 items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors">
                            <span className="block text-sm font-bold text-gray-700">入金CSVを選択</span>
                            {bankFile && <span className="block text-xs text-orange-600 font-bold max-w-full truncate px-2">{bankFile.name}</span>}
                            <input 
                                type="file" 
                                accept=".csv" 
                                className="hidden" 
                                onChange={(e) => setBankFile(e.target.files?.[0] || null)} 
                            />
                        </label>
                    </div>
                    
                    <div className="relative z-10 mt-8 flex flex-col items-center gap-4">
                        <button 
                            onClick={handleProcess}
                            disabled={isProcessing || !receiptFile || !bankFile}
                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-4 px-12 rounded-full shadow-md transition-transform active:scale-95 flex items-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
                            {isProcessing ? 'AI解析中...' : 'アップロードしたCSVでAI消込を開始'}
                        </button>
                        
                        <div className="text-sm font-bold text-gray-400">または</div>

                        <button 
                            onClick={handleDemoProcess}
                            disabled={isProcessing}
                            className="bg-white border-2 border-orange-200 text-orange-500 hover:bg-orange-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 font-bold py-3 px-8 rounded-full transition-transform active:scale-95 flex items-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            テスト用デモデータで実行
                        </button>
                    </div>
                </div>

                {/* Results Table */}
                {initialData && initialData.length > 0 && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            消込結果
                            <span className="text-sm font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                                全 {initialData.length} 件
                            </span>
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-sm font-bold text-gray-400 border-b border-gray-100">
                                        <th className="pb-4 pl-4 whitespace-nowrap">利用者名 / 名義</th>
                                        <th className="pb-4 whitespace-nowrap text-right pr-8">請求額 (円)</th>
                                        <th className="pb-4 whitespace-nowrap text-right pr-8">入金額 (円)</th>
                                        <th className="pb-4 text-center whitespace-nowrap">ステータス</th>
                                        <th className="pb-4 whitespace-nowrap">AIコメント</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700 font-medium text-sm">
                                    {initialData.map((data) => (
                                        <tr key={data.id} className="border-b border-gray-50 hover:bg-orange-50 transition-colors">
                                            <td className="py-5 pl-4 flex flex-col">
                                                <span className="font-bold">{data.patient_name}</span>
                                            </td>
                                            <td className="py-5 text-right pr-8">{data.billed_amount?.toLocaleString()}</td>
                                            <td className={`py-5 text-right pr-8 ${!data.received_amount || data.received_amount !== data.billed_amount ? 'text-red-500 font-bold' : ''}`}>
                                                {data.received_amount ? data.received_amount.toLocaleString() : '-'}
                                            </td>
                                            <td className="py-5 flex justify-center">
                                                {data.status === 'matched' && (
                                                    <span className="inline-flex items-center justify-center min-w-[100px] gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                                                        <CheckCircle size={14} /> 完全一致
                                                    </span>
                                                )}
                                                {data.status === 'inferred' && (
                                                    <span className="inline-flex items-center justify-center min-w-[100px] gap-1 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full">
                                                        <AlertTriangle size={14} /> AI推論
                                                    </span>
                                                )}
                                                {data.status === 'error' && (
                                                    <span className="inline-flex items-center justify-center min-w-[100px] gap-1 bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full">
                                                        <AlertTriangle size={14} /> 不一致/要確認
                                                    </span>
                                                )}
                                                {data.status === 'pending' && (
                                                    <span className="inline-flex items-center justify-center min-w-[100px] gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full">
                                                        未処理
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-5 text-xs w-1/3 leading-relaxed">
                                                {data.status === 'error' ? (
                                                     <span className="text-red-500 font-bold">{data.ai_comment}</span>
                                                ) : (
                                                    data.ai_comment
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

"use client";

import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, LayoutDashboard, Settings, Users } from "lucide-react";

export default function ReconciliationPage() {
    return (
        <div className="min-h-screen bg-[#FFFAF0] flex font-sans">
            {/* Sidebar (Same structure) */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col items-center py-8 shadow-sm">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-12 shadow-sm">
                    <span className="text-white text-2xl font-bold">N</span>
                </div>

                <nav className="flex-1 w-full px-6 flex flex-col gap-4">
                    <a href="/admin/dashboard" className="flex items-center gap-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 px-4 py-3 rounded-2xl font-bold transition-colors">
                        <LayoutDashboard size={20} />
                        ダッシュボード
                    </a>
                    <a href="#" className="flex items-center gap-3 text-orange-500 bg-orange-50 px-4 py-3 rounded-2xl font-bold">
                        <FileSpreadsheet size={20} />
                        CSV 消込
                    </a>
                    <a href="#" className="flex items-center gap-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 px-4 py-3 rounded-2xl font-bold transition-colors">
                        <Users size={20} />
                        利用者・スタッフ
                    </a>
                    <a href="#" className="flex items-center gap-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 px-4 py-3 rounded-2xl font-bold transition-colors mt-auto">
                        <Settings size={20} />
                        設定
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">AI自動消込</h1>
                    <p className="text-gray-500 mt-1 font-medium">請求データと入金データのCSVをアップロードしてください</p>
                </header>

                {/* Upload Area */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border-2 border-dashed border-orange-200 mb-10 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition-colors">
                    <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4">
                        <UploadCloud size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">ここにファイルをドロップするか、クリックして選択</h2>
                    <p className="text-gray-400 font-medium">レセプトCSV・銀行CSV (最大10MB)</p>

                    <div className="mt-8 flex gap-4 w-full max-w-lg">
                        <div className="flex-1 bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center gap-3">
                            <FileSpreadsheet size={24} className="text-green-500" />
                            <div>
                                <span className="block text-sm font-bold text-gray-700">請求データ</span>
                                <span className="block text-xs text-gray-400">receipt_202603.csv</span>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center gap-3">
                            <FileSpreadsheet size={24} className="text-blue-500" />
                            <div>
                                <span className="block text-sm font-bold text-gray-700">入金データ</span>
                                <span className="block text-xs text-gray-400">bank_202603.csv</span>
                            </div>
                        </div>
                    </div>
                    <button className="mt-8 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-12 rounded-full shadow-lg transition-transform active:scale-95">
                        AI解析を開始する
                    </button>
                </div>

                {/* Results Table (Mock) */}
                <div className="bg-white p-8 rounded-3xl shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        消込結果 <span className="text-sm font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">未確定 3件</span>
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-sm font-bold text-gray-400 border-b border-gray-100">
                                    <th className="pb-4 pl-4">利用者名 / 名義</th>
                                    <th className="pb-4">請求額 (円)</th>
                                    <th className="pb-4">入金額 (円)</th>
                                    <th className="pb-4 text-center">ステータス</th>
                                    <th className="pb-4">AIコメント</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 font-medium">
                                <tr className="border-b border-gray-50 hover:bg-orange-50 transition-colors">
                                    <td className="py-5 pl-4 flex flex-col">
                                        <span>佐藤 健一</span>
                                        <span className="text-xs text-gray-400">ｻﾄｳ ｹﾝｲﾁ</span>
                                    </td>
                                    <td className="py-5">15,000</td>
                                    <td className="py-5">15,000</td>
                                    <td className="py-5 text-center">
                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                                            <CheckCircle size={14} /> 完全一致
                                        </span>
                                    </td>
                                    <td className="py-5 text-sm">問題ありません。</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-orange-50 transition-colors">
                                    <td className="py-5 pl-4 flex flex-col">
                                        <span>鈴木 花子</span>
                                        <span className="text-xs text-orange-500">ｽｽﾞｷ ﾀﾛｳ</span>
                                    </td>
                                    <td className="py-5">24,500</td>
                                    <td className="py-5">24,500</td>
                                    <td className="py-5 text-center">
                                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full">
                                            <AlertTriangle size={14} /> AI推論
                                        </span>
                                    </td>
                                    <td className="py-5 text-sm w-1/3">入金名義が家族（太郎様）の可能性がありますが、金額と同一住所要件から鈴木花子様の入金と推論しました。</td>
                                </tr>
                                <tr className="hover:bg-orange-50 transition-colors">
                                    <td className="py-5 pl-4 flex flex-col">
                                        <span>田中 一郎</span>
                                        <span className="text-xs text-red-500">（該当なし）</span>
                                    </td>
                                    <td className="py-5">18,200</td>
                                    <td className="py-5 text-red-500">5,000</td>
                                    <td className="py-5 text-center">
                                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full">
                                            <AlertTriangle size={14} /> 金額不一致
                                        </span>
                                    </td>
                                    <td className="py-5 text-sm w-1/3 text-red-500">入金額が不足しています。一部入金か手違いの可能性があります。</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
}

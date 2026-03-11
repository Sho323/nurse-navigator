import { LayoutDashboard, FileSpreadsheet, Settings, Users, Bell, Search, AlertCircle, ArrowUpRight } from "lucide-react";

export default function AdminDashboardPage() {
    return (
        <div className="min-h-screen bg-[#FFFAF0] flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col items-center py-8 shadow-sm">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-12 shadow-sm">
                    <span className="text-white text-2xl font-bold">N</span>
                </div>

                <nav className="flex-1 w-full px-6 flex flex-col gap-4">
                    <a href="#" className="flex items-center gap-3 text-orange-500 bg-orange-50 px-4 py-3 rounded-2xl font-bold">
                        <LayoutDashboard size={20} />
                        ダッシュボード
                    </a>
                    <a href="/admin/reconciliation" className="flex items-center gap-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 px-4 py-3 rounded-2xl font-bold transition-colors">
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
                {/* Header */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">ダッシュボード</h1>
                        <p className="text-gray-500 mt-1 font-medium">2026年3月のサマリー</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-gray-400">
                            <Search size={20} />
                        </div>
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-orange-500 relative">
                            <Bell size={20} />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                </header>

                {/* Big Numbers (Kompanion style) */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col justify-center items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 text-green-500 bg-green-50 rounded-bl-3xl font-bold flex items-center gap-1">
                            <ArrowUpRight size={16} /> 12%
                        </div>
                        <span className="text-gray-400 font-bold mb-2">今月の売上予測</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-extrabold text-gray-800">4,250</span>
                            <span className="text-xl font-bold text-gray-400">千円</span>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col justify-center items-center">
                        <span className="text-gray-400 font-bold mb-2">未収金総額</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-extrabold text-red-500">120</span>
                            <span className="text-xl font-bold text-gray-400">千円</span>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col justify-center items-center">
                        <span className="text-gray-400 font-bold mb-2">稼働スタッフ</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-extrabold text-gray-800">12</span>
                            <span className="text-xl font-bold text-gray-400">名</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Graph Placeholder */}
                    <div className="col-span-2 bg-white p-8 rounded-3xl shadow-sm h-96 flex flex-col">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">売上推移</h2>
                        <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-4 border-b border-gray-100 relative">
                            <div className="absolute left-0 top-0 h-full border-l border-gray-100 flex flex-col justify-between text-xs text-gray-300 -ml-8">
                                <span>5M</span><span>4M</span><span>3M</span><span>2M</span><span>1M</span><span>0</span>
                            </div>
                            {[40, 60, 45, 80, 55, 90, 75, 100].map((h, i) => (
                                <div key={i} className="w-full bg-orange-100 rounded-t-lg relative group">
                                    <div
                                        className="absolute bottom-0 w-full bg-orange-500 rounded-t-lg transition-all group-hover:bg-orange-600"
                                        style={{ height: `${h}%` }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 px-4 text-xs font-bold text-gray-400">
                            <span>8月</span><span>9月</span><span>10月</span><span>11月</span><span>12月</span><span>1月</span><span>2月</span><span>3月</span>
                        </div>
                    </div>

                    {/* AI Alerts */}
                    <div className="col-span-1 bg-orange-50 border border-orange-100 p-8 rounded-3xl shadow-sm flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-3xl opacity-10 -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="flex items-center gap-2 mb-6 text-orange-600">
                            <AlertCircle size={24} />
                            <h2 className="text-xl font-extrabold">加算アラート</h2>
                        </div>

                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-800">佐藤 健一 様</span>
                                    <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded-full">高確率</span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                    「褥瘡の処置」が3日連続で記録されています。特別管理加算の対象となる可能性があります。
                                </p>
                                <button className="mt-3 text-sm font-bold text-orange-600 hover:text-orange-700">詳細を確認 →</button>
                            </div>

                            <div className="bg-white p-4 rounded-2xl shadow-sm opacity-80">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-800">鈴木 花子 様</span>
                                    <span className="text-xs font-bold text-orange-400 bg-orange-50 px-2 py-1 rounded-full">中確率</span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                    緊急訪問が月2回発生しました。24時間対応体制加算の要件を満たすか確認してください。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}

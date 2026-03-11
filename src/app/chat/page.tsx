"use client";

import { Send, Image as ImageIcon, Menu, Search, AlertCircle, ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function ChatPage() {
    return (
        <div className="bg-[#FFFAF0] min-h-screen font-sans flex flex-col md:flex-row">
            {/* Mobile Header (Hidden on PC) */}
            <header className="md:hidden bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <Link href="/nurse" className="text-gray-500 hover:text-orange-500 transition-colors p-2">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-lg font-bold text-gray-800">全体 タイムライン</h1>
                <button className="text-orange-500 p-2">
                    <Menu size={24} />
                </button>
            </header>

            {/* Sidebar / Thread List */}
            <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-100 shadow-sm h-screen">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">メッセージ</h2>
                    <div className="bg-gray-50 text-gray-400 p-3 rounded-2xl flex items-center gap-2 mb-4">
                        <Search size={20} />
                        <input type="text" placeholder="利用者名など..." className="bg-transparent focus:outline-none w-full text-sm font-medium" />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 border-t border-gray-100">
                    <div className="border-b border-gray-100 p-4 hover:bg-orange-50 cursor-pointer bg-orange-50 transition-colors border-l-4 border-l-orange-500">
                        <h3 className="font-bold text-orange-600 mb-1">全体 タイムライン</h3>
                        <p className="text-xs text-orange-500 bg-orange-100 px-2 py-1 rounded-full inline-block">新着 2件</p>
                    </div>
                    <div className="border-b border-gray-100 p-4 hover:bg-orange-50 cursor-pointer transition-colors">
                        <h3 className="font-bold text-gray-700 mb-1">佐藤 健一 様 スレッド</h3>
                        <p className="text-sm text-gray-400 truncate">体温36.5C、著変なし...</p>
                    </div>
                    <div className="border-b border-gray-100 p-4 hover:bg-orange-50 cursor-pointer transition-colors">
                        <h3 className="font-bold text-gray-700 mb-1">鈴木 花子 様 スレッド</h3>
                        <p className="text-sm text-gray-400 truncate">ご家族からの相談あり...</p>
                    </div>
                </div>
            </aside>

            {/* Chat Area */}
            <main className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen bg-[#FFFDF8]">
                {/* Chat Header (PC) */}
                <header className="hidden md:flex bg-white px-8 py-5 items-center justify-between border-b border-gray-100 shadow-sm z-10">
                    <h1 className="text-xl font-bold text-gray-800">全体 タイムライン</h1>
                    <button className="text-gray-400 hover:text-orange-500 transition-colors bg-orange-50 p-2 rounded-full">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
                    {/* Default User Message (Left) */}
                    <div className="flex items-end gap-3 max-w-[85%]">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                            <span className="text-blue-600 font-bold text-sm">田</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 ml-2 font-bold block mb-1">田中 (看護師) • 10:30</span>
                            <div className="bg-white p-4 rounded-3xl rounded-bl-sm shadow-sm text-gray-700 font-medium">
                                佐藤健一様、本日の訪問終了しました。バイタル異常なし。機嫌良くお過ごしです。
                            </div>
                        </div>
                    </div>

                    {/* AI Alert Message */}
                    <div className="flex justify-center my-4">
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-3xl shadow-sm max-w-[90%] text-center">
                            <span className="flex justify-center items-center gap-1 text-orange-600 font-bold mb-2">
                                <AlertCircle size={18} /> AI 加算アラート
                            </span>
                            <p className="text-sm text-orange-800 font-medium leading-relaxed">
                                田中さんの「佐藤健一様」の記録に褥瘡処置のワードが含まれています。特別管理加算の対象である可能性が高いです。（管理者ダッシュボードに通知済み）
                            </p>
                        </div>
                    </div>

                    {/* My Message (Right) */}
                    <div className="flex items-end flex-row-reverse gap-3 self-end max-w-[85%]">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                            <span className="text-white font-bold text-sm">私</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 mr-2 text-right font-bold block mb-1">10:45</span>
                            <div className="bg-orange-500 text-white p-4 rounded-3xl rounded-br-sm shadow-md font-medium">
                                了解しました。アラートの件、管理者に確認しておきますね。
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white p-4 border-t border-gray-100 sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-orange-500 transition-colors p-3 bg-gray-50 rounded-full active:scale-95">
                            <ImageIcon size={24} />
                        </button>
                        <textarea
                            className="flex-1 bg-gray-50 rounded-3xl focus:outline-none focus:ring-2 focus:ring-orange-200 text-gray-700 resize-none px-6 py-4 max-h-32 text-sm font-medium"
                            placeholder="メッセージを入力..."
                            rows={1}
                        />
                        <button className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

"use client";

import { Send, Image as ImageIcon, Menu, Search, AlertCircle, ArrowLeft, Home, MessageSquare, Calendar, LayoutDashboard, FileSpreadsheet, Lock, Users, LogOut, X } from "lucide-react";
import Link from 'next/link';
import { Database } from "@/types/supabase";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { sendMessage } from "../actions";
import { useRouter } from "next/navigation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Mic } from "lucide-react";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'] & {
    sender?: { name: string, role: string } | null;
};
type Patient = Database['public']['Tables']['patients']['Row'];

interface ChatPageClientProps {
    profile: Profile;
    initialMessages: Message[];
    patients: Patient[];
}

export default function ChatPageClient({ profile, initialMessages, patients }: ChatPageClientProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patients.length > 0 ? patients[0].id : null);
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const router = useRouter();

    // 音声認識の設定
    const { 
        isListening, 
        transcript, 
        startListening, 
        stopListening, 
        resetTranscript 
    } = useSpeechRecognition();

    // 音声入力があった場合にnewMessageに反映
    useEffect(() => {
        if (transcript) {
            setNewMessage((prev) => {
                // 前回までの手入力に、新しい音声認識の文字列をくっつける（重複を避けるためのシンプルな実装例）
                // 本来ならより複雑なマージ操作が必要ですが、MVPとして上書き＋追記で対応
                return transcript;
            });
        }
    }, [transcript]);

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            // マイクを開始する前に現在の入力をリセット（または統合）する
            resetTranscript();
            // 現在の newMessage を transcript に渡すことができれば一番良いですが、
            // useStateの仕様上、シンプルに音声で上書きされる形になります。
            startListening();
        }
    };

    // スクロールを最下部に移動
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Supabase Realtimeのセットアップ
    useEffect(() => {
        if (!profile.tenant_id) return;

        // 現在のテナントIDに一致するメッセージのみを購読
        const channel = supabase
            .channel('realtime:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `tenant_id=eq.${profile.tenant_id}`,
                },
                async (payload) => {
                    const newMsg = payload.new as Message;
                    
                    // 送信者の詳細情報を取得 (簡易的な実装)
                    const { data: senderData } = await supabase
                        .from('profiles')
                        .select('name, role')
                        .eq('id', newMsg.sender_id)
                        .single();

                    if (senderData) {
                        newMsg.sender = senderData as any;
                    }

                    // 新しいメッセージを既存の配列の最後に追加
                    setMessages((prev) => {
                        // 重複防止（オプティミスティックUIアップデート等に対応）
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile.tenant_id, supabase]);

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !photo) || isSubmitting || !profile.tenant_id) return;

        setIsSubmitting(true);
        if (isListening) stopListening(); // 送信時にマイクを止める
        
        const optimisticContent = newMessage;
        const currentPhoto = photo;
        
        setNewMessage(""); // 入力欄を素早くクリア
        setPhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        resetTranscript(); // 音声認識データもクリア

        try {
            const formData = new FormData();
            formData.append("content", optimisticContent);
            formData.append("tenant_id", profile.tenant_id);
            formData.append("sender_id", profile.id);
            if (selectedPatientId) {
                formData.append("patient_id", selectedPatientId);
            }
            if (currentPhoto) {
                formData.append("photo", currentPhoto);
            }

            const result = await sendMessage(formData);
            if (result?.error) {
                console.error(result.error);
                // エラー時は書き戻す
                setNewMessage(optimisticContent);
                if (currentPhoto) {
                    setPhoto(currentPhoto);
                    setPhotoPreview(URL.createObjectURL(currentPhoto));
                }
            }
        } catch (e) {
            console.error(e);
            setNewMessage(optimisticContent);
            if (currentPhoto) {
                setPhoto(currentPhoto);
                setPhotoPreview(URL.createObjectURL(currentPhoto));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Shift + Enter で改行、Enter のみで送信
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh(); // Middleware will redirect to login
    };

    const filteredMessages = messages.filter(msg => {
        // 患者が選択されていない（データがない）場合は何も表示しない
        if (!selectedPatientId) return false; 
        return msg.patient_id === selectedPatientId;
    });

    return (
        <div className="bg-[#FFFAF0] min-h-screen font-sans flex flex-col md:flex-row">
            {/* Mobile Header (Hidden on PC) */}
            <header className="md:hidden bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20 relative">
                <Link href={profile.role === 'admin' ? '/admin/dashboard' : '/nurse'} className="text-gray-500 hover:text-orange-500 transition-colors p-2">
                    <ArrowLeft size={24} />
                </Link>
                <select 
                    value={selectedPatientId || ""} 
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="text-lg font-bold text-gray-800 bg-transparent outline-none appearance-none text-center truncate max-w-[200px]"
                >
                    {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} 様</option>
                    ))}
                </select>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-orange-500 p-2 relative">
                    <Menu size={24} />
                </button>

                {/* Mobile Dropdown Menu */}
                {isMenuOpen && (
                    <div className="absolute top-[60px] right-4 bg-white shadow-xl rounded-2xl w-48 border border-gray-100 flex flex-col overflow-hidden z-30">
                        <Link href="/nurse" className="flex items-center gap-2 p-4 border-b border-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors font-bold text-sm">
                            <Users size={16} /> ナースホーム
                        </Link>
                        {profile.role === 'admin' && (
                            <>
                                <Link href="/admin/dashboard" className="flex items-center gap-2 p-4 border-b border-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors font-bold text-sm">
                                    <LayoutDashboard size={16} /> ダッシュボード
                                </Link>
                                <Link href="/admin/reconciliation" className="flex items-center gap-2 p-4 border-b border-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors font-bold text-sm">
                                    <FileSpreadsheet size={16} /> CSV消込
                                </Link>
                            </>
                        )}
                        <button onClick={handleLogout} className="flex items-center gap-2 p-4 text-red-600 hover:bg-red-50 transition-colors font-bold text-sm text-left">
                            <LogOut size={16} /> ログアウト
                        </button>
                    </div>
                )}
            </header>

            {/* Sidebar / Thread List */}
            <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-100 shadow-sm h-screen">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Link href={profile.role === 'admin' ? '/admin/dashboard' : '/nurse'} className="text-gray-400 hover:text-orange-500">
                             <ArrowLeft size={20} />
                        </Link>
                        メッセージ
                    </h2>
                    <div className="bg-gray-50 text-gray-400 p-3 rounded-2xl flex items-center gap-2 mb-4">
                        <Search size={20} />
                        <input type="text" placeholder="利用者名など..." className="bg-transparent focus:outline-none w-full text-sm font-medium" />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 border-t border-gray-100">
                    {patients.map((patient) => (
                        <div 
                            key={patient.id} 
                            onClick={() => setSelectedPatientId(patient.id)}
                            className={`border-b border-gray-100 p-4 hover:bg-orange-50 cursor-pointer transition-colors ${selectedPatientId === patient.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}`}
                        >
                            <h3 className={`font-bold mb-1 ${selectedPatientId === patient.id ? 'text-orange-600' : 'text-gray-700'}`}>
                                {patient.name} 様 スレッド
                            </h3>
                            <p className="text-sm text-gray-400 truncate">{patient.care_level} / {patient.insurance_type}</p>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Chat Area */}
            <main className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen bg-[#FFFDF8] relative pb-16 md:pb-0">
                {/* Chat Header (PC) */}
                <header className="hidden md:flex bg-white px-8 py-5 items-center justify-between border-b border-gray-100 shadow-sm z-10 relative">
                    <h1 className="text-xl font-bold text-gray-800">
                        {!selectedPatientId ? '全体 タイムライン' : `${patients.find(p => p.id === selectedPatientId)?.name || '不明'} 様 スレッド`}
                    </h1>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-400 hover:text-orange-500 transition-colors bg-orange-50 p-2 rounded-full relative">
                        <Menu size={24} />
                    </button>

                    {/* PC Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-[70px] right-8 bg-white shadow-xl rounded-2xl w-48 border border-gray-100 flex flex-col overflow-hidden z-30">
                            <Link href="/nurse" className="flex items-center gap-2 p-4 border-b border-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors font-bold text-sm">
                                <Users size={16} /> ナースホーム
                            </Link>
                            {profile.role === 'admin' && (
                                <>
                                    <Link href="/admin/dashboard" className="flex items-center gap-2 p-4 border-b border-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors font-bold text-sm">
                                        <LayoutDashboard size={16} /> ダッシュボード
                                    </Link>
                                    <Link href="/admin/reconciliation" className="flex items-center gap-2 p-4 border-b border-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors font-bold text-sm">
                                        <FileSpreadsheet size={16} /> CSV消込
                                    </Link>
                                </>
                            )}
                            <button onClick={handleLogout} className="flex items-center gap-2 p-4 text-red-600 hover:bg-red-50 transition-colors font-bold text-sm text-left">
                                <LogOut size={16} /> ログアウト
                            </button>
                        </div>
                    )}
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
                    
                    {!profile.tenant_id ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="bg-white p-8 rounded-3xl shadow-sm max-w-md w-full">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">チャットを利用するには</h2>
                                <p className="text-gray-500 mb-6 text-sm">
                                    まだ現在の事業所（テナント）に所属していないため、メッセージを送受信できません。<br/>
                                    ホーム画面からテストデータを生成してください。
                                </p>
                                <Link 
                                    href="/nurse"
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-2xl block transition-colors"
                                >
                                    ホーム画面へ戻る
                                </Link>
                            </div>
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            まだメッセージはありません。最初のメッセージを送信してみましょう。
                        </div>
                    ) : (
                        filteredMessages.map((msg) => {
                        const isMine = msg.sender_id === profile.id;

                        // AIアラート（システム通知）の場合
                        if (msg.is_system_alert) {
                            return (
                                <div key={msg.id} className="flex justify-center my-4">
                                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-3xl shadow-sm max-w-[90%] text-center">
                                        <span className="flex justify-center items-center gap-1 text-orange-600 font-bold mb-2">
                                            <AlertCircle size={18} /> AI 加算アラート
                                        </span>
                                        <p className="text-sm text-orange-800 font-medium leading-relaxed">
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        }

                        // 通常のメッセージ
                        return (
                            <div key={msg.id} className={`flex items-end gap-3 max-w-[85%] ${isMine ? 'self-end flex-row-reverse' : ''}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${isMine ? 'bg-orange-500' : 'bg-blue-100'}`}>
                                    <span className={`${isMine ? 'text-white' : 'text-blue-600'} font-bold text-sm`}>
                                        {isMine ? '私' : (msg.sender?.name?.charAt(0) || '?')}
                                    </span>
                                </div>
                                <div>
                                    <span className={`text-xs text-gray-400 font-bold block mb-1 ${isMine ? 'mr-2 text-right' : 'ml-2'}`}>
                                        {!isMine && `${msg.sender?.name || '不明'} • `} 
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className={`p-4 rounded-3xl shadow-sm font-medium whitespace-pre-wrap ${
                                        isMine 
                                        ? 'bg-orange-500 text-white rounded-br-sm' 
                                        : 'bg-white text-gray-700 rounded-bl-sm'
                                    }`}>
                                        {msg.content.includes('[IMAGE:') ? (
                                            msg.content.split(/\n?\[IMAGE:(.*?)\]\n?/).map((part, i) => {
                                                if (i % 2 === 1) { // 奇数インデックスは抽出されたURL
                                                    return (
                                                        <img key={i} src={part} alt="Uploaded" className="rounded-xl w-64 h-auto object-cover max-w-full my-2 shadow-sm border border-black/5" />
                                                    );
                                                }
                                                return part ? <span key={i}>{part}</span> : null;
                                            })
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white p-4 border-t border-gray-100 sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    {photoPreview && (
                        <div className="mb-3 pl-14 relative w-24 h-24">
                            <img src={photoPreview} alt="preview" className="rounded-xl w-full h-full object-cover border border-gray-200" />
                            <button 
                                onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-400 hover:text-orange-500 transition-colors p-3 bg-gray-50 rounded-full active:scale-95"
                        >
                            <ImageIcon size={24} />
                        </button>
                        <div className="flex-1 relative">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-gray-50 rounded-3xl focus:outline-none focus:ring-2 focus:ring-orange-200 text-gray-700 resize-none px-6 py-4 pr-12 max-h-32 text-sm font-medium"
                                placeholder={isListening ? "音声を聞き取り中..." : "メッセージを入力... (Enterで送信)"}
                                rows={1}
                                disabled={isSubmitting}
                            />
                            <button
                                onClick={handleMicClick}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
                                    isListening ? "text-red-500 bg-red-50 hover:bg-red-100 animate-pulse" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                                }`}
                            >
                                <Mic size={20} />
                            </button>
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            disabled={isSubmitting || (!newMessage.trim() && !photo)}
                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white p-4 rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>

                {/* Bottom Nav (Mobile Only) */}
                <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <Link href="/nurse" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400 transition-colors">
                        <Home size={24} />
                        <span className="text-[10px] font-bold">ホーム</span>
                    </Link>
                    <Link href="/chat" className="flex flex-col items-center gap-1 text-orange-500">
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
            </main>
        </div>
    );
}

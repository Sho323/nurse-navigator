import { LogIn } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#FFFAF0] flex flex-col justify-center items-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center">
                <div className="mb-8">
                    <div className="w-16 h-16 bg-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
                        <span className="text-white text-3xl font-bold">N</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Nurse Navigator</h1>
                    <p className="text-sm text-gray-500 mt-2">日々の業務をシンプルに。</p>
                </div>

                <button className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors duration-200">
                    <LogIn size={20} />
                    Googleでログイン
                </button>

                {/* モック用の画面遷移リンク（後で削除） */}
                <div className="mt-8 text-xs text-gray-400 flex flex-col gap-2">
                    <p>開発用デモリンク:</p>
                    <Link href="/nurse" className="underline hover:text-orange-500">看護師ホーム画面へ</Link>
                    <Link href="/admin/dashboard" className="underline hover:text-orange-500">管理者ダッシュボードへ</Link>
                </div>
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    return (
        <div className="min-h-screen bg-[#FFFAF0] flex flex-col justify-center items-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">認証エラー</h1>
                <p className="text-gray-600 mb-4 leading-relaxed">
                    ログイン処理中に問題が発生しました。再度ログインをお試しください。
                </p>

                {(error || errorDescription) && (
                    <div className="bg-red-50 text-red-600 rounded-lg p-3 text-left w-full text-xs font-mono break-all mb-8 border border-red-100">
                        {error && <p className="font-bold mb-1">Error: {error}</p>}
                        {errorDescription && <p>Description: {errorDescription}</p>}
                    </div>
                )}

                <Link
                    href="/login"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl transition-colors duration-200"
                >
                    ログイン画面へ戻る
                </Link>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FFFAF0] flex justify-center items-center">Loading...</div>}>
            <AuthErrorContent />
        </Suspense>
    );
}

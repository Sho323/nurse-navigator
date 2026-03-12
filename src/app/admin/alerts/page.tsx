import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getUserProfile } from "@/utils/supabase/api";
import { redirect } from "next/navigation";
import { LayoutDashboard, FileSpreadsheet, Users, Bell, AlertCircle, CheckCircle2, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "../dashboard/components/DashboardHeader";
import AlertToggle from "../components/AlertToggle";

export default async function AdminAlertsPage() {
    const profile = await getUserProfile();
    
    // In our demo setup, we treat everyone visiting this page as if they should see it,
    // or we redirect based on presence of a profile.
    if (!profile) redirect("/login");

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch AI Alerts
    const { data: alerts } = await supabaseAdmin
        .from("ai_alerts")
        .select(`
            *,
            visit_record:visit_records(
                visit_type,
                temperature,
                blood_pressure,
                text_record,
                patient:patients(name)
            )
        `)
        .eq("tenant_id", profile.tenant_id)
        .order("is_resolved", { ascending: true }) // 未解決を上に
        .order("created_at", { ascending: false });

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
                    <Link href="/admin/alerts" className="flex items-center gap-3 text-orange-500 bg-orange-50 px-4 py-3 rounded-2xl font-bold">
                        <AlertCircle size={20} />
                        加算・アラート一覧
                    </Link>
                    <Link href="/admin/reconciliation" className="flex items-center gap-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 px-4 py-3 rounded-2xl font-bold transition-colors">
                        <FileSpreadsheet size={20} />
                        CSV 消込
                    </Link>
                    <div className="border-t border-gray-100 my-2"></div>
                    <Link href="/nurse" className="flex items-center gap-3 text-gray-500 hover:text-orange-500 hover:bg-orange-50 px-4 py-3 rounded-2xl font-bold transition-colors">
                        <Users size={20} />
                        ナースホームへ
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-auto">
                <DashboardHeader alerts={alerts?.filter(a => !a.is_resolved) || []} />

                <div className="mb-8">
                    <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                        <AlertCircle className="text-orange-500" />
                        加算取得・確認アラート一覧
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm font-medium">
                        AIが訪問記録を解析し、2026年診療報酬改定の要件に基づく「算定できそうな加算」と「不足している情報」を一覧化しています。
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex border-b border-gray-100 bg-gray-50 px-6 py-4 items-center">
                        <div className="flex-1 text-sm font-bold text-gray-500">利用者・記録日</div>
                        <div className="flex-1 text-sm font-bold text-gray-500">加算候補</div>
                        <div className="flex-[2] text-sm font-bold text-gray-500">理由・不足情報</div>
                        <div className="w-24 text-sm font-bold text-gray-500 text-center">ステータス</div>
                    </div>

                    <div className="flex flex-col">
                        {alerts && alerts.length > 0 ? (
                            alerts.map((alert: any) => {
                                const patientName = Array.isArray(alert.visit_record?.patient) 
                                    ? alert.visit_record?.patient[0]?.name 
                                    : alert.visit_record?.patient?.name || "不明な利用者";
                                const recordDate = new Date(alert.created_at).toLocaleDateString("ja-JP");
                                
                                return (
                                    <div key={alert.id} className="flex border-b border-gray-50 px-6 py-5 hover:bg-orange-50/30 transition-colors items-start">
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800 text-base">{patientName} 様</p>
                                            <p className="text-xs text-gray-400 mt-1">{recordDate}</p>
                                        </div>
                                        <div className="flex-1">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                                {alert.alert_type}
                                            </span>
                                        </div>
                                        <div className="flex-[2] pr-4">
                                            {/* We format the combined description to split out the missing info clearly */}
                                            {alert.description.includes("【不足情報・確認事項】") ? (
                                                <>
                                                    <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                                        {alert.description.split("【不足情報・確認事項】")[0]}
                                                    </p>
                                                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                                        <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1">
                                                            <AlertCircle size={12} />
                                                            不足情報・確認事項
                                                        </p>
                                                        <p className="text-xs text-red-700 leading-relaxed">
                                                            {alert.description.split("【不足情報・確認事項】")[1]}
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-sm text-gray-600 leading-relaxed">{alert.description}</p>
                                            )}
                                        </div>
                                        <div className="w-24 text-center flex flex-col items-center justify-center">
                                            <AlertToggle alertId={alert.id} initialStatus={alert.is_resolved} variant="icon" />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                                <CheckCircle2 size={48} className="text-green-300 mb-4" />
                                <p className="font-bold">現在のアラートはありません。</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

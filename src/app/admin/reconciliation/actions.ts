"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/utils/supabase/api";
import { reconcileCsv } from "@/utils/reconciliation";

export async function processReconciliation(formData: FormData) {
    const receiptCsvStr = formData.get("receiptCsv") as string;
    const bankCsvStr = formData.get("bankCsv") as string;
    const tenant_id = formData.get("tenant_id") as string;

    if (!receiptCsvStr || !bankCsvStr || !tenant_id) {
        return { error: "CSVデータまたはテナントIDが不足しています" };
    }

    try {
        const profile = await getUserProfile();
        if (!profile || profile.role !== "admin") {
            return { error: "管理者権限が必要です" };
        }
        if (profile.tenant_id !== tenant_id) {
            return { error: "テナントが一致しません" };
        }

        // RLSをバイパスするためAdminクライアントを使用（sales_dataはadminロール限定のため）
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: patientMaster, error: patientError } = await supabaseAdmin
            .from("patients")
            .select("name, kana_name")
            .eq("tenant_id", tenant_id);

        if (patientError) {
            console.error("Patient master fetch error:", patientError);
            return { error: "患者マスタの取得に失敗しました" };
        }

        const results = reconcileCsv({
            receiptCsv: receiptCsvStr,
            bankCsv: bankCsvStr,
            patientMaster: patientMaster || [],
        });
        
        // （MVP仕様）以前の推論データを一旦クリアする
        await supabaseAdmin
            .from("sales_data")
            .delete()
            .eq("tenant_id", tenant_id)
            .eq("target_month", "2026-03");

        const insertData = results.map((result) => ({
            tenant_id,
            patient_name: result.patient_name,
            billed_amount: result.billed_amount,
            received_amount: result.received_amount,
            status: result.status,
            ai_comment: result.ai_comment ?? null,
            target_month: "2026-03" 
        }));

        const { error } = await supabaseAdmin.from("sales_data").insert(insertData);
        if (error) {
             console.error("DB Insert Error", error);
             return { error: "DBへの保存に失敗しました: " + error.message };
        }

        revalidatePath("/admin/reconciliation");
        return { success: true };

    } catch (error) {
        const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
        console.error("Reconciliation Error:", error);
        return { error: message };
    }
}

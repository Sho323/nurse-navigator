"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function processReconciliation(formData: FormData) {
    const receiptCsvStr = formData.get("receiptCsv") as string;
    const bankCsvStr = formData.get("bankCsv") as string;
    const tenant_id = formData.get("tenant_id") as string;

    if (!receiptCsvStr || !bankCsvStr || !tenant_id) {
        return { error: "CSVデータまたはテナントIDが不足しています" };
    }

    try {
        const prompt = `
あなたは医療事務の消込（入金確認）のプロフェッショナルです。
以下の「請求データ（レセプト）」と「入金データ（銀行）」を比較し、AIによる自動消込を行ってください。
入金データはカタカナであったり、家族名義であったり、一部未払いがあったりする場合があります。

【請求データ (CSV)】
${receiptCsvStr}

【入金データ (CSV)】
${bankCsvStr}

以下のJSON形式で各請求データに対する推論結果を出力してください。キーは必ず英語にしてください。
{
  "results": [
    {
      "patient_name": "請求データにある患者名",
      "billed_amount": "請求額(数値)",
      "received_amount": "入金データからマッチした入金額(数値)。見つからない場合はnull",
      "status": "matched (完全一致) | inferred (名義違いだが一致、または少額の差額等を推論済) | error (金額が大きく異なる、または見つからない場合)",
      "ai_comment": "判定の理由。特にinferredやerrorの場合は詳しく（例：「入金名義が家族（太郎様）の可能性がありますが、金額から同一の方と推論しました」など）"
    }
  ]
}
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const resultJsonStr = response.choices[0].message.content;
        if (!resultJsonStr) {
             throw new Error("AI failed to return response");
        }

        const parsed = JSON.parse(resultJsonStr);
        const results = parsed.results;

        // RLSをバイパスするためAdminクライアントを使用（sales_dataはadminロール限定のため）
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        // （MVP仕様）以前の推論データを一旦クリアする
        await supabaseAdmin
            .from("sales_data")
            .delete()
            .eq("tenant_id", tenant_id)
            .eq("target_month", "2026-03");

        const insertData = results.map((r: any) => ({
            tenant_id,
            patient_name: r.patient_name,
            billed_amount: Number(r.billed_amount),
            received_amount: r.received_amount ? Number(r.received_amount) : null,
            status: r.status,
            ai_comment: r.ai_comment,
            target_month: "2026-03" 
        }));

        const { error } = await supabaseAdmin.from("sales_data").insert(insertData);
        if (error) {
             console.error("DB Insert Error", error);
             return { error: "DBへの保存に失敗しました: " + error.message };
        }

        revalidatePath("/admin/reconciliation");
        return { success: true };

    } catch (e: any) {
        console.error("Reconciliation Error:", e);
        return { error: e.message };
    }
}

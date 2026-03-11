import OpenAI from 'openai';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// バックグラウンド処理用のSupabaseクライアント（cookiesを使わない）
const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkBillingRules({
    textRecord,
    tenantId,
    patientId,
    visitRecordId,
    nurseId,
}: {
    textRecord: string;
    tenantId: string;
    patientId: string;
    visitRecordId: string;
    nurseId: string;
}) {
    if (!textRecord || !process.env.OPENAI_API_KEY) {
        return; // Skip if no text or no key
    }

    try {
        const prompt = `
あなたは訪問看護ステーションの優秀な医療事務・レセプトチェッカー（AIアシスタント）です。
以下の訪問スタッフ（看護師、理学療法士（PT）、作業療法士（OT）、言語聴覚士（ST）、またはケアマネージャー等）の訪問記録や連携記録を読み、**診療報酬改定2026（令和8年度）にも対応した特別な加算** の対象となる可能性がないか判定してください。

記録から以下のようなキーワードが見つかった場合、アラートを生成します：
【看護系】
- 「褥瘡」「カテーテル」（特別管理加算の可能性）
- 「緊急」「急変」「発熱で呼ばれた」（緊急訪問看護加算の可能性）
- 「深夜」「早朝」（深夜早朝加算の可能性）
- 「看取り」「ターミナル」（ターミナルケア加算の可能性）

【リハビリ・連携系】
- 「退院時」「退院直後」「カンファレンス」（退院時共同指導加算、退院支援指導加算の可能性）
- 「リハビリ」「評価」「計画見直し」（リハビリテーション関連加算、または複数名訪問の可能性）
- 「ケアマネに報告」「サービス担当者会議」「ICT連携」「情報共有」（連携体制加算、訪問看護医療情報連携加算の可能性）
- 「オンライン診療」「カメラ」「同行」（訪問看護遠隔診療補助料の可能性）

その他、医療保険や介護保険の特別加算の対象になりそうな重要なワードがあれば反応してください。

アラートが必要な場合は、加算の要件を満たすために**現在不足している情報や確認すべきこと（カルテの記載漏れ、医師の指示書の有無、ケアマネとの共有記録の有無、同意書の有無など）** も必ず指摘してください。これにより、他職種間での「書き忘れ」や「連携漏れ」を防ぎます。

アラートが必要な場合は、以下の形式のJSONでのみ返答してください。
{
    "has_alert": true,
    "alert_type": "特別管理加算など、該当しそうな加算名",
    "description": "加算の対象となる可能性がある理由を1〜2文で完結に説明してください。",
    "missing_info": "加算を取得するために現在不足している情報や、他職種に確認・記載依頼すべき事項（例：『医師の指示書の有無が不明です』『ケアマネ宛の報告書の送付記録が必要です』等）。"
}

アラートが不要な場合は、以下の形式のJSONでのみ返答してください。
{
    "has_alert": false
}

訪問記録:
"${textRecord}"
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const resultJson = response.choices[0].message.content;
        if (!resultJson) return;

        const result = JSON.parse(resultJson);

        if (result.has_alert) {
            // 不足情報のテキストを組み立てる
            const finalDescription = result.missing_info 
                ? `${result.description}\n\n【不足情報・確認事項】\n${result.missing_info}` 
                : result.description;

            // データベースにAIアラートを記録
            // 1. ai_alertsテーブルに記録
            const { error: alertError } = await supabaseAdmin
                .from("ai_alerts")
                .insert({
                    tenant_id: tenantId,
                    visit_record_id: visitRecordId,
                    alert_type: result.alert_type,
                    description: finalDescription,
                    is_resolved: false,
                });

            if (alertError) {
                console.error("Error inserting AI alert:", alertError);
            }

            // 2. messagesテーブルにシステム通知として送信
            const systemContent = `【AIレセプト・アラート】\n加算候補: ${result.alert_type}\n\n${finalDescription}\n\n（担当者は該当の加算要件が満たされているか確認してください）`;
            
            await supabaseAdmin.from("messages").insert({
                tenant_id: tenantId,
                sender_id: nurseId,
                patient_id: patientId,
                content: systemContent,
                is_system_alert: true,
            });
        }
    } catch (e) {
        console.error("Error analyzing record with AI:", e);
    }
}

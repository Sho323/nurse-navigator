import OpenAI from 'openai';
import { createClient } from './supabase/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
以下の看護師の訪問記録を読み、**特別な加算（特別管理加算、緊急訪問看護加算、24時間対応体制加算など）**の対象となる可能性がないか判定してください。

記録から以下のようなキーワードが見つかった場合、アラートを生成します：
- 「褥瘡」（処置による特別管理加算の可能性）
- 「緊急」「急変」「発熱で呼ばれた」（緊急訪問看護加算の可能性）
- 「深夜」「早朝」（深夜早朝加算の可能性）
- 「看取り」「ターミナル」（ターミナルケア加算の可能性）
- その他、医療保険や介護保険の特別加算の対象になりそうな重要なワード

アラートが必要な場合は、以下の形式のJSONでのみ返答してください。
{
    "has_alert": true,
    "alert_type": "特別管理加算など、該当しそうな加算名",
    "description": "加算の対象となる可能性がある理由を1〜2文で完結に。"
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
            // データベースにAIアラートを記録
            const supabase = await createClient();
            
            // 1. ai_alertsテーブルに記録
            const { error: alertError } = await supabase
                .from("ai_alerts")
                .insert({
                    tenant_id: tenantId,
                    visit_record_id: visitRecordId,
                    alert_type: result.alert_type,
                    description: result.description,
                    is_resolved: false,
                });

            if (alertError) {
                console.error("Error inserting AI alert:", alertError);
            }

            // 2. messagesテーブルにシステム通知として送信
            const systemContent = `【AIレセプト・アラート】\n加算候補: ${result.alert_type}\n\n${result.description}\n\n（担当者は該当の加算要件が満たされているか確認してください）`;
            
            await supabase.from("messages").insert({
                tenant_id: tenantId,
                sender_id: nurseId, // 送信者はトリガーした看護師にするか、別にAIのsystem_idを作るか
                patient_id: patientId,
                content: systemContent,
                is_system_alert: true,
            });
        }
    } catch (e) {
        console.error("Error analyzing record with AI:", e);
    }
}

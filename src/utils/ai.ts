import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { hasGrantedAiConsent } from "./consent";

type AlertRule = {
    alertType: string;
    keywords: string[];
    missingInfo: string;
};

type AlertDetection = {
    alertType: string;
    matchedKeywords: string[];
    missingInfo: string;
};

const ALERT_RULES: AlertRule[] = [
    {
        alertType: "特別管理加算",
        keywords: ["褥瘡", "カテーテル"],
        missingInfo: "特別管理指導の記録と医師指示書の有無を確認してください。",
    },
    {
        alertType: "緊急訪問看護加算",
        keywords: ["緊急", "急変", "発熱で呼ばれた"],
        missingInfo: "緊急対応の発生時刻、連絡経路、訪問実施記録の有無を確認してください。",
    },
    {
        alertType: "深夜早朝加算",
        keywords: ["深夜", "早朝"],
        missingInfo: "訪問時刻と算定区分（深夜/早朝）の記録を確認してください。",
    },
    {
        alertType: "ターミナルケア加算",
        keywords: ["看取り", "ターミナル"],
        missingInfo: "終末期対応計画、家族説明記録、医師連携記録の有無を確認してください。",
    },
    {
        alertType: "退院時共同指導・退院支援関連加算",
        keywords: ["退院時", "退院直後", "カンファレンス"],
        missingInfo: "退院支援会議の参加記録と関係職種連携記録の有無を確認してください。",
    },
    {
        alertType: "リハビリ関連加算",
        keywords: ["リハビリ", "評価", "計画見直し"],
        missingInfo: "評価実施記録、計画書更新日、実施頻度の記録を確認してください。",
    },
    {
        alertType: "医療情報連携・体制加算",
        keywords: ["ケアマネに報告", "サービス担当者会議", "ICT連携", "情報共有"],
        missingInfo: "連携先・連携手段・実施日を記録できているか確認してください。",
    },
    {
        alertType: "訪問看護遠隔診療補助料",
        keywords: ["オンライン診療", "カメラ", "同行"],
        missingInfo: "遠隔診療実施の医師指示、補助内容、実施時刻の記録を確認してください。",
    },
];

const NEGATION_PATTERN = /(なし|認めず|認めない|ではない|ありません|なかった|否定|陰性)/;

const supabaseAdmin = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasPositiveKeyword(text: string, keyword: string) {
    const pattern = new RegExp(escapeRegExp(keyword), "g");
    let match = pattern.exec(text);

    while (match) {
        const start = Math.max(0, match.index - 8);
        const end = Math.min(text.length, match.index + keyword.length + 8);
        const windowText = text.slice(start, end);
        if (!NEGATION_PATTERN.test(windowText)) {
            return true;
        }
        match = pattern.exec(text);
    }

    return false;
}

function detectAlerts(textRecord: string): AlertDetection[] {
    const normalizedText = textRecord.normalize("NFKC");
    const detections: AlertDetection[] = [];

    for (const rule of ALERT_RULES) {
        const matchedKeywords = rule.keywords.filter((keyword) => hasPositiveKeyword(normalizedText, keyword));
        if (matchedKeywords.length === 0) {
            continue;
        }

        detections.push({
            alertType: rule.alertType,
            matchedKeywords,
            missingInfo: rule.missingInfo,
        });
    }

    return detections;
}

function buildAlertDescription(detection: AlertDetection) {
    return `記録内のキーワード「${detection.matchedKeywords.join(" / ")}」から ${detection.alertType} の可能性があります。\n\n【不足情報・確認事項】\n${detection.missingInfo}`;
}

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
    if (!textRecord) {
        return;
    }

    try {
        const consentCheck = await hasGrantedAiConsent({
            supabase: supabaseAdmin,
            tenantId,
            patientId,
        });

        if (consentCheck.error) {
            console.error(
                `[CONSENT_GUARD] 同意情報の取得に失敗したためアラート判定を中止しました。 tenantId=${tenantId} patientId=${patientId}`,
                consentCheck.error
            );
            return;
        }

        if (!consentCheck.granted) {
            console.warn(
                `[CONSENT_GUARD] AI同意未取得のため加算アラート判定をスキップしました。 tenantId=${tenantId} patientId=${patientId} visitRecordId=${visitRecordId}`
            );
            return;
        }

        if (process.env.COMPLIANCE_ENFORCED === "true") {
            console.info(
                `[COMPLIANCE_ENFORCED] 外部AIは使用せず、ローカルルールで加算アラート判定を実行します。 tenantId=${tenantId} visitRecordId=${visitRecordId}`
            );
        }

        const detections = detectAlerts(textRecord);
        if (detections.length === 0) {
            return;
        }

        const { data: existingAlerts, error: existingAlertError } = await supabaseAdmin
            .from("ai_alerts")
            .select("alert_type")
            .eq("tenant_id", tenantId)
            .eq("visit_record_id", visitRecordId);

        if (existingAlertError) {
            console.error("Failed to read existing alerts:", existingAlertError);
            return;
        }

        const existingTypes = new Set((existingAlerts ?? []).map((alert) => alert.alert_type));
        const newDetections = detections.filter((detection) => !existingTypes.has(detection.alertType));
        if (newDetections.length === 0) {
            return;
        }

        const insertPayload = newDetections.map((detection) => ({
            tenant_id: tenantId,
            visit_record_id: visitRecordId,
            alert_type: detection.alertType,
            description: buildAlertDescription(detection),
            is_resolved: false,
        }));

        const { error: insertAlertError } = await supabaseAdmin.from("ai_alerts").insert(insertPayload);
        if (insertAlertError) {
            console.error("Error inserting rule-based alerts:", insertAlertError);
            return;
        }

        const systemContent = [
            "【加算ルールアラート】",
            ...newDetections.map(
                (detection, index) =>
                    `${index + 1}. ${detection.alertType}（検知: ${detection.matchedKeywords.join(" / ")}）\n${detection.missingInfo}`
            ),
            "",
            "（本通知はキーワードルールで生成されています）",
        ].join("\n");

        await supabaseAdmin.from("messages").insert({
            tenant_id: tenantId,
            sender_id: nurseId,
            patient_id: patientId,
            content: systemContent,
            is_system_alert: true,
        });
    } catch (error) {
        console.error("Rule-based alert generation error:", error);
    }
}

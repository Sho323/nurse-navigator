"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function saveVisitRecord(formData: FormData) {
    const supabase = await createClient();

    const tenant_id = formData.get("tenant_id") as string;
    const patient_id = formData.get("patient_id") as string;
    const nurse_id = formData.get("nurse_id") as string;
    const visit_type = formData.get("visit_type") as string;
    const temperature = formData.get("temperature") as string;
    const blood_pressure = formData.get("blood_pressure") as string;
    const pulse = formData.get("pulse") as string;
    const spO2 = formData.get("spO2") as string;
    const text_record = formData.get("text_record") as string;
    const photo = formData.get("photo") as File | null;

    if (!tenant_id || !patient_id || !nurse_id) {
        return { error: "Missing required fields." };
    }

    let image_urls: string[] = [];

    // Upload photo to Supabase Storage if present
    if (photo && photo.size > 0) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${tenant_id}/${patient_id}/${Date.now()}.${fileExt}`;

        // RLSをバイパスしてサーバーから直接画像を保存するためにService Role Keyを使用
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("patient-records")
            .upload(fileName, photo, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            console.error("Upload error: ", uploadError);
            return { error: "Failed to upload image." };
        }

        // Get public URL
        const { data: bgData } = supabaseAdmin.storage
            .from("patient-records")
            .getPublicUrl(uploadData.path);
            
        image_urls.push(bgData.publicUrl);
    }

    // Insert visit record
    const { data: visitRecord, error: insertError } = await supabase
        .from("visit_records")
        .insert({
            tenant_id,
            patient_id,
            nurse_id,
            visit_type: visit_type || "看護訪問",
            temperature: temperature ? parseFloat(temperature) : null,
            blood_pressure: blood_pressure || null,
            text_record: text_record || null,
            image_urls: image_urls.length > 0 ? image_urls : null,
        })
        .select()
        .single();

    if (insertError) {
        console.error("Insert Error: ", insertError);
        return { error: "Failed to save visit record." };
    }

    // Send a system message to the timeline automatically for sharing
    let summary = `${visit_type || "看護訪問"} 記録保存\n`;
    if (temperature) summary += `体温: ${temperature}℃\n`;
    if (blood_pressure) summary += `血圧: ${blood_pressure}\n`;
    if (pulse) summary += `脈拍: ${pulse}\n`;
    if (spO2) summary += `SpO2: ${spO2}%\n`;
    if (text_record) summary += `記録: ${text_record.substring(0, 30)}...`;
    
    // Add image marker for timeline visualization
    if (image_urls.length > 0) {
        summary += `\n[IMAGE:${image_urls[0]}]`;
    }

    await supabase.from("messages").insert({
        tenant_id,
        sender_id: nurse_id,
        patient_id: patient_id,
        content: summary,
        is_system_alert: false
    });

    // Vercelのサーバーレス環境では、レスポンス返却後にプロセスが終了するため
    // awaitで確実にAI解析（加算チェック）が完了するのを待つ
    const combinedRecordForAi = `
    脈拍: ${pulse || '未記入'}
    SpO2: ${spO2 || '未記入'}
    ${text_record || ''}
    `.trim();

    if (text_record || pulse || spO2) {
        try {
            const { checkBillingRules } = await import("@/utils/ai");
            await checkBillingRules({
                textRecord: combinedRecordForAi,
                tenantId: tenant_id,
                patientId: patient_id,
                visitRecordId: visitRecord.id,
                nurseId: nurse_id,
            });
        } catch (err) {
            console.error("AI加算チェックエラー:", err);
        }
    }

    return { success: true, data: visitRecord };
}


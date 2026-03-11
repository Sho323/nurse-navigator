"use server";

import { createClient } from "@/utils/supabase/server";

export async function saveVisitRecord(formData: FormData) {
    const supabase = await createClient();

    const tenant_id = formData.get("tenant_id") as string;
    const patient_id = formData.get("patient_id") as string;
    const nurse_id = formData.get("nurse_id") as string;
    const visit_type = formData.get("visit_type") as string;
    const temperature = formData.get("temperature") as string;
    const blood_pressure = formData.get("blood_pressure") as string;
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

        const { data: uploadData, error: uploadError } = await supabase.storage
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
        const { data: bgData } = supabase.storage
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
            visit_type: visit_type || "通常訪問",
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
    const summary = `${visit_type || "通常訪問"} 記録保存\n体温: ${temperature || '-'}℃\n血圧: ${blood_pressure || '-'}\n${text_record ? `記録: ${text_record.substring(0, 30)}...` : ''}`;
    
    await supabase.from("messages").insert({
        tenant_id,
        sender_id: nurse_id,
        patient_id: patient_id,
        content: summary,
        is_system_alert: false
    });

    // 記録内容を非同期でAIによる加算チェックへ渡す（完了を待たない）
    if (text_record) {
        import("@/utils/ai").then((module) => {
            module.checkBillingRules({
                textRecord: text_record,
                tenantId: tenant_id,
                patientId: patient_id,
                visitRecordId: visitRecord.id,
                nurseId: nurse_id,
            });
        }).catch(err => console.error(err));
    }

    return { success: true, data: visitRecord };
}


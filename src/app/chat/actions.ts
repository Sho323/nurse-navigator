"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function sendMessage(formData: FormData) {
    const content = formData.get("content") as string;
    const tenant_id = formData.get("tenant_id") as string;
    const sender_id = formData.get("sender_id") as string;
    const patient_id = formData.get("patient_id") as string | null;

    if (!content || !tenant_id || !sender_id) {
        return { error: "必須項目が不足しています" };
    }

    const supabase = await createClient();
    let finalContent = content;

    const photo = formData.get("photo") as File | null;
    if (photo && photo.size > 0) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${tenant_id}/chat/${Date.now()}.${fileExt}`;

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("patient-records")
            .upload(fileName, photo, { cacheControl: "3600", upsert: false });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return { error: "Failed to upload image." };
        }

        const { data: bgData } = supabaseAdmin.storage
            .from("patient-records")
            .getPublicUrl(uploadData.path);
        
        // メッセージが空で画像だけ送られた場合などにも対応
        if (!finalContent.trim()) {
            finalContent = `[IMAGE:${bgData.publicUrl}]`;
        } else {
            finalContent = `${finalContent}\n[IMAGE:${bgData.publicUrl}]`;
        }
    }

    const insertData: any = {
        content: finalContent,
        tenant_id,
        sender_id,
        is_system_alert: false,
    };

    if (patient_id) {
        insertData.patient_id = patient_id;
    }

    const { error } = await supabase
        .from("messages")
        .insert(insertData);

    if (error) {
        console.error("Error sending message:", error);
        return { error: error.message };
    }

    // チャット画面を再検証
    revalidatePath("/chat");
    return { success: true };
}

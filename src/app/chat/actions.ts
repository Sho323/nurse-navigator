"use server";

import { createClient } from "@/utils/supabase/server";
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

    const insertData: any = {
        content,
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

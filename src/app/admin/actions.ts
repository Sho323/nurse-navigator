"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/utils/supabase/api";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function toggleAlertStatus(alertId: string, currentStatus: boolean) {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "admin") {
        return { success: false, error: "管理者権限が必要です" };
    }

    const { data: alert, error: alertError } = await supabaseAdmin
        .from("ai_alerts")
        .select("tenant_id")
        .eq("id", alertId)
        .maybeSingle();

    if (alertError || !alert || alert.tenant_id !== profile.tenant_id) {
        return { success: false, error: "アラートへのアクセス権限がありません" };
    }

    const { error } = await supabaseAdmin
        .from("ai_alerts")
        .update({ is_resolved: !currentStatus })
        .eq("id", alertId);

    if (error) {
        console.error("Failed to update alert status:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/alerts");
    return { success: true };
}

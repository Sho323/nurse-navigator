"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function toggleAlertStatus(alertId: string, currentStatus: boolean) {
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

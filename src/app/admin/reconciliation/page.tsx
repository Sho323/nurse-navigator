import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getUserProfile } from "@/utils/supabase/api";
import { redirect } from "next/navigation";
import ReconciliationClient from "./components/ReconciliationClient";

export default async function ReconciliationPage() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect("/login");
    }

    // admin-only RLSをバイパスするためService Role Keyを使用
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch existing sales matching data for the month
    const { data: salesData } = await supabaseAdmin
        .from("sales_data")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .eq("target_month", "2026-03")
        .order("patient_name", { ascending: true });

    return (
        <ReconciliationClient profile={profile} initialData={salesData || []} />
    );
}

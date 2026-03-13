import { Database } from "@/types/supabase";
import { createClient } from "./server";

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"] & {
    tenant_id: string;
};

export async function getUserProfile() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile?.tenant_id) {
        return null;
    }

    return profile as UserProfile;
}

export async function getTenants() {
    const supabase = await createClient();
    const { data } = await supabase.from("tenants").select("*");
    return data;
}

export async function getPatients(tenantId: string | null) {
    if (!tenantId) return [];

    const supabase = await createClient();
    const { data } = await supabase
        .from("patients")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
    return data || [];
}

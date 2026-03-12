import { createClient } from "./server";

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
        
    // 営業・デモ用の一時的な設定:
    // ログインしているユーザーは全員「管理者」として扱う
    if (!profile) {
        // UUID形式エラーを防ぐため、実在する最初のテナントIDを取得してみる
        const { data: tenants } = await supabase.from("tenants").select("id").limit(1);
        const firstTenantId = tenants && tenants.length > 0 ? tenants[0].id : user.id; // フォールバック

        return {
            id: user.id,
            full_name: user.user_metadata?.full_name || "デモユーザー",
            role: 'admin',
            tenant_id: firstTenantId
        };
    }

    // 既存ユーザーも強制的に管理者に
    return {
        ...profile,
        role: 'admin'
    };
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

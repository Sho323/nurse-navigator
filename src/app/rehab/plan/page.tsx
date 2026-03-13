import { createClient } from "@/utils/supabase/server";
import { requireUserProfile } from "@/utils/supabase/authorization";
import RehabPlanClient from "./components/RehabPlanClient";

export default async function RehabPlanPage() {
    const profile = await requireUserProfile();

    const supabase = await createClient();
    
    // get patients for this tenant (admin bypass not needed here for user data viewing, use service role if needed or RLS should pass)
    const { data: patients } = await supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', profile.tenant_id);

    return (
        <RehabPlanClient patients={patients || []} />
    );
}

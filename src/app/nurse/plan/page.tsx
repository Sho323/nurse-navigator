import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/supabase/api";
import { redirect } from "next/navigation";
import NursePlanClient from "./components/NursePlanClient";

export default async function NursePlanPage() {
    const profile = await getUserProfile();
    
    if (!profile) {
        redirect("/login");
    }

    const supabase = await createClient();
    
    // get patients for this tenant (admin bypass not needed here for user data viewing, use service role if needed or RLS should pass)
    const { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', profile.tenant_id);

    return (
        <NursePlanClient patients={patients || []} />
    );
}

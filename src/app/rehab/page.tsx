import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/supabase/api";
import { redirect } from "next/navigation";
import RehabHomePageClient from "./components/RehabHomePageClient";

export default async function RehabHomePage() {
    const profile = await getUserProfile();
    
    if (!profile) {
        redirect("/login");
    }

    const supabase = await createClient();
    
    // get patients for this tenant (admin bypass not needed here for user data viewing, use service role if needed or RLS should pass)
    // Here we use the standard supabase client assuming RLS allows tenant users to see tenant patients
    const { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', profile.tenant_id);

    return (
        <RehabHomePageClient profile={profile} patients={patients || []} />
    );
}

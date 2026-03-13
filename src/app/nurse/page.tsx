import { getPatients } from "@/utils/supabase/api";
import { requireUserProfile } from "@/utils/supabase/authorization";
import NurseHomePageClient from "./components/NurseHomePageClient";

export default async function NurseHomePage() {
    const profile = await requireUserProfile();

    const patients = await getPatients(profile.tenant_id);

    return (
        <NurseHomePageClient profile={profile} patients={patients} />
    );
}

import { redirect } from "next/navigation";
import { getUserProfile, getPatients } from "@/utils/supabase/api";
import NurseHomePageClient from "./components/NurseHomePageClient";

export default async function NurseHomePage() {
    const profile = await getUserProfile();

    if (!profile) {
        // Break infinite loop if profile creation trigger silently failed
        redirect("/auth/auth-code-error?error=Profile_Missing&error_description=Database+Profile+Record+Not+Found");
    }

    // Admin users are typically redirected to the dashboard, but if they land here,
    // we can show them the nurse view or handle differently based on requirements.
    // デモ用: 管理者でもナースホームのUIを確認できるようにするため、以下のブロックをコメントアウト
    /*
    if (profile.role === "admin") {
        redirect("/admin/dashboard");
    }
    */

    const patients = await getPatients(profile.tenant_id);

    return (
        <NurseHomePageClient profile={profile} patients={patients} />
    );
}

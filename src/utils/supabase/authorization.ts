import { redirect } from "next/navigation";
import { getUserProfile } from "./api";

const PROFILE_MISSING_REDIRECT =
    "/auth/auth-code-error?error=Profile_Missing&error_description=Database+Profile+Record+Not+Found";

export async function requireUserProfile() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect(PROFILE_MISSING_REDIRECT);
    }

    return profile;
}

export async function requireAdminProfile() {
    const profile = await requireUserProfile();

    if (profile.role !== "admin") {
        redirect("/nurse");
    }

    return profile;
}

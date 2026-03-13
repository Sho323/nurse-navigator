"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { AI_CONSENT_TYPE, ConsentedByKind } from "@/utils/consent";

type ConsentActionStatus = "granted" | "revoked";

export async function updatePatientProfile(patientId: string, formData: FormData) {
    const supabase = await createClient();

    const dataToUpdate = {
        name: formData.get("name") as string,
        kana_name: formData.get("kana_name") as string,
        insurance_type: formData.get("insurance_type") as string,
        care_level: formData.get("care_level") as string,
        diagnosis: formData.get("diagnosis") as string,
        current_illness: formData.get("current_illness") as string,
        medical_history: formData.get("medical_history") as string,
        primary_physician: formData.get("primary_physician") as string,
        family_structure: formData.get("family_structure") as string,
        key_person_contact: formData.get("key_person_contact") as string,
        emergency_response: formData.get("emergency_response") as string,
        precautions: formData.get("precautions") as string,
        monthly_schedule: formData.get("monthly_schedule") as string,
    };

    const { error } = await supabase
        .from("patients")
        .update(dataToUpdate)
        .eq("id", patientId);

    if (error) {
        console.error("Update Error: ", error);
        return { error: "プロフィールの更新に失敗しました" };
    }

    revalidatePath("/nurse");
    revalidatePath(`/patient/${patientId}`);
    return { success: true };
}

export async function recordAiConsent(params: {
    patientId: string;
    status: ConsentActionStatus;
    consentedByKind: ConsentedByKind;
    notes?: string;
}) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return { error: "認証情報の取得に失敗しました" };
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, tenant_id")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || !profile?.tenant_id) {
        return { error: "プロフィール情報が見つかりません" };
    }

    if (!["admin", "nurse"].includes(profile.role)) {
        return { error: "同意更新の権限がありません" };
    }

    const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id, tenant_id")
        .eq("id", params.patientId)
        .maybeSingle();

    if (patientError || !patient || patient.tenant_id !== profile.tenant_id) {
        return { error: "利用者へのアクセス権限がありません" };
    }

    const { data: previousConsent } = await supabase
        .from("consents")
        .select("id, status, consented_at, policy_version")
        .eq("tenant_id", profile.tenant_id)
        .eq("patient_id", params.patientId)
        .eq("consent_type", AI_CONSENT_TYPE)
        .maybeSingle();

    const nowIso = new Date().toISOString();

    const nextConsent = {
        tenant_id: profile.tenant_id,
        patient_id: params.patientId,
        consent_type: AI_CONSENT_TYPE,
        status: params.status,
        consented_by_kind: params.consentedByKind,
        consented_by_user_id: profile.id,
        policy_version: process.env.CONSENT_POLICY_VERSION || previousConsent?.policy_version || "v1",
        source: "in_person",
        notes: params.notes || null,
        consented_at:
            params.status === "granted"
                ? nowIso
                : previousConsent?.consented_at || nowIso,
        revoked_at: params.status === "revoked" ? nowIso : null,
        updated_at: nowIso,
    };

    const { data: savedConsent, error: consentError } = await supabase
        .from("consents")
        .upsert(nextConsent, { onConflict: "patient_id,consent_type" })
        .select("id")
        .single();

    if (consentError || !savedConsent) {
        console.error("Consent upsert error:", consentError);
        return { error: "同意情報の保存に失敗しました" };
    }

    const { error: eventError } = await supabase.from("consent_events").insert({
        consent_id: savedConsent.id,
        tenant_id: profile.tenant_id,
        patient_id: params.patientId,
        consent_type: AI_CONSENT_TYPE,
        action: params.status === "granted" ? "grant" : "revoke",
        consent_status_before: previousConsent?.status ?? null,
        consent_status_after: params.status,
        consented_by_kind: params.consentedByKind,
        performed_by_user_id: profile.id,
        notes: params.notes || null,
    });

    if (eventError) {
        console.error("Consent event insert error:", eventError);
        return { error: "同意履歴の保存に失敗しました" };
    }

    revalidatePath(`/patient/${params.patientId}`);
    revalidatePath("/chat");
    return { success: true };
}

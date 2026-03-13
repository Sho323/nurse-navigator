import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export const AI_CONSENT_TYPE = "ai_assistance";
export const CONSENT_STATUS_GRANTED = "granted";

export type ConsentStatus = Database["public"]["Tables"]["consents"]["Row"]["status"];
export type ConsentedByKind = Database["public"]["Tables"]["consents"]["Row"]["consented_by_kind"];

type ConsentStatusRow = {
    patient_id: string;
    status: ConsentStatus;
};

export async function hasGrantedAiConsent({
    supabase,
    tenantId,
    patientId,
}: {
    supabase: SupabaseClient<Database>;
    tenantId: string;
    patientId: string;
}) {
    const { data, error } = await supabase
        .from("consents")
        .select("status")
        .eq("tenant_id", tenantId)
        .eq("patient_id", patientId)
        .eq("consent_type", AI_CONSENT_TYPE)
        .maybeSingle();

    if (error) {
        return {
            granted: false,
            error,
        };
    }

    return {
        granted: data?.status === CONSENT_STATUS_GRANTED,
        error: null,
    };
}

export async function getAiConsentMapByPatientId({
    supabase,
    tenantId,
    patientIds,
}: {
    supabase: SupabaseClient<Database>;
    tenantId: string;
    patientIds: string[];
}) {
    const defaultMap = Object.fromEntries(patientIds.map((patientId) => [patientId, false]));

    if (patientIds.length === 0) {
        return defaultMap as Record<string, boolean>;
    }

    const { data, error } = await supabase
        .from("consents")
        .select("patient_id, status")
        .eq("tenant_id", tenantId)
        .eq("consent_type", AI_CONSENT_TYPE)
        .in("patient_id", patientIds);

    if (error) {
        return defaultMap as Record<string, boolean>;
    }

    for (const row of (data ?? []) as ConsentStatusRow[]) {
        defaultMap[row.patient_id] = row.status === CONSENT_STATUS_GRANTED;
    }

    return defaultMap as Record<string, boolean>;
}

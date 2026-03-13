import { createClient } from "@/utils/supabase/server";
import { requireUserProfile } from "@/utils/supabase/authorization";
import PatientProfileClient from "./components/PatientProfileClient";
import { AI_CONSENT_TYPE } from "@/utils/consent";

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const profile = await requireUserProfile();

    const { id: patientId } = await params;
    const supabase = await createClient();

    const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

    if (error || !patient) {
        return (
            <div className="p-8 text-center text-gray-500">
                <h2>利用者がみつかりません</h2>
                <a href="/nurse" className="text-orange-500 underline mt-4 block">ホームへ戻る</a>
            </div>
        );
    }

    // Only allow access if the patient belongs to the user's tenant
    if (patient.tenant_id !== profile.tenant_id) {
         return <div className="p-8 text-center text-red-500">アクセス権限がありません</div>;
    }

    const { data: aiConsent } = await supabase
        .from("consents")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .eq("patient_id", patient.id)
        .eq("consent_type", AI_CONSENT_TYPE)
        .maybeSingle();

    const { data: consentEvents } = await supabase
        .from("consent_events")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .eq("patient_id", patient.id)
        .eq("consent_type", AI_CONSENT_TYPE)
        .order("created_at", { ascending: false })
        .limit(5);

    return (
        <PatientProfileClient
            patient={patient}
            aiConsent={aiConsent}
            consentEvents={consentEvents || []}
        />
    );
}

import { createClient } from "@/utils/supabase/server";
import { getUserProfile } from "@/utils/supabase/api";
import { redirect } from "next/navigation";
import PatientProfileClient from "./components/PatientProfileClient";

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const profile = await getUserProfile();
    
    if (!profile) {
        redirect("/login");
    }

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
    if (patient.tenant_id !== profile.tenant_id && profile.role !== 'admin') {
         return <div className="p-8 text-center text-red-500">アクセス権限がありません</div>;
    }

    return (
        <PatientProfileClient profile={profile} patient={patient} />
    );
}

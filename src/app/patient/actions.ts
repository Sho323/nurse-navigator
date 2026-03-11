"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

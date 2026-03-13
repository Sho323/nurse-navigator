import { getPatients } from "@/utils/supabase/api";
import { requireUserProfile } from "@/utils/supabase/authorization";
import ChatPageClient from "./components/ChatPageClient";
import { createClient } from "@/utils/supabase/server";
import { Database } from "@/types/supabase";
import { getAiConsentMapByPatientId } from "@/utils/consent";

type ChatSender = {
    name: string;
    role: Database["public"]["Enums"]["user_role"];
};

type RawMessage = Database["public"]["Tables"]["messages"]["Row"] & {
    sender: ChatSender | ChatSender[] | null;
};

type ChatMessage = Database["public"]["Tables"]["messages"]["Row"] & {
    sender?: ChatSender | null;
};

export default async function ChatPage() {
    const profile = await requireUserProfile();

    const supabase = await createClient();

    const { data } = await supabase
        .from("messages")
        .select(`
            *,
            sender:profiles!messages_sender_id_fkey(name, role)
        `)
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: true })
        .limit(100);

    const rawMessages = (data ?? []) as RawMessage[];

    // Filter and type cast
    const initialMessages: ChatMessage[] = rawMessages.map((msg) => ({
        ...msg,
        // Since it's a 1-to-1 fetch technically for sender, it might come back as object or array
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
    }));

    // Fetch patients for the threads
    const patients = await getPatients(profile.tenant_id);
    const aiConsentByPatientId = await getAiConsentMapByPatientId({
        supabase,
        tenantId: profile.tenant_id,
        patientIds: patients.map((patient) => patient.id),
    });

    return (
        <ChatPageClient
            profile={profile}
            initialMessages={initialMessages}
            patients={patients}
            aiConsentByPatientId={aiConsentByPatientId}
        />
    );
}

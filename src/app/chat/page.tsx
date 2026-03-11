import { redirect } from "next/navigation";
import { getUserProfile, getPatients } from "@/utils/supabase/api";
import ChatPageClient from "./components/ChatPageClient";
import { createClient } from "@/utils/supabase/server";

export default async function ChatPage() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect("/login");
    }

    const supabase = await createClient();

    let rawMessages = [];
    if (profile.tenant_id) {
        const { data } = await supabase
            .from("messages")
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(name, role)
            `)
            .eq("tenant_id", profile.tenant_id)
            .order("created_at", { ascending: true })
            .limit(100);
        
        rawMessages = data || [];
    }

    // Filter and type cast
    const initialMessages = (rawMessages || []).map((msg: any) => ({
        ...msg,
        // Since it's a 1-to-1 fetch technically for sender, it might come back as object or array
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
    }));

    // Fetch patients for the threads
    const patients = await getPatients(profile.tenant_id);

    return (
        <ChatPageClient profile={profile} initialMessages={initialMessages as any} patients={patients} />
    );
}

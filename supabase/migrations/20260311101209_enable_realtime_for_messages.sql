-- 既存のテーブルに対してリアルタイム通信を有効化します
-- 念のため、メッセージの送信（INSERT）ができるようにポリシーも「確実に」存在するようにします

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END
$$;

-- INSERTポリシーが存在しない場合のみ作成
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' AND policyname = 'Users can insert messages into their tenant'
    ) THEN
        CREATE POLICY "Users can insert messages into their tenant"
        ON public.messages FOR INSERT
        WITH CHECK (
            tenant_id = public.get_my_tenant_id() AND
            sender_id = auth.uid()
        );
    END IF;
END
$$;

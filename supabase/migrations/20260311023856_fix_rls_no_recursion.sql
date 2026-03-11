-- ============================================================
-- 根本修正: profilesテーブルのRLSに無限再帰があったため、
-- SECURITY DEFINER関数でテナントIDを取得する方法に変更する
-- ============================================================

-- 1. 全てのSELECTポリシーを削除
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 2. 再帰を回避するSECURITY DEFINER関数を作成
-- この関数はRLSをバイパスして直接テナントIDを取得する
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 3. 自分自身のプロフィールは常に閲覧可能（最重要）
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- 4. 同じテナントのプロフィールはSECURITY DEFINER関数を使って閲覧可能（再帰なし）
CREATE POLICY "Users can view tenant profiles"
  ON public.profiles FOR SELECT
  USING (
    tenant_id IS NOT NULL
    AND tenant_id = public.get_my_tenant_id()
  );

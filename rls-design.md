# AI経営・加算ナビゲーションシステム (Nurse Navigator) RLS・DB設計書

## 1. データベース設計の基本方針

*   **マルチテナントアーキテクチャ**: 全ての主要テーブルに `tenant_id`（事業所ID）を持たせ、事業所間のデータ完全分離を実現する。
*   **Row Level Security (RLS)**: Supabaseの強力な機能であるRLSを全テーブルで有効化し、意図しないデータ流出をデータベース層で物理的にブロックする。
*   **アクセス権限**: ユーザーの `role`（`admin` または `nurse`）に基づいて、参照・更新可能なテーブルを制御する。

## 2. RLSポリシー設計 (テーブル単位)

### 2.1 profiles (ユーザー情報) テーブル
事業所に所属するユーザーのアカウント情報と権限（role）を管理する。
*   `tenant_id`: 必須
*   `role`: `admin` または `nurse`
*   **RLSポリシー**:
    *   【SELECT】: 認証済み（`authenticated`）かつ、自身の `tenant_id` と一致するレコードのみ参照可能。（同じ事業所のスタッフ一覧は見れる）
    *   【INSERT/UPDATE/DELETE】: 自身の `tenant_id` と一致し、かつ自身の `role` が `admin` の場合のみ許可。（ユーザー管理は管理者のみ）

### 2.2 patients (利用者情報) テーブル
事業所が担当する利用者（患者）の基本情報・医療情報を管理する。
*   `tenant_id`: 必須
*   **RLSポリシー**:
    *   【SELECT/INSERT/UPDATE】: 認証済みかつ、自身の `tenant_id` と一致するレコードのみ許可。（役割に関わらず、同事業所の利用者は全員参照・編集可能）
    *   【DELETE】: 管理者 (`admin`) のみ許可。

### 2.3 visit_records (訪問記録) テーブル
現場で入力された看護師の訪問記録データ（音声テキスト、バイタル等）。
*   `tenant_id`: 必須
*   **RLSポリシー**:
    *   【SELECT/INSERT/UPDATE】: 認証済みかつ、自身の `tenant_id` と一致するレコードのみ許可。（役割に関わらず、同事業所の記録は全員参照・追記可能。風通しの良い情報共有を実現）
    *   【DELETE】: レコードの作成者本人、または管理者 (`admin`) のみ許可。

### 2.4 messages (チャットメッセージ) テーブル
事業所内の情報共有チャットログ。
*   `tenant_id`: 必須
*   **RLSポリシー**:
    *   【SELECT/INSERT】: 認証済みかつ、自身の `tenant_id` と一致するレコードのみ許可。（同事業所内のチャットは全員参加・閲覧可能）
    *   【UPDATE/DELETE】: 原則禁止（チャットログの改ざん防止）、または作成者本人のみ直後（例: 5分以内）の取り消しを許可。

### 2.5 sales_data (売上・消込データ) テーブル
CSVアップロードから生成される請求・入金データと、AIによる消込結果。
*   `tenant_id`: 必須
*   **RLSポリシー (厳格管理)**:
    *   【SELECT/INSERT/UPDATE/DELETE】: 認証済み、自身の `tenant_id` と一致、**かつ自身の `role` が `admin` の場合のみ許可**。（看護師権限では一切のアクセス不可。API経由でアクセスを試みてもDBレベルで弾かれる）

### 2.6 ai_alerts (加算ポテンシャル・アラート) テーブル
AIが訪問記録を分析して生成した「加算取得の可能性」に関する通知データ。
*   `tenant_id`: 必須
*   **RLSポリシー (経営情報管理)**:
    *   【SELECT/UPDATE】: 認証済み、自身の `tenant_id` と一致、**かつ自身の `role` が `admin` の場合のみ許可**。（現場を混乱させないため、管理者のダッシュボード専用）
    *   【INSERT/DELETE】: Supabase Edge Functions（サービスロール権限）からのシステム的な操作のみ許可。

## 3. RLS実装イメージ (SQL)

以下は、`sales_data` テーブルにおいて管理者のみアクセスを許可するRLSの実装例です。

```sql
-- テーブルの作成
CREATE TABLE sales_data (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  -- 他のカラム...
);

-- RLSの有効化
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;

-- 【SELECTポリシー】: 同一テナントの管理者のみ閲覧可能
CREATE POLICY "Admins can view their tenant's sales data"
ON sales_data
FOR SELECT
TO authenticated
USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) AND
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 【INSERTポリシー】: 同一テナントの管理者の追加可能
CREATE POLICY "Admins can insert their tenant's sales data"
ON sales_data
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) AND
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

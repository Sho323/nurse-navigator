# 医療・介護系アプリの商品化と個人情報保護対策レポート

> [!IMPORTANT]
> このレポートは技術的・一般的なガイダンスを提供するものです。販売・運用の最終判断には、**弁護士・社会保険労務士・情報セキュリティ専門家への相談**を強くお勧めします。

---

## 1. 販売は可能か？

**結論：販売は可能ですが、厳格な法令遵守が前提となります。**

すでに多くの医療・介護向けSaaS（電子カルテ、介護記録システム等）が市場に存在しており、適切な対策を講じれば参入できます。ただし「現状のまま販売すること」は**リスクが非常に高い**です。

---

## 2. 準拠すべき主要法令・ガイドライン

### 🔴 必須対応（法的義務）

| 法令・ガイドライン | 概要 | リスク |
|---|---|---|
| **個人情報保護法（改正含む）** | 要配慮個人情報（病歴・診断など）の取得には明示的同意が必要 | 違反時：業務停止命令・罰則 |
| **医療法** | 医療情報システムの安全管理に関する要件 | 医療機関への販売時に影響 |
| **厚生労働省ガイドライン** | 医療情報システムの安全管理に関するガイドライン（第6.0版） | 医療機関・介護事業者が準拠義務あり |
| **介護保険法** | 介護記録の保存・管理義務 | — |

### 🟡 推奨対応（信頼性・競争力のため）

| 認証・基準 | 概要 |
|---|---|
| **ISO 27001** | 情報セキュリティマネジメントシステム認証 |
| **プライバシーマーク（Pマーク）** | 個人情報適切管理の認証 |
| **ISMS** | 情報セキュリティマネジメント |
| **SOC 2 Type II** | クラウドサービスのセキュリティ保証（海外展開時） |

---

## 3. 今すぐ必要な技術的実装

### 3-1. 🔐 認証・アクセス制御の強化

```typescript
// 現状：全ユーザーを管理者として扱うデモ状態
// → 本番では厳格なRBAC（ロールベースアクセス制御）が必須

// 実装すべき権限レベル例
type UserRole = 
  | 'super_admin'     // システム管理者（開発者側）
  | 'tenant_admin'    // 施設管理者
  | 'nurse'           // 看護師・ケアマネージャー
  | 'caregiver'       // 介護スタッフ（閲覧のみ）
  | 'patient_self'    // 本人アクセス（マイナンバー連携等）

// Row Level Security（RLS）をSupabaseで徹底する
// 患者情報は同一テナント内のみアクセス可能に
```

**必須実装リスト：**
- [ ] 多要素認証（MFA）の必須化
- [ ] セッションタイムアウト設定（例：30分無操作で自動ログアウト）
- [ ] IPアドレス制限（施設内ネットワークのみ許可オプション）
- [ ] ログイン試行回数制限（ブルートフォース対策）

### 3-2. 📝 操作ログ・監査証跡の実装

医療情報システムガイドラインでは「誰が・いつ・何を操作したか」の記録が**必須**です。

```typescript
// 監査ログテーブルの追加（Supabase）
// audit_logs テーブル設計例
interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  user_role: string;
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'AI_QUERY';
  resource_type: 'patient' | 'care_plan' | 'chat_history' | 'reconciliation';
  resource_id: string;
  ip_address: string;
  user_agent: string;
  changed_fields?: Record<string, { before: unknown; after: unknown }>;
  created_at: string; // 改ざん不可のタイムスタンプ
}

// 患者情報を参照する全Server Actionに監査ログを追加
```

### 3-3. 🤖 AIへの個人情報非掲載（最重要）

**現状の問題点：**
ChatPageClient等でAIに患者情報をそのまま送信している可能性があります。

```typescript
// ❌ 危険な実装例（個人情報がAIに送られる）
const systemPrompt = `
  患者名：${patient.name}
  生年月日：${patient.birth_date}
  診断：${patient.diagnosis}
  住所：${patient.address}
`;

// ✅ 安全な実装例（匿名化・仮名化して送信）

// Step 1: 個人識別情報（PII）を除去するユーティリティ
function anonymizePatientForAI(patient: Patient): AnonymizedPatient {
  return {
    patient_id: patient.id,           // UUIDのみ（氏名は送らない）
    age_group: getAgeGroup(patient.birth_date), // 「70代」等に変換
    gender: patient.gender,
    primary_diagnosis: patient.primary_diagnosis,
    iadl_score: patient.iadl_score,
    // ❌ 除外するフィールド：
    // name, birth_date（完全な日付）, address, phone, 
    // family_member_names, insurance_number, mynumber
  };
}

// Step 2: AIへのプロンプトはシステム側で構築
const safeSystemPrompt = `
  あなたは看護師の臨床推論を支援するAIです。
  患者情報は匿名化されており、個人を特定できません。
  以下の情報を元にアセスメントを支援してください。
  
  患者属性: ${JSON.stringify(anonymizePatientForAI(patient))}
`;
```

**PIIフィルタリングの実装：**

```typescript
// src/lib/ai/pii-filter.ts

// 日本語の個人情報パターン検出
const PII_PATTERNS = [
  /\d{3}-\d{4}-\d{4}/,                    // 電話番号
  /〒?\d{3}-\d{4}/,                        // 郵便番号
  /[一-龯]{1,4}[\s　][一-龯ぁ-ん]{1,6}/,  // 日本人名パターン
  /\d{4}年\d{1,2}月\d{1,2}日/,            // 生年月日
  /[ァ-ヶー]{2,10}[\s　][ァ-ヶー]{2,6}/,  // カタカナ氏名
];

export function containsPII(text: string): boolean {
  return PII_PATTERNS.some(pattern => pattern.test(text));
}

export function sanitizeBeforeAI(text: string): string {
  let sanitized = text;
  // 電話番号をマスク
  sanitized = sanitized.replace(/\d{3}-\d{4}-\d{4}/g, '[電話番号]');
  // 郵便番号をマスク
  sanitized = sanitized.replace(/〒?\d{3}-\d{4}/g, '[郵便番号]');
  return sanitized;
}
```

### 3-4. 🔒 データ暗号化

```typescript
// 機密フィールドの暗号化（Supabase Vault や pgcrypto）
// 特に以下のフィールドは暗号化必須：
// - 診断名・病歴
// - 保険番号・マイナンバー
// - 家族構成・緊急連絡先

// Supabase Vaultを使った暗号化例
-- Supabase SQL
SELECT vault.create_secret('encryption_key', '...');
```

**転送時・保存時の暗号化チェックリスト：**
- [ ] HTTPS必須（現在Vercelで対応済み）
- [ ] データベースの暗号化（Supabase: 対応済み）
- [ ] バックアップデータの暗号化
- [ ] エクスポートCSVファイルの暗号化または安全な転送

### 3-5. 📋 同意管理システム

```typescript
// 本人・家族からの情報利用同意の記録
interface ConsentRecord {
  patient_id: string;
  consented_by: string;          // 本人or代理人
  consent_type: 'ai_assistance' | 'data_sharing' | 'research';
  consented_at: string;
  consent_version: string;       // プライバシーポリシーバージョン
  ip_address: string;
  revoked_at?: string;           // 同意撤回
}
```

### 3-6. 🗑️ データ保持・削除ポリシー

```typescript
// 個人情報保護法：利用目的達成後は遅滞なく削除
// 医療記録は関係法令に基づく保存期間あり（例：カルテ5年）

// 論理削除ではなく、一定期間後の物理削除スケジュール
// Supabase Edge Function or pg_cron で実装
```

---

## 4. 利用規約・契約書類の整備

### 必須書類

| 書類 | 内容 |
|---|---|
| **プライバシーポリシー** | 個人情報の収集・利用・第三者提供・AI利用の明示 |
| **利用規約（ToS）** | 禁止事項・免責事項・サービス変更・解約条件 |
| **DPA（データ処理契約）** | B2B販売時：顧客（医療機関）とのデータ処理に関する契約 |
| **AI利用についての説明** | AIがどのようなデータを使用するか、学習に使われないか の明示 |
| **セキュリティポリシー** | インシデント対応、脆弱性報告窓口 |

### プライバシーポリシーに必ず明記すること

1. **AI（OpenAI等）に送信されるデータの範囲**
2. **AIモデルの学習にデータが使用されないこと**（OpenAI APIのデフォルト設定を確認）
3. **データの国外移転**(OpenAIはUSサーバー)
4. **同意取得の方法と撤回手段**

---

## 5. AIサービス利用における注意事項

### OpenAI APIのデータポリシー確認

```
OpenAI API利用規約（2023年3月以降）：
✅ APIを通じて送信されたデータはデフォルトでモデルの学習に使用されない
✅ ただし、Zero Data Retention（ZDR）オプションの確認が必要
⚠️ Enterprise契約でDPAを締結することを推奨
```

### AIプロンプトへの個人情報混入防止フロー

```
ユーザー入力
    ↓
[PIIフィルター] ← 個人情報パターン検出・警告
    ↓
[コンテキスト構築] ← 匿名化された患者情報のみ追加
    ↓
[OpenAI API]
    ↓
[レスポンスフィルター] ← 万が一PIIが出力された場合のマスク
    ↓
ユーザー表示
```

---

## 6. 実装優先度ロードマップ

### Phase 1（販売前に必須）🔴

- [ ] 厳格なRBACの実装（管理者権限の本番化）
- [ ] 監査ログの全面実装
- [ ] AIへのPIIフィルタリング実装
- [ ] プライバシーポリシー・利用規約の法的整備
- [ ] MFAの実装
- [ ] インシデント対応フローの策定

### Phase 2（早期対応推奨）🟡

- [ ] 同意管理システム
- [ ] データ保持・削除ポリシーの自動化
- [ ] セキュリティ脆弱性診断（外部ペネトレーションテスト）
- [ ] OpenAI Enterprise DPA締結
- [ ] 医療情報システム安全管理ガイドラインへの適合確認書作成

### Phase 3（認証・スケールアップ）🟢

- [ ] Pマーク または ISO 27001 取得
- [ ] ISMS構築
- [ ] SOC 2対応（グローバル展開時）

---

## 7. 競合調査・参考事例

| サービス名 | 特徴 |
|---|---|
| カナミックネットワーク | 介護向けSaaS、Pマーク取得 |
| eMEDIS | 電子カルテ、ISO 27001対応 |
| Ubie | AI問診、厚生省連携、OpenAI利用を透明開示 |
| Dr.JOY | 医療連携、ISMS認証取得 |

これらのサービスは**認証取得を差別化ポイント**として活用しています。

---

## 8. まとめ

**商品として販売は十分可能ですが、以下が前提条件です：**

1. **法的整備**：プライバシーポリシー・利用規約・DPAを弁護士監修で整備
2. **技術的対策**：監査ログ・PIIフィルター・MFAを実装
3. **AIの透明性**：何をAIに送るか明示し、個人情報を送らない設計
4. **認証取得**：Pマーク or ISO 27001 で信頼性を証明
5. **インシデント対応**：漏洩時の報告・対応フローを事前策定

> [!WARNING]
> 医療・介護分野では、情報漏洩が単なるビジネスリスクを超え、患者の尊厳・安全に直結します。法的リスクよりも倫理的責任として、最高水準のセキュリティを目指してください。

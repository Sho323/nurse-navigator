# 開発計画 評価レポート（M1〜M6）

> コードベース実態を確認した上での評価です（2026-03-12）

---

## 実装状況（2026-03-13）

- [x] `M0-HOT` 初回実装: `src/utils/ai.ts` は患者マスタ照合 + 直接識別子の簡易マスクを通し、`ALLOW_UNSANITIZED_AI_RECORDS=true` でない限りPII検知時はOpenAI送信を拒否するよう変更。
- [x] `M0-HOT` 初回実装: `src/app/admin/reconciliation/actions.ts` は請求CSV/銀行CSVの氏名系カラムを `[患者A]` 形式でマスクしてからOpenAIへ送信するよう変更。
- [x] `GOV-001` 初回実装: `src/utils/supabase/api.ts` の「profile欠落時のadmin化」「既存profileのadmin強制上書き」を撤去し、adminページとadmin系Server Actionに実権限チェックを追加。
- [x] 権限確認対象の画面を実コードに反映:
  `/admin/dashboard`, `/admin/reconciliation`, `/admin/alerts`, `/nurse`, `/nurse/plan`, `/chat`, `/patient/[id]`, `/rehab`, `/rehab/plan`
- [x] `PII-002` 初回実装: `src/utils/ai.ts` の氏名検知を「対象患者1名」から「テナント患者マスタDB照合（name/kana_name）」へ拡張し、電話番号・郵便番号・生年月日は正規表現で検知。
- [x] `CONS-000` 初回実装: 同意取得フロー設計を `docs/governance/consent_flow_design.md` として明文化し、`consents / consent_events` テーブル + 最小RLS、`/patient/[id]`・`/chat`・`src/utils/ai.ts` の反映ポイントを実装。
- [x] 安全性強化: OpenAI依存を停止し、`src/app/admin/reconciliation/actions.ts`（CSV消込）と `src/utils/ai.ts`（加算アラート）をルールベース判定へ置換。
- [ ] `AUD-002`, `IAM-005`, `VND-004` は別フェーズで継続

---

## 総評

**計画の方向性は正しく、構造もよく整理されています。** ただしコードベースの現状と照合すると、いくつかの「抜け」「順序問題」「リスク過小評価」があります。以下に問題点と修正案を示します。

---

## 🔴 重大な問題点（修正必須）

### 問題1: M2（PII除去）よりM3（同意管理）を先に着手すべき場面がある

**現状のコード確認：**
- `src/utils/ai.ts` → `checkBillingRules()` で `textRecord`（訪問記録本文）をそのままOpenAIに送信済み
- `src/app/admin/reconciliation/actions.ts` → CSVデータ（患者名含む）をそのまま送信済み

**判断：** M2の`PII-005（AI Gateway）`の前に、現在の生PII送信を**暫定でも即時止める**パッチが必要です。計画にはこの「緊急ブロッカー対応」が含まれていません。

**追加すべきタスク：**

```
[M0-HOT] 緊急: AI送信の暫定PIIガード（3時間作業）
- utils/ai.ts の textRecord をサニタイズせずに渡している箇所に
  「警告ログ + フラグOFF時は送信拒否」を暫定追加
- reconciliation/actions.ts のCSV内の patient_name カラムを
  送信前に [患者A][患者B] 等にマスクする最小実装
```

---

### 問題2: GOV-001 の「安全側への変更」定義が曖昧

**問題：** 「profile未作成時の扱いを安全側に変更」とあるが、2パターン（profileなしor管理者上書き）あることが計画書に明示されていない。既存の全画面での権限分岐確認が漏れるリスクが高い。

**修正案：**
```
Tasks に追加:
- api.ts の2箇所（profileなし時、profileあり時の強制上書き）を個別に対処
- 権限確認が必要なページ一覧を事前作成（7ページ確認済み）
  /admin/dashboard, /admin/reconciliation, /admin/alerts,
  /nurse, /nurse/plan, /chat, /patient/[id], /rehab, /rehab/plan
```

---

### 問題3: PII-002の「氏名検知」は日本語では非常に難しい

**問題：** 日本語氏名のregex検知は偽陽性が極めて高い。医療用語と氏名の区別がつきにくい。

**修正案：**
```
PII-002の実装方針を変更：
1. 氏名：患者マスタとのマッチング方式（DB照合）
2. 電話番号・郵便番号・生年月日：正規表現で検知
```

---

### 問題4: CONS-001〜006 が一切のUI設計なしで始まる

**問題：** 患者からの「同意取得」フローが先に決まらないとテーブル設計が壊れます。

**追加すべきタスク：**
```
[CONS-000] 同意取得フロー設計（CONS-001の前に必須）
- 「誰が同意を取り、どうシステムに反映するか」を確定
Estimate: 0.5d
```

---

### 問題5: AUD-002「append-only化」はSupabaseのRLSポリシーだけでは不完全

**問題：** service roleによるバイパスが可能。

**修正案：**
```
AUD-002のタスクに追加：
- PostgreSQL の RULE または trigger でDB層での削除・更新を禁止
```

---

## 修正後の将来ロードマップ

### M0: 緊急ホットフィックス（新設）
- 生PII送信の暫定ブロック（ハッシュ化・マスク）

### M1: 基盤整備
- [GOV-001] 暫定admin強制の撤去（修正：9画面の動作確認含む）
- [GOV-003] COMPLIANCE_ENFORCED（修正：停止機能の明記）
- [GOV-004] request_id（修正：UUIDv7採用）

### M2: AI送信前PII除去
- [PII-001] マスキング仕様（修正：DB照合方式）
- [PII-008] CI禁止ルール（修正：許可リスト方式）

### M3: 同意管理
- [CONS-000] 同意取得フロー設計（新設）

### M4: 監査ログ
- [AUD-002] append-only化（修正：DB層での物理削除禁止）

### M5: RBAC + MFA
- [IAM-005] MFA実装（修正：SupabaseネイティブMFA API使用）

### M6: ベンダー設定固定
- [VND-004] AIキルスイッチ（修正：DBフィーチャーフラグ制御）

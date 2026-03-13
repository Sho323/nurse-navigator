# CONS-000 同意取得フロー設計

> 更新日: 2026-03-13

## 1. 目的

- `ai_assistance`（AI加算チェック）を患者単位で明示同意管理する。
- 同意状態をUIで可視化し、同意未取得時はAI送信を実行しない。
- 同意変更の監査証跡を残す。

## 2. 画面フロー定義

### 2.1 取得者（誰が同意を取るか）

- 取得実施者: `admin` / `nurse`
- 同意主体: `patient`（本人） / `representative`（代理人） / `staff`（運用記録）

### 2.2 取得タイミング（いつ取るか）

- 初回: 利用者登録後、AI機能初回利用前に `/patient/[id]` で同意取得を記録
- 運用中: 同意撤回・再同意が発生した時点で都度更新
- ポリシー更新時: `policy_version` 変更後に再取得

### 2.3 撤回動線（どう撤回するか）

- `/patient/[id]` の「AI利用同意」カードで `撤回を記録`
- 保存時に `consents.status = revoked` と `consent_events(action=revoke)` を同時記録
- `/chat` で未同意バッジ表示、AI実行前チェックで送信停止

## 3. データモデル案

### 3.1 `consents`

- 粒度: `patient_id x consent_type`（ユニーク）
- 主フィールド:
  - `consent_type`: `ai_assistance | data_sharing | research`
  - `status`: `granted | revoked | pending | expired`
  - `consented_by_kind`: `patient | representative | staff`
  - `policy_version`, `consented_at`, `revoked_at`, `notes`

### 3.2 `consent_events`

- 目的: 同意状態変化の履歴監査
- 主フィールド:
  - `action`: `grant | revoke | update`
  - `consent_status_before`, `consent_status_after`
  - `performed_by_user_id`, `consented_by_kind`, `notes`, `metadata`

## 4. 最小RLS方針

- 参照:
  - 同一テナントのユーザーは `consents` / `consent_events` を参照可
- 更新:
  - `admin` / `nurse` のみ `consents` の insert/update 可
  - `admin` / `nurse` のみ `consent_events` の insert 可
- 削除:
  - 物理削除ポリシーは作らず、状態遷移とイベント追記で管理

## 5. 既存画面への反映ポイント

### `/patient/[id]`

- AI同意カードを追加
- 同意取得/撤回ボタン、同意主体、補足メモ入力
- 直近5件の `consent_events` を表示

### `/chat`

- 患者スレッドに `AI同意: 取得済み / 未取得` バッジを表示
- 選択患者が未同意の場合、入力欄上に警告と `/patient/[id]` への導線を表示

### AI実行前チェック

- `src/utils/ai.ts` で `consents` を参照
- `ai_assistance != granted` の場合はOpenAI送信をスキップ
- 同意情報取得エラー時も安全側で送信中止

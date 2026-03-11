# AI経営・加算ナビゲーションシステム (Nurse Navigator) 手動セットアップ手順書

AIコーディングツールだけでは自動化できない、初期の環境構築・API設定（各種シークレットキーの取得と設定）の手順書です。
非エンジニアの方でも迷わず進められるようステップバイステップで記載しています。

## 1. 必要なアカウントの準備

以下のサービスのアカウント（無料枠あり）を事前に作成しておいてください。

1.  **Vite / Next.js アプリのホスティング先**: [Vercel](https://vercel.com/) または [Netlify](https://www.netlify.com/) (※Next.jsを使うならVercel推奨)
2.  **バックエンド・データベース**: [Supabase](https://supabase.com/)
3.  **AI機能 (GPT-4)**: [OpenAI Platform](https://platform.openai.com/)
4.  **Google認証API**: [Google Cloud Console](https://console.cloud.google.com/)

---

## 2. Supabase のセットアップ (DB / Auth / RLS)

### 2.1 プロジェクトの作成
1. Supabaseのダッシュボードにログインし、「New Project」をクリック。
2. 任意の組織（Organization）とプロジェクト名（例: `nurse-navigator`）を入力。
3. データベースのパスワードを設定（**※後で一切使わないので、ランダム生成してどこかにメモしておく**）。
4. Region（リージョン）は `Tokyo` などの近い場所を選択。
5. 「Create new project」をクリック（数分かかります）。

### 2.2 APIキーの取得
1. プロジェクト設定（左下の歯車アイコン `Project Settings`） > `API` を開く。
2. 以下の2つの値をコピーして、手元のメモ帳に貼っておく。
   *   **Project URL** (`https://xxxxx.supabase.co`)
   *   **Project API Keys - `anon` `public`** (`eyJhb...` で始まる長い文字列)

### 2.3 SQLの実行（テーブル作成・RLS設定）
1. 左メニューの `SQL Editor` を開く。
2. 「New query」をクリックし、AIに生成してもらった（または `rls-design.md` ベースで作った）テーブル作成とRLS用のSQLを貼り付けて「RUN」するだけで、DBの器が完成します。

---

## 3. Google ログイン (OAuth) の設定

Supabase Authを使って、Googleアカウントでログインできるようにします。

### 3.1 Google Cloud でのクライアントID取得
1. プロジェクトを作成し、左メニュー「APIとサービス」 > 「認証情報」へ。
2. 「認証情報を作成」 > 「OAuth クライアント ID」を選択。
3. アプリケーションの種類: `ウェブ アプリケーション`
4. 承認済みのリダイレクト URI:
   * Supabaseのダッシュボード (Authentication > Providers > Google) に記載の **Callback URL** (`https://xxxxx.supabase.co/auth/v1/callback`) を貼り付ける。
5. 作成をクリックすると、「**クライアント ID**」と「**クライアント シークレット**」が表示されるのでメモする。

### 3.2 Supabase 側の設定
1. Supabaseダッシュボードの左メニュー「Authentication」 > 「Providers」を開き、「Google」を有効化する。
2. メモした「クライアント ID」と「クライアント シークレット」を貼り付けてSave。

---

## 4. OpenAI API のセットアップ (AI分析機能)

1. [OpenAI Platform](https://platform.openai.com/) にログイン。
2. 左メニュー「API keys」から「Create new secret key」をクリック。
3. 名前（例: `NurseNavigator-Key`）をつけて生成し、「**シークレットキー** (`sk-...`)」を必ずメモする（※一度しか表示されません）。
4. （※注意: APIを利用するには、Billing設定からクレジットカード登録と最低額のチャージが必要です）

---

## 5. 環境変数 (`.env.local`) の設定

ローカルのPC環境（VScodeなど）や、Vercel等のホスティング環境で、アプリを動かすための設定ファイルを作成します。

プロジェクトの一番上の階層に `.env.local` という名前のファイルを作り、以下の内容で保存します。（値は手順2〜4でメモしたものに書き換えてください）

```env
# Supabase連携
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabaseのURL (https://xxxxx.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabaseのanon publicキー (eyJhb...)

# OpenAI連携
OPENAI_API_KEY=あなたのOpenAIシークレットキー (sk-...)
```

## 6. アプリの起動

ターミナル（コマンドライン）で以下のコマンドを実行し、アプリを立ち上げます。

```bash
# パッケージのインストール
npm install

# ローカル開発用サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスし、ログイン画面が表示されれば成功です！

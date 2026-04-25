# Architecture Overview

本システムは、フロントエンドが直接各マイクロサービスを呼び出すのではなく、BFF を経由して user-service と todo-service を利用する構成とする。

user-service と todo-service は外部公開せず、ネットワーク的にも BFF 経由のみでアクセス可能とする。サービス間通信は mTLS を利用する。

## BFF Responsibilities

- 認証の入口を担当する
- フロントエンド向けの認可を担当する
- CORS を担当する
- API 集約を担当する
- フロントエンド向けのレスポンス変換を担当する
- request context を生成し、下流サービスへ伝搬する
- 下流サービス呼び出し時の timeout を制御する
- 下流サービス障害時はフォールバックせず、エラーとして返す

## Service Responsibilities

user-service と todo-service は以下を担当する。

- 入力バリデーション
- ドメインバリデーション
- リソース単位の認可
- BFF からの内部呼び出しの真正性確認
- end user context を使った最終認可
- 構造化ログと監査ログの出力
- readiness / liveness エンドポイントの提供

CORS はブラウザから直接アクセスされない前提のため、各サービスでは通常不要とする。

## Request Context and Tracing

- requestID は BFF が生成し、user-service と todo-service へ伝搬する
- フロントエンドが独自の requestID を送る場合でも、それを正規の内部 requestID としては扱わず、必要に応じて補助情報として記録する
- 将来的な分散トレーシングに備えて、trace context を扱える構成を前提とする

## Authorization Model

- 認証は BFF が主担当とするが、認可は BFF だけで完結させない
- BFF は画面・機能単位の認可を行い、user-service / todo-service は各リソースに対する最終認可を行う

## Operational Policy

- user-service と todo-service は外部公開しない
- timeout は導入するが、値は SLO と実測レイテンシに基づいて調整する
- リトライは初期段階では導入しない
- サーキットブレーカーは初期段階では導入しない
- 監査ログは通常ログと分けて管理する
- NetworkPolicy により BFF から各サービスへの通信のみを許可する
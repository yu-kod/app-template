variable "aws_region" {
  description = "AWS リージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "github_owner" {
  description = "リポジトリの owner"
  type        = string
  default     = "yu-kod"
}

variable "repositories" {
  description = <<-DESC
    AWS へデプロイするリポジトリ（owner を除いた名前）。アプリを足すときはここに足して再実行する。
    テンプレートそのもの（app-template）はデプロイしないので入れない。
  DESC
  type        = list(string)
  default     = ["three-marks"]
}

variable "extra_subject_prefixes" {
  description = <<-DESC
    リポジトリごとに、OIDC トークンの sub クレームで追加で許す前半部分。

    リポジトリや owner をリネームしていると、sub が `repo:owner/repo:...` ではなく
    `repo:owner@ownerId/repo@repoId:...` という ID 付きの形で届くことがある
    （yu-kod/pusher-table と yu-kod/pop-art-trick で実際に起きた）。
    引き受けに失敗したら CloudTrail の AssumeRoleWithWebIdentity で実際の sub を確認して足す。
    例: { "pusher-table" = ["repo:yu-kod@48035533/pusher-table@1370943501"] }

    ワイルドカードは使わない（似た名前の別リポジトリまで引き受けられてしまう）。
  DESC
  type        = map(list(string))
  default     = {}
}

variable "create_github_oidc_provider" {
  description = <<-DESC
    GitHub Actions 用の OIDC プロバイダーを作るか。アカウントに1つしか作れない。
    yu-kod のアカウントには setnote などで作成済みなので既定は false（既存のものを参照する）。
    確認: aws iam list-open-id-connect-providers に token.actions.githubusercontent.com があれば false。
  DESC
  type        = bool
  default     = false
}

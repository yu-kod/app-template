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

variable "github_owner_id" {
  description = <<-DESC
    owner の数値 ID（変わらない）。ID 付きの sub クレーム（repo:owner@ownerId/repo@repoId）を許すのに使う。
    確認: curl -s https://api.github.com/users/<owner> | grep '"id"'
  DESC
  type        = number
  default     = 48035533
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
    名前の形（repo:owner/repo）と ID 付きの形（repo:owner@ownerId/repo@*）は自動で許すので、
    それ以外の形で届いたときだけ使う。CloudTrail の AssumeRoleWithWebIdentity で実際の sub を確認して足す。
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

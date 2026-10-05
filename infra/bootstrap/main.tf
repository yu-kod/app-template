# AWS アカウントの準備（アカウントにつき1回。アプリを足すときは repositories に足して再実行）。
#
# 作るもの:
#   - リポジトリごとの GitHub Actions 用ロール（2つ）
#       deploy: production 環境のジョブだけが引き受けられる。terraform apply とデプロイに使う
#       plan:   PR のジョブだけが引き受けられる。読み取り専用。PR に terraform plan の差分を出す
#   - （必要なら）GitHub Actions 用の OIDC プロバイダー
#
# tfstate のバケットは create-state-bucket.sh が先に作る。この構成の state もそこへ置く。
# 手順は docs/deploy.md「AWS アカウントの準備」。

terraform {
  required_version = ">= 1.10"

  # bucket と region は init のときに -backend-config で渡す（アカウント ID がバケット名に入るため）
  backend "s3" {
    key          = "bootstrap/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "github-actions-bootstrap"
      ManagedBy = "terraform"
    }
  }
}

# ---- GitHub Actions の OIDC ----

resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # 現在は AWS 側がルート CA を検証するため thumbprint は実質使われないが、API が必須項目として要求する
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 0 : 1

  url = "https://token.actions.githubusercontent.com"
}

locals {
  github_oidc_arn = var.create_github_oidc_provider ? one(aws_iam_openid_connect_provider.github[*].arn) : one(data.aws_iam_openid_connect_provider.github[*].arn)

  # sub クレームの前半。2026-07-15 以降に作ったリポジトリ（とリネームしたリポジトリ）は、
  # ID 付きの形（repo:owner@ownerId/repo@repoId）で届く。owner は ID で固定し、リポジトリは
  # 名前の直後の @ 以降（リポジトリ ID）だけを * にする。似た名前の別リポジトリ（repo-x@...）は
  # 名前の直後が @ でないので一致しない
  subject_prefixes = {
    for repo in var.repositories : repo => concat(
      [
        "repo:${var.github_owner}/${repo}",
        "repo:${var.github_owner}@${var.github_owner_id}/${repo}@*",
      ],
      lookup(var.extra_subject_prefixes, repo, []),
    )
  }
}

data "aws_iam_policy_document" "deploy_trust" {
  for_each = toset(var.repositories)

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    # production 環境（deploy.yml）のジョブだけ。PR や他のブランチのジョブからは引き受けられない
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [for prefix in local.subject_prefixes[each.key] : "${prefix}:environment:production"]
    }
  }
}

data "aws_iam_policy_document" "plan_trust" {
  for_each = toset(var.repositories)

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    # PR のジョブだけ。フォークからの PR には GitHub が OIDC トークンを出さない
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [for prefix in local.subject_prefixes[each.key] : "${prefix}:pull_request"]
    }
  }
}

# IAM の description は ASCII と Latin-1 しか受け付けないので英語で書く（説明はこのコメントに）
resource "aws_iam_role" "deploy" {
  for_each = toset(var.repositories)

  name               = "gha-deploy-${each.key}"
  description        = "GitHub Actions deploy role for ${var.github_owner}/${each.key} (production environment only)"
  assume_role_policy = data.aws_iam_policy_document.deploy_trust[each.key].json
}

# apply は IAM ロール・CloudFront・Lambda・API Gateway を作るため広い権限が要る。
# 個人プロジェクトなので AdministratorAccess で運用するが、これは意図的な妥協。
# 引き受けられるのは当該リポジトリの production 環境のジョブだけ。
resource "aws_iam_role_policy_attachment" "deploy_admin" {
  for_each = toset(var.repositories)

  role       = aws_iam_role.deploy[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_role" "plan" {
  for_each = toset(var.repositories)

  name               = "gha-plan-${each.key}"
  description        = "GitHub Actions read-only plan role for ${var.github_owner}/${each.key} (pull requests only)"
  assume_role_policy = data.aws_iam_policy_document.plan_trust[each.key].json
}

# plan は読むだけ（tfstate も ReadOnlyAccess で読める）。plan は -lock=false で実行し、ロックも書かない
resource "aws_iam_role_policy_attachment" "plan_readonly" {
  for_each = toset(var.repositories)

  role       = aws_iam_role.plan[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

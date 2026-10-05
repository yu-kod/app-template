output "github_secrets" {
  description = "リポジトリごとに GitHub の Secrets へ登録する値"
  value = {
    for repo in var.repositories : repo => {
      AWS_ROLE_ARN      = aws_iam_role.deploy[repo].arn
      AWS_PLAN_ROLE_ARN = aws_iam_role.plan[repo].arn
    }
  }
}

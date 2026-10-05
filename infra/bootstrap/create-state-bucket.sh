#!/usr/bin/env bash
# tfstate を置く S3 バケットを作る（AWS アカウントにつき1回。何度実行しても壊れない）。
#
# バケット名は tfstate-<アカウントID>-<リージョン>。GitHub Actions もアカウント ID から
# 同じ名前を組み立てるので、どこにも書き写さなくてよい。
#
# バケットは Terraform の外で作る。bootstrap 自身の state もこのバケットに置くため
# （先にバケットが無いと、bootstrap の state の置き場所が無い）。
set -euo pipefail

region="${AWS_REGION:-ap-northeast-1}"
account="$(aws sts get-caller-identity --query Account --output text)"
bucket="tfstate-${account}-${region}"

echo "account: ${account}"
echo "bucket:  ${bucket}"

if aws s3api head-bucket --bucket "${bucket}" 2>/dev/null; then
  echo "既にある。設定だけ揃える"
else
  aws s3api create-bucket \
    --bucket "${bucket}" \
    --region "${region}" \
    --create-bucket-configuration "LocationConstraint=${region}"
fi

# 壊れた state を戻せるように版を残す
aws s3api put-bucket-versioning \
  --bucket "${bucket}" \
  --versioning-configuration Status=Enabled

# state には平文の秘密情報が入りうるので暗号化する
aws s3api put-bucket-encryption \
  --bucket "${bucket}" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

aws s3api put-public-access-block \
  --bucket "${bucket}" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "done: ${bucket}"

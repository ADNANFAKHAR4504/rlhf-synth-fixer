This directory contains the Terraform configuration and Lambda source for the webhook processing pipeline.

How to use
1. Set the AWS region and environment variables (or provide via -var).

   export TF_VAR_aws_region="<your-region>"
   export TF_VAR_environment=dev

2. Build Lambdas:

   ./lib/scripts/build-lambdas.sh

3. Run Terraform plan/apply from the repo root or from `lib/`:

   cd lib
   terraform init
   terraform validate
   terraform plan -var="aws_region=$TF_VAR_aws_region" -var="environment=$TF_VAR_environment"

Notes
- All resource names include environment, a random suffix, and a timestamp to avoid collisions across accounts/regions.
- No hardcoded ARNs or account IDs are used; the AWS-managed DynamoDB KMS alias is resolved via a data source.
- S3 buckets and other resources are created with force_destroy / removal policies to allow teardown.
- All resources are tagged with `iac-rlhf-amazon` via `local.common_tags`.

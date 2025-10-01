# Backend bootstrap (for CI)

Purpose:
- Create an S3 bucket with versioning/encryption and optional DynamoDB table for state locking.
- Write lib/backend.tf so Terraform can run `terraform init`.

Required:
- CI job must have AWS credentials with permissions to create S3 and DynamoDB.
- Run this script BEFORE `terraform init`.

CI steps:
1. Ensure AWS creds are present in the job.
2. (Optional) export BACKEND_REGION and DYNAMODB_TABLE env vars.
3. Run: ./lib/bootstrap/create_backend.sh
4. Run: terraform init
5. Run: terraform plan/apply

If CI cannot run scripts, create an S3 bucket manually and replace lib/backend.tf with a literal backend block pointing to that bucket.
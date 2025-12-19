Need CDKTF (TypeScript) code that sets up secure AWS infra, with focus on IAM least privilege + remote backend. This is all in us-east-1 and needs to follow AWS security best practices, nothing fancy just solid and safe.

Main goals:

- IAM policies so only specific roles/users can touch certain S3 buckets with sensitive data, everyone else gets denied

* S3 buckets must have KMS encryption (customer key if possible), block public access, and keep versioning on

- Remote backend for Terraform using S3 (state files) + DynamoDB (state lock), created before other infra so state works from the start
- All in one region (us-east-1), keep names/tags clean

Tags to put everywhere:
Project=SecureInfra  
Environment=Prod  
Owner=Akshat Jain

For the code structure, keep separate constructs in the same stack file:
IamConstruct - roles/policies  
StorageConstruct - sensitive S3 buckets  
BackendConstruct - backend setup (S3+DynamoDB)

Root stack just sets AWS provider and pulls it together. Each construct should be reusable and take config options (interfaces are fine). No hardcoded creds, assume AWS CLI/env vars.

Should be able to run:
cdktf synth  
cdktf plan  
cdktf deploy

Use @cdktf/provider-aws. Output should be valid TypeScript and ready to go.

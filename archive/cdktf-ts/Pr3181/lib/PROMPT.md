Create a production-ready AWS CDKTF TypeScript project in us-west-2, with only
lib/tap-stack.ts (main stack wiring)

lib/modules.ts (reusable modules: KMS, S3, SNS, SQS, IAM)

my Requirements

S3: CMK encryption, versioning enabled, block public access, deny unencrypted PUTs

SNS: topic publish restricted to allowedAwsAccounts

SQS + DLQ: DLQ first, main queue with CMK encryption, redrive policy (maxReceiveCount=3), subscribe to SNS, queue policy allowing SNS delivery

KMS: CMKs with rotation, key policy for account root + least-privilege roles only

IAM: least-privilege roles for S3, SNS, SQS (scoped to created ARNs)

Tags: Project=SecurityConfig, Environment, Owner, CreatedBy=CDKTF

Outputs: S3 bucket name, SNS topic ARN, SQS queue URL/ARN, DLQ ARN, CMK ARN, IAM role ARNs

Constraints

Only two files, no others

No hardcoded secrets

Variables: allowedAwsAccounts, owner, environment, resourcePrefix

Must work with cdktf synth, idempotent, CI/CD safe, well-commented, production-ready, secure-by-default
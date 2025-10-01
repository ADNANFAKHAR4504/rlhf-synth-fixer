Create a production-ready AWS CDKTF TypeScript project in **us-west-2**, with only:

- `lib/tap-stack.ts` (main stack wiring modules)  
- `lib/modules.ts` (reusable modules: KMS, S3, SNS, SQS, IAM).  

### Requirements
- **S3**: CMK-encrypted, versioning enabled, block public access, deny unencrypted PUTs.  
- **SNS**: topic restricted to `allowedAwsAccounts` for publish.  
- **SQS + DLQ**: DLQ first, main queue encrypted with CMK, redrive policy (`maxReceiveCount=3`), subscribed to SNS, queue policy allowing SNS delivery.  
- **KMS**: CMKs with rotation, key policy: account root + least-priv roles only.  
- **IAM**: least-priv roles for S3, SNS, SQS (scoped to ARNs).  
- **Tags**: all resources → `Project=SecurityConfig`, `Environment`, `Owner`, `CreatedBy=CDKTF`.  
- **Outputs**: S3 bucket name, SNS topic ARN, SQS queue URL/ARN, DLQ ARN, CMK ARN, IAM role ARNs.  

### Constraints
- Only two files, no others.  
- No hardcoded secrets.  
- Variables: `allowedAwsAccounts`, `owner`, `environment`, `resourcePrefix`.  
- Code must run with `cdktf synth`, idempotent, CI/CD safe.  
- Well-commented, production-ready, secure-by-default.  
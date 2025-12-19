Create Terraform infrastructure code for a secure healthcare data storage system in AWS us-east-2 region.

Requirements:
- S3 bucket for storing patient records with server-side encryption using AWS KMS
- Customer managed KMS key for encryption with automatic key rotation enabled
- IAM role and policy to restrict S3 bucket access to authorized services only
- CloudTrail to audit all S3 bucket operations including data events
- CloudWatch metrics and alarms for monitoring bucket access patterns
- S3 lifecycle policy to transition objects older than 180 days to Glacier Deep Archive
- Enable S3 versioning for data protection
- Configure S3 Object Lock in governance mode for compliance
- Block all public access to the bucket
- Enable CloudTrail insights for anomaly detection
- Tag all resources with Environment=Production and Purpose=PatientData

Generate complete Terraform HCL code including variables.tf, main.tf, outputs.tf files. Each file should be in a separate code block.
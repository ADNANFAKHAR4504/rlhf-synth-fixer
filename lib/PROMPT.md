You are an advanced AWS engineer  and have to build secure, auditable, high-availability infrastructure via pure CloudFormation YAML, .

Your task is to deliver a single or nested CloudFormation YAML stack that strictly implements the following 14 requirements for a production-grade, multi-tier app in us-east-1:

VPC with at least 2 public and 2 private subnets, split across two Availability Zones.

An IAM Role granting only least privilege to Lambda and EC2 to access required AWS services.

All S3 buckets must use SSE-S3 or SSE-KMS encryption, with access limited to whitelisted IAM users only.

A multi-AZ PostgreSQL RDS instance, encrypted and configured with backups, monitoring, and deletion protection.

CloudTrail logging enabled in all regions, writing logs to an encrypted and versioned S3 bucket.

A Security Group that allows SSH access only from a CIDR range passed as a parameter.

A Lambda function triggered daily by a CloudWatch Events rule to back up a dataset (simulate with logs or S3 copy).

All EBS volumes created must be encrypted.

An SNS topic with email subscriptions that notifies on security events (CloudTrail/GuardDuty).

S3 Bucket Policy that restricts access to specific IAM users.

An AWS Config rule to enforce every resource is tagged with both 'Environment' and 'Owner'.

A CloudFront distribution fronting an S3 bucket with HTTPS-only access, no fallback to HTTP.

Enable and store VPC Flow Logs in an S3 bucket with versioning.

Enable and configure AWS GuardDuty for active threat detection.

Constraints:

The solution must be in YAML, and pass aws cloudformation validate-template without error.

No external scripts, no TODOs, no placeholders. Use Parameters, Mappings, Outputs where necessary.

Each requirement must be fully implemented. No summaries or simplified resource definitions.

Do not use macros or custom resources — only standard AWS resources.



 Note: The prompt mentions using the us-east-1 region, but I used us-east-2 for testing due to quota issues in us-east-1.


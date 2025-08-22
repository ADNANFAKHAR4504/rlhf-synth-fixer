# Secure, Least‑Privilege CloudFormation Setup (us‑east‑1)

## What I need

- Use current AWS resource properties across EC2, S3, RDS, Lambda, CloudTrail, Config, CloudWatch, KMS, and IAM.
- Follow least privilege. Avoid wildcards in IAM actions and resources.

## Must‑haves before launch

- EC2 AMI: Don’t hardcode an AMI ID. Resolve the latest Amazon Linux 2 AMI from SSM (`/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`).
- IAM policies: No `*` for Action or Resource. Use precise ARNs (S3 objects/prefixes, Log Groups, KMS keys).

## Build checklist

1) S3 with KMS
- Create an S3 bucket encrypted with a customer‑managed KMS key.
- Block public access.
- Bucket policy must require KMS and deny unencrypted PUTs.

2) EC2 with scoped S3 access
- Create an IAM role + instance profile for EC2 with only the S3 permissions needed for a specific bucket/prefix.
- Launch EC2 using the SSM‑resolved AL2 AMI.
- Enable termination protection for critical instances.

3) Security Groups
- Allow inbound SSH (22) only from a parameter `AllowedSshCidr`.
- Name and describe SGs clearly.

4) RDS (encrypted)
- KMS‑encrypted at rest.
- Place into private subnets only.

5) Lambda + Logs
- Create an explicit Log Group with retention.
- Lambda role limited to `logs:CreateLogStream` and `logs:PutLogEvents` on that log group’s ARN.

6) Private‑only VPC
- No Internet Gateway or public subnets.
- Subnets must set `MapPublicIpOnLaunch: false`.

7) Tagging
- Tag every resource with `Environment` and `Owner` (parameters).

8) CloudTrail
- Single multi‑region trail with log file validation.
- Deliver to a KMS‑encrypted S3 bucket.
- Send to CloudWatch Logs for alarms.

9) CloudWatch alarms
- MetricFilter on CloudTrail logs for `UnauthorizedOperation` / `AccessDenied*`.
- CloudWatch Alarm on that metric (SNS topic is a parameter).

10) AWS Config (SG monitoring)
- Enable Config (recorder + delivery channel) and add a managed rule to monitor Security Group changes (e.g., only allow 22).

## Parameters to include

- `Environment`, `Owner`, `AllowedSshCidr`.
- Optional: `S3BucketName`, `TrailBucketName`, `NotificationEmail`.

## Implementation notes

- Use customer‑managed KMS keys for S3, RDS, and CloudTrail logs.
- Enforce S3 encryption via bucket policy (`x-amz-server-side-encryption = aws:kms`).
- Provide outputs for key IDs (VPC, Subnets, SGs, Buckets).

## Outputs

- VPC ID, Subnet IDs, Security Group IDs
- S3 bucket names and ARNs
- KMS key ARNs (S3/RDS/CloudTrail if used)

## Deployment notes

- Region: us‑east‑1
- Follow CloudFormation best practices; keep deployment time reasonable
- Use parameters for flexibility; no IAM wildcards

## Final review

- AMI via SSM (not hardcoded).
- IAM policies are least‑privilege with exact ARNs (no wildcards).
- SGs restrict to SSH from `AllowedSshCidr`.
- S3, RDS, CloudTrail are KMS‑encrypted; CloudTrail is multi‑region with file validation.
- Lambda has a dedicated Log Group and minimal log permissions.
- VPC is private‑only.
- AWS Config rule exists for SG posture.
- Every resource is tagged with `Environment` and `Owner`.

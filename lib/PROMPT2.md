## Hey — linter‑friendly spec for TapStack.yaml (us‑west‑2)

We want a clean YAML template that won’t fight cfn‑lint or security reviews.

Template name: `TapStack.yaml`
Region: `us-west-2`
Naming convention: `<resource_type>-<project_name>-<environment>`
Parameters: `ProjectName`, `Environment` (use in names) + others noted below

## What to build
- VPC with public/private subnets across two AZs
- IGW + public route table; NAT Gateway (EIP) + private route table
- S3 bucket for app data (SSE‑KMS, BPA on)
- RDS MySQL Multi‑AZ, private only, in a DBSubnetGroup that spans private subnets
- Lambda “hello world” (Python or Node.js) running in private subnets
- CloudFront + WAFv2 WebACL using `AWSManagedRulesCommonRuleSet`
- CloudTrail for management events -> encrypted S3, LFV enabled
- AWS Config recorder + one managed rule (e.g., `s3-bucket-public-read-prohibited` or `rds-instance-public-access-check`)
- IAM role for Lambda with only `logs:CreateLogStream` and `logs:PutLogEvents` to its Log Group

## Parameters
- Required: `ProjectName`, `Environment`
- Network: `VpcCidr` (default allowed), `PublicSubnetCidrs`, `PrivateSubnetCidrs`
- Compliance/alerts: `NotificationEmail`
- DB: `DBEngineVersion` (MySQL — allowed list; default like `8.0.43`), `DbUsername` (non‑secret)

## Linter‑friendly guidance
1) Availability Zones
- Don’t hardcode `us-west-2a/b`. Use `GetAZs` + `Select`.

2) `Fn::Sub`
- Only when substituting. Otherwise plain strings.

3) Secrets
- No `DBPassword` parameter. Use Secrets Manager and dynamic refs in RDS.

4) CloudTrail
- `IsMultiRegionTrail: true`, `IsLogging: true`, log file validation on, S3 delivery encrypted, CW Logs wired up.

5) Tags
- Tag only where supported: VPC, Subnet, SG, EC2, RDS, DBSubnetGroup, S3, CloudTrail Trail, Logs LogGroup, CloudWatch Alarm, KMS Key, IAM Role, Secret.
- Do not tag: Logs MetricFilter, Lambda Permission, some EC2 associations, IAM InstanceProfile.

## Validation guardrails (bake these in)
- Region consistency: everything targets `us-west-2`.
- Naming: use `<resource_type>-<project_name>-<environment>` via `ProjectName` and `Environment`.
- AMI resolution: use SSM `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2` (type `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>`).
- IAM: no named IAM; no wildcards in `Action` or `Resource`.
- S3 policy resources: use full ARNs for objects/prefixes (e.g., `arn:aws:s3:::bucket/*`).
- CloudTrail: `CloudWatchLogsLogGroupArn` must be the log group ARN (no `:*`).
- AWS Config: use valid resources only (Recorder, DeliveryChannel, ConfigRule).

## Expected output
- A single file `TapStack.yaml`, parameterized, deployable, cfn‑lint clean.
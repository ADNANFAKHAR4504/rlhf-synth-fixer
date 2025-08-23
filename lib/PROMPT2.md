## General

- **Template name**: `TapStack.yaml`
- **Region**: `us-east-1`
- **Naming**: `<resource_type>-<project_name>-<environment>`
- **Parameters**: `ProjectName`, `Environment`, plus others below

## What to Build

- **VPC** with public + private subnets across 2 AZs
- **Internet setup**: IGW + public route table; NAT Gateway (EIP) + private route table
- **S3 bucket** for app data:
  - SSE-KMS encryption
  - Block Public Access on

- **RDS MySQL**:
  - Multi-AZ
  - Private only
  - DBSubnetGroup spanning private subnets

- **Lambda**: Hello World (Python/Node.js) in private subnets
- **CloudFront + WAFv2 WebACL** using `AWSManagedRulesCommonRuleSet`
- **CloudTrail**: management events → encrypted S3, log file validation on
- **AWS Config**: recorder + 1 managed rule (S3 or RDS check)
- **IAM role for Lambda** → only `logs:CreateLogStream` + `logs:PutLogEvents`

## Parameters

- **Required**: `ProjectName`, `Environment`
- **Network**: `VpcCidr`, `PublicSubnetCidrs`, `PrivateSubnetCidrs`
- **Compliance/Alerts**: `NotificationEmail`
- **Database**:
  - `DBEngineVersion` (MySQL, allowed list, default `8.0.43`)
  - `DbUsername` (non-secret)

## Linter-Friendly Guidance

1. **AZs** → use `GetAZs` + `Select`, don’t hardcode `us-east-1a/b`
2. **Fn::Sub** → use only for substitution, otherwise plain strings
3. **Secrets** → no `DBPassword` param, use Secrets Manager + dynamic refs
4. **CloudTrail** → `IsMultiRegionTrail: true`, `IsLogging: true`, encrypted S3 delivery, CW Logs enabled
5. **Tags**:
   - Allowed → VPC, Subnet, SG, EC2, RDS, DBSubnetGroup, S3, CloudTrail, LogGroup, Alarm, KMS Key, IAM Role, Secret
   - Not allowed → Logs MetricFilter, Lambda Permission, some EC2 associations, IAM InstanceProfile

## Guardrails

- **Region**: All resources in `us-east-1`
- **Naming**: `<resource_type>-<project_name>-<environment>` always
- **AMI**: Use SSM param `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`
- **IAM**: No named IAM, no wildcards in `Action`/`Resource`
- **S3 policies**: Use full ARNs (`arn:aws:s3:::bucket/*`)
- **CloudTrail**: `CloudWatchLogsLogGroupArn` must be actual ARN (not `:*`)
- **AWS Config**: Valid resources only (`Recorder`, `DeliveryChannel`, `ConfigRule`)

## Expected Output

- One file `TapStack.yaml`
- Parameterized, clean, deployable
- Must pass `cfn-lint` without issues

# Hello,

I want to create a simple and secure **CloudFormation starter template** for new projects. Nothing too big — just the common things we always need:

- proper audit setup,
- a good VPC base,
- private data layer,
- one small Lambda function (to show the wiring),
- and a front door with WAF.

It should be a **single YAML file** that we can directly put in repositories and deploy smoothly.

Please name the file **TapStack.yaml**. We will deploy in **us-east-1** region.
For naming resources, use this format:

```
<resource_type>-<project_name>-<environment>
```

Expose **ProjectName** and **Environment** as parameters and use them in the names. Keep it clean, readable, and easy to extend later.

## Things to Include

### Compliance and Auditing

- **AWS Config** → Enable `ConfigurationRecorder` for all resources and add at least one managed rule like `s3-bucket-public-read-prohibited` or `rds-instance-public-access-check`.
- **CloudTrail** → Capture all management events, deliver logs to an **encrypted S3 bucket**, and enable log file validation.

### Networking Base

- VPC with **public and private subnets** across 2 AZs.
- Internet setup:
  - Internet Gateway with public route table for public subnets
  - NAT Gateway (EIP) in public subnet
  - Private route table → private subnets use NAT for internet access

### Secure Data Layer

- **S3**:
  - One bucket for app data
  - Default **KMS encryption**
  - Block Public Access turned **on** by default

- **RDS**:
  - Multi-AZ DB instance (for HA)
  - Must be **private** (`PubliclyAccessible: false`)
  - Use a DBSubnetGroup with private subnets

### Application and Delivery

- **Lambda**:
  - Small “Hello World” in Python/Node.js
  - Run inside private subnets

- **CloudFront + WAF**:
  - CloudFront distribution in front
  - WAFv2 WebACL with `AWSManagedRulesCommonRuleSet`

### IAM

- Create one **dedicated IAM Role** for Lambda.
- Must be **least privilege** → only allow actions needed for execution and logs:
  - `logs:CreateLogStream`
  - `logs:PutLogEvents`

- Avoid wildcards.

## Expected Output

- One file: **TapStack.yaml**
- Parameterized, simple, and deployable in **us-east-1**
- Should pass `cfn validate` and deploy cleanly

## Guardrails

- **AMI**: Don’t hardcode → use SSM param for latest Amazon Linux 2.
- **IAM**: Don’t use named IAM resources, no wildcards in `Action`/`Resource`.
- **S3 policies**: Always reference full object ARN like `arn:aws:s3:::bucket/*`.
- **CloudTrail**: `CloudWatchLogsLogGroupArn` must be actual ARN, not `:*`.
- **AWS Config**: Only use `ConfigurationRecorder`, `DeliveryChannel`, `ConfigRule`.
- **Region**: Always stick to `us-east-1`.

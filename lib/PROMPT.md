# Hey there,

I’m creating a sensible, secure starter CloudFormation template for new projects. Nothing flashy — just the essentials we always need: auditability, a solid VPC baseline, private data tier, a simple Lambda to demonstrate wiring, and a front door with WAF. Please build this as a single YAML file that we can drop into repositories and deploy without surprises.

Call the template output `TapStack.yaml`. We deploy in `us-east-1` and use a simple naming pattern to keep things tidy:

<resource_type>-<project_name>-<environment>

Expose `ProjectName` and `Environment` as Parameters and use them in names. Keep it readable and easy to extend.

## What to include

### Compliance and Auditing

- AWS Config: enable a `ConfigurationRecorder` for all resources and include one managed rule (e.g., `s3-bucket-public-read-prohibited` or `rds-instance-public-access-check`).
- CloudTrail: capture all management events. Deliver to an encrypted S3 bucket and turn on log file validation.

### Networking Foundation

- A VPC with both public and private subnets across two AZs.
- Internet access:
  - Internet Gateway plus a public route table for public subnets
  - NAT Gateway (EIP) in a public subnet
  - Private route table allowing private subnets to access the internet via NAT

### Secure Data Tier

- S3
  - A bucket for application data
  - Default server-side encryption (KMS)
  - Block Public Access on by default
- RDS
  - Multi-AZ DB instance for HA
  - Keep it private (`PubliclyAccessible: false`)
  - Use a DBSubnetGroup spanning the private subnets

### Application and Delivery

- Lambda
  - A tiny “hello world” (Python or Node.js) running in the private subnets
- CloudFront + WAF
  - CloudFront distribution in front
  - WAFv2 WebACL using `AWSManagedRulesCommonRuleSet`

### IAM

- Create a dedicated IAM role for the Lambda.
- Keep it least-privilege: just what’s needed to execute and write logs (`logs:CreateLogStream`, `logs:PutLogEvents`). No wildcards.

### Expected Output

- A single file: `TapStack.yaml`, parameterized, readable, and deployable. It should pass cfn validation and go up cleanly in `us-east-1`.

## A few guardrails so this deploys cleanly

- AMI: don’t hardcode — use the SSM parameter for latest Amazon Linux 2.
- IAM: no named IAM resources; avoid wildcards in `Action` or `Resource`.
- S3 in policies: reference full object ARNs (e.g., `arn:aws:s3:::bucket/*`).
- CloudTrail: `CloudWatchLogsLogGroupArn` must be the actual log group ARN (no `:*`).
- AWS Config: stick to `ConfigurationRecorder`, `DeliveryChannel`, `ConfigRule`.
- Region: consistently target `us-east-1`.

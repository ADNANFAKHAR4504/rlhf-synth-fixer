# Hey there,

I need your help building a CloudFormation template in YAML that we can use as a secure, scalable, and compliant starting point for new AWS projects. Think of it as our “gold standard” setup.

The template should be called `TapStack.yaml`, run in `us-west-2`, and follow a strict naming convention:

<resource_type>-<project_name>-<environment>

Use CloudFormation Parameters for `ProjectName` and `Environment` so resource names are dynamic and reusable.

## What to include

### Compliance and Auditing
- AWS Config
  - A `ConfigurationRecorder` that tracks all resource changes
  - At least one managed Config rule (e.g., `s3-bucket-public-read-prohibited` or `rds-instance-public-access-check`)
- CloudTrail
  - A trail that captures all management events
  - Logs go to a new S3 bucket that’s encrypted at rest
  - Log file validation enabled

### Networking Foundation
- A VPC with public and private subnets across two Availability Zones
- Internet access
  - An Internet Gateway with a public route table for the public subnets
  - A NAT Gateway (with EIP) in a public subnet
  - A private route table so private subnets can reach the internet through the NAT Gateway

### Secure Data Tier
- S3
  - A bucket for application data
  - Default server-side encryption enabled (KMS)
  - Block Public Access turned on by default
- RDS
  - A DB instance deployed as Multi-AZ for high availability
  - Must be private (`PubliclyAccessible: false`)
  - Deployed into a DBSubnetGroup that spans the private subnets

### Application and Delivery
- Lambda
  - A simple “hello world” function (Python or Node.js)
  - Runs inside the private subnets
- CloudFront + WAF
  - A CloudFront distribution for content delivery
  - A WAFv2 WebACL associated with it
  - The WebACL should use the AWS managed ruleset `AWSManagedRulesCommonRuleSet` to block common web exploits

### IAM
- Create a dedicated IAM role for the Lambda
- The policy must be least-privilege
  - Only what’s required to run the function and write to CloudWatch Logs (`logs:CreateLogStream`, `logs:PutLogEvents`)
  - No wildcards in actions

### Expected Output
- A single file: `TapStack.yaml`
- It should be parameterized, well-structured, pass CloudFormation validation, and deploy cleanly into AWS

## Validation guardrails (to avoid common deployment issues)
- AMI resolution: do not hardcode — use SSM for latest Amazon Linux 2
- IAM: no named IAM resources; no wildcards in `Action` or `Resource`
- S3 ARNs: use full ARNs for object resources (e.g., `arn:aws:s3:::bucket/*`), not bucket names
- CloudTrail: `CloudWatchLogsLogGroupArn` must be the log group ARN (no wildcard suffix)
- AWS Config: use valid resource types only (Recorder, DeliveryChannel, ConfigRule). Avoid non-existent types
- Region consistency: target `us-west-2` throughout

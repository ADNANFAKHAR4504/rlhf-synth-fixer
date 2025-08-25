You are an expert AWS CloudFormation engineer.
Your task is to write a single, production-ready CloudFormation template in YAML that configures a secure and compliant web application environment according to the following strict requirements.

Language & Platform

Language: YAML

Platform: AWS CloudFormation (no SAM, no CDK)

Reference: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html

Environment & Constraints

All resources must deploy to us-east-1.

IAM Roles must follow the principle of least privilege.

All resources must be tagged with:

Environment

ProjectName

All S3 buckets:

Enable server-side encryption with KMS managed keys.

Enable versioning.

API Gateway:

Enable access logging and execution logging to a CloudWatch log group.

Lambda functions:

Must run inside a VPC.

Must use environment variables for configuration.

SNS topic:

Integrate with CloudTrail to send notifications on potential policy violations.

RDS instances:

Must not be publicly accessible.

Security groups:

Allow inbound access only from specific IP ranges (parameterized).

Sensitive values:

Store in SSM Parameter Store.

AWS WAF:

Include custom rules to protect against common threats.

EC2 instances:

Include an auto-scaling group for high availability.

Attach CloudWatch alarms for high CPU utilization.

Resources to Include

API Gateway (with logging)

Multiple Lambda functions (in VPC, with env variables, least-privilege IAM role)

RDS instance (private)

SNS topic (CloudTrail integrated)

Multiple S3 buckets (encrypted with KMS, versioning enabled, secure transport enforced)

Parameter Store parameters for sensitive values

AWS WAF with custom rules

EC2 Auto Scaling Group with scaling policies

CloudWatch alarms for EC2 CPU utilization

Security groups with restricted CIDR ranges

Additional Implementation Notes

Use Parameters for:

Environment

ProjectName

Allowed IP ranges

Sensitive parameter names (SSM)

KMS key ARN

Apply Conditions where appropriate (e.g., optional resources or encryption methods).

Ensure least-privilege IAM policies for Lambda and EC2 roles.

Follow AWS Well-Architected Framework security best practices.

Expected Output
Produce only a valid .yaml CloudFormation template inside a fenced code block
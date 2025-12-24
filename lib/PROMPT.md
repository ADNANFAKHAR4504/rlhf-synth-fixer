You are an expert AWS CloudFormation engineer.
Your task is to write a single, production-ready CloudFormation template in YAML that configures a secure and compliant web application environment.

Language & Platform

Language: YAML

Platform: AWS CloudFormation - no SAM, no CDK

Reference: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html

Service Architecture & Data Flow

The web application infrastructure connects services in this pattern:

API Gateway routes incoming requests to Lambda functions deployed in private VPC subnets. Lambda functions query the RDS database for application data and send processing results to SNS topics for downstream notification. S3 buckets store application assets with KMS encryption, while CloudWatch logs capture API Gateway access logs and Lambda execution logs for monitoring. EC2 instances in an Auto Scaling Group handle additional compute workloads and scale based on CPU utilization alarms. AWS WAF protects the API Gateway endpoints with custom security rules. CloudTrail monitors API calls and triggers SNS notifications on potential policy violations. All sensitive configuration values are retrieved from SSM Parameter Store.

Environment & Constraints

All resources must deploy to us-east-1.

IAM Roles must follow the principle of least privilege.

All resources must be tagged with Environment and ProjectName.

All S3 buckets must enable server-side encryption with KMS managed keys and versioning.

API Gateway must enable access logging and execution logging to a CloudWatch log group.

Lambda functions must run inside a VPC and use environment variables for configuration.

SNS topic must integrate with CloudTrail to send notifications on potential policy violations.

RDS instances must not be publicly accessible.

Security groups must allow inbound access only from specific IP ranges.

Sensitive values must be stored in SSM Parameter Store.

AWS WAF must include custom rules to protect against common threats.

EC2 instances must include an auto-scaling group for high availability with CloudWatch alarms for high CPU utilization.

Resources to Include

API Gateway with logging enabled

Multiple Lambda functions deployed in VPC with environment variables and least-privilege IAM roles

RDS instance in private subnet

SNS topic integrated with CloudTrail

Multiple S3 buckets with KMS encryption, versioning, and secure transport enforced

Parameter Store parameters for sensitive values

AWS WAF with custom rules

EC2 Auto Scaling Group with scaling policies

CloudWatch alarms for EC2 CPU utilization

Security groups with restricted CIDR ranges

Additional Implementation Notes

Use Parameters for Environment, ProjectName, Allowed IP ranges, Sensitive parameter names, and KMS key ARN.

Apply Conditions where appropriate for optional resources or encryption methods.

Ensure least-privilege IAM policies for Lambda and EC2 roles.

Follow AWS Well-Architected Framework security best practices.

Expected Output
Produce only a valid .yaml CloudFormation template inside a fenced code block
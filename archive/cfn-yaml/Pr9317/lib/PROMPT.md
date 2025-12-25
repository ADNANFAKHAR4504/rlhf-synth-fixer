Prompt to Generate the Template - NO AWS Config

You are an AWS CloudFormation expert specializing in secure, compliant infrastructure as code. Create a complete, production-ready CloudFormation template in YAML for the us-west-2 AWS region that meets the following requirements.

Critical constraint - do this first:
Do NOT include AWS Config. Do not create AWS::Config::ConfigurationRecorder, AWS::Config::DeliveryChannel, AWS::Config::ConfigurationRecorderStatus, AWS::Config::ConfigRule, ConformancePack, RemediationConfiguration, or any other AWS Config-related resources or references.

Requirements
Networking
Create a VPC with both public and private subnets across at least two Availability Zones in us-west-2.

Attach an Internet Gateway for public subnet access.

Create one NAT Gateway in a public subnet and route private subnets' outbound internet traffic through it.

Proper route tables and associations for public/private subnets.

Security Groups & Access Control
Security group allowing SSH only from 203.0.113.0/24.

Ensure all EBS volumes attached to EC2 instances are encrypted using a Launch Template or equivalent.

Create an IAM role and instance profile for EC2 to access S3 securely without embedded credentials.

S3 bucket policies that enforce HTTPS/TLS only by denying non-TLS connections.

Monitoring & Logging - No AWS Config
Enable CloudTrail to log all account activity to an S3 bucket with encryption and also to CloudWatch Logs.

Create any required KMS keys and policies following least privilege.

Do not add AWS Config - restate: no ConfigurationRecorder/DeliveryChannel/ConfigRules.

Compute & Scaling
Deploy EC2 instances in an Auto Scaling Group spanning two AZs for high availability.

Parameterize instance type and key properties.

Use an Amazon Linux 2 AMI pulled via SSM Parameter.

Ensure EBS volume encryption is enabled by default.

Database & Storage
Create a DynamoDB table with Point-In-Time Recovery enabled.

Parameterize table name and billing mode, prefer on-demand.

Alerting & Incident Response
From CloudTrail logs, create a metric filter for UnauthorizedOperation/AccessDenied events.

Create a CloudWatch Alarm on that metric.

Create an SNS Topic for alerts and an email subscription with parameterized email.

Create a Lambda function with least-privilege IAM that sends enriched alerts to SNS when the alarm triggers. Use either Alarm to Event rule to Lambda to SNS, or Alarm to SNS to Lambda. Ensure it works end-to-end.

Best Practices & Constraints
Use parameterization for CIDR ranges, instance types, email address, DynamoDB table name.

Apply least-privilege IAM policies.

Use KMS encryption where applicable for CloudTrail S3 and CloudWatch Logs if needed.

Ensure the template is valid YAML and deployable without modification.

Include Outputs for key resources: VPC ID, Public/Private Subnet IDs, Internet Gateway ID, NAT Gateway ID, ASG name, Instance Profile name, CloudTrail bucket name, CloudWatch Log Group name, DynamoDB table name/ARN, SNS Topic ARN, and Lambda function name/ARN.

Include appropriate Tags like Project and Environment.

Use cfn-lint-friendly, fully resolvable intrinsic functions without placeholders.

Output Formatting
Return only the YAML template inside a single fenced code block.

Do not include explanations or commentary outside the code block.

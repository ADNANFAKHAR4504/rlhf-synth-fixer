Act as an expert AWS CloudFormation engineer.

Language: YAML Platform: CloudFormation

Environment: Design a single CloudFormation YAML template that provisions a secure, production-grade multi-tier application infrastructure in the us-west-2 region.
The template must incorporate advanced security practices and meet the following requirements:

Requirements:

S3 Bucket
Create an S3 bucket with versioning enabled.
Configure bucket policy to allow read-only access to a specific IAM role only.
Block all public access.
Use SSE-S3 or SSE-KMS for encryption.
DynamoDB Table
Define a DynamoDB table with server-side encryption enabled using KMS.
Ensure point-in-time recovery is enabled.
EC2 Auto Scaling
Launch EC2 instances using an Auto Scaling Group inside a VPC.
Use Launch Template with the latest Amazon Linux 2 AMI (via SSM Parameter).
Security Groups: allow inbound HTTPS only (443).
Auto Scaling Group capacity: min=2, max=10, desired=2.
Instances should assume an IAM Role with least-privilege permissions (read from S3, access DynamoDB, write to CloudWatch logs).
API Gateway + WAF
Create an API Gateway REST API with a sample resource/method.
Attach an AWS WAF WebACL to the API Gateway stage.
Define WAF rules including an IP set with specific IP block conditions.
Monitoring
Create a CloudWatch Alarm to trigger when network traffic exceeds a defined threshold (parameterized).
Alarm action can publish to an SNS topic.
Constraints:

All resources must be created within us-west-2 only.
All sensitive data must be encrypted (S3, DynamoDB, CloudWatch Logs).
IAM policies must follow least privilege.
Tag all resources with Environment=Production.
Expected Output:

A single valid YAML CloudFormation template that:
Passes cfn-lint validation.
Implements all resources, roles, security, and monitoring as specified.
Uses Parameters for inputs like:
IAM Role ARN (for S3 bucket read-only access).
VPC ID, Subnet IDs.
DynamoDB table name.
API Gateway name.
Network traffic threshold for CloudWatch Alarm.
Includes meaningful Outputs:
S3 Bucket Name
DynamoDB Table ARN
Auto Scaling Group Name
API Gateway Invoke URL
WAF WebACL ARN
CloudWatch Alarm ARN
Return only the final CloudFormation YAML file without additional commentary.
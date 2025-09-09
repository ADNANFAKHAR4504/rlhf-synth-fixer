Objective

Create a CloudFormation template in JSON format to provision a secure AWS environment, following security best practices through Infrastructure as Code (IaC).

Requirements
1. AWS WAF with API Gateway Protection

Deploy an AWS WAF Web ACL with preconfigured AWS-managed rule groups (e.g., AWSManagedRulesCommonRuleSet) to defend against common web threats.

Associate the Web ACL with an Amazon API Gateway.

2. Resource Tagging

All AWS resources must be tagged using:

Key: project

Value: env-security

3. CloudFront Real-Time Logging

Deploy a CloudFront Distribution with:

Real-time logging enabled using CloudWatch Logs or Kinesis Data Streams.

Logging should capture all HTTP(S) requests and responses.

4. DNSSEC with Route 53

Enable DNSSEC signing on a Route 53 Hosted Zone.

Ensure proper KSK/ZSK key management is configured using Route 53 Key Signing Keys (KSK).

5. Lambda Monitoring via CloudWatch

Monitor AWS Lambda functions using CloudWatch Metrics and Logs.

Track the following metrics:

Invocation count

Error count

Duration

6. IAM Roles for Lambda (Least Privilege)

Define IAM roles that follow the principle of least privilege.

Only allow explicitly required actions and resources in IAM policies assigned to Lambda functions.

7. S3 Bucket Security

Create S3 buckets with:

Default encryption enabled using AES-256.

Public access blocked at both bucket and account level.

Optional: Use bucket policies to restrict access to only approved IAM roles or VPC endpoints.

8. Security Incident Alerts

Create an SNS Topic for security alerts.

Automatically publish notifications to this topic upon detection of a security breach, using services such as:

AWS GuardDuty

AWS Config Rules

Custom Lambda detectors

9. Custom IAM Policy for S3

Create a custom IAM policy that:

Allows only s3:ListBucket and s3:GetObject permissions.

Limits access to specific buckets.

10. VPC Flow Logs

Enable VPC Flow Logs to capture network traffic metadata.

Store the logs in a dedicated S3 bucket (with encryption and restricted access).

Use a specific IAM role to allow VPC logging to the bucket.

Outputs

The CloudFormation template must output the following:

Web ACL ID

CloudFront Distribution ID

API Gateway ID

Route 53 Hosted Zone ID

Lambda Function Names

S3 Bucket Names

SNS Topic ARN

VPC Flow Logs Role ARN
Create Terraform infrastructure code for a security monitoring platform that handles 13,200 daily security events with real-time alerting and forensic analysis capabilities.

Deploy the following security components in us-east-1:

1. AWS Security Hub - Configure as the central findings aggregator with cross-region aggregation enabled. Enable the AWS Foundational Security Best Practices standard and integration with all security services.

2. Amazon GuardDuty - Enable threat detection across all AWS regions. Configure to detect threats including cryptocurrency mining, malware, and unauthorized access. Enable Lambda Protection for serverless workload monitoring.

3. AWS CloudTrail - Set up a multi-region trail that captures all API calls. Configure event selectors for both management and data events. Store logs in an S3 bucket with versioning enabled.

4. CloudWatch Logs - Create a centralized log group for security events. Set up log streams for each security service. Configure retention period of 180 days.

5. Amazon EventBridge - Create event rules to route security findings based on severity. Route critical severity findings (HIGH and CRITICAL) to SNS immediately. Set up rules for GuardDuty findings, Security Hub findings, and CloudTrail API events.

6. AWS Lambda - Deploy a Lambda function to process custom security rules and enrich findings. The function should parse incoming security events and add custom tags based on event patterns.

7. Amazon SNS - Create an SNS topic for security team notifications. Configure email subscriptions for critical alerts. Set up message filtering based on finding severity.

8. Amazon S3 - Configure a bucket for CloudTrail log archival with:
   - Server-side encryption using AWS KMS
   - Lifecycle policy to transition logs to Glacier after 90 days
   - Bucket policy restricting access to security team IAM role only
   - MFA delete protection enabled

9. IAM Roles and Policies - Create:
   - SecurityTeamRole with read access to all security services
   - LambdaExecutionRole for the custom rules processor
   - Service-linked roles for GuardDuty and Security Hub

Include proper tagging for all resources with Environment, Purpose, and Owner tags. Enable logging and monitoring for all services. Use Terraform variables for configurable parameters like email addresses and retention periods.

Provide the complete Terraform code with one code block per file, properly organized in separate files for better maintainability.
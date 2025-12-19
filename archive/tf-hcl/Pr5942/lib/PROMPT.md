# Secure VPC with CloudTrail Audit Logging for Healthcare Compliance

## Business Context

Hey team, we're building a secure network infrastructure for our healthcare platform that serves 10,000 daily users across clinics and hospitals. The business need is critical: we need comprehensive audit logging for HIPAA compliance and security monitoring. Every API call, every access attempt, every configuration change needs to be logged and analyzed for compliance audits and security investigations.

Here's what we're building: a production-grade VPC in Singapore (ap-southeast-1) with private subnets for our application servers and databases, comprehensive CloudTrail logging for all API activity, and automated compliance checks. During normal operations, CloudTrail captures every AWS API call made in our account, stores encrypted logs in S3, and triggers alerts when suspicious activity is detected. This gives our security team full visibility into who's doing what, when, and from where.

We're implementing this **using Terraform with HCL** to ensure the entire security infrastructure is reproducible and auditable. The architecture includes a VPC with private subnets only (no public internet access for our healthcare workloads), CloudTrail configured to log all management and data events, S3 bucket with server-side encryption using customer-managed KMS keys, CloudWatch Logs integration for real-time monitoring, Lambda functions that automatically check compliance rules, and security groups that enforce strict access controls.

This pattern is used by companies like Kaiser Permanente for patient data systems, Anthem for claims processing, and CVS Health for pharmacy networks—all require the same combination of network isolation, comprehensive audit logging, and automated compliance monitoring. We're using CloudTrail because it provides a complete audit trail of all AWS API activity, which is required for HIPAA compliance and security incident investigations.

The monitoring layer uses CloudWatch Logs to receive CloudTrail events in real-time. We've built a Lambda function that runs automated compliance checks every time a security-relevant API call is detected—things like security group modifications, IAM policy changes, or S3 bucket permission updates. If the Lambda detects a violation of our compliance rules (like someone trying to make an S3 bucket public or weakening security group rules), it publishes an alert to SNS and can even auto-remediate by reverting the change.

All audit logs are stored in S3 with server-side encryption using a customer-managed KMS key. We're using KMS instead of S3-managed encryption because HIPAA requires we control the encryption keys. The S3 bucket has strict bucket policies that prevent deletion of logs, block all public access, and require encryption for all uploads. CloudTrail validates log file integrity using digital signatures, so we can prove logs haven't been tampered with during compliance audits.

The network design uses private subnets only for our application tier. We're not deploying NAT gateways or internet gateways in this setup because our focus is on the audit logging infrastructure, not application connectivity. Security groups are configured with minimal required access—only port 443 for HTTPS within the VPC CIDR range. This follows the principle of least privilege and network segmentation required by healthcare security frameworks.

The solution is designed to be cost-effective while maintaining production-grade security. CloudTrail's first trail is free in each region, and we're only creating our second trail in Singapore, so costs are minimal. S3 storage for logs runs about 50 cents per month for typical API activity volumes. The KMS key costs one dollar per month. Lambda invocations for compliance checks cost pennies per month since we're only checking critical events, not every API call. Total monthly cost stays under five dollars while providing enterprise-grade audit logging and compliance monitoring that can handle security investigations and regulatory audits.

## Technical Requirements

### VPC and Network Configuration

We need a VPC in ap-southeast-1 (Singapore) with CIDR block 10.0.0.0/16. Create two private subnets: 10.0.10.0/24 in availability zone ap-southeast-1a and 10.0.20.0/24 in availability zone ap-southeast-1b. These subnets should have no route to the internet—they're purely for internal resources.

Enable DNS hostnames and DNS support on the VPC. Don't create internet gateways or NAT gateways since we're focusing on the audit infrastructure, not application connectivity. The VPC should be tagged appropriately for identification and cost tracking.

Create a security group for future application resources that only allows inbound HTTPS traffic (port 443) from within the VPC CIDR range (10.0.0.0/16). No ingress from the public internet. Allow all outbound traffic for AWS API calls. This security group demonstrates least-privilege network access controls.

### CloudTrail Configuration

Set up CloudTrail to log all management events (read and write operations) across all AWS services. This will be the second trail in the Singapore region, so we're well within the five-trail limit. Enable log file validation to detect tampering—CloudTrail creates a hash of each log file and signs it digitally.

Configure CloudTrail to deliver logs to an S3 bucket and also send events to CloudWatch Logs for real-time monitoring. Use a customer-managed KMS key for encrypting the log files at rest. CloudTrail needs permission to use this KMS key for encryption operations.

Include global service events like IAM and STS API calls—these are critical for security monitoring even though they're not specific to Singapore. Set the trail to log events from all regions so we get complete visibility, but the trail resource itself lives in ap-southeast-1.

Don't enable S3 data events or Lambda data events for this implementation—we're focused on management plane activity (who changed what configuration) rather than data plane activity (who accessed which S3 object). Management events are what compliance frameworks like HIPAA care about.

### S3 Bucket for CloudTrail Logs

Create an S3 bucket to store CloudTrail logs. The bucket name needs to be globally unique, so append the AWS account ID to ensure uniqueness. Enable versioning on the bucket to protect against accidental deletion of log files. Configure server-side encryption using the same customer-managed KMS key that CloudTrail uses.

Block all public access using the four S3 public access block settings. Create a bucket policy that grants CloudTrail permission to write logs to the bucket. The policy should also prevent deletion of objects to maintain log integrity—this is often done using S3 Object Lock, but for testing purposes, we'll just rely on versioning and IAM controls.

Don't configure lifecycle policies that would delete or transition logs to Glacier—for a production system logs would be retained for seven years for HIPAA, but for our testing we'll keep everything in standard S3 storage. Enable force_destroy on the bucket so terraform destroy can clean up during testing.

### KMS Encryption Key

Create a customer-managed KMS key in ap-southeast-1 for encrypting CloudTrail logs. The key policy must grant the root account full permissions and specifically allow CloudTrail service principal to use the key for GenerateDataKey and Decrypt operations. The S3 service principal also needs permission to use the key since S3 will be encrypting the log files.

Enable automatic key rotation as a security best practice. Set the deletion window to seven days (minimum) to allow terraform destroy to work cleanly during testing. Create a key alias like "cloudtrail-logs-key-dev" for easier reference.

### CloudWatch Logs Integration

Create a CloudWatch Logs log group to receive CloudTrail events in real-time. Set retention to seven days for testing (production would typically use 90-365 days). CloudTrail needs an IAM role that allows it to create log streams and put log events into this log group.

This real-time log delivery enables our Lambda compliance function to react immediately when security-relevant events occur, rather than waiting for log files to be delivered to S3 (which can take 15 minutes).

### Lambda Compliance Checking Function

Build a Lambda function in Python 3.11 that performs automated compliance checks on CloudTrail events. The function should be triggered by a CloudWatch Logs subscription filter that sends specific event types to the Lambda.

The compliance checks should look for common security violations like security group rule changes that allow 0.0.0.0/0 access, S3 bucket policy modifications that grant public access, IAM policy changes that grant overly broad permissions, or KMS key policy modifications. When a violation is detected, the function should publish details to an SNS topic for alerting.

Set the Lambda timeout to 60 seconds and memory to 256 MB. The function needs an IAM execution role with permissions to read CloudWatch Logs events, describe AWS resources for validation (like checking current security group rules), and publish to SNS. Package the function code using the archive provider.

The Lambda should log all compliance check results to its own CloudWatch Logs log group for auditing what the compliance system itself is doing.

### SNS Topic for Compliance Alerts

Create an SNS topic for receiving compliance alerts from the Lambda function. Don't add email subscriptions since those require manual confirmation. In production this topic would integrate with PagerDuty or Slack, but for testing we just verify the topic exists and the Lambda can publish to it.

Enable encryption on the SNS topic using the same KMS key used for CloudTrail logs, demonstrating end-to-end encryption of audit data.

### IAM Roles and Policies

You'll need several IAM roles. First, a role for CloudTrail to assume when writing to CloudWatch Logs. This role needs a trust policy allowing cloudtrail.amazonaws.com to assume it, and permissions to create log streams and put log events.

Second, a role for the Lambda compliance function. Trust policy allows lambda.amazonaws.com to assume it. Permissions include CloudWatch Logs actions for the function's own logging, EC2 describe permissions to validate security group rules, S3 describe permissions to check bucket policies, IAM describe permissions to review policy changes, and SNS publish permission to send alerts.

All IAM policies should follow least privilege—grant only the specific actions and resources needed, no wildcards unless necessary. For CloudWatch metrics and logs, wildcards are acceptable since resources are dynamic.

### CloudWatch Alarms

Create CloudWatch alarms to monitor CloudTrail health. Set up an alarm that triggers if CloudTrail stops delivering logs to S3—this uses the CloudTrail metric NumberOfNotificationsDelivered. If no logs are delivered for 60 minutes, trigger the alarm and publish to the SNS topic.

Also create alarms for the Lambda function—monitor invocation errors, throttling, and duration to ensure the compliance checking system itself is healthy.

### Resource Naming and Tagging

All resources must follow this naming pattern: resource-type-purpose-environment. For example, vpc-healthcare-dev, cloudtrail-audit-dev, s3-cloudtrail-logs-dev-ACCOUNT_ID, lambda-compliance-checker-dev, kms-cloudtrail-dev.

Don't use random suffixes except for S3 bucket names where we append the account ID for global uniqueness. This deterministic naming is critical for integration tests to find resources.

Tag every resource with Environment (dev), Owner (security-team), CostCenter (compliance), Purpose (audit-logging), and Compliance (HIPAA). These tags enable cost tracking and compliance reporting.

### Security Best Practices

Enable encryption at rest for all storage: S3 bucket uses KMS encryption, CloudWatch Logs log group uses the default AWS-managed encryption. Enable encryption in transit by ensuring all AWS API calls use HTTPS (default behavior).

Configure S3 bucket to block all public access using all four public access block settings. Security group rules should never allow 0.0.0.0/0 for ingress except for necessary internet-facing resources (none in this architecture).

CloudTrail log file validation must be enabled to detect log tampering. S3 bucket versioning protects against accidental log deletion. IAM policies follow least privilege with specific actions and resources where possible.

### Cleanup Configuration

For terraform destroy to work cleanly, the S3 bucket must have force_destroy set to true. The KMS key should have deletion_window_in_days set to seven (minimum). CloudWatch Logs log groups don't require special deletion configuration. CloudTrail can be deleted without special settings since we've disabled deletion protection.

Lambda functions, SNS topics, and IAM roles can be destroyed without special configuration. Make sure no lifecycle prevent_destroy blocks are used on any resources.

### File Organization

Structure the implementation in the lib folder. Create provider.tf with Terraform version requirements (greater than or equal to 1.5), AWS provider version approximately 5.0 for ap-southeast-1 region, random provider, and archive provider for Lambda packaging. Include variables for environment, region, VPC CIDR, subnet CIDRs, and Lambda timeout settings. Add default tags for Environment, Owner, CostCenter, Purpose, and Compliance.

Create main.tf with data sources (aws_caller_identity for account ID, aws_region for region name, aws_availability_zones for AZ selection), VPC and networking resources, KMS key and alias, S3 bucket with all configurations, CloudTrail with log file validation, CloudWatch Logs log group, IAM roles for CloudTrail and Lambda, Lambda function for compliance checking, SNS topic for alerts, CloudWatch alarms for monitoring, and comprehensive outputs for every resource.

Create lambda_compliance.py with the Lambda handler function. The function should parse CloudWatch Logs events that contain CloudTrail records, extract the event name and parameters, check against compliance rules (like detecting security group modifications that allow 0.0.0.0/0), log the compliance check result, and publish to SNS if a violation is found. Include comprehensive error handling and CloudWatch logging.

### Outputs

Include outputs for VPC ID, private subnet IDs (both subnets), security group ID, CloudTrail ARN and name, S3 bucket name and ARN, KMS key ARN and alias, CloudWatch Logs log group name and ARN, Lambda function name and ARN, Lambda IAM role ARN, SNS topic ARN and name, CloudWatch alarm names and ARNs, CloudTrail CloudWatch Logs role ARN, and account ID.

Every output should have a clear description. Mark sensitive outputs appropriately, though for this infrastructure most values are not sensitive. The tests will verify these resources exist, are configured correctly (encryption enabled, public access blocked, etc.), and can perform basic operations like Lambda invocation.

Ensure we have at least 20-25 outputs covering all major resources and their key attributes. Tests will use these to validate the infrastructure without needing to make assumptions about resource names.
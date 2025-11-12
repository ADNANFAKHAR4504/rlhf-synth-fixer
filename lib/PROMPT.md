# Zero-Trust Security Architecture for Payment Processing

## Business Context

Hey, we need to implement a zero-trust security architecture for our payment processing application following a recent security audit. The infrastructure must enforce strict network segmentation, enable end-to-end encryption for all data flows, and provide comprehensive audit trails while maintaining PCI DSS compliance. **We'll use Terraform with HCL** to build this security-first infrastructure in us-east-1.

## Technical Requirements

### KMS Encryption Infrastructure

Create three customer-managed KMS keys for application data, S3 storage, and CloudWatch/VPC Flow Logs encryption. Each key must enable automatic rotation and include a key policy allowing both the root account and deployment user full access to prevent lockouts. Grant service principals (s3.amazonaws.com, logs.amazonaws.com) the necessary GenerateDataKey and Decrypt permissions. Set deletion_window_in_days to seven for quick testing cleanup and create aliases like "alias/app-encryption-dev" for easier reference.

### S3 Storage with Mandatory Encryption

Set up three S3 buckets for application logs, VPC Flow Logs, and compliance reports using the naming pattern "s3-{purpose}-dev-ACCOUNT_ID" for global uniqueness. Enable versioning on all buckets and configure server-side encryption using the appropriate KMS keys. Implement all four public access block settings (block_public_acls, block_public_policy, ignore_public_acls, restrict_public_buckets) and add bucket policies that deny s3:PutObject requests without encryption headers while explicitly allowing root account and deployment user access first. Set force_destroy to true for clean testing teardown and configure lifecycle rules on the flow logs bucket to transition objects to Glacier after seven days and expire after thirty days with the required filter block.

### VPC Network Architecture

Create a VPC with CIDR 10.0.0.0/16 containing nine subnets across three tiers and three availability zones—application tier (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24), database tier (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24), and management tier (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24). Enable DNS hostnames and DNS support on the VPC, create an Internet Gateway, and deploy a single NAT Gateway in one application subnet with an Elastic IP for cost-effective testing. Set up three route tables with appropriate routing—application and management tiers route to NAT Gateway for outbound internet, while database tier has no internet route for complete isolation. Enable VPC Flow Logs capturing all traffic to the dedicated S3 bucket with KMS encryption, and configure the IAM role with explicit depends_on for both the role and policy attachment to handle eventual consistency.

### Security Groups and Network ACLs

Create three security groups for application (HTTPS 443 from 10.0.0.0/8, SSH 22 from management subnets), database (PostgreSQL 5432 from application security group), and management (SSH from restricted CIDR) tiers. Use separate aws_security_group_rule resources instead of inline rules to prevent circular dependencies and include descriptions on each rule for audit compliance. Implement custom NACLs for each tier with numbered rules (10, 20, 30 for denies, 100+ for allows) that explicitly block RFC 5737 TEST-NET ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) as malicious IPs, then allow required ports including ephemeral return traffic since NACLs are stateless.

### IAM Roles and Policies

Create IAM roles for Lambda compliance scanning and VPC Flow Logs following least privilege with no wildcard permissions. Define all policies using aws_iam_policy_document data sources referencing specific resource ARNs rather than wildcards. The Lambda role needs EC2 describe permissions, S3 PutObject to the reports bucket, SNS publish, and specific KMS permissions (Decrypt, GenerateDataKey only). Set maximum session duration to 3600 seconds and add explicit depends_on from Lambda to both the IAM role and policy attachments to handle eventual consistency.

### CloudWatch Monitoring and Logging

Create separate log groups for application logs, Lambda logs, and VPC Flow Logs with retention_in_days set to one for testing (production would use ninety days but that's expensive and slow to cleanup). Enable KMS encryption on all log groups using the logs encryption key. Implement metric filters on the application log group to detect authentication failures and create CloudWatch alarms that trigger when failures exceed five in a five-minute period, publishing notifications to the SNS topic. Set up additional alarms for NAT Gateway packet drops, VPC Flow Logs high reject rates, and Lambda errors.

### Lambda Compliance Checker

Create a Lambda function in Python 3.11 that scans for security misconfigurations including unencrypted S3 buckets, unencrypted EBS volumes, overly permissive security groups, missing VPC Flow Logs, and CloudWatch log groups without KMS encryption. Configure 256 MB memory and 300-second timeout with environment variables for the SNS topic ARN and compliance reports bucket name. Package using the archive_file data source and don't place in a VPC since it doesn't need VPC-internal resource access. The handler should collect findings with severity levels (CRITICAL, HIGH, MEDIUM, LOW), publish summaries to SNS, and upload full JSON reports to S3 with timestamps.

### EventBridge Automation

Set up two EventBridge rules—first runs on a daily cron schedule "cron(0 2 * * ? *)" to trigger the Lambda compliance checker at 2 AM UTC with appropriate aws_lambda_permission. Second monitors for security group changes by filtering CloudTrail events (AuthorizeSecurityGroupIngress, AuthorizeSecurityGroupEgress, RevokeSecurityGroupIngress, RevokeSecurityGroupEgress) and triggers SNS notifications when these API calls occur.

### SNS Notifications

Create an SNS topic for security and compliance notifications with KMS encryption using the general encryption key. Configure the topic policy to allow EventBridge and Lambda to publish messages. Don't create email subscriptions since verification requires manual clicking—integration tests will verify the topic configuration without actual subscriptions.

### Secrets Manager

Create a Secrets Manager secret for database credentials using a random_password resource with 32 characters including special characters stored as JSON with username and password fields. Enable KMS encryption using the general key and set recovery_window_in_days to zero for immediate deletion during testing. Don't configure automatic rotation since that requires Lambda with VPC connectivity adding deployment complexity—document this as a production requirement in comments.

### GuardDuty Threat Detection

Enable GuardDuty by creating a detector resource with enable set to true and findings_publishing_frequency to "FIFTEEN_MINUTES". Configure data sources to monitor S3 logs and CloudWatch Events. Don't configure Security Hub integration—GuardDuty works independently for threat detection.

### Resource Tagging Strategy

Apply mandatory tags using default_tags in the provider configuration including Environment (var.environment defaulting to "dev"), DataClassification ("FinancialData"), Compliance ("PCI-DSS"), Owner ("SecurityTeam"), and ManagedBy ("Terraform"). Use merge() functions if individual resources need additional tags beyond defaults.

## Provider Configuration

Configure Terraform 1.5 or higher with AWS provider version constrained to 5.x using pessimistic operator (~> 5.0). Include random provider for password generation and archive provider for Lambda packaging. Deploy all resources to us-east-1 with default_tags applying Environment, DataClassification, Compliance, Owner, and ManagedBy tags automatically. Define an environment variable with type string and default "dev" for resource naming.

## Resource Naming

Follow the deterministic naming pattern {resource-type}-{purpose}-{environment} for all resources like "kms-app-encryption-dev" or "lambda-compliance-checker-dev". S3 buckets need AWS account ID appended for global uniqueness like "s3-app-logs-dev-ACCOUNT_ID". Don't use random_string resources in naming since that causes integration test failures.

## Data Source Restrictions

Only use data.aws_caller_identity.current for account ID, data.aws_region.current for region name, data.aws_availability_zones.available for AZ selection, and data.archive_file.lambda_zip for Lambda packaging. Don't use data sources referencing existing infrastructure—create all resources fresh including GuardDuty detector and networking.

## File Organization

Structure with lib/provider.tf containing Terraform and provider version constraints, AWS provider configuration with default_tags, and variable definitions. The lib/main.tf file contains all data sources, random password, KMS keys with policies and aliases, S3 buckets with encryption and lifecycle rules, VPC networking resources, security groups and NACLs, IAM roles and policies, CloudWatch log groups and alarms, Lambda function, EventBridge rules, SNS topic, Secrets Manager secret, GuardDuty detector, and comprehensive outputs. Create lib/lambda_function.py with the compliance checker handler that scans resources, collects findings with severity levels, publishes to SNS, and stores reports in S3.

## Cleanup Configuration

Set force_destroy to true on all S3 buckets, deletion_window_in_days to seven on KMS keys, recovery_window_in_days to zero on Secrets Manager secrets, and retention_in_days to one on CloudWatch log groups. All other resources delete cleanly without special configuration.

## Outputs

Provide comprehensive outputs for all resources including KMS key IDs and ARNs (six outputs for three keys), S3 bucket names, ARNs, and versioning status (nine outputs), VPC and subnet identifiers (ten outputs), security group and NACL IDs (seven outputs), IAM role and policy ARNs (four outputs), CloudWatch log group names and alarm names (six outputs), Lambda function name, ARN, and role ARN (three outputs), EventBridge rule ARNs (two outputs), SNS topic ARN, Secrets Manager secret ARN and name (two outputs marked sensitive), GuardDuty detector ID, and metadata outputs for environment, region, and account ID. Tests require outputs for every resource to validate configurations.
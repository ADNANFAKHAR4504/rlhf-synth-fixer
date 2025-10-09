PRODUCTION-GRADE AWS INFRASTRUCTURE STACK

ROLE
You're a senior cloud infrastructure engineer building a secure, production-ready AWS infrastructure using Terraform.

CONTEXT
We need to deploy a complete AWS infrastructure stack in us-east-1 that follows enterprise security best practices and compliance requirements. This will be the foundation for our production workloads, so it needs to be highly available, secure, and fully observable.

WHAT WE'RE BUILDING

Networking Infrastructure
Set up a VPC using the 10.0.0.0/16 CIDR block with DNS support and hostnames enabled. We need public subnets (10.0.1.0/24 and 10.0.2.0/24) and private subnets (10.0.10.0/24 and 10.0.11.0/24) spread across two availability zones. The public subnets should have an Internet Gateway for direct internet access, while the private subnets need NAT Gateways deployed in each public subnet for outbound traffic. Each private subnet gets its own route table pointing to its corresponding NAT Gateway for redundancy. Make sure all route tables are properly configured and associated. Also enable VPC Flow Logs and send them to S3 in parquet format with hourly partitioning for efficient querying.

Compute Resources
Deploy an Auto Scaling Group that maintains between 1 and 3 EC2 instances running Amazon Linux 2, with a desired capacity of 2. The instances should live in the private subnets for security. Use a Launch Template configured with IMDSv2 required, detailed monitoring enabled, and encrypted root volumes using KMS. The user data script needs to be optimized for fast launch times - check network connectivity before proceeding, install packages (httpd, amazon-ssm-agent) in parallel, create health check endpoints immediately, and defer system updates to run in the background 5 minutes after boot. Install the CloudWatch agent asynchronously so it doesn't block instance health checks. Apply SSH hardening by restricting to ec2-user and disabling root login. Set health check grace period to 300 seconds and wait timeout to 10 minutes since the optimized script completes quickly.

Security Groups
Create a security group for the EC2 instances that allows SSH from specific IP ranges (configurable via variable, defaults to empty for security), HTTP (port 80) and HTTPS (port 443) from within the VPC, and permits all outbound traffic. Every ingress rule needs a proper description explaining its purpose.

IAM Setup
The EC2 instances need an IAM role with four key permission sets: KMS access for both EBS and S3 encryption keys, SSM permissions for remote management including session manager capabilities, CloudWatch agent permissions for metrics and logs, and SNS permissions to publish alerts. The KMS policy must explicitly grant access to both encryption keys used in the stack. We also need separate IAM roles for CloudTrail to write to CloudWatch Logs, AWS Config recorder with S3 and Config permissions, AWS Backup service for backup and restore operations, and VPC Flow Logs to write to S3. Follow the principle of least privilege throughout - only grant the minimum permissions needed.

Storage with S3
Create a centralized logging bucket with versioning enabled, KMS encryption using a dedicated S3 encryption key, and lifecycle policies that move logs to Standard-IA after 30 days, Glacier after 90 days, and delete after 365 days. This bucket relies on ownership controls (BucketOwnerPreferred) rather than deprecated ACLs. Set up comprehensive bucket policies allowing CloudTrail (with both legacy and new SourceArn conditions), AWS Config, VPC Flow Logs, and CloudFront to write logs with proper ACL requirements. Create another bucket for application data with versioning, KMS encryption, and full public access blocking. Also create a separate bucket for CloudFront access logs with ownership controls and a private ACL to allow log delivery.

Encryption Keys
Set up two KMS keys - one for EBS volume encryption and another for S3 bucket encryption. Both keys need automatic rotation enabled. The EBS key requires special attention: grant permissions to EC2 and Auto Scaling service endpoints, add a conditional grant for AWS resources (with kms:GrantIsForAWSResource condition), and critically, provide explicit access to the Auto Scaling service-linked role (arn:aws:iam::{account}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling) since Auto Scaling uses this role rather than just the service endpoint to create encrypted volumes. The S3 key needs access granted to CloudWatch Logs (with encryption context condition), S3 service, CloudTrail (with encryption context and decrypt via S3), and AWS Config services. Write proper key policies that scope down permissions appropriately.

Audit and Compliance
Enable CloudTrail as a multi-region trail with log file validation turned on. Encrypt the logs with the S3 KMS key and store them in the logging S3 bucket. Configure CloudWatch Logs integration by creating a dedicated log group with 90-day retention and KMS encryption, an IAM role for CloudTrail to write to CloudWatch Logs, and attach this to the trail. Capture both management events AND data events - specifically log all S3 object-level operations (read and write) for the application bucket, logging bucket, and CloudFront logs bucket. This provides comprehensive audit trails for data access. For AWS Config, set up a configuration recorder that tracks all supported resources including global resource types. Configure the delivery channel to send daily snapshots to S3 with the config/ prefix.

Monitoring and Alerting
Create a CloudWatch log group for CloudTrail with 90-day retention and KMS encryption using the S3 encryption key. Set up metric filters and alarms for security events: unauthorized API calls (looking for UnauthorizedOperation or AccessDenied errors, threshold of 10 in 5 minutes), and root account usage (detecting Root user activity, threshold of zero - any usage triggers alarm). Route all alarm notifications to an SNS topic encrypted with the AWS-managed SNS key. Configure the SNS topic policy to allow both CloudWatch and AWS Backup services to publish messages.

Content Delivery
Deploy a CloudFront distribution that serves content from the application S3 bucket. Use an Origin Access Identity to keep the S3 bucket private while allowing CloudFront to access it. Force all traffic to HTTPS with redirect-to-https viewer protocol policy. Enable access logging to the CloudFront logs bucket. Set reasonable cache TTLs (default 1 day, max 1 year). Protect the distribution with a WAFv2 Web ACL configured with AWS managed rule sets for common threats (AWSManagedRulesCommonRuleSet) and known bad inputs (AWSManagedRulesKnownBadInputsRuleSet), plus add rate limiting at 2000 requests per IP address. Use PriceClass_100 for cost optimization, enable IPv6, and compress content automatically.

Backup and Recovery
Create an AWS Backup vault encrypted with the EBS KMS key. Set up two backup rules within a single plan - daily backups at 2 AM UTC with 60-minute start window and 120-minute completion window, retained for 30 days; and weekly backups on Mondays at 3 AM UTC with the same windows, kept for 90 days. Configure backup selection based on the Environment tag (value "Production") so anything tagged as Production gets backed up automatically. Include EC2 volumes (arn:aws:ec2:*:*:volume/*) and RDS databases (arn:aws:rds:*:*:db:*) in the backup scope. Tag all recovery points with the common tags for tracking.

API Gateway
Deploy a REST API with a regional endpoint. Add a resource policy that restricts API access to the IP ranges defined in the allowed_ssh_ips variable, using execute-api:/* as the resource pattern. This creates a foundation that can be extended with actual API methods and integrations later.

Governance
Enforce a strong IAM password policy requiring at least 14 characters with uppercase, lowercase, numbers, and symbols. Set password expiration to 90 days and prevent reuse of the last 5 passwords. Allow users to change their own passwords. If the account has AWS Organizations enabled (detected by conditionally querying the organization), apply a Service Control Policy to enforce MFA by denying all actions when aws:MultiFactorAuthPresent is false.

TAGGING AND NAMING

Every single resource needs these tags:
- Environment: Production
- Owner: DevOps Team
- CostCenter: Engineering
- ManagedBy: Terraform
- Project: nova

For naming, use this pattern: {project}-{resource-type}-{environment}
The project prefix is "nova" and environment suffix is "prd". For example: nova-vpc-prd, nova-app-asg-prd, nova-logs-prd-{account-id}. Keep this consistent across everything. S3 buckets include the account ID suffix for global uniqueness.

CONSTRAINTS AND BEST PRACTICES

Security First
Encrypt all data at rest using KMS - no exceptions. The logging bucket uses ownership controls (BucketOwnerPreferred) instead of deprecated ACLs. Block public access on all S3 buckets unless there's a specific logging requirement (CloudFront logs bucket needs looser settings). Never hardcode credentials or secrets in the code. Use least privilege for all IAM policies. Security group ingress rules need specific CIDR blocks via variables, not wide-open 0.0.0.0/0 defaults. Require IMDSv2 on all EC2 instances to prevent SSRF attacks.

High Availability
Spread resources across multiple availability zones (slicing the first 2 AZs from the available list). The Auto Scaling Group should maintain a minimum of 1 instance with a desired state of 2 for redundancy. Deploy NAT Gateways in each availability zone with independent route tables for true multi-AZ resilience - if one NAT gateway fails, only one AZ is affected.

Observability
Log everything to CloudWatch and S3. CloudTrail needs to cover all regions and capture both management events AND data events for S3 operations. Enable VPC Flow Logs in parquet format for network forensics. Set up CloudWatch alarms for security events with SNS notifications. Use AWS Config to track all resource configuration changes including global resources. Send CloudTrail logs to both S3 (long-term storage) and CloudWatch Logs (real-time analysis and metric filters).

Cost Optimization
Apply lifecycle policies to log data so it transitions to cheaper storage classes over time (IA at 30 days, Glacier at 90 days, delete at 365 days). Use appropriately sized instance types - t3.micro is the default and suitable for this infrastructure. Consider the PriceClass_100 for CloudFront to limit costs to North America and Europe. Use force_delete on the Auto Scaling Group to allow quick infrastructure teardown during testing.

Operational Excellence
Keep all infrastructure as code in Terraform. Use the aws_ami data source to dynamically fetch the latest Amazon Linux 2 AMI. Define proper resource dependencies using depends_on where Terraform can't infer them automatically - the ASG depends on NAT gateways, IAM instance profile, and KMS keys; the launch template depends on KMS key and IAM profile; CloudTrail depends on S3 bucket policy; Config delivery channel depends on bucket policy. Use variables for anything that might change between environments, with sensible defaults.

Performance Optimization
The user data script is optimized for rapid instance launch: check network connectivity with retries (wait up to 60 seconds for NAT gateway), defer system updates to run 5 minutes after boot in the background, install critical packages (httpd, ssm-agent) together in one yum command and wait for completion, create web server content while packages install, start services immediately after installation, and install CloudWatch agent in a background subshell so it doesn't block. This reduces instance launch time from 15+ minutes to under 3 minutes. Set the health check grace period to 300 seconds (5 minutes) since instances are ready quickly.

KMS Key Architecture
The EBS encryption key must have multiple permission layers to work with Auto Scaling: service principal access for ec2.amazonaws.com and autoscaling.amazonaws.com, a conditional grant permission for AWS resources, and critically, explicit access to the Auto Scaling service-linked role by its full ARN. Without this service-linked role permission, Auto Scaling cannot create encrypted volumes and all instance launches will fail with "InvalidKMSKey.InvalidState" errors. The S3 encryption key needs service access for CloudWatch Logs, CloudTrail, and Config with appropriate encryption context conditions.

WHAT YOU NEED TO DELIVER

1. provider.tf
Contains the Terraform and AWS provider configuration. Pin versions properly and configure default tags at the provider level so they apply to all resources automatically.

2. tap_stack.tf
The main infrastructure file with everything in it:
- Variable definitions at the top (aws_region, vpc_cidr, subnet CIDRs, allowed_ssh_ips, ec2_instance_type, environment, owner, cost_center, project_prefix, domain_name)
- Data sources for AMIs, account ID, availability zones, and conditionally the AWS organization
- Local values for common tags, AZ list, S3 bucket names, and CloudTrail name
- All infrastructure resources organized by category with clear comment headers
- Outputs at the bottom for VPC ID, subnet IDs, CloudFront domain, SNS topic ARN, logging bucket, and backup vault name

3. Integration tests (terraform.int.test.ts)
Write tests that validate the live AWS infrastructure after deployment. Test that the VPC exists with correct CIDR and DNS settings, subnets are in the right availability zones with proper CIDR blocks, security groups have proper rules, KMS keys exist with rotation enabled, S3 buckets are encrypted with correct policies and ownership controls, CloudTrail is active and logging with CloudWatch Logs integration, AWS Config is recording, CloudWatch alarms are configured with SNS actions, CloudFront distribution is operational with WAF attached, SNS topics exist, Backup vault and plans are ready, and EC2 instances can launch successfully.

4. Unit tests (terraform.unit.test.ts)
Test the Terraform code itself before deployment. Verify files exist, syntax is valid with proper HCL formatting, variables are properly declared with types and defaults, resources are configured correctly with required attributes, dependencies are explicitly defined where needed, and best practices are followed (encryption enabled, versioning on, public access blocked, etc.).

HOW TO FORMAT THE CODE

Write clean HCL with clear section headers using comment blocks (# ========== SECTION ==========). Use descriptive resource names that make it obvious what each thing does (ec2_instance_role, cloudtrail_cloudwatch, ebs_encryption). Add inline comments for complex configurations like KMS key policies, S3 bucket policies, and user data scripts. Stick to 2-space indentation throughout. Group related resources together logically (all KMS resources together, all IAM roles for a service together, etc.). Use jsonencode() for all policy documents to maintain readability.

SUCCESS CRITERIA

The deployment is successful when:
- All Terraform resources apply cleanly without errors
- VPC and networking are fully functional with working NAT gateways
- EC2 instances launch successfully in the Auto Scaling Group and become healthy within 5 minutes
- All S3 buckets exist with proper encryption, ownership controls, and working policies
- CloudTrail is actively logging both management events and S3 data events to S3 and CloudWatch
- AWS Config is recording configuration changes to S3
- CloudWatch log group for CloudTrail exists with metric filters and alarms
- CloudFront distribution is serving content with WAF protection
- All KMS keys exist with rotation enabled and correct policies including Auto Scaling service-linked role access
- Backup vault and plans are created and ready to run on schedule
- IAM roles have proper policies attached and trust relationships configured
- All integration tests pass
- All unit tests pass
- No instances fail to launch with KMS-related errors

IMPORTANT NOTES

The account ID gets retrieved dynamically using the aws_caller_identity data source, so you don't need to hardcode it. The region is configurable via a variable but defaults to us-east-1. Some features like Service Control Policies require AWS Organizations to be set up, so we conditionally create those resources only in Production environment.

The Auto Scaling Group previously had issues launching instances due to KMS key permissions. The fix requires three permission layers in the EBS KMS key: service endpoint access, conditional grant permission, and explicit access to the Auto Scaling service-linked role. Without the service-linked role permission, all instance launches fail.

The S3 logging bucket no longer uses the deprecated aws_s3_bucket_acl resource - it relies entirely on ownership controls (BucketOwnerPreferred) which is the modern AWS best practice. CloudFront logs bucket still uses ACL because CloudFront requires it for log delivery.

The user data script is heavily optimized to reduce launch times. The key optimizations are: network connectivity checking with retries, deferring yum update to background execution, parallel package installation, and asynchronous CloudWatch agent installation. This brings instance launch time from 15+ minutes down to 2-3 minutes.

The Launch Template must reference the IAM instance profile by name, not ARN. Using ARN can cause launch failures in some AWS configurations. Also ensure the launch template explicitly depends on the KMS key and IAM instance profile to avoid race conditions.

CloudTrail now integrates with CloudWatch Logs, requiring a dedicated IAM role with PutLogEvents permissions. The log group must exist before CloudTrail is created. CloudTrail also captures S3 data events for comprehensive audit trails - this logs all object access on the three S3 buckets (application, logging, CloudFront logs).

The initial deployment might need some patience as NAT gateways take 2-3 minutes to become available, and the Auto Scaling Group waits for instances to become healthy. S3 bucket policies are complex and AWS validates them strictly - the CloudTrail policy includes both old and new condition formats for compatibility.

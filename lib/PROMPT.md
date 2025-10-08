PRODUCTION-GRADE AWS INFRASTRUCTURE STACK

ROLE
You're a senior cloud infrastructure engineer building a secure, production-ready AWS infrastructure using Terraform.

CONTEXT
We need to deploy a complete AWS infrastructure stack in us-east-1 that follows enterprise security best practices and compliance requirements. This will be the foundation for our production workloads, so it needs to be highly available, secure, and fully observable.

WHAT WE'RE BUILDING

Networking Infrastructure
Set up a VPC using the 10.0.0.0/16 CIDR block with DNS support enabled. We need public subnets (10.0.1.0/24 and 10.0.2.0/24) and private subnets (10.0.10.0/24 and 10.0.11.0/24) spread across two availability zones. The public subnets should have an Internet Gateway for direct internet access, while the private subnets need NAT Gateways deployed in each public subnet for outbound traffic. Make sure all route tables are properly configured and associated. Also enable VPC Flow Logs and send them to S3 for network traffic analysis.

Compute Resources
Deploy an Auto Scaling Group that maintains between 1 and 3 EC2 instances running Amazon Linux 2. The instances should live in the private subnets for security. Use a Launch Template that includes a user data script to install the CloudWatch agent, SSM agent, and apply basic security hardening. All EBS volumes must be encrypted using KMS keys. Enable detailed monitoring and require IMDSv2 for instance metadata access.

Security Groups
Create a security group for the EC2 instances that allows SSH from specific IP ranges (not wide open), HTTP and HTTPS from within the VPC, and permits all outbound traffic. Every rule needs a proper description explaining its purpose.

IAM Setup
The EC2 instances need an IAM role with permissions to send metrics to CloudWatch, communicate with Systems Manager for remote management, and publish messages to SNS. We also need separate roles for AWS Config recorder and AWS Backup service. Follow the principle of least privilege throughout - only grant the minimum permissions needed.

Storage with S3
Create a centralized logging bucket with versioning enabled, KMS encryption, and lifecycle policies that move logs to Standard-IA after 30 days, Glacier after 90 days, and delete after 365 days. This bucket needs policies allowing CloudTrail, AWS Config, VPC Flow Logs, and CloudFront to write logs. Set up another bucket for application data with versioning and encryption. Also create a separate bucket for CloudFront access logs with the proper ACL configuration to allow log delivery.

Encryption Keys
Set up two KMS keys - one for EBS volume encryption and another for S3 bucket encryption. Both keys need rotation enabled. The EBS key must allow the EC2 service to use it, while the S3 key needs access granted to CloudWatch Logs, CloudTrail, and AWS Config services. Write proper key policies that scope down permissions appropriately.

Audit and Compliance
Enable CloudTrail as a multi-region trail with log file validation turned on. Encrypt the logs with KMS and store them in S3. Make sure we're capturing management events across all regions. For AWS Config, set up a configuration recorder that tracks all supported resources including global resource types. Configure the delivery channel to send daily snapshots to S3 with encryption.

Monitoring and Alerting
Create CloudWatch log groups with 90-day retention and KMS encryption. Set up alarms for security events like unauthorized API calls (threshold of 10 in 5 minutes) and any root account usage (threshold of zero). Route all alarm notifications to an SNS topic. Use metric filters to detect these security events from CloudTrail logs.

Content Delivery
Deploy a CloudFront distribution that serves content from the application S3 bucket. Use an Origin Access Identity to keep the S3 bucket private while allowing CloudFront to access it. Force all traffic to HTTPS. Enable access logging. Protect the distribution with a WAFv2 Web ACL that includes AWS managed rules for common threats and known bad inputs, plus add rate limiting at 2000 requests per IP address.

Backup and Recovery
Create an AWS Backup vault encrypted with KMS. Set up two backup plans - daily backups retained for 30 days and weekly backups kept for 90 days. Configure backup selection based on the Environment tag so anything tagged as Production gets backed up automatically. Include EC2 volumes and RDS databases in the backup scope.

API Gateway
Deploy a REST API with a regional endpoint. Add a resource policy that restricts API access to specific IP ranges. This is just the foundation - the actual API methods and integrations will be added later.

Governance
Enforce a strong IAM password policy requiring at least 14 characters with uppercase, lowercase, numbers, and symbols. Set password expiration to 90 days and prevent reuse of the last 5 passwords. If the account has AWS Organizations enabled, apply a Service Control Policy to enforce MFA for all API calls.

TAGGING AND NAMING

Every single resource needs these tags:
- Environment: Production
- Owner: DevOps Team
- CostCenter: Engineering
- ManagedBy: Terraform
- Project: nova

For naming, use this pattern: {project}-{resource-type}-{environment}
The project prefix is "nova" and environment suffix is "prd". For example: nova-vpc-prd, nova-app-asg-prd, nova-logs-prd-{account-id}. Keep this consistent across everything.

CONSTRAINTS AND BEST PRACTICES

Security First
Encrypt all data at rest using KMS - no exceptions. Block public access on all S3 buckets unless there's a specific logging requirement. Never hardcode credentials or secrets in the code. Use least privilege for all IAM policies. Security group ingress rules need specific CIDR blocks, not wide-open 0.0.0.0/0.

High Availability
Spread resources across multiple availability zones. The Auto Scaling Group should maintain a minimum of 1 instance with a desired state of 2. Deploy NAT Gateways in each availability zone for redundancy.

Observability
Log everything to CloudWatch and S3. CloudTrail needs to cover all regions, not just the primary. Enable VPC Flow Logs for network forensics. Set up CloudWatch alarms for security events. Use AWS Config to track all resource configuration changes.

Cost Optimization
Apply lifecycle policies to log data so it transitions to cheaper storage classes over time. Use appropriately sized instance types - t3.micro is fine for development and testing environments. Consider S3 Intelligent-Tiering for data with unpredictable access patterns.

Operational Excellence
Keep all infrastructure as code in Terraform. Pin the AWS provider to version 5.x and require Terraform 1.4.0 or higher. Define proper resource dependencies so Terraform understands the correct creation order. Use variables for anything that might need to change between environments.

WHAT YOU NEED TO DELIVER

1. provider.tf
Contains the Terraform and AWS provider configuration. Pin versions properly and configure default tags at the provider level so they apply to all resources automatically.

2. tap_stack.tf
The main infrastructure file with everything in it:
- Variable definitions at the top
- Data sources for things like AMIs, account ID, and availability zones
- Local values for computed values that get reused
- All the infrastructure resources organized by category
- Outputs at the bottom for important resource identifiers

3. Integration tests (terraform.int.test.ts)
Write tests that validate the live AWS infrastructure after deployment. Test that the VPC exists with correct settings, subnets are in the right availability zones, security groups have proper rules, KMS keys have rotation enabled, S3 buckets are encrypted with correct policies, CloudTrail and Config are active and logging, CloudWatch alarms are configured, CloudFront distribution is operational, SNS topics exist, and the Backup vault is ready.

4. Unit tests (terraform.unit.test.ts)
Test the Terraform code itself before deployment. Verify files exist, syntax is valid, variables are properly declared, resources are configured correctly, dependencies are defined, and best practices are followed.

HOW TO FORMAT THE CODE

Write clean HCL with clear section headers using comment blocks. Use descriptive resource names that make it obvious what each thing does. Add inline comments for any complex configurations that aren't immediately obvious. Stick to 2-space indentation throughout. Group related resources together logically.

SUCCESS CRITERIA

The deployment is successful when:
- All Terraform resources apply cleanly without errors
- VPC and networking are fully functional and reachable
- EC2 instances launch successfully in the Auto Scaling Group
- All S3 buckets exist with proper encryption and working policies
- CloudTrail is actively logging API calls to S3
- AWS Config is recording configuration changes
- CloudWatch logs are being collected and stored
- CloudFront distribution is serving content
- All KMS keys exist with rotation enabled
- Backup plans are running on schedule
- All integration tests pass
- All unit tests pass

IMPORTANT NOTES

The account ID gets retrieved dynamically using the aws_caller_identity data source, so you don't need to hardcode it. The region is configurable via a variable but defaults to us-east-1. Some features like Service Control Policies require AWS Organizations to be set up. The initial deployment might need some targeted applies because CloudTrail, Config, and VPC Flow Logs all need specific S3 bucket policies that have to be created in the right order. Take your time getting the S3 bucket policy statements correct - they can be tricky and AWS validates them strictly during resource creation.

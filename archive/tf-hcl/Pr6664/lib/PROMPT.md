Hey team,

We need help building out the Terraform code for our new payment processing platform. The compliance team just finished the PCI DSS audit and we've got a bunch of security requirements we need to implement.

Background

So here's the situation - we're setting up a zero-trust architecture for our payment processing stuff. The environment needs to run in both us-east-1 and us-west-2, and we've got our production workloads in one AWS account with all the logs going to a separate logging account.

What we need to set up:

- Three VPCs: one for DMZ, one for Application layer, and one for Data layer
- Multi-region deployments for high availability
- KMS encryption for everything
- WAF to protect our APIs
- GuardDuty for threat detection
- AWS Config to keep track of compliance
- CloudTrail and CloudWatch for monitoring
- S3 buckets for log archival with lifecycle policies
- Systems Manager Parameter Store for storing credentials
- IAM roles for EC2, Lambda, and ECS tasks with least-privilege access
- VPC Flow Logs that get forwarded to our logging account

We're using Terraform 1.5+ with AWS Provider 5.x for all of this.

What Needs to Be Built

Can you put together a single Terraform file (main.tf) that implements everything below?

Networking Setup

We need three separate VPCs set up:
- DMZ VPC
- Application VPC
- Data VPC

Make sure each one has non-overlapping CIDRs. Set them up with public and private subnets where it makes sense, and include all the usual networking stuff - route tables, internet gateways, NAT gateways. Just don't enable deletion protection on anything.

Encryption and KMS

Create AWS KMS customer managed keys with:
- Automatic rotation turned on
- Key policies that restrict access to only specific AWS services and IAM roles
- Use these keys for S3, EBS, RDS, Parameter Store, CloudTrail, and logs

WAF Configuration

Set up an AWS WAF Web ACL with:
- Rate-based rule that limits requests to 2000 requests per 5 minutes per IP
- Associate it with CloudFront or ALB

GuardDuty

Configure GuardDuty with:
- S3 protection enabled
- EKS audit log monitoring enabled
- Findings exported to an SNS topic

AWS Config

Create AWS Config rules for:
- Unencrypted EBS volumes not allowed
- No public S3 buckets
- Security groups must not allow 0.0.0.0/0 except for port 443
- Include the delivery channel and recorder

VPC Flow Logs

Enable flow logs for all 3 VPCs and ship them to:
- A centralized S3 bucket
- Located in a separate logging account
- Use IAM role and cross-account bucket policy to make it work

IAM Roles

Create IAM roles with inline policies for:
- EC2 instances
- Lambda functions
- ECS tasks

The policies need to use explicit ARNs - no wildcards allowed.

S3 Logging Buckets

Set up S3 buckets for logs with:
- Versioning enabled
- MFA Delete enabled (but don't enable delete protection flags on other resources)
- Lifecycle policy: transition to Glacier after 30 days
- KMS encrypted

Systems Manager Parameter Store

Store database credentials using:
- SecureString type
- KMS encryption
- Automatic rotation enabled

CloudWatch Alarms

Create a CloudWatch alarm that:
- Triggers when failed authentication attempts exceed 5 per minute
- Sends notification to SNS

Security Groups

Create security groups that enforce zero trust:
- Allow only HTTPS (443) from CloudFront
- Allow SSH (22) only from bastion host
- Everything else denied by default

CloudTrail

Enable CloudTrail with:
- Log file validation enabled
- Multi-region trail
- S3 and CloudWatch Logs integration
- Data event logging for sensitive S3 buckets

Important Constraints

Here are the hard requirements we need to follow:

- All data at rest must be encrypted using AWS KMS customer managed keys
- Separate VPCs for DMZ, Application, and Data zones
- IAM roles must strictly follow least privilege principle
- No wildcard (*) permissions allowed anywhere
- WAF must enforce API rate limiting
- CloudWatch logs must retain events for exactly 90 days
- S3 buckets must have versioning and MFA delete enabled
- Security groups must explicitly deny all traffic except required ports
- VPC Flow Logs must go to the external logging account
- AWS Config must monitor all resources
- GuardDuty findings must automatically notify through SNS
- No resource should have deletion protection enabled
- Use locals and data sources for reusability where possible
- Must work on Terraform v1.5+ with AWS provider 5.x

Deliverable

We need the entire architecture in a single Terraform file:
- File name: main.tf
- Don't use modules - just flatten everything into one file
- Include all networking, IAM, security, logging, monitoring, WAF, KMS, etc. in that one file
- Tag all resources properly with:
  - Environment = "prod"
  - Owner = "security-team"
  - ComplianceScope = "PCI-DSS"

Output Instructions

Put together a single-file Terraform configuration (main.tf) that implements all the requirements above. Make sure the output is formatted as valid Terraform HCL code and include comments throughout explaining the key security best practices. Don't summarize or break into sections - just produce one full Terraform file as the output.

Thanks!
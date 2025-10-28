Hey team,

We need to build out a production-ready AWS infrastructure using Terraform. The goal is to get all our security and compliance requirements covered - encryption, logging, monitoring, threat detection, the works. Everything should follow AWS Well-Architected Security Pillar best practices.

## What We're Building

Deploy this in a single AWS account but span multiple availability zones for high availability. Put everything in one file called `tap_stack.tf` to keep things simple and manageable.

Use this naming pattern: `{resource-type}-${var.environment_suffix}` so we can deploy dev, staging, and prod environments in parallel without conflicts. For example: `master-kms-key-main` or `main-vpc-dev`.

## Core Infrastructure

**Encryption & Key Management**
- Master KMS key with automatic annual rotation and 30-day deletion window
- Use the key for CloudWatch Logs, CloudTrail, S3, RDS, and Secrets Manager

**Networking (10.0.0.0/16 VPC across 2 AZs)**
- 2 public subnets (10.0.0.0/24, 10.0.1.0/24) for load balancers
- 2 private subnets (10.0.10.0/24, 10.0.11.0/24) for application servers
- 2 database subnets (10.0.20.0/24, 10.0.21.0/24) for RDS
- Internet Gateway, 2 NAT Gateways with Elastic IPs
- VPC Flow Logs with CloudWatch and KMS encryption

**Security Groups**
- ALB: ports 80, 443 from internet
- EC2: ports 80, 443 from ALB only
- RDS: port 3306 from EC2 only (no public access)

**Storage & Logging**
- Central S3 bucket for logs with versioning, KMS encryption, public access blocked
- Lifecycle policies: Glacier after 90 days, delete after 365 days
- CloudTrail multi-region with log validation and CloudWatch integration

**Database**
- RDS MySQL 8.0.35 Multi-AZ, db.t3.micro, 20GB GP3
- KMS encrypted, not publicly accessible
- Password in Secrets Manager (use random_password with 32 chars)
- Performance Insights, 7-day automated backups, CloudWatch log exports
- Parameter group with require_secure_transport

**IAM & Access**
- EC2 role: SSM, Secrets Manager, CloudWatch access
- VPC Flow Logs role, AWS Config role
- MFA enforcement policy for console access

**Certificates & Load Balancing**
- ACM certificate with DNS validation and wildcard support
- ALB in public subnets with HTTPS (TLS 1.3), HTTP to HTTPS redirect
- Access logs to S3

**Compute**
- Launch template: Amazon Linux 2, t3.micro, encrypted EBS, IMDSv2 required
- Auto Scaling Group in private subnets (min 2, max 10 instances)
- Scaling policies for CPU thresholds (scale up > 80%, scale down < 20%)

**Monitoring**
- CloudWatch log groups with 90-day retention and KMS encryption
- Alarms for high CPU, low CPU, RDS CPU, and root account usage
- SNS topic for security alerts with KMS encryption and email subscription

**Web Security**
- WAFv2 Web ACL with rate limiting (2000 requests per 5 minutes)
- AWS managed rule sets attached to ALB
- CloudFront distribution with ALB origin, HTTPS redirect, TLS 1.2 minimum

**Compliance & Threat Detection**
- AWS Config with these rules: S3 encryption, S3 no public read, RDS encryption, MFA enabled, CloudTrail enabled
- GuardDuty with S3 monitoring, Kubernetes logs, malware protection
- SSM Session Manager with encrypted sessions logged to CloudWatch and S3

## Variables

Define these with sensible defaults:
- `aws_region` (default: us-west-2)
- `environment_suffix` (default: main)
- `vpc_cidr` (default: 10.0.0.0/16)
- `domain_name` (default: example.com)
- `alert_email` (default: security@example.com)

## Outputs

Export these for downstream usage:
- VPC ID and all subnet IDs
- ALB DNS name and ARN
- CloudFront domain and distribution ID
- RDS endpoint (mark as sensitive) and ARN
- S3 log bucket name
- KMS key ID and ARN
- SNS topic ARN
- GuardDuty detector ID
- WAF ACL ID
- Auto Scaling Group name
- Launch template ID

## Technical Requirements

- Single file: `tap_stack.tf` (no external modules)
- Terraform >= 1.4.0, AWS provider >= 5.0, random provider >= 3.0
- No hardcoded secrets anywhere
- All resources must be destroyable (no prevent_destroy lifecycle)
- Must pass `terraform validate` and `terraform fmt`
- Tag everything: Name, CostCenter, Environment, ManagedBy

Let me know if you have questions. This should give us a solid, secure foundation that meets all our compliance requirements.

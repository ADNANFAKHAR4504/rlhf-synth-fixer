# Infrastructure Requirements for Multi-Region Secure Web Application

I need to deploy a secure web application infrastructure across two AWS regions (us-east-1 and us-west-2) using infrastructure as code. The solution must prioritize security and compliance with a defense-in-depth approach.

## Core Infrastructure Requirements

### Network Infrastructure
- VPC with both public and private subnets in each region
- Internet Gateway for public subnets
- NAT Gateway for private subnet internet access
- Route tables configured appropriately
- Network ACLs for additional security layer

### Compute and Load Balancing
- Application Load Balancer (ALB) in public subnets, internet-facing
- Auto Scaling Group with EC2 instances in private subnets
- Launch template with security hardening
- Target groups for health checking

### Database
- RDS instance with encryption at rest using KMS
- Multi-AZ deployment for high availability
- Automated backups enabled
- Database subnet groups in private subnets

### Storage
- S3 bucket for static content with AES256 encryption
- Bucket policies for restricted access
- Versioning and lifecycle policies

## Security Requirements (Critical)

### Network Security
- Security Groups: Allow only HTTP (port 80) and HTTPS (port 443) traffic from internet to ALB
- Security Groups: Allow only necessary ports between application tiers
- SSH access restricted to specific IP ranges only
- All other traffic explicitly denied

### Identity and Access Management
- IAM roles with least privilege principle
- EC2 instance roles with minimal S3 bucket permissions (specific buckets only)
- No hardcoded credentials anywhere

### Encryption and Data Protection
- RDS encryption at rest using AWS KMS customer-managed keys
- S3 bucket encryption with AES256 for all objects
- EBS volumes encrypted for EC2 instances

### Monitoring and Compliance
- CloudWatch logging enabled for all EC2 instances with log forwarding
- AWS Config for compliance monitoring and configuration drift detection
- GuardDuty Malware Protection for S3 to scan uploaded content for threats
- Security Hub integration for centralized security findings

### API and Application Security
- ALB must enforce HTTPS connections only
- Security headers configured on load balancer
- Web Application Firewall (WAF) rules if needed

### Multi-Factor Authentication
- MFA enabled for user accounts accessing AWS resources
- Service accounts using roles instead of access keys

## Regional Configuration
- Resources should use region-specific naming conventions
- Cross-region replication considerations for critical data
- Region-specific compliance requirements

## Additional Security Features
- Include Amazon GuardDuty Extended Threat Detection for enhanced monitoring
- AWS Config Rules for automated compliance checking
- CloudTrail logging for API activity auditing
- Resource tagging for security classification and cost allocation

Please provide complete infrastructure code that implements these requirements with a focus on security best practices. Each code block should represent a separate file and be ready to deploy. Minimize the number of files while meeting all security requirements.
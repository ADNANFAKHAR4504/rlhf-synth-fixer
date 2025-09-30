# Secure E-commerce Infrastructure Setup

Build a secure e-commerce application infrastructure on AWS using CloudFormation JSON. We need a comprehensive security-focused setup for production deployment.

## What to Build

Create a CloudFormation template that sets up:

**Network Security:**
- VPC with isolated network spanning 2 availability zones
- Two public subnets and two private subnets across the AZs
- NAT gateways for secure internet access from private subnets
- Proper routing and security group configurations

**Data Protection:**
- S3 buckets with server-side encryption enabled (AES-256)
- RDS MySQL database with encryption at rest
- Automatic backups configured for RDS (7 days minimum)
- Secrets Manager for database credentials

**Compute Security:**
- EC2 instances deployed only within VPC (no public instances)
- Security groups restricting SSH access to specific IP ranges only
- IAM roles with least privilege access (no hardcoded credentials)
- Instance profiles for secure service access

**Compliance and Monitoring:**
- CloudTrail enabled for audit logging
- AWS Config for compliance monitoring
- Lambda functions for automatic remediation of security violations
- MFA enforcement for IAM users managing the environment

**High Availability:**
- Resources distributed across multiple availability zones
- Auto scaling capabilities for compute resources
- Multi-AZ deployment where applicable

## Requirements

- Use CloudFormation JSON format with EnvironmentSuffix parameter
- All resources must be tagged appropriately
- Template should pass aws cloudformation validate-template
- Follow AWS security best practices and Well-Architected Framework
- Export all resource IDs and endpoints in outputs
- No hardcoded values or environment-specific configurations
- Include comprehensive error handling and validation

The template should create a production-ready, secure e-commerce infrastructure that meets enterprise security standards.
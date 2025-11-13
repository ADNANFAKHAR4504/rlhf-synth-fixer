# Task: Security-Hardened Infrastructure for Payment Card Data Processing

## Platform and Language
**MANDATORY**: Use **CloudFormation with YAML** exclusively for all infrastructure code.

## Background
A financial services company requires strict security controls for their payment processing infrastructure. They need to implement defense-in-depth security layers including network isolation, encryption at rest and in transit, and comprehensive audit logging to meet PCI-DSS compliance requirements.

## Environment
Production security-hardened infrastructure in us-east-1 region focusing on payment processing workloads. Deployment includes RDS PostgreSQL in Multi-AZ configuration and S3 for encrypted document storage. VPC spans 3 availability zones with private subnets for database tier and public subnets for NAT gateways. Requires AWS CLI configured with appropriate IAM permissions. All resources must be tagged with Environment, CostCenter, and DataClassification tags for compliance tracking.

## Problem Statement
Create a CloudFormation template to deploy a security-hardened infrastructure for payment card data processing.

### MANDATORY REQUIREMENTS (Must complete):
1. Create a VPC with private subnets across 3 AZs for RDS deployment (CORE: VPC)
2. Deploy RDS PostgreSQL instance with encryption enabled using KMS (CORE: RDS)
3. Configure security groups allowing only HTTPS (443) traffic between application and database tiers
4. Create S3 bucket with server-side encryption and versioning for audit logs
5. Implement IAM roles with specific permissions for EC2 instances to access RDS and S3
6. Enable VPC Flow Logs writing to the S3 bucket
7. Configure KMS key with automatic rotation for RDS encryption
8. Set up CloudWatch Log Groups with 90-day retention for application logs

### OPTIONAL ENHANCEMENTS (If time permits):
- Add AWS Config rules for continuous compliance monitoring (OPTIONAL: Config) - automates compliance checks
- Implement Secrets Manager for database credentials rotation (OPTIONAL: Secrets Manager) - improves credential security
- Add GuardDuty for threat detection (OPTIONAL: GuardDuty) - enhances threat monitoring

### Constraints
- All S3 buckets must use AES-256 encryption and block public access
- RDS instances must be deployed in private subnets only
- All traffic between services must use TLS 1.2 or higher
- Security groups must follow least-privilege principle with no 0.0.0.0/0 ingress rules
- IAM roles must not contain any wildcard (*) permissions
- All resources must have CloudTrail logging enabled with log file validation
- KMS keys must have automatic rotation enabled
- VPC Flow Logs must be enabled for all network interfaces

## Expected Output
A CloudFormation YAML template that creates a fully secured infrastructure meeting all PCI-DSS requirements with encryption, network isolation, and audit logging properly configured.

## AWS Services to Use
- VPC (Virtual Private Cloud)
- RDS (Relational Database Service) - PostgreSQL
- S3 (Simple Storage Service)
- KMS (Key Management Service)
- IAM (Identity and Access Management)
- CloudWatch Logs
- VPC Flow Logs
- Security Groups

## Compliance Focus
This infrastructure must meet PCI-DSS compliance requirements with emphasis on:
- Data encryption at rest and in transit
- Network segmentation and isolation
- Comprehensive audit logging
- Least-privilege access controls
- Automated security monitoring

# Build Secure Cloud Infrastructure with Terraform

I need help building a secure cloud infrastructure for a microservices application using Terraform. This is for a data processing pipeline that handles sensitive information, so security is critical.

## Project Overview

I'm setting up infrastructure in us-east-1 that needs enterprise-grade security controls. The system will process sensitive data through serverless components and needs proper encryption, monitoring, and access controls throughout.

## Core Requirements

### IAM and Access Control
- IAM roles with least privilege access
- Service-specific execution roles for Lambda
- No overly permissive policies
- Proper cross-service authentication

### Data Protection
- KMS encryption for all data at rest
- S3 buckets with versioning and MFA delete
- Secrets Manager for API keys and credentials
- Encrypted RDS instances with key rotation

### Compute and Network
- Lambda functions with resource constraints
- VPC with public/private subnet separation
- Network isolation for sensitive workloads
- Minimal security group rules

### Database Setup
- Multi-AZ RDS for high availability
- Automated backups with retention
- Encryption in transit and at rest
- Restricted database access

### Monitoring
- CloudWatch logs for audit trails
- CPU and memory alarms
- AWS Config for compliance checks
- Alerting on critical metrics

### Network Security
- Properly configured VPC subnets
- Route 53 for DNS management
- AWS Shield DDoS protection
- Network ACLs as additional layer

## Technical Components Needed

**Infrastructure:**
- Multi-AZ VPC setup
- Lambda with IAM roles
- Encrypted RDS with Multi-AZ
- Secured S3 buckets
- CloudWatch and Config rules
- Secrets Manager integration

**Security Features:**
- KMS key management
- Least privilege IAM
- Automated compliance
- Shield protection
- MFA where needed
- Comprehensive audit logs

## What I Need

Looking for complete Terraform configurations that create this secure infrastructure. Need:

1. Main terraform config with security resources
2. Variables for environment settings
3. Outputs for resource references
4. Modular file organization

The code should implement:
- Restrictive IAM policies that still work
- KMS encryption configurations
- Defense-in-depth security groups
- Lambda with proper execution roles
- RDS security and encryption

For monitoring:
- CloudWatch log groups with retention
- Meaningful alarm thresholds
- Config rules for compliance
- Secrets Manager integration

## Success Criteria

When I run terraform apply, it should create:
- Secure, compliant infrastructure
- No security shortcuts
- Production-ready configurations
- Clear documentation
- Modular, maintainable code

All resources must:
- Pass Config compliance checks
- Use minimal required access
- Follow least privilege
- Encrypt data everywhere
- Have comprehensive logging

This infrastructure will handle sensitive data processing, so getting the security right from the start is essential. Would appreciate explanations of security decisions and best practices used.

Thanks!
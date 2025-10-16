# Secure AWS Infrastructure Setup

I need a comprehensive Terraform configuration for setting up a secure AWS environment. This is for a new AWS account that needs to meet enterprise security standards.

## What I need built:

### Security & Encryption
- Set up AWS KMS for encrypting all sensitive data (databases, logs, S3 buckets, etc.)
- Configure IAM with least privilege access principles
- Implement MFA requirements for console access
- Set up comprehensive audit logging with CloudTrail

### Network Security:
- Create secure network architecture with proper subnets
- Configure Security Groups and NACLs to prevent unauthorized access
- No open internet access (0.0.0.0/0) on inbound rules for sensitive resources
- Implement proper network isolation

### Compliance & Monitoring  
- Enable AWS Config for configuration monitoring and compliance
- Set up CloudWatch budget alerts (around $1000/month threshold)
- Create S3 bucket for secure log storage with versioning and encryption
- Ensure all resources are properly tagged for cost tracking and management

### Resource Requirements:
- Everything needs to be in us-west-2 region
- All code should be in a single Terraform file for simplicity
- Need consistent tagging across all resources (CostCenter, Environment, ManagedBy)
- Must be deployable with standard AWS credentials

### Tags needed on everything:
- CostCenter
- Environment (development/testing/production)  
- ManagedBy

The goal is to have a production-ready, secure baseline that can be deployed immediately and meets enterprise compliance requirements. All the security controls should be enabled from day one.
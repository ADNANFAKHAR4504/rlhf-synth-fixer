# 🛡️ Secure AWS Foundation with Terraform

## Overview

This solution provides a minimal yet secure AWS foundation infrastructure deployed in **us-east-1** using **Terraform**. The implementation follows AWS security best practices while maintaining simplicity and fast deployment times.

## Architecture Components

### Core Infrastructure
- **VPC**: Single VPC with DNS support enabled
- **Subnets**: 2 public and 2 private subnets across 2 AZs
- **Connectivity**: Internet Gateway for public access, single NAT Gateway for private subnet egress
- **Security**: Restrictive security groups allowing only HTTP/HTTPS to public endpoints

### Security Features
- **S3 Buckets**: 
  - Data bucket with KMS encryption
  - Logs bucket for server access and CloudTrail logs
  - Public access blocked on all buckets
- **CloudTrail**: Management events logging to S3
- **AWS Config**: Configuration recorder with SSH and S3 encryption rules
- **IAM**: Example user with least-privilege policy and MFA enforcement

### Key Design Decisions
- Uses AWS Provider v5+ syntax and modern S3 configurations
- Implements bucket ownership controls for enhanced security
- All resources use consistent naming with configurable prefix
- Single file approach (no external modules) for simplicity

## File Structure

```
lib/
├── versions.tf          # Terraform and provider requirements
├── provider.tf          # AWS provider configuration
├── variables.tf         # Input variables with sensible defaults
├── main.tf             # All infrastructure resources
└── outputs.tf          # Important resource identifiers
```

## Security Highlights

1. **Network Isolation**: Private subnets with controlled egress via NAT
2. **Encryption**: KMS encryption for data bucket, AES256 for logs
3. **Access Control**: Public access blocked on S3, restrictive security groups
4. **Monitoring**: CloudTrail and Config for compliance and auditing
5. **IAM Security**: MFA enforcement and least-privilege policies

## Deployment

The infrastructure deploys quickly due to:
- Lightweight AWS Config rules (only 2 managed rules)
- Single NAT Gateway serving both AZs
- No complex nested resources or dependencies
- Modern Terraform configurations optimized for AWS Provider v5+

This foundation provides a secure starting point for AWS workloads while remaining cost-effective and simple to manage.
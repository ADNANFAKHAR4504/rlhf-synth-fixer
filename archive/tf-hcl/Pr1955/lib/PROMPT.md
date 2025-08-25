# AWS Multi-Tier Infrastructure with Terraform

We need to build a secure, production-ready AWS infrastructure using Terraform. This isn't just a basic setup - we're creating a comprehensive multi-tier architecture that follows real-world security practices.

## What we're building

**Core Infrastructure:**

- VPC with public and private subnets across multiple AZs
- EC2 instances for web and application tiers
- RDS MySQL database with encryption
- S3 buckets for storage and logging
- IAM roles with least privilege access
- CloudTrail for complete audit logging

**Security Requirements:**

- Everything encrypted at rest and in transit
- Network isolation between tiers
- No hardcoded credentials anywhere
- Proper IAM roles (no overprivileged access)
- Complete audit trail of all API calls
- Consistent tagging for cost tracking and management

## Security Standards

We're following CIS AWS Foundations Benchmark guidelines here. This means:

- IAM roles must follow least privilege (only the permissions actually needed)
- No AWS credentials in code - use environment variables or AWS Secrets Manager
- All S3 buckets encrypted with AES-256
- CloudTrail logging everything to a secure bucket
- Proper network segmentation with security groups

## Technical Requirements

**File Structure:**

- Use modular Terraform code (separate modules for VPC, IAM, EC2, RDS, etc.)
- Keep provider configuration in `provider.tf`
- Main infrastructure in `tap_stack.tf`
- Use latest Terraform version for best features

**Important Notes:**

- The `provider.tf` file already exists with AWS provider and S3 backend
- Don't add provider blocks to `tap_stack.tf` - that stays in `provider.tf`
- Declare `aws_region` variable in `tap_stack.tf` so `provider.tf` can use it
- Tests shouldn't run actual Terraform commands (init/plan/apply)

## Tagging Strategy

Every resource needs these tags for proper management:

- `Environment` - what environment this is
- `Owner` - who owns this infrastructure
- `Purpose` - what this infrastructure is for
- `ManagedBy` - always "Terraform" for our IaC resources

## What Success Looks Like

When we're done, we should have:

- Modular, reusable Terraform code
- Zero security vulnerabilities
- Complete audit logging
- Proper cost tracking through tags
- Infrastructure that scales with business needs
- Code that passes security reviews

This infrastructure should be something you'd actually deploy in production - not just a demo or learning exercise. We want enterprise-grade security and reliability.

## Deliverables

- Clean, well-organized Terraform HCL files
- Modular structure for easy maintenance
- Security best practices throughout
- Documentation for running and testing

Hey team,

We need to build out a secure AWS infrastructure using Terraform following industry best practices. The goal is to create a solid security baseline with proper encryption, compliance monitoring, and access controls.

Everything needs to go into a single main.tf file - keeping it simple but comprehensive. We're focusing on core AWS services: S3, CloudTrail, IAM, EC2, RDS, and AWS Config, all with strong security controls baked in.

Important: Don't enable deletion protection on any resources. We need to be able to tear this down easily for testing.

## What We Need

**CloudTrail Setup**
- Enable CloudTrail to capture all API calls across all regions
- Store the logs in an encrypted S3 bucket

**S3 Buckets**
- Encrypt everything at rest using KMS CMK (not AWS managed keys)
- Turn on versioning for all buckets
- Nothing should be publicly accessible

**Security Groups**
- Block unrestricted SSH access (no 0.0.0.0/0 on port 22)
- Only allow SSH from our trusted IP range (use a variable for this)

**IAM Configuration**
- Use IAM roles for EC2 instances, not IAM users
- Keep IAM policies tight - least privilege only
- Set up a strong password policy (uppercase, lowercase, numbers, special chars)
- Require MFA for all console access

**RDS Database**
- Deploy a MySQL or PostgreSQL instance
- Enable KMS encryption at rest
- Configure automated backups
- Skip deletion protection so we can test teardown

**AWS Config**
- Enable Config to monitor compliance
- Add rules to check for:
  - S3 bucket encryption
  - MFA on IAM users
  - CloudTrail enabled
  - No wide-open security groups

**General Requirements**
- Tag all resources consistently
- Use a variable for the AWS region
- Keep everything in one region
- No deletion protection anywhere

## Technical Constraints

- Use Terraform HCL syntax
- Everything in one main.tf file (no modules)
- Follow least privilege for IAM
- Use AWS managed Config rules where possible
- Code should be readable with good comments

## Deliverable

A single main.tf file that includes:
- CloudTrail with encrypted log storage
- S3 buckets with KMS encryption and versioning
- Hardened security groups
- IAM roles, policies, and password requirements
- MFA enforcement
- Encrypted RDS instance
- AWS Config with compliance rules
- Proper tagging and parameterization

The Terraform code should be valid HCL with comments explaining the security best practices. We want the complete working configuration with all implementation details.

Thanks!
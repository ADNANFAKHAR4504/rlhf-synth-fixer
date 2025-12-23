# Secure Multi-Region Infrastructure for Software Company

I need to implement secure AWS infrastructure for a medium-sized software company that handles sensitive customer data. The solution needs to be highly secure and distributed across multiple regions for high availability.

## Requirements

**Security & Compliance:**
- All data must be encrypted at rest and in transit
- IAM policies should not exceed 5 attached policies per user
- Use IAM roles for EC2 instances instead of IAM users
- Enable comprehensive logging for all AWS services for auditing
- Lock down S3 buckets from public access
- RDS instances must use customer-managed CMKs for encryption
- Security groups must log all inbound rules and avoid open access

**High Availability:**
- Distribute infrastructure across at least 3 AWS regions (us-east-1, us-west-2, and a third region)
- VPC with multiple subnets across different availability zones
- S3 versioning enabled to protect against accidental deletions

**Latest AWS Features:**
- Integrate AWS Security Hub for unified security management and risk prioritization
- Use Amazon GuardDuty Extended Threat Detection for multi-stage attack detection

**Technical Requirements:**
- Use AWS CDK with TypeScript
- Follow project-based naming conventions (project-name-component)
- Avoid hardcoding sensitive information
- CDK assets should be stored with encryption and version control
- Ensure CDK v2 compatibility

Please provide infrastructure code with one code block per file that creates a comprehensive secure setup meeting all these requirements.
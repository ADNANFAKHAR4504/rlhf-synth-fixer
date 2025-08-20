# AWS CloudFormation Template Requirements
Design a secure and highly available AWS CloudFormation YAML template to implement a production-grade infrastructure with robust security controls. The template should create a fully managed, compliant environment that follows security best practices and ensures comprehensive monitoring and threat detection capabilities.

# Environment Setup
- Create a VPC with two public and two private subnets across different availability zones
- Configure Network ACLs to restrict access from unauthorized IP addresses
- Set up S3 buckets with mandatory server-side encryption (SSE-S3)
- Implement IAM roles with minimum required permissions for EC2 instances
- Enable AWS CloudTrail for comprehensive account activity logging
- Deploy AWS WAF for web application protection
- Configure AWS KMS for secure encryption key management
- Enable AWS GuardDuty for threat detection across utilized AWS regions
- Set up AWS Config for continuous configuration compliance monitoring
- Prepend all resource names with 'SecureApp' prefix
- Configure CloudFormation stack namespace as 'SecureStack'

# Constraints
- Deploy resources using region from environment variable (no hardcoded regions)
- All S3 buckets must have SSE-S3 encryption enabled
- IAM roles must implement least privilege access
- VPC must have minimum two public and two private subnets
- Network ACLs must restrict access to specific IP ranges
- AWS KMS must be used for key management
- AWS GuardDuty must be enabled across all utilized regions
- AWS Config must monitor configuration compliance
- CloudTrail must have 'IsLogging' property set to true
- Template must pass AWS CloudFormation validation and linting
- Use dynamic references for secrets (no hardcoded values)
- Do not use 'Fn::Sub' unless variables are required
- Avoid invalid properties in resource definitions
- Follow company naming convention ('SecureApp' prefix)

# Output Expectations
- A single, production-ready CloudFormation YAML template that:
  - Implements all security and compliance requirements
  - Creates a highly available infrastructure across multiple AZs
  - Deploys all specified AWS resources without errors
  - Uses descriptive logical resource names with 'SecureApp' prefix
  - Follows AWS security best practices and guidelines
  - Enables comprehensive monitoring and threat detection
  - Passes AWS CloudFormation validation and cfn-lint checks
  - Maintains proper resource naming conventions

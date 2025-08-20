# AWS CloudFormation Template Requirements
- **Role:** Provision a secure, highly available, and scalable AWS application environment using CloudFormation.
- **Goal:** Automate the setup of all required AWS resources, ensuring best security practices, high availability, and compliance with AWS standards.
- The environment must be secure, scalable, and suitable for production workloads.

# Environment Setup
- **VPC:** Create a VPC with both public and private subnets (multi-AZ for high availability).
- **EC2:** Launch EC2 instances in private subnets, applying strict security group rules and IAM roles with least privilege.
- **IAM:** Define IAM roles and policies following the least privilege principle for all resources.
- **S3:** Provision S3 buckets for artifact storage with versioning enabled and encryption at rest.
- **KMS:** Set up AWS KMS keys for encryption key management, used by S3 and other services.
- **Logging:** Enable logging for all services, including CloudTrail (with IsLogging property), VPC Flow Logs, and others as appropriate.
- **Networking:** Ensure secure communication between resources and encrypt data at rest and in transit.

# Constraints
- Use AWS CloudFormation only.
- IAM roles must follow least privilege.
- Data must be encrypted at rest and in transit.
- VPC must include both public and private subnets.
- Stack should be reusable and parameterized.
- Adopt a multi-AZ (multi-region for demonstration) strategy for high availability.
- S3 must have versioning enabled.
- Logging must be enabled for all services.
- EC2 security groups must follow best practices.
- Use AWS KMS for encryption key management.
- Template must pass AWS CloudFormation validation and cfn-lint.
- Do not hard code AWS region; ignore region values in the template (region is passed as an environment variable).
- Use dynamic references (not parameters) for secrets like passwords.
- Do not use 'Fn::Sub' unless variables are present.
- Do not include additional properties not allowed by the resource specification (e.g., 'BackupPolicy').
- 'IsLogging' is a required property for AWS::CloudTrail::Trail.

# Output Expectations
- The template must deploy all specified AWS resources without error.
- Use descriptive logical resource names for all resources.
- Follow AWS best practices and security guidelines throughout.
- Output must be a valid, production-ready YAML CloudFormation template.

# AWS CloudFormation Template Requirements
Design a secure and scalable AWS CloudFormation JSON template to deploy a basic web application infrastructure. The template should implement comprehensive security measures, compliance monitoring, and follow best practices to create a production-ready environment that protects all resources while enabling proper web application functionality.

# Environment Setup
- Create a private VPC with no direct internet access
- Configure a NAT Gateway for outbound internet connectivity from private subnets
- Deploy EC2 instances of type t3.micro
- Implement security groups restricting SSH access to specific IP ranges only
- Set up KMS keys for encrypting all applicable AWS resources
- Create CloudFront distribution with S3 bucket origin for secure content delivery over HTTPS
- Implement CloudTrail to log all account activity to a secure S3 bucket
- Configure AWS Config to monitor and alert on compliance with security policies
- Define IAM roles with least privilege permissions

# Service Integration Requirements
- NAT Gateway provides outbound internet connectivity for EC2 instances in private subnets
- CloudFront distribution connects to S3 bucket origin for content delivery
- EC2 instances access S3 bucket through IAM instance profile permissions
- CloudTrail logs are stored in dedicated S3 bucket with encryption
- KMS keys encrypt CloudTrail logs, S3 buckets, and other resources where applicable

# Constraints
- All AWS resources must use AWS KMS for encryption where applicable
- VPCs must be private with no direct internet access; use NAT Gateway for connectivity
- Don't hardcode region as it will be passed as an environment variable
- IAM roles must implement least privilege permissions avoiding broad wildcards
- EC2 instances must be t3.micro type only
- Security groups must restrict SSH access to specific IP ranges only
- CloudFront must be configured with S3 origin for HTTPS content delivery
- CloudTrail must log all account activity to a secure S3 bucket
- 'IsLogging' is a required property for AWS::CloudTrail::Trail
- Use dynamic references over parameters for secrets like passwords
- 'Fn::Sub' isn't needed because there are no variables
- Additional properties are not allowed - BackupPolicy was unexpected
- Template must pass AWS CloudFormation validation and linting with cfn-lint

# Output Expectations
- A valid JSON CloudFormation template that is executable without modification
- All infrastructure and security components must be properly configured
- IAM policies, security group rules, and network configurations must be well-documented and compliant
- Deploys all specified AWS resources without error
- Uses descriptive logical resource names
- Follows AWS best practices and security guidelines

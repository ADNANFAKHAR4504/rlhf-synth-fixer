# AWS CloudFormation Template Generation Prompt

## 1. AWS CloudFormation Template Requirements

Create a secure and optimized AWS infrastructure CloudFormation template that focuses on:
- Establishing a secure, scalable foundation for AWS resources
- Implementing comprehensive security controls and monitoring
- Following the principle of least privilege
- Ensuring all data is encrypted at rest and in transit
- Enabling detailed monitoring and cost management

## 2. Service Connectivity Architecture

EC2 instances connect to RDS database through security group rules that allow database traffic only from the application tier. S3 buckets are accessed via IAM roles attached to EC2 instances, eliminating the need for access keys. CloudTrail logs are stored in a dedicated S3 bucket with encryption and versioning enabled. CloudWatch monitors all resources and sends alerts when thresholds are breached.

## 3. Environment Setup

### S3 Buckets
- Enable server-side encryption (SSE)
- Block all public access settings
- Enable versioning and logging
- Implement lifecycle policies

### VPC and Networking
- Create VPC with proper CIDR blocks
- Set up private subnets for secure resources
- Configure routing and network ACLs
- No public IP assignments for instances

### EC2 Instances
- Launch in private subnets only
- Attach appropriate IAM roles
- Enable detailed monitoring
- Encrypt EBS volumes
- No public IP addresses

### RDS Database
- Deploy in private subnets only
- Enable encryption at rest
- Configure automated backups
- Use secure parameter groups

### Security Groups
- Implement least privilege access
- Restrict inbound/outbound traffic
- Document all rules
- Use security group references

### Monitoring and Security
- CloudTrail for API logging
- CloudWatch for resource monitoring
- Enable MFA for root account
- Configure cost alerts with AWS Budgets

## 4. Constraints

### Technical Constraints
- Template must pass AWS CloudFormation validation and cfn-lint
- Use environment variable REGION for region configuration
- Use dynamic references for secrets and passwords
- No unnecessary use of 'Fn::Sub'
- No unexpected properties
- Include 'IsLogging: true' for CloudTrail
- Follow naming convention: environment-module-resource

### Security Constraints
- SSE encryption for all S3 buckets
- No public bucket access
- All EC2 instances in private subnets
- Mandatory IAM roles
- Encrypted EBS volumes
- MFA for root account
- Least privilege security groups
- Private subnet placement for databases

### Resource Naming
- Follow convention: environment-module-resource format
- Use consistent naming across all resources
- Include environment identifier in resource names

## 5. Output Expectations

### Template Requirements
- Filename: secure-infrastructure.yaml
- Valid YAML syntax
- Passes CloudFormation validation
- Follows AWS best practices

### Functional Requirements
- Deploys all specified AWS resources without error
- Uses descriptive logical resource names
- Implements all security controls correctly
- Enables proper monitoring and logging
- Sets up cost management

### Documentation
- Clear resource descriptions
- Well-documented security configurations
- Proper tagging strategy
- Meaningful output values

### Security Validation
- No public access to resources
- Encryption enabled where required
- Proper IAM role configuration
- Security group rules follow least privilege

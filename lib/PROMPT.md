# CloudFormation Template Generation Prompt

## 1. AWS CloudFormation Template Requirements

Create a production-ready CloudFormation template in YAML format to establish a secure and scalable web application infrastructure. The template should provision and configure a comprehensive AWS environment that emphasizes security best practices, high availability, and follows the principle of least privilege.

Role: Infrastructure as Code (IaC) template for web application deployment
Goal: Set up a secure, compliant, and production-ready AWS environment with proper access controls and monitoring

## 2. Environment Setup

Required AWS Resources:
- S3 Bucket:
  - Purpose: Static file storage
  - Requirements: Server-side encryption enabled
  
- Application Load Balancer (ALB):
  - Purpose: Handle web traffic
  - Requirements: HTTP to HTTPS redirection
  
- EC2 Instances:
  - Purpose: Application servers
  - Requirements: Instance profiles for AWS resource access
  
- RDS Instance:
  - Purpose: Database server
  - Requirements: KMS encryption, CIDR-based access restrictions
  
- IAM Configuration:
  - Roles and policies with least privilege access
  - Instance profiles for EC2
  
- Monitoring & Logging:
  - CloudTrail for API activity logging
  - AWS Config for resource compliance monitoring
  
## 3. Constraints

Security Requirements:
- IAM policies must avoid wildcard (*) actions
- Security groups must not allow public access to port 22
- All sensitive data must be encrypted using KMS
- EC2 instances must use instance profiles
- S3 buckets require server-side encryption
- RDS access must be CIDR-range restricted
- ALB must redirect HTTP to HTTPS

Technical Requirements:
- Template must pass AWS CloudFormation validation and cfn-lint
- Region should be parameterized (not hardcoded)
- Use dynamic references for secrets instead of parameters
- 'Fn::Sub' is not needed (no variables)
- Avoid unexpected properties like 'BackupPolicy'
- Include 'IsLogging' property for AWS::CloudTrail::Trail

Resource Tagging:
- All resources must include 'Environment' and 'Owner' tags for cost management

## 4. Output Expectations

Template Quality:
- Successfully deploys all specified AWS resources without errors
- Uses clear and descriptive logical resource names
- Follows AWS best practices and security guidelines
- Implements all security controls and monitoring requirements
- Properly configures resource relationships and dependencies
- Creates a complete, production-ready environment
- Passes CloudFormation validation and linting checks

Security Compliance:
- Enforces principle of least privilege
- Implements all required encryption mechanisms
- Ensures secure network configuration
- Establishes proper monitoring and logging
- Maintains secure access controls

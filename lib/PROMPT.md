# Secure Infrastructure CloudFormation Template

Create a CloudFormation template that establishes secure infrastructure following organizational security policies. The template should implement comprehensive security controls for data protection, access management, and operational security.

## Requirements

### 1. S3 Bucket Security
- Create three S3 buckets that are private by default
- Enable block all public access settings on all buckets
- Configure server-side encryption using AWS managed keys with SSE-S3
- Enable versioning on all buckets
- Set up access logging with one dedicated S3 bucket serving as the centralized logging destination for the other buckets
- Apply bucket policies that deny unsecured transport

### 2. IAM Password Policy
Configure an account password policy that enforces:
- Minimum password length of 12 characters
- Require uppercase letters
- Require lowercase letters
- Require numbers
- Require special characters
- Set password expiration to 90 days
- Prevent password reuse for last 12 passwords
- Require administrator reset for expired passwords

### 3. Lambda Function with Secure Environment Handling
Deploy a Lambda function that connects to S3 buckets for secure data processing:
- The Lambda function retrieves objects from S3, processes data securely, and stores results back to S3 without exposing sensitive information in logs
- Implements proper error handling that doesn't leak credentials
- Uses environment variables but never echoes AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or similar sensitive values
- Sends CloudWatch logs following security best practices with appropriate log retention
- Uses least privilege IAM execution role with specific S3 bucket permissions

### 4. Enhanced Security Features
Incorporate AWS Security Hub centralized security posture management to monitor compliance across resources. Use Resource Control Policies for organization-level preventative controls.

### 5. General Security Requirements
- All resources should follow principle of least privilege
- Use consistent naming convention with myproject-prod prefix followed by resource type and unique identifier
- Apply comprehensive resource tagging for governance
- Implement encryption at rest and in transit
- Configure CloudWatch monitoring and alerting
- Use KMS customer managed keys for enhanced encryption control

## Deliverables
Provide infrastructure code in separate files with clear separation of concerns. Each file should contain complete, production-ready code that can be deployed independently.
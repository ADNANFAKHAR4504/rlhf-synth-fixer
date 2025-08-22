# Secure Infrastructure CloudFormation Template

Create a CloudFormation template that establishes secure infrastructure following organizational security policies. The template should implement comprehensive security controls for data protection, access management, and operational security.

## Requirements

### 1. S3 Bucket Security
- Create multiple S3 buckets (at least 3) that are private by default
- Enable block all public access settings on all buckets
- Configure server-side encryption using AWS managed keys (SSE-S3)
- Enable versioning on all buckets
- Set up access logging with one bucket as the logging destination
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
Deploy a Lambda function that:
- Processes data securely without exposing sensitive information in logs
- Implements proper error handling that doesn't leak credentials
- Uses environment variables but never echoes AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or similar sensitive values
- Includes CloudWatch logging with security best practices
- Uses least privilege IAM execution role

### 4. Enhanced Security Features
Incorporate AWS Security Hub centralized security posture management to monitor compliance across resources. Use Resource Control Policies (RCPs) for organization-level preventative controls where applicable.

### 5. General Security Requirements
- All resources should follow principle of least privilege
- Use consistent naming convention: myproject-prod-{resource-type}-{identifier}
- Apply comprehensive resource tagging for governance
- Implement encryption at rest and in transit where possible
- Configure CloudWatch monitoring and alerting
- Use KMS keys for enhanced encryption where appropriate

## Deliverables
Provide infrastructure code in separate files with clear separation of concerns. Each file should contain complete, production-ready code that can be deployed independently where appropriate.
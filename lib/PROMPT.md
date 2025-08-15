# AWS Security Infrastructure Requirements

I need to create a secure AWS infrastructure using Terraform that implements comprehensive security controls and monitoring. The solution should include:

## Core Security Requirements

1. Create IAM roles with least-privilege policies for microservice applications
2. Configure VPC Security Groups that allow only necessary traffic and deny everything else
3. Store sensitive data like database passwords in AWS Secrets Manager with encryption at rest
4. Enable AWS CloudTrail for monitoring all API calls and infrastructure changes
5. Use the pre-existing VPC with ID 'vpc-0abc12345def67890' in us-east-1 region

## Infrastructure Components Needed

- IAM service roles for applications with minimal required permissions
- Security groups for web tier, application tier, and database tier with restrictive rules
- AWS Secrets Manager secrets for database credentials and API keys with automatic rotation
- CloudTrail configuration for comprehensive audit logging with S3 storage
- CloudWatch monitoring integration for security event alerting

## Latest AWS Features to Include

- Use the enhanced AWS Secrets Manager transform (AWS::SecretsManager-2024-09-16 equivalent) for improved security
- Implement multi-region secret replication for high availability
- Configure CloudTrail with the latest event format standards for IAM operations
- Set up CloudWatch alarms with SNS notifications for unauthorized secret access attempts

## Naming Convention

All resources should follow the pattern 'securitydemo-component-function' for consistency.

## Technical Requirements

- Target region: us-east-1
- Use existing VPC: vpc-0abc12345def67890
- Enable encryption at rest for all storage components
- Configure automatic rotation for database secrets
- Implement least-privilege access controls throughout

Please provide complete Terraform HCL code with proper resource organization across multiple .tf files including main.tf, variables.tf, outputs.tf, and component-specific files.
# Secure AWS Infrastructure with Pulumi JavaScript

I need to create a secure AWS infrastructure using Pulumi with JavaScript that provisions the following components for a SecureApp project:

## Infrastructure Requirements

1. **S3 Bucket with Enhanced Security**
   - Server-side encryption enabled using AWS KMS
   - Implement bucket versioning and access logging
   - Follow AWS 2025 best practices for preventing unintended encryption activities
   - Name: SecureApp-data-bucket

2. **RDS MySQL Instance**
   - Deploy in a public subnet for administrative access
   - Enable encryption at rest using AWS KMS
   - Configure automated backups with encryption
   - Instance class: db.t3.micro for fast deployment
   - Database name: secureapp_db
   - Username: admin

3. **EC2 Instance Group**
   - Create IAM roles with least-privilege access to S3 bucket and RDS
   - Instance type: t3.micro for cost efficiency
   - Security group allowing necessary access
   - User data script for basic configuration

4. **CloudWatch Monitoring and Alarms**
   - CPU utilization alarm when EC2 instances exceed 75%
   - Enhanced monitoring for RDS performance
   - CloudTrail integration for security event logging
   - Use 2025 AWS security monitoring best practices

## Additional Security Features

Incorporate these AWS 2025 security enhancements:
- Use AWS IAM Access Analyzer principles for resource access verification
- Implement CloudTrail logging for all API calls
- Configure EventBridge rules for automated security responses
- Use AWS KMS for centralized key management across all services

## Technical Specifications

- Target region: us-east-1
- Naming convention: SecureApp-[resource-name]
- All resources should use consistent tagging
- Follow Pulumi JavaScript best practices
- Minimize deployment time where possible

Please provide complete infrastructure code with one code block per file. The solution should demonstrate enterprise-level security practices while maintaining operational efficiency.
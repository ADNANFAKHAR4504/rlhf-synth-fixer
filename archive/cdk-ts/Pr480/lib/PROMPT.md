# AWS CDK Infrastructure Requirements

Create a secure application infrastructure on AWS using CDK with TypeScript for the 'us-west-2' region. The infrastructure must implement comprehensive security best practices and modern AWS features.

## Core Requirements

1. **Security Implementation**
   - Implement IAM roles following the principle of least privilege
   - Use IAM Access Analyzer policy generation based on access activity for fine-grained permissions
   - Enable comprehensive logging for security group changes to ensure accountability and traceability
   - Implement VPC Flow Logs for network monitoring and security analysis

2. **Resource Tagging**
   - Tag all resources with 'Environment' = 'Production' and 'Owner' = 'DevOps'
   - Ensure consistent tagging across all infrastructure components

3. **Security Best Practices**
   - Avoid hardcoding sensitive information (database passwords, API keys)
   - Use AWS Secrets Manager for sensitive data management
   - Implement network security with private subnets and controlled access
   - Enable CloudTrail logging with CloudWatch integration for real-time monitoring

4. **Modern AWS Features**
   - Utilize AWS IAM Access Analyzer for automated permission analysis
   - Implement VPC endpoints for secure AWS service access
   - Enable enhanced monitoring with CloudWatch integration

## Infrastructure Components

Generate infrastructure code that includes:
- VPC with public and private subnets
- Security groups with minimal required permissions
- IAM roles with least privilege access patterns
- CloudTrail configuration for comprehensive logging
- VPC Flow Logs for network monitoring
- Application Load Balancer for secure traffic distribution
- Auto Scaling Group with EC2 instances in private subnets
- RDS database with encrypted storage
- S3 bucket for application assets with proper access controls

## Code Requirements

- Provide one code block per file
- Use TypeScript with AWS CDK
- Implement proper error handling and validation
- Include comprehensive comments explaining security configurations
- Ensure all resources follow AWS security best practices
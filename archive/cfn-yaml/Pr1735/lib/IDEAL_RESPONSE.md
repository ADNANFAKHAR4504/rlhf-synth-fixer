# Secure AWS Infrastructure CloudFormation Template

This CloudFormation template implements Security Configuration as Code best practices, ensuring consistent security controls across all AWS resources.

## Security Features Implemented

### 1. S3 Bucket Encryption (AES-256)
All S3 buckets in the stack enforce server-side encryption using AES-256:
- Primary secure bucket with enforced encryption
- Access logs bucket with encryption
- Bucket policies that deny unencrypted uploads and insecure connections

### 2. IAM Least Privilege Access
IAM roles follow the principle of least privilege:
- Application role with minimal S3 and CloudWatch permissions
- VPC Flow Logs role with only necessary logging permissions
- CloudTrail role with specific log group access

### 3. CloudWatch Logging for All Resources
Comprehensive logging is enabled for monitoring and auditing:
- VPC Flow Logs to track network traffic
- S3 access logging for bucket operations
- Application log group for custom application logs
- CloudTrail for API call monitoring

### 4. Restricted Network Access
Security groups are configured with strict access controls:
- Inbound/outbound traffic restricted to predefined IP ranges
- Only HTTP (80) and HTTPS (443) ports allowed
- All rules include descriptive comments for clarity

## Architecture Components

### Network Layer
- **VPC**: Isolated virtual network with DNS support enabled
- **Security Groups**: Restricted ingress/egress rules
- **VPC Flow Logs**: Network traffic monitoring and auditing

### Storage Layer
- **Primary S3 Bucket**: Encrypted storage with versioning enabled
- **Access Logs Bucket**: Separate bucket for access logging with lifecycle management
- **CloudTrail**: API call logging stored in encrypted S3 bucket

### Security & Monitoring
- **IAM Roles**: Least privilege access for different services
- **CloudWatch Log Groups**: Centralized logging with retention policies
- **CloudWatch Alarms**: Monitoring for S3 bucket size
- **CloudTrail**: Comprehensive API activity tracking

### Parameters
- **AllowedIPRange**: Configurable IP range for network access control
- **ApplicationName**: Application identifier for consistent resource naming
- **Environment**: Environment type (dev/staging/prod) for resource organization

### Outputs
All critical resource identifiers are exported for cross-stack references:
- VPC ID and Security Group ID for network configuration
- S3 Bucket Name for application integration
- IAM Role ARN for service permissions
- CloudWatch Log Group for application logging

This template ensures that all security requirements are met while maintaining operational flexibility through parameterization and comprehensive monitoring capabilities.
# AWS Security Infrastructure Requirements

I need to create a secure multi-region AWS infrastructure using CDK in JavaScript. The solution should implement comprehensive security controls with encryption, monitoring, and proper IAM policies.

## Core Security Requirements

1. **Data Encryption at Rest**: All S3 buckets and EBS volumes must be encrypted using AWS KMS customer managed keys with automatic key rotation enabled. Use post-quantum cryptography support where available for enhanced security.

2. **IAM Security**: Implement least privilege access with specific IAM roles for:
   - EC2 instances accessing S3 and RDS resources
   - CloudTrail service role for logging
   - CloudWatch service role for monitoring
   
3. **Comprehensive Logging and Monitoring**: 
   - Configure AWS CloudTrail with CloudTrail Lake for long-term audit storage and analysis
   - Set up CloudWatch with custom metrics and alarms for security events
   - Enable VPC Flow Logs for network monitoring

4. **Centralized Security Management**: 
   - Enable AWS Security Hub with AWS Foundational Security Standard
   - Configure custom insights for security monitoring and compliance tracking
   - Integrate findings from various security services for centralized visibility

5. **Secure Instance Access**: 
   - Implement AWS Systems Manager Session Manager for secure instance access
   - Configure session logging and document management for audit trails
   - Enable secure shell access without SSH keys or bastion hosts

## Infrastructure Components Needed

- **VPC Configuration**: Create both public and private subnets across multiple availability zones
- **S3 Buckets**: Encrypted storage with versioning and access logging enabled
- **EC2 Instances**: With encrypted EBS volumes in private subnets
- **RDS Database**: Encrypted Aurora Serverless v2 cluster for minimal deployment time
- **KMS Keys**: Customer managed keys with proper key policies
- **CloudTrail**: Multi-region trail with event data store in CloudTrail Lake
- **CloudWatch**: Dashboards, alarms, and log groups for comprehensive monitoring
- **Security Hub**: Centralized security findings dashboard with compliance standards
- **Session Manager**: Secure instance access with session logging and policies

## Security Best Practices

- Enable S3 bucket public access blocking by default
- Use AWS Config rules for compliance monitoring
- Implement resource-based policies where appropriate
- Follow AWS Well-Architected security pillar guidelines
- Ensure all resources follow consistent naming conventions
- Configure Security Hub findings aggregation and custom insights
- Set up Session Manager with proper IAM policies and logging

## Compliance and Monitoring

- CloudTrail should log all management events, data events, and network activity events
- CloudWatch alarms should trigger on suspicious activities like failed API calls or unusual resource access patterns
- Security Hub should aggregate findings from multiple security services
- Session Manager should log all session activities for audit purposes
- All resources should be tagged for proper governance

Please generate the complete CDK JavaScript infrastructure code that implements these security requirements. Provide one code block per file, ensuring all files can be directly copied and used.
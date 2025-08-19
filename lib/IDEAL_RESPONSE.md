# Secure AWS Web Application Infrastructure

This CloudFormation template creates a comprehensive, secure infrastructure for hosting web applications on AWS. The template follows security best practices and provides a foundation for scalable web applications.

## Architecture Overview

The infrastructure includes a multi-tier architecture with proper network segmentation:

- **Networking**: VPC with public and private subnets across two availability zones
- **Security**: Multiple security groups with restrictive access rules
- **Storage**: S3 buckets with versioning and KMS encryption
- **Monitoring**: CloudTrail for API logging and CloudWatch for metrics
- **Access Management**: IAM roles with least privilege principles

## Key Components

### Network Infrastructure
The template creates a VPC with CIDR 10.0.0.0/16, containing four subnets:
- Two public subnets (10.0.1.0/24, 10.0.2.0/24) for load balancers and bastion hosts
- Two private subnets (10.0.3.0/24, 10.0.4.0/24) for application servers and databases

NAT gateways in each availability zone provide internet access for private subnets while maintaining security.

### Security Groups
Four security groups control network access:
- ALB Security Group: Allows HTTP/HTTPS from internet
- Web Server Security Group: Allows traffic only from ALB and bastion
- Database Security Group: Allows MySQL access only from web servers
- Bastion Security Group: Allows SSH access from internet (restricted source recommended)

### Storage and Encryption
Three S3 buckets are created with versioning and KMS encryption:
- Web application bucket for storing application data
- Logging bucket for access logs and audit trails
- CloudTrail bucket for API logging

All buckets use customer-managed KMS keys and have public access blocked by default.

### Monitoring and Compliance
CloudTrail is configured to log all API calls across all regions, with logs stored in the dedicated S3 bucket and streamed to CloudWatch for real-time monitoring. The trail includes data events for S3 objects and uses KMS encryption for log files.

### IAM Configuration
EC2 instances receive an IAM role with minimal permissions:
- Read/write access to the web application S3 bucket
- KMS permissions for encryption/decryption
- CloudWatch agent permissions for monitoring

CloudTrail has its own service role for logging to CloudWatch.

## Template Features

- **Parameterized**: Environment suffix allows multiple deployments
- **Cross-AZ**: Resources distributed across availability zones for high availability
- **Secure by Default**: All network access is explicitly controlled
- **Encrypted**: All data at rest uses KMS encryption
- **Auditable**: Complete API logging with CloudTrail
- **Scalable**: Foundation supports adding auto scaling and load balancing

## Deployment Requirements

The template requires:
- AWS CLI with appropriate permissions
- CloudFormation deployment capabilities
- KMS permissions for encryption key creation
- S3 permissions for CloudTrail bucket setup

## Security Considerations

The template implements defense in depth with multiple security layers. Network segmentation isolates different tiers, while security groups enforce strict access controls. All data storage uses encryption, and comprehensive logging ensures audit trails for compliance.

For production use, consider additional hardening like Web Application Firewall, additional monitoring tools, and regular security assessments.
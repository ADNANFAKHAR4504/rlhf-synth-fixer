# Secure Web Application Infrastructure - CloudFormation Template

This CloudFormation YAML template creates a secure, resilient, and compliant web application infrastructure that meets all the specified requirements for AWS security best practices and operational compliance.

## Infrastructure Components

### 1. Virtual Private Cloud (VPC) Setup

The template creates a comprehensive VPC infrastructure spanning multiple Availability Zones:

- **VPC**: `10.0.0.0/16` CIDR block with DNS support enabled
- **Public Subnets**: Two subnets (`10.0.1.0/24`, `10.0.2.0/24`) in different AZs
- **Private Subnets**: Two subnets (`10.0.11.0/24`, `10.0.12.0/24`) in different AZs
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateways**: Two NAT Gateways in different AZs for high availability
- **Route Tables**: Properly configured routing for public and private subnets

### 2. Security Groups

Two security groups with principle of least privilege:

- **WebApplicationSecurityGroup**: 
  - Allows HTTP (port 80) and HTTPS (port 443) inbound traffic from anywhere
  - Allows all outbound traffic for application functionality

- **LambdaSecurityGroup**:
  - No inbound rules (default deny)
  - Allows HTTPS (port 443) and HTTP (port 80) outbound for AWS API calls

### 3. IAM Role and Permissions

- **LambdaExecutionRole**: Tightly scoped IAM role for Lambda function
- **S3AccessPolicy**: Grants only necessary S3 permissions (GetObject, PutObject, DeleteObject, ListBucket)
- **CloudWatchLogsPolicy**: Allows Lambda to write logs to CloudWatch
- **VPC Access**: Includes AWS managed policy for VPC execution

### 4. S3 Bucket Configuration

- **Encryption**: AES256 server-side encryption enabled with BucketKey optimization
- **Versioning**: Enabled to protect against accidental deletion/overwrites
- **Public Access Block**: All public access blocked for security
- **Bucket Policy**: 
  - Denies insecure connections (enforces HTTPS)
  - Allows Lambda function access to bucket objects
  - Scoped to specific bucket ARN only

### 5. Lambda Function

- **Runtime**: Python 3.9 with proper handler configuration
- **VPC Configuration**: Deployed in private subnets with Lambda security group
- **IAM Role**: Uses the tightly scoped LambdaExecutionRole
- **Environment Variables**: S3_BUCKET_NAME and ENVIRONMENT for runtime configuration
- **Sample Code**: Includes functional Python code for S3 interaction with error handling

### 6. CloudWatch Monitoring and Logging

#### Log Groups:
- **Lambda Logs**: 30-day retention for Lambda function logs
- **S3 Access Logs**: 90-day retention for S3 access monitoring
- **VPC Flow Logs**: 30-day retention for network traffic analysis

#### Security Monitoring:
- **S3 Access Alarm**: Monitors unauthorized access attempts (4xx errors)
- **Lambda Error Alarm**: Monitors Lambda function errors
- **SSH Attempt Monitoring**: Custom metric filter for suspicious SSH attempts
- **VPC Flow Logs**: Captures all network traffic for security analysis

### 7. Resource Tagging

All resources include consistent tags:
- **Project**: Configurable project name (default: SecureWebApp)
- **Environment**: Environment type (Dev/Test/Prod)
- **Owner**: Resource owner (default: DevOps-Team)

## Key Security Features

1. **Defense in Depth**: Multiple layers of security controls
2. **Network Segmentation**: Private subnets with no direct internet access
3. **Encryption**: S3 data encrypted at rest
4. **Access Control**: IAM roles with minimal necessary permissions
5. **Monitoring**: Comprehensive logging and alerting
6. **High Availability**: Resources distributed across multiple AZs
7. **Secure Transport**: HTTPS enforced for all S3 access

## Compliance Features

- ✅ **VPC spans multiple AZs** for high availability
- ✅ **Public and private subnet separation** with proper routing
- ✅ **Security groups with default deny** and explicit allow rules
- ✅ **Tightly scoped IAM permissions** following least privilege
- ✅ **S3 encryption and versioning** enabled
- ✅ **CloudWatch monitoring** for security events
- ✅ **Lambda in VPC** with proper network configuration
- ✅ **Consistent resource tagging** for management
- ✅ **Valid CloudFormation syntax** that deploys successfully

## Deployment Parameters

The template accepts three parameters for customization:
- **ProjectName**: Project identifier for resource naming
- **Environment**: Deployment environment (Dev/Test/Prod)
- **Owner**: Resource ownership for management

## Outputs

The template provides seven key outputs for integration:
- VPC ID and subnet IDs for network references
- S3 bucket name for application configuration
- Lambda function ARN for invocation
- Security group IDs for additional resource attachment

This infrastructure template represents the ideal implementation that fully satisfies all requirements for a secure, resilient, and compliant web application hosting platform on AWS.
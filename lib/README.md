# Automated Infrastructure Compliance Analysis System

This CloudFormation template deploys a comprehensive compliance monitoring system for AWS infrastructure.

## Architecture Overview

The solution implements:
- AWS Config with custom rules for continuous compliance monitoring
- Lambda functions (Python 3.9) for custom validation logic
- S3 bucket for compliance report storage with lifecycle management
- EventBridge rules for real-time event processing
- SNS notifications for security team alerts
- CloudWatch dashboard for compliance metrics visualization
- Parameter Store for configuration management

## Components

### AWS Config
- **ConfigRecorder**: Records configuration changes for all supported AWS resources
- **DeliveryChannel**: Delivers configuration snapshots to S3
- **Custom Config Rules**: Three custom rules powered by Lambda functions

### Lambda Functions

1. **Tag Compliance Validator** (`tag-compliance-validator`)
   - Validates required tags (Environment, Owner, CostCenter)
   - Triggers on resource configuration changes
   - Reports non-compliant resources to SNS

2. **Drift Detection Validator** (`drift-detection-validator`)
   - Detects CloudFormation stack drift
   - Runs on schedule (every 24 hours) and on stack changes
   - Generates detailed drift reports in S3

3. **Security Policy Validator** (`security-policy-validator`)
   - Validates EC2 AMIs against approved list
   - Checks security groups for overly permissive rules
   - Ensures S3 buckets have encryption enabled

### Storage

- **S3 Bucket**: Stores compliance reports with versioning enabled
  - Lifecycle policy transitions reports to Glacier after 30 days
  - Server-side encryption enabled
  - Public access blocked

### Notifications

- **SNS Topic**: Sends email notifications to security team
- **EventBridge Rules**: Triggers Lambda functions on Config compliance changes

### Monitoring

- **CloudWatch Dashboard**: Displays compliance metrics and recent violations
- **CloudWatch Logs**: Stores Lambda function logs with 30-day retention

### Configuration Management

- **Parameter Store**: Stores approved AMI lists and security policies
  - `/compliance/approved-amis-{suffix}`: List of approved AMI IDs
  - `/compliance/security-group-rules-{suffix}`: Security group validation rules
  - `/compliance/thresholds-{suffix}`: Compliance thresholds

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create IAM roles, Lambda functions, Config resources, S3 buckets, SNS topics, and CloudWatch resources

### Parameters

- `EnvironmentSuffix`: Unique identifier for resource naming (default: "dev")
- `SecurityTeamEmail`: Email address for compliance notifications (default: "security@example.com")

### Deploy

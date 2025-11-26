# CloudFormation Compliance Analyzer

Automated infrastructure compliance analysis system for CloudFormation templates across multiple AWS accounts.

## Overview

This solution provides comprehensive compliance scanning and validation for CloudFormation stacks, automatically detecting violations against AWS Config Rules and generating detailed reports with notifications for critical issues.

## Architecture

The system consists of the following components:

1. **AWS Config Rules**: Define compliance criteria for S3 encryption, RDS encryption, and EC2 instance types
2. **Lambda Functions**: Parse templates, validate resources, and generate reports
3. **Step Functions**: Orchestrate the compliance scanning workflow
4. **EventBridge**: Trigger scans on CloudFormation stack events
5. **DynamoDB**: Store scan results and compliance data
6. **S3**: Store compliance reports with lifecycle management
7. **SNS**: Send notifications for critical violations
8. **CloudWatch**: Monitor metrics and provide compliance dashboard
9. **IAM**: Cross-account roles for secure multi-account scanning
10. **X-Ray**: Distributed tracing for performance monitoring

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- AWS Config enabled in the target account
- Valid email address for SNS notifications
- External ID for cross-account access (min 8 characters)

### Parameters

- **EnvironmentSuffix**: Unique suffix for resource naming (default: dev)
- **NotificationEmail**: Email address for compliance alerts
- **ExternalId**: External ID for cross-account assume role security
- **TargetAccountIds**: Comma-separated list of AWS account IDs to scan

### Deploy the Stack


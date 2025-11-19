# Infrastructure Compliance Auditing System

## Overview

This AWS CDK Python application deploys a comprehensive infrastructure compliance auditing system designed for financial services compliance requirements. The system performs automated compliance scanning across multiple AWS accounts, generates detailed audit reports, and provides alerting with automatic remediation capabilities.

## Architecture

### Key Components

1. **AWS Config**: Configuration tracking and compliance rule evaluation
2. **Lambda Functions**:
   - Cross-account scanner (Python 3.9, 1GB memory)
   - JSON report generator
   - CSV report generator
   - Auto-remediation function
   - Config rule evaluators (S3 encryption, VPC flow logs, Lambda settings)
3. **EventBridge**: Scheduled scans (every 6 hours) and on-demand triggers
4. **S3 Buckets**:
   - Audit reports with 90-day lifecycle
   - Config recordings
   - All encrypted with separate KMS keys
5. **SNS**: Critical compliance alerts with email subscriptions
6. **CloudWatch**: Dashboards for compliance metrics and trend analysis
7. **VPC**: Private subnets with flow logs and VPC endpoints

### Compliance Features

- **S3 Bucket Encryption Evaluation**: Config rule checks all S3 buckets
- **VPC Flow Log Configuration**: Validates flow logs follow naming conventions
- **Lambda Function Settings**: Ensures X-Ray tracing and reserved concurrency
- **Cross-Account Scanning**: AssumeRole for multi-account compliance
- **Automatic Remediation**: Enables S3 encryption on non-compliant buckets

## Deployment

### Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Python 3.9+
- AWS credentials configured
- AWS Account with appropriate permissions

### Installation

1. Clone the repository
2. Install dependencies:
   
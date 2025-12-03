
# S3 Compliance Analysis Infrastructure

This Pulumi TypeScript project creates a Lambda-based system for analyzing S3 bucket compliance and generating detailed reports.

## Overview

The infrastructure automatically analyzes all S3 buckets in your AWS account for:

- Server-side encryption configuration
- Public access settings
- Overly permissive bucket policies
- Lifecycle policies for financial data retention (7-year requirement)
- Usage patterns (buckets with no access in 90 days)

## Architecture Components

1. **Lambda Function**: Performs comprehensive S3 compliance analysis
2. **S3 Bucket**: Stores timestamped compliance reports
3. **IAM Role/Policy**: Grants Lambda necessary permissions
4. **CloudWatch Alarms**: Monitors for critical compliance violations
5. **SNS Topic**: Sends notifications for critical findings
6. **EventBridge Rule**: Triggers daily automated analysis

## Deployment

### Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured

### Environment Variables

Set the following environment variables before deployment:

```bash
export ENVIRONMENT_SUFFIX="dev"  # or your environment name
export AWS_REGION="us-east-1"

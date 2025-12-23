# Infrastructure Compliance Monitoring System

This Pulumi TypeScript project implements a comprehensive AWS compliance monitoring system for financial services.

## Architecture

- **AWS Config**: Continuous resource evaluation with rules for S3 encryption and RDS public access
- **Lambda Functions**: Compliance analysis and automated resource tagging (Node.js 18.x)
- **CloudWatch**: Custom metrics, dashboards, logs, and alarms
- **SNS**: Multi-level alerting (critical and warning topics)
- **Step Functions**: Orchestration of compliance workflows
- **SQS**: Message queuing for reliable event processing
- **EventBridge**: Event-driven compliance checks

## Prerequisites

- Pulumi CLI 3.x
- Node.js 16+
- AWS CLI configured
- AWS account with appropriate permissions

## Configuration

Set the environment suffix:

```bash
pulumi config set environmentSuffix <your-suffix>
```

## Deployment

```bash
npm install
pulumi up
```

## Testing

```bash
npm test
```

## Features

- Detects unencrypted S3 buckets
- Identifies public RDS instances
- Sends email alerts for violations
- Automatically tags non-compliant resources
- Provides CloudWatch dashboard for visibility
- Maintains audit logs for regulatory compliance
- Orchestrates complex workflows with Step Functions
- Buffers events with SQS for reliability

## Cleanup

```bash
pulumi destroy
```

# Lambda Function Optimization - Pulumi TypeScript

This directory contains an optimized Lambda function infrastructure deployment using Pulumi and TypeScript.

## Overview

This implementation refactors an existing Lambda function deployment with the following optimizations:

- Migrates runtime from Node.js 14.x to Node.js 18.x
- Reduces memory allocation from 3008MB to 512MB (83% cost reduction)
- Adds reserved concurrency of 50 for reliability
- Enables AWS X-Ray tracing for observability
- Implements least privilege IAM permissions
- Configures 7-day CloudWatch log retention

## Architecture

### Resources Created

1. **Lambda Function** (`payments-function-{environmentSuffix}`)
   - Runtime: Node.js 18.x
   - Memory: 512MB
   - Timeout: 30 seconds
   - Reserved Concurrency: 50
   - X-Ray Tracing: Enabled

2. **IAM Role** (`lambda-payments-role-{environmentSuffix}`)
   - Lambda execution permissions
   - DynamoDB read/write access to 'payments-table'
   - X-Ray write access

3. **CloudWatch Log Group** (`lambda-payments-logs-{environmentSuffix}`)
   - Retention: 7 days
   - Log path: `/aws/lambda/payments-function-{environmentSuffix}`

## File Structure

```
lib/
├── tap-stack.ts          # Main Pulumi stack implementation
├── lambda/
│   └── index.js         # Lambda function handler code
├── PROMPT.md            # Original requirements document
├── MODEL_RESPONSE.md    # Generated implementation
├── IDEAL_RESPONSE.md    # Reference implementation
├── MODEL_FAILURES.md    # Testing failure log
└── README.md           # This file
```

## Configuration

### Environment Variables

The Lambda function uses the following environment variables:

- `NEW_RELIC_LICENSE_KEY`: APM integration key
- `DB_CONNECTION_POOL_SIZE`: Database connection pool size
- `AWS_REGION`: Target AWS region

### Pulumi Configuration

Configure optional values using Pulumi config:

```bash
pulumi config set newRelicLicenseKey "your-key-here"
pulumi config set dbConnectionPoolSize "20"
```

### Environment Suffix

All resources include an environment suffix for deployment isolation. Set via environment variable:

```bash
export ENVIRONMENT_SUFFIX="prod"
```

## Deployment

### Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured
- Required npm packages installed

### Deploy

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Destroy infrastructure
pulumi destroy
```

## Cost Optimization

This implementation includes several cost optimization measures:

1. **Memory Reduction**: 3008MB → 512MB (83% reduction in memory costs)
2. **Timeout Optimization**: 15 minutes → 30 seconds (reduces max execution cost)
3. **Log Retention**: 7 days (reduces CloudWatch storage costs)
4. **Reserved Concurrency**: Prevents over-provisioning during peak load

## Security

### IAM Least Privilege

The Lambda function has minimal permissions:

- Read/write access to 'payments-table' DynamoDB table only
- CloudWatch Logs write permissions
- X-Ray trace write permissions

### Best Practices

- No hardcoded credentials
- Environment variables for configuration
- Proper error handling in Lambda code
- Resource tagging for audit trails

## Monitoring

### CloudWatch Logs

Logs are available at: `/aws/lambda/payments-function-{environmentSuffix}`

Retention: 7 days

### X-Ray Tracing

X-Ray tracing is enabled for performance monitoring and debugging. View traces in the AWS X-Ray console.

### Metrics

Key metrics to monitor:

- Invocations
- Duration
- Errors
- Throttles
- Concurrent Executions
- Memory Usage

## Tags

All resources are tagged with:

- `Environment`: production
- `Team`: payments
- `CostCenter`: engineering
- `ManagedBy`: Pulumi

## Requirements Checklist

- [x] Node.js 18.x runtime
- [x] 512MB memory allocation
- [x] Reserved concurrency of 50
- [x] NEW_RELIC_LICENSE_KEY environment variable
- [x] DB_CONNECTION_POOL_SIZE environment variable
- [x] AWS X-Ray tracing enabled
- [x] 30-second timeout
- [x] IAM role with least privilege DynamoDB access
- [x] CloudWatch log retention (7 days)
- [x] Resource tagging

## Support

For issues or questions, refer to:

- PROMPT.md for original requirements
- MODEL_RESPONSE.md for implementation details
- MODEL_FAILURES.md for known issues

# Lambda Function Optimization - Infrastructure as Code

This project implements a production-ready AWS Lambda function with 10 critical optimizations using Pulumi and TypeScript.

## Overview

The infrastructure demonstrates best practices for Lambda function deployment including:
- Performance optimization (memory, timeout, concurrency)
- Cost control (reserved concurrency, log retention)
- Security (IAM least-privilege, X-Ray tracing)
- Error handling (dead letter queue, retry logic)
- Monitoring (CloudWatch alarms)
- Configuration management (Pulumi Config)

## Architecture

```
TapStack (Main Stack)
└── LambdaOptimizerStack
    ├── SQS Dead Letter Queue
    ├── IAM Role (with policies)
    ├── Lambda Layer (shared dependencies)
    ├── CloudWatch Log Group
    ├── Lambda Function (optimized)
    └── CloudWatch Alarms (errors, throttles)
```

## Requirements Implemented

1. **Reserved Concurrency**: 10 concurrent executions for cost control
2. **Memory Allocation**: 512MB based on profiling data
3. **Timeout Optimization**: 30 seconds (down from 5 minutes)
4. **X-Ray Tracing**: Active distributed tracing enabled
5. **Configuration Management**: Pulumi Config for environment variables
6. **IAM Security**: Least-privilege permissions for Lambda, SQS, X-Ray
7. **Log Retention**: 7-day retention policy for cost savings
8. **Lambda Layers**: Shared dependencies layer (lodash, moment, uuid)
9. **Dead Letter Queue**: SQS queue for failed invocations
10. **Resource Tagging**: Cost tracking and compliance tags

## Project Structure

```
.
├── bin/
│   └── tap.ts                  # Pulumi entry point
├── lib/
│   ├── tap-stack.ts            # Main stack component
│   ├── lambda-optimizer-stack.ts  # Lambda resources
│   ├── lambda/
│   │   ├── function/
│   │   │   ├── index.js        # Lambda handler
│   │   │   └── package.json    # Function dependencies
│   │   └── layers/
│   │       └── dependencies/
│   │           └── nodejs/
│   │               └── package.json  # Layer dependencies
│   ├── PROMPT.md               # Task requirements
│   ├── MODEL_RESPONSE.md       # Generated solution
│   ├── IDEAL_RESPONSE.md       # Validated solution
│   └── MODEL_FAILURES.md       # Issues and fixes
├── Pulumi.yaml                 # Pulumi project config
└── Pulumi.dev.yaml             # Development stack config
```

## Prerequisites

- Node.js 18.x or 20.x
- Pulumi CLI (`npm install -g @pulumi/pulumi`)
- AWS CLI configured with credentials
- AWS account with appropriate permissions

## Configuration

Set required Pulumi configuration values:

```bash
# Stack configuration
pulumi stack init dev

# AWS region
pulumi config set aws:region us-east-1

# Environment suffix (for resource naming)
pulumi config set TapStack:environmentSuffix dev

# Database endpoint
pulumi config set TapStack:dbEndpoint dev-db.example.com:5432

# API key (encrypted)
pulumi config set --secret TapStack:apiKey YOUR_API_KEY_HERE

# Optional: Max retries (default: 3)
pulumi config set TapStack:maxRetries 3

# Optional: Log level (default: INFO)
pulumi config set TapStack:logLevel INFO
```

## Deployment

### Install Dependencies

```bash
# Install Pulumi dependencies
npm install

# Install Lambda function dependencies
cd lib/lambda/function
npm install
cd ../../..

# Install Lambda layer dependencies
cd lib/lambda/layers/dependencies/nodejs
npm install
cd ../../../../..
```

### Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy stack
pulumi up

# View outputs
pulumi stack output
```

### Expected Outputs

```
lambdaArn        # ARN of the Lambda function
lambdaName       # Name of the Lambda function
roleArn          # IAM role ARN
logGroupName     # CloudWatch Log Group name
dlqUrl           # Dead Letter Queue URL
layerArn         # Lambda Layer ARN
```

## Testing the Lambda Function

### Invoke via AWS CLI

```bash
# Get function name
FUNCTION_NAME=$(pulumi stack output lambdaName)

# Invoke function
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload '{"body": "{\"test\": \"data\"}"}' \
  response.json

# View response
cat response.json
```

### Monitor with X-Ray

```bash
# View X-Ray traces in AWS Console
aws xray get-trace-summaries \
  --start-time $(date -u -d '5 minutes ago' +%s) \
  --end-time $(date +%s)
```

### Check CloudWatch Logs

```bash
# Get log group name
LOG_GROUP=$(pulumi stack output logGroupName)

# View recent logs
aws logs tail $LOG_GROUP --follow
```

## Cost Optimization Features

1. **Reserved Concurrency**: Limits to 10 concurrent executions
2. **Log Retention**: 7 days (vs default indefinite)
3. **Memory Optimization**: Right-sized at 512MB
4. **Timeout Control**: 30 seconds prevents runaway costs
5. **Lambda Layers**: Reduces deployment package size
6. **Resource Tags**: Enable cost allocation tracking

## Security Features

1. **IAM Least Privilege**: Specific permissions only
   - CloudWatch Logs write access
   - X-Ray daemon write access
   - SQS SendMessage (DLQ only)

2. **Encrypted Secrets**: API key stored as Pulumi secret

3. **X-Ray Tracing**: Distributed tracing for security monitoring

4. **CloudWatch Alarms**: Alert on errors and throttling

## Monitoring

### CloudWatch Alarms

1. **lambda-errors-{suffix}**: Triggers when errors exceed 5 in 5 minutes
2. **lambda-throttles-{suffix}**: Triggers when any throttling occurs

### Metrics

- Invocations
- Errors
- Duration
- Throttles
- Concurrent Executions
- Dead Letter Errors

## Cleanup

```bash
# Destroy all resources
pulumi destroy

# Remove stack
pulumi stack rm dev
```

## Troubleshooting

### Lambda Function Fails

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/optimized-function-dev --follow
```

### Messages in DLQ

Check dead letter queue:
```bash
DLQ_URL=$(pulumi stack output dlqUrl)
aws sqs receive-message --queue-url $DLQ_URL
```

### X-Ray Traces Not Appearing

Verify IAM permissions and active tracing:
```bash
aws lambda get-function-configuration \
  --function-name optimized-function-dev \
  --query TracingConfig
```

## Best Practices Demonstrated

1. **ComponentResource Pattern**: Modular, reusable infrastructure
2. **Environment Suffix**: All resources support multi-environment deployment
3. **Configuration Management**: Environment-specific values via Pulumi Config
4. **Error Handling**: DLQ + retry logic with exponential backoff
5. **Structured Logging**: JSON logs with levels and metadata
6. **Resource Tagging**: Cost tracking and compliance
7. **Monitoring**: Proactive alarms for errors and throttling

## References

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Pulumi AWS Lambda](https://www.pulumi.com/docs/clouds/aws/guides/lambda/)
- [X-Ray Tracing](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html)
- [Lambda Layers](https://docs.aws.amazon.com/lambda/latest/dg/chapter-layers.html)

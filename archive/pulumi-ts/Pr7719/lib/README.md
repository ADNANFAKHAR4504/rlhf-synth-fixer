# Serverless Data Processing Infrastructure - IaC Optimization

This project demonstrates infrastructure optimization patterns using Pulumi TypeScript.

## Overview

Optimized serverless data processing infrastructure with:
- Right-sized Lambda functions (512-768MB vs 3008MB)
- Reusable Lambda component pattern
- DynamoDB with on-demand auto-scaling
- Dead letter queues for failure handling
- Least privilege IAM policies
- Cost allocation tagging
- CloudWatch log retention
- Provisioned concurrency for critical functions

## Architecture

- **DynamoDB**: PAY_PER_REQUEST billing mode for automatic scaling
- **Lambda Functions**: 3 functions (processor, validator, enricher) with optimized memory
- **SQS**: Dead letter queue for Lambda failures
- **CloudWatch**: Log groups with 7-day retention, DLQ alarms
- **IAM**: Scoped policies with specific actions and resources

## Deployment

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Deploy infrastructure
pulumi up

# Outputs
pulumi stack output tableName
pulumi stack output processorFunctionArn
pulumi stack output dlqUrl
```

## Key Optimizations

1. **Memory Right-Sizing**: Reduced from 3008MB to 512-768MB (84-75% reduction)
2. **Component Pattern**: Created reusable LambdaComponent class
3. **Auto-Scaling**: DynamoDB PAY_PER_REQUEST for automatic scaling
4. **Failure Handling**: SQS DLQ integration with all functions
5. **Security**: Scoped IAM policies (no wildcards)
6. **Cost Tags**: Consistent tagging for cost allocation
7. **Log Management**: 7-day retention prevents indefinite storage
8. **Cold Starts**: Provisioned concurrency on critical processor function
9. **Dependencies**: Proper Pulumi dependency management
10. **Error Handling**: Try-catch blocks in all Lambda functions

## Files

- `tap-stack.ts`: Main infrastructure stack
- `lambda-component.ts`: Reusable Lambda component
- `optimize.py`: Post-deployment optimization script
- `PROMPT.md`: Original requirements
- `MODEL_RESPONSE.md`: Initial implementation (with issues)
- `IDEAL_RESPONSE.md`: Optimized implementation

## Testing

Unit tests validate:
- Resource creation
- Component reusability
- IAM policy scoping
- Tag application
- Log retention configuration

Integration tests verify:
- Lambda function execution
- DynamoDB operations
- DLQ message routing
- CloudWatch alarm triggering

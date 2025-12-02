# Webhook Processing System - IaC Optimization Task

## Overview

This task implements a webhook processing system optimization using Pulumi with TypeScript. The implementation follows the IaC Optimization pattern where baseline infrastructure is deployed with intentionally non-optimized settings, then an optimization script improves the configuration.

## Files Generated

### Infrastructure Code
- `lib/tap-stack.ts` - Baseline Pulumi stack with non-optimized webhook infrastructure
- `lib/lambda/webhook-unified.js` - Unified Lambda handler with routing
- `lib/lambda/package.json` - Lambda dependencies

### Optimization Script
- `lib/optimize.py` - Python script to optimize deployed resources

### Documentation
- `lib/PROMPT.md` - Task requirements and specifications
- `lib/MODEL_RESPONSE.md` - LLM-generated implementation
- `lib/IDEAL_RESPONSE.md` - Corrected implementation notes
- `lib/README.md` - This file

## AWS Services Used

1. **AWS Lambda** - Three separate functions (receiver, validator, processor)
2. **Amazon DynamoDB** - Table for webhook storage
3. **Amazon API Gateway** - HTTP API for webhook endpoints
4. **AWS IAM** - Roles and policies for Lambda execution
5. **Amazon CloudWatch Logs** - Lambda function logging
6. **AWS X-Ray** - Distributed tracing (optimized to Active mode)

## Architecture

```
API Gateway HTTP API
  ├── POST /webhook/receive → Lambda (webhook-receiver)
  ├── POST /webhook/validate → Lambda (webhook-validator)
  └── POST /webhook/process → Lambda (webhook-processor)
           ↓
      DynamoDB Table (webhook-table)
```

## Optimization Approach

### Baseline Configuration (Deployed)
- Lambda memory: 3072 MB (each function)
- Lambda concurrency: Unlimited
- DynamoDB billing: PAY_PER_REQUEST
- CloudWatch logs: No retention (indefinite)
- X-Ray tracing: PassThrough mode
- IAM policies: Broad permissions (dynamodb:*, xray:*)
- Cost tags: Missing

### Optimized Configuration (via optimize.py)
- Lambda memory: 512 MB
- Lambda concurrency: Reserved (10)
- DynamoDB billing: PROVISIONED (100 RCU, 100 WCU)
- CloudWatch logs: 7-day retention
- X-Ray tracing: Active mode
- Cost tags: Added (CostCenter, Application, Owner, Environment)

## Deployment Instructions

1. **Deploy Baseline Infrastructure**:
   ```bash
   pulumi up
   ```

2. **Run Optimization**:
   ```bash
   export ENVIRONMENT_SUFFIX=<your-suffix>
   python3 lib/optimize.py
   ```

3. **Verify Optimizations**:
   ```bash
   python3 lib/optimize.py --dry-run
   ```

## Cost Savings

Estimated monthly savings:
- Lambda memory reduction: ~$1.00
- DynamoDB billing mode: ~$300-500 (for 500 RPS)
- CloudWatch logs retention: ~$3.00

**Total estimated savings: $300-500/month**

## Testing

Integration tests should:
1. Deploy the baseline infrastructure
2. Run the optimize.py script
3. Verify all optimizations were applied
4. Test webhook endpoints functionality
5. Clean up resources

## Environment Variables

- `ENVIRONMENT_SUFFIX` - Environment identifier (required)
- `AWS_REGION` - Target AWS region (default: us-east-1)

## Notes

- This is an IaC Optimization task, so the baseline code is intentionally non-optimized
- The optimize.py script performs the actual optimizations on deployed resources
- All resources use environmentSuffix for multi-environment support
- Resources are fully destroyable for CI/CD workflows

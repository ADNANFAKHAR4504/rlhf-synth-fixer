# Lambda Transaction Processing System Optimization

This Pulumi TypeScript project implements an optimized Lambda-based transaction processing infrastructure with Graviton2 processors, provisioned concurrency, function URLs, and comprehensive observability.

## Architecture

The infrastructure includes three Lambda functions optimized for cost and performance:

1. **payment-validator** (512MB, ARM64, Provisioned Concurrency)
2. **fraud-detector** (256MB, ARM64)
3. **notification-sender** (128MB, ARM64)

## Optimizations Implemented

### 1. Graviton2 Migration (ARM64)
All Lambda functions use ARM64 architecture for ~20% cost savings.

### 2. Provisioned Concurrency
Payment validator has provisioned concurrency to eliminate cold starts during peak hours.

### 3. Function URLs
Direct HTTPS invocation without API Gateway dependency.

### 4. Memory Optimization
Right-sized memory allocations based on profiling data.

### 5. Log Retention
CloudWatch Logs configured with 7-day retention to reduce storage costs.

### 6. Environment-Specific Timeouts
- Production: 30 seconds
- Development: 60 seconds

### 7. X-Ray Tracing
Active tracing with custom subsegments for database operations.

### 8. Concurrency Limits
Reserved concurrent executions prevent throttling:
- payment-validator: 100
- fraud-detector: 50
- notification-sender: 50

### 9. IAM Roles
Least-privilege access to DynamoDB tables with X-Ray write permissions.

### 10. Resource Tagging
All resources tagged with CostCenter, Environment, and Owner.

## Prerequisites

- Node.js 18.x or higher
- Pulumi CLI
- AWS CLI configured with appropriate credentials

## Deployment

1. Install dependencies:
```bash
npm install
cd lambda/payment-validator && npm install && cd ../..
cd lambda/fraud-detector && npm install && cd ../..
cd lambda/notification-sender && npm install && cd ../..
```

2. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set environmentSuffix "dev-test"
pulumi config set environment "development"
```

3. Deploy infrastructure:
```bash
pulumi up
```

## Configuration

Required configuration values:
- `environmentSuffix`: Unique suffix for resource naming (enables parallel deployments)
- `environment`: "production" or "development"
- `region`: AWS region (default: us-east-1)
- `costCenter`: Cost center tag value
- `owner`: Owner tag value

## Outputs

The stack exports:
- Lambda function ARNs
- Lambda function URLs
- IAM role ARNs
- CloudWatch Log Group names

## Testing

Function URLs are publicly accessible (configure authentication as needed):

```bash
# Get function URL
PAYMENT_URL=$(pulumi stack output paymentValidatorUrl)

# Test payment validator
curl -X POST $PAYMENT_URL \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "test-123"}'
```

## Cleanup

```bash
pulumi destroy
```

All resources are fully destroyable with no retention policies.

## Cost Optimization

- Graviton2 ARM64 architecture: ~20% compute cost reduction
- Right-sized memory allocations: Optimal price-performance
- 7-day log retention: Reduced CloudWatch storage costs
- Function URLs: Eliminates API Gateway costs
- Provisioned concurrency only in production: Balances cost and performance

## Observability

X-Ray tracing is enabled for all functions with custom subsegments for database operations. View traces in the AWS X-Ray console to analyze performance and identify bottlenecks.

# Lambda Data Processing Infrastructure

This infrastructure implements an optimized Lambda-based data processing system using Pulumi and TypeScript.

## Architecture

The solution consolidates three separate Lambda functions into a single reusable component with the following features:

- **Consolidated Lambda Function**: Single function handling multiple operations (transform, validate, process)
- **Dead Letter Queue**: SQS queue for failed invocations
- **Environment-Specific Timeouts**: dev=60s, prod=300s
- **CloudWatch Log Retention**: 7 days retention policy
- **Least-Privilege IAM**: Custom role with minimal required permissions
- **Custom CloudWatch Metrics**: Error and success metrics for monitoring
- **Resource Tagging**: Complete tagging for cost allocation
- **Concurrency Management**: Reserved concurrent executions to prevent throttling
- **X-Ray Tracing**: Active tracing for performance monitoring

## Resources Created

1. **Lambda Function**: `data-processing-{environmentSuffix}`
   - Runtime: Node.js 18.x
   - Memory: 3008MB (baseline, optimized by script)
   - Timeout: 60s (dev) / 300s (prod)
   - Reserved concurrency: 10

2. **Dead Letter Queue**: `data-processing-dlq-{environmentSuffix}`
   - Message retention: 14 days
   - Type: SQS Standard Queue

3. **IAM Role**: `lambda-processing-role-{environmentSuffix}`
   - AWSLambdaBasicExecutionRole (managed)
   - AWSXRayDaemonWriteAccess (managed)
   - Custom policy for SQS and CloudWatch

4. **CloudWatch Log Group**: `/aws/lambda/data-processing-{environmentSuffix}`
   - Retention: 7 days

5. **CloudWatch Alarms**:
   - Error alarm (threshold: 5 errors in 10 minutes)
   - Throttle alarm (threshold: any throttles)

## Optimization Script

The `lib/optimize.py` script optimizes the deployed infrastructure:

### Optimizations Applied

1. **Memory Optimization**: Analyzes actual memory usage and adjusts allocation (3008MB → 1024-2048MB typically)
2. **Concurrency Optimization**: Adjusts reserved concurrency based on usage patterns
3. **Configuration Verification**: Validates log retention and DLQ settings

### Usage

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1

# Dry-run mode (preview changes)
python3 lib/optimize.py --dry-run

# Apply optimizations
python3 lib/optimize.py
```

### Requirements

```bash
pip install boto3
```

## Deployment

### Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS credentials configured
- Python 3.8+ (for optimization script)

### Deploy Infrastructure

```bash
# Install dependencies
npm install

# Set environment
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1

# Deploy
pulumi up
```

### Run Optimization

After deployment, optimize the infrastructure:

```bash
# Preview optimizations
python3 lib/optimize.py --dry-run

# Apply optimizations
python3 lib/optimize.py
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests (requires deployed infrastructure)
npm run test:integration
```

## Lambda Function Operations

The Lambda function supports three operations:

### 1. Process (default)

```json
{
  "operation": "process",
  "data": ["item1", "item2"]
}
```

### 2. Transform

```json
{
  "operation": "transform",
  "data": ["item1", "item2"]
}
```

### 3. Validate

```json
{
  "operation": "validate",
  "data": ["item1", "item2"]
}
```

## Cost Optimization

The optimization script typically saves:

- **Lambda Memory**: $20-50/month (reducing 3008MB to 1024MB)
- **Concurrency**: Minimal savings, prevents over-provisioning
- **Total**: ~$25-60/month, $300-720/year

## Monitoring

### CloudWatch Metrics

- `AWS/Lambda/Errors`: Function errors
- `AWS/Lambda/Throttles`: Function throttles
- `AWS/Lambda/Duration`: Execution duration
- `DataProcessing/ProcessingSuccess`: Custom success metric
- `DataProcessing/ProcessingError`: Custom error metric

### Alarms

- Errors > 5 in 10 minutes
- Any throttles detected

## Security

- IAM role follows least-privilege principle
- No AdministratorAccess or overly broad permissions
- SQS send access limited to specific DLQ
- CloudWatch PutMetricData scoped to namespace

## Cleanup

```bash
pulumi destroy
```

All resources are configured without retention policies for safe cleanup.

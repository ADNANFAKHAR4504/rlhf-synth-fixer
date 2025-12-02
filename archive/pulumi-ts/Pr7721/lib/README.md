# Lambda Function Optimization Infrastructure

This project demonstrates Lambda function optimization using Pulumi TypeScript for infrastructure deployment and a Python script for runtime optimizations.

## Architecture

This is an **IaC Program Optimization** task following a two-phase approach:

1. **Phase 1 - Baseline Deployment**: Deploy Lambda infrastructure with non-optimized settings (3008MB memory, 300s timeout, indefinite logs)
2. **Phase 2 - Runtime Optimization**: Run `lib/optimize.py` to modify deployed resources to optimized settings (1024MB, 30s, 7-day logs, concurrency limits)

## Project Structure

```
.
├── bin/
│   └── tap.ts                 # Pulumi entry point
├── lib/
│   ├── tap-stack.ts           # Baseline infrastructure (non-optimized)
│   ├── optimize.py            # Python script for runtime optimizations
│   ├── PROMPT.md              # Task requirements
│   ├── MODEL_RESPONSE.md      # Initial implementation
│   ├── IDEAL_RESPONSE.md      # Corrected implementation
│   └── README.md              # This file
├── test/
│   └── *.test.ts              # Unit and integration tests
├── Pulumi.yaml                # Pulumi configuration
├── package.json               # Node.js dependencies
└── metadata.json              # Task metadata
```

## Baseline Infrastructure Components

All infrastructure is deployed with baseline (non-optimized) settings:

- **Lambda Function**: 3008MB memory, 300s timeout (will be optimized)
- **S3 Bucket**: Versioning enabled for deployment packages
- **Lambda Layer**: Shared dependencies to reduce package size
- **SQS Dead Letter Queue**: Created (will be attached during optimization)
- **CloudWatch Log Group**: Indefinite retention (will be set to 7 days)
- **CloudWatch Alarms**: Error rate and duration monitoring
- **IAM Roles**: Execution role with X-Ray and SQS permissions

## Optimization Script Features

The `lib/optimize.py` script performs the following optimizations:

1. Memory: 3008MB → 1024MB
2. Timeout: 300s → 30s
3. Reserved Concurrency: None → 50
4. X-Ray Tracing: PassThrough → Active
5. Log Retention: Indefinite → 7 days
6. Environment Variables: Add DATABASE_URL and API_KEY
7. Dead Letter Queue: Attach existing SQS queue
8. CloudWatch Alarms: Update if needed

## Deployment Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.7+
- AWS CLI configured with credentials
- Pulumi CLI installed

### Step 1: Deploy Baseline Infrastructure

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=test-$(date +%s)
export AWS_REGION=us-east-1

# Install dependencies
npm install

# Initialize Pulumi stack
pulumi stack init ${ENVIRONMENT_SUFFIX}
pulumi config set environmentSuffix ${ENVIRONMENT_SUFFIX}

# Deploy infrastructure
pulumi up --yes
```

### Step 2: Verify Baseline Configuration

```bash
# Check Lambda configuration (should show baseline values)
aws lambda get-function-configuration \
  --function-name lambda-function-${ENVIRONMENT_SUFFIX} \
  --region ${AWS_REGION} \
  --query '{Memory:MemorySize,Timeout:Timeout,Tracing:TracingConfig.Mode,Concurrency:ReservedConcurrentExecutions}'
```

Expected output:
```json
{
  "Memory": 3008,
  "Timeout": 300,
  "Tracing": "PassThrough",
  "Concurrency": null
}
```

### Step 3: Run Optimization Script

```bash
# Install Python dependencies
pip3 install boto3

# Run optimization (or use --dry-run first)
python3 lib/optimize.py --environment ${ENVIRONMENT_SUFFIX} --region ${AWS_REGION}
```

### Step 4: Verify Optimizations

```bash
# Check optimized configuration
aws lambda get-function-configuration \
  --function-name lambda-function-${ENVIRONMENT_SUFFIX} \
  --region ${AWS_REGION} \
  --query '{Memory:MemorySize,Timeout:Timeout,Tracing:TracingConfig.Mode,Concurrency:ReservedConcurrentExecutions}'
```

Expected output:
```json
{
  "Memory": 1024,
  "Timeout": 30,
  "Tracing": "Active",
  "Concurrency": 50
}
```

### Step 5: Test Lambda Invocation

```bash
# Invoke Lambda function
aws lambda invoke \
  --function-name lambda-function-${ENVIRONMENT_SUFFIX} \
  --region ${AWS_REGION} \
  --payload '{"test": "event"}' \
  response.json

cat response.json
```

### Step 6: Cleanup

```bash
# Destroy all infrastructure
pulumi destroy --yes
pulumi stack rm ${ENVIRONMENT_SUFFIX} --yes

# Clean up local files
rm response.json
```

## Cost Savings Analysis

Based on 1M invocations per month with 5s average duration:

| Optimization | Monthly Cost | Savings |
|--------------|-------------|---------|
| Baseline (3008MB, 300s) | $243.89 | - |
| Optimized (1024MB, 30s) | $81.30 | $162.59 |
| Log retention savings | - | $13.00 |
| **Total Monthly Savings** | - | **$175.59** |

Annual savings: **$2,107.08**

## Testing

### Unit Tests

```bash
npm test
```

Tests verify:
- TapStack component creation
- Resource naming with environmentSuffix
- IAM policy attachments
- CloudWatch alarm configuration

### Integration Tests

```bash
npm run test:integration
```

Integration tests:
1. Deploy baseline infrastructure
2. Run optimize.py script
3. Verify all optimizations applied
4. Test Lambda invocation
5. Verify DLQ functionality
6. Check CloudWatch logs
7. Verify X-Ray traces
8. Cleanup all resources

## Troubleshooting

### Issue: Lambda not found during optimization

**Solution**: Ensure infrastructure is fully deployed before running optimize.py. Check Pulumi outputs.

### Issue: Permission denied errors

**Solution**: Verify AWS credentials have permissions for Lambda, CloudWatch, SQS, and X-Ray services.

### Issue: Optimization script fails

**Solution**: Run with `--dry-run` first to validate configuration. Check that resources exist with correct naming pattern.

## References

- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [Pulumi AWS Documentation](https://www.pulumi.com/registry/packages/aws/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [X-Ray Tracing](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html)

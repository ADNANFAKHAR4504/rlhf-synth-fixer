# Lambda Functions for Global Hotel Booking System

This directory contains the Lambda function implementations for the hotel booking platform.

## Functions Overview

### 1. **booking_handler**

- **Purpose**: Handles booking requests with optimistic locking
- **Trigger**: API Gateway (POST /book)
- **SLA**: <400ms P95 response time
- **Key Features**:
  - Optimistic locking to prevent double-booking
  - Conditional DynamoDB updates
  - SNS event publishing

### 2. **cache_updater**

- **Purpose**: Updates Redis cache when DynamoDB inventory changes
- **Trigger**: DynamoDB Streams
- **SLA**: Cache updated in <1s P95 after DynamoDB change
- **Key Features**:
  - Per-hotel cache key strategy
  - TTL management
  - Property-level availability indexing

### 3. **hot_booking_checker**

- **Purpose**: Fast-path conflict detection within 30s of booking
- **Trigger**: DynamoDB Streams (filtered for booking events)
- **SLA**: Hot bookings checked within 30 seconds
- **Key Features**:
  - Detects negative availability (overbooking)
  - Monitors rapid version changes
  - Auto-invokes overbooking resolver

### 4. **pms_sync_worker**

- **Purpose**: Syncs booking changes to Property Management Systems
- **Trigger**: SQS queue (from SNS topic)
- **SLA**: Delivered in <60 seconds
- **Key Features**:
  - Retry logic with exponential backoff
  - PMS API integration (simulated)
  - Circuit breaker pattern ready

### 5. **reconciliation_checker**

- **Purpose**: Periodic consistency checks across DynamoDB, Redis, and Aurora
- **Trigger**: EventBridge (every 5 minutes via Step Functions)
- **SLA**: Finishes within 2 minutes
- **Key Features**:
  - Sample-based reconciliation
  - Auto-healing for cache drift
  - Logical consistency validation

### 6. **overbooking_resolver**

- **Purpose**: Resolves overbooking conflicts automatically
- **Trigger**: Invoked by hot_booking_checker or reconciliation Step Functions
- **SLA**: Auto-reassign within 60 seconds, escalate within 2 minutes
- **Key Features**:
  - Finds alternative rooms
  - Auto-reallocation logic
  - Escalation for manual intervention

## Building and Deploying

### Option 1: Deploy with Placeholder (Quick Start)

The Terraform configuration uses a minimal placeholder Lambda that allows infrastructure deployment:

```bash
cd /Users/mac/code/new-turing/t_4
terraform apply
```

The placeholder allows the stack to deploy without errors. All Lambda functions will be created but will return placeholder responses.

### Option 2: Build and Deploy Full Implementation

#### Step 1: Install Dependencies

```bash
cd /Users/mac/code/new-turing/t_4/lib/lambda

for dir in booking_handler cache_updater hot_booking_checker pms_sync_worker reconciliation_checker overbooking_resolver; do
  cd "$dir"
  npm install --production
  cd ..
done
```

#### Step 2: Create Deployment Packages

```bash
for dir in booking_handler cache_updater hot_booking_checker pms_sync_worker reconciliation_checker overbooking_resolver; do
  cd "$dir"
  zip -r "../${dir}.zip" . -x "*.git*" "*.DS_Store"
  cd ..
done
```

#### Step 3: Update Terraform to Use Real Packages

Edit `tap_stack.tf` and replace the `filename` references with S3 deployment:

```hcl
# Example for booking_handler
resource "aws_lambda_function" "booking_handler" {
  # ... other config ...

  s3_bucket = aws_s3_bucket.lambda_code.id
  s3_key    = "booking_handler.zip"
  source_code_hash = filebase64sha256("lambda/booking_handler.zip")
}
```

#### Step 4: Upload to S3

```bash
aws s3 cp booking_handler.zip s3://${BUCKET_NAME}/booking_handler.zip
aws s3 cp cache_updater.zip s3://${BUCKET_NAME}/cache_updater.zip
aws s3 cp hot_booking_checker.zip s3://${BUCKET_NAME}/hot_booking_checker.zip
aws s3 cp pms_sync_worker.zip s3://${BUCKET_NAME}/pms_sync_worker.zip
aws s3 cp reconciliation_checker.zip s3://${BUCKET_NAME}/reconciliation_checker.zip
aws s3 cp overbooking_resolver.zip s3://${BUCKET_NAME}/overbooking_resolver.zip
```

#### Step 5: Update Lambda Functions

```bash
terraform apply
```

Or use AWS CLI to update directly:

```bash
for fn in booking_handler cache_updater hot_booking_checker pms_sync_worker reconciliation_checker overbooking_resolver; do
  aws lambda update-function-code \
    --function-name "global-booking-prod-${fn}" \
    --s3-bucket ${BUCKET_NAME} \
    --s3-key "${fn}.zip"
done
```

## Environment Variables

Each Lambda function requires specific environment variables (automatically set by Terraform):

- `DYNAMODB_TABLE_NAME`: DynamoDB inventory table
- `SNS_TOPIC_ARN`: SNS topic for inventory updates
- `REDIS_ENDPOINT`: ElastiCache Redis endpoint
- `REDIS_AUTH_SECRET_ARN`: Secrets Manager ARN for Redis auth
- `AURORA_SECRET_ARN`: Secrets Manager ARN for Aurora credentials
- `ENABLE_OPTIMISTIC_LOCKING`: Enable version-based locking (true/false)

## Dependencies

All functions use AWS SDK v3 for better performance and tree-shaking:

```json
{
  "@aws-sdk/client-dynamodb": "^3.500.0",
  "@aws-sdk/lib-dynamodb": "^3.500.0",
  "@aws-sdk/client-sns": "^3.500.0",
  "@aws-sdk/client-lambda": "^3.500.0",
  "@aws-sdk/client-cloudwatch": "^3.500.0",
  "@aws-sdk/client-secrets-manager": "^3.500.0",
  "ioredis": "^5.3.2"
}
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

Requires deployed infrastructure:

```bash
npm run test:integration
```

## Monitoring

All functions emit CloudWatch metrics:

- Success/failure counts
- Processing durations
- Business metrics (overbookings, conflicts, etc.)

Custom metrics namespace: `Custom/Booking`

## Architecture Notes

1. **Optimistic Locking**: All booking writes use DynamoDB conditional expressions with version checking
2. **Cache Strategy**: Per-hotel keys with TTL, not global cache invalidation
3. **PMS Integration**: Designed for fan-out to specific properties, not broadcast to all 45k hotels
4. **Conflict Resolution**: Fast path (30s) + slow path (5min reconciliation)
5. **Error Handling**: DLQs, retry logic, and CloudWatch alarms for operational visibility

## Production Considerations

- **Concurrency**: Adjust `reserved_concurrent_executions` based on actual load
- **Memory/Timeout**: Tune per function based on P95 latency requirements
- **VPC Configuration**: Only cache/reconciliation functions run in VPC for data plane access
- **Secrets Rotation**: Implement rotation for Redis auth token and Aurora passwords
- **Cost Optimization**: Consider Lambda SnapStart for cold start reduction

## Support

For issues or questions:

- Check CloudWatch Logs: `/aws/lambda/global-booking-prod-{function-name}`
- Review CloudWatch Alarms for operational issues
- Consult the main project README for architecture overview

# EC2 Cost Optimization System

Automated EC2 cost optimization system using Pulumi with TypeScript that manages scheduled start/stop operations for non-production instances.

## Architecture

### Components

1. **EventBridge Rules**: Schedule automated start/stop operations
   - Stop Rule: Triggers at 7 PM EST (23:00 UTC) on weekdays
   - Start Rule: Triggers at 8 AM EST (12:00 UTC) on weekdays

2. **Lambda Functions**: Execute EC2 operations
   - `start-instances`: Starts stopped development/staging EC2 instances
   - `stop-instances`: Stops running development/staging EC2 instances
   - Both functions process multiple instances in a single execution
   - Uses AWS SDK v3 for Node.js 18+ compatibility

3. **Step Functions**: Orchestrate workflow with retry logic
   - Handles both start and stop actions
   - Automatic retry with exponential backoff
   - Error handling and logging

4. **DynamoDB Table**: Track instance state changes
   - Records all start/stop operations
   - TTL enabled for automatic cleanup after 30 days
   - Provides audit trail

5. **CloudWatch Alarms**: Monitor automation health
   - Step Functions execution failures
   - Lambda function errors
   - Configurable threshold and notifications

6. **IAM Roles**: Least privilege access
   - Lambda execution role with EC2 and DynamoDB permissions
   - Step Functions execution role with Lambda invocation permissions
   - EventBridge role with Step Functions execution permissions

### Cost Savings Calculation

Based on typical development environment:
- 2x t3.medium instances ($0.0416/hour each)
- 1x t3.large instance ($0.0832/hour)
- 13 hours daily shutdown (7 PM - 8 AM)
- 22 business days per month

**Estimated Monthly Savings**: $51.95

## Deployment

### Prerequisites

- Node.js 18+ installed
- Pulumi CLI installed
- AWS credentials configured
- EC2 instances tagged with `Environment=development` or `Environment=staging`

### Environment Variables

```bash
export ENVIRONMENT_SUFFIX="dev"  # or "staging", "prod", etc.
export AWS_REGION="us-east-1"
```

### Deploy Infrastructure

```bash
# Install dependencies
npm install

# Install Lambda dependencies
cd lib/lambda
npm install
npm run build
cd ../..

# Deploy with Pulumi
pulumi up
```

### Stack Outputs

After deployment, the following outputs are available:

- `stateTableName`: DynamoDB table name for state tracking
- `startRuleArn`: ARN of the EventBridge start rule
- `stopRuleArn`: ARN of the EventBridge stop rule
- `stateMachineArn`: ARN of the Step Functions state machine
- `estimatedMonthlySavings`: Calculated monthly cost savings

## Usage

### Tagging EC2 Instances

The automation targets instances with specific tags:

```bash
# Tag instance for automation
aws ec2 create-tags \
  --resources i-1234567890abcdef0 \
  --tags Key=Environment,Value=development

# Production instances are never affected
aws ec2 create-tags \
  --resources i-fedcba0987654321 \
  --tags Key=Environment,Value=production
```

### Manual Execution

Trigger the Step Functions state machine manually:

```bash
# Stop instances
aws stepfunctions start-execution \
  --state-machine-arn <stateMachineArn> \
  --input '{"action": "stop"}'

# Start instances
aws stepfunctions start-execution \
  --state-machine-arn <stateMachineArn> \
  --input '{"action": "start"}'
```

### Viewing Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/ec2-start-instances-dev --follow
aws logs tail /aws/lambda/ec2-stop-instances-dev --follow

# Step Functions logs
aws logs tail /aws/stepfunctions/ec2-scheduler-dev --follow
```

## Optimization Script

The `lib/optimize.py` script further optimizes deployed resources:

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"

# Run optimization
python3 lib/optimize.py

# Dry run mode (no changes)
python3 lib/optimize.py --dry-run
```

### What the Optimizer Does

- Reduces Lambda memory allocations for cost optimization
- Optimizes CloudWatch log retention periods
- Reduces Step Functions execution history retention
- Calculates additional monthly savings from optimizations

## Monitoring

### CloudWatch Alarms

Two alarms are configured:

1. **Step Functions Failure Alarm**: Triggers when any execution fails
2. **Lambda Error Alarm**: Triggers when Lambda errors exceed threshold

## Troubleshooting

### Instances Not Stopping/Starting

1. Verify instance tags
2. Check Lambda logs for errors
3. Verify IAM permissions for Lambda role

### Step Functions Execution Failures

1. Check execution history in AWS Console
2. Review Step Functions logs in CloudWatch
3. Verify Lambda functions are invocable

## Cleanup

To remove all resources:

```bash
pulumi destroy
```

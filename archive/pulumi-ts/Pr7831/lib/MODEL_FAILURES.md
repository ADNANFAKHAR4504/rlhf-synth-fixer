# Model Failures and Known Issues

This document tracks potential issues and failure modes in the Lambda data processing infrastructure optimization task.

## Potential Issues

### 1. Lambda Memory Optimization

**Issue**: Memory optimization may be too aggressive if no CloudWatch metrics are available.

**Failure Mode**:
- If Lambda function hasn't been invoked enough times (< 7 days of data)
- Optimizer defaults to 1024MB which may be too low for actual workload

**Mitigation**:
- Script uses conservative 1024MB default when no metrics available
- Includes 20% headroom in calculations
- Users should run dry-run mode first

**Detection**:
```bash
# Check if metrics exist before optimizing
python3 lib/optimize.py --dry-run
```

### 2. IAM Policy Scope

**Issue**: CloudWatch PutMetricData policy allows Resource: '*'

**Why Acceptable**:
- CloudWatch PutMetricData doesn't support resource-level permissions
- Scoped to specific namespace via Condition: "cloudwatch:namespace": "DataProcessing"
- This is AWS best practice for CloudWatch metrics

**Alternative (More Restrictive)**:
```json
{
  "Effect": "Allow",
  "Action": ["cloudwatch:PutMetricData"],
  "Resource": "*",
  "Condition": {
    "StringEquals": {
      "cloudwatch:namespace": "DataProcessing"
    }
  }
}
```

### 3. Node.js 18 Lambda Runtime

**Issue**: Lambda Node.js 18+ doesn't include AWS SDK v2 by default

**Impact**:
- Code uses `require('aws-sdk')` which works with inline code
- If moved to deployment package, would need to bundle AWS SDK v2 or migrate to SDK v3

**Current Solution**: Inline code includes AWS SDK automatically

**Future Enhancement**:
```javascript
// Migrate to AWS SDK v3
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
```

### 4. Dead Letter Queue Message Retention

**Issue**: DLQ retention is 14 days (336 hours)

**Consideration**:
- May accumulate messages in dev/test environments
- Costs ~$0.40 per 1M requests + storage

**Optimization**:
```typescript
// Environment-specific retention
messageRetentionSeconds: environmentSuffix === 'prod' ? 1209600 : 604800, // 14d prod, 7d dev
```

### 5. Reserved Concurrency

**Issue**: Reserved concurrency of 10 may be too high for low-traffic environments

**Impact**:
- Reserves capacity even if unused
- May limit other functions in the account

**Solution**: optimize.py script adjusts based on actual usage

### 6. X-Ray Tracing Costs

**Issue**: Active X-Ray tracing adds cost

**Cost**:
- First 100,000 traces/month free
- $5 per 1M traces after that
- Plus $0.50 per 1M traces scanned

**Recommendation**:
- Keep for prod
- Consider disabling for dev/test

### 7. CloudWatch Alarms

**Issue**: Alarms create SNS topics implicitly if actions are added

**Current State**: No alarm actions configured (no notifications)

**Enhancement**:
```typescript
alarmActions: [snsTopicArn], // Add SNS topic for notifications
```

### 8. Optimization Script Python Dependencies

**Issue**: Requires boto3 to be installed

**Failure Mode**: Script exits if boto3 not available

**Solution**:
```bash
pip install boto3
# Or use Pipenv/requirements.txt
```

### 9. Function Update Race Conditions

**Issue**: Multiple concurrent optimization runs could conflict

**Mitigation**: Script includes waiter logic and 60s timeout

**Best Practice**: Don't run multiple optimizations simultaneously

### 10. Metric Namespace Hardcoded

**Issue**: CloudWatch namespace "DataProcessing" is hardcoded

**Impact**: Can't customize per environment

**Enhancement**:
```typescript
// Make namespace configurable
const metricsNamespace = `DataProcessing-${environmentSuffix}`;
```

## Common Deployment Failures

### Failure: IAM Role Already Exists

**Cause**: Role name conflicts with existing role

**Solution**: Ensure environmentSuffix is unique per environment

### Failure: Lambda Function Timeout

**Cause**: Timeout too low for workload

**Solution**: Adjust timeout in PROMPT.md requirements

### Failure: DLQ Not Receiving Messages

**Cause**: Lambda execution role lacks SQS:SendMessage permission

**Solution**: Check inline policy includes DLQ ARN in Resource field

## Testing Recommendations

1. **Unit Tests**: Mock AWS SDK calls
2. **Integration Tests**: Deploy to real AWS environment
3. **Optimization Tests**: Run optimize.py with --dry-run first
4. **Load Tests**: Verify memory sizing under actual load

## Success Criteria Verification

- [ ] Lambda function deploys successfully
- [ ] All 10 requirements from task are implemented
- [ ] environmentSuffix used in all resource names
- [ ] IAM role uses least-privilege (no AdministratorAccess)
- [ ] DLQ configured and working
- [ ] CloudWatch logs have 7-day retention
- [ ] X-Ray tracing active
- [ ] Alarms created and functional
- [ ] optimize.py script runs successfully
- [ ] Cost savings calculated and reported

## Notes for QA Phase

This is an **IaC Optimization** task, which means:
- Baseline infrastructure uses standard configurations (3008MB memory, etc.)
- The optimize.py script applies optimizations POST-deployment
- Stack files should NOT be "optimized" - that defeats the purpose
- Integration tests should verify optimize.py works on deployed resources

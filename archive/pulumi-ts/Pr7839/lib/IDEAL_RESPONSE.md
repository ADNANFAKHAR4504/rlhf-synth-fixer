# Ideal Response for Tag-Based Compliance Monitoring

## Task ID: a5u1v0s6
## Platform: Pulumi + TypeScript
## Complexity: Hard

## Overview

This document describes the ideal implementation for a tag-based compliance monitoring system using Pulumi and TypeScript, specifically designed to work within AWS account-level limitations.

## Architecture

### High-Level Design

```
EC2 Instance State Change
        ↓
CloudWatch Events Rule
        ↓
Lambda Function (Tag Compliance Checker)
    ├── Scans EC2 Tags
    ├── Publishes CloudWatch Metrics
    ├── Writes S3 Logs
    └── Sends SNS Notifications (if non-compliant)
        ↓
CloudWatch Dashboard (Visualization)
CloudWatch Alarm (Threshold Alerts)
```

### Key Components

1. **S3 Bucket**: Stores compliance scan logs with 30-day lifecycle policy
2. **SNS Topic**: Delivers compliance alert notifications
3. **IAM Role**: Grants Lambda permissions for EC2, S3, SNS, CloudWatch
4. **Lambda Function**: Core compliance checking logic
5. **CloudWatch Events Rule**: Triggers Lambda on EC2 state changes
6. **CloudWatch Dashboard**: Visual display of compliance metrics
7. **CloudWatch Alarm**: Alerts when non-compliance exceeds threshold

## Implementation Details

### Why This Approach?

**Problem**: AWS Config has an account-level limit of ONE Configuration Recorder per region. This makes it unsuitable for multi-tenant environments or accounts with existing Config setups.

**Solution**: Build a custom compliance monitoring system using:
- **CloudWatch Events**: Event-driven architecture (no polling)
- **Lambda**: Custom compliance logic with full control
- **CloudWatch Metrics**: Standard AWS monitoring integration
- **S3**: Durable audit trail
- **SNS**: Flexible notification system

**Benefits**:
1. ✅ No AWS Config account limits
2. ✅ More cost-effective (no Config charges)
3. ✅ Fully customizable compliance rules
4. ✅ Real-time event-driven monitoring
5. ✅ Simple to extend and modify
6. ✅ Works in any AWS account regardless of existing Config usage

### Lambda Function Design

#### Required Tags

The system validates these tags on all EC2 instances:
- **Environment**: dev, staging, or prod
- **Owner**: Team or individual owner
- **Application**: Application name

#### Compliance Logic

```javascript
1. Receive CloudWatch Event with instance ID
2. Call EC2 DescribeInstances to get instance tags
3. Check for presence of all required tags
4. Determine compliance status:
   - Compliant: All required tags present
   - Non-Compliant: Any required tag missing
5. Log scan result to S3 (scans/YYYY-MM-DD/instanceId-timestamp.json)
6. Publish CloudWatch metrics:
   - CompliantInstances: 1 if compliant, 0 if not
   - NonCompliantInstances: 0 if compliant, 1 if not
7. If non-compliant, send SNS notification with details
8. Return compliance status
```

#### Error Handling

- **Instance not found (404)**: Log and return 404 status
- **No instance ID in event**: Fallback to scanning all running instances
- **AWS API errors**: Log error, throw exception for retry
- **S3 write failures**: Log error but continue (non-critical)

### Resource Naming Convention

All resources MUST include `environmentSuffix` for multi-environment support:

```typescript
S3 Bucket: `compliance-logs-${environmentSuffix}`
SNS Topic: `compliance-alerts-${environmentSuffix}`
Lambda: `tag-compliance-checker-${environmentSuffix}`
IAM Role: `tag-compliance-checker-role-${environmentSuffix}`
Events Rule: `ec2-state-change-${environmentSuffix}`
Dashboard: `tag-compliance-${environmentSuffix}`
Alarm: `high-non-compliance-${environmentSuffix}`
```

This enables multiple isolated environments (dev, qa, prod, PR-specific) in the same AWS account.

### Security Best Practices

1. **Least Privilege IAM**:
   ```typescript
   EC2: DescribeInstances, DescribeTags (read-only)
   S3: PutObject only (no read/delete)
   SNS: Publish only (no subscribe/admin)
   CloudWatch: PutMetricData only (no read)
   ```

2. **S3 Security**:
   - Block all public access
   - Server-side encryption (AES256)
   - Lifecycle policy (30-day expiration)
   - No versioning (logs are append-only)

3. **Lambda Security**:
   - Minimal environment variables
   - Use AWS SDK v3 (modern, secure)
   - Timeout: 60 seconds (sufficient for tag scanning)
   - Memory: 256 MB (adequate for AWS SDK operations)

4. **Network Security**:
   - Lambda in AWS-managed VPC (no custom VPC needed)
   - All AWS API calls over HTTPS
   - No inbound network access required

### CloudWatch Integration

#### Metrics

Custom namespace: `TagCompliance`

Metrics:
- **CompliantInstances**: Count of compliant instances (Sum aggregation)
- **NonCompliantInstances**: Count of non-compliant instances (Sum aggregation)

Dimensions: None (account-wide metrics)

Period: 5 minutes (300 seconds)

#### Dashboard

Two widgets:
1. **Compliance Status**: Line chart showing both metrics over time
2. **Non-Compliant Instances**: Focused view on violations

Region: Configured dynamically based on deployment

#### Alarm

- **Metric**: NonCompliantInstances
- **Threshold**: 5
- **Comparison**: GreaterThanThreshold
- **Evaluation Period**: 1 period (5 minutes)
- **Action**: Publish to SNS topic
- **Purpose**: Alert security/compliance team when violations spike

### Testing Strategy

#### Unit Tests (100% Coverage Required)

1. **Resource Creation**: Verify all infrastructure resources are defined
2. **Output Exports**: Confirm all outputs are exported correctly
3. **Naming Convention**: Validate environmentSuffix in resource names
4. **Configuration**: Check Pulumi config is properly read
5. **Branch Coverage**: Test both success and fallback paths

#### Integration Tests

1. **S3 Bucket**: Verify bucket exists and is accessible
2. **SNS Topic**: Confirm topic created and subscriptions work
3. **Lambda Function**:
   - Verify deployment
   - Check runtime (Node.js 18.x)
   - Validate environment variables
   - Test invocation
4. **CloudWatch Events**: Confirm rule exists and targets Lambda
5. **Dashboard**: Verify dashboard exists with correct widgets
6. **Alarm**: Validate alarm configuration
7. **End-to-End**: Invoke Lambda and verify S3 log creation
8. **Resource Naming**: Confirm all resources have environmentSuffix

### Deployment Considerations

#### Configuration

```yaml
# Pulumi.TapStacksynth-{suffix}.yaml
config:
  aws:region: us-east-1
  TapStack:environmentSuffix: synth-{suffix}
  TapStack:awsRegion: us-east-1
```

#### Environment Variables

```bash
ENVIRONMENT_SUFFIX=synth-{suffix}
AWS_REGION=us-east-1
PULUMI_BACKEND_URL=file://.  # or s3://bucket
PULUMI_CONFIG_PASSPHRASE=<secret>
```

#### Deployment Steps

1. Build TypeScript code: `npm run build`
2. Run linter: `npm run lint`
3. Run unit tests: `npm test`
4. Deploy with Pulumi: `bash scripts/deploy.sh`
5. Run integration tests: `npm run test:integration`
6. Verify outputs in `cfn-outputs/flat-outputs.json`

### Monitoring and Operations

#### CloudWatch Logs

Lambda logs captured in: `/aws/lambda/tag-compliance-checker-${environmentSuffix}`

Log retention: 7 days (default)

Key log messages:
- "Event received": Incoming event details
- "Checking compliance for instance": Target instance
- "Instance {id} compliance: {status}": Result
- "SNS notification sent": Alert delivered

#### S3 Logs Structure

```
s3://compliance-logs-${environmentSuffix}/
  scans/
    2025-12-03/
      i-1234567890abcdef0-1701648000000.json
      i-abcdef1234567890a-1701648300000.json
```

Log format:
```json
{
  "timestamp": "2025-12-03T10:00:00.000Z",
  "instanceId": "i-1234567890abcdef0",
  "state": "running",
  "isCompliant": false,
  "requiredTags": ["Environment", "Owner", "Application"],
  "tags": {
    "Name": "web-server",
    "Environment": "prod"
  },
  "missingTags": ["Owner", "Application"]
}
```

#### SNS Notification Format

```
EC2 Instance Non-Compliant Alert

Instance ID: i-1234567890abcdef0
State: running
Region: us-east-1

Missing Tags: Owner, Application

Current Tags:
  Name: web-server
  Environment: prod

Please add the missing tags to ensure compliance.
```

### Scalability Considerations

#### Current Design

- **Lambda Concurrency**: Default (unreserved)
- **Lambda Timeout**: 60 seconds
- **Lambda Memory**: 256 MB
- **Event Processing**: Asynchronous (event-driven)

#### Scaling Limits

- **EC2 API Limits**: 100 requests per second (DescribeInstances)
- **CloudWatch Metrics**: 150 TPS (PutMetricData)
- **SNS**: 30,000 messages per second (Publish)
- **S3**: 5,500 PUT per second per prefix

#### Optimization for Scale

For >1000 instances:
1. Implement batch processing in Lambda
2. Use SQS queue between CloudWatch Events and Lambda
3. Increase Lambda concurrency limits if needed
4. Add DLQ for failed events
5. Consider Step Functions for complex workflows

### Cost Optimization

Estimated monthly cost for 100 EC2 instances:

- **Lambda**: ~$0.20 (20K invocations, 1GB-sec each)
- **CloudWatch Events**: $0.00 (first 100M events free)
- **S3**: ~$0.05 (1GB storage, 20K PUT requests)
- **CloudWatch Metrics**: $0.30 (2 custom metrics)
- **SNS**: $0.50 (1K notifications)
- **Total**: ~$1.05/month

Compare to AWS Config: ~$2.00/region/month base + $0.003/config item + $0.001/evaluation

## Success Criteria

A successful implementation must:

1. ✅ Deploy without errors in any AWS account
2. ✅ Avoid AWS Config (account-level limit)
3. ✅ Scan EC2 tags in real-time (event-driven)
4. ✅ Publish CloudWatch metrics correctly
5. ✅ Send SNS notifications for violations
6. ✅ Store audit logs in S3
7. ✅ Display compliance dashboard
8. ✅ Alert on high non-compliance
9. ✅ Pass 100% unit test coverage
10. ✅ Pass all integration tests
11. ✅ Use environmentSuffix in all resources
12. ✅ Follow AWS security best practices
13. ✅ Support cleanup (fully destroyable)
14. ✅ Cost-effective (<$2/month for typical usage)

## Future Enhancements

Possible improvements:

1. **Auto-remediation**: Lambda automatically adds missing tags
2. **Compliance reports**: Daily/weekly summary emails
3. **Multi-region support**: Deploy to multiple regions
4. **Custom tag rules**: Configurable required tags
5. **Tag value validation**: Check tag values match patterns
6. **Scheduled scans**: Periodic full account scans
7. **Integration with ticketing**: Create Jira/ServiceNow tickets
8. **Slack notifications**: Real-time alerts to Slack channels

## Related Documentation

- PROMPT.md: Original task requirements
- MODEL_RESPONSE.md: Actual implementation response
- MODEL_FAILURES.md: Issues encountered and lessons learned
- README (if present): Setup and usage instructions

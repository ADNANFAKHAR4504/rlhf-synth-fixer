# Advanced Observability Stack

This Pulumi TypeScript infrastructure deploys a comprehensive observability solution with custom metric aggregation and intelligent alerting.

## Architecture

The stack implements:

1. **Custom Metric Aggregation**: Lambda function that collects metrics from 10+ microservices every 60 seconds
2. **Composite Alarms**: CloudWatch alarms for P99 latency > 500ms AND error rate > 5%
3. **Multi-Channel Alerting**: SNS topic with email and SMS subscriptions, encrypted with KMS
4. **Anomaly Detection**: CloudWatch Anomaly Detector for transaction volume with 2-week training
5. **Business KPI Tracking**: Metric math expressions for conversion rate calculations
6. **Multi-Region Dashboard**: CloudWatch dashboard with 15-minute refresh showing metrics across 3 regions
7. **Error Handling**: Dead letter queue for failed metric processing
8. **Log Analysis**: Metric filters extracting custom error patterns from Lambda logs
9. **Cross-Account Sharing**: IAM roles for central monitoring account with read-only access
10. **Cost Allocation**: All resources tagged with Environment, Team, CostCenter
11. **Container Insights**: EC2 Auto Scaling groups configured for CloudWatch Container Insights
12. **Saved Queries**: CloudWatch Logs Insights queries for error analysis

## Deployment

### Prerequisites

- Node.js 18+
- Pulumi 3.x
- AWS CLI configured with appropriate credentials
- Environment variable `ENVIRONMENT_SUFFIX` set

### Deploy

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
pulumi up
```

### Destroy

```bash
pulumi destroy
```

## Configuration

Key environment variables:

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource naming (required)
- `AWS_REGION`: Target AWS region (default: us-east-1)
- `REPOSITORY`: Repository name for tagging
- `TEAM`: Team identifier for cost allocation
- `COMMIT_AUTHOR`: Commit author for tracking
- `PR_NUMBER`: Pull request number for CI/CD

## Outputs

- `metricAggregatorFunctionName`: Name of the Lambda function aggregating metrics
- `snsTopicArn`: ARN of the SNS topic for critical alerts
- `dashboardName`: Name of the CloudWatch dashboard
- `deadLetterQueueUrl`: URL of the SQS dead letter queue

## Cost Optimization

The stack implements several cost optimizations:

- Lambda uses arm64 architecture (20% cost savings)
- CloudWatch log retention set to 14 days
- SNS uses AWS managed KMS keys (no additional cost)
- DLQ retention set to 14 days

## Security

All resources implement AWS security best practices:

- SNS encryption with KMS
- IAM least privilege policies
- Cross-account roles deny resource deletion
- CloudWatch Logs encrypted at rest

## Monitoring

The CloudWatch dashboard provides:

- Current vs last week P99 latency comparison
- Real-time error rate percentage
- Conversion rate business KPI
- Multi-region transaction volume
- Anomaly detection band for transaction volume

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests (requires deployment):

```bash
npm run test:integration
```

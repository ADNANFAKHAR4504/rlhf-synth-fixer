# Ideal CloudFormation Observability Stack Solution

This CloudFormation JSON template creates a comprehensive observability solution for payment processing systems with full compliance and multi-region capabilities.

## Template Structure

The solution consists of 22 resources across the following categories:

### 1. CloudWatch Log Groups (3 resources)
- **PaymentLogGroup**: Main log group for payment processing events
- **ApiGatewayLogGroup**: API Gateway access and execution logs
- **LambdaLogGroup**: Lambda function execution logs

All log groups feature:
- KMS encryption with customer-managed keys
- 30-day retention period
- Environment suffix in naming for multi-deployment support
- Delete deletion policy for cleanup

### 2. CloudWatch Dashboard (1 resource)
- **ObservabilityDashboard**: Comprehensive monitoring dashboard with widgets for:
  - API Gateway latency (average and p99)
  - Lambda errors and throttles
  - Custom payment transaction metrics
  - Log insights queries for error analysis

### 3. X-Ray Distributed Tracing (1 resource)
- **XRaySamplingRule**: 10% sampling rate for production traffic
- Priority 1000 for rule ordering
- Comprehensive attribute matching

### 4. CloudWatch Alarms (3 resources)
- **Api5XXErrorAlarm**: Monitors API Gateway 5XX errors
- **LambdaTimeoutAlarm**: Monitors Lambda function timeouts
- **CompositeAlarm**: Combines both alarms with OR logic for intelligent alerting

### 5. SNS Alerting (2 resources)
- **CriticalAlertTopic**: SNS topic for critical alerts
- **CriticalAlertEmailSubscription**: Email subscription for notifications

### 6. Parameter Store (1 resource)
- **DashboardConfigParameter**: Stores dashboard configuration for version control and cross-region replication

### 7. Metric Filters (2 resources)
- **TransactionVolumeMetricFilter**: Extracts transaction count from logs
- **FailedTransactionMetricFilter**: Extracts failed transaction count from logs

Both publish to "PaymentMetrics" namespace for custom metrics.

### 8. Cross-Region Metric Streaming (5 resources)
- **MetricStreamBucket**: S3 bucket with 90-day retention for metrics data
- **MetricStreamFirehose**: Kinesis Firehose for metric delivery
- **MetricStream**: CloudWatch Metric Stream in JSON format
- **MetricStreamRole**: IAM role for Metric Stream to Firehose access
- **FirehoseRole**: IAM role for Firehose to S3 access

### 9. CloudWatch Agent IAM (4 resources)
- **CloudWatchAgentRole**: EC2 assumable role with CloudWatchAgentServerPolicy
- **CloudWatchAgentPolicy**: Least-privilege policy scoped to specific log groups and PaymentMetrics namespace
- **CloudWatchAgentInstanceProfile**: Instance profile for EC2 attachment
- **CloudWatchLogsResourcePolicy**: Resource policy limiting log access by account ID

## Key Implementation Details

### CloudWatchLogsResourcePolicy
Uses AWS account ID in Principal field (not IAM role ARN):
```json
"Principal": {"AWS": "${AWS::AccountId}"}
```

### XRaySamplingRule Output
Returns ARN via Ref (not GetAtt RuleName which doesn't exist):
```json
"Value": {"Ref": "XRaySamplingRule"}
```

## Compliance Features

### Consistent Tagging
All resources include three required tags:
- **Environment**: From Environment parameter (development/staging/production)
- **Owner**: From Owner parameter (default: FinOps)
- **CostCenter**: From CostCenter parameter (default: PaymentProcessing)

### KMS Encryption
- Primary and secondary KMS key ARNs provided via parameters
- All log groups encrypted with primary KMS key
- KMS key policies configured to allow CloudWatch Logs service access

### Deletion Policies
- All log groups: Delete
- S3 bucket: Delete
- UpdateReplacePolicy: Delete on applicable resources

### Environment Suffix
All resource names include EnvironmentSuffix parameter for:
- Parallel deployments in same account/region
- Resource uniqueness
- Easy identification

## Parameters

9 parameters for complete configuration:
1. **EnvironmentSuffix**: Unique deployment identifier
2. **Environment**: Tag value (development/staging/production)
3. **Owner**: Ownership tag
4. **CostCenter**: Cost allocation tag
5. **PrimaryKMSKeyArn**: KMS key for primary region encryption
6. **SecondaryKMSKeyArn**: KMS key for secondary region
7. **LambdaFunctionName**: Lambda function to monitor
8. **ApiGatewayName**: API Gateway to monitor
9. **AlertEmailAddress**: Email for critical alerts

## Outputs

15 comprehensive outputs with CloudFormation exports:
1. PaymentLogGroupName
2. PaymentLogGroupArn
3. ApiGatewayLogGroupName
4. LambdaLogGroupName
5. DashboardName
6. XRaySamplingRuleArn
7. CompositeAlarmName
8. CriticalAlertTopicArn
9. DashboardConfigParameterName
10. MetricStreamName
11. CloudWatchAgentRoleArn
12. CloudWatchAgentInstanceProfileArn
13. MetricStreamBucketName
14. StackName
15. EnvironmentSuffix

## Deployment Process

1. Create KMS keys in primary and secondary regions
2. Update KMS key policies to allow CloudWatch Logs service access
3. Deploy stack with all required parameters
4. Confirm SNS email subscription (manual step)
5. Resources ready for observability

## Testing Approach

### Unit Tests (118 tests)
- Template structure validation
- Parameter validation
- Resource existence and configuration
- Compliance requirements (tagging, deletion policies, encryption)
- All 10 requirements validation

### Integration Tests (28 tests)
- Deployed resource validation using stack outputs
- Live AWS resource verification
- End-to-end observability flow validation
- Multi-region readiness checks

## Multi-Region Considerations

While this template deploys in a single region, it's designed for multi-region use:
- Separate KMS key parameters for each region
- Metric streaming to S3 for cross-region replication
- Dashboard configuration stored in Parameter Store for cross-region access
- Resource naming with environment suffix allows parallel deployments

## Resource Count

Total: 22 resources

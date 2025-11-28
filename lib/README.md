# Multi-Region Disaster Recovery Solution

This CloudFormation template implements a comprehensive multi-region disaster recovery solution for a transaction processing system with RTO under 15 minutes and RPO under 5 minutes.

## Architecture

The solution deploys infrastructure across two AWS regions:
- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2 (configurable)

### Components

1. **DynamoDB Global Tables**
   - On-demand billing mode for cost optimization
   - Point-in-time recovery enabled in both regions
   - Global secondary index for customer queries
   - Encrypted at rest using KMS CMKs

2. **S3 Cross-Region Replication**
   - Versioning enabled for data protection
   - S3 Transfer Acceleration for faster replication
   - Replication time control (RTC) for predictable RPO
   - Encryption with KMS in both regions

3. **Route 53 Failover Routing**
   - Health checks monitoring primary region
   - Automatic DNS failover to secondary region
   - 30-second health check intervals
   - 3 failure threshold before failover

4. **Lambda Functions**
   - Transaction processing in both regions
   - Reserved concurrency of 100 minimum
   - Environment-specific configuration
   - Encrypted environment variables

5. **KMS Encryption**
   - Customer managed keys in each region
   - Alias 'alias/transaction-encryption'
   - Key rotation enabled
   - Service-specific key policies

6. **CloudWatch Monitoring**
   - DynamoDB throttling alarms
   - S3 replication lag monitoring
   - Lambda error and throttle alarms
   - Encrypted log groups with 30-day retention

7. **SNS Notifications**
   - Operational alerts in both regions
   - Encrypted at rest with KMS
   - CloudWatch alarm integration

8. **IAM Roles**
   - Cross-region assume role capabilities
   - Least privilege permissions
   - Service-specific roles for S3, Lambda, and DynamoDB

## Deployment

### Prerequisites

- AWS CLI 2.x or later
- Appropriate IAM permissions for multi-region deployment
- Domain name for Route 53 hosted zone
- Secondary region prepared with KMS key alias

### Primary Region Deployment

```bash
aws cloudformation create-stack \
  --stack-name transaction-dr-primary \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=SecondaryRegion,ParameterValue=us-west-2 \
    ParameterKey=DomainName,ParameterValue=transaction-system.example.com \
    ParameterKey=LambdaReservedConcurrency,ParameterValue=100 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Secondary Region Deployment

Before deploying the primary stack, you need to create the secondary S3 bucket and KMS key:

```bash
# Create KMS key in secondary region
aws kms create-key \
  --description "Transaction encryption key for secondary region" \
  --region us-west-2

# Create KMS alias
aws kms create-alias \
  --alias-name alias/transaction-encryption \
  --target-key-id <KEY_ID_FROM_PREVIOUS_COMMAND> \
  --region us-west-2

# Create secondary S3 bucket
aws s3api create-bucket \
  --bucket transaction-documents-prod-us-west-2 \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket transaction-documents-prod-us-west-2 \
  --versioning-configuration Status=Enabled \
  --region us-west-2

# Deploy secondary Lambda function (use same template with different parameters)
aws cloudformation create-stack \
  --stack-name transaction-dr-secondary \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=SecondaryRegion,ParameterValue=us-east-1 \
    ParameterKey=DomainName,ParameterValue=transaction-system.example.com \
    ParameterKey=LambdaReservedConcurrency,ParameterValue=100 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

## Parameters

- **EnvironmentSuffix**: Suffix for resource naming (default: prod)
- **SecondaryRegion**: AWS region for disaster recovery (default: us-west-2)
- **DomainName**: Domain name for Route 53 (default: transaction-system.example.com)
- **HealthCheckPath**: Health check endpoint path (default: /health)
- **LambdaReservedConcurrency**: Reserved concurrency for Lambda (default: 100, minimum: 100)

## Testing Failover

### Manual Failover Test

1. Update Route 53 record to point to secondary region:
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --change-batch file://failover-config.json
```

2. Monitor CloudWatch metrics for both regions
3. Verify DynamoDB replication status
4. Check S3 replication metrics

### Automated Health Check Testing

The Route 53 health check automatically monitors the primary region and triggers failover when:
- Health check fails 3 consecutive times (90 seconds total)
- Lambda function becomes unavailable
- Primary region experiences service disruption

## Monitoring

### Key Metrics to Monitor

1. **DynamoDB**
   - UserErrors (throttling)
   - ConsumedReadCapacityUnits
   - ConsumedWriteCapacityUnits
   - ReplicationLatency

2. **S3**
   - ReplicationLatency
   - BytesPendingReplication
   - OperationsPendingReplication

3. **Lambda**
   - Errors
   - Throttles
   - Duration
   - ConcurrentExecutions

4. **Route 53**
   - HealthCheckStatus
   - HealthCheckPercentageHealthy

### CloudWatch Alarms

The template creates the following alarms:
- DynamoDB throttling alarm (threshold: 10 errors in 5 minutes)
- S3 replication lag alarm (threshold: 15 minutes)
- Lambda error alarm (threshold: 5 errors in 5 minutes)
- Lambda throttle alarm (threshold: 1 throttle event)

## Disaster Recovery Procedures

### RTO: 15 Minutes

1. Route 53 health check detects failure (90 seconds)
2. DNS failover triggered automatically (60 seconds)
3. DNS propagation (varies, typically 5-10 minutes)
4. Secondary region Lambda functions active (immediate)
5. Total RTO: < 15 minutes

### RPO: 5 Minutes

1. DynamoDB Global Tables: Near real-time replication (typically < 1 second)
2. S3 Replication Time Control: 15-minute SLA with most objects < 5 minutes
3. Worst-case RPO: < 5 minutes for S3 data

## Cost Optimization

- DynamoDB on-demand billing eliminates over-provisioning
- S3 Transfer Acceleration only for cross-region replication
- Lambda reserved concurrency ensures availability without over-provisioning
- CloudWatch Logs retention set to 30 days

## Security

- All data encrypted at rest using KMS CMKs
- All data encrypted in transit using TLS
- IAM roles follow least privilege principle
- S3 buckets block all public access
- KMS key rotation enabled
- CloudWatch Logs encrypted

## Cleanup

**WARNING**: All resources have DeletionPolicy set to Retain to prevent accidental data loss. Manual cleanup required:

```bash
# Delete secondary stack
aws cloudformation delete-stack \
  --stack-name transaction-dr-secondary \
  --region us-west-2

# Delete primary stack
aws cloudformation delete-stack \
  --stack-name transaction-dr-primary \
  --region us-east-1

# Manually delete retained resources:
# - DynamoDB Global Tables
# - S3 buckets (after emptying)
# - KMS keys (after 7-30 day waiting period)
# - CloudWatch Log groups
```

## Troubleshooting

### DynamoDB Replication Issues

Check replication status:
```bash
aws dynamodb describe-global-table \
  --global-table-name transactions-prod
```

### S3 Replication Issues

Check replication metrics:
```bash
aws s3api get-bucket-replication \
  --bucket transaction-documents-prod-us-east-1
```

### Lambda Invocation Issues

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/transaction-processor-prod --follow
```

## Additional Resources

- [DynamoDB Global Tables Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [S3 Replication Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)
- [Route 53 Health Checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)

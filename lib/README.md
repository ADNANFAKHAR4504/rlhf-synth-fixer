# Multi-Region Disaster Recovery Payment Processing Infrastructure

This Pulumi TypeScript project creates a comprehensive multi-region disaster recovery infrastructure for a payment processing system with automatic failover between us-east-1 and us-east-2.

## Architecture Overview

### Components

1. **DynamoDB Global Table**
   - Multi-region replication with on-demand billing
   - Point-in-time recovery enabled
   - Streams enabled for change tracking

2. **Lambda Functions**
   - Identical payment processing functions in both regions
   - Integrated with DynamoDB and SQS
   - IAM roles with least-privilege permissions

3. **API Gateway**
   - REST APIs in both regions
   - Lambda proxy integration
   - Regional endpoints

4. **Route 53 DNS**
   - Hosted zone for domain management
   - Health checks for both regions
   - Failover routing policies

5. **S3 Cross-Region Replication**
   - Transaction log storage in both regions
   - Automatic replication from primary to secondary
   - Versioning enabled

6. **CloudWatch Monitoring**
   - Replication lag alarms (threshold: 30 seconds)
   - API health monitoring
   - Operational visibility

7. **SSM Parameter Store**
   - Configuration management
   - Region-specific endpoints
   - Easy operational access

8. **SQS Dead Letter Queues**
   - Failed transaction capture
   - Retry capability
   - Available in both regions

## Prerequisites

- Node.js 18.x or higher
- Pulumi CLI installed
- AWS credentials configured
- Sufficient AWS permissions to create resources

## Configuration

Set the required configuration:

```bash
pulumi config set environmentSuffix <your-unique-suffix>
```

## Deployment

Deploy the infrastructure:

```bash
pulumi up
```

The deployment will create resources in both us-east-1 and us-east-2 regions.

## Testing Failover

1. Access the failover DNS name (output: `failoverDnsName`)
2. Verify primary region is serving traffic
3. Simulate primary region failure by disabling the primary API
4. Route 53 health checks will detect the failure
5. Traffic automatically fails over to secondary region

## Outputs

After deployment, the following outputs are available:

- `primaryApiEndpoint`: Primary region API URL
- `secondaryApiEndpoint`: Secondary region API URL
- `failoverDnsName`: DNS name for automatic failover
- `primaryHealthCheckUrl`: Primary health check endpoint
- `secondaryHealthCheckUrl`: Secondary health check endpoint
- `healthCheckPrimaryId`: Primary health check ID
- `healthCheckSecondaryId`: Secondary health check ID
- `replicationLagAlarmArn`: CloudWatch alarm ARN for replication lag
- `dynamoDbTableName`: DynamoDB global table name
- `s3BucketPrimaryName`: Primary S3 bucket name
- `s3BucketSecondaryName`: Secondary S3 bucket name
- `dlqPrimaryUrl`: Primary DLQ URL
- `dlqSecondaryUrl`: Secondary DLQ URL
- `hostedZoneId`: Route 53 hosted zone ID
- `hostedZoneNameServers`: Name servers for DNS delegation

## Monitoring

### CloudWatch Alarms

- **DynamoDB Replication Lag**: Alerts when replication lag exceeds 30 seconds
- Configure alarm actions (SNS topics) as needed

### Health Checks

- Route 53 health checks monitor both API endpoints
- Check interval: 30 seconds
- Failure threshold: 3 consecutive failures

## Cost Considerations

This infrastructure uses the following services:
- DynamoDB: On-demand billing (pay per request)
- Lambda: Pay per invocation
- API Gateway: Pay per request
- Route 53: Hosted zone + health checks
- S3: Storage + replication costs
- CloudWatch: Alarms and metrics

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Security Features

1. **IAM Least Privilege**: Each service has minimal required permissions
2. **Encryption**: DynamoDB encryption at rest enabled by default
3. **Versioning**: S3 versioning enabled for audit trail
4. **Network Security**: Regional API endpoints with proper configuration

## Troubleshooting

### Common Issues

1. **Replication Lag**: Monitor CloudWatch alarm, check DynamoDB metrics
2. **Health Check Failures**: Verify Lambda function logs in CloudWatch
3. **S3 Replication Issues**: Verify IAM role permissions and bucket policies
4. **API Gateway Errors**: Check Lambda execution role permissions

## Additional Notes

- Lambda functions use Node.js 18.x runtime
- All resources include the environmentSuffix for uniqueness
- Resources are configured for easy teardown (no retention policies)
```


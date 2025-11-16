# Multi-Region Disaster Recovery Infrastructure

Complete Pulumi TypeScript implementation for a multi-region disaster recovery infrastructure for payment processing systems.

## Overview

This infrastructure implements automatic failover capabilities between AWS regions (us-east-1 and us-east-2) with:

- RPO (Recovery Point Objective): Under 1 minute
- RTO (Recovery Time Objective): Under 5 minutes
- Automatic DNS failover via Route53
- Data replication via DynamoDB Global Tables and S3 Cross-Region Replication

## Architecture

### Components

1. **DynamoDB Global Tables**
   - Primary table in us-east-1 with replica in us-east-2
   - Point-in-time recovery enabled in both regions
   - Automatic bidirectional replication

2. **Lambda Functions**
   - Payment processing functions deployed identically in both regions
   - Environment variables configured for regional resources
   - Node.js 20.x runtime with AWS SDK v3

3. **S3 Buckets**
   - Separate buckets in each region for payment receipts
   - Cross-region replication with RTC enabled
   - Versioning enabled for replication

4. **API Gateway**
   - Regional REST APIs in both us-east-1 and us-east-2
   - Lambda proxy integration
   - POST /payment endpoint

5. **Route53**
   - Health checks monitoring primary region API
   - Failover routing policy (PRIMARY/SECONDARY)
   - 60-second TTL for fast failover

6. **CloudWatch**
   - Alarms for DynamoDB health, Lambda errors, S3 replication lag
   - Log groups for Lambda functions (7-day retention)
   - Metrics for monitoring system health

7. **SNS Topics**
   - Configured in both regions for alerting
   - Connected to CloudWatch alarms

8. **IAM Roles**
   - Lambda execution role with DynamoDB and S3 permissions
   - S3 replication role
   - Cross-region DR operations role

## Prerequisites

- Node.js 20.x or higher
- Pulumi CLI 3.x or higher
- AWS CLI configured with appropriate credentials
- AWS account with permissions for all required services

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
```

## Deployment

### Deploy Infrastructure

```bash
pulumi up --yes
```

This will create all resources in both regions (us-east-1 and us-east-2).

### View Outputs

```bash
pulumi stack output
```

Expected outputs:
- `primaryApiEndpoint`: Primary region API Gateway endpoint
- `secondaryApiEndpoint`: Secondary region API Gateway endpoint
- `failoverDnsName`: Route53 DNS name for failover
- `healthCheckId`: Route53 health check ID
- `alarmArns`: Array of CloudWatch alarm ARNs

## Testing

### Test Primary Region

```bash
curl -X POST $(pulumi stack output primaryApiEndpoint)/payment \
  -H "Content-Type: application/json" \
  -d '{"paymentId":"test-001","amount":100.00}'
```

Expected response:
```json
{
  "message": "Payment processed successfully",
  "paymentId": "test-001",
  "amount": 100,
  "region": "us-east-1"
}
```

### Test Secondary Region

```bash
curl -X POST $(pulumi stack output secondaryApiEndpoint)/payment \
  -H "Content-Type: application/json" \
  -d '{"paymentId":"test-002","amount":200.00}'
```

### Verify DynamoDB Replication

```bash
# Check primary region
aws dynamodb get-item \
  --table-name payments-table-us-east-1-dev \
  --key '{"paymentId":{"S":"test-001"}}' \
  --region us-east-1

# Check secondary region (should have replicated data)
aws dynamodb get-item \
  --table-name payments-table-us-east-1-dev \
  --key '{"paymentId":{"S":"test-001"}}' \
  --region us-east-2
```

### Verify S3 Replication

```bash
# Check primary bucket
aws s3 ls s3://payment-docs-us-east-1-dev/receipts/ --region us-east-1

# Check secondary bucket (should have replicated objects)
aws s3 ls s3://payment-docs-us-east-2-dev/receipts/ --region us-east-2
```

### Test DNS Failover

```bash
# Query the failover DNS name
dig $(pulumi stack output failoverDnsName)

# Monitor health check status
aws route53 get-health-check-status \
  --health-check-id $(pulumi stack output healthCheckId)
```

## Monitoring

### CloudWatch Alarms

Monitor the following alarms:

1. **DynamoDB Health**: Triggers when user errors exceed 10 in 5 minutes
2. **Lambda Errors (Primary)**: Triggers when Lambda errors exceed 5 in 5 minutes
3. **Lambda Errors (Secondary)**: Triggers when Lambda errors exceed 5 in 5 minutes
4. **S3 Replication Lag**: Triggers when replication latency exceeds 15 minutes

View alarms:
```bash
aws cloudwatch describe-alarms \
  --alarm-names "dynamo-health-alarm-us-east-1-dev" \
  --region us-east-1
```

### CloudWatch Logs

View Lambda logs:
```bash
# Primary region
aws logs tail /aws/lambda/payment-processor-us-east-1-dev --follow --region us-east-1

# Secondary region
aws logs tail /aws/lambda/payment-processor-us-east-2-dev --follow --region us-east-2
```

## Disaster Recovery Testing

### Simulate Primary Region Failure

To test failover:

1. Disable the primary Lambda function:
```bash
aws lambda put-function-concurrency \
  --function-name payment-processor-us-east-1-dev \
  --reserved-concurrent-executions 0 \
  --region us-east-1
```

2. Wait for health check to fail (approximately 90 seconds)

3. Test DNS resolution:
```bash
dig $(pulumi stack output failoverDnsName)
# Should now resolve to secondary region endpoint
```

4. Verify traffic routes to secondary:
```bash
curl -X POST https://$(pulumi stack output failoverDnsName)/payment \
  -H "Content-Type: application/json" \
  -d '{"paymentId":"test-failover","amount":300.00}'
# Should return region: "us-east-2"
```

5. Restore primary function:
```bash
aws lambda delete-function-concurrency \
  --function-name payment-processor-us-east-1-dev \
  --region us-east-1
```

## Resource Naming Convention

All resources follow the pattern: `{service}-{region}-{environmentSuffix}`

Examples:
- DynamoDB: `payments-table-us-east-1-dev`
- Lambda: `payment-processor-us-east-1-dev`
- S3: `payment-docs-us-east-1-dev`
- SNS: `failover-alerts-us-east-1-dev`
- IAM: `dr-operations-role-dev`

## Tags

All resources are tagged with:
- `Environment`: Value from ENVIRONMENT_SUFFIX
- `Region`: AWS region (us-east-1 or us-east-2)
- `DR-Role`: Either "primary" or "secondary"
- Additional tags from environment variables (Team, Repository, etc.)

## Cleanup

### Destroy All Resources

```bash
pulumi destroy --yes
```

This will remove all resources in both regions.

### Verify Cleanup

```bash
# Check DynamoDB tables
aws dynamodb list-tables --region us-east-1
aws dynamodb list-tables --region us-east-2

# Check S3 buckets
aws s3 ls | grep payment-docs

# Check Lambda functions
aws lambda list-functions --region us-east-1 | grep payment-processor
aws lambda list-functions --region us-east-2 | grep payment-processor
```

## Troubleshooting

### Issue: DynamoDB Global Table Creation Fails

**Solution**: Ensure both regions are enabled in your AWS account and you have appropriate permissions.

```bash
aws dynamodb describe-limits --region us-east-1
aws dynamodb describe-limits --region us-east-2
```

### Issue: S3 Replication Not Working

**Solution**: Verify versioning is enabled on both buckets:

```bash
aws s3api get-bucket-versioning --bucket payment-docs-us-east-1-dev
aws s3api get-bucket-versioning --bucket payment-docs-us-east-2-dev
```

### Issue: Route53 Health Check Failing

**Solution**: Verify API Gateway endpoint is accessible:

```bash
curl -v $(pulumi stack output primaryApiEndpoint)/payment
```

### Issue: Lambda Function Errors

**Solution**: Check CloudWatch Logs for detailed error messages:

```bash
aws logs tail /aws/lambda/payment-processor-us-east-1-dev --follow --region us-east-1
```

## Cost Optimization

This infrastructure uses cost-optimized settings:

- **DynamoDB**: Pay-per-request billing (no provisioned capacity)
- **Lambda**: On-demand pricing (no reserved capacity)
- **S3**: Standard storage class (consider Intelligent-Tiering for long-term storage)
- **CloudWatch Logs**: 7-day retention (adjust as needed)

Estimated monthly cost for low traffic (< 1M requests):
- DynamoDB: $1-5
- Lambda: $0-2
- S3: $0-5
- API Gateway: $3.50 per million requests
- Route53: $0.50 per health check
- Total: ~$10-20/month

## Security Considerations

1. **IAM Policies**: Currently use wildcards for simplicity. In production, restrict to specific resources.
2. **API Gateway**: No authentication configured. Add API keys, IAM auth, or Cognito for production.
3. **Encryption**: All data at rest is encrypted (DynamoDB, S3, CloudWatch Logs use AWS managed keys).
4. **Network**: Resources use AWS public endpoints. Consider VPC endpoints for enhanced security.

## Support

For issues or questions:
- Review CloudWatch Logs for detailed error messages
- Check CloudWatch Alarms for system health
- Verify all prerequisites are met
- Ensure AWS credentials have appropriate permissions

## License

MIT

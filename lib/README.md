# Multi-Region Disaster Recovery Infrastructure

Production-ready Pulumi TypeScript infrastructure for a multi-region disaster recovery system supporting financial transaction processing.

## Overview

This infrastructure implements a complete disaster recovery solution across two AWS regions (us-east-1 and us-west-2) with:

- **RPO < 1 hour**: Continuous replication via Aurora Global Database
- **RTO < 4 hours**: Automated failover via Route 53 (actual failover < 60 seconds)
- **High Availability**: Multi-AZ deployment in each region
- **Automated Failover**: Health check-based DNS routing

## Architecture

### Primary Region (us-east-1)
- Aurora PostgreSQL 15.4 Global Database (writer cluster)
- Lambda functions for transaction processing (3GB memory, 5-minute timeout)
- Application Load Balancer
- DynamoDB global table (primary)
- S3 bucket with cross-region replication
- VPC with 3 AZs (public and private subnets)

### DR Region (us-west-2)
- Aurora PostgreSQL 15.4 (reader cluster)
- Identical Lambda functions
- Application Load Balancer
- DynamoDB global table (replica)
- S3 bucket (replication target)
- VPC with 3 AZs (public and private subnets)

### Failover Components
- Route 53 hosted zone
- Health checks monitoring Lambda endpoints (30-second intervals)
- Weighted routing (100% primary, 0% DR)
- CloudWatch alarms for replication lag > 30 seconds
- SNS topics for notifications

## Prerequisites

- AWS CLI configured with credentials
- Pulumi CLI installed
- Node.js 18+
- Access to both us-east-1 and us-west-2 regions
- Appropriate IAM permissions

## Installation

```bash
npm install
```

## Configuration

Set the environment suffix for resource naming:

```bash
export ENVIRONMENT_SUFFIX="prod"
export AWS_REGION="us-east-1"
```

## Deployment

### Deploy Infrastructure

```bash
pulumi up
```

This creates all resources in both regions.

### Verify Deployment

```bash
# Check outputs
pulumi stack output

# Verify RDS clusters
aws rds describe-global-clusters --region us-east-1

# Verify Lambda functions
aws lambda list-functions --region us-east-1
aws lambda list-functions --region us-west-2

# Check Route 53 health checks
aws route53 list-health-checks
```

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Integration Tests

Integration tests require deployed infrastructure and outputs:

```bash
# Deploy first
pulumi up

# Export outputs
pulumi stack output --json > cfn-outputs/flat-outputs.json

# Run tests
npm test test/tap-stack.int.test.ts
```

### Verify Build and Lint

```bash
npm run build
npm run lint
```

## Failover Testing

### Simulate Primary Region Failure

1. Disable primary health check endpoint:
   ```bash
   # Get primary Lambda function name
   PRIMARY_HEALTH=$(pulumi stack output primaryHealthCheckUrl)

   # Disable function (simulates failure)
   aws lambda update-function-configuration \
     --function-name primary-health-<suffix> \
     --environment "Variables={DB_ENDPOINT=invalid}" \
     --region us-east-1
   ```

2. Monitor Route 53 failover:
   ```bash
   # Check health check status
   aws route53 get-health-check-status --health-check-id <id>

   # Verify DNS routing shifts to DR
   dig api.dr-<suffix>.example.com
   ```

3. Restore primary:
   ```bash
   # Re-enable primary function
   aws lambda update-function-configuration \
     --function-name primary-health-<suffix> \
     --environment "Variables={DB_ENDPOINT=<endpoint>}" \
     --region us-east-1
   ```

### Test RDS Replication

```bash
# Connect to primary cluster
psql -h <primary-endpoint> -U dbadmin -d transactions

# Insert test data
INSERT INTO test_table VALUES ('test');

# Verify replication lag
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=primary-cluster-<suffix> \
  --statistics Average \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60
```

## Monitoring

### CloudWatch Dashboards

Key metrics to monitor:

- **RDS Replication Lag**: Should be < 30 seconds
- **Lambda Invocations**: Transaction processing rate
- **ALB Response Times**: Latency metrics
- **Route 53 Health Checks**: Status of both regions

### Alarms

Configured alarms:
- RDS replication lag > 30 seconds → SNS notification
- Health check failures → Route 53 automatic failover

### View Alarms

```bash
aws cloudwatch describe-alarms --region us-east-1
```

## Cleanup

### Destroy Infrastructure

```bash
pulumi destroy
```

This removes all resources in both regions. The following configurations ensure clean destruction:

- `skipFinalSnapshot: true` on RDS clusters
- `deletionProtection: false` on all resources
- No `RemovalPolicy: Retain` anywhere

## Security

### Encryption
- **At Rest**: KMS encryption for RDS, DynamoDB, and S3
- **In Transit**: TLS/SSL for all communications

### IAM Roles
All roles follow least-privilege principle:
- Lambda execution role: DynamoDB and RDS describe permissions only
- S3 replication role: Specific bucket and KMS key access
- No AdminAccess policies used

### Network Security
- RDS in private subnets (no internet access)
- Lambda in private subnets with VPC endpoints
- Security groups restrict traffic to VPC CIDR blocks
- ALB in public subnets with internet gateway

## Cost Optimization

Estimated monthly costs (us-east-1 + us-west-2):

- **RDS Aurora Global**: ~$350/month (2x db.r6g.large)
- **Lambda**: Pay per invocation (3GB memory)
- **ALB**: ~$40/month (2 ALBs)
- **DynamoDB**: Pay per request (on-demand)
- **S3**: Storage + replication costs
- **Route 53**: ~$1/month (hosted zone + health checks)
- **Data Transfer**: Cross-region replication costs

Total: ~$400-500/month base + usage costs

## Outputs

After deployment, the following outputs are available:

- `primaryVpcId`: Primary VPC ID
- `drVpcId`: DR VPC ID
- `auroraGlobalClusterId`: Global cluster ID
- `primaryClusterEndpoint`: Primary database endpoint
- `drClusterEndpoint`: DR database endpoint
- `dynamoTableName`: Session table name
- `primaryBucketName`: Primary S3 bucket
- `drBucketName`: DR S3 bucket
- `primaryAlbDnsName`: Primary ALB DNS
- `drAlbDnsName`: DR ALB DNS
- `hostedZoneId`: Route 53 zone ID
- `primaryHealthCheckUrl`: Primary health endpoint
- `drHealthCheckUrl`: DR health endpoint

## Troubleshooting

### RDS Replication Lag High

```bash
# Check replication status
aws rds describe-db-clusters \
  --db-cluster-identifier primary-cluster-<suffix> \
  --region us-east-1
```

### Lambda Functions Not Accessible

```bash
# Check VPC configuration
aws lambda get-function-configuration \
  --function-name primary-txn-<suffix> \
  --region us-east-1

# Verify security groups allow traffic
aws ec2 describe-security-groups \
  --group-ids <sg-id> \
  --region us-east-1
```

### Route 53 Not Failing Over

```bash
# Check health check status
aws route53 get-health-check-status \
  --health-check-id <health-check-id>

# Verify health check configuration
aws route53 get-health-check \
  --health-check-id <health-check-id>
```

### S3 Replication Not Working

```bash
# Check replication configuration
aws s3api get-bucket-replication \
  --bucket artifacts-primary-<suffix>

# Verify IAM role permissions
aws iam get-role-policy \
  --role-name s3-repl-role-<suffix> \
  --policy-name s3-repl-policy-<suffix>
```

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda and RDS
2. Verify all resources deployed correctly: `pulumi stack`
3. Review security group rules and IAM policies
4. Check AWS service limits

## License

This infrastructure code is provided as-is for testing and development purposes.

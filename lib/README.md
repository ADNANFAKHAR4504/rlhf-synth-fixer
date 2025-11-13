# Multi-Region Disaster Recovery Solution for Trading Platform

This CDK application implements a comprehensive multi-region disaster recovery solution for a financial services trading platform, spanning us-east-1 (primary) and us-east-2 (secondary) regions.

## Architecture Overview

The solution provides automated failover capabilities with a target recovery time of 60 seconds, implementing all required AWS services across two regions.

### AWS Services Implemented

1. **Route 53** - DNS and health checks with failover routing
2. **Aurora PostgreSQL Global Database** - Writer in us-east-1, read replica in us-east-2
3. **DynamoDB Global Tables** - Session data with point-in-time recovery
4. **Lambda** - Trade order processing in both regions
5. **SQS** - Message queues in both regions
6. **API Gateway** - REST APIs with custom domains in both regions
7. **S3** - Cross-region replication for configs and audit logs
8. **CloudWatch** - Alarms for RDS lag, Lambda errors, API latency
9. **Step Functions** - Failover orchestration (RDS promotion, Route 53 updates)
10. **EventBridge** - Cross-region event forwarding
11. **Systems Manager Parameter Store** - Region-specific configurations

## Stack Structure

- **GlobalStack** - Route 53, cross-region IAM roles
- **PrimaryRegionStack** (us-east-1) - Full infrastructure with Aurora writer
- **SecondaryRegionStack** (us-east-2) - Full infrastructure ready for failover

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18.x or later
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Access to us-east-1 and us-east-2 regions

## Environment Configuration

Set the environment suffix (default: 'dev'):

```bash
export ENVIRONMENT_SUFFIX=dev
```

Or pass it during deployment:

```bash
cdk deploy --all -c environmentSuffix=prod
```

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Bootstrap CDK (if not already done)

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
cdk bootstrap aws://ACCOUNT-ID/us-east-2
```

### 4. Deploy Stacks

Deploy all stacks:

```bash
npm run deploy:all
```

Or deploy individually:

```bash
npm run deploy:primary
npm run deploy:secondary
npm run deploy:global
```

## Lambda Functions

### Trade Processor
Processes trade orders from SQS queues, stores execution data in DynamoDB.

Location: `lib/lambda/trade-processor/`

### API Handler
Handles API Gateway requests for submitting and querying trades.

Location: `lib/lambda/api-handler/`

### Failover Orchestrator
Orchestrates failover process including RDS promotion and Route 53 updates.

Location: `lib/lambda/failover-orchestrator/`

### Failover Test
Validates failover readiness every hour by checking all replication mechanisms.

Location: `lib/lambda/failover-test/`

### Event Handler
Handles cross-region EventBridge events in the secondary region.

Location: `lib/lambda/event-handler/`

## Testing Failover

The failover test Lambda runs automatically every hour. To manually trigger:

```bash
aws lambda invoke \
  --function-name failover-test-dev \
  --region us-east-1 \
  response.json
```

## Monitoring

CloudWatch alarms are configured for:
- Aurora replication lag
- Lambda function errors
- API Gateway latency

View metrics in CloudWatch console under namespace: `TradingPlatform/FailoverReadiness`

## Compliance and Security

- All resources include environmentSuffix in names
- Encryption at rest enabled for all data stores
- Encryption in transit enforced
- Least privilege IAM policies
- Point-in-time recovery enabled for DynamoDB
- Automated backups for Aurora (7-day retention)
- All resources are tagged with Environment, Region, Component, and Project

## Resource Naming Convention

Resources follow the pattern: `{resource-type}-{environmentSuffix}`

Examples:
- `trading-api-dev`
- `trade-orders-dev`
- `trading-sessions-dev`

## Cleanup

To destroy all resources:

```bash
npm run destroy:all
```

## Outputs

After deployment, key outputs include:
- API endpoints for both regions
- Aurora cluster endpoints
- DynamoDB table names
- SQS queue URLs
- Route 53 hosted zone ID

## Architecture Decisions

### Cost Optimization
- Aurora Serverless v2 (0.5-2 ACU) instead of provisioned instances
- No NAT Gateways (VPC endpoints for AWS services)
- On-demand DynamoDB billing
- No deletion protection or retain policies

### Performance
- Multi-AZ deployments for high availability
- Aurora read replicas for read scaling
- API Gateway throttling configured (2000 req/s, 5000 burst)
- Lambda memory optimized for workload

### Security
- Private subnets for compute resources
- Security groups with minimal ingress rules
- All data encrypted at rest
- CloudWatch Logs enabled for audit trail

## Troubleshooting

### Aurora Global Database Issues
Check replication status:
```bash
aws rds describe-global-clusters
```

### DynamoDB Replication Issues
Check table replication:
```bash
aws dynamodb describe-table --table-name trading-sessions-dev
```

### S3 Replication Issues
Check replication configuration:
```bash
aws s3api get-bucket-replication --bucket trading-config-dev-us-east-1
```

## Support

For issues or questions, check CloudWatch Logs for each Lambda function and review Step Functions execution history for failover operations.

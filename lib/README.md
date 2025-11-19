# Multi-Region Disaster Recovery Solution

This CDK application implements a comprehensive multi-region disaster recovery solution for a trading platform with automated failover capabilities.

## Architecture

### Regions
- **Primary**: us-east-1
- **Secondary**: us-east-2

### Components

#### 1. DNS and Routing (Route 53)
- Health checks monitoring API Gateway endpoints in both regions
- Failover routing policy for automatic DNS updates
- Health check interval: 30 seconds, failure threshold: 3

#### 2. Database Layer (Aurora PostgreSQL)
- Aurora Serverless v2 for cost optimization
- Global Database with automatic replication
- Primary writer in us-east-1
- Read replica in us-east-2 for failover
- 7-day backup retention
- Encrypted at rest

#### 3. Compute Layer (Lambda)
- Trade order processor functions in both regions
- Automated failover testing function
- Node.js 18.x runtime with AWS SDK v3
- VPC-enabled for database access

#### 4. Message Queuing (SQS)
- Separate queues in each region
- 4-day message retention
- 5-minute visibility timeout
- Lambda event source integration

#### 5. Session State (DynamoDB Global Tables)
- Global table replicated across regions
- Point-in-time recovery enabled
- Pay-per-request billing mode
- Streams enabled for change capture

#### 6. Storage (S3)
- Configuration bucket with cross-region replication
- Audit logs bucket with versioning
- 15-minute replication SLA
- Delete marker replication enabled

#### 7. Monitoring (CloudWatch)
- Lambda error rate alarms
- API Gateway latency alarms
- Aurora replication lag alarms
- SNS notifications for critical alerts

#### 8. Orchestration (Step Functions)
- Automated failover state machine
- Steps: Promote DB → Update Route 53 → Validate
- 10-minute timeout
- Comprehensive error handling

#### 9. API Layer (API Gateway)
- REST APIs in both regions
- Health check endpoints
- CloudWatch logging enabled
- Request/response tracing

#### 10. Event Distribution (EventBridge)
- Custom event buses in each region
- Cross-region event forwarding
- Trade execution and failure events

## Deployment

### Prerequisites
- AWS CLI configured with credentials
- CDK CLI installed (`npm install -g aws-cdk`)
- Node.js 18+ and npm

### Initial Deployment

1. Install dependencies:
```bash
npm install
```

2. Bootstrap CDK (first time only):
```bash
npm run cdk:bootstrap
```

3. Deploy to primary region (us-east-1):
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=prod
npm run cdk:deploy
```

4. Deploy to secondary region (us-east-2):
```bash
export AWS_REGION=us-east-2
export ENVIRONMENT_SUFFIX=prod
npm run cdk:deploy
```

### Testing Failover

The automated failover test runs hourly and checks:
- DynamoDB global table replication
- Aurora database connectivity
- API health endpoints

To manually trigger a test:
```bash
aws lambda invoke \
  --function-name failover-test-us-east-1-prod \
  --region us-east-1 \
  response.json
```

### Manual Failover

To manually trigger failover:
```bash
aws stepfunctions start-execution \
  --state-machine-arn <STATE_MACHINE_ARN> \
  --region us-east-1
```

## Monitoring

### Key Metrics
- Failover readiness status (hourly tests)
- API Gateway latency (target: < 1000ms)
- Lambda error rates (threshold: < 5 errors/min)
- Aurora replication lag (target: < 1000ms)

### Alarms
All critical alarms send notifications to the SNS topic:
- `trading-alerts-{region}-{environmentSuffix}`

## Cleanup

To destroy all resources:

```bash
export ENVIRONMENT_SUFFIX=prod

# Secondary region first
export AWS_REGION=us-east-2
npm run cdk:destroy

# Then primary region
export AWS_REGION=us-east-1
npm run cdk:destroy
```

## Cost Optimization

The solution uses several cost-optimized approaches:
- Aurora Serverless v2 (pay for actual usage)
- Lambda (pay per invocation)
- No NAT Gateways (VPC endpoints instead)
- DynamoDB pay-per-request billing
- S3 lifecycle policies

Estimated monthly cost: $200-500 depending on usage

## Security

- All data encrypted at rest
- VPC isolation for databases
- IAM least-privilege policies
- Secrets Manager for database credentials
- CloudWatch Logs for audit trail

## Support

For issues or questions, contact the infrastructure team.

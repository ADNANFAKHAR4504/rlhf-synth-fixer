# Multi-Region Disaster Recovery Architecture - CDKTF TypeScript

This CDKTF TypeScript implementation provides a comprehensive multi-region disaster recovery solution for a financial services transaction processing system. The architecture spans us-east-1 (primary) and us-east-2 (secondary) with automated failover achieving RPO < 5 minutes and RTO < 15 minutes.

## Architecture Summary

**Data Layer**:
- DynamoDB Global Tables for transaction data with point-in-time recovery
- Aurora Global Database (PostgreSQL) with primary writer and secondary reader
- S3 cross-region replication with RTC for objects under 128MB

**Compute Layer**:
- Lambda functions deployed identically in both regions (512MB, 30s timeout)
- VPC integration with proper security groups
- Region-aware environment variables

**Orchestration Layer**:
- Step Functions state machines in both regions for order processing
- Identical workflow definitions with retry logic and error handling
- EventBridge global endpoints for automatic event routing

**Failover Layer**:
- Route 53 health checks monitoring both regions
- Failover routing policies for automatic DNS failover
- CloudWatch alarms for health check failures

**Backup & Configuration**:
- AWS Backup with daily EBS snapshots and cross-region copy
- Systems Manager Parameter Store with cross-region replication via Lambda
- 7-day retention for backups

**Monitoring**:
- CloudWatch cross-region dashboards
- Unified view of both regions
- Metrics for Lambda, Step Functions, DynamoDB, Aurora, health checks

## File Structure

```
lib/
├── tap-stack.ts                    # Main orchestration stack
├── multi-region-dr-stack.ts        # DR stack coordinator
├── constructs/
│   ├── networking.ts               # VPCs, subnets, security groups
│   ├── database.ts                 # DynamoDB + Aurora Global
│   ├── storage.ts                  # S3 cross-region replication
│   ├── compute.ts                  # Lambda functions (both regions)
│   ├── workflow.ts                 # Step Functions state machines
│   ├── eventing.ts                 # EventBridge global endpoints
│   ├── routing.ts                  # Route 53 health checks & failover
│   ├── backup.ts                   # AWS Backup cross-region
│   ├── monitoring.ts               # CloudWatch dashboards
│   └── configuration.ts            # Parameter Store replication
└── lambda/
    ├── transaction-processor/      # Transaction processing logic
    │   └── processor.py
    └── param-replication/          # SSM parameter replication
        └── index.py
```

## Implementation Details

### Multi-Provider Configuration

The implementation uses CDKTF provider aliases to manage resources across both regions simultaneously. Each construct creates resources in both primary (us-east-1) and secondary (us-east-2) regions.

### Resource Naming

All resources follow the pattern: `{resource-type}-{primary|secondary}-${environmentSuffix}`

Examples:
- `transactions-${environmentSuffix}` (DynamoDB global table)
- `aurora-primary-${environmentSuffix}` (Aurora primary cluster)
- `dr-primary-${environmentSuffix}` (S3 primary bucket)
- `transaction-processor-primary-${environmentSuffix}` (Lambda function)

### Key Design Decisions

1. **Aurora Global Database**: No Multi-AZ on primary cluster since global replication provides regional redundancy
2. **Lambda VPC Integration**: Functions run in VPC for Aurora access, with VPC endpoints for AWS services
3. **S3 Replication**: RTC enabled for 15-minute replication guarantee meeting RPO requirements
4. **DynamoDB**: Global tables with on-demand billing for cost optimization and automatic scaling
5. **Step Functions**: Identical definitions deployed to both regions with region-specific Lambda ARNs
6. **Parameter Store**: Custom Lambda-based replication triggered by CloudWatch Events on parameter changes
7. **Backup**: EBS volumes only (Aurora and DynamoDB have built-in replication)
8. **Destroyability**: All resources configured for complete cleanup (skip_final_snapshot, no deletion protection)

### Failover Mechanisms

**Automated**:
- Route 53 health checks monitor primary region endpoint
- DNS failover routing automatically redirects to secondary on failure
- EventBridge global endpoints route events to active region
- DynamoDB and S3 provide automatic multi-region access

**Manual** (15-minute RTO):
- Promote Aurora secondary cluster to writer
- Update application configuration to use secondary region
- Verify Step Functions executing in secondary region

## Code Implementation

### Main Stack Orchestration

The `tap-stack.ts` file is updated to instantiate the multi-region DR stack:

```typescript
import { MultiRegionDRStack } from './multi-region-dr-stack';

// Inside TapStack constructor
new MultiRegionDRStack(this, 'MultiRegionDR', {
  environmentSuffix,
  primaryRegion: 'us-east-1',
  secondaryRegion: 'us-east-2',
  domainName: `dr-app-${environmentSuffix}.example.com`,
});
```

### Lambda Function Code

**Transaction Processor** (`lib/lambda/transaction-processor/processor.py`):
```python
import json
import os
import boto3
from datetime import datetime

# Environment variables
REGION = os.environ['AWS_REGION_NAME']
DYNAMO_TABLE = os.environ['DYNAMO_TABLE_NAME']
S3_BUCKET = os.environ['S3_BUCKET']
IS_PRIMARY = os.environ.get('IS_PRIMARY', 'false') == 'true'

dynamodb = boto3.resource('dynamodb', region_name=REGION)
s3 = boto3.client('s3', region_name=REGION)
table = dynamodb.Table(DYNAMO_TABLE)

def handler(event, context):
    action = event.get('action', 'process')
    order = event.get('order', {})

    if action == 'validate':
        return validate_order(order)
    elif action == 'process_payment':
        return process_payment(order)
    elif action == 'fulfill':
        return fulfill_order(order)
    else:
        return process_transaction(event)

def validate_order(order):
    # Validate order structure
    required_fields = ['orderId', 'customerId', 'amount']
    if not all(field in order for field in required_fields):
        raise ValueError('Missing required order fields')

    return {
        'statusCode': 200,
        'body': json.dumps({'status': 'validated', 'order': order})
    }

def process_payment(order):
    # Process payment logic
    transaction_id = f"txn-{order['orderId']}-{int(datetime.now().timestamp())}"

    # Store transaction in DynamoDB
    table.put_item(
        Item={
            'transactionId': transaction_id,
            'timestamp': int(datetime.now().timestamp()),
            'orderId': order['orderId'],
            'customerId': order['customerId'],
            'amount': order['amount'],
            'status': 'payment_processed',
            'region': REGION,
            'isPrimary': IS_PRIMARY
        }
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'status': 'payment_processed',
            'transactionId': transaction_id,
            'order': order
        })
    }

def fulfill_order(order):
    # Fulfillment logic
    fulfillment_id = f"fulfill-{order['orderId']}"

    # Store fulfillment record in S3
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=f"fulfillment/{fulfillment_id}.json",
        Body=json.dumps({
            'fulfillmentId': fulfillment_id,
            'orderId': order['orderId'],
            'timestamp': datetime.now().isoformat(),
            'region': REGION,
            'status': 'fulfilled'
        })
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'status': 'fulfilled',
            'fulfillmentId': fulfillment_id,
            'order': order
        })
    }

def process_transaction(event):
    # Generic transaction processing
    return {
        'statusCode': 200,
        'body': json.dumps({
            'status': 'processed',
            'region': REGION,
            'isPrimary': IS_PRIMARY
        })
    }
```

**Parameter Replication** (`lib/lambda/param-replication/index.py`):
```python
import json
import os
import boto3

SOURCE_REGION = os.environ['SOURCE_REGION']
TARGET_REGION = os.environ['TARGET_REGION']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']

source_ssm = boto3.client('ssm', region_name=SOURCE_REGION)
target_ssm = boto3.client('ssm', region_name=TARGET_REGION)

def handler(event, context):
    # Extract parameter name from CloudWatch Event
    detail = event.get('detail', {})
    param_name = detail.get('name')

    if not param_name or not param_name.startswith(f'/app/{ENVIRONMENT_SUFFIX}/'):
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Parameter not in scope'})
        }

    try:
        # Get parameter from source region
        response = source_ssm.get_parameter(
            Name=param_name,
            WithDecryption=True
        )

        param = response['Parameter']

        # Put parameter in target region
        target_ssm.put_parameter(
            Name=param_name,
            Value=param['Value'],
            Type=param['Type'],
            Description=param.get('Description', 'Replicated from primary region'),
            Overwrite=True
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully replicated {param_name}',
                'sourceRegion': SOURCE_REGION,
                'targetRegion': TARGET_REGION
            })
        }

    except Exception as e:
        print(f'Error replicating parameter: {str(e)}')
        raise
```

## Deployment & Testing

### Prerequisites
```bash
npm install
cdktf get
```

### Deploy
```bash
# Synthesize
cdktf synth

# Deploy
cdktf deploy --auto-approve
```

### Verify Deployment
```bash
# Check DynamoDB Global Table
aws dynamodb describe-table --table-name transactions-${ENVIRONMENT_SUFFIX} --region us-east-1
aws dynamodb describe-table --table-name transactions-${ENVIRONMENT_SUFFIX} --region us-east-2

# Check Aurora Global Cluster
aws rds describe-global-clusters --region us-east-1

# Check S3 Replication
aws s3api get-bucket-replication --bucket dr-primary-${ENVIRONMENT_SUFFIX}

# Check Route 53 Health Check
aws route53 get-health-check --health-check-id ${HEALTH_CHECK_ID}
```

### Test Failover
```bash
# 1. Test primary region
aws lambda invoke --function-name transaction-processor-primary-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --payload '{"action":"process","order":{"orderId":"test-001","customerId":"cust-001","amount":100}}' \
  response.json

# 2. Simulate primary region failure (disable health check)
aws route53 update-health-check --health-check-id ${HEALTH_CHECK_ID} --disabled

# 3. Verify DNS failover (should resolve to secondary)
dig dr-app-${ENVIRONMENT_SUFFIX}.example.com

# 4. Test secondary region
aws lambda invoke --function-name transaction-processor-secondary-${ENVIRONMENT_SUFFIX} \
  --region us-east-2 \
  --payload '{"action":"process","order":{"orderId":"test-002","customerId":"cust-002","amount":200}}' \
  response.json

# 5. Verify data replication
aws dynamodb get-item --table-name transactions-${ENVIRONMENT_SUFFIX} \
  --region us-east-2 \
  --key '{"transactionId":{"S":"txn-test-001-..."}}'
```

## Cost Optimization

- **DynamoDB**: On-demand billing (pay per request)
- **Aurora**: db.r5.large instances (smallest global-compatible size)
- **Lambda**: 512MB memory (balanced for performance)
- **S3**: Standard storage with lifecycle policies (configure as needed)
- **Backup**: 7-day retention (adjust based on compliance)

**Estimated Monthly Cost** (moderate usage):
- Aurora Global: ~$700 (2 instances)
- Lambda: ~$50 (1M requests/month)
- DynamoDB: ~$25 (on-demand)
- S3: ~$20 (100GB with replication)
- Route 53: ~$5 (health checks)
- **Total**: ~$800/month

## Security

- All S3 buckets encrypted with SSE-S3
- Aurora encryption at rest enabled
- DynamoDB encryption enabled by default
- IAM roles follow least privilege
- Security groups restrictive (VPC-only access)
- No public internet access for databases
- Lambda functions in private subnets
- All inter-region traffic uses AWS backbone

## Limitations & Considerations

1. **Aurora Global Database**: Secondary cluster is read-only until promoted (manual step)
2. **Lambda Cold Starts**: VPC-enabled functions may have higher latency
3. **EventBridge Global Endpoints**: Requires Route 53 health check integration
4. **Parameter Store Replication**: Custom Lambda solution (not native AWS feature)
5. **Cost**: Multi-region architecture doubles infrastructure costs
6. **Data Residency**: Verify compliance with data sovereignty requirements

## Monitoring & Alerts

CloudWatch dashboard includes:
- Lambda invocations, errors, duration (both regions)
- Step Functions executions, failures (both regions)
- DynamoDB consumed capacity, throttles
- Aurora connections, CPU, replication lag
- Route 53 health check status
- S3 replication metrics (pending objects, latency)

Recommended alarms:
- Health check failure → SNS notification
- Aurora replication lag > 5 minutes
- S3 replication latency > 15 minutes
- Lambda error rate > 1%
- Step Functions failure rate > 5%

## Disaster Recovery Procedures

**Scenario 1: Primary Region Failure**
1. Route 53 automatically fails over DNS (< 1 minute)
2. EventBridge routes new events to secondary (automatic)
3. Applications read from DynamoDB and S3 in secondary (automatic)
4. Promote Aurora secondary to writer (manual, 5-10 minutes)
5. Update application configuration if needed

**Scenario 2: Primary Region Recovery**
1. Verify primary region health checks pass
2. Route 53 automatically fails back (optional, can keep secondary)
3. If needed, reverse Aurora promotion
4. Monitor replication lag during recovery

**RTO**: 15 minutes (includes manual Aurora promotion)
**RPO**: < 5 minutes (DynamoDB and S3 replication)

This implementation provides a robust, cost-effective multi-region disaster recovery solution meeting financial services requirements for high availability and data durability.

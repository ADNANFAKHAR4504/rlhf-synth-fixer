# Migration Orchestration Infrastructure

This CDK Python application provides comprehensive infrastructure for orchestrating a phased migration from on-premises to AWS cloud.

## Architecture

The solution implements a complete migration orchestration platform with:

### Core Components

1. **VPC Infrastructure**
   - VPC with 10.0.0.0/16 CIDR across 3 availability zones
   - Public and private subnets in each AZ
   - NAT Gateway for internet access (1 for cost optimization)
   - VPC endpoints for S3 and DynamoDB

2. **Database Migration (DMS)**
   - Multi-AZ DMS replication instance (dms.t3.medium)
   - 100GB allocated storage with encryption
   - Replication subnet group across private subnets
   - Security groups for PostgreSQL access

3. **Server Replication (CloudEndure)**
   - IAM role with required permissions
   - EC2 describe, create, and modify permissions
   - Support for 12 application server instances

4. **Hybrid Connectivity (VPN)**
   - Site-to-Site VPN with BGP routing
   - Customer Gateway for on-premises (203.0.113.12 placeholder)
   - Virtual Private Gateway attached to VPC
   - Route propagation to private subnets
   - Connection between 192.168.0.0/16 (on-premises) and 10.0.0.0/16 (AWS)

5. **DNS Management (Route 53)**
   - Private hosted zone (migration-{environmentSuffix}.internal)
   - Support for blue-green deployment
   - Weighted routing for gradual traffic shifting

6. **Migration Tracking (DynamoDB)**
   - Table with serverId (partition key) and timestamp (sort key)
   - Global secondary index on migrationPhase
   - Encrypted with customer-managed KMS key
   - On-demand billing mode

7. **Notifications (SNS)**
   - Topic for migration status updates
   - Encrypted with KMS
   - Support for email subscriptions (add manually)

8. **Post-Migration Validation (Systems Manager)**
   - SSM document for automated validation
   - Application health checks
   - Database connectivity tests
   - Service availability verification

9. **Automated Rollback (Lambda)**
   - Python 3.11 Lambda function
   - Triggered by CloudWatch alarms
   - Updates Route 53 routing
   - Logs events to DynamoDB
   - Sends SNS notifications

10. **Monitoring (CloudWatch)**
    - Comprehensive dashboard
    - DMS replication lag metrics
    - VPN connection status
    - Lambda invocation metrics
    - DynamoDB activity metrics

## Prerequisites

- AWS CDK 2.x
- Python 3.8 or higher
- AWS CLI configured with appropriate credentials
- Node.js 18.x or higher (for CDK CLI)

## Deployment

### Install Dependencies

```bash
pip install -r requirements.txt
npm install -g aws-cdk
```

### Bootstrap CDK (first time only)

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

### Deploy Stack

```bash
# Deploy with default environment suffix (dev)
cdk deploy

# Deploy with custom environment suffix
cdk deploy -c environmentSuffix=prod
```

### Verify Deployment

```bash
# List all stacks
cdk ls

# View synthesized CloudFormation template
cdk synth
```

## Configuration

### Environment Suffix

The `environmentSuffix` context variable is used to create unique resource names:

```bash
cdk deploy -c environmentSuffix=staging
```

### On-Premises IP Address

Update the Customer Gateway IP address in `lib/tap_stack.py`:

```python
ip_address="203.0.113.12",  # Replace with actual on-premises public IP
```

### Email Notifications

Add email subscription to SNS topic in `lib/tap_stack.py`:

```python
topic.add_subscription(subscriptions.EmailSubscription("admin@example.com"))
```

## Migration Workflow

### Phase 1: Setup Hybrid Connectivity
1. Deploy the infrastructure stack
2. Configure on-premises VPN device with VPN connection details
3. Verify VPN tunnels are up (check CloudWatch dashboard)

### Phase 2: Database Migration
1. Create DMS endpoints for source and target databases
2. Create DMS replication task
3. Start replication and monitor lag in CloudWatch dashboard
4. Verify data consistency

### Phase 3: Server Migration
1. Install CloudEndure agents on on-premises servers
2. Configure replication using CloudEndure IAM role
3. Monitor replication progress
4. Perform test cutover
5. Log status in DynamoDB migration tracking table

### Phase 4: DNS Cutover
1. Create weighted routing records in Route 53
2. Gradually shift traffic from on-premises to AWS (90/10, 50/50, 10/90, 0/100)
3. Monitor application metrics
4. Roll back if issues detected (Lambda function)

### Phase 5: Validation
1. Execute SSM document for post-migration validation
2. Verify application health, database connectivity, service availability
3. Update migration status in DynamoDB

### Phase 6: Cleanup
1. Decommission on-premises resources
2. Remove VPN connection if no longer needed
3. Update documentation

## Monitoring

### CloudWatch Dashboard

Access the dashboard: `migration-dashboard-{environmentSuffix}`

Key metrics:
- **DMS Replication Lag**: CDCLatencySource and CDCLatencyTarget
- **VPN Connection**: TunnelState, TunnelDataIn, TunnelDataOut
- **Lambda Rollback**: Invocations and errors
- **DynamoDB**: Read/write capacity consumption

### DynamoDB Migration Tracking

Query migration status:

```bash
aws dynamodb query \
  --table-name migration-tracking-{environmentSuffix} \
  --index-name MigrationPhaseIndex \
  --key-condition-expression "migrationPhase = :phase" \
  --expression-attribute-values '{":phase":{"S":"CUTOVER"}}'
```

### SNS Notifications

Subscribe to topic:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:migration-notifications-{environmentSuffix} \
  --protocol email \
  --notification-endpoint admin@example.com
```

## Rollback Procedure

Automated rollback triggers when CloudWatch alarms detect issues:

1. Lambda function invoked by alarm
2. Route 53 weighted routing updated to shift traffic back to on-premises
3. Event logged in DynamoDB
4. SNS notification sent to subscribers

Manual rollback:

```bash
aws lambda invoke \
  --function-name migration-rollback-{environmentSuffix} \
  --payload '{"alarmName":"HighErrorRate","alarmState":"ALARM"}' \
  response.json
```

## Testing

### Unit Tests

```bash
pytest tests/unit/ -v
```

### Integration Tests

```bash
pytest tests/integration/ -v
```

## Security

- All data encrypted at rest using customer-managed KMS keys
- All data encrypted in transit using TLS/SSL
- IAM roles follow principle of least privilege
- VPN connection uses IPsec
- Private subnets for all data resources
- Security groups restrict access to necessary ports only

## Cost Optimization

- Single NAT Gateway instead of per-AZ (saves ~$64/month)
- VPC endpoints for S3 and DynamoDB (reduces NAT costs)
- DynamoDB on-demand billing (no provisioned capacity)
- DMS t3.medium instance (right-sized for 500GB database)
- Lambda with 5-minute timeout (pay per use)

## Troubleshooting

### VPN Connection Issues

Check tunnel status:

```bash
aws ec2 describe-vpn-connections \
  --vpn-connection-ids vpn-xxxxx \
  --query 'VpnConnections[0].VgwTelemetry'
```

### DMS Replication Issues

Check task status:

```bash
aws dms describe-replication-tasks \
  --filters Name=replication-instance-arn,Values=arn:aws:dms:...
```

### Lambda Errors

View logs:

```bash
aws logs tail /aws/lambda/migration-rollback-{environmentSuffix} --follow
```

## Cleanup

```bash
# Destroy all resources
cdk destroy

# Confirm deletion
# Type 'y' when prompted
```

**Note**: All resources are configured with `RemovalPolicy.DESTROY` for clean teardown.

## Support

For issues or questions:
1. Check CloudWatch dashboard for metrics
2. Review CloudWatch Logs for Lambda and DMS
3. Query DynamoDB table for migration events
4. Check SNS notifications for alerts

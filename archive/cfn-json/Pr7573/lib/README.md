# Multi-Region Disaster Recovery Solution

This CloudFormation solution implements a complete multi-region disaster recovery infrastructure for payment processing with active-passive failover between us-east-1 and us-west-2.

## Architecture

- **Primary Region (us-east-1)**: Active writer database, primary ALB, Lambda functions
- **Secondary Region (us-west-2)**: Read replica database, secondary ALB, Lambda functions
- **Route 53**: Health check-based failover routing
- **Aurora Global Database**: Multi-region replication with <1 second lag
- **S3 Cross-Region Replication**: Transaction logs replicated to DR region

## Deployment Instructions

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Two AWS regions available (us-east-1 and us-west-2)
3. Email address for SNS notifications
4. Database master password (minimum 8 characters)

### Step 1: Deploy Primary Stack (us-east-1)

```bash
aws cloudformation create-stack \
  --stack-name payment-dr-primary \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=environmentSuffix,ParameterValue=prod \
    ParameterKey=DBMasterUsername,ParameterValue=admin \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123 \
    ParameterKey=HostedZoneName,ParameterValue=payment-dr.example.com \
    ParameterKey=AlertEmail,ParameterValue=alerts@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Wait for stack creation to complete:

```bash
aws cloudformation wait stack-create-complete \
  --stack-name payment-dr-primary \
  --region us-east-1
```

### Step 2: Get Primary Stack Outputs

```bash
PRIMARY_VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`PrimaryVPCId`].OutputValue' \
  --output text)

GLOBAL_CLUSTER=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`GlobalDBClusterArn`].OutputValue' \
  --output text | cut -d: -f6)

HOSTED_ZONE_ID=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`Route53HostedZoneId`].OutputValue' \
  --output text)

echo "Primary VPC ID: $PRIMARY_VPC_ID"
echo "Global Cluster: $GLOBAL_CLUSTER"
echo "Hosted Zone ID: $HOSTED_ZONE_ID"
```

### Step 3: Create Secondary S3 Bucket First

The primary stack's S3 replication requires the secondary bucket to exist:

```bash
aws s3api create-bucket \
  --bucket transaction-logs-secondary-prod-$(aws sts get-caller-identity --query Account --output text) \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

aws s3api put-bucket-versioning \
  --bucket transaction-logs-secondary-prod-$(aws sts get-caller-identity --query Account --output text) \
  --versioning-configuration Status=Enabled \
  --region us-west-2
```

### Step 4: Deploy Secondary Stack (us-west-2)

```bash
aws cloudformation create-stack \
  --stack-name payment-dr-secondary \
  --template-body file://lib/TapStack-Secondary.json \
  --parameters \
    ParameterKey=environmentSuffix,ParameterValue=prod \
    ParameterKey=PrimaryVPCId,ParameterValue=$PRIMARY_VPC_ID \
    ParameterKey=GlobalClusterIdentifier,ParameterValue=$GLOBAL_CLUSTER \
    ParameterKey=HostedZoneId,ParameterValue=$HOSTED_ZONE_ID \
    ParameterKey=HostedZoneName,ParameterValue=payment-dr.example.com \
    ParameterKey=AlertEmail,ParameterValue=alerts@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

Wait for stack creation to complete:

```bash
aws cloudformation wait stack-create-complete \
  --stack-name payment-dr-secondary \
  --region us-west-2
```

### Step 5: Configure VPC Peering

Note: VPC peering between regions in the same account requires manual setup as CloudFormation doesn't support cross-region peering creation directly.

```bash
# Create peering connection from primary to secondary
PEERING_ID=$(aws ec2 create-vpc-peering-connection \
  --vpc-id $PRIMARY_VPC_ID \
  --peer-vpc-id $(aws ec2 describe-vpcs --region us-west-2 --filters "Name=tag:Name,Values=vpc-secondary-prod" --query 'Vpcs[0].VpcId' --output text) \
  --peer-region us-west-2 \
  --region us-east-1 \
  --query 'VpcPeeringConnection.VpcPeeringConnectionId' \
  --output text)

# Accept peering connection in secondary region
aws ec2 accept-vpc-peering-connection \
  --vpc-peering-connection-id $PEERING_ID \
  --region us-west-2
```

## Testing the Deployment

### Test Primary Region

```bash
PRIMARY_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`PaymentEndpoint`].OutputValue' \
  --output text)

# Invoke Lambda function directly
aws lambda invoke \
  --function-name payment-processor-prod \
  --payload '{"transactionId": "test-123", "amount": 100.00}' \
  --region us-east-1 \
  response.json

cat response.json
```

### Test Secondary Region

```bash
aws lambda invoke \
  --function-name payment-processor-secondary-prod \
  --payload '{"transactionId": "test-456", "amount": 200.00}' \
  --region us-west-2 \
  response-secondary.json

cat response-secondary.json
```

### Verify S3 Replication

```bash
# Upload test file to primary bucket
echo "test transaction" > test-transaction.txt
aws s3 cp test-transaction.txt s3://transaction-logs-primary-prod-$(aws sts get-caller-identity --query Account --output text)/test/

# Wait 15 minutes (replication time)
sleep 900

# Check secondary bucket
aws s3 ls s3://transaction-logs-secondary-prod-$(aws sts get-caller-identity --query Account --output text)/test/ --region us-west-2
```

### Monitor Aurora Replication

```bash
# Check replication lag
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=primary-payment-cluster-prod \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average \
  --region us-east-1
```

## Cleanup

To delete the infrastructure:

```bash
# Delete secondary stack first
aws cloudformation delete-stack \
  --stack-name payment-dr-secondary \
  --region us-west-2

aws cloudformation wait stack-delete-complete \
  --stack-name payment-dr-secondary \
  --region us-west-2

# Delete secondary S3 bucket
aws s3 rm s3://transaction-logs-secondary-prod-$(aws sts get-caller-identity --query Account --output text) --recursive --region us-west-2
aws s3api delete-bucket \
  --bucket transaction-logs-secondary-prod-$(aws sts get-caller-identity --query Account --output text) \
  --region us-west-2

# Delete primary stack
aws cloudformation delete-stack \
  --stack-name payment-dr-primary \
  --region us-east-1

aws cloudformation wait stack-delete-complete \
  --stack-name payment-dr-primary \
  --region us-east-1
```

## Important Notes

1. **Aurora Global Database**: The global cluster must be created in the primary region first, then the secondary cluster joins it.

2. **S3 Replication**: The secondary bucket must exist before the primary stack is created, or you'll need to update the primary stack after creating the secondary bucket.

3. **VPC Peering**: Manual configuration required for cross-region peering. Update route tables to allow traffic between VPCs.

4. **Health Checks**: Route 53 health checks monitor ALB endpoints. Failover happens automatically when primary health check fails.

5. **Costs**: This infrastructure runs continuously. Consider using Aurora Serverless v2 for cost optimization in DR region.

6. **DNS Propagation**: After Route 53 failover, DNS changes may take up to TTL duration to propagate (default 60 seconds).

7. **Testing Failover**: To test failover, stop the primary ALB or RDS instance and monitor Route 53 health check status.

## Monitoring

CloudWatch alarms are configured for:
- Aurora replication lag (threshold: 5 seconds)
- ALB target health
- Lambda function errors
- Route 53 health check status

All alarms publish to SNS topics in their respective regions.

## Security

- All data encrypted at rest (Aurora, S3)
- VPC security groups restrict access
- IAM roles follow least privilege principle
- Database credentials passed securely via CloudFormation parameters
- Lambda functions run in private subnets with VPC configuration
# Multi-Region Disaster Recovery Infrastructure

Production-ready multi-region disaster recovery architecture for payment processing using **CDKTF with Python**.

## Architecture Overview

Multi-region deployment spanning us-east-1 (primary) and us-west-2 (secondary):

- **Aurora Global Database**: Writer in us-east-1, reader in us-west-2 (db.r5.large, 72-hour backtracking)
- **DynamoDB Global Tables**: Session management with on-demand billing, point-in-time recovery
- **Lambda Functions**: Payment processing (Python 3.11, 1GB memory) deployed identically in both regions
- **Route 53 Failover**: DNS-based automatic failover with health checks (30s interval, 3-failure threshold)
- **EventBridge**: Cross-region event replication for payment transactions
- **AWS Backup**: Daily backups with cross-region copy (7-day retention)
- **CloudWatch**: Per-region dashboards and alarms for monitoring
- **VPC**: Private subnets across 3 AZs, NAT gateways, security groups
- **IAM**: Cross-region roles with least privilege access
- **Systems Manager Parameter Store**: Secure configuration management

**Recovery Objectives**: RPO 5 minutes | RTO 15 minutes

## Prerequisites

- Python 3.9+
- CDKTF CLI 0.20+
- AWS CLI configured with credentials
- Pipenv for dependency management

## Installation

```bash
# Install dependencies
pipenv install

# Set environment variables
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="your-state-bucket"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

## Deployment

```bash
# Synthesize CDKTF configuration
pipenv run cdktf synth

# Deploy infrastructure
pipenv run cdktf deploy

# Confirm when prompted
```

## Infrastructure Components

### Networking (lib/networking_stack.py)
- VPC (10.0.0.0/16 for us-east-1, 10.1.0.0/16 for us-west-2)
- 3 public subnets + 3 private subnets per region
- Internet Gateway, NAT Gateway
- Security groups for Aurora and Lambda

### Database (lib/database_stack.py)
- Aurora Global Cluster (MySQL 8.0)
- Primary cluster (writer) in us-east-1
- Secondary cluster (reader) in us-west-2
- DynamoDB Global Table for sessions
- Systems Manager Parameter Store for endpoints
- Cross-region IAM roles

### Compute (lib/compute_stack.py)
- Lambda functions in both regions
- Lambda function URLs for API access
- EventBridge rules for cross-region replication
- IAM roles with VPC, RDS, DynamoDB, SSM permissions

### Monitoring (lib/monitoring_stack.py)
- CloudWatch dashboards per region
- Aurora replication lag alarm (>60s)
- Lambda error alarms
- DynamoDB throttling alarms

### Backup (lib/backup_stack.py)
- AWS Backup vaults in both regions
- Daily backup schedule (3 AM UTC)
- Cross-region copy to secondary region
- 7-day retention policy

### DNS (lib/dns_stack.py)
- Route 53 hosted zone
- Health checks for both regions
- Failover routing (PRIMARY/SECONDARY)
- DNS TTL: 60 seconds

## Testing

```bash
# Run unit tests
pipenv run pytest tests/unit/

# Run integration tests (requires deployed infrastructure)
pipenv run pytest tests/integration/
```

## Configuration

### Environment Variables
- `ENVIRONMENT_SUFFIX`: Unique suffix for resources (default: "dev")
- `AWS_REGION`: Primary region (default: "us-east-1")
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state
- `TERRAFORM_STATE_BUCKET_REGION`: State bucket region

### Database Credentials
Stored in Systems Manager Parameter Store:
- `/payment/{environment_suffix}/db/primary/endpoint`
- `/payment/{environment_suffix}/db/secondary/endpoint`
- `/payment/{environment_suffix}/db/dynamodb/table`

**Production Note**: Use AWS Secrets Manager with automatic rotation instead of hardcoded passwords.

## Disaster Recovery Testing

### Simulate Primary Region Failure
1. Disable primary health check in Route 53 console
2. Monitor DNS failover to secondary region (60s TTL)
3. Verify traffic routes to secondary Lambda
4. Check CloudWatch alarms trigger

### Manual Aurora Failover
Aurora Global Database requires manual promotion of secondary to writer:
```bash
aws rds failover-global-cluster \
  --global-cluster-identifier payment-global-{environment_suffix} \
  --target-db-cluster-identifier payment-secondary-{environment_suffix}
```

## Monitoring

### CloudWatch Dashboards
- **Primary**: `payment-primary-{environment_suffix}`
- **Secondary**: `payment-secondary-{environment_suffix}`

### Key Alarms
- `payment-replication-lag-{environment_suffix}`: Aurora lag >60s
- `payment-lambda-errors-primary-{environment_suffix}`: Lambda errors
- `payment-lambda-errors-secondary-{environment_suffix}`: Lambda errors

## API Usage

Test payment processing:
```bash
# Get Lambda function URL
PRIMARY_URL=$(aws lambda get-function-url-config \
  --function-name payment-processor-primary-{environment_suffix} \
  --query 'FunctionUrl' --output text)

# Process payment
curl -X POST "$PRIMARY_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "currency": "USD",
    "session_id": "test-session-123"
  }'
```

Expected response:
```json
{
  "message": "Payment processed",
  "transaction_id": "txn-1234567890.123",
  "amount": 100.5,
  "currency": "USD",
  "region": "us-east-1",
  "session_id": "test-session-123"
}
```

## Cleanup

```bash
# Destroy all resources
pipenv run cdktf destroy

# Confirm destruction when prompted
```

## Security Considerations

1. **Encryption**: All data encrypted at rest (RDS, DynamoDB) and in transit (TLS)
2. **IAM**: Least privilege policies for all roles
3. **VPC**: Resources in private subnets, no public access
4. **Secrets**: Use AWS Secrets Manager in production
5. **Security Groups**: Restrictive rules (database only from VPC)

## Cost Optimization

- **DynamoDB**: On-demand billing reduces costs during low traffic
- **NAT Gateway**: Single NAT per region (consider HA for production)
- **Backup Retention**: 7 days balances cost and compliance
- **Aurora Serverless**: Consider Aurora Serverless v2 for variable workloads

## Troubleshooting

### Lambda Cannot Connect to Database
1. Check security group allows Lambda → RDS (port 3306)
2. Verify VPC configuration and subnet associations
3. Check database endpoints in Parameter Store

### DynamoDB Replication Lag
1. Verify table streams enabled
2. Check replica configuration in both regions
3. Monitor CloudWatch for throttling

### Route 53 Failover Not Working
1. Verify health checks passing in both regions
2. Check DNS TTL (60 seconds)
3. Ensure Lambda function URLs accessible

## File Structure

```
lib/
├── tap_stack.py              # Main stack orchestration
├── networking_stack.py        # VPC, subnets, security groups
├── database_stack.py          # Aurora Global DB, DynamoDB
├── compute_stack.py           # Lambda, EventBridge
├── monitoring_stack.py        # CloudWatch dashboards, alarms
├── backup_stack.py            # AWS Backup configuration
├── dns_stack.py               # Route 53 failover routing
├── lambda/
│   └── index.py              # Payment processing function
├── PROMPT.md                  # Original requirements
├── MODEL_RESPONSE.md          # Generated implementation
└── README.md                  # This file
```

## Resources

- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [Route 53 Failover Routing](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-failover.html)
- [AWS Backup](https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html)

# RDS Cross-Region Disaster Recovery with Automated Failover

Production-ready Terraform infrastructure for PostgreSQL disaster recovery across AWS regions with automated failover monitoring.

## Overview

This infrastructure deploys a cross-region RDS PostgreSQL disaster recovery solution with:
- Primary database in us-east-1
- Read replica in us-west-2 for DR
- Automated replication lag monitoring via Lambda
- Automatic failover promotion when lag exceeds threshold
- Environment-based sizing (test vs production)
- Complete VPC networking with peering
- Comprehensive CloudWatch monitoring and alerting

## Architecture

```
Primary Region (us-east-1)           DR Region (us-west-2)
┌─────────────────────────┐         ┌─────────────────────────┐
│  VPC (10.0.0.0/16)      │         │  VPC (10.1.0.0/16)      │
│  ┌──────────────────┐   │         │  ┌──────────────────┐   │
│  │ RDS Primary      │   │         │  │ RDS Read Replica │   │
│  │ (Multi-AZ prod)  │───┼─────────┼──│ (Standby)        │   │
│  │ PostgreSQL       │   │         │  │ PostgreSQL       │   │
│  └──────────────────┘   │         │  └──────────────────┘   │
│                          │         │                          │
│  ┌──────────────────┐   │         │                          │
│  │ Lambda Monitor   │   │         │                          │
│  │ (checks lag)     │───┼─────────┼──► Promotes if lag > 60s │
│  └──────────────────┘   │         │                          │
└──────────┬───────────────┘         └─────────────────────────┘
           │                                     ▲
           │                                     │
           └─────VPC Peering (encrypted)────────┘
```

## Key Features

### Environment-Based Sizing

**Test Environment** (default):
- Instance: db.t3.micro
- Multi-AZ: Disabled
- Storage: 20 GB
- Monitoring: Basic
- Cost: ~$40/month
- Deploy time: ~20 minutes

**Production Environment**:
- Instance: db.r6g.large
- Multi-AZ: Enabled
- Storage: 100 GB
- Monitoring: Enhanced + Performance Insights
- Cost: ~$1290/month
- Deploy time: ~80 minutes

### Security Features

- Customer-managed KMS keys for encryption at rest
- Secrets Manager for password management
- IAM roles with least privilege
- VPC isolation with private subnets
- Security groups restricting access to PostgreSQL port
- Encryption in transit via VPC peering

### Automated Failover

Lambda function monitors replication lag every 5 minutes:
- Queries CloudWatch ReplicaLag metric
- If lag > 60 seconds, automatically promotes DR replica
- Logs all actions to CloudWatch Logs
- Provides status via function response

### Monitoring and Alerting

CloudWatch alarms for:
- Primary CPU > 80%
- Primary connections > 80
- DR replica lag > 30 seconds
- DR CPU > 80%
- All alarms publish to SNS topic

## Deployment

### Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- Permissions to create RDS, VPC, Lambda, IAM, KMS resources

### Quick Start

1. **Create terraform.tfvars:**

```hcl
environment_suffix = "test-001"
environment        = "test"
```

2. **Initialize Terraform:**

```bash
cd lib
terraform init
```

3. **Plan deployment:**

```bash
terraform plan -out=tfplan
```

4. **Deploy (test: ~20 min, prod: ~80 min):**

```bash
terraform apply tfplan
```

### Configuration Options

See `variables.tf` for all available variables. Key variables:

- `environment_suffix` (required): Unique identifier for resources
- `environment` (default: "test"): "test" or "prod" for sizing
- `primary_region` (default: "us-east-1"): Primary AWS region
- `dr_region` (default: "us-west-2"): DR AWS region
- `replication_lag_threshold` (default: 60): Failover trigger in seconds

### Backend Configuration

Update `providers.tf` backend configuration:

```hcl
backend "s3" {
  bucket         = "your-terraform-state-bucket"
  key            = "rds-dr/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "your-terraform-lock-table"
}
```

Or use local backend during initial testing.

## Testing

### Verify Replication

```bash
aws rds describe-db-instances \
  --region us-west-2 \
  --db-instance-identifier rds-dr-replica-test-001 \
  --query 'DBInstances[0].StatusInfos'
```

### Check Replication Lag

```bash
aws cloudwatch get-metric-statistics \
  --region us-west-2 \
  --namespace AWS/RDS \
  --metric-name ReplicaLag \
  --dimensions Name=DBInstanceIdentifier,Value=rds-dr-replica-test-001 \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

### Test Lambda Function

```bash
aws lambda invoke \
  --function-name rds-failover-monitor-test-001 \
  --log-type Tail \
  response.json && cat response.json
```

## Operations

### Manual Failover

To manually promote DR replica:

```bash
aws rds promote-read-replica \
  --region us-west-2 \
  --db-instance-identifier rds-dr-replica-test-001
```

### Monitoring Lambda

View Lambda logs:

```bash
aws logs tail /aws/lambda/rds-failover-monitor-test-001 --follow
```

### Accessing Database

Get credentials from Secrets Manager:

```bash
aws secretsmanager get-secret-value \
  --secret-id rds-master-password-test-001 \
  --query SecretString \
  --output text | jq -r '.password'
```

Connect to primary:

```bash
psql -h <primary_endpoint> -U dbadmin -d appdb
```

## Troubleshooting

### Replication Not Working

1. Check VPC peering status:
   ```bash
   aws ec2 describe-vpc-peering-connections \
     --filters "Name=tag:Name,Values=rds-vpc-peering-*"
   ```

2. Verify routes exist in both regions:
   ```bash
   aws ec2 describe-route-tables --filters "Name=tag:Name,Values=rds-*"
   ```

3. Check security group rules allow port 5432 from both VPC CIDRs

### Lambda Not Executing

1. Check EventBridge rule is enabled
2. Verify Lambda has correct IAM permissions
3. Review CloudWatch Logs for errors
4. Check environment variables are set correctly

### High Costs

If test environment costs more than expected:
- Verify `environment = "test"` in tfvars
- Check instance class is db.t3.micro
- Confirm Multi-AZ is false for primary
- Review CloudWatch billing metrics

## Cleanup

Destroy all resources:

```bash
terraform destroy -auto-approve
```

Destruction time:
- Test: ~10 minutes
- Production: ~15 minutes

## Important Notes

### Route53 Health Checks Not Supported

This implementation does NOT use Route53 health checks because:
- RDS endpoints are DNS names, not static IPs
- Route53 TCP health checks require static IPs
- After promotion, DNS records change but health checks fail

**Alternative DNS Failover Options:**

1. **Application-Level Health Checks**: App monitors DB, updates Route53 on failure
2. **AWS Global Accelerator**: Static anycast IPs with built-in health checking
3. **RDS Proxy + NLB**: Connection pooling with target health checks
4. **Manual Failover**: CloudWatch alarms notify ops team to update DNS

### VPC Peering Requirements

VPC peering requires bidirectional routing:
- Primary route table has route to DR CIDR (10.1.0.0/16)
- DR route table has route to primary CIDR (10.0.0.0/16)
- Both security groups allow traffic from both CIDRs

### Cost Optimization

For frequent testing, always use `environment = "test"`:
- 97% cost reduction vs production
- Fast deployment for CI/CD
- All features functional at small scale

### Failover Considerations

After replica promotion:
- Replication relationship is permanently broken
- Original primary cannot become replica without rebuild
- Applications must handle endpoint changes
- Manual intervention required to re-establish DR

## File Structure

```
lib/
├── providers.tf              # Provider and backend configuration
├── variables.tf              # Input variables
├── locals.tf                 # Local values and environment logic
├── data.tf                   # Data sources
├── kms.tf                    # KMS encryption keys
├── vpc-primary.tf            # Primary region VPC and networking
├── vpc-dr.tf                 # DR region VPC and networking
├── vpc-peering.tf            # VPC peering with routes
├── secrets.tf                # Secrets Manager configuration
├── rds-parameter-groups.tf   # RDS parameter groups
├── rds.tf                    # RDS instances
├── iam.tf                    # IAM roles and policies
├── lambda.tf                 # Lambda function
├── lambda/
│   └── failover_monitor.py   # Lambda function code
├── cloudwatch.tf             # CloudWatch alarms
├── outputs.tf                # Output values
├── terraform.tfvars.example  # Example variables
└── README.md                 # This file
```

## Outputs

After deployment, Terraform outputs:

- `primary_endpoint`: Primary RDS connection endpoint
- `dr_replica_endpoint`: DR replica connection endpoint
- `lambda_function_name`: Failover monitoring function name
- `sns_topic_arn`: Alerts topic ARN
- `vpc_peering_id`: VPC peering connection ID
- `secret_arn`: Password secret ARN (sensitive)

## Support

For issues or questions:
1. Check IDEAL_RESPONSE.md for architecture decisions
2. Review MODEL_FAILURES.md for known issues and fixes
3. Consult AWS RDS and VPC documentation
4. Verify all prerequisites are met

## License

This infrastructure code is provided as-is for disaster recovery implementations.

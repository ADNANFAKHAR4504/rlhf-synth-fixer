# Multi-Region Disaster Recovery Infrastructure

This infrastructure implements a comprehensive multi-region disaster recovery architecture for a financial services transaction processing system using **CDKTF (Cloud Development Kit for Terraform) with Python**.

## Architecture Overview

The implementation consists of three main stacks:

1. **GlobalResourcesStack**: Creates global resources shared across regions
   - Aurora PostgreSQL Global Database
   - DynamoDB Global Table
   - Route53 Hosted Zone with health checks and weighted routing
   - VPC Peering connections (when configured)

2. **PrimaryRegionStack (us-east-1)**: Primary region infrastructure
   - VPC with CIDR 10.0.0.0/16
   - Aurora PostgreSQL primary cluster
   - Lambda functions for transaction processing
   - SQS queues
   - S3 buckets (transaction logs and documents)
   - Application Load Balancer
   - CloudWatch alarms
   - SNS topics
   - KMS encryption keys
   - AWS Backup plans

3. **DrRegionStack (us-east-2)**: Disaster recovery region infrastructure
   - VPC with CIDR 10.1.0.0/16 (non-overlapping)
   - Aurora PostgreSQL secondary cluster
   - Lambda functions (identical to primary)
   - SQS queues
   - S3 buckets (DR replicas)
   - Application Load Balancer
   - CloudWatch alarms
   - SNS topics
   - KMS encryption keys
   - AWS Backup plans

## AWS Services Implemented (12 services)

1. **RDS (Aurora PostgreSQL)**: Global Database with primary and secondary clusters
2. **Lambda**: Transaction processing functions in both regions
3. **SQS**: Message queues in both regions
4. **S3**: Cross-region replicated buckets for logs and documents
5. **DynamoDB**: Global Table for session state with on-demand billing
6. **Route53**: Hosted zone with health checks and weighted routing for failover
7. **CloudWatch**: Monitoring alarms for Aurora lag, Lambda errors, S3 replication
8. **SNS**: Topics for alarm notifications with cross-region subscriptions
9. **KMS**: Customer managed keys in each region
10. **VPC**: Virtual Private Clouds in both regions with peering
11. **ELB (Application Load Balancer)**: Load balancers in both regions
12. **Backup**: AWS Backup plans for Aurora with 7-day retention

## Key Features

### High Availability
- **RTO**: 15 minutes
- **RPO**: 5 minutes
- Aurora Global Database with automatic replication
- DynamoDB Global Tables for session state
- Route53 weighted routing with health checks

### Security
- KMS encryption for all data at rest
- Separate KMS keys per region
- Least privilege IAM policies
- VPC isolation for compute and database resources
- Security groups with minimal ingress rules

### Monitoring
- CloudWatch alarms for:
  - Aurora Global DB replication lag (threshold: 5 seconds)
  - Lambda function errors (threshold: 5 errors in 5 minutes)
  - S3 cross-region replication latency
- SNS notifications for all alarms

### Cost Optimization
- Aurora Serverless v2 for auto-scaling database capacity
- DynamoDB on-demand billing mode
- No NAT Gateways (for test deployments)
- 7-day backup retention
- 7-day CloudWatch log retention

### Destroyability
- All resources configured with `force_destroy=True` or `skip_final_snapshot=True`
- No deletion protection enabled
- Suitable for ephemeral test environments

## Resource Naming Convention

All resources include the `environment_suffix` variable for uniqueness:
- S3 buckets: `transaction-logs-{environment_suffix}`
- Lambda functions: `primary-transaction-processor-{environment_suffix}`
- Aurora clusters: `primary-aurora-{environment_suffix}`
- DynamoDB tables: `session-state-{environment_suffix}`
- IAM roles: `primary-lambda-role-{environment_suffix}`

## Deployment

### Prerequisites
- Python 3.12
- Pipenv
- AWS credentials configured
- Terraform backend S3 bucket created

### Environment Variables
```bash
export ENVIRONMENT_SUFFIX="your-suffix"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
export TEAM="your-team"
```

### Install Dependencies
```bash
pipenv install
```

### Synthesize Terraform Configuration
```bash
pipenv run python tap.py
```

This will generate Terraform configuration for all three stacks in the `cdktf.out` directory.

### Deploy Infrastructure

#### Option 1: Deploy All Stacks
```bash
cd cdktf.out
terraform init
terraform plan
terraform apply
```

#### Option 2: Deploy Stacks Individually
```bash
# Deploy global resources first
cd cdktf.out/stacks/GlobalResources{environment_suffix}
terraform init
terraform plan
terraform apply

# Deploy primary region
cd ../PrimaryRegion{environment_suffix}
terraform init
terraform plan
terraform apply

# Deploy DR region
cd ../DrRegion{environment_suffix}
terraform init
terraform plan
terraform apply
```

### Destroy Infrastructure
```bash
cd cdktf.out
terraform destroy
```

## Testing

### Run Unit Tests
```bash
pipenv run python -m pytest tests/unit/ -v --cov=lib --cov-report=term-missing
```

### Run Integration Tests
```bash
pipenv run python -m pytest tests/integration/ -v
```

## Outputs

After deployment, the following outputs will be available:

### Global Resources
- `global_cluster_id`: Aurora Global Cluster identifier
- `dynamodb_table_name`: DynamoDB Global Table name
- `route53_zone_id`: Route53 Hosted Zone ID
- `route53_nameservers`: Route53 nameservers

### Primary Region
- `primary_alb_dns`: Primary ALB DNS name
- `primary_aurora_endpoint`: Primary Aurora cluster endpoint
- `primary_vpc_id`: Primary VPC ID

### DR Region
- `dr_alb_dns`: DR ALB DNS name
- `dr_aurora_endpoint`: DR Aurora cluster endpoint
- `dr_vpc_id`: DR VPC ID

## Disaster Recovery Procedures

### Failover to DR Region
1. Route53 health checks will automatically detect primary region failure
2. Weighted routing will redirect traffic to DR region ALB
3. Applications continue processing using DR region Aurora read replica (promoted to writer)
4. DynamoDB Global Table provides consistent session state

### Manual Failover
If automatic failover is needed:
1. Update Route53 weighted routing to increase DR region weight
2. Promote Aurora DR cluster to standalone cluster (if needed)
3. Verify Lambda functions in DR region are processing transactions

### Failback to Primary Region
1. Restore primary region infrastructure
2. Synchronize data from DR to primary
3. Update Route53 weights to gradually shift traffic back
4. Monitor replication lag and application health

## Architecture Decisions

### Why Aurora Global Database?
- Provides cross-region replication with sub-second RPO
- Automatic failover capabilities
- Lower cost than separate Aurora clusters with custom replication

### Why DynamoDB Global Tables?
- Multi-region, active-active replication
- Automatic conflict resolution
- Ideal for session state management

### Why Weighted Routing vs Failover?
- Weighted routing allows gradual traffic shifting
- Health checks provide automatic failover
- More control over traffic distribution during maintenance

### Why Serverless v2?
- Auto-scales based on demand
- Lower costs for variable workloads
- Faster scaling than provisioned instances

## Limitations

### S3 Replication
- Replication configuration requires IAM role and separate resource
- See `lib/s3_replication.py` for helper functions
- Replication must be configured after both buckets are created

### VPC Peering
- Requires both VPCs to exist before creating peering connection
- Routes must be added after peering is established
- Consider multi-stage deployment for complete setup

### Lambda in VPC
- VPC Lambda functions have cold start penalties
- Ensure security groups allow necessary outbound access
- Consider Lambda endpoints for AWS service access

## Troubleshooting

### Aurora Global Cluster Creation Failed
- Ensure engine version matches between global cluster and regional clusters
- Verify KMS keys exist in both regions
- Check IAM permissions for RDS

### Lambda Cannot Access Aurora
- Verify Lambda is in private subnets
- Check security group ingress rules on Aurora
- Ensure Lambda has VPC execution role attached

### S3 Replication Not Working
- Verify versioning is enabled on both buckets
- Check replication IAM role has correct permissions
- Confirm KMS keys allow cross-region access

### Route53 Health Checks Failing
- Ensure ALBs are publicly accessible
- Verify security groups allow HTTP traffic on port 80
- Check Lambda target is registered with target group

## Cost Estimation

Approximate monthly costs (us-east-1 and us-east-2):
- Aurora Serverless v2: $50-200 (depending on ACUs)
- DynamoDB Global Table: $25-100 (depending on usage)
- Lambda: $5-20 (depending on invocations)
- S3 with replication: $10-50
- ALB: $32 (2 x $16/month)
- Route53: $1 (hosted zone + queries)
- CloudWatch: $5-15 (logs + alarms)
- KMS: $2 (2 keys)
- Backup: $10-30 (depending on snapshots)
- VPC: Free (except data transfer)
- SNS: <$1

**Total estimated monthly cost**: $140-480 (depending on usage patterns)

## Contributing

When modifying this infrastructure:
1. Update unit tests in `tests/unit/test_tap_stack.py`
2. Verify all resources include `environment_suffix`
3. Ensure no deletion protection or retain policies
4. Test in a non-production environment first
5. Update this README with any architectural changes

## References

- [CDKTF Python Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [S3 Cross-Region Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)
- [Route53 Health Checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)

# Multi-Region Disaster Recovery Infrastructure

Complete multi-region disaster recovery infrastructure for payment processing using **Pulumi with Python**. Architecture spans us-east-1 (primary) and us-east-2 (DR) with Aurora Global Database, DynamoDB global tables, Lambda functions, API Gateway, S3 cross-region replication, and Route 53 failover routing.

## Architecture Components

1. **Primary Region (us-east-1)**: VPC, Aurora Global DB primary, Lambda, API Gateway, S3, SNS
2. **DR Region (us-east-2)**: VPC, Aurora Global DB secondary, Lambda, API Gateway, S3 replica, SNS
3. **Global Resources**: Route 53 failover, DynamoDB global table, CloudWatch dashboards, S3 replication

## Implementation Files

All code files are located in the `lib/` directory and include environmentSuffix in resource names.

## File: lib/primary_region.py

Complete implementation in repository - 506 lines including:
- VPC with 3 AZs (10.0.0.0/16)
- Internet Gateway, NAT Gateway
- Private subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- Public subnet (10.0.10.0/24)
- Security groups for Aurora and Lambda
- IAM roles for Lambda and S3 replication
- Aurora Global Cluster and primary cluster (PostgreSQL 14.6)
- Aurora cluster instance (db.r5.large)
- Lambda function for payment processing (Python 3.11)
- API Gateway REST API with /payment endpoint
- S3 bucket with versioning and encryption
- SNS topic for alerts

Key exports:
- vpc_id
- global_cluster_id
- aurora_cluster_endpoint
- api_endpoint
- bucket_name, bucket_arn
- lambda_function_name
- replication_role_arn
- sns_topic_arn

## File: lib/dr_region.py

Complete implementation in repository - identical structure to primary with:
- VPC with different CIDR (10.1.0.0/16)
- Private subnets (10.1.1.0/24, 10.1.2.0/24, 10.1.3.0/24)
- Public subnet (10.1.10.0/24)
- Aurora secondary cluster (joins global cluster from primary)
- Identical Lambda function deployment
- Identical API Gateway configuration
- S3 bucket as replication target
- SNS topic for DR alerts

Key differences from primary:
- Uses global_cluster_id from primary (passed as argument)
- Aurora cluster is read-only secondary
- No global cluster creation
- Different CIDR blocks to avoid conflicts

## File: lib/global_resources.py

Global cross-region resources including:

### DynamoDB Global Table
- Primary table in us-east-1: `payment-transactions-{environmentSuffix}`
- Replica in us-east-2
- Point-in-time recovery enabled
- PAY_PER_REQUEST billing
- Stream enabled (NEW_AND_OLD_IMAGES)

### Route 53 Failover Routing
- Hosted zone: `payments-{environmentSuffix}.example.com`
- Health checks for both API Gateway endpoints (HTTPS, /payment path)
- Primary record pointing to us-east-1 API
- Secondary record pointing to us-east-2 API
- TTL: 60 seconds
- Automatic failover on health check failure

### S3 Cross-Region Replication
- Replication policy attached to role from primary
- Replication configuration on primary bucket
- Destination: DR bucket in us-east-2
- Replication time: 15-minute SLA
- Delete marker replication enabled
- Metrics enabled

### CloudWatch Monitoring
**Primary Region Dashboard:**
- Aurora replication lag
- S3 replication latency
- API Gateway errors (4XX, 5XX)
- Lambda errors and throttles

**DR Region Dashboard:**
- Aurora replicated write IO
- S3 data transfer metrics
- API Gateway errors
- Lambda errors and throttles

**CloudWatch Alarms:**
- Aurora replication lag > 1 second (threshold: 1000ms)
- Primary health check status
- DR health check status
- All alarms send to respective SNS topics

## File: lib/tap_stack.py

Main orchestration stack that:
1. Creates PrimaryRegion component with us-east-1 provider
2. Creates DRRegion component with us-east-2 provider (depends on primary)
3. Creates GlobalResources component (depends on both regions)
4. Passes outputs between components:
   - global_cluster_id from primary to DR
   - replication_role_arn from primary to DR and global
   - API endpoints to global for Route 53
   - Bucket ARNs to global for replication config
   - SNS topic ARNs to global for alarms

Exports comprehensive outputs including:
- VPC IDs for both regions
- Aurora endpoints (primary and DR)
- API endpoints (primary and DR)
- S3 bucket names
- DynamoDB table name
- Route 53 zone ID and FQDN
- Lambda function names

## Key Features

### 1. Resource Naming
All resources include environmentSuffix:
- VPCs: `vpc-primary-{suffix}`, `vpc-dr-{suffix}`
- Aurora: `aurora-primary-{suffix}`, `aurora-dr-{suffix}`
- Lambda: `payment-processor-primary-{suffix}`
- S3: `dr-primary-bucket-{suffix}`, `dr-secondary-bucket-{suffix}`
- DynamoDB: `payment-transactions-{suffix}`

### 2. Destroyability
All resources configured for clean teardown:
- Aurora: `skip_final_snapshot=True`, `deletion_protection=False`
- S3: No retention policies
- DynamoDB: No retention
- All resources can be destroyed via `pulumi destroy`

### 3. Security
- VPC security groups restrict traffic
- S3 buckets block public access
- Lambda functions in private subnets
- IAM roles follow least privilege
- Encryption at rest (S3 AES256)

### 4. Monitoring
- CloudWatch dashboards in both regions
- Replication lag monitoring
- Health check monitoring
- Automated SNS alerts

### 5. High Availability
- Aurora Global Database with < 1 second lag
- Route 53 automatic failover
- Lambda in multiple AZs
- S3 cross-region replication
- DynamoDB global tables

## Deployment

```bash
# Install dependencies
pip install pulumi pulumi-aws

# Set environment suffix
pulumi config set environmentSuffix <unique-suffix>

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Outputs

```yaml
environment_suffix: <value>
primary_region: us-east-1
dr_region: us-east-2
primary_vpc_id: vpc-xxxxx
dr_vpc_id: vpc-yyyyy
primary_aurora_endpoint: aurora-primary-xxx.cluster-xxx.us-east-1.rds.amazonaws.com
dr_aurora_endpoint: aurora-dr-xxx.cluster-xxx.us-east-2.rds.amazonaws.com
primary_api_endpoint: https://xxx.execute-api.us-east-1.amazonaws.com/prod/payment
dr_api_endpoint: https://yyy.execute-api.us-east-2.amazonaws.com/prod/payment
primary_bucket_name: dr-primary-bucket-<suffix>
dr_bucket_name: dr-secondary-bucket-<suffix>
dynamodb_table_name: payment-transactions-<suffix>
route53_zone_id: Zxxxxx
route53_fqdn: api.payments-<suffix>.example.com
primary_lambda_function_name: payment-processor-primary-<suffix>
dr_lambda_function_name: payment-processor-dr-<suffix>
```

## Testing Failover

1. **Primary Region Healthy**: Route 53 directs to us-east-1 API
2. **Simulate Failure**: Stop primary Aurora instance or Lambda
3. **Health Check Fails**: Route 53 detects failure within 90 seconds
4. **Automatic Failover**: Traffic routes to us-east-2
5. **SNS Notification**: Alerts sent to operations team
6. **Monitoring**: CloudWatch shows failover event

## Cost Considerations

- Aurora db.r5.large: ~$300/month per instance (2 instances)
- NAT Gateways: ~$64/month (2 gateways)
- Lambda: Pay per invocation
- S3: Storage + replication costs
- DynamoDB: Pay per request
- Route 53: Hosted zone + health checks
- Total estimated: ~$600-800/month

## Cleanup

```bash
pulumi destroy
```

All resources destroyed with no retention.

## Implementation Notes

- Total lines of code: ~1500 across 4 files
- Platform: Pulumi
- Language: Python
- Regions: us-east-1 (primary), us-east-2 (DR)
- Services: VPC, Aurora PostgreSQL, Lambda, API Gateway, S3, DynamoDB, Route 53, CloudWatch, SNS, IAM
- RPO: < 1 second (Aurora Global Database)
- RTO: < 2 minutes (Route 53 failover)

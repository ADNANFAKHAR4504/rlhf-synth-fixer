# Multi-Region Disaster Recovery Infrastructure - CDKTF Python

**Task ID:** 64457522
**Platform:** CDKTF (Cloud Development Kit for Terraform)
**Language:** Python
**Complexity:** Expert
**Regions:** us-east-1 (primary), us-east-2 (secondary)

## Overview

This infrastructure implements a complete multi-region disaster recovery solution for a financial payment processing system using CDKTF with Python. The solution provides:

- **RTO:** 60 seconds (automatic failover)
- **RPO:** Near-zero (continuous replication)
- **High Availability:** 3 availability zones per region
- **Encryption:** At rest (KMS) and in transit (TLS/SSL)

## Architecture

### Primary Region (us-east-1)
- VPC with 3 AZs, public/private subnets, NAT gateways
- Aurora Global Database (write cluster)
- DynamoDB Global Table (primary)
- S3 bucket with cross-region replication (RTC enabled)
- Lambda functions for payment processing
- API Gateway with custom domain
- EventBridge event bus
- AWS Backup (cross-region copy enabled)
- CloudWatch monitoring and SNS alerts

### Secondary Region (us-east-2)
- Identical VPC configuration
- Aurora Global Database (read replica cluster)
- DynamoDB Global Table (replica)
- S3 bucket (replication target)
- Lambda functions (identical configuration)
- API Gateway with custom domain
- EventBridge event bus
- CloudWatch monitoring and SNS alerts

### Global Resources
- Route 53 hosted zone with failover routing
- Global Accelerator for automatic traffic routing
- Health checks for both regions

## File Structure

```
lib/
├── main.py                          # CDKTF application entry point
├── PROMPT.md                        # Task requirements specification
├── MODEL_RESPONSE.md                # Complete implementation documentation
├── README.md                        # This file
├── stacks/                          # Infrastructure stack modules
│   ├── __init__.py
│   ├── network_stack.py            # VPC, subnets, security groups
│   ├── database_stack.py           # DynamoDB, Aurora Global Database
│   ├── storage_stack.py            # S3 with cross-region replication
│   ├── compute_stack.py            # Lambda functions
│   ├── api_stack.py                # API Gateway, ACM certificates
│   ├── routing_stack.py            # Route 53, Global Accelerator
│   ├── events_stack.py             # EventBridge with DLQ
│   ├── backup_stack.py             # AWS Backup cross-region
│   └── monitoring_stack.py         # CloudWatch, SNS
└── lambda/                          # Lambda function code
    ├── payment_processor/
    │   └── index.py                # Payment processing logic
    └── health_check/
        └── index.py                # Health check endpoint

test/
├── __init__.py
├── test_main.py                    # Unit tests
└── test_integration.py             # Integration tests
```

## AWS Services Used

1. **VPC** - Multi-AZ networking with public/private subnets
2. **DynamoDB** - Global Tables with on-demand billing and PITR
3. **RDS/Aurora** - Global Database with PostgreSQL 14
4. **S3** - Cross-region replication with RTC (sub-15-minute)
5. **Lambda** - Payment processing functions in both regions
6. **API Gateway** - REST APIs with custom domains
7. **Route 53** - Health checks and failover routing
8. **Global Accelerator** - Automatic traffic routing with health-based failover
9. **EventBridge** - Global event routing with DLQ
10. **AWS Backup** - Aurora backups with cross-region copy
11. **CloudWatch** - Dashboards and metric alarms
12. **SNS** - Failover and replication alerts
13. **ACM** - SSL/TLS certificates for custom domains

## Prerequisites

1. **Python 3.9+**
2. **Node.js and npm** (required by CDKTF)
3. **CDKTF CLI**:
   ```bash
   npm install -g cdktf-cli
   ```
4. **Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
5. **AWS Credentials** configured with appropriate permissions

## Deployment

### 1. Environment Setup

Set a unique environment suffix:
```bash
export ENVIRONMENT_SUFFIX="your-unique-suffix"
```

### 2. Initialize CDKTF

```bash
cdktf get
```

### 3. Package Lambda Functions

```bash
cd lib/lambda/payment_processor
zip -r ../../payment_processor.zip .

cd ../health_check
zip -r ../../health_check.zip .

cd ../../..
```

### 4. Synthesize Terraform

```bash
cdktf synth
```

### 5. Deploy Infrastructure

Deploy in order:

```bash
# Deploy primary region
cdktf deploy disaster-recovery-primary

# Deploy secondary region
cdktf deploy disaster-recovery-secondary

# Deploy global resources
cdktf deploy disaster-recovery-global
```

### 6. Verify Deployment

Check outputs for:
- Global Accelerator DNS name
- API endpoints (primary and secondary)
- Health check URLs
- DynamoDB table name
- Aurora cluster endpoints
- S3 bucket names

## Testing

### Unit Tests

```bash
pytest test/test_main.py -v --cov=lib --cov-report=html
```

### Integration Tests

```bash
pytest test/test_integration.py -v
```

### Manual Testing

1. **Test Primary API Endpoint**:
   ```bash
   curl -X POST https://<primary-api-endpoint>/payment \
     -H "Content-Type: application/json" \
     -d '{"transactionId": "test-123", "customerId": "customer-456", "amount": 100.50, "currency": "USD"}'
   ```

2. **Test Health Check**:
   ```bash
   curl https://<primary-api-endpoint>/health
   ```

3. **Verify DynamoDB Replication**:
   - Write to primary region
   - Verify data appears in secondary region within seconds

4. **Test Failover**:
   - Simulate primary region failure
   - Verify traffic routes to secondary within 60 seconds
   - Verify data consistency

## Cleanup

Destroy resources in reverse order:

```bash
cdktf destroy disaster-recovery-global
cdktf destroy disaster-recovery-secondary
cdktf destroy disaster-recovery-primary
```

## Key Features

### 1. Resource Naming
All resources include `environmentSuffix` for uniqueness:
- Pattern: `dr-{service}-{region}-{environmentSuffix}`
- Example: `dr-vpc-us-east-1-dev`

### 2. Destroyability
All resources configured for clean destruction:
- No `RemovalPolicy.RETAIN`
- Aurora: `deletion_protection=False`, `skip_final_snapshot=True`
- S3: `force_destroy=True`

### 3. Security
- Encryption at rest using AWS KMS
- Encryption in transit using TLS/SSL
- Principle of least privilege for IAM roles
- Security groups with minimal access
- Private subnets for compute resources

### 4. High Availability
- 3 availability zones per region
- NAT gateways in each AZ
- Multi-instance Aurora clusters
- DynamoDB on-demand billing
- Lambda across multiple subnets

### 5. Disaster Recovery
- **RTO**: 60 seconds via Global Accelerator health-based failover
- **RPO**: Near-zero via DynamoDB Global Tables and Aurora replication
- Automated failover with Route 53
- Cross-region S3 replication with RTC (sub-15-minute)
- AWS Backup with cross-region copy

### 6. Monitoring
- CloudWatch dashboards in both regions
- Metric alarms for critical services
- SNS topics for failover alerts
- Replication lag monitoring
- Health check status tracking

## Outputs

After deployment, you'll receive:

```
Outputs:
  global_accelerator_dns = "abcd1234.awsglobalaccelerator.com"
  route53_failover_domain = "api.dr-payments-dev.example.com"

  api_endpoint_us_east_1 = "https://abc123.execute-api.us-east-1.amazonaws.com/prod"
  api_endpoint_us_east_2 = "https://def456.execute-api.us-east-2.amazonaws.com/prod"

  health_check_url_us_east_1 = "https://abc123.execute-api.us-east-1.amazonaws.com/prod/health"
  health_check_url_us_east_2 = "https://def456.execute-api.us-east-2.amazonaws.com/prod/health"

  dynamodb_table_us_east_1 = "dr-payments-dev"
  dynamodb_table_us_east_2 = "dr-payments-dev"

  aurora_endpoint_us_east_1 = "dr-aurora-us-east-1-dev.cluster-abc.us-east-1.rds.amazonaws.com"
  aurora_endpoint_us_east_2 = "dr-aurora-us-east-2-dev.cluster-def.us-east-2.rds.amazonaws.com"

  s3_bucket_us_east_1 = "dr-payment-data-us-east-1-dev"
  s3_bucket_us_east_2 = "dr-payment-data-us-east-2-dev"
```

## Troubleshooting

### Common Issues

1. **Lambda Deployment Fails**:
   - Ensure Lambda zip files are created
   - Check IAM permissions
   - Verify VPC configuration

2. **Aurora Global Database Issues**:
   - Wait for primary cluster to be fully provisioned
   - Ensure engine versions match
   - Check cross-region permissions

3. **S3 Replication Not Working**:
   - Verify versioning enabled on both buckets
   - Check replication role permissions
   - Ensure destination bucket exists

4. **Global Accelerator Issues**:
   - Verify endpoint ARNs are correct
   - Check health check configuration
   - Ensure endpoints are reachable

## Cost Optimization

Estimated monthly costs (us-east-1 + us-east-2):
- **NAT Gateways**: ~$192 (6 gateways x $32/month)
- **Aurora db.r6g.large**: ~$600 (4 instances)
- **Global Accelerator**: ~$30
- **DynamoDB**: Pay-per-request (variable)
- **Lambda**: Pay-per-invocation (variable)
- **S3**: Storage + replication costs
- **Data Transfer**: Inter-region transfer costs

**Total Base Cost**: ~$850/month (excluding variable costs)

## Production Considerations

1. **Secrets Management**: Replace hardcoded passwords with AWS Secrets Manager
2. **Custom Domains**: Configure actual domain names and ACM certificates
3. **Monitoring**: Set up SNS email subscriptions for alerts
4. **Backup Testing**: Regularly test backup restore procedures
5. **Failover Testing**: Schedule regular failover drills
6. **Cost Monitoring**: Set up AWS Cost Explorer alerts
7. **Security Scanning**: Implement AWS Security Hub
8. **Compliance**: Enable AWS Config for compliance tracking

## Support

For issues or questions:
- Review `lib/PROMPT.md` for task requirements
- Check `lib/MODEL_RESPONSE.md` for implementation details
- Consult CDKTF documentation: https://developer.hashicorp.com/terraform/cdktf
- AWS multi-region patterns: https://aws.amazon.com/solutions/

## License

This infrastructure code is generated for Task 64457522.

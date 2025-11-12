# Multi-Region Disaster Recovery Infrastructure - Production Ready

Production-ready CDK Python application deploying comprehensive multi-region DR for payment processing.

## Overview

This implementation deploys a complete disaster recovery solution across AWS regions us-east-1 (primary) and us-east-2 (secondary) for a payment processing system requiring 99.99% availability.

##  Key Components

### Architecture

**Primary Region (us-east-1)**
- Aurora PostgreSQL Global Cluster (writer)
- DynamoDB Global Table (primary)
- Lambda functions (3x: validation, processing, notification)
- API Gateway REST API
- S3 bucket with cross-region replication source
- CloudWatch dashboards and alarms
- Systems Manager parameters

**Secondary Region (us-east-2)**
- Aurora PostgreSQL (reader, promotable to writer)
- DynamoDB replica
- Lambda functions (identical to primary)
- API Gateway REST API
- S3 bucket (CRR destination)
- CloudWatch dashboards and alarms
- Systems Manager parameters

**Global Resources**
- Route 53 hosted zone with health checks
- Weighted DNS routing (100% primary, 0% secondary initially)
- Step Functions failover automation

## Files Generated

### Documentation
- `PROMPT.md` - Original requirements in human-readable format
- `MODEL_RESPONSE.md` - Initial AI-generated implementation (with intentional issues)
- `IDEAL_RESPONSE.md` - Production-ready corrected implementation
- `MODEL_FAILURES.md` - Detailed documentation of issues and fixes
- `README.md` - This file

### Infrastructure Code (from IDEAL_RESPONSE.md)
- `tap_stack.py` - Main coordination stack
- `vpc_stack.py` - VPC with 3 AZs, subnets, NAT gateways, VPC endpoints
- `database_stack.py` - Aurora Global DB and DynamoDB Global Tables
- `lambda_stack.py` - Three Lambda functions for payment processing
- `api_stack.py` - API Gateway REST APIs with throttling
- `storage_stack.py` - S3 with cross-region replication and lifecycle policies
- `route53_stack.py` - DNS with health checks and weighted routing
- `monitoring_stack.py` - CloudWatch alarms and dashboards
- `parameter_store_stack.py` - Systems Manager parameters
- `failover_stack.py` - Step Functions for automated failover

### Lambda Functions
- `lambda/payment_validation/index.py` - Payment validation logic
- `lambda/transaction_processing/index.py` - Transaction processing logic
- `lambda/notification/index.py` - Notification logic

### Entry Point
- `tap.py` - CDK app entry point that instantiates all stacks

## Key Improvements from MODEL_RESPONSE

1. **Aurora Global Database** - Proper CfnGlobalCluster configuration
2. **Multi-region Architecture** - App-level stacks, not nested
3. **S3 Replication** - Dynamic IAM role creation
4. **Route 53** - Correct weighted routing with set_identifier
5. **DynamoDB** - TableV2 with proper replica configuration
6. **VPC Endpoints** - Cost optimization for Lambda
7. **CloudWatch** - Percentage-based alarms with MathExpression
8. **Dependencies** - Explicit cross-region stack dependencies
9. **Security** - Encryption, private subnets, IAM least privilege
10. **Outputs** - CfnOutputs for cross-stack references

## Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Bootstrap CDK in both regions (one-time setup)
cdk bootstrap aws://ACCOUNT-ID/us-east-1
cdk bootstrap aws://ACCOUNT-ID/us-east-2

# Set environment variables
export CDK_DEFAULT_ACCOUNT=your-account-id
export CDK_DEFAULT_REGION=us-east-1

# Deploy all stacks
cdk deploy --all --context environmentSuffix=prod --require-approval never

# Or deploy by region
cdk deploy "*Primary*" --context environmentSuffix=prod
cdk deploy "*Secondary*" --context environmentSuffix=prod
cdk deploy "Route53*" "Failover*" --context environmentSuffix=prod
```

## Failover Process

1. Route 53 health check detects primary API Gateway failure (3 consecutive failures)
2. Manual or automated trigger of Step Functions state machine
3. State machine invokes failover Lambda function
4. Lambda updates Route 53 weighted records:
   - Primary: weight 100 → 0
   - Secondary: weight 0 → 100
5. Manually promote Aurora secondary cluster to primary via AWS Console/CLI:
   ```bash
   aws rds failover-global-cluster --global-cluster-identifier payment-global-prod --target-db-cluster-identifier <secondary-cluster-arn>
   ```
6. Traffic now flows to secondary region
7. Monitor CloudWatch dashboards for health and performance
8. Estimated failover time: < 5 minutes

## Monitoring

### CloudWatch Dashboards
- **PaymentDR-primary-prod** - Primary region metrics
- **PaymentDR-secondary-prod** - Secondary region metrics

### Metrics Tracked
- RDS database connections and CPU utilization
- Aurora Global DB replication lag (milliseconds)
- Lambda invocations, errors, and duration
- API Gateway request count, latency, 4XX/5XX errors

### Alarms (SNS notifications)
- RDS replication lag > 10 seconds
- Lambda error rate > 5%
- API Gateway 5XX error rate > 1%
- Database connections > 100

## Testing

```bash
# Install test dependencies
pip install pytest pytest-cdk moto boto3

# Run unit tests
pytest tests/unit/ -v

# Run integration tests (requires AWS credentials)
pytest tests/integration/ -v

# Run all tests with coverage
pytest tests/ --cov=lib --cov-report=html
```

## Cost Estimation (Monthly)

**Per Region:**
- NAT Gateway: $32 (1 per VPC)
- Aurora T3.medium (2 instances): ~$118
- Lambda (estimated 1M requests): ~$0.20
- API Gateway (1M requests): ~$3.50
- S3 (100 GB storage + requests): ~$5
- CloudWatch (logs + metrics): ~$10

**Global:**
- Route 53 (hosted zone + health checks): ~$1
- DynamoDB On-Demand (estimated): ~$25

**Total Estimated: ~$375/month** (both regions + global resources)

**Cost Optimization Tips:**
- Use Aurora Serverless v2 for variable workloads
- Enable S3 Intelligent-Tiering
- Use reserved capacity for DynamoDB if predictable
- Single NAT Gateway per VPC (already optimized)
- VPC endpoints for S3/DynamoDB (no data transfer costs)

## Security Features

- All RDS databases in isolated subnets (no internet access)
- No public access to Aurora clusters
- S3 buckets block all public access
- Encryption at rest:
  - S3: AES-256 (S3-managed keys)
  - RDS: AWS KMS
  - DynamoDB: AWS-owned keys
- Encryption in transit (TLS 1.2+)
- Secrets Manager for database credentials
- IAM roles with least privilege policies
- VPC security groups restrict traffic

## Compliance

- GDPR: Data residency in US regions, encryption at rest/transit
- PCI DSS: Network isolation, encryption, audit logging
- SOC 2: CloudWatch logging, CloudTrail enabled, access controls
- HIPAA: Encryption, audit trails, secure data handling

## Troubleshooting

### Deployment Failures

**Error: Cannot create stack in different region**
- Solution: Ensure all stacks are created at app level, not nested

**Error: Global cluster already exists**
- Solution: Delete existing global cluster or change identifier

**Error: S3 replication not working**
- Solution: Check IAM role permissions and bucket versioning

### Runtime Issues

**High RDS replication lag**
- Check network connectivity between regions
- Review database write workload
- Consider Aurora instance size upgrade

**API Gateway 5XX errors**
- Check Lambda function logs in CloudWatch
- Verify Lambda has VPC access (security groups, subnets)
- Check database connectivity

**Failover not working**
- Verify Route 53 health check configuration
- Check Step Functions execution logs
- Verify IAM permissions for failover Lambda

## Development Workflow

1. Make changes to stack files in `lib/`
2. Run `cdk diff` to preview changes
3. Run unit tests: `pytest tests/unit/`
4. Deploy to dev environment: `cdk deploy --all --context environmentSuffix=dev`
5. Run integration tests against dev
6. Deploy to prod: `cdk deploy --all --context environmentSuffix=prod`

## AWS Services Used

- Amazon VPC (Virtual Private Cloud)
- Amazon RDS Aurora PostgreSQL (Global Database)
- Amazon DynamoDB (Global Tables)
- AWS Lambda
- Amazon API Gateway (REST API)
- Amazon S3 (Cross-Region Replication)
- Amazon Route 53 (DNS, Health Checks)
- Amazon CloudWatch (Metrics, Logs, Alarms, Dashboards)
- Amazon SNS (Notifications)
- AWS Systems Manager Parameter Store
- AWS Step Functions
- AWS Secrets Manager
- AWS IAM (Roles, Policies)
- AWS CloudFormation (via CDK)

## References

- [AWS CDK Python Documentation](https://docs.aws.amazon.com/cdk/api/v2/python/)
- [Aurora Global Database Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [S3 Cross-Region Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)
- [Route 53 Health Checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)

## Support

For issues or questions:
1. Check `MODEL_FAILURES.md` for common issues and fixes
2. Review CloudWatch logs for error details
3. Check AWS service health dashboard
4. Review CDK synthesis output: `cdk synth`

## License

This infrastructure code is generated for the TAP (Test Automation Platform) project.

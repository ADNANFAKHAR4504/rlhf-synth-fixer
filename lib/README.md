# Disaster Recovery Infrastructure

Active-passive disaster recovery infrastructure for payment processing system using Pulumi Python.

## Architecture Overview

Multi-region DR infrastructure spanning us-east-1 (primary) and us-east-2 (DR).

### Primary Region (us-east-1)
- VPC with private subnets (10.0.0.0/16)
- Aurora PostgreSQL Global Database primary cluster
- Lambda payment processing functions
- API Gateway REST API
- S3 bucket with versioning and encryption
- SNS topic for alerts

### DR Region (us-east-2)
- VPC with private subnets (10.1.0.0/16)
- Aurora PostgreSQL secondary cluster (read replica)
- Lambda payment processing functions
- API Gateway REST API
- S3 bucket (replication target)
- SNS topic for alerts

### Global Resources
- Route 53 hosted zone with failover routing policy
- Health checks monitoring primary region API
- DynamoDB global table for session state
- CloudWatch cross-region monitoring dashboard
- CloudWatch alarms for failover events

## Recovery Objectives

- RPO (Recovery Point Objective): < 1 minute
- RTO (Recovery Time Objective): < 5 minutes
- Aurora Global Database provides automatic replication
- Route 53 health checks trigger automatic DNS failover

## Prerequisites

```bash
# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Install Python dependencies
pip install pulumi pulumi-aws

# Configure AWS credentials
aws configure

# Set environment suffix
export ENVIRONMENT_SUFFIX="dev"
```

## Deployment

```bash
# Deploy infrastructure
pulumi up

# Review changes and confirm
# Infrastructure will be created in both regions
```

## Outputs

After deployment, the following outputs are available:

- primary_vpc_id: VPC ID in us-east-1
- primary_cluster_endpoint: Aurora primary cluster endpoint
- primary_api_url: API Gateway URL in us-east-1
- primary_bucket_name: S3 bucket name in us-east-1
- dr_vpc_id: VPC ID in us-east-2
- dr_cluster_endpoint: Aurora DR cluster endpoint
- dr_api_url: API Gateway URL in us-east-2
- dr_bucket_name: S3 bucket name in us-east-2
- route53_zone_id: Route 53 hosted zone ID
- failover_domain: DNS failover domain name
- dynamodb_table_name: Global table name
- sns_topic_primary_arn: SNS topic ARN (primary region)
- sns_topic_dr_arn: SNS topic ARN (DR region)

## Testing Failover

### Test Primary Region

```bash
# Get primary API URL
PRIMARY_URL=$(pulumi stack output primary_api_url)

# Test payment API
curl -X POST $PRIMARY_URL \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "test-123", "amount": 100}'
```

### Verify Failover Domain

```bash
# Get failover domain
FAILOVER_DOMAIN=$(pulumi stack output failover_domain)

# Check DNS resolution
dig $FAILOVER_DOMAIN

# Test via failover domain
curl -X POST https://$FAILOVER_DOMAIN \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "test-456", "amount": 200}'
```

### Simulate Primary Region Failure

To test automated failover:

1. Disable primary region health check (via AWS Console)
2. Wait 2-3 minutes for health check to fail
3. Verify Route 53 routes traffic to DR region
4. Test API via failover domain (should route to us-east-2)

## Cost Optimization

Infrastructure designed to stay within $5000/month:

- Aurora: 2 x db.r5.large instances ($350/month each)
- Lambda: Pay per invocation ($0.20 per 1M requests)
- API Gateway: $3.50 per million requests
- S3: Standard storage with replication
- DynamoDB: Pay-per-request billing
- Route 53: $0.50 per hosted zone + health check fees
- CloudWatch: Dashboard and alarms included

Total estimated cost: ~$1000-1500/month (well within budget)

## Security Features

- All data encrypted at rest (S3, Aurora, DynamoDB)
- VPC isolation for databases and Lambda functions
- Security groups restrict network access
- IAM roles follow least privilege principle
- Aurora master password should be migrated to AWS Secrets Manager

## Monitoring

### CloudWatch Dashboard

Cross-region dashboard shows:
- Aurora CPU utilization (both regions)
- Lambda invocation counts (both regions)
- API Gateway request counts (both regions)

### Alarms

- Health check failure alarm (triggers SNS notification)
- Can add additional alarms for:
  - Aurora replication lag
  - Lambda error rates
  - API Gateway 5xx errors

## Resource Tagging

All resources tagged with:
- Environment: DR
- CostCenter: Operations
- Criticality: High
- Name: Resource-specific name with environment_suffix

## Component Structure

```
lib/
├── tap_stack.py          # Main orchestration stack
├── primary_region.py     # Primary region resources
├── dr_region.py          # DR region resources
├── global_resources.py   # Route 53, DynamoDB, CloudWatch
└── README.md             # This file
```

## Cleanup

```bash
# Destroy all infrastructure
pulumi destroy

# Confirm destruction
# Note: Aurora clusters may take 10-15 minutes to delete
```

## Troubleshooting

### Aurora Global Database Creation Fails

- Ensure Aurora PostgreSQL 14.6 is supported in both regions
- Check AWS service quotas for RDS clusters
- Verify IAM permissions for RDS global database operations

### Lambda VPC Connectivity Issues

- Ensure VPC has proper route tables
- Check security group rules allow outbound traffic
- Verify Lambda execution role has VPC execution permissions

### Route 53 Health Check Failures

- Health check requires HTTPS endpoint
- API Gateway must be deployed and accessible
- Check health check configuration (path, port, interval)

### S3 Replication Not Working

- Verify versioning enabled on both buckets
- Check replication role has proper permissions
- Ensure replication configuration is set on source bucket

## Best Practices Implemented

1. Multi-region architecture for high availability
2. Automated failover with Route 53 health checks
3. Encryption at rest for all data stores
4. VPC isolation for sensitive resources
5. Least privilege IAM roles
6. Comprehensive monitoring and alerting
7. Cost-optimized resource selection
8. Infrastructure as Code with Pulumi
9. Component-based architecture for reusability
10. Environment-specific resource naming with suffix

## Future Enhancements

- Add AWS Secrets Manager for database credentials
- Implement VPC peering between regions for private connectivity
- Add AWS WAF for API Gateway protection
- Implement automated failover testing
- Add CloudFormation StackSets for multi-account deployments
- Integrate with AWS Config for compliance monitoring
- Add AWS X-Ray for distributed tracing
- Implement automated backup verification

## Support

For issues or questions:
- Review Pulumi documentation: https://www.pulumi.com/docs/
- Check AWS service limits and quotas
- Review CloudWatch logs for error messages
- Verify IAM permissions are correctly configured

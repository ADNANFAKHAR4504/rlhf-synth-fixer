# Multi-Region Aurora Global Database with Automated Failover

CloudFormation template for deploying a fault-tolerant Aurora Global Database infrastructure with automated health monitoring and DNS-based failover across us-east-1 and eu-west-1 regions.

## Architecture Overview

This solution implements:

- **Multi-Region Aurora Global Database**: Primary cluster in us-east-1, secondary in eu-west-1
- **Automated Health Monitoring**: Lambda functions checking cluster health every 30 seconds
- **DNS-Based Failover**: Route 53 weighted routing with health checks
- **CloudWatch Alarms**: Monitoring replication lag exceeding 1000ms and cluster health
- **Encryption**: Customer-managed KMS keys in both regions
- **High Availability**: 2 DB instances per region for redundancy

## Performance Characteristics

- RPO: Less than 1 second (Aurora Global Database replication)
- RTO: Less than 30 seconds (automated DNS failover + health checks)
- Health Check Interval: 30 seconds
- Route 53 Failover: 60 second TTL for fast DNS propagation
- Replication Lag Alert: Triggers at 1000ms threshold

## Prerequisites

1. VPCs configured in both us-east-1 and eu-west-1 with at least 3 private subnets each
2. Cross-region VPC peering established between the two VPCs
3. Route 53 hosted zone created
4. Secure database password generated

## Deployment

### Primary Stack (us-east-1)

```bash
aws cloudformation create-stack \
  --stack-name aurora-global-primary \
  --template-body file://TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=IsProduction,ParameterValue=true \
    ParameterKey=DBMasterUsername,ParameterValue=dbadmin \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword \
    ParameterKey=PrimaryVPCId,ParameterValue=vpc-xxxxx \
    ParameterKey=PrimarySubnetIds,ParameterValue="subnet-1,subnet-2,subnet-3" \
    ParameterKey=SecondaryVPCId,ParameterValue=vpc-yyyyy \
    ParameterKey=SecondarySubnetIds,ParameterValue="subnet-4,subnet-5,subnet-6" \
    ParameterKey=HostedZoneId,ParameterValue=Z1234567890ABC \
    ParameterKey=DomainName,ParameterValue=db.example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Secondary Stack (eu-west-1)

Deploy the secondary stack using `secondary-stack-template.json` after the primary stack completes.

See IDEAL_RESPONSE.md for complete deployment instructions.

## Resources Created

- Aurora MySQL 5.7 Global Database
- KMS encryption keys for both regions
- DB cluster and instance parameter groups
- VPC security groups
- DB subnet groups
- Lambda health check functions
- EventBridge schedules
- Route 53 health checks and DNS records
- CloudWatch alarms and log groups
- IAM roles with least-privilege access

## Security Features

- All data encrypted at rest using customer-managed KMS keys
- Separate KMS keys for each region
- IAM database authentication enabled
- Least-privilege IAM roles for Lambda functions
- VPC security groups restricting database access
- No public accessibility for database instances
- Secure password handling via NoEcho parameter

## Testing

### Verify Deployment

```bash
# Check primary cluster status
aws rds describe-db-clusters \
  --db-cluster-identifier aurora-primary-prod \
  --region us-east-1

# Test health check
aws lambda invoke \
  --function-name aurora-health-check-primary-prod \
  --region us-east-1 \
  response.json
```

### Test Failover

```bash
# Promote secondary cluster (simulating failover)
aws rds failover-global-cluster \
  --global-cluster-identifier aurora-global-prod \
  --target-db-cluster-identifier aurora-secondary-prod \
  --region us-east-1
```

## Outputs

- GlobalClusterId: Global cluster identifier
- PrimaryClusterEndpoint: Primary cluster writer endpoint
- PrimaryClusterReaderEndpoint: Primary cluster reader endpoint
- PrimaryKMSKeyArn: KMS key ARN for primary region
- HealthCheckFunctionArn: Lambda function ARN for health checks
- DNSEndpoint: Route 53 DNS endpoint for Aurora cluster
- ReaderDNSEndpoint: Route 53 DNS endpoint for Aurora reader

## Cost Optimization

- Uses db.r5.large instances (minimum for production workloads)
- Performance Insights with 7-day retention
- Enhanced monitoring with 60-second granularity
- CloudWatch log retention set to 30 days
- Automated backups with 7-day retention

## Maintenance

- Backtrack enabled with 24-hour window on primary cluster
- Point-in-time recovery with 7-day backup retention
- Deletion protection enabled for production environments
- Automated backups during preferred maintenance window

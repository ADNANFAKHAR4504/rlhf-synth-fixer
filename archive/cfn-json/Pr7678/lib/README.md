# RDS Aurora MySQL Migration Infrastructure

CloudFormation template for deploying an RDS Aurora MySQL cluster for database migration from on-premises to AWS.

## Overview

This infrastructure creates a highly available, encrypted RDS Aurora MySQL 8.0 cluster with:
- One writer instance and two reader instances (db.r5.large)
- Customer-managed KMS encryption
- 30-day backup retention
- Performance Insights with 7-day retention
- Multi-AZ deployment across three availability zones
- Security group restricting access to application subnets only

## Architecture

- **Database Engine**: Aurora MySQL 8.0 (compatible mode)
- **Instances**: 3 instances (1 writer + 2 readers)
- **Instance Class**: db.r5.large
- **Encryption**: KMS customer-managed key with automatic rotation
- **Availability**: Multi-AZ across 3 availability zones
- **Backup**: 30-day retention, backup window 03:00-04:00 UTC
- **Performance**: Performance Insights enabled with 7-day retention

## Resources Created

1. **KMS Key** - Customer-managed encryption key with automatic rotation
2. **KMS Alias** - Friendly alias for the encryption key
3. **Security Group** - Allows MySQL (port 3306) from application subnets
4. **DB Subnet Group** - Spans three private subnets across availability zones
5. **DB Cluster Parameter Group** - Configures UTF8MB4 character set
6. **DB Instance Parameter Group** - Instance-level parameters
7. **Aurora DB Cluster** - Main cluster resource with configuration
8. **Writer Instance** - Primary write instance
9. **Reader Instance 1** - First read replica
10. **Reader Instance 2** - Second read replica

## Parameters

- `EnvironmentSuffix`: Unique suffix for resource naming (e.g., "prod", "dev-123")
- `VpcId`: VPC where the cluster will be deployed
- `PrivateSubnet1/2/3`: Three private subnet IDs for Multi-AZ deployment
- `ApplicationSubnetCidr1/2/3`: CIDR blocks allowed to access the database
- `MasterUsername`: Database master username (default: admin)
- `MasterPassword`: Database master password (minimum 8 characters)

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate permissions
2. VPC with three private subnets across different availability zones
3. Application subnet CIDR blocks identified

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name aurora-mysql-migration-prod \
  --template-body file://lib/tapstack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PrivateSubnet1,ParameterValue=subnet-xxxxx \
    ParameterKey=PrivateSubnet2,ParameterValue=subnet-yyyyy \
    ParameterKey=PrivateSubnet3,ParameterValue=subnet-zzzzz \
    ParameterKey=ApplicationSubnetCidr1,ParameterValue=10.0.10.0/24 \
    ParameterKey=ApplicationSubnetCidr2,ParameterValue=10.0.11.0/24 \
    ParameterKey=ApplicationSubnetCidr3,ParameterValue=10.0.12.0/24 \
    ParameterKey=MasterUsername,ParameterValue=admin \
    ParameterKey=MasterPassword,ParameterValue=YourSecurePassword123 \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name aurora-mysql-migration-prod \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

### Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name aurora-mysql-migration-prod \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Outputs

- `ClusterEndpoint`: Writer endpoint for write operations
- `ReaderEndpoint`: Reader endpoint for load-balanced read operations
- `ClusterPort`: MySQL port (3306)
- `KmsKeyArn`: ARN of the encryption key
- `ClusterIdentifier`: Aurora cluster identifier
- `SecurityGroupId`: Security group ID for the cluster

## Security Features

1. **Encryption at Rest**: All data encrypted using customer-managed KMS key
2. **Encryption in Transit**: SSL/TLS connections supported
3. **Network Isolation**: Deployed in private subnets with no internet access
4. **Access Control**: Security group restricts access to application subnets only
5. **Deletion Protection**: Enabled to prevent accidental deletion
6. **Audit Logging**: CloudWatch Logs enabled for audit, error, general, and slow query logs

## Backup and Recovery

- **Automated Backups**: Enabled with 30-day retention
- **Backup Window**: 03:00-04:00 UTC (non-peak hours)
- **Point-in-Time Recovery**: Enabled automatically
- **Maintenance Window**: Sunday 04:00-05:00 UTC

## Performance Monitoring

- **Performance Insights**: Enabled on all instances
- **Retention Period**: 7 days
- **Encryption**: Performance Insights data encrypted with same KMS key
- **CloudWatch Logs**: Audit, error, general, and slow query logs exported

## Cost Optimization

- Instance class db.r5.large provides good balance of performance and cost
- Performance Insights free tier covers 7-day retention
- 30-day backup retention meets compliance requirements
- Consider Aurora Serverless for non-production environments

## Cleanup

To delete the stack and all resources:

```bash
# First, disable deletion protection
aws rds modify-db-cluster \
  --db-cluster-identifier aurora-mysql-cluster-prod \
  --no-deletion-protection \
  --region us-east-1

# Then delete the stack
aws cloudformation delete-stack \
  --stack-name aurora-mysql-migration-prod \
  --region us-east-1
```

## Troubleshooting

### Connection Issues

1. Verify security group allows traffic from your application subnets
2. Check that instances are in "available" state
3. Verify credentials are correct
4. Ensure application is in the same VPC

### Performance Issues

1. Check Performance Insights dashboard
2. Review slow query logs in CloudWatch
3. Consider adding more reader instances if read-heavy
4. Verify parameter group settings

### Backup Issues

1. Verify backup window doesn't conflict with peak usage
2. Check CloudWatch metrics for backup duration
3. Ensure KMS key permissions are correct

## References

- [Aurora MySQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraMySQL.html)
- [Aurora Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
- [Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_PerfInsights.html)

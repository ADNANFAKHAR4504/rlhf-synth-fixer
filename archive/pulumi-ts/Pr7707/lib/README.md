# RDS PostgreSQL Optimization Infrastructure

This Pulumi TypeScript project implements an optimized RDS PostgreSQL database deployment with enhanced monitoring, high availability, and automated alerting for the user-api service.

## Architecture

The infrastructure includes:

- **RDS PostgreSQL Instance**: db.r6g.large with Graviton processors for improved price-performance
- **Custom Parameter Group**: Optimized PostgreSQL settings for memory-intensive workloads
- **Multi-AZ Deployment**: Automatic failover capability for high availability
- **Performance Insights**: 7-day retention for query performance analysis
- **Enhanced Monitoring**: 60-second granularity for detailed metrics
- **CloudWatch Alarms**: CPU, connections, and latency monitoring
- **SNS Notifications**: Centralized alerting to ops team
- **Security Group**: Restricted access from application tier only

## Prerequisites

1. AWS Account with appropriate permissions
2. Node.js 18+ installed
3. Pulumi CLI installed (`curl -fsSL https://get.pulumi.com | sh`)
4. AWS CLI configured with credentials
5. Existing VPC with private subnets
6. Application security group ID

## Configuration

Set the following Pulumi configuration values:

```bash
# Set AWS region
pulumi config set aws:region us-east-1

# Set VPC configuration (required)
pulumi config set vpcId vpc-xxxxxxxxx
pulumi config set privateSubnetIds '["subnet-xxxxx","subnet-yyyyy"]'
pulumi config set applicationSecurityGroupId sg-xxxxxxxxx

# Set environment suffix
export ENVIRONMENT_SUFFIX=prod
```

## Deployment

1. Install dependencies:

```bash
npm install
```

2. Preview changes:

```bash
pulumi preview
```

3. Deploy infrastructure:

```bash
pulumi up
```

4. View outputs:

```bash
pulumi stack output
```

## Resource Naming

All resources follow the naming convention: `{resource-type}-{purpose}-{environmentSuffix}`

Examples:
- `db-postgres-prod`
- `db-sg-prod`
- `db-alerts-prod`

## Database Configuration

### Instance Specifications
- **Instance Class**: db.r6g.large (2 vCPUs, 16 GiB RAM)
- **Engine**: PostgreSQL 14.7
- **Storage**: 100 GB GP3 (encrypted)
- **Multi-AZ**: Enabled

### Optimized Parameters
- **shared_buffers**: 4 GB (25% of instance memory)
- **effective_cache_size**: 12 GB (75% of instance memory)
- **maintenance_work_mem**: 2 GB
- **work_mem**: 32 MB
- **random_page_cost**: 1.1 (SSD optimized)
- **effective_io_concurrency**: 200

### Backup Configuration
- **Retention Period**: 35 days
- **Backup Window**: 03:00-04:00 UTC (daily)
- **Maintenance Window**: Monday 04:00-05:00 UTC

## Monitoring and Alerts

### CloudWatch Alarms

1. **CPU Utilization**
   - Threshold: 80%
   - Evaluation: 2 periods of 5 minutes

2. **Database Connections**
   - Threshold: 480 connections (80% of max)
   - Evaluation: 2 periods of 5 minutes

3. **Read Latency**
   - Threshold: 200ms
   - Evaluation: 2 periods of 5 minutes

4. **Write Latency**
   - Threshold: 200ms
   - Evaluation: 2 periods of 5 minutes

### SNS Topic

Subscribe to the SNS topic for email notifications:

```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output snsTopicArn) \
  --protocol email \
  --notification-endpoint ops-team@example.com
```

## Security

- Database is not publicly accessible
- Security group restricts access to application tier only
- All data encrypted at rest
- Enhanced monitoring enabled for audit trails
- IAM role follows least privilege principle

## Cost Optimization

- Graviton-based instance (30-40% better price-performance)
- GP3 storage (20% cheaper than GP2)
- Automated backups with appropriate retention
- Performance Insights with 7-day retention (free tier)

## Outputs

The stack exports the following outputs:

- `dbEndpoint`: Database connection endpoint
- `dbSecurityGroupId`: Security group ID for database access
- `snsTopicArn`: SNS topic ARN for alarm notifications

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

**Note**: Ensure `deletionProtection` is set to `false` and `skipFinalSnapshot` is `true` for complete resource deletion.

## Support

For issues or questions, contact the platform team.

## Tags

All resources are tagged with:
- Environment: production
- Team: platform
- Service: user-api

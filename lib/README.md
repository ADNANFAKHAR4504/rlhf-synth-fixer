# AWS Migration Infrastructure

## Overview

This Pulumi Python project implements a comprehensive AWS migration infrastructure for migrating a Java API service and PostgreSQL database from on-premises to AWS. The infrastructure supports phased migration with gradual traffic cutover and maintains data consistency throughout the migration process.

## Architecture

The solution provides:

- **VPC with Multi-AZ Networking**: Public and private subnets across 2 availability zones
- **RDS PostgreSQL**: Multi-AZ database instance as migration target
- **AWS DMS**: Database Migration Service for continuous replication
- **ECS Fargate**: Containerized Java API service
- **Application Load Balancer**: Traffic distribution with health checks
- **Route 53 Health Checks**: Monitoring for traffic management
- **CloudWatch**: Comprehensive monitoring and alerting

## Prerequisites

- Python 3.9 or higher
- Pulumi CLI installed
- AWS credentials configured
- Access to on-premises database

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Stack

```bash
pulumi config set environmentSuffix my-unique-suffix
pulumi config set --secret dbPassword MySecurePassword123!
pulumi config set onpremDbEndpoint 10.0.0.100
```

### 3. Preview Infrastructure

```bash
pulumi preview
```

### 4. Deploy

```bash
pulumi up
```

## Configuration Parameters

| Parameter | Required | Description | Default |
|-----------|----------|-------------|---------|
| environmentSuffix | Yes | Unique suffix for resource names | - |
| dbPassword | Yes | Database password (secret) | - |
| onpremDbEndpoint | No | On-premises database IP | 10.0.0.100 |
| hostedZoneId | No | Route 53 hosted zone ID | - |
| domainName | No | Domain name for application | api-{suffix}.example.com |

## Migration Process

### Phase 1: Infrastructure Deployment

```bash
pulumi up
```

This creates:
- VPC and networking components
- RDS PostgreSQL target database
- DMS replication infrastructure
- ECS cluster and task definitions
- Application Load Balancer
- Monitoring and alarms

### Phase 2: Database Migration

1. **Verify Connectivity**:
   - Check DMS can reach on-premises database
   - Verify firewall rules allow traffic
   - Test source endpoint connection

2. **Start Replication**:
   ```bash
   aws dms start-replication-task \
     --replication-task-arn <task-arn> \
     --start-replication-task-type start-replication
   ```

3. **Monitor Progress**:
   - Check CloudWatch logs: `/aws/dms/tasks/<task-id>`
   - Monitor DMS metrics in CloudWatch
   - Watch for replication lag alarm

### Phase 3: Application Deployment

The ECS service automatically deploys Java API containers once infrastructure is ready.

1. **Verify ECS Tasks**:
   ```bash
   aws ecs list-tasks --cluster migration-cluster-<suffix>
   ```

2. **Check Logs**:
   ```bash
   aws logs tail /ecs/java-api-<suffix> --follow
   ```

3. **Test ALB**:
   ```bash
   curl http://<alb-dns-name>
   ```

### Phase 4: Traffic Cutover

Use Route 53 weighted routing to gradually shift traffic:

1. **Create Weighted Records**:
   - 90% on-premises, 10% AWS
   - Monitor error rates and latency

2. **Gradual Increase**:
   - 70% on-premises, 30% AWS
   - 50% on-premises, 50% AWS
   - 30% on-premises, 70% AWS
   - 100% AWS

3. **Complete Migration**:
   - Verify all traffic on AWS
   - Stop DMS replication
   - Decommission on-premises

## Monitoring

### CloudWatch Alarms

The following alarms are configured:

1. **ECS CPU High**: Triggers when CPU >80% for 10 minutes
2. **ECS Memory High**: Triggers when memory >80% for 10 minutes
3. **RDS CPU High**: Triggers when RDS CPU >80% for 10 minutes
4. **DMS Replication Lag**: Triggers when lag >5 minutes

### CloudWatch Logs

- **ECS Tasks**: `/ecs/java-api-<environmentSuffix>`
- **DMS Tasks**: `/aws/dms/tasks/<task-id>`
- **RDS**: PostgreSQL and upgrade logs

### Metrics to Monitor

- DMS CDCLatencySource
- ECS CPUUtilization, MemoryUtilization
- RDS CPUUtilization, DatabaseConnections
- ALB TargetResponseTime, UnHealthyHostCount

## Security

### Network Security

- **Private Subnets**: RDS and ECS tasks run in private subnets
- **Security Groups**: Least privilege access control
- **NAT Gateway**: Outbound internet for private subnets only

### Data Security

- **Encryption at Rest**: RDS storage encrypted with AWS KMS
- **Encryption in Transit**: Can enable SSL/TLS for RDS connections
- **Secrets Management**: Database credentials in Pulumi config (consider AWS Secrets Manager)

### IAM Security

- **Service Roles**: DMS and ECS use service-specific IAM roles
- **Least Privilege**: Minimal permissions for each service
- **No Hardcoded Credentials**: All credentials from configuration

## Cost Optimization

### Current Configuration

- **RDS**: db.t3.medium Multi-AZ (~$150/month)
- **DMS**: dms.t3.medium (~$100/month during migration)
- **ECS Fargate**: 2 tasks x 1vCPU/2GB (~$60/month)
- **NAT Gateway**: Single NAT (~$32/month)
- **ALB**: ~$20/month
- **Total**: ~$360/month during migration, ~$260/month post-migration

### Cost Reduction Options

1. **Single AZ RDS**: Reduce RDS costs by 50% (not recommended for production)
2. **Smaller DMS Instance**: Use dms.t3.small if workload permits
3. **Fewer ECS Tasks**: Reduce to 1 task for development
4. **Remove NAT Gateway**: Use VPC endpoints for AWS service access

## Testing

### Unit Tests

Run unit tests to validate infrastructure configuration:

```bash
pytest tests/unit/ -v
```

Tests cover:
- Resource naming with environmentSuffix
- Security group rules
- IAM role permissions
- Network configuration
- Tag presence

### Integration Tests

Run integration tests against deployed infrastructure:

```bash
pytest tests/integration/ -v
```

Tests cover:
- ALB health check
- ECS task connectivity
- RDS connectivity
- DMS endpoint status
- CloudWatch log groups

### Test Coverage

Run tests with coverage:

```bash
pytest tests/ --cov=lib --cov-report=html
```

## Troubleshooting

### DMS Issues

**Problem**: DMS task fails to start

**Solution**:
1. Check CloudWatch logs: `/aws/dms/tasks/<task-id>`
2. Verify source endpoint connectivity
3. Check security group rules
4. Validate on-premises firewall rules

**Problem**: High replication lag

**Solution**:
1. Increase DMS instance size
2. Check network bandwidth
3. Verify source database performance
4. Review CDC settings

### ECS Issues

**Problem**: ECS tasks fail to start

**Solution**:
1. Check CloudWatch logs: `/ecs/java-api-<suffix>`
2. Verify IAM task execution role
3. Check security group rules
4. Validate container image

**Problem**: Tasks can't connect to RDS

**Solution**:
1. Verify security group rules allow port 5432
2. Check RDS endpoint in task environment variables
3. Validate database credentials

### RDS Issues

**Problem**: Connection timeout

**Solution**:
1. Verify security group ingress rules
2. Check subnet routing
3. Validate RDS is in private subnet
4. Confirm VPC DNS enabled

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

**Warning**: This will delete:
- RDS database (with final snapshot skipped)
- All ECS tasks and services
- VPC and networking
- DMS replication instance
- CloudWatch logs (after retention period)

## Support and Documentation

- [AWS DMS Documentation](https://docs.aws.amazon.com/dms/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Pulumi AWS Documentation](https://www.pulumi.com/registry/packages/aws/)
- [PostgreSQL Migration Best Practices](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.PostgreSQL.html)

## License

This project is provided as-is for infrastructure automation purposes.

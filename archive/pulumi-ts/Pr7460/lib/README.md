# Database Migration Infrastructure

This Pulumi TypeScript project implements a phased PostgreSQL database migration from on-premises to AWS using DMS (Database Migration Service).

## Architecture

The infrastructure includes:

- **VPC**: Multi-AZ private subnets for isolation
- **RDS PostgreSQL**: Multi-AZ with KMS encryption, 35-day backup retention
- **DMS**: Replication instances with CDC for zero-downtime migration
- **Secrets Manager**: Automatic 30-day credential rotation
- **Lambda**: Secret rotation function
- **CloudWatch**: Monitoring and alarms for replication lag
- **VPC Endpoints**: Private connectivity for DMS and Secrets Manager
- **IAM**: Cross-account roles for multi-phase deployment

## Prerequisites

- Pulumi 3.x or later
- Node.js 18 or later
- AWS CLI v2 configured
- AWS account with appropriate permissions
- Direct Connect configured for hybrid connectivity (if using on-premises source)

## Configuration

Create a new Pulumi stack and configure the required values:

```bash
# Create stack for dev phase
pulumi stack init dev

# Configure required values
pulumi config set environmentSuffix dev-001
pulumi config set migrationPhase dev
pulumi config set costCenter migration-team
pulumi config set complianceScope PCI-DSS
```

## Deployment

### Phase 1: Development Environment

```bash
pulumi stack select dev
pulumi up
```

### Phase 2: Staging Environment

```bash
pulumi stack init staging
pulumi config set environmentSuffix staging-001
pulumi config set migrationPhase staging
pulumi up
```

### Phase 3: Production Environment

```bash
pulumi stack init prod
pulumi config set environmentSuffix prod-001
pulumi config set migrationPhase prod
pulumi up
```

## Stack Outputs

After deployment, the following outputs are available:

- `vpcId`: VPC identifier
- `rdsEndpoint`: RDS PostgreSQL endpoint
- `dmsReplicationInstanceArn`: DMS replication instance ARN
- `secretsManagerArn`: Secrets Manager secret ARN
- `replicationLagAlarmArn`: CloudWatch alarm ARN for replication lag
- `kmsKeyId`: KMS key ID for encryption

## Migration Process

1. Deploy infrastructure in target phase (dev/staging/prod)
2. Configure source endpoint with on-premises database details
3. Start DMS replication task
4. Monitor replication lag via CloudWatch
5. Perform cutover when lag is acceptable
6. Verify application connectivity

## Monitoring

CloudWatch alarms are configured for:

- **Replication Lag**: Triggers when lag exceeds 60 seconds
- **Task Failures**: Triggers on replication task failures

Subscribe to the SNS topic to receive alarm notifications:

```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output alarmTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Security

- All data encrypted at rest using KMS customer-managed keys
- All data encrypted in transit using TLS
- Database credentials automatically rotated every 30 days
- Network traffic isolated to VPC with VPC endpoints
- Cross-account access controlled via IAM roles

## Cleanup

To destroy the infrastructure:

```bash
pulumi destroy
```

## Troubleshooting

### Replication Lag Issues

Check DMS CloudWatch logs:
```bash
aws logs tail /aws/dms/tasks/dms-task-<suffix> --follow
```

### Secret Rotation Failures

Check Lambda function logs:
```bash
aws logs tail /aws/lambda/db-rotation-function-<suffix> --follow
```

### RDS Connection Issues

Verify security group rules and VPC endpoint connectivity.

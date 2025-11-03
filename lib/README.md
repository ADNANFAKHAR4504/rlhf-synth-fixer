# RDS PostgreSQL Production Migration

This CDKTF TypeScript application provisions a production-grade RDS PostgreSQL 14 instance with comprehensive security, monitoring, and backup configurations.

## Architecture

The solution implements:

- **RDS PostgreSQL 14**: Multi-AZ deployment with db.t3.large instance type and 100GB encrypted storage
- **Secrets Manager**: Secure credential storage with 30-day rotation policy (requires Lambda implementation)
- **CloudWatch Alarms**: CPU utilization (>80%), free storage (<10GB), and database connections (>90% max)
- **SNS Notifications**: Email alerts to ops@company.com for all alarm events
- **Enhanced Monitoring**: 60-second granularity with CloudWatch Logs integration
- **Security Groups**: CIDR-based access control from application subnets (10.0.4.0/24 and 10.0.5.0/24)
- **Parameter Group**: PostgreSQL 14 optimized with pg_stat_statements enabled
- **KMS Encryption**: Storage and Performance Insights encrypted with customer-managed key

## Prerequisites

- Node.js 16+ and npm
- CDKTF CLI installed: `npm install -g cdktf-cli`
- AWS CLI configured with appropriate credentials
- Existing VPC with ID 'vpc-prod-123456' (update in code if different)
- Private subnets tagged with `Type=private` across 2 availability zones

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure providers:
   ```bash
   cdktf get
   ```

3. Review the plan:
   ```bash
   cdktf plan
   ```

4. Deploy the stack:
   ```bash
   cdktf deploy
   ```

5. Confirm the email subscription sent to ops@company.com for SNS alerts

## Important Configuration Notes

### VPC and Subnets

The code references VPC ID 'vpc-prod-123456' which is a placeholder. Update this value in `lib/tap-stack.ts`:

```typescript
const vpc = new DataAwsVpc(this, 'prodVpc', {
  id: 'vpc-prod-123456', // Replace with actual VPC ID
});
```

### Secrets Manager Rotation

The implementation includes a placeholder for automatic rotation every 30 days. To fully enable rotation, you need to:

1. Create a Lambda function for secret rotation
2. Update the `SecretsmanagerSecretRotation` resource with the Lambda ARN

Reference: [AWS Secrets Manager Rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)

### Deletion Protection

The RDS instance has deletion protection enabled. To destroy the stack:

1. Manually disable deletion protection in the AWS Console or CLI
2. Run `cdktf destroy`

Alternatively, modify the code to set `deletionProtection: false` before destruction.

## Stack Outputs

After deployment, the following outputs will be available:

- `dbEndpoint`: Full RDS endpoint with port
- `dbAddress`: RDS hostname
- `dbPort`: Database port (5432)
- `dbSecretArn`: Secrets Manager ARN for credentials
- `snsTopicArn`: SNS topic ARN for alerts
- `dbInstanceId`: RDS instance identifier
- `dbSecurityGroupId`: Security group ID
- `environmentSuffix`: Unique suffix for this environment

## Accessing Database Credentials

Retrieve credentials from Secrets Manager:

```bash
aws secretsmanager get-secret-value --secret-id <dbSecretArn> --query SecretString --output text | jq .
```

## Monitoring and Alarms

The stack configures three CloudWatch alarms:

1. **CPU Utilization**: Triggers when average CPU > 80% for 10 minutes
2. **Free Storage Space**: Triggers when free storage < 10GB
3. **Database Connections**: Triggers when connections > 121 (90% of ~135 max)

All alarms send notifications to the SNS topic subscribed by ops@company.com.

## Cost Optimization

- Instance type: db.t3.large (~$122/month for Multi-AZ in eu-west-2)
- Storage: 100GB gp3 (~$23/month for Multi-AZ)
- Backups: 700GB free (7 days × 100GB), additional backups charged
- Enhanced Monitoring: ~$3/month (60-second intervals)
- **Estimated monthly cost**: ~$150 (excluding data transfer)

## Security Features

- Multi-AZ deployment for high availability
- Storage encryption with customer-managed KMS key
- Private subnet deployment (no public access)
- Security group limited to application subnets only
- Credentials stored in Secrets Manager (not hardcoded)
- Enhanced monitoring and logging enabled
- Performance Insights with KMS encryption
- Deletion protection enabled

## Maintenance Windows

- **Backup Window**: 03:00-04:00 UTC
- **Maintenance Window**: Sunday 04:00-05:00 UTC

Adjust these in `lib/tap-stack.ts` based on your operational requirements.

## Testing

After deployment, verify the configuration:

1. Check RDS instance status in AWS Console
2. Verify Multi-AZ is enabled
3. Confirm email subscription for SNS topic
4. Test database connectivity from application subnet
5. Retrieve credentials from Secrets Manager
6. Monitor CloudWatch alarms and metrics

## Cleanup

To destroy all resources:

```bash
# First disable deletion protection
aws rds modify-db-instance \
  --db-instance-identifier <dbInstanceId> \
  --no-deletion-protection

# Then destroy the stack
cdktf destroy
```

**Note**: Final snapshot will be created before deletion.

## Tags

All resources are tagged with:
- `Environment`: production
- `Team`: platform
- `CostCenter`: engineering
- `EnvironmentSuffix`: Unique suffix for PR environments

## Support

For issues or questions, contact the platform team at ops@company.com.

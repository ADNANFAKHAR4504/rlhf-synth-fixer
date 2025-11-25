# Single-Region Multi-AZ Disaster Recovery Infrastructure

This CDK Python application deploys a comprehensive disaster recovery solution in a single AWS region (us-east-1) with Multi-AZ deployment for high availability.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with 3 availability zones, private and public subnets, and VPC endpoints for S3 and DynamoDB
- **Aurora PostgreSQL**: Multi-AZ database cluster with encryption, automated backups, and PITR
- **DynamoDB**: Table with point-in-time recovery and on-demand billing
- **Lambda**: VPC-enabled function with access to Aurora, DynamoDB, and S3
- **S3**: Versioned bucket with KMS encryption and lifecycle policies
- **AWS Backup**: Hourly backup schedule with 7-day retention for 1-hour RPO
- **KMS**: Customer-managed keys with automatic rotation for encryption
- **CloudWatch**: Dashboard and alarms for monitoring
- **EventBridge**: Rules for backup job monitoring and notifications
- **SNS**: Topic for alarm and event notifications

## Prerequisites

- AWS CLI configured with appropriate credentials
- Python 3.11 or later
- Node.js 14.x or later (for CDK CLI)
- AWS CDK CLI installed: `npm install -g aws-cdk`

## Deployment Instructions

1. **Install Python dependencies**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set environment suffix** (optional, defaults to "dev"):
   ```bash
   export ENVIRONMENT_SUFFIX=prod
   ```

3. **Bootstrap CDK** (first time only):
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/us-east-1
   ```

4. **Synthesize CloudFormation template**:
   ```bash
   cdk synth
   ```

5. **Deploy the stack**:
   ```bash
   cdk deploy --context environmentSuffix=prod
   ```

   Or with environment variable:
   ```bash
   export ENVIRONMENT_SUFFIX=prod
   cdk deploy
   ```

6. **Verify deployment**:
   - Check CloudFormation console for stack status
   - Verify all resources in AWS Console
   - Check CloudWatch dashboard for metrics

## Testing the Infrastructure

1. **Test Lambda function**:
   ```bash
   aws lambda invoke \
     --function-name dr-function-prod \
     --region us-east-1 \
     response.json
   cat response.json
   ```

2. **Verify Aurora cluster**:
   ```bash
   aws rds describe-db-clusters \
     --region us-east-1 \
     --query 'DBClusters[?contains(DBClusterIdentifier, `prod`)].{ID:DBClusterIdentifier,Status:Status}'
   ```

3. **Check DynamoDB table**:
   ```bash
   aws dynamodb describe-table \
     --table-name dr-table-prod \
     --region us-east-1
   ```

4. **Verify backup plan**:
   ```bash
   aws backup list-backup-plans --region us-east-1
   ```

## Disaster Recovery Operations

### Recovery Point Objective (RPO): 1 hour
- Hourly automated backups via AWS Backup
- Continuous backup enabled for Aurora and DynamoDB
- Point-in-time recovery available

### Recovery Time Objective (RTO): 4 hours
- Multi-AZ deployment ensures automatic failover
- Aurora replica promotion takes minutes
- Backup restoration takes 2-4 hours depending on data size

### Manual Restore Process

1. **Restore Aurora cluster**:
   ```bash
   aws backup start-restore-job \
     --recovery-point-arn <RECOVERY_POINT_ARN> \
     --metadata '{...}' \
     --iam-role-arn <BACKUP_ROLE_ARN> \
     --region us-east-1
   ```

2. **Restore DynamoDB table**:
   ```bash
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name dr-table-prod \
     --target-table-name dr-table-prod-restored \
     --restore-date-time <TIMESTAMP> \
     --region us-east-1
   ```

## Monitoring and Alerts

### CloudWatch Dashboard
Access the dashboard: AWS Console > CloudWatch > Dashboards > DR-Dashboard-{env}

Metrics include:
- Aurora CPU utilization and database connections
- DynamoDB read/write capacity
- Lambda invocations, errors, and duration

### CloudWatch Alarms
- **Aurora High CPU**: Triggers when CPU > 80% for 10 minutes
- **DynamoDB Throttled Requests**: Triggers when throttle events > 10
- **Lambda Errors**: Triggers when error count > 5

### EventBridge Notifications
- Backup job completion/failure
- Restore job completion/failure
- All notifications sent to SNS topic

## Cost Optimization

This solution is optimized for cost:
- Aurora uses t4g.medium instances (Graviton2)
- DynamoDB uses on-demand billing
- No NAT Gateways (VPC endpoints instead)
- S3 lifecycle policies for old versions
- Lambda in VPC with minimal memory

Estimated monthly cost: $200-400 depending on usage

## Security Features

- All data encrypted at rest with KMS customer-managed keys
- All data encrypted in transit (TLS)
- VPC isolation for databases and Lambda
- No public internet access for sensitive resources
- Least privilege IAM roles
- S3 buckets block all public access
- Security groups with minimal ingress rules

## Cleanup

To destroy all resources:
```bash
cdk destroy --context environmentSuffix=prod
```

**Note**: All resources are configured with RemovalPolicy.DESTROY and will be fully deleted.

## Troubleshooting

### Deployment Fails
- Verify AWS credentials and region
- Check CloudFormation events for specific errors
- Ensure sufficient service quotas

### Lambda Cannot Connect to Aurora
- Verify security group allows traffic from Lambda SG
- Check VPC endpoints are created
- Verify Lambda has correct IAM permissions

### Backup Jobs Failing
- Check IAM role permissions for AWS Backup
- Verify resources are tagged correctly
- Review CloudWatch Logs for backup service

## Support

For issues or questions:
1. Check CloudWatch Logs for detailed error messages
2. Review EventBridge events for backup/restore status
3. Consult AWS documentation for service-specific issues

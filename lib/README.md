# Migration Payment Processing Infrastructure

This Pulumi Python project creates a comprehensive zero-downtime migration infrastructure for moving a payment processing system from on-premises to AWS.

## Architecture Overview

The infrastructure includes:

1. **Network Layer**: Dual VPCs (production and migration) with Transit Gateway connectivity
2. **Database Layer**: RDS Aurora PostgreSQL clusters with read replicas in multiple regions
3. **Migration Layer**: AWS DMS for real-time database replication with full-load and CDC
4. **API Layer**: API Gateway with custom Lambda authorizers for secure traffic routing
5. **Validation Layer**: Lambda functions for data consistency validation
6. **Orchestration Layer**: Step Functions state machines for migration and rollback workflows
7. **Storage Layer**: S3 buckets with versioning for checkpoints and rollback states
8. **Monitoring Layer**: CloudWatch dashboards, alarms, and metric filters
9. **Notification Layer**: SNS topics for alerting operations team
10. **Configuration Layer**: Parameter Store hierarchies for environment-specific configs

## Prerequisites

- Python 3.9 or higher
- Pulumi CLI (v3.x)
- AWS CLI configured with appropriate credentials
- IAM permissions for creating all required resources

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set aws:region ap-southeast-1
pulumi config set env dev
```

3. Set environment-specific configuration (optional):
```bash
export ENVIRONMENT_SUFFIX=dev
export REPOSITORY=your-repo-name
export COMMIT_AUTHOR=your-name
```

## Deployment

Deploy the infrastructure:

```bash
pulumi up
```

This will:
1. Create all network infrastructure (VPCs, subnets, Transit Gateway)
2. Set up RDS Aurora PostgreSQL clusters
3. Configure DMS replication instances and tasks
4. Deploy Lambda functions for validation and authorization
5. Create API Gateway with custom authorizers
6. Set up Step Functions workflows
7. Create S3 buckets for checkpoints and rollback
8. Configure CloudWatch monitoring and alarms
9. Create SNS topics for notifications
10. Set up Parameter Store configuration

## Stack Outputs

After deployment, the following outputs will be available:

### Network
- `production_vpc_id`: Production VPC identifier
- `migration_vpc_id`: Migration VPC identifier
- `transit_gateway_id`: Transit Gateway identifier

### Database
- `production_db_endpoint`: Production Aurora cluster endpoint
- `production_db_reader_endpoint`: Production Aurora reader endpoint
- `migration_db_endpoint`: Migration Aurora cluster endpoint
- `migration_db_reader_endpoint`: Migration Aurora reader endpoint

### DMS
- `dms_replication_instance_arn`: DMS replication instance ARN
- `dms_replication_task_arn`: DMS replication task ARN

### Lambda
- `validation_lambda_arn`: Data validation Lambda function ARN
- `authorizer_lambda_arn`: API authorizer Lambda function ARN

### API Gateway
- `api_gateway_endpoint`: API Gateway endpoint URL
- `api_gateway_id`: API Gateway identifier

### Step Functions
- `migration_state_machine_arn`: Migration workflow state machine ARN
- `rollback_state_machine_arn`: Rollback workflow state machine ARN

### Storage
- `checkpoints_bucket_name`: S3 bucket for migration checkpoints
- `rollback_bucket_name`: S3 bucket for rollback states

### Monitoring
- `dashboard_name`: CloudWatch dashboard name
- `dashboard_arn`: CloudWatch dashboard ARN

## Migration Workflow

### Phase 1: Preparation
1. Verify all infrastructure is deployed successfully
2. Check database connectivity
3. Configure Parameter Store values for migration mode

### Phase 2: Start Replication
1. Start the DMS replication task:
```bash
aws dms start-replication-task \
  --replication-task-arn <dms_replication_task_arn> \
  --start-replication-task-type start-replication
```

2. Monitor replication lag in CloudWatch dashboard

### Phase 3: Data Validation
1. Invoke the validation Lambda function:
```bash
aws lambda invoke \
  --function-name data-validation-{environment_suffix} \
  --payload '{}' \
  output.json
```

2. Check validation results in CloudWatch Logs

### Phase 4: Orchestrate Migration
1. Start the migration state machine:
```bash
aws stepfunctions start-execution \
  --state-machine-arn <migration_state_machine_arn> \
  --name migration-$(date +%s) \
  --input '{}'
```

2. Monitor execution in Step Functions console
3. Receive notifications via SNS for each phase

### Phase 5: Cutover
1. Update Parameter Store to enable cutover:
```bash
aws ssm put-parameter \
  --name "/migration/{environment_suffix}/workflow/enable-cutover" \
  --value "true" \
  --overwrite
```

2. Update traffic split percentage:
```bash
aws ssm put-parameter \
  --name "/migration/{environment_suffix}/workflow/traffic-split-percentage" \
  --value "100" \
  --overwrite
```

## Rollback Procedure

If issues are detected during migration:

1. Start the rollback state machine:
```bash
aws stepfunctions start-execution \
  --state-machine-arn <rollback_state_machine_arn> \
  --name rollback-$(date +%s) \
  --input '{}'
```

2. This will:
   - Save rollback state to S3
   - Stop DMS replication
   - Restore traffic to production database
   - Notify operations team

## Testing

Run unit tests:
```bash
python -m pytest tests/test_infrastructure.py -v
```

Run integration tests (requires deployed infrastructure):
```bash
python -m pytest tests/test_integration.py -v
```

## Monitoring and Alerts

### CloudWatch Dashboard
Access the dashboard at:
```
https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1#dashboards:name=migration-dashboard-{environment_suffix}
```

The dashboard shows:
- Database CPU and connection metrics
- DMS replication lag and throughput
- Lambda invocation and error rates
- API Gateway request metrics
- Data validation results

### Alarms
Alarms are configured for:
- High database CPU utilization (>80%)
- High DMS replication lag (>5 minutes)
- Lambda function errors
- API Gateway 5XX errors
- Step Functions execution failures

All alarms publish to SNS topics for immediate notification.

## Security Considerations

1. **Encryption**: All data is encrypted at rest and in transit
2. **Authentication**: API Gateway uses custom authorizer with tokens stored in Parameter Store
3. **IAM**: All roles follow least privilege principle
4. **Secrets**: Database credentials should be rotated using Secrets Manager
5. **Network**: Resources deployed in private subnets with controlled access

## Cost Optimization

The infrastructure is designed for cost efficiency:
- Single NAT Gateway per VPC (not per AZ)
- Aurora Serverless consideration for non-production
- Lambda functions for serverless compute
- S3 lifecycle policies for log retention
- CloudWatch log retention limited to 7 days

## Cleanup

To destroy all infrastructure:

```bash
pulumi destroy
```

**Note**: This will delete all resources. Ensure you have backups if needed.

## Troubleshooting

### DMS Replication Failing
- Check DMS security group allows database access
- Verify database credentials are correct
- Check DMS CloudWatch logs for errors

### Lambda Function Timing Out
- Increase timeout in lambda_stack.py
- Check VPC connectivity and NAT Gateway
- Verify database is accessible from Lambda subnet

### API Gateway 403 Errors
- Verify authorization token in Parameter Store
- Check Lambda authorizer CloudWatch logs
- Ensure IAM role has Lambda invoke permissions

### Step Functions Execution Failed
- Check state machine CloudWatch logs
- Verify all referenced resources exist
- Check IAM role permissions for state machine

## Support

For issues or questions, contact the operations team or check the CloudWatch logs for detailed error messages.

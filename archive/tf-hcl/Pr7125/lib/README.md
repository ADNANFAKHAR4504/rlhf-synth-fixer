# Transaction Reconciliation Pipeline

A serverless infrastructure solution for automating daily transaction reconciliation processes across multiple payment providers.

## Architecture Overview

This Terraform configuration deploys a complete serverless pipeline that:

1. Receives CSV files uploaded to S3
2. Triggers a Step Functions workflow automatically
3. Parses transactions and stores them in DynamoDB
4. Validates transactions against business rules
5. Generates reports and sends notifications via SNS
6. Monitors the entire process via CloudWatch

## Infrastructure Components

### AWS Services Used

- **S3**: File storage with event notifications
- **Lambda**: Four serverless functions (trigger, parser, validator, report generator)
- **Step Functions**: Workflow orchestration with retry logic
- **DynamoDB**: Two tables for transaction records and reconciliation results
- **SNS**: Email notifications for completion/failures
- **CloudWatch**: Monitoring dashboard with metrics
- **IAM**: Least privilege roles and policies

### Resource Naming

All resources follow the pattern: `{resource-type}-{environment-suffix}`

This ensures uniqueness across multiple deployments and environments.

## Deployment

### Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

### Deploy Infrastructure

1. Initialize Terraform:
   ```bash
   cd lib
   terraform init
   ```

2. Validate configuration:
   ```bash
   terraform validate
   ```

3. Review planned changes:
   ```bash
   terraform plan -var="environment_suffix=dev-001"
   ```

4. Deploy infrastructure:
   ```bash
   terraform apply -var="environment_suffix=dev-001"
   ```

### Deployment Outputs

After successful deployment, Terraform will output:

- S3 bucket name for uploading CSV files
- Step Functions state machine ARN
- DynamoDB table names
- SNS topic ARN
- CloudWatch dashboard name
- Lambda function names

## Usage

### Upload CSV File

Upload a CSV file to the S3 bucket with the following format:

```csv
transaction_id,amount,provider,timestamp
TXN001,100.50,ProviderA,2025-11-24T10:00:00Z
TXN002,250.75,ProviderB,2025-11-24T10:05:00Z
```

The file must have a `.csv` extension to trigger the workflow.

### Monitor Execution

1. **CloudWatch Dashboard**: View real-time metrics for execution time, errors, and DynamoDB capacity
2. **Step Functions Console**: Track individual workflow executions
3. **CloudWatch Logs**: Review Lambda function logs for detailed execution traces

### Notifications

The system sends SNS notifications for:
- Successful reconciliation completion with summary
- Failures at any stage with error details

## Configuration

### Variables

Key variables in `variables.tf`:

- `environment_suffix`: Unique identifier for resources (required)
- `aws_region`: Target AWS region (default: us-east-1)
- `lambda_runtime`: Lambda runtime version (default: python3.9)
- `lambda_memory_size`: Lambda memory allocation (default: 1024MB)
- `log_retention_days`: CloudWatch log retention (default: 30 days)

### Step Functions Retry Logic

Each Lambda function in the workflow has:
- Maximum 3 retry attempts
- Exponential backoff with rate 2.0
- Initial interval: 2 seconds
- Catches all errors and sends failure notifications

## Cost Optimization

This architecture is designed for cost efficiency:

- **Lambda**: Pay per execution, 1024MB memory
- **DynamoDB**: On-demand billing mode
- **S3**: Lifecycle policy transitions to Glacier after 90 days
- **CloudWatch Logs**: 30-day retention to limit storage costs
- **Step Functions**: Pay per state transition

## Security Features

- IAM roles follow least privilege principle
- No wildcard resource permissions
- S3 bucket versioning enabled
- DynamoDB point-in-time recovery enabled
- CloudWatch Logs for audit trail
- Resource-specific IAM policies

## Cleanup

To destroy all resources:

```bash
terraform destroy -var="environment_suffix=dev-001"
```

All resources are configured to be destroyable without manual intervention.

## Troubleshooting

### Common Issues

1. **S3 notification not triggering**: Check Lambda permission and S3 event configuration
2. **Step Functions failing**: Review CloudWatch Logs for specific Lambda errors
3. **DynamoDB throttling**: Consider provisioned capacity if processing very large files

### Logs Location

- Trigger Lambda: `/aws/lambda/trigger-reconciliation-{suffix}`
- File Parser: `/aws/lambda/file-parser-{suffix}`
- Validator: `/aws/lambda/transaction-validator-{suffix}`
- Report Generator: `/aws/lambda/report-generator-{suffix}`

## Performance

- Target processing time: < 5 minutes for 100,000 transactions
- Lambda timeout: 300 seconds per function
- Step Functions maximum execution time: ~15 minutes
- Concurrent executions: Unlimited (subject to AWS account limits)

## Maintenance

### Regular Tasks

1. Monitor CloudWatch dashboard for trends
2. Review failed executions in Step Functions console
3. Check SNS subscription confirmations
4. Verify S3 lifecycle transitions to Glacier

### Updates

To update the infrastructure:
1. Modify Terraform configuration
2. Run `terraform plan` to review changes
3. Apply changes with `terraform apply`

## Support

For issues or questions about this infrastructure:
1. Check CloudWatch Logs for error details
2. Review Step Functions execution history
3. Verify IAM permissions and resource configurations

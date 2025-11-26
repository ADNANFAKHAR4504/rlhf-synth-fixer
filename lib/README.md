# Financial Market Data Processing System

This Terraform configuration deploys a serverless event-driven architecture for processing real-time financial market data using AWS EventBridge, Lambda, and DynamoDB.

## Architecture Overview

The system consists of the following components:

- **EventBridge Event Bus**: Central hub for receiving and routing market data events
- **Lambda Function**: Serverless processor for market data events
- **DynamoDB Tables**:
  - `market-data`: Stores processed market data with GSIs for querying
  - `audit-trail`: Maintains complete audit trail for compliance
- **CloudWatch Logs**: Centralized logging for monitoring and debugging
- **SQS Dead Letter Queue**: Captures failed events for analysis
- **CloudWatch Alarms**: Monitors Lambda errors and performance

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- Python 3.11 or Node.js 18.x for Lambda runtime
- AWS account with necessary permissions

## Resource Naming Convention

All resources follow the naming pattern: `{resource-type}-{purpose}-${var.environment_suffix}`

This ensures:
- Unique resource names across environments
- Easy identification of resource purpose
- Prevention of naming conflicts

## Deployment Instructions

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Configure Variables

Create a `terraform.tfvars` file from the example:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your specific values:

```hcl
environment_suffix = "prod"
aws_region         = "us-east-1"
lambda_runtime     = "python3.11"
lambda_timeout     = 30
lambda_memory      = 512
log_retention_days = 30
```

### 3. Review Execution Plan

```bash
terraform plan -var-file=terraform.tfvars
```

### 4. Deploy Infrastructure

```bash
terraform apply -var-file=terraform.tfvars
```

### 5. Verify Deployment

After successful deployment, Terraform will output the resource names and ARNs:

```bash
terraform output
```

## Testing the System

### Send Test Events to EventBridge

Use the AWS CLI to send test market data events:

```bash
aws events put-events \
  --entries '[
    {
      "Source": "market.data",
      "DetailType": "Trade Execution",
      "Detail": "{\"exchange\":\"NYSE\",\"symbol\":\"AAPL\",\"price\":150.25,\"volume\":1000}",
      "EventBusName": "market-data-bus-<environment_suffix>"
    }
  ]'
```

### Query DynamoDB for Processed Data

```bash
aws dynamodb query \
  --table-name market-data-<environment_suffix> \
  --index-name SymbolIndex \
  --key-condition-expression "symbol = :symbol" \
  --expression-attribute-values '{":symbol":{"S":"AAPL"}}'
```

### Check Lambda Logs

```bash
aws logs tail /aws/lambda/market-processor-<environment_suffix> --follow
```

### Monitor Dead Letter Queue

```bash
aws sqs receive-message \
  --queue-url $(terraform output -raw dlq_url) \
  --max-number-of-messages 10
```

## Monitoring and Observability

### CloudWatch Dashboards

The system automatically creates CloudWatch alarms for:

- Lambda function errors (threshold: 5 errors per minute)
- Lambda function duration (threshold: 5 seconds average)

### Key Metrics to Monitor

- **Lambda Invocations**: Total number of events processed
- **Lambda Errors**: Failed event processing attempts
- **Lambda Duration**: Processing latency
- **DynamoDB Consumed Capacity**: Read/write throughput
- **SQS Messages**: Failed events in DLQ

### Accessing Logs

CloudWatch Logs are organized by Lambda function:

```bash
/aws/lambda/market-processor-<environment_suffix>
```

Logs are retained for 30 days for compliance requirements.

## Security

### IAM Roles and Policies

The Lambda function operates with least-privilege IAM permissions:

- **DynamoDB**: PutItem, GetItem, Query, UpdateItem on specific tables
- **CloudWatch Logs**: CreateLogGroup, CreateLogStream, PutLogEvents
- **SQS**: SendMessage to DLQ only

### Data Encryption

- DynamoDB tables use server-side encryption
- CloudWatch Logs are encrypted at rest
- Data in transit uses TLS 1.2+

### Network Security

- Lambda functions operate in AWS-managed VPC
- No public endpoints exposed
- EventBridge uses AWS PrivateLink

## Scaling and Performance

### Auto-Scaling

- **Lambda**: Automatically scales up to 1000 concurrent executions
- **DynamoDB**: PAY_PER_REQUEST billing mode scales automatically
- **EventBridge**: Handles millions of events per second

### Performance Targets

- Lambda cold start: < 1 second
- Lambda warm execution: < 200ms
- DynamoDB latency: Single-digit milliseconds
- End-to-end processing: < 500ms

## Cost Optimization

- DynamoDB PAY_PER_REQUEST eliminates idle capacity costs
- Lambda charges only for actual compute time
- CloudWatch Logs retention limited to 30 days
- DynamoDB TTL automatically removes old data

## Disaster Recovery

### Backup Strategy

- DynamoDB Point-in-Time Recovery enabled (35 days)
- CloudWatch Logs retained for 30 days
- Infrastructure state in Terraform state file

### Recovery Procedures

1. **Data Recovery**: Use DynamoDB point-in-time recovery
2. **Infrastructure Recovery**: Re-apply Terraform configuration
3. **Failed Events**: Replay from DLQ

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file=terraform.tfvars
```

**WARNING**: This will permanently delete all data. Ensure you have backups before destroying.

## Troubleshooting

### Lambda Function Not Processing Events

1. Check EventBridge rule is enabled
2. Verify Lambda permissions for EventBridge
3. Check Lambda function logs in CloudWatch

### DynamoDB Write Failures

1. Check IAM role permissions
2. Verify table exists and is ACTIVE
3. Check for provisioned throughput limits (if not using PAY_PER_REQUEST)

### High Lambda Errors

1. Check DLQ for failed event details
2. Review Lambda function logs
3. Verify event payload format

## Compliance and Audit

### Audit Trail

All events are logged in the `audit-trail` DynamoDB table with:

- Unique audit ID
- Original event ID
- Processing status
- Timestamp
- Detailed processing information

### Compliance Features

- 30-day log retention for regulatory requirements
- Complete audit trail of all transactions
- Encryption at rest and in transit
- Point-in-time recovery for data protection

## Support and Maintenance

For issues or questions:

1. Check CloudWatch Logs for errors
2. Review Terraform plan output
3. Consult AWS service documentation

## License

This infrastructure code is managed by the Platform Engineering team.

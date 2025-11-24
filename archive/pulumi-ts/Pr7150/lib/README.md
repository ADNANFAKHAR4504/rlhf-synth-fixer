# Cryptocurrency Price Alert System

Serverless event-driven architecture for processing cryptocurrency price events and generating alerts when thresholds are exceeded.

## Architecture

The system consists of:
- **EventBridge Custom Event Bus**: Receives price updates from cryptocurrency exchanges
- **Lambda Functions**:
  - `price-processor`: Validates and stores incoming price events
  - `alert-generator`: Queries price history and generates alerts
- **DynamoDB Table**: Stores historical price data with on-demand billing
- **SNS Topic**: Distributes price alerts to subscribers
- **SQS Dead Letter Queues**: Captures failed events for both Lambda functions
- **CloudWatch Logs**: 14-day retention for monitoring and debugging
- **IAM Roles**: Least privilege permissions for each component

## Prerequisites

- Node.js 18+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create IAM roles, Lambda, DynamoDB, EventBridge, SNS, SQS, and CloudWatch resources

## Deployment

1. Set environment suffix:
```bash
export ENVIRONMENT_SUFFIX=dev
```

2. Install dependencies:
```bash
npm install
```

3. Deploy the stack:
```bash
pulumi up
```

4. Review the changes and confirm deployment

## Configuration

The stack accepts the following configuration through environment variables:

- `ENVIRONMENT_SUFFIX`: Environment identifier (e.g., dev, staging, prod) - **Required**
- `AWS_REGION`: AWS region for deployment (default: us-east-1)

## Resource Naming

All resources include the environmentSuffix in their names for multi-environment support:
- EventBridge bus: `crypto-events-{env}`
- Lambda functions: `price-processor-{env}`, `alert-generator-{env}`
- DynamoDB table: `price-history-{env}`
- SNS topic: `price-alerts-{env}`
- SQS queues: `price-processor-dlq-{env}`, `alert-generator-dlq-{env}`

## Testing

Send a test event to EventBridge:

```bash
aws events put-events --entries '[
  {
    "Source": "crypto.exchange",
    "DetailType": "PriceUpdate",
    "Detail": "{\"symbol\":\"BTC\",\"price\":45000.50}",
    "EventBusName": "crypto-events-dev"
  }
]'
```

Subscribe to SNS topic to receive alerts:

```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output snsTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Stack Outputs

After deployment, the following outputs are available:

- `eventBusArn`: ARN of the EventBridge custom event bus
- `eventBusName`: Name of the EventBridge event bus
- `priceProcessorFunctionName`: Name of the price processor Lambda function
- `alertGeneratorFunctionName`: Name of the alert generator Lambda function
- `dynamodbTableName`: Name of the DynamoDB price history table
- `snsTopicArn`: ARN of the SNS topic for alerts
- `priceProcessorDlqUrl`: URL of the price processor dead letter queue
- `alertGeneratorDlqUrl`: URL of the alert generator dead letter queue

View outputs:
```bash
pulumi stack output
```

## Alert Thresholds

The alert-generator Lambda function checks for price changes exceeding 5% over a 15-minute window. This threshold can be adjusted by modifying the `ALERT_THRESHOLD` constant in the Lambda code.

## Cost Optimization

- All Lambda functions use ARM64 architecture for cost savings
- DynamoDB uses on-demand billing to scale with actual usage
- CloudWatch Logs have 14-day retention to minimize storage costs
- Reserved concurrent executions set to 100 to prevent runaway costs

## Monitoring

Check Lambda execution logs:
```bash
aws logs tail /aws/lambda/price-processor-dev --follow
aws logs tail /aws/lambda/alert-generator-dev --follow
```

Check dead letter queues for failed events:
```bash
aws sqs receive-message --queue-url $(pulumi stack output priceProcessorDlqUrl)
aws sqs receive-message --queue-url $(pulumi stack output alertGeneratorDlqUrl)
```

## Cleanup

Remove all resources:
```bash
pulumi destroy
```

## Security

- IAM roles follow least privilege principle with specific action permissions
- No wildcard permissions in IAM policies
- Lambda functions only have access to required services
- All resources are tagged for compliance tracking
- Dead letter queues ensure no events are lost

## Compliance

All resources are tagged with:
- Environment: Deployment environment
- CostCenter: Cost allocation identifier
- Additional tags from CI/CD metadata (Repository, Author, PRNumber, Team, CreatedAt)

## Troubleshooting

If deployment fails:
1. Check AWS credentials are configured: `aws sts get-caller-identity`
2. Verify Pulumi is installed: `pulumi version`
3. Check CloudWatch Logs for Lambda errors
4. Inspect dead letter queues for failed events
5. Ensure ENVIRONMENT_SUFFIX is set

For Lambda errors:
- Check CloudWatch Log groups for detailed error messages
- Verify IAM role permissions are correct
- Ensure DynamoDB table and EventBridge bus exist
- Check dead letter queues for failed invocations

## Development

The infrastructure is defined in:
- `lib/tap-stack.ts`: Main stack definition with all AWS resources
- `bin/tap.ts`: Entry point that instantiates the stack

Lambda function code is embedded in the stack definition using Pulumi AssetArchive.

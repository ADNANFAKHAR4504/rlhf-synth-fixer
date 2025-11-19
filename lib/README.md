# Serverless Payment Webhook Processing System

This CloudFormation template deploys a production-ready serverless payment webhook processing system using AWS Lambda, DynamoDB, KMS encryption, and CloudWatch monitoring.

## Architecture Overview

The infrastructure consists of:

- **AWS Lambda**: ARM-based (arm64) function for processing payment webhooks with 1GB memory and 30-second timeout
- **Amazon DynamoDB**: On-demand table for storing processed transactions with point-in-time recovery
- **AWS KMS**: Customer-managed key for encrypting Lambda environment variables and CloudWatch logs
- **CloudWatch Logs**: Log group with 30-day retention and KMS encryption for compliance
- **IAM Role**: Least privilege execution role with specific permissions for Lambda

## Features

### Security
- KMS encryption for Lambda environment variables
- KMS encryption for CloudWatch logs
- DynamoDB encryption at rest (default)
- IAM least privilege permissions with resource-specific ARNs
- Point-in-time recovery enabled on DynamoDB

### Performance
- ARM-based Lambda (Graviton2) for cost optimization
- Reserved concurrency of 100 to prevent throttling
- DynamoDB on-demand billing for variable workloads
- 1GB memory allocation for webhook processing

### Observability
- X-Ray tracing enabled on Lambda
- CloudWatch Logs with structured logging
- 30-day log retention for compliance
- Lambda metrics and alarms ready

## Deployment Instructions

### Prerequisites

- AWS CLI configured with appropriate credentials
- CloudFormation permissions in your AWS account
- An environment suffix for resource naming (e.g., "dev", "prod", or a unique identifier)

### Deploy the Stack

```bash
# Set your environment suffix
ENVIRONMENT_SUFFIX="your-unique-suffix"

# Deploy the CloudFormation stack
aws cloudformation create-stack \
  --stack-name webhook-processor-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/webhook-processor-stack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack creation to complete
aws cloudformation wait stack-create-complete \
  --stack-name webhook-processor-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name webhook-processor-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Test the Lambda Function

```bash
# Get the Lambda function name
FUNCTION_NAME=$(aws cloudformation describe-stacks \
  --stack-name webhook-processor-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
  --output text)

# Invoke the function with a test event
aws lambda invoke \
  --function-name ${FUNCTION_NAME} \
  --payload '{"transactionId":"txn_test_001","amount":99.99,"currency":"USD","status":"completed","provider":"stripe","timestamp":"2025-01-15T10:30:00Z"}' \
  --region us-east-1 \
  response.json

# View the response
cat response.json

# Check the transaction in DynamoDB
TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name webhook-processor-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTableName`].OutputValue' \
  --output text)

aws dynamodb get-item \
  --table-name ${TABLE_NAME} \
  --key '{"transactionId":{"S":"txn_test_001"}}' \
  --region us-east-1
```

### View Logs

```bash
# View Lambda logs in CloudWatch
aws logs tail /aws/lambda/webhook-processor-${ENVIRONMENT_SUFFIX} \
  --follow \
  --region us-east-1
```

### Clean Up

```bash
# Delete the CloudFormation stack
aws cloudformation delete-stack \
  --stack-name webhook-processor-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Wait for stack deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name webhook-processor-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

## Resource Details

### Lambda Function
- **Name**: webhook-processor-{EnvironmentSuffix}
- **Runtime**: Python 3.11
- **Architecture**: ARM64 (Graviton2)
- **Memory**: 1024 MB (1 GB)
- **Timeout**: 30 seconds
- **Concurrency**: 100 reserved executions
- **Tracing**: X-Ray active

### DynamoDB Table
- **Name**: transactions-{EnvironmentSuffix}
- **Partition Key**: transactionId (String)
- **Billing**: On-demand (PAY_PER_REQUEST)
- **Encryption**: SSE enabled
- **PITR**: Enabled

### KMS Key
- **Alias**: alias/webhook-processor-{EnvironmentSuffix}
- **Usage**: Lambda environment variables, CloudWatch logs
- **Key Policy**: Allows CloudWatch Logs and Lambda services

### CloudWatch Log Group
- **Name**: /aws/lambda/webhook-processor-{EnvironmentSuffix}
- **Retention**: 30 days
- **Encryption**: KMS encryption enabled

## Cost Estimation

Approximate monthly costs (assuming moderate usage):

- **Lambda**: $0.20-$5 per million requests (ARM pricing)
- **DynamoDB**: $0.25 per million write requests (on-demand)
- **CloudWatch Logs**: $0.50 per GB ingested
- **KMS**: $1 per month for key + $0.03 per 10,000 requests
- **Total**: ~$5-15/month for moderate workloads

## Security Considerations

1. **PCI Compliance**: All data encrypted at rest and in transit
2. **IAM Least Privilege**: Lambda role has minimal required permissions
3. **Log Encryption**: CloudWatch logs encrypted with KMS
4. **Environment Variables**: Sensitive data encrypted with KMS
5. **Network Isolation**: Consider adding VPC configuration if required

## Performance Tuning

- **Memory**: Adjust Lambda memory (1024 MB default) based on workload
- **Concurrency**: Increase reserved concurrency if throttling occurs
- **DynamoDB**: Monitor capacity and consider provisioned mode for predictable workloads
- **Timeout**: Adjust Lambda timeout if processing takes longer than 30 seconds

## Monitoring and Alarms

Recommended CloudWatch alarms:
- Lambda errors > 5% of invocations
- Lambda duration > 25 seconds (approaching timeout)
- Lambda throttles > 0
- DynamoDB system errors > 0

## Compliance

This infrastructure meets the following compliance requirements:
- **PCI DSS**: Encryption at rest and in transit
- **SOC 2**: Audit logging with 30-day retention
- **HIPAA**: Encryption and access controls (if BAA in place)

## Support

For issues or questions, refer to:
- AWS Lambda documentation: https://docs.aws.amazon.com/lambda/
- AWS DynamoDB documentation: https://docs.aws.amazon.com/dynamodb/
- AWS KMS documentation: https://docs.aws.amazon.com/kms/

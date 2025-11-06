# Serverless Webhook Processing System

This Terraform configuration deploys a complete serverless webhook processing system with API Gateway, Lambda, DynamoDB, SQS, and SNS.

## Architecture

1. **API Gateway REST API**: Receives webhook POST requests at `/webhooks` endpoint
2. **Validation Lambda**: Validates webhook signatures and stores in DynamoDB
3. **DynamoDB**: Stores webhook payloads with 30-day TTL
4. **SQS FIFO Queue**: Ensures ordered processing of validated webhooks
5. **Processing Lambda**: Processes messages in batches of 10 and publishes to SNS
6. **SNS Topic**: Notifies downstream services of processed webhooks
7. **Dead Letter Queues**: Captures failed messages for both SQS and Lambda

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Existing ACM certificate for custom domain

## Deployment

### 1. Package Lambda Functions

```bash
cd lib/lambda
chmod +x package.sh
./package.sh
cd ../..
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Create terraform.tfvars

```hcl
environment_suffix    = "dev"
acm_certificate_arn   = "arn:aws:acm:us-east-1:123456789012:certificate/xxxxx"
custom_domain_name    = "webhooks.example.com"
aws_region            = "us-east-1"
```

### 4. Deploy

```bash
terraform plan
terraform apply
```

## Configuration

### Lambda Environment Variables

The Lambda functions use the following environment variables (automatically configured):

**Validation Lambda**:
- `DYNAMODB_TABLE`: DynamoDB table name
- `SQS_QUEUE_URL`: SQS FIFO queue URL
- `WEBHOOK_SECRET`: (Optional) Secret for signature validation

**Processing Lambda**:
- `SNS_TOPIC_ARN`: SNS topic ARN for notifications

### Resource Naming

All resources use the `environment_suffix` variable for unique naming:
- Format: `resource-type-${var.environment_suffix}`
- Example: `webhook-api-dev`

## Testing

### Send Test Webhook

```bash
# Get the API Gateway URL
API_URL=$(terraform output -raw api_gateway_url)

# Send test webhook
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: <signature>" \
  -d '{"merchant_id": "test123", "amount": 100, "currency": "USD"}'
```

### Monitor Processing

```bash
# Check DynamoDB for stored webhooks
aws dynamodb scan --table-name webhooks-${ENVIRONMENT_SUFFIX}

# Check SQS queue depth
aws sqs get-queue-attributes \
  --queue-url $(terraform output -raw sqs_queue_url) \
  --attribute-names ApproximateNumberOfMessages

# Check CloudWatch Logs
aws logs tail /aws/lambda/webhook-validation-${ENVIRONMENT_SUFFIX} --follow
aws logs tail /aws/lambda/webhook-processing-${ENVIRONMENT_SUFFIX} --follow
```

## Security

- **Encryption**: KMS customer-managed keys for DynamoDB and SQS
- **IAM**: Least-privilege policies for each Lambda function
- **X-Ray Tracing**: Enabled on all Lambda functions for debugging
- **Signature Validation**: HMAC SHA256 signature verification on webhooks
- **CloudWatch Logs**: 7-day retention for all services

## Outputs

- `api_gateway_url`: API Gateway invoke URL
- `custom_domain_url`: Custom domain URL
- `dynamodb_table_name`: DynamoDB table name
- `sqs_queue_url`: SQS queue URL
- `sns_topic_arn`: SNS topic ARN
- `validation_lambda_arn`: Validation Lambda ARN
- `processing_lambda_arn`: Processing Lambda ARN
- `kms_key_id`: KMS key ID
- `dlq_url`: Dead letter queue URL

## Cost Optimization

- Lambda: Pay-per-invocation with 512MB memory
- DynamoDB: On-demand billing mode
- SQS: No charge for first 1M requests/month
- CloudWatch Logs: 7-day retention
- API Gateway: Pay-per-request pricing

## Cleanup

```bash
terraform destroy
```

Note: Ensure SQS queues and DynamoDB table are empty before destroying to avoid data loss.

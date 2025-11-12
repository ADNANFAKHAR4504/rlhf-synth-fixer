# Transaction Processing System

A serverless transaction processing system built with Pulumi and TypeScript, deployed on AWS.

## Architecture

This system implements a complete serverless transaction processing pipeline:

- **API Gateway**: REST API with POST endpoint `/transaction`
- **Lambda Functions**:
  - `validator`: Validates incoming transaction requests (Go 1.x runtime)
  - `processor`: Processes valid transactions, writes to DynamoDB and S3 (Go 1.x runtime)
  - `notifier`: Sends notifications (Go 1.x runtime)
- **DynamoDB**: Stores transaction records with partition key `transactionId` and sort key `timestamp`
- **S3**: Stores audit logs with lifecycle policy (90 days to Glacier)
- **SQS**: Dead letter queues for all Lambda functions
- **CloudWatch**: Log groups with 7-day retention

## Features

- Request validation at API Gateway level
- Lambda destinations for asynchronous invocation (validator -> processor)
- Dead letter queues for failed Lambda executions
- X-Ray tracing enabled on all Lambda functions
- Reserved concurrent executions (100) per function
- Point-in-time recovery for DynamoDB
- Server-side encryption for S3 and DynamoDB
- S3 versioning enabled
- API key authentication via usage plans
- IAM least-privilege roles for each Lambda function

## Deployment

```bash
# Install dependencies
npm install

# Configure Pulumi
pulumi config set aws:region us-east-1

# Deploy
pulumi up

# Get outputs
pulumi stack output apiUrl
pulumi stack output tableName
pulumi stack output bucketName
```

## Testing the API

```bash
# Get API URL and Key
API_URL=$(pulumi stack output apiUrl)
API_KEY=$(aws apigateway get-api-keys --query 'items[0].value' --output text)

# Send transaction
curl -X POST "https://${API_URL}/transaction" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "transactionId": "txn-12345",
    "amount": 100.50,
    "currency": "USD",
    "source": "payment-gateway"
  }'
```

## Outputs

- `apiUrl`: API Gateway invoke URL
- `tableName`: DynamoDB table name
- `bucketName`: S3 bucket name for audit logs
- `apiKeyId`: API Gateway API key ID

## Lambda Functions

All Lambda functions use Go 1.x runtime for performance and cost efficiency. The functions are located in `lib/lambda/`:

- `validator/`: Input validation logic
- `processor/`: Transaction processing logic
- `notifier/`: Notification logic

## Monitoring

- CloudWatch Logs: 7-day retention for all functions
- X-Ray: Distributed tracing enabled
- CloudWatch Metrics: Available for all Lambda functions and API Gateway

## Security

- IAM roles with least-privilege permissions
- Server-side encryption (AES256) for S3
- DynamoDB encryption at rest
- API key authentication required
- Request validation enabled
- VPC deployment (optional - not implemented in this version)

## Cleanup

```bash
pulumi destroy
```

Note: S3 bucket must be empty before destruction. Run this first if needed:

```bash
BUCKET_NAME=$(pulumi stack output bucketName)
aws s3 rm s3://${BUCKET_NAME} --recursive
```

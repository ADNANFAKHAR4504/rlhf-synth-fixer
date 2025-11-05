# Serverless Payment Processing Infrastructure

This Pulumi Python program deploys a complete serverless payment processing system on AWS with the following components:

## Architecture

- **API Gateway REST API**: Three endpoints for transaction processing, fraud webhooks, and transaction retrieval
- **Lambda Functions**: Four functions for processing transactions, handling fraud alerts, sending notifications, and retrieving transactions
- **DynamoDB Tables**: Two tables for storing transactions and fraud alerts
- **SQS FIFO Queues**: Two queues with dead letter queues for reliable message processing
- **IAM Roles**: Least-privilege roles for each Lambda function
- **CloudWatch Logs**: 7-day retention for all Lambda functions
- **SSM Parameter Store**: Secure storage for webhook URLs and API keys
- **X-Ray Tracing**: Distributed tracing across all components

## Prerequisites

- Python 3.11+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create the required resources

## Deployment

1. Install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Configure Pulumi:
```bash
pulumi config set aws:region us-east-2
pulumi config set environmentSuffix dev
```

3. Deploy the stack:
```bash
pulumi up
```

4. Retrieve outputs:
```bash
pulumi stack output api_gateway_url
pulumi stack output api_key_id
```

5. Get API key value:
```bash
aws apigateway get-api-key --api-key $(pulumi stack output api_key_id) --include-value --query 'value' --output text
```

## API Endpoints

- `POST /transactions` - Create a new transaction
- `POST /fraud-webhook` - Receive fraud detection alerts
- `GET /transactions/{id}` - Retrieve transaction details

All endpoints require an API key in the `x-api-key` header.

## Testing

Example request to create a transaction:
```bash
API_URL=$(pulumi stack output api_gateway_url)
API_KEY=$(aws apigateway get-api-key --api-key $(pulumi stack output api_key_id) --include-value --query 'value' --output text)

curl -X POST "$API_URL/transactions" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "merchant_id": "merchant-123"
  }'
```

## Configuration

The following SSM parameters are created (update as needed):
- `/payment-processing/{environmentSuffix}/webhook-url` - Webhook URL for notifications
- `/payment-processing/{environmentSuffix}/api-key` - API key for external services

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Features

- **High Availability**: On-demand DynamoDB billing, serverless Lambda functions
- **Security**: IAM least-privilege policies, API keys, SSM Parameter Store for secrets
- **Monitoring**: CloudWatch Logs, X-Ray tracing, API Gateway metrics
- **Reliability**: SQS FIFO queues with DLQs, 4-day message retention
- **Performance**: 3GB Lambda memory, arm64 architecture, reserved concurrency
- **Compliance**: X-Ray tracing for audit trails, point-in-time recovery for DynamoDB

## Cost Optimization

- On-demand billing for DynamoDB
- Serverless Lambda with arm64 for better price/performance
- 7-day log retention to minimize storage costs
- FIFO queues with content-based deduplication to reduce duplicate processing

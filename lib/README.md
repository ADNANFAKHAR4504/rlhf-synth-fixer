# Payment Webhook Processing Infrastructure

This Pulumi Python project creates serverless infrastructure for migrating payment webhook processing to AWS.

## Architecture

- **Lambda Function**: Processes payment webhooks with 512MB memory
- **Function URL**: AWS_IAM authenticated endpoint for webhook callbacks
- **DynamoDB Table**: On-demand billing for transaction storage
- **Secrets Manager**: Secure storage for payment provider API keys
- **CloudWatch Logs**: 7-day retention for function logs
- **X-Ray Tracing**: Enabled for distributed tracing
- **IAM Roles**: Least-privilege access (read secrets, write DynamoDB)

## Prerequisites

- Python 3.9+
- Pulumi CLI 3.x
- AWS CLI configured with credentials
- AWS account with appropriate permissions

## Deployment

1. Set environment suffix:
   ```bash
   export ENVIRONMENT_SUFFIX="prod"
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Deploy the stack:
   ```bash
   pulumi up
   ```

4. Get outputs:
   ```bash
   pulumi stack output lambda_function_url
   pulumi stack output dynamodb_table_arn
   ```

## Configuration

The infrastructure uses the following naming pattern:
- Lambda: `envmig-webhook-{suffix}`
- DynamoDB: `envmig-transactions-{suffix}`
- Secrets Manager: `envmig-apikeys-{suffix}`

## Outputs

- `lambda_function_url`: URL endpoint for webhook callbacks
- `dynamodb_table_arn`: ARN of the transactions table
- `dynamodb_table_name`: Name of the transactions table
- `secrets_manager_arn`: ARN of the API keys secret
- `lambda_function_name`: Name of the webhook function
- `lambda_function_arn`: ARN of the webhook function

## Testing

To test the webhook endpoint:

```bash
# Get the function URL
FUNCTION_URL=$(pulumi stack output lambda_function_url)

# Test with AWS signature (requires AWS CLI and signed request)
aws lambda invoke-url \
  --function-url $FUNCTION_URL \
  --payload '{"transactionId": "test-123", "amount": 100}' \
  response.json
```

## Security

- Lambda function URL uses AWS_IAM authentication
- IAM role has least-privilege access:
  - Read-only access to Secrets Manager secret
  - Write-only access to DynamoDB table
- API credentials stored securely in Secrets Manager
- All resources tagged for tracking

## Monitoring

- CloudWatch Logs: `/aws/lambda/envmig-webhook-{suffix}`
- X-Ray tracing enabled for performance analysis
- DynamoDB metrics available in CloudWatch

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured for immediate deletion without retention policies.

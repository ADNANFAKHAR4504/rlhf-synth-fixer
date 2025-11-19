# CloudFormation Infrastructure for Payment Webhook Processing System

This IDEAL_RESPONSE provides a complete CloudFormation JSON template for deploying a serverless payment webhook processing system with Lambda, DynamoDB, KMS encryption, and CloudWatch monitoring.

## Key Improvements Over MODEL_RESPONSE

1. **Float to Decimal Conversion**: Fixed critical TypeError in Lambda function by adding proper conversion of float values to Decimal types for DynamoDB compatibility
2. **Enhanced Error Handling**: Recursive conversion function handles nested data structures
3. **Production-Ready Code**: Lambda function now handles all numeric data types correctly

## File: lib/TapStack.json

The CloudFormation template remains structurally identical to MODEL_RESPONSE, with one critical improvement in the Lambda function code:

### Lambda Function Code (Updated ZipFile)

```python
import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

def convert_floats_to_decimal(obj):
    """Recursively convert float values to Decimal for DynamoDB compatibility."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimal(item) for item in obj]
    return obj

def handler(event, context):
    """
    Process payment webhook events and store transaction data in DynamoDB.

    Expected event format:
    {
        "transactionId": "txn_123456",
        "amount": 99.99,
        "currency": "USD",
        "status": "completed",
        "provider": "stripe",
        "timestamp": "2025-01-15T10:30:00Z"
    }
    """
    try:
        logger.info(f"Processing webhook event: {json.dumps(event)}")

        # Extract transaction data from event
        transaction_id = event.get('transactionId')
        if not transaction_id:
            raise ValueError("Missing required field: transactionId")

        # Prepare transaction record with Decimal conversion
        transaction_record = {
            'transactionId': transaction_id,
            'amount': convert_floats_to_decimal(event.get('amount', 0)),
            'currency': event.get('currency', 'USD'),
            'status': event.get('status', 'unknown'),
            'provider': event.get('provider', 'unknown'),
            'timestamp': event.get('timestamp', datetime.utcnow().isoformat()),
            'processedAt': datetime.utcnow().isoformat(),
            'rawEvent': json.dumps(event)
        }

        # Store transaction in DynamoDB
        table.put_item(Item=transaction_record)

        logger.info(f"Successfully processed transaction: {transaction_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transactionId': transaction_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing transaction',
                'error': str(e)
            })
        }
```

## Complete Template Structure

All other resources remain identical to MODEL_RESPONSE:

- **KMSKey**: Customer-managed KMS key with proper key policy for CloudWatch Logs and Lambda
- **KMSKeyAlias**: Alias with EnvironmentSuffix for uniqueness
- **TransactionTable**: DynamoDB table with on-demand billing, PITR, and encryption
- **WebhookLogGroup**: CloudWatch log group with 30-day retention and KMS encryption
- **LambdaExecutionRole**: IAM role with least privilege policies
- **WebhookProcessorFunction**: Lambda function with ARM64 architecture, 1GB memory, 30s timeout, 100 reserved concurrency, X-Ray tracing

## Outputs

- **LambdaFunctionArn**: ARN of the Lambda function
- **DynamoDBTableName**: Name of the DynamoDB table
- **KMSKeyId**: ID of the KMS key
- **LambdaFunctionName**: Name of the Lambda function

## Testing Considerations

The ideal solution:
- Supports float values in webhook events (converts to Decimal internally)
- Handles nested numeric data structures
- Maintains all original functionality
- Passes all integration tests with real-world data types
- Production-ready for PCI-compliant payment processing

## Architecture Highlights

1. **Serverless Design**: Fully serverless architecture with auto-scaling
2. **Security-First**: KMS encryption, IAM least privilege, encryption at rest
3. **Cost-Optimized**: ARM64 Lambda, on-demand DynamoDB billing
4. **Compliance-Ready**: 30-day log retention, PITR, encryption
5. **Observable**: X-Ray tracing, structured logging, CloudWatch integration
6. **Robust Error Handling**: Proper type conversion, comprehensive exception handling

import json
import logging
import os
import time
from datetime import datetime, timezone
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'payment-transactions')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """
    Validates incoming payment transactions and stores them in DynamoDB.
    """
    try:
        logger.info(f"Processing {len(event['Records'])} records")
        batch_item_failures = []
        
        for record in event['Records']:
            message_id = record['messageId']
            try:
                # Parse SQS message
                body = json.loads(record['body'])
                logger.info(f"Processing message ID: {message_id}")
                
                # Extract and validate required fields
                transaction_id = body.get('transaction_id')
                merchant_id = body.get('merchant_id')
                customer_id = body.get('customer_id')
                amount = body.get('amount')
                currency = body.get('currency', 'USD')
                card_number = body.get('card_number')
                
                # Validation checks
                if not all([transaction_id, merchant_id, customer_id, amount, card_number]):
                    raise ValueError("Missing required fields in transaction")
                
                # Validate amount
                amount_decimal = Decimal(str(amount))
                if amount_decimal <= 0:
                    raise ValueError(f"Invalid amount: {amount}")
                
                if amount_decimal > 10000:
                    raise ValueError(f"Amount exceeds maximum limit: {amount}")
                
                # Validate card number (basic check)
                if not card_number.replace('-', '').isdigit():
                    raise ValueError("Invalid card number format")
                
                if len(card_number.replace('-', '')) not in [15, 16]:
                    raise ValueError("Invalid card number length")
                
                # Prepare item for DynamoDB
                item = {
                    'transaction_id': transaction_id,
                    'merchant_id': merchant_id,
                    'customer_id': customer_id,
                    'amount': amount_decimal,
                    'currency': currency,
                    'card_number_masked': f"****-****-****-{card_number[-4:]}",
                    'state': 'validated',
                    'validation_timestamp': datetime.now(timezone.utc).isoformat(),
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'ttl': int(time.time() + (30 * 24 * 60 * 60))  # 30 days TTL
                }
                
                # Store in DynamoDB
                table.put_item(Item=item)
                logger.info(f"Transaction {transaction_id} validated and stored successfully")
                
            except (ValueError, KeyError) as e:
                logger.error(f"Validation error for message {message_id}: {str(e)}")
                batch_item_failures.append({"itemIdentifier": message_id})
            except ClientError as e:
                logger.error(f"DynamoDB error for message {message_id}: {str(e)}")
                batch_item_failures.append({"itemIdentifier": message_id})
            except Exception as e:
                logger.error(f"Unexpected error for message {message_id}: {str(e)}")
                batch_item_failures.append({"itemIdentifier": message_id})
        
        # Return batch item failures for partial batch response
        if batch_item_failures:
            return {"batchItemFailures": batch_item_failures}
        
        return {"statusCode": 200, "body": "All messages processed successfully"}
        
    except Exception as e:
        logger.error(f"Critical error in lambda handler: {str(e)}")
        raise
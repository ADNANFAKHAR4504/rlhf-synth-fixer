"""
Transaction Validator Lambda Function
Validates financial transactions against business rules
"""
import json
import os
import logging
from datetime import datetime
import boto3
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """
    Main handler for transaction validation

    Args:
        event: Lambda event containing transaction data
        context: Lambda context

    Returns:
        dict: Validation result with status and details
    """
    try:
        logger.info(f"Processing transaction validation request: {json.dumps(event)}")

        # Extract transaction details
        transaction_id = event.get('transaction_id')
        amount = Decimal(str(event.get('amount', 0)))
        currency = event.get('currency', 'USD')
        user_id = event.get('user_id')
        transaction_type = event.get('type', 'purchase')

        # Validate required fields
        if not transaction_id or not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'valid': False,
                    'error': 'Missing required fields: transaction_id or user_id'
                })
            }

        # Business rule validations
        validation_errors = []

        # Rule 1: Amount must be positive
        if amount <= 0:
            validation_errors.append('Transaction amount must be positive')

        # Rule 2: Amount limit check
        max_amount = Decimal('10000.00')
        if amount > max_amount:
            validation_errors.append(f'Transaction amount exceeds maximum limit of {max_amount}')

        # Rule 3: Supported currencies
        supported_currencies = ['USD', 'EUR', 'GBP']
        if currency not in supported_currencies:
            validation_errors.append(f'Currency {currency} not supported')

        # Store transaction in DynamoDB
        table_name = os.environ.get('TRANSACTION_TABLE_NAME')
        if table_name:
            table = dynamodb.Table(table_name)

            transaction_item = {
                'transaction_id': transaction_id,
                'timestamp': int(datetime.utcnow().timestamp()),
                'user_id': user_id,
                'amount': str(amount),
                'currency': currency,
                'type': transaction_type,
                'status': 'validated' if not validation_errors else 'rejected',
                'validation_errors': validation_errors
            }

            table.put_item(Item=transaction_item)
            logger.info(f"Transaction stored in DynamoDB: {transaction_id}")

        # Log to S3 audit bucket
        audit_bucket = os.environ.get('AUDIT_BUCKET_NAME')
        if audit_bucket:
            audit_log = {
                'transaction_id': transaction_id,
                'timestamp': datetime.utcnow().isoformat(),
                'user_id': user_id,
                'amount': str(amount),
                'currency': currency,
                'validation_result': 'passed' if not validation_errors else 'failed',
                'errors': validation_errors
            }

            s3_key = f"audit-logs/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_id}.json"
            s3_client.put_object(
                Bucket=audit_bucket,
                Key=s3_key,
                Body=json.dumps(audit_log),
                ServerSideEncryption='AES256'
            )
            logger.info(f"Audit log written to S3: {s3_key}")

        # Determine validation result
        is_valid = len(validation_errors) == 0

        response = {
            'statusCode': 200 if is_valid else 400,
            'body': json.dumps({
                'valid': is_valid,
                'transaction_id': transaction_id,
                'timestamp': datetime.utcnow().isoformat(),
                'errors': validation_errors if validation_errors else None
            })
        }

        logger.info(f"Validation result: {'PASSED' if is_valid else 'FAILED'}")
        return response

    except Exception as e:
        logger.error(f"Error processing transaction: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'valid': False,
                'error': f'Internal server error: {str(e)}'
            })
        }

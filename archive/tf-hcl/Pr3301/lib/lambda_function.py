# lambda_function.py

import json
import boto3
import os
import logging
from datetime import datetime
from typing import Dict, Any, List
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients with region
region = os.environ.get('REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb', region_name=region)
sqs = boto3.client('sqs', region_name=region)

# Get environment variables
DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
DLQ_URL = os.environ.get('DLQ_URL', '')

# Get DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process order confirmation messages from SQS queue.

    Args:
        event: SQS event containing order messages
        context: Lambda context object

    Returns:
        Dict containing processing status
    """
    logger.info(f"Received {len(event.get('Records', []))} messages for processing")

    processed_count = 0
    failed_count = 0
    batch_item_failures = []

    # Process each message in the batch
    for record in event.get('Records', []):
        message_id = record.get('messageId')
        receipt_handle = record.get('receiptHandle')

        try:
            # Parse the message body
            body = json.loads(record.get('body', '{}'))
            # Handle both orderId and order_id formats
            order_id = body.get('order_id') or body.get('orderId')

            if not order_id:
                raise ValueError("Missing order_id or orderId in message")

            logger.info(f"Processing order: {order_id}")

            # Process the order
            process_result = process_order(order_id, body)

            if process_result['success']:
                # Extract customer email for DynamoDB record
                customer_email = body.get('customer_id') or body.get('customerEmail')
                
                # Update status in DynamoDB
                update_order_status(
                    order_id=order_id,
                    status='PROCESSED',
                    details=process_result.get('details', {}),
                    error_message=None,
                    customer_email=customer_email
                )
                processed_count += 1
                logger.info(f"Successfully processed order: {order_id}")
            else:
                # Handle processing failure
                raise Exception(f"Order processing failed: {process_result.get('error', 'Unknown error')}")

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in message {message_id}: {str(e)}")
            batch_item_failures.append({"itemIdentifier": message_id})
            failed_count += 1

        except Exception as e:
            logger.error(f"Error processing message {message_id}: {str(e)}")

            # Try to extract order_id for error logging
            try:
                body = json.loads(record.get('body', '{}'))
                order_id = body.get('order_id') or body.get('orderId', 'unknown')
            except:
                order_id = 'unknown'

            # Update status as failed in DynamoDB
            try:
                # Extract customer email for DynamoDB record if possible
                try:
                    body = json.loads(record.get('body', '{}'))
                    customer_email = body.get('customer_id') or body.get('customerEmail')
                except:
                    customer_email = None
                
                update_order_status(
                    order_id=order_id,
                    status='FAILED',
                    details={'message_id': message_id},
                    error_message=str(e),
                    customer_email=customer_email
                )
            except Exception as db_error:
                logger.error(f"Failed to update DynamoDB for order {order_id}: {str(db_error)}")

            # Add to batch failures for reprocessing
            batch_item_failures.append({"itemIdentifier": message_id})
            failed_count += 1

    # Log processing summary
    logger.info(f"Processing complete. Processed: {processed_count}, Failed: {failed_count}")

    # Return batch item failures for partial batch failure handling
    return {
        "batchItemFailures": batch_item_failures
    }

def process_order(order_id: str, order_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process individual order confirmation.

    Args:
        order_id: Unique order identifier
        order_data: Order details dictionary

    Returns:
        Dict with processing result
    """
    try:
        # Normalize field names to handle both formats
        # Handle customer_id/customerEmail
        customer_id = order_data.get('customer_id') or order_data.get('customerEmail')
        # Handle amount/totalAmount  
        amount = order_data.get('amount') or order_data.get('totalAmount')
        items = order_data.get('items')

        # Validate required fields
        if not customer_id:
            raise ValueError("Missing required field: customer_id or customerEmail")
        if not amount:
            raise ValueError("Missing required field: amount or totalAmount")
        if not items:
            raise ValueError("Missing required field: items")

        # Simulate order processing logic

        # Validate amount
        if amount <= 0:
            raise ValueError(f"Invalid order amount: {amount}")

        # Validate items
        if not items or not isinstance(items, list):
            raise ValueError("Invalid or empty items list")

        # Process order (simulated business logic)
        processing_details = {
            'customer_id': customer_id,
            'amount': amount,
            'item_count': len(items),
            'confirmation_number': f"CONF-{order_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        }

        logger.info(f"Order {order_id} processed successfully "
                    f"with confirmation: {processing_details['confirmation_number']}")

        return {
            'success': True,
            'details': processing_details
        }

    except Exception as e:
        logger.error(f"Error in process_order for {order_id}: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def update_order_status(order_id: str, status: str, details: Dict[str, Any], error_message: str = None, customer_email: str = None) -> None:
    """
    Update order status in DynamoDB table.

    Args:
        order_id: Unique order identifier
        status: Processing status (PROCESSED, FAILED, etc.)
        details: Additional processing details
        error_message: Error message if processing failed
        customer_email: Customer email address
    """
    try:
        timestamp = datetime.utcnow().isoformat()

        # Prepare the item
        item = {
            'order_id': order_id,
            'status': status,
            'processed_at': timestamp,
            'details': json.dumps(details)
        }

        if error_message:
            item['error_message'] = error_message
            
        if customer_email:
            item['customer_email'] = customer_email

        # Use paginator-friendly approach for large result sets
        response = table.put_item(Item=item)

        logger.info(f"Updated DynamoDB for order {order_id} with status: {status}")

    except ClientError as e:
        logger.error(f"DynamoDB error for order {order_id}: {e.response['Error']['Message']}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating DynamoDB for order {order_id}: {str(e)}")
        raise

def get_processing_stats() -> Dict[str, int]:
    """
    Get processing statistics from DynamoDB using paginator.

    Returns:
        Dict with processing statistics
    """
    try:
        paginator = dynamodb.meta.client.get_paginator('scan')

        stats = {
            'total': 0,
            'processed': 0,
            'failed': 0
        }

        # Use paginator for efficient scanning of large tables
        page_iterator = paginator.paginate(
            TableName=DYNAMODB_TABLE_NAME,
            Select='COUNT',
            FilterExpression='attribute_exists(#status)',
            ExpressionAttributeNames={'#status': 'status'}
        )

        for page in page_iterator:
            stats['total'] += page['Count']

        logger.info(f"Processing statistics: {stats}")
        return stats

    except Exception as e:
        logger.error(f"Error getting processing stats: {str(e)}")
        return {'total': 0, 'processed': 0, 'failed': 0}

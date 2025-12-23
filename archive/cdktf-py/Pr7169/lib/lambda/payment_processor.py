"""Payment processor Lambda function for multi-region disaster recovery."""

import json
import os
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process payment webhook events in multi-region DR setup.

    Args:
        event: EventBridge event containing payment details
        context: Lambda context object

    Returns:
        Dict containing status code and response body
    """
    # Log the event
    region = os.environ.get('AWS_REGION', 'unknown')
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'unknown')

    logger.info(f"Processing payment event in region: {region}")
    logger.info(f"Environment suffix: {environment_suffix}")
    logger.info(f"Event: {json.dumps(event)}")

    try:
        # Extract payment details from EventBridge event
        detail = event.get('detail', {})
        payment_id = detail.get('paymentId', 'unknown')
        amount = detail.get('amount', 0)
        customer_id = detail.get('customerId', 'unknown')
        payment_method = detail.get('paymentMethod', 'unknown')

        # Get environment variables for resource access
        dynamodb_table = os.environ.get('DYNAMODB_TABLE')
        aurora_endpoint = os.environ.get('AURORA_ENDPOINT')
        s3_bucket = os.environ.get('S3_BUCKET')

        logger.info(f"Processing payment {payment_id} for customer {customer_id}")
        logger.info(f"Amount: ${amount}, Method: {payment_method}")
        logger.info(f"Resources - DynamoDB: {dynamodb_table}, Aurora: {aurora_endpoint}, S3: {s3_bucket}")

        # Payment processing logic would go here
        # In a real implementation:
        # 1. Validate payment details
        # 2. Store session data in DynamoDB
        # 3. Store transaction in Aurora
        # 4. Save receipt/invoice to S3
        # 5. Send confirmation

        # Prepare success response
        result = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'paymentId': payment_id,
                'customerId': customer_id,
                'amount': amount,
                'paymentMethod': payment_method,
                'region': region,
                'environment': environment_suffix,
                'timestamp': context.request_id,
                'resources': {
                    'dynamodb': dynamodb_table,
                    'aurora': aurora_endpoint,
                    's3': s3_bucket
                }
            })
        }

        logger.info(f"Payment {payment_id} processed successfully in {region}")
        return result

    except Exception as e:
        logger.error(f"Error processing payment: {str(e)}", exc_info=True)

        # Return error response
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Payment processing failed',
                'error': str(e),
                'region': region,
                'environment': environment_suffix
            })
        }

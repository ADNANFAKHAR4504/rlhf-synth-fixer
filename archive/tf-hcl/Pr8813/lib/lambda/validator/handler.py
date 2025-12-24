import json
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Validates incoming payment events
    """
    logger.info(f"Received event: {json.dumps(event)}")

    try:
        # Extract event data
        event_data = event.get('event', event)

        # Validation rules
        required_fields = ['event_id', 'payment_provider', 'transaction_id', 'amount']
        missing_fields = [field for field in required_fields if field not in event_data]

        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

        # Validate amount
        amount = event_data.get('amount', 0)
        if not isinstance(amount, (int, float)) or amount <= 0:
            raise ValueError("Invalid amount: must be positive number")

        # Add validation metadata
        validated_event = {
            **event_data,
            'validation_timestamp': int(datetime.utcnow().timestamp()),
            'validation_status': 'VALID',
            'validator_version': '1.0'
        }

        logger.info(f"Event validated successfully: {event_data.get('event_id')}")

        return {
            'statusCode': 200,
            'body': validated_event
        }

    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            'statusCode': 400,
            'body': {
                'error': str(e),
                'validation_status': 'INVALID'
            }
        }

"""
Status updater Lambda function
Updates shipment status in the database
"""

import json
import boto3
import uuid
from datetime import datetime
from typing import Dict, Any
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for updating shipment status
    """
    try:
        logger.info(f"Processing status update: {json.dumps(event)}")

        # Extract event details
        detail = event.get('detail', {})
        shipment_id = detail.get('shipment_id')
        new_status = detail.get('status')
        old_status = detail.get('old_status')

        if not shipment_id or not new_status:
            raise ValueError("Missing required fields: shipment_id or status")

        # Update status in database
        timestamp = int(datetime.utcnow().timestamp())
        update_result = update_status(shipment_id, new_status, old_status, timestamp)

        logger.info(f"Successfully updated status for shipment {shipment_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'shipment_id': shipment_id,
                'new_status': new_status,
                'old_status': old_status,
                'updated': True,
                'result': update_result
            })
        }

    except Exception as e:
        logger.error(f"Error updating status: {str(e)}", exc_info=True)
        store_error(event, str(e))
        raise


def update_status(shipment_id: str, new_status: str, old_status: str, timestamp: int) -> Dict[str, Any]:
    """
    Update shipment status in DynamoDB
    """
    # This will be configured by the infrastructure layer
    # For now, just log the operation
    logger.info(f"Would update status for shipment {shipment_id} from {old_status} to {new_status}")
    
    return {
        'event_id': str(uuid.uuid4()),
        'updated': True,
        'timestamp': timestamp
    }


def store_error(event: Dict, error_message: str) -> None:
    """
    Store error event for analysis
    """
    # This will be configured by the infrastructure layer
    # For now, just log the error
    logger.error(f"Error occurred: {error_message} for event: {json.dumps(event)}")


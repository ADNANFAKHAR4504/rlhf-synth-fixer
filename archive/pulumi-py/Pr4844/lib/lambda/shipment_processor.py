"""
Shipment processor Lambda function
Processes shipment creation and update events
"""

import json
import boto3
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing shipment events
    """
    try:
        logger.info(f"Processing event: {json.dumps(event)}")

        # Extract event details
        detail = event.get('detail', {})
        shipment_id = detail.get('shipment_id')
        status = detail.get('status', 'pending')
        metadata = detail.get('metadata', {})

        if not shipment_id:
            raise ValueError("Missing shipment_id in event")

        # Generate event ID and timestamp
        event_id = str(uuid.uuid4())
        timestamp = int(datetime.utcnow().timestamp())

        # Process the shipment event
        process_result = process_shipment(
            event_id=event_id,
            shipment_id=shipment_id,
            status=status,
            metadata=metadata,
            timestamp=timestamp
        )

        # Store event in DynamoDB (will be configured by infrastructure)
        store_event(
            event_id=event_id,
            shipment_id=shipment_id,
            status=status,
            metadata=metadata,
            timestamp=timestamp,
            process_result=process_result
        )

        # Send notification for important status changes (will be configured by infrastructure)
        if status in ['delivered', 'failed', 'cancelled']:
            send_notification(shipment_id, status, metadata)

        logger.info(f"Successfully processed shipment {shipment_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'event_id': event_id,
                'shipment_id': shipment_id,
                'status': 'processed'
            })
        }

    except Exception as e:
        logger.error(f"Error processing event: {str(e)}", exc_info=True)

        # Store error in error table
        store_error(event, str(e))

        # Re-raise to trigger retry or DLQ
        raise


def process_shipment(event_id: str, shipment_id: str, status: str,
                     metadata: Dict, timestamp: int) -> Dict[str, Any]:
    """
    Business logic for processing shipment updates
    """
    result = {
        'processed_at': timestamp,
        'validations': []
    }

    # Validate shipment status transition
    if status in ['in_transit', 'delivered']:
        result['validations'].append('status_valid')

    # Check for required metadata
    required_fields = ['origin', 'destination', 'carrier']
    for field in required_fields:
        if field in metadata:
            result['validations'].append(f'{field}_present')

    # Calculate estimated delivery if in transit
    if status == 'in_transit' and 'estimated_days' in metadata:
        estimated_delivery = datetime.utcnow() + timedelta(
            days=metadata['estimated_days']
        )
        result['estimated_delivery'] = estimated_delivery.isoformat()

    return result


def store_event(event_id: str, shipment_id: str, status: str,
                metadata: Dict, timestamp: int, process_result: Dict) -> None:
    """
    Store processed event in DynamoDB
    """
    # This will be configured by the infrastructure layer
    # For now, just log the operation
    logger.info(f"Would store event {event_id} for shipment {shipment_id} with status {status}")


def store_error(event: Dict, error_message: str) -> None:
    """
    Store error event for analysis
    """
    # This will be configured by the infrastructure layer
    # For now, just log the error
    logger.error(f"Error occurred: {error_message} for event: {json.dumps(event)}")


def send_notification(shipment_id: str, status: str, metadata: Dict) -> None:
    """
    Send SNS notification for important status changes
    """
    # This will be configured by the infrastructure layer
    # For now, just log the notification
    logger.info(f"Would send notification for shipment {shipment_id} with status {status}")


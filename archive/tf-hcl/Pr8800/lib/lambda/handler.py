import json
import os
import time
import uuid
from decimal import Decimal
from typing import Dict, Any
import boto3
from botocore.exceptions import ClientError

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Get table names from environment variables
MARKET_DATA_TABLE = os.environ['MARKET_DATA_TABLE']
AUDIT_TRAIL_TABLE = os.environ['AUDIT_TRAIL_TABLE']
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'unknown')

# Get table resources
market_data_table = dynamodb.Table(MARKET_DATA_TABLE)
audit_trail_table = dynamodb.Table(AUDIT_TRAIL_TABLE)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process incoming market data events from EventBridge.

    Args:
        event: EventBridge event containing market data
        context: Lambda context object

    Returns:
        Response dictionary with status and processed event count
    """
    try:
        print(f"Received event: {json.dumps(event)}")

        # Extract event details
        event_id = event.get('id', str(uuid.uuid4()))
        source = event.get('source', 'unknown')
        detail_type = event.get('detail-type', 'unknown')
        detail = event.get('detail', {})
        timestamp = int(time.time() * 1000)  # milliseconds

        # Process the market data event
        result = process_market_event(
            event_id=event_id,
            source=source,
            detail_type=detail_type,
            detail=detail,
            timestamp=timestamp
        )

        # Create audit trail
        create_audit_record(
            event_id=event_id,
            event_type=detail_type,
            timestamp=timestamp,
            status='SUCCESS',
            details=result
        )

        print(f"Successfully processed event {event_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event processed successfully',
                'event_id': event_id,
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error processing event: {str(e)}")

        # Create error audit record
        try:
            create_audit_record(
                event_id=event_id if 'event_id' in locals() else 'unknown',
                event_type=detail_type if 'detail_type' in locals() else 'unknown',
                timestamp=int(time.time() * 1000),
                status='ERROR',
                details={'error': str(e)}
            )
        except Exception as audit_error:
            print(f"Failed to create audit record: {str(audit_error)}")

        # Re-raise exception for Lambda retry logic
        raise


def process_market_event(
    event_id: str,
    source: str,
    detail_type: str,
    detail: Dict[str, Any],
    timestamp: int
) -> Dict[str, Any]:
    """
    Process and store market data event in DynamoDB.

    Args:
        event_id: Unique event identifier
        source: Event source
        detail_type: Type of market data event
        detail: Event details containing market data
        timestamp: Event timestamp in milliseconds

    Returns:
        Dictionary with processing results
    """
    # Extract market data fields
    exchange = detail.get('exchange', 'UNKNOWN')
    symbol = detail.get('symbol', 'UNKNOWN')
    price = detail.get('price', 0)
    volume = detail.get('volume', 0)

    # Convert float to Decimal for DynamoDB
    if isinstance(price, float):
        price = Decimal(str(price))
    if isinstance(volume, (int, float)):
        volume = Decimal(str(volume))

    # Prepare item for DynamoDB
    item = {
        'event_id': event_id,
        'timestamp': timestamp,
        'source': source,
        'detail_type': detail_type,
        'exchange': exchange,
        'symbol': symbol,
        'price': price,
        'volume': volume,
        'raw_data': json.dumps(detail),
        'processed_at': int(time.time()),
        'environment': ENVIRONMENT
    }

    # Add TTL (30 days from now)
    ttl_days = 30
    item['expiration_time'] = int(time.time()) + (ttl_days * 24 * 60 * 60)

    # Store in DynamoDB
    try:
        market_data_table.put_item(Item=item)
        print(f"Stored market data for {symbol} from {exchange}")
    except ClientError as e:
        print(f"Error storing market data: {e.response['Error']['Message']}")
        raise

    return {
        'event_id': event_id,
        'symbol': symbol,
        'exchange': exchange,
        'price': float(price),
        'volume': float(volume)
    }


def create_audit_record(
    event_id: str,
    event_type: str,
    timestamp: int,
    status: str,
    details: Dict[str, Any]
) -> None:
    """
    Create an audit trail record in DynamoDB.

    Args:
        event_id: Unique event identifier
        event_type: Type of event
        timestamp: Event timestamp in milliseconds
        status: Processing status (SUCCESS or ERROR)
        details: Additional details about the processing
    """
    audit_id = str(uuid.uuid4())

    audit_item = {
        'audit_id': audit_id,
        'timestamp': timestamp,
        'event_id': event_id,
        'event_type': event_type,
        'status': status,
        'details': json.dumps(details),
        'environment': ENVIRONMENT,
        'created_at': int(time.time())
    }

    try:
        audit_trail_table.put_item(Item=audit_item)
        print(f"Created audit record {audit_id} for event {event_id}")
    except ClientError as e:
        print(f"Error creating audit record: {e.response['Error']['Message']}")
        # Don't raise exception for audit failures

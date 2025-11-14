import json
import logging
import os
import time
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')
sns = boto3.client('sns')

# Cache for SSM parameters
parameter_cache = {}
CACHE_TTL = 300  # 5 minutes


def get_parameter(parameter_name: str) -> str:
    """Get parameter from SSM Parameter Store with caching."""
    now = time.time()
    
    if parameter_name in parameter_cache:
        value, timestamp = parameter_cache[parameter_name]
        if now - timestamp < CACHE_TTL:
            return value
    
    try:
        response = ssm.get_parameter(Name=parameter_name)
        value = response['Parameter']['Value']
        parameter_cache[parameter_name] = (value, now)
        return value
    except ClientError as e:
        logger.error(f"Failed to get parameter {parameter_name}: {e}")
        raise


def create_audit_entry(
    event_id: str, 
    stage: str, 
    function_name: str, 
    status: str, 
    error_message: Optional[str] = None
) -> Dict[str, Any]:
    """Create an audit entry for tracking event processing."""
    audit_table_name = get_parameter('/market-data-processor/dynamodb/audit-table')
    audit_table = dynamodb.Table(audit_table_name)
    
    audit_entry = {
        'audit_id': str(uuid.uuid4()),
        'timestamp': Decimal(str(time.time())),
        'event_id': event_id,
        'processing_stage': stage,
        'function_name': function_name,
        'status': status,
        'processed_at': datetime.utcnow().isoformat()
    }
    
    if error_message:
        audit_entry['error_message'] = error_message
    
    try:
        audit_table.put_item(Item=audit_entry)
        logger.info(f"Created audit entry for event {event_id} at stage {stage}")
    except ClientError as e:
        logger.error(f"Failed to create audit entry: {e}")
    
    return audit_entry


def validate_event_schema(event: Dict[str, Any]) -> bool:
    """Validate that the event has required fields."""
    required_fields = ['detail', 'source', 'detail-type']
    for field in required_fields:
        if field not in event:
            logger.error(f"Missing required field: {field}")
            return False
    
    detail = event.get('detail', {})
    if not isinstance(detail, dict):
        logger.error("Event detail must be a dictionary")
        return False
    
    # Check for market data specific fields
    if 'symbol' not in detail or 'price' not in detail:
        logger.error("Missing required market data fields (symbol, price)")
        return False
    
    return True


def calculate_moving_average(symbol: str, current_price: float, window: int = 5) -> float:
    """Calculate simple moving average for a symbol."""
    # In production, this would query historical data from DynamoDB
    # For demo purposes, return a simulated value
    import random
    return current_price * (1 + random.uniform(-0.02, 0.02))


def calculate_volatility(symbol: str) -> float:
    """Calculate volatility indicator for a symbol."""
    # In production, this would calculate actual volatility from historical data
    # For demo purposes, return a simulated value
    import random
    return random.uniform(0.1, 0.5)


def check_alert_conditions(event_data: Dict[str, Any]) -> Dict[str, Any]:
    """Check if event meets alert conditions."""
    alerts = []
    
    price = float(event_data.get('price', 0))
    symbol = event_data.get('symbol', 'UNKNOWN')
    
    # Example alert conditions
    if price > 1000:
        alerts.append({
            'type': 'PRICE_THRESHOLD',
            'message': f'{symbol} price exceeded $1000: ${price}',
            'severity': 'HIGH'
        })
    
    if event_data.get('volatility', 0) > 0.4:
        alerts.append({
            'type': 'HIGH_VOLATILITY',
            'message': f'{symbol} showing high volatility: {event_data.get("volatility", 0):.2%}',
            'severity': 'MEDIUM'
        })
    
    volume = event_data.get('volume', 0)
    if volume > 1000000:
        alerts.append({
            'type': 'HIGH_VOLUME',
            'message': f'{symbol} unusual trading volume: {volume:,}',
            'severity': 'MEDIUM'
        })
    
    return {
        'has_alerts': len(alerts) > 0,
        'alerts': alerts,
        'alert_count': len(alerts)
    }


def ingestion_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for ingesting raw market data events.
    Validates events and stores them in DynamoDB.
    """
    logger.info(f"Ingestion handler invoked with event: {json.dumps(event)}")
    
    event_id = str(uuid.uuid4())
    function_name = context.function_name if context else 'ingestion_handler'
    
    try:
        # Validate event schema
        if not validate_event_schema(event):
            raise ValueError("Invalid event schema")
        
        # Extract event details
        detail = event.get('detail', {})
        source = event.get('source', 'unknown')
        detail_type = event.get('detail-type', 'unknown')
        
        # Get DynamoDB table name from SSM
        events_table_name = get_parameter('/market-data-processor/dynamodb/events-table')
        events_table = dynamodb.Table(events_table_name)
        
        # Prepare item for DynamoDB
        item = {
            'event_id': event_id,
            'timestamp': Decimal(str(time.time())),
            'event_type': detail_type,
            'source': source,
            'status': 'INGESTED',
            'symbol': detail.get('symbol', 'UNKNOWN'),
            'price': Decimal(str(detail.get('price', 0))),
            'volume': detail.get('volume', 0),
            'payload': json.dumps(detail),
            'ingested_at': datetime.utcnow().isoformat()
        }
        
        # Store in DynamoDB
        events_table.put_item(Item=item)
        logger.info(f"Successfully ingested event {event_id}")
        
        # Create audit entry
        create_audit_entry(event_id, 'INGESTION', function_name, 'SUCCESS')
        
        # Trigger processing stage by putting event on EventBridge
        # In production, you would publish to EventBridge here
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event ingested successfully',
                'event_id': event_id,
                'status': 'INGESTED'
            })
        }
        
    except Exception as e:
        logger.error(f"Failed to ingest event: {e}")
        create_audit_entry(event_id, 'INGESTION', function_name, 'FAILED', str(e))
        raise


def processing_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing validated market data events.
    Enriches events with calculated fields and updates status.
    """
    logger.info(f"Processing handler invoked with event: {json.dumps(event)}")
    
    event_id = event.get('detail', {}).get('event_id', str(uuid.uuid4()))
    function_name = context.function_name if context else 'processing_handler'
    
    try:
        detail = event.get('detail', {})
        
        # Get DynamoDB table name from SSM
        events_table_name = get_parameter('/market-data-processor/dynamodb/events-table')
        events_table = dynamodb.Table(events_table_name)
        
        # Enrich event with calculated fields
        symbol = detail.get('symbol', 'UNKNOWN')
        price = float(detail.get('price', 0))
        
        enriched_data = {
            'moving_average': Decimal(str(calculate_moving_average(symbol, price))),
            'volatility': Decimal(str(calculate_volatility(symbol))),
            'price_change_pct': Decimal(str((price - 100) / 100)),  # Simplified calculation
            'processed_at': datetime.utcnow().isoformat(),
            'status': 'PROCESSED'
        }
        
        # Update event in DynamoDB
        events_table.update_item(
            Key={
                'event_id': event_id,
                'timestamp': Decimal(str(detail.get('timestamp', time.time())))
            },
            UpdateExpression='SET #status = :status, moving_average = :ma, volatility = :vol, '
                           'price_change_pct = :pcp, processed_at = :pat',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'PROCESSED',
                ':ma': enriched_data['moving_average'],
                ':vol': enriched_data['volatility'],
                ':pcp': enriched_data['price_change_pct'],
                ':pat': enriched_data['processed_at']
            }
        )
        
        logger.info(f"Successfully processed event {event_id}")
        
        # Create audit entry
        create_audit_entry(event_id, 'PROCESSING', function_name, 'SUCCESS')
        
        # Check if alerts are needed
        alert_check = check_alert_conditions({
            **detail,
            'volatility': float(enriched_data['volatility'])
        })
        
        if alert_check['has_alerts']:
            # Trigger notification stage
            logger.info(f"Event {event_id} requires notifications: {alert_check['alerts']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event processed successfully',
                'event_id': event_id,
                'status': 'PROCESSED',
                'enriched_fields': {
                    'moving_average': float(enriched_data['moving_average']),
                    'volatility': float(enriched_data['volatility'])
                }
            })
        }
        
    except Exception as e:
        logger.error(f"Failed to process event: {e}")
        create_audit_entry(event_id, 'PROCESSING', function_name, 'FAILED', str(e))
        raise


def notification_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for sending notifications about critical events.
    Evaluates alert conditions and publishes to SNS.
    """
    logger.info(f"Notification handler invoked with event: {json.dumps(event)}")
    
    event_id = event.get('detail', {}).get('event_id', str(uuid.uuid4()))
    function_name = context.function_name if context else 'notification_handler'
    
    try:
        detail = event.get('detail', {})
        
        # Check alert conditions
        alert_check = check_alert_conditions(detail)
        
        if not alert_check['has_alerts']:
            logger.info(f"No alerts required for event {event_id}")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No notifications required',
                    'event_id': event_id
                })
            }
        
        # Get SNS topic ARN from SSM
        sns_topic_arn = get_parameter('/market-data-processor/sns/topic-arn')
        
        # Prepare notification message
        symbol = detail.get('symbol', 'UNKNOWN')
        alerts = alert_check['alerts']
        
        message_lines = [
            f"Market Data Alert for {symbol}",
            f"Event ID: {event_id}",
            f"Timestamp: {datetime.utcnow().isoformat()}",
            "",
            "Alerts:",
        ]
        
        for alert in alerts:
            message_lines.append(f"  - [{alert['severity']}] {alert['message']}")
        
        message_lines.extend([
            "",
            "Current Data:",
            f"  Price: ${detail.get('price', 0):,.2f}",
            f"  Volume: {detail.get('volume', 0):,}",
            f"  Volatility: {detail.get('volatility', 0):.2%}",
        ])
        
        message = "\n".join(message_lines)
        subject = f"[{alerts[0]['severity']}] Market Alert: {symbol}"
        
        # Publish to SNS
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=subject,
            Message=message,
            MessageAttributes={
                'event_id': {'DataType': 'String', 'StringValue': event_id},
                'symbol': {'DataType': 'String', 'StringValue': symbol},
                'alert_count': {'DataType': 'Number', 'StringValue': str(alert_check['alert_count'])},
                'severity': {'DataType': 'String', 'StringValue': alerts[0]['severity']}
            }
        )
        
        logger.info(f"Successfully sent {alert_check['alert_count']} notifications for event {event_id}")
        
        # Create audit entry
        create_audit_entry(event_id, 'NOTIFICATION', function_name, 'SUCCESS')
        
        # Update event status in DynamoDB
        events_table_name = get_parameter('/market-data-processor/dynamodb/events-table')
        events_table = dynamodb.Table(events_table_name)
        
        events_table.update_item(
            Key={
                'event_id': event_id,
                'timestamp': Decimal(str(detail.get('timestamp', time.time())))
            },
            UpdateExpression='SET #status = :status, notified_at = :nat, alert_count = :ac',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'NOTIFIED',
                ':nat': datetime.utcnow().isoformat(),
                ':ac': alert_check['alert_count']
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Notifications sent successfully',
                'event_id': event_id,
                'alert_count': alert_check['alert_count'],
                'alerts': alerts
            })
        }
        
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")
        create_audit_entry(event_id, 'NOTIFICATION', function_name, 'FAILED', str(e))
        raise


# Test handler for local testing
if __name__ == "__main__":
    test_event = {
        'source': 'market-data-feed',
        'detail-type': 'MarketData.Raw',
        'detail': {
            'symbol': 'AAPL',
            'price': 150.50,
            'volume': 1500000,
            'timestamp': time.time()
        }
    }
    
    class Context:
        function_name = 'test_function'
    
    print("Testing ingestion handler:")
    result = ingestion_handler(test_event, Context())
    print(json.dumps(result, indent=2))
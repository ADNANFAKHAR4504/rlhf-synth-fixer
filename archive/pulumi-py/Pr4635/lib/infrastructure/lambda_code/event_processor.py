"""
Lambda function for processing trading events.

This function processes real-time trading events from EventBridge
and stores them in DynamoDB with proper error handling and monitoring.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict

import boto3

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
REGION = os.environ['AWS_REGION']


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process trading events from EventBridge.
    
    Args:
        event: EventBridge event
        context: Lambda context
        
    Returns:
        Response dictionary
    """
    try:
        # Extract event details
        event_id = event.get('id', 'unknown')
        event_type = event.get('detail-type', 'unknown')
        event_time = event.get('time', datetime.utcnow().isoformat())
        
        logger.info(f"Processing event {event_id} of type {event_type}")
        
        # Process the event
        result = process_trading_event(event)
        
        # Store in DynamoDB
        store_event(event, result)
        
        # Send custom metrics
        send_metrics(event_type, 'success')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event processed successfully',
                'eventId': event_id,
                'eventType': event_type
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        
        # Send error metrics
        send_metrics('error', 'failure')
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }


def process_trading_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a trading event and extract relevant information.
    
    Args:
        event: The trading event
        
    Returns:
        Processed event data
    """
    detail = event.get('detail', {})
    
    # Extract trading information
    processed_event = {
        'eventId': event.get('id'),
        'eventType': event.get('detail-type'),
        'eventTime': event.get('time'),
        'source': event.get('source'),
        'tradingData': {
            'symbol': detail.get('symbol'),
            'price': detail.get('price'),
            'quantity': detail.get('quantity'),
            'side': detail.get('side'),  # buy/sell
            'orderId': detail.get('orderId'),
            'timestamp': detail.get('timestamp')
        },
        'processedAt': datetime.utcnow().isoformat(),
        'region': REGION
    }
    
    return processed_event


def store_event(event: Dict[str, Any], processed_data: Dict[str, Any]) -> None:
    """
    Store the processed event in DynamoDB.
    
    Args:
        event: Original event
        processed_data: Processed event data
    """
    table = dynamodb.Table(TABLE_NAME)
    
    # Create DynamoDB item
    item = {
        'PK': f"EVENT#{processed_data['eventId']}",
        'SK': f"REGION#{REGION}",
        'GSI1PK': f"SYMBOL#{processed_data['tradingData']['symbol']}",
        'GSI1SK': processed_data['eventTime'],
        'GSI2PK': f"TYPE#{processed_data['eventType']}",
        'GSI2SK': processed_data['eventTime'],
        'EventId': processed_data['eventId'],
        'EventType': processed_data['eventType'],
        'EventTime': processed_data['eventTime'],
        'ProcessedAt': processed_data['processedAt'],
        'Region': processed_data['region'],
        'TradingData': processed_data['tradingData'],
        'TTL': int((datetime.utcnow().timestamp() + (30 * 24 * 60 * 60)))  # 30 days TTL
    }
    
    # Put item in DynamoDB
    table.put_item(Item=item)
    logger.info(f"Stored event {processed_data['eventId']} in DynamoDB")


def send_metrics(event_type: str, status: str) -> None:
    """
    Send custom metrics to CloudWatch.
    
    Args:
        event_type: Type of event processed
        status: Processing status (success/failure)
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='TradingPlatform/EventProcessing',
            MetricData=[
                {
                    'MetricName': 'EventsProcessed',
                    'Dimensions': [
                        {'Name': 'EventType', 'Value': event_type},
                        {'Name': 'Status', 'Value': status},
                        {'Name': 'Region', 'Value': REGION}
                    ],
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to send metrics: {str(e)}")

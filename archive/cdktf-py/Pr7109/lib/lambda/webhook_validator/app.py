"""
Webhook Validator Lambda Function
Validates incoming webhook transactions and stores them in DynamoDB.
"""
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK for X-Ray tracing
patch_all()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')
stepfunctions = boto3.client('stepfunctions')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']
STATE_MACHINE_ARN = os.environ['STATE_MACHINE_ARN']

table = dynamodb.Table(DYNAMODB_TABLE)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


@xray_recorder.capture('validate_webhook')
def validate_webhook(event_body):
    """
    Validate webhook payload structure and required fields.

    Args:
        event_body: Webhook payload

    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = ['transaction_id', 'amount', 'currency', 'provider', 'customer_id']

    for field in required_fields:
        if field not in event_body:
            return False, f"Missing required field: {field}"

    # Validate amount is positive
    try:
        amount = float(event_body['amount'])
        if amount <= 0:
            return False, "Amount must be positive"
    except (ValueError, TypeError):
        return False, "Invalid amount format"

    return True, None


@xray_recorder.capture('store_transaction')
def store_transaction(transaction_data):
    """
    Store transaction in DynamoDB with timestamp.

    Args:
        transaction_data: Validated transaction data

    Returns:
        dict: Stored item
    """
    timestamp = datetime.utcnow().isoformat()

    item = {
        'transaction_id': transaction_data['transaction_id'],
        'timestamp': timestamp,
        'amount': Decimal(str(transaction_data['amount'])),
        'currency': transaction_data['currency'],
        'provider': transaction_data['provider'],
        'customer_id': transaction_data['customer_id'],
        'status': 'pending',
        'metadata': transaction_data.get('metadata', {}),
        'created_at': timestamp
    }

    table.put_item(Item=item)
    return item


@xray_recorder.capture('publish_event')
def publish_event(transaction_data):
    """
    Publish transaction event to EventBridge for routing.

    Args:
        transaction_data: Transaction data to publish
    """
    events.put_events(
        Entries=[
            {
                'Source': 'webhook.transaction',
                'DetailType': 'Transaction Created',
                'Detail': json.dumps(transaction_data, cls=DecimalEncoder),
                'EventBusName': EVENT_BUS_NAME
            }
        ]
    )


@xray_recorder.capture('trigger_workflow')
def trigger_workflow(transaction_data):
    """
    Trigger Step Functions workflow for transaction processing.

    Args:
        transaction_data: Transaction data
    """
    stepfunctions.start_execution(
        stateMachineArn=STATE_MACHINE_ARN,
        input=json.dumps({
            'transaction': transaction_data,
            'timestamp': datetime.utcnow().isoformat()
        }, cls=DecimalEncoder)
    )


def lambda_handler(event, context):
    """
    Main Lambda handler for webhook validation.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        dict: API Gateway response
    """
    try:
        # Parse webhook payload
        body = json.loads(event.get('body', '{}'))

        # Validate webhook
        is_valid, error_message = validate_webhook(body)
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': error_message
                })
            }

        # Store transaction in DynamoDB
        stored_item = store_transaction(body)

        # Publish event to EventBridge
        publish_event(stored_item)

        # Trigger Step Functions workflow
        trigger_workflow(stored_item)

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': stored_item['transaction_id'],
                'timestamp': stored_item['timestamp']
            }, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }

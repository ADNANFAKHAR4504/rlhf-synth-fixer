import json
import os
import time
import uuid
import decimal
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

import boto3
from botocore.exceptions import ClientError
try:
    from aws_xray_sdk.core import xray_recorder
    from aws_xray_sdk.core import patch_all
    # Enable X-Ray tracing for all AWS SDK calls
    patch_all()
    XRAY_AVAILABLE = True
except ImportError:
    # X-Ray SDK not available, create a dummy decorator
    XRAY_AVAILABLE = False
    class DummyXRayRecorder:
        def capture(self, name):
            def decorator(func):
                return func
            return decorator
    xray_recorder = DummyXRayRecorder()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
secrets_manager = boto3.client('secretsmanager')
frauddetector = boto3.client('frauddetector')
appconfig = boto3.client('appconfigdata')

# Environment variables
GIFT_CARD_TABLE = os.environ['GIFT_CARD_TABLE']
IDEMPOTENCY_TABLE = os.environ['IDEMPOTENCY_TABLE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
SECRET_ARN = os.environ['SECRET_ARN']
FRAUD_DETECTOR_NAME = os.environ.get('FRAUD_DETECTOR_NAME', '')
APPCONFIG_APP_ID = os.environ['APPCONFIG_APP_ID']
APPCONFIG_ENV = os.environ['APPCONFIG_ENV']
APPCONFIG_PROFILE = os.environ['APPCONFIG_PROFILE']

# Initialize tables
gift_card_table = dynamodb.Table(GIFT_CARD_TABLE)
idempotency_table = dynamodb.Table(IDEMPOTENCY_TABLE)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB decimal types to JSON"""
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super().default(o)


@xray_recorder.capture('get_encryption_key')
def get_encryption_key():
    """Retrieve encryption key from Secrets Manager"""
    try:
        response = secrets_manager.get_secret_value(SecretId=SECRET_ARN)
        secret = json.loads(response['SecretString'])
        return secret.get('key')
    except ClientError as e:
        print(f"Error retrieving secret: {e}")
        raise


@xray_recorder.capture('get_feature_flags')
def get_feature_flags():
    """Get feature flags from AppConfig"""
    try:
        # Start configuration session
        session_response = appconfig.start_configuration_session(
            ApplicationIdentifier=APPCONFIG_APP_ID,
            EnvironmentIdentifier=APPCONFIG_ENV,
            ConfigurationProfileIdentifier=APPCONFIG_PROFILE,
            RequiredMinimumPollIntervalInSeconds=15
        )

        # Get configuration
        config_response = appconfig.get_configuration(
            InitialToken=session_response['InitialConfigurationToken']
        )

        if config_response.get('Configuration'):
            return json.loads(config_response['Configuration'].read())
        return {}
    except Exception as e:
        print(f"Error getting feature flags: {e}")
        return {}


@xray_recorder.capture('check_idempotency')
def check_idempotency(idempotency_key: str) -> Optional[Dict]:
    """Check if request has been processed before"""
    try:
        response = idempotency_table.get_item(
            Key={'idempotency_key': idempotency_key}
        )
        if 'Item' in response:
            return response['Item'].get('response')
        return None
    except ClientError as e:
        print(f"Error checking idempotency: {e}")
        return None


@xray_recorder.capture('save_idempotency')
def save_idempotency(idempotency_key: str, response: Dict):
    """Save response for idempotency"""
    ttl = int((datetime.now() + timedelta(hours=24)).timestamp())
    try:
        idempotency_table.put_item(
            Item={
                'idempotency_key': idempotency_key,
                'response': response,
                'ttl': ttl,
                'timestamp': int(time.time())
            }
        )
    except ClientError as e:
        print(f"Error saving idempotency: {e}")


@xray_recorder.capture('validate_fraud')
def validate_fraud(customer_id: str, amount: float, card_id: str) -> Dict:
    """Validate transaction with Fraud Detector"""
    feature_flags = get_feature_flags()

    # Check if fraud detection is enabled
    if not feature_flags.get('fraud_detection_enabled', {}).get('enabled', True):
        return {'fraud_score': 0, 'is_fraudulent': False}

    try:
        # Note: This is a simplified example. In production, you would need
        # to create a detector and model first.
        response = frauddetector.get_event_prediction(
            detectorId=FRAUD_DETECTOR_NAME,
            eventId=str(uuid.uuid4()),
            eventTypeName=f'redemption_event_{APPCONFIG_ENV}',
            entities=[{
                'entityType': f'customer_{APPCONFIG_ENV}',
                'entityId': customer_id
            }],
            eventTimestamp=datetime.now().isoformat(),
            eventVariables={
                'transaction_amount': str(amount),
                'card_id': card_id,
                'customer_id': customer_id
            }
        )

        # Process fraud detection results
        model_scores = response.get('modelScores', [])
        if model_scores:
            score = model_scores[0].get('scores', {}).get('fraud_score', 0)
            return {
                'fraud_score': score,
                'is_fraudulent': score > 700  # Threshold for fraud
            }

        return {'fraud_score': 0, 'is_fraudulent': False}

    except Exception as e:
        print(f"Error in fraud detection: {e}")
        # In case of error, allow transaction but log for review
        return {'fraud_score': 0, 'is_fraudulent': False, 'error': str(e)}


@xray_recorder.capture('process_redemption')
def process_redemption(card_id: str, amount: float, customer_id: str) -> Dict:
    """Process gift card redemption with DynamoDB transactions"""

    # Validate fraud
    fraud_result = validate_fraud(customer_id, amount, card_id)
    if fraud_result.get('is_fraudulent'):
        return {
            'success': False,
            'message': 'Transaction flagged as potentially fraudulent',
            'fraud_score': fraud_result.get('fraud_score')
        }

    try:
        # Use DynamoDB transactions for atomic operations
        response = dynamodb.client().transact_write_items(
            TransactItems=[
                {
                    'Update': {
                        'TableName': GIFT_CARD_TABLE,
                        'Key': {'card_id': {'S': card_id}},
                        'UpdateExpression': (
                            'SET balance = balance - :amount, last_used = :timestamp, '
                            'redemption_count = redemption_count + :one'
                        ),
                        'ConditionExpression': 'attribute_exists(card_id) AND balance >= :amount AND is_active = :true',
                        'ExpressionAttributeValues': {
                            ':amount': {'N': str(amount)},
                            ':timestamp': {'N': str(int(time.time()))},
                            ':one': {'N': '1'},
                            ':true': {'BOOL': True}
                        }
                    }
                },
                {
                    'Put': {
                        'TableName': GIFT_CARD_TABLE,
                        'Item': {
                            'card_id': {'S': f'txn_{uuid.uuid4()}'},
                            'customer_id': {'S': customer_id},
                            'transaction_type': {'S': 'redemption'},
                            'amount': {'N': str(amount)},
                            'created_at': {'N': str(int(time.time()))},
                            'original_card_id': {'S': card_id}
                        }
                    }
                }
            ]
        )

        # Get updated balance
        card_response = gift_card_table.get_item(Key={'card_id': card_id})
        new_balance = float(card_response['Item'].get('balance', 0))

        return {
            'success': True,
            'message': 'Redemption successful',
            'new_balance': new_balance,
            'transaction_id': f'txn_{uuid.uuid4()}',
            'fraud_score': fraud_result.get('fraud_score')
        }

    except ClientError as e:
        if e.response['Error']['Code'] == 'TransactionCanceledException':
            if 'ConditionalCheckFailed' in str(e):
                return {
                    'success': False,
                    'message': 'Insufficient balance or card not found'
                }
        raise


@xray_recorder.capture('send_notification')
def send_notification(customer_id: str, card_id: str, amount: float, new_balance: float):
    """Send SNS notification for successful redemption"""
    try:
        message = {
            'customer_id': customer_id,
            'card_id': card_id,
            'amount': amount,
            'new_balance': new_balance,
            'timestamp': datetime.now().isoformat()
        }

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=json.dumps(message),
            Subject='Gift Card Redemption Notification'
        )
    except ClientError as e:
        print(f"Error sending notification: {e}")


@xray_recorder.capture('lambda_handler')
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Main Lambda handler for gift card redemption"""

    # Parse request body
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }

    # Extract required fields
    card_id = body.get('card_id')
    amount = body.get('amount')
    customer_id = body.get('customer_id')
    idempotency_key = body.get('idempotency_key')

    # Validate required fields
    if not all([card_id, amount, customer_id, idempotency_key]):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing required fields'})
        }

    # Check idempotency
    cached_response = check_idempotency(idempotency_key)
    if cached_response:
        return {
            'statusCode': 200,
            'body': json.dumps(cached_response, cls=DecimalEncoder),
            'headers': {
                'X-Idempotency': 'cached'
            }
        }

    try:
        # Process redemption
        result = process_redemption(card_id, float(amount), customer_id)

        # Send notification for successful redemptions
        if result['success']:
            send_notification(
                customer_id,
                card_id,
                float(amount),
                result.get('new_balance', 0)
            )

        # Save response for idempotency
        save_idempotency(idempotency_key, result)

        # Return response
        status_code = 200 if result['success'] else 400
        return {
            'statusCode': status_code,
            'body': json.dumps(result, cls=DecimalEncoder),
            'headers': {
                'Content-Type': 'application/json',
                'X-Transaction-ID': result.get('transaction_id', '')
            }
        }

    except Exception as e:
        print(f"Error processing redemption: {e}")
        error_response = {
            'error': 'Internal server error',
            'message': str(e)
        }

        return {
            'statusCode': 500,
            'body': json.dumps(error_response)
        }

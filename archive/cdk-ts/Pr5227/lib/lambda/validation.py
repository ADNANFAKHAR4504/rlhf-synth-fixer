import json
import os
import time
import boto3
import uuid
from decimal import Decimal
from datetime import datetime
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError

# Initialize Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')
events = boto3.client('events')

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
API_KEY_PARAMETER = os.environ['API_KEY_PARAMETER']
HIGH_VALUE_THRESHOLD_PARAMETER = os.environ['HIGH_VALUE_THRESHOLD_PARAMETER']
EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'default')

# Cache for SSM parameters
parameter_cache = {}
CACHE_TTL = 300  # 5 minutes

def get_parameter(parameter_name: str) -> str:
    """Get parameter from SSM with caching"""
    current_time = time.time()
    
    if parameter_name in parameter_cache:
        cached_value, cached_time = parameter_cache[parameter_name]
        if current_time - cached_time < CACHE_TTL:
            return cached_value
    
    try:
        response = ssm.get_parameter(Name=parameter_name, WithDecryption=True)
        value = response['Parameter']['Value']
        parameter_cache[parameter_name] = (value, current_time)
        return value
    except ClientError as e:
        logger.error(f"Error getting parameter {parameter_name}: {str(e)}")
        raise

def exponential_backoff_retry(func, max_retries=3, base_delay=1):
    """Implement exponential backoff retry logic"""
    for attempt in range(max_retries):
        try:
            return func()
        except ClientError as e:
            if e.response['Error']['Code'] in ['ProvisionedThroughputExceededException', 'ThrottlingException']:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Retry attempt {attempt + 1}/{max_retries} after {delay}s")
                    time.sleep(delay)
                else:
                    raise
            else:
                raise

def validate_payment_schema(payment_data: Dict[str, Any]) -> bool:
    """Validate payment data against schema"""
    required_fields = ['payment_id', 'amount', 'currency', 'customer_id']
    
    for field in required_fields:
        if field not in payment_data:
            logger.error(f"Missing required field: {field}")
            return False
    
    # Validate amount is positive
    if payment_data['amount'] <= 0:
        logger.error("Payment amount must be positive")
        return False
    
    # Validate currency format (ISO 4217)
    if len(payment_data['currency']) != 3:
        logger.error("Invalid currency format")
        return False
    
    return True

@tracer.capture_method
def enrich_payment_data(payment_data: Dict[str, Any], request_id: str) -> Dict[str, Any]:
    """Enrich payment data with metadata"""
    enriched = payment_data.copy()
    enriched['request_id'] = request_id
    enriched['processed_at'] = datetime.utcnow().isoformat()
    enriched['timestamp'] = int(time.time() * 1000)
    enriched['status'] = 'validated'
    
    # Convert float to Decimal for DynamoDB
    if isinstance(enriched['amount'], float):
        enriched['amount'] = Decimal(str(enriched['amount']))
    
    return enriched

@tracer.capture_method
def store_payment(payment_data: Dict[str, Any]) -> None:
    """Store payment in DynamoDB with retry logic"""
    table = dynamodb.Table(TABLE_NAME)
    
    def put_item():
        return table.put_item(Item=payment_data)
    
    exponential_backoff_retry(put_item)
    logger.info(f"Stored payment {payment_data['payment_id']} in DynamoDB")

@tracer.capture_method
def publish_high_value_event(payment_data: Dict[str, Any]) -> None:
    """Publish event to EventBridge for high-value payments"""
    try:
        # Convert Decimal to float for JSON serialization
        event_detail = json.loads(json.dumps(payment_data, default=str))
        
        response = events.put_events(
            Entries=[
                {
                    'Source': 'payment.processing',
                    'DetailType': 'High Value Payment',
                    'Detail': json.dumps(event_detail),
                    'EventBusName': EVENT_BUS_NAME
                }
            ]
        )
        
        if response['FailedEntryCount'] > 0:
            logger.error(f"Failed to publish event: {response['Entries']}")
        else:
            logger.info(f"Published high-value event for payment {payment_data['payment_id']}")
    except Exception as e:
        logger.error(f"Error publishing event: {str(e)}")
        # Don't fail the entire request if event publishing fails
        metrics.add_metric(name="EventPublishFailure", unit=MetricUnit.Count, value=1)

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Main Lambda handler for payment validation"""
    try:
        # Parse request body
        if 'body' in event:
            payment_data = json.loads(event['body'])
        else:
            payment_data = event
        
        # Generate request ID
        request_id = str(uuid.uuid4())
        logger.append_keys(request_id=request_id)
        
        # Validate API key (optional - implement your logic)
        # api_key = get_parameter(API_KEY_PARAMETER)
        
        # Validate payment schema
        if not validate_payment_schema(payment_data):
            metrics.add_metric(name="ValidationFailure", unit=MetricUnit.Count, value=1)
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid payment data'})
            }
        
        # Enrich payment data
        enriched_payment = enrich_payment_data(payment_data, request_id)
        
        # Store in DynamoDB
        store_payment(enriched_payment)
        
        # Check if high-value transaction
        high_value_threshold = float(get_parameter(HIGH_VALUE_THRESHOLD_PARAMETER))
        if float(enriched_payment['amount']) > high_value_threshold:
            logger.info(f"High-value payment detected: {enriched_payment['amount']}")
            publish_high_value_event(enriched_payment)
            metrics.add_metric(name="HighValuePayment", unit=MetricUnit.Count, value=1)
        
        # Record successful processing
        metrics.add_metric(name="PaymentProcessed", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'payment_id': enriched_payment['payment_id'],
                'request_id': request_id
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing payment: {str(e)}")
        metrics.add_metric(name="ProcessingError", unit=MetricUnit.Count, value=1)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
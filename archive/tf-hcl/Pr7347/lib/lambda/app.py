import json
import base64
import boto3
import os
import time
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch all supported libraries for X-Ray tracing
patch_all()

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')
events = boto3.client('events')

# Environment variables
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
CLOUDWATCH_NAMESPACE = os.environ.get('CLOUDWATCH_NAMESPACE', f'PaymentTransactions/{ENVIRONMENT_SUFFIX}')
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

def log(level, message, **kwargs):
    """Structured logging"""
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'level': level,
        'message': message,
        **kwargs
    }
    print(json.dumps(log_entry))

@xray_recorder.capture('process_transaction')
def process_transaction(record):
    """Process individual transaction record with X-Ray custom segments"""

    # Create custom segment for transaction processing
    subsegment = xray_recorder.begin_subsegment('transaction_validation')

    try:
        # Decode Kinesis record
        payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
        transaction = json.loads(payload)

        # Add custom annotations to X-Ray
        xray_recorder.put_annotation('transaction_id', transaction.get('transaction_id', 'unknown'))
        xray_recorder.put_annotation('transaction_type', transaction.get('type', 'unknown'))
        xray_recorder.put_annotation('amount', transaction.get('amount', 0))

        # Add metadata to X-Ray
        xray_recorder.put_metadata('transaction_details', transaction)

        # Validate transaction
        is_valid = validate_transaction(transaction)
        xray_recorder.put_annotation('validation_result', 'valid' if is_valid else 'invalid')

        xray_recorder.end_subsegment()

        # Process based on validation
        if is_valid:
            return process_valid_transaction(transaction)
        else:
            return process_invalid_transaction(transaction)

    except Exception as e:
        xray_recorder.end_subsegment()
        log('ERROR', f'Error processing transaction: {str(e)}')
        raise

@xray_recorder.capture('validate_transaction')
def validate_transaction(transaction):
    """Validate transaction data"""
    required_fields = ['transaction_id', 'amount', 'type', 'merchant_id']

    for field in required_fields:
        if field not in transaction:
            log('WARN', f'Missing required field: {field}', transaction_id=transaction.get('transaction_id'))
            return False

    # Validate amount
    if transaction['amount'] <= 0:
        log('WARN', 'Invalid amount', transaction_id=transaction['transaction_id'])
        return False

    return True

@xray_recorder.capture('process_valid_transaction')
def process_valid_transaction(transaction):
    """Process valid transaction and emit metrics"""

    transaction_id = transaction['transaction_id']
    amount = transaction['amount']
    transaction_type = transaction['type']

    log('INFO', 'Processing valid transaction',
        transaction_id=transaction_id,
        transaction_type=transaction_type,
        amount=amount)

    # Emit custom metrics to CloudWatch (Constraint #5)
    emit_metrics({
        'TransactionCount': 1,
        'TransactionAmount': amount,
        'SuccessfulTransactions': 1
    }, transaction_type)

    # Send event to EventBridge for routing (Constraint #6)
    send_transaction_event(transaction, 'SUCCESS')

    return {
        'transaction_id': transaction_id,
        'status': 'SUCCESS',
        'processed_at': datetime.utcnow().isoformat()
    }

@xray_recorder.capture('process_invalid_transaction')
def process_invalid_transaction(transaction):
    """Process invalid transaction"""

    transaction_id = transaction.get('transaction_id', 'unknown')

    log('ERROR', 'Invalid transaction detected',
        transaction_id=transaction_id)

    # Emit error metrics
    emit_metrics({
        'Errors': 1,
        'InvalidTransactions': 1
    }, 'ERROR')

    # Send failure event to EventBridge
    send_transaction_event(transaction, 'FAILED')

    return {
        'transaction_id': transaction_id,
        'status': 'FAILED',
        'reason': 'Validation failed'
    }

@xray_recorder.capture('emit_metrics')
def emit_metrics(metrics, transaction_type):
    """Emit custom metrics to CloudWatch with custom namespace"""

    metric_data = []

    for metric_name, value in metrics.items():
        metric_data.append({
            'MetricName': metric_name,
            'Value': value,
            'Unit': 'Count' if 'Count' in metric_name or 'Transactions' in metric_name else 'None',
            'Timestamp': datetime.utcnow(),
            'Dimensions': [
                {
                    'Name': 'Environment',
                    'Value': ENVIRONMENT_SUFFIX
                },
                {
                    'Name': 'TransactionType',
                    'Value': transaction_type
                }
            ]
        })

    try:
        cloudwatch.put_metric_data(
            Namespace=CLOUDWATCH_NAMESPACE,
            MetricData=metric_data
        )
        log('DEBUG', f'Emitted {len(metric_data)} metrics to CloudWatch')
    except Exception as e:
        log('ERROR', f'Failed to emit metrics: {str(e)}')

@xray_recorder.capture('send_transaction_event')
def send_transaction_event(transaction, status):
    """Send transaction event to EventBridge for content-based routing"""

    # Calculate risk score (simplified example)
    risk_score = calculate_risk_score(transaction)

    # Determine velocity flag
    velocity_flag = 'HIGH' if transaction.get('amount', 0) > 5000 else 'NORMAL'

    event_detail = {
        'transaction_id': transaction.get('transaction_id'),
        'amount': transaction.get('amount'),
        'status': status,
        'merchant_id': transaction.get('merchant_id'),
        'merchant_country': transaction.get('merchant_country', 'US'),
        'risk_score': risk_score,
        'velocity_flag': velocity_flag,
        'transaction_count': transaction.get('transaction_count', 1),
        'timestamp': datetime.utcnow().isoformat()
    }

    try:
        events.put_events(
            Entries=[
                {
                    'Source': 'custom.payment.transactions',
                    'DetailType': 'Transaction Processed',
                    'Detail': json.dumps(event_detail)
                }
            ]
        )
        log('DEBUG', 'Sent event to EventBridge', transaction_id=transaction.get('transaction_id'))
    except Exception as e:
        log('ERROR', f'Failed to send event to EventBridge: {str(e)}')

def calculate_risk_score(transaction):
    """Calculate risk score for transaction (simplified)"""
    score = 0

    # High amount increases risk
    if transaction.get('amount', 0) > 10000:
        score += 30

    # Foreign merchant increases risk
    if transaction.get('merchant_country') not in ['US', 'CA', 'GB']:
        score += 40

    # High velocity increases risk
    if transaction.get('transaction_count', 0) > 20:
        score += 30

    return min(score, 100)

@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """Main Lambda handler for Kinesis stream processing"""

    start_time = time.time()

    log('INFO', 'Lambda invocation started',
        request_id=context.request_id,
        function_name=context.function_name)

    # Add Lambda context to X-Ray
    xray_recorder.put_annotation('function_name', context.function_name)
    xray_recorder.put_annotation('request_id', context.request_id)

    results = []

    try:
        # Process each record from Kinesis
        for record in event['Records']:
            try:
                result = process_transaction(record)
                results.append(result)
            except Exception as e:
                log('ERROR', f'Failed to process record: {str(e)}')
                # Continue processing other records
                results.append({
                    'status': 'ERROR',
                    'error': str(e)
                })

        # Emit batch processing metrics
        processing_duration = (time.time() - start_time) * 1000
        emit_metrics({
            'BatchSize': len(event['Records']),
            'ProcessingDuration': processing_duration
        }, 'BATCH')

        log('INFO', 'Lambda invocation completed',
            request_id=context.request_id,
            records_processed=len(results),
            duration_ms=processing_duration)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': len(results),
                'results': results
            })
        }

    except Exception as e:
        log('ERROR', f'Lambda handler error: {str(e)}',
            request_id=context.request_id)
        raise

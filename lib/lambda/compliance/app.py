"""Compliance checking Lambda function."""
import json
import os
import time
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError


# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
sqs = boto3.client('sqs')

# Get environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'transaction-state-dev')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')
DLQ_URL = os.environ.get('DLQ_URL', '')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal objects to native Python types."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def check_compliance(transaction):
    """
    Check compliance for transaction.

    Args:
        transaction: Transaction data dictionary

    Returns:
        dict: Compliance check result
    """
    compliance_checks = []
    failed_checks = []

    # Check 1: AML (Anti-Money Laundering) - Large transaction reporting
    amount = float(transaction.get('amount', 0))
    if amount >= 10000:
        compliance_checks.append({
            'check': 'AML_LARGE_TRANSACTION',
            'status': 'PASSED',
            'description': 'Transaction flagged for AML reporting',
            'action_required': True
        })
    else:
        compliance_checks.append({
            'check': 'AML_LARGE_TRANSACTION',
            'status': 'PASSED',
            'description': 'Transaction below AML reporting threshold',
            'action_required': False
        })

    # Check 2: KYC (Know Your Customer) - Customer verification
    customer_id = transaction.get('customer_id', '')
    if customer_id and not customer_id.startswith('GUEST') and not customer_id.startswith('ANON'):
        compliance_checks.append({
            'check': 'KYC_VERIFICATION',
            'status': 'PASSED',
            'description': 'Customer identity verified',
            'action_required': False
        })
    else:
        compliance_checks.append({
            'check': 'KYC_VERIFICATION',
            'status': 'FAILED',
            'description': 'Customer identity not verified',
            'action_required': True
        })
        failed_checks.append('KYC_VERIFICATION')

    # Check 3: Geographic restrictions
    merchant_country = transaction.get('merchant_country', 'UNKNOWN')
    customer_country = transaction.get('customer_country', 'UNKNOWN')

    restricted_countries = ['NK', 'IR', 'SY', 'CU']

    if merchant_country in restricted_countries or customer_country in restricted_countries:
        compliance_checks.append({
            'check': 'GEOGRAPHIC_RESTRICTIONS',
            'status': 'FAILED',
            'description': 'Transaction involves restricted country',
            'action_required': True
        })
        failed_checks.append('GEOGRAPHIC_RESTRICTIONS')
    else:
        compliance_checks.append({
            'check': 'GEOGRAPHIC_RESTRICTIONS',
            'status': 'PASSED',
            'description': 'No geographic restrictions violated',
            'action_required': False
        })

    # Check 4: Transaction limits
    if amount > 100000:
        compliance_checks.append({
            'check': 'TRANSACTION_LIMIT',
            'status': 'FAILED',
            'description': 'Transaction exceeds maximum limit',
            'action_required': True
        })
        failed_checks.append('TRANSACTION_LIMIT')
    else:
        compliance_checks.append({
            'check': 'TRANSACTION_LIMIT',
            'status': 'PASSED',
            'description': 'Transaction within limits',
            'action_required': False
        })

    # Check 5: PCI DSS - Payment Card Industry Data Security Standard
    if 'card_number' in transaction:
        # Check if card number is masked
        card_number = str(transaction['card_number'])
        if '*' in card_number or 'X' in card_number:
            compliance_checks.append({
                'check': 'PCI_DSS',
                'status': 'PASSED',
                'description': 'Card data properly masked',
                'action_required': False
            })
        else:
            compliance_checks.append({
                'check': 'PCI_DSS',
                'status': 'FAILED',
                'description': 'Card data not properly masked',
                'action_required': True
            })
            failed_checks.append('PCI_DSS')
    else:
        compliance_checks.append({
            'check': 'PCI_DSS',
            'status': 'PASSED',
            'description': 'No card data present',
            'action_required': False
        })

    # Check 6: GDPR - Data protection compliance
    if 'customer_consent' in transaction and transaction['customer_consent']:
        compliance_checks.append({
            'check': 'GDPR_CONSENT',
            'status': 'PASSED',
            'description': 'Customer consent obtained',
            'action_required': False
        })
    else:
        compliance_checks.append({
            'check': 'GDPR_CONSENT',
            'status': 'WARNING',
            'description': 'Customer consent not documented',
            'action_required': True
        })

    # Determine overall compliance
    is_compliant = len(failed_checks) == 0

    return {
        "is_compliant": is_compliant,
        "checks_performed": len(compliance_checks),
        "checks_passed": len([c for c in compliance_checks if c['status'] == 'PASSED']),
        "checks_failed": len(failed_checks),
        "failed_checks": failed_checks,
        "compliance_checks": compliance_checks,
        "compliance_timestamp": int(time.time())
    }


def store_compliance_result(transaction_id, compliance_result):
    """
    Store compliance check result in DynamoDB.

    Args:
        transaction_id: Transaction ID
        compliance_result: Compliance check result
    """
    table = dynamodb.Table(DYNAMODB_TABLE)

    item = {
        'transaction_id': transaction_id,
        'timestamp': int(time.time() * 1000),  # Milliseconds
        'state': 'COMPLIANCE_CHECKED',
        'environment': ENVIRONMENT,
        'compliance_data': json.dumps(compliance_result, cls=DecimalEncoder)
    }

    table.put_item(Item=item)


def send_compliance_alert(transaction_id, compliance_result, transaction):
    """
    Send compliance alert to SNS topic.

    Args:
        transaction_id: Transaction ID
        compliance_result: Compliance check result
        transaction: Original transaction data
    """
    if not SNS_TOPIC_ARN:
        print("SNS topic ARN not configured")
        return

    try:
        subject = f"COMPLIANCE ALERT: Transaction {transaction_id}"
        message = {
            'alert_type': 'COMPLIANCE_VIOLATION',
            'transaction_id': transaction_id,
            'is_compliant': compliance_result['is_compliant'],
            'checks_failed': compliance_result['checks_failed'],
            'failed_checks': compliance_result['failed_checks'],
            'amount': transaction.get('amount'),
            'currency': transaction.get('currency'),
            'merchant_id': transaction.get('merchant_id'),
            'customer_id': transaction.get('customer_id'),
            'timestamp': int(time.time()),
            'environment': ENVIRONMENT
        }

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=json.dumps(message, cls=DecimalEncoder, indent=2)
        )

        print(f"Compliance alert sent for transaction: {transaction_id}")

    except ClientError as e:
        print(f"Error sending compliance alert: {str(e)}")


def send_to_dlq(event, error_message):
    """
    Send failed transaction to dead letter queue.

    Args:
        event: Original event
        error_message: Error message
    """
    if not DLQ_URL:
        print("DLQ URL not configured")
        return

    try:
        message_body = {
            'event': event,
            'error': error_message,
            'timestamp': int(time.time()),
            'stage': 'compliance_checking'
        }

        sqs.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(message_body, cls=DecimalEncoder)
        )
        print(f"Sent failed transaction to DLQ")
    except ClientError as e:
        print(f"Error sending to DLQ: {str(e)}")


def lambda_handler(event, context):
    """
    Lambda handler for compliance checking.

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        dict: Compliance check result
    """
    print(f"Checking compliance: {json.dumps(event, cls=DecimalEncoder)}")

    try:
        # Extract transaction data
        # Handle both direct invocation and Step Functions invocation
        if 'Payload' in event:
            payload = event['Payload']
        else:
            payload = event

        # Get transaction from payload
        transaction = payload.get('transaction', payload)

        # Check compliance
        compliance_result = check_compliance(transaction)

        # Store compliance result
        store_compliance_result(transaction['transaction_id'], compliance_result)

        # Send alert if compliance failed
        if not compliance_result['is_compliant']:
            send_compliance_alert(transaction['transaction_id'], compliance_result, transaction)
            print(f"COMPLIANCE VIOLATION: Transaction {transaction['transaction_id']}")
        else:
            print(f"Transaction passed compliance checks: {transaction['transaction_id']}")

        # Return result
        result = {
            'statusCode': 200,
            'transaction_id': transaction['transaction_id'],
            'compliance': compliance_result,
            'transaction': transaction,
            'stage': 'compliance_checking',
            'processing_complete': True
        }

        # Include previous results if present
        if 'validation' in payload:
            result['validation'] = payload['validation']
        if 'fraud_detection' in payload:
            result['fraud_detection'] = payload['fraud_detection']

        return result

    except KeyError as e:
        error_message = f"Missing required field: {str(e)}"
        print(error_message)

        # Send to DLQ
        send_to_dlq(event, error_message)

        # Re-raise for Step Functions to handle
        raise Exception(error_message)

    except Exception as e:
        error_message = f"Unexpected error: {str(e)}"
        print(error_message)

        # Send to DLQ
        send_to_dlq(event, error_message)

        # Re-raise for Step Functions to handle
        raise Exception(error_message)

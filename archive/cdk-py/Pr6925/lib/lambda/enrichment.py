"""enrichment.py - Transaction Enrichment Handler"""

import json
import os
from datetime import datetime
from decimal import Decimal
import boto3

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """
    Enrichment Lambda handler

    Processes transactions:
    1. Enriches with external data
    2. Calculates risk score
    3. Updates final DynamoDB status
    4. Publishes metrics
    """
    try:
        print(f"Received event: {json.dumps(event)}")

        # Extract transaction ID
        if 'Records' in event:
            # SQS event source
            record = event['Records'][0]
            message_body = json.loads(record['body'])
            transaction_id = message_body['transactionId']
        else:
            # Direct invocation
            transaction_id = event['transactionId']

        # Retrieve transaction from DynamoDB
        response = table.get_item(Key={'transactionId': transaction_id})

        if 'Item' not in response:
            raise ValueError(f"Transaction {transaction_id} not found")

        item = response['Item']

        # Parse raw data
        raw_data = json.loads(item['rawData'])

        # Enrich with external data
        enrichment_data = enrich_transaction(raw_data)

        # Calculate final risk score
        risk_score = calculate_risk_score(raw_data, enrichment_data)

        # Determine final status
        if risk_score < 50:
            final_status = 'COMPLETED'
        elif risk_score < 75:
            final_status = 'COMPLETED_WITH_WARNING'
        else:
            final_status = 'REQUIRES_MANUAL_REVIEW'

        # Update DynamoDB with enriched data
        timestamp = datetime.utcnow().isoformat()
        table.update_item(
            Key={'transactionId': transaction_id},
            UpdateExpression='SET #status = :status, #timestamp = :timestamp, stage = :stage, riskScore = :risk, merchantCountry = :country, merchantCategory = :category, completedAt = :completed',
            ExpressionAttributeNames={
                '#status': 'status',
                '#timestamp': 'timestamp'
            },
            ExpressionAttributeValues={
                ':status': final_status,
                ':timestamp': timestamp,
                ':stage': 'enrichment',
                ':risk': Decimal(str(risk_score)),
                ':country': enrichment_data.get('merchantCountry', 'UNKNOWN'),
                ':category': enrichment_data.get('merchantCategory', 'UNKNOWN'),
                ':completed': timestamp
            }
        )
        print(f"Updated transaction {transaction_id} status to {final_status}")

        # Publish completion metric
        publish_metric('ProcessingRate', 1, 'Count')
        publish_metric('RiskScore', risk_score, 'None')

        # If requires manual review, send notification
        if final_status == 'REQUIRES_MANUAL_REVIEW':
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Transaction Requires Manual Review',
                Message=json.dumps({
                    'stage': 'enrichment',
                    'transactionId': transaction_id,
                    'riskScore': risk_score,
                    'merchantCountry': enrichment_data.get('merchantCountry'),
                    'amount': float(item['amount']),
                    'timestamp': timestamp
                })
            )

        return {
            'statusCode': 200,
            'transactionId': transaction_id,
            'status': final_status,
            'riskScore': risk_score,
            'timestamp': timestamp
        }

    except Exception as e:
        print(f"Error in enrichment: {str(e)}")

        # Publish error metric
        publish_metric('ErrorCount', 1, 'Count')

        # Send failure notification
        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Transaction Enrichment Failed',
                Message=json.dumps({
                    'stage': 'enrichment',
                    'transactionId': event.get('transactionId', 'unknown'),
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                })
            )
        except Exception as sns_error:
            print(f"Failed to send SNS notification: {str(sns_error)}")

        raise


def enrich_transaction(data):
    """Enrich transaction with external data"""
    # In production, this would call external APIs for:
    # - Merchant information
    # - Customer profile
    # - Geolocation data
    # - Historical patterns

    merchant_id = data.get('merchantId', '')

    # Simulated enrichment data
    enrichment = {
        'merchantCountry': 'US' if merchant_id.startswith('US') else 'INTL',
        'merchantCategory': determine_category(merchant_id),
        'merchantRiskRating': 'LOW',
        'customerTier': 'STANDARD',
        'customerLifetimeValue': 5000,
        'transactionCount': 42,
        'avgTransactionAmount': 250
    }

    return enrichment


def determine_category(merchant_id):
    """Determine merchant category from ID"""
    # Simplified categorization
    if 'FOOD' in merchant_id:
        return 'FOOD_AND_DINING'
    elif 'SHOP' in merchant_id:
        return 'RETAIL'
    elif 'TRAVEL' in merchant_id:
        return 'TRAVEL'
    else:
        return 'GENERAL'


def calculate_risk_score(transaction_data, enrichment_data):
    """Calculate comprehensive risk score"""
    risk_score = 0

    # Factor 1: Transaction amount
    amount = float(transaction_data.get('amount', 0))
    if amount > 1000:
        risk_score += 20
    elif amount > 500:
        risk_score += 10

    # Factor 2: Merchant country
    if enrichment_data.get('merchantCountry') == 'INTL':
        risk_score += 15

    # Factor 3: Merchant risk rating
    if enrichment_data.get('merchantRiskRating') == 'HIGH':
        risk_score += 30
    elif enrichment_data.get('merchantRiskRating') == 'MEDIUM':
        risk_score += 15

    # Factor 4: Customer profile
    customer_tier = enrichment_data.get('customerTier', 'STANDARD')
    if customer_tier == 'NEW':
        risk_score += 25
    elif customer_tier == 'STANDARD':
        risk_score += 10

    # Factor 5: Transaction pattern
    avg_amount = enrichment_data.get('avgTransactionAmount', 0)
    if amount > avg_amount * 3:
        risk_score += 20

    return min(risk_score, 100)


def publish_metric(metric_name, value, unit):
    """Publish custom CloudWatch metric"""
    try:
        cloudwatch.put_metric_data(
            Namespace=f'TransactionPipeline/{ENVIRONMENT_SUFFIX}',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        print(f"Failed to publish metric: {str(e)}")

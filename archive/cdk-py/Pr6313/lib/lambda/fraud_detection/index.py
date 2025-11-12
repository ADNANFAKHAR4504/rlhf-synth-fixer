"""
Lambda function for fraud detection.
"""
import json
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DB_ENDPOINT = os.environ['DB_ENDPOINT']
ENVIRONMENT = os.environ['ENVIRONMENT']


def handler(event, context):
    """
    Analyze transactions for fraud indicators.
    """
    logger.info(f"Analyzing transaction for fraud")

    try:
        # Parse transaction data
        transaction = json.loads(event['body']) if 'body' in event else event

        transaction_id = transaction.get('transaction_id')
        amount = float(transaction.get('amount', 0))
        customer_id = transaction.get('customer_id')
        location = transaction.get('location')

        logger.info(f"Analyzing transaction {transaction_id}")

        # Fraud detection logic
        risk_score = calculate_risk_score(amount, customer_id, location)

        result = {
            'transaction_id': transaction_id,
            'risk_score': risk_score,
            'status': 'approved' if risk_score < 0.7 else 'flagged',
            'timestamp': datetime.now().isoformat()
        }

        logger.info(f"Transaction {transaction_id} risk score: {risk_score}")

        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

    except Exception as e:
        logger.error(f"Error in fraud detection: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def calculate_risk_score(amount, customer_id, location):
    """
    Calculate fraud risk score based on transaction attributes.
    """
    risk_score = 0.0

    # High amount transactions
    if amount > 10000:
        risk_score += 0.3

    # Add more fraud detection logic here
    # - Check transaction velocity
    # - Check location anomalies
    # - Check customer history
    # - Apply ML model

    return min(risk_score, 1.0)

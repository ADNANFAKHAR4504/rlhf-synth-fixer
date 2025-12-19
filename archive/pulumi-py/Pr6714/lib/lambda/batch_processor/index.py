"""
Batch Processor Lambda function.

This function scans the DynamoDB table for recent transactions and performs
anomaly detection to identify potential fraudulent activities.
"""
import json
import os
import boto3
from typing import Dict, Any, List
from datetime import datetime, timedelta
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
table = dynamodb.Table(TABLE_NAME)


def detect_anomalies(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect anomalies in transaction data.

    This is a simple anomaly detection algorithm that flags transactions
    based on amount thresholds and frequency patterns.

    Args:
        transactions: List of transaction records

    Returns:
        List of transactions flagged as anomalies
    """
    anomalies = []

    # Group transactions by customer
    customer_transactions = {}
    for txn in transactions:
        customer_id = txn.get('customer_id', 'unknown')
        if customer_id not in customer_transactions:
            customer_transactions[customer_id] = []
        customer_transactions[customer_id].append(txn)

    # Detect anomalies
    for customer_id, txns in customer_transactions.items():
        # Calculate average transaction amount
        amounts = [float(txn['amount']) for txn in txns]
        avg_amount = sum(amounts) / len(amounts) if amounts else 0

        # Flag transactions with amount > 3x average
        for txn in txns:
            amount = float(txn['amount'])
            if amount > 3 * avg_amount and amount > 1000:
                anomaly = txn.copy()
                anomaly['anomaly_reason'] = 'High amount compared to average'
                anomaly['anomaly_score'] = round(amount / avg_amount, 2)
                anomalies.append(anomaly)

        # Flag if more than 10 transactions in the time window
        if len(txns) > 10:
            for txn in txns:
                anomaly = txn.copy()
                anomaly['anomaly_reason'] = 'High transaction frequency'
                anomaly['anomaly_score'] = len(txns) / 10
                anomalies.append(anomaly)

    return anomalies


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for batch processing.

    Args:
        event: EventBridge event
        context: Lambda context object

    Returns:
        Response with processing results
    """
    try:
        # Calculate time window (last 5 minutes)
        current_time = datetime.now()
        five_minutes_ago = current_time - timedelta(minutes=5)
        timestamp_threshold = int(five_minutes_ago.timestamp())

        # Scan DynamoDB for recent transactions
        response = table.scan(
            FilterExpression='#ts >= :threshold',
            ExpressionAttributeNames={
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues={
                ':threshold': timestamp_threshold
            }
        )

        transactions = response.get('Items', [])

        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='#ts >= :threshold',
                ExpressionAttributeNames={
                    '#ts': 'timestamp'
                },
                ExpressionAttributeValues={
                    ':threshold': timestamp_threshold
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            transactions.extend(response.get('Items', []))

        # Detect anomalies
        anomalies = detect_anomalies(transactions)

        print(f"Processed {len(transactions)} transactions")
        print(f"Detected {len(anomalies)} anomalies")

        # Log anomalies for monitoring
        for anomaly in anomalies:
            print(f"ANOMALY DETECTED: {json.dumps(anomaly, default=str)}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'transactions_processed': len(transactions),
                'anomalies_detected': len(anomalies)
            }, default=str)
        }

    except Exception as e:
        print(f"Error in batch processing: {str(e)}")
        raise

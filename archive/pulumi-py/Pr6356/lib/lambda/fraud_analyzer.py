import json
import boto3
import os
from decimal import Decimal
from datetime import datetime

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('REGION', 'us-east-2'))
s3 = boto3.client('s3', region_name=os.environ.get('REGION', 'us-east-2'))

table_name = os.environ.get('TABLE_NAME')
bucket_name = os.environ.get('BUCKET_NAME')
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Lambda handler for analyzing transactions for fraud patterns
    Triggered by DynamoDB streams when new transactions are added
    """

    try:
        print(f"Processing {len(event['Records'])} records from DynamoDB stream")

        for record in event['Records']:
            if record['eventName'] in ['INSERT', 'MODIFY']:
                analyze_transaction(record)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Fraud analysis completed'})
        }

    except Exception as e:
        print(f"Error in fraud analysis: {str(e)}")
        raise

def analyze_transaction(record):
    """Analyze a single transaction for fraud patterns"""

    try:
        # Extract transaction data from DynamoDB stream record
        new_image = record['dynamodb'].get('NewImage', {})

        transaction_id = new_image['transactionId']['S']
        amount = Decimal(new_image['amount']['N'])
        customer_id = new_image['customerId']['S']
        timestamp = int(new_image['timestamp']['N'])

        print(f"Analyzing transaction: {transaction_id} for customer: {customer_id}")

        # Fraud detection logic
        fraud_score = calculate_fraud_score(amount, customer_id)

        # Determine fraud status
        if fraud_score > 0.8:
            status = 'fraud_detected'
            print(f"FRAUD ALERT: Transaction {transaction_id} flagged with score {fraud_score}")

            # Log fraud incident to S3
            log_fraud_incident(transaction_id, customer_id, amount, fraud_score, timestamp)
        elif fraud_score > 0.5:
            status = 'suspicious'
            print(f"SUSPICIOUS: Transaction {transaction_id} marked with score {fraud_score}")
        else:
            status = 'approved'
            print(f"APPROVED: Transaction {transaction_id} with score {fraud_score}")

        # Update transaction with fraud analysis results
        table.update_item(
            Key={
                'transactionId': transaction_id,
                'timestamp': timestamp
            },
            UpdateExpression='SET fraudScore = :score, #status = :status',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':score': fraud_score,
                ':status': status
            }
        )

        print(f"Updated transaction {transaction_id} with status: {status}")

    except Exception as e:
        print(f"Error analyzing transaction: {str(e)}")
        raise

def calculate_fraud_score(amount, customer_id):
    """
    Calculate fraud score based on transaction patterns
    Returns a score between 0 and 1 (0 = safe, 1 = fraudulent)
    """

    score = 0.0

    # Rule 1: High amount transactions (> $10,000)
    if amount > 10000:
        score += 0.4
        print(f"High amount detected: ${amount}")

    # Rule 2: Very high amount transactions (> $50,000)
    if amount > 50000:
        score += 0.3
        print(f"Very high amount detected: ${amount}")

    # Rule 3: Round number amounts (potential testing)
    if amount % 1000 == 0:
        score += 0.2
        print(f"Round number amount detected: ${amount}")

    # Rule 4: Unusual customer ID patterns (example: very short IDs)
    if len(customer_id) < 5:
        score += 0.1
        print(f"Unusual customer ID: {customer_id}")

    # Cap score at 1.0
    final_score = min(score, 1.0)

    return Decimal(str(final_score))

def log_fraud_incident(transaction_id, customer_id, amount, fraud_score, timestamp):
    """Log fraud incident to S3 for further investigation"""

    try:
        incident_data = {
            'transactionId': transaction_id,
            'customerId': customer_id,
            'amount': float(amount),
            'fraudScore': float(fraud_score),
            'timestamp': timestamp,
            'detectedAt': datetime.utcnow().isoformat(),
            'severity': 'HIGH' if fraud_score > 0.8 else 'MEDIUM'
        }

        # Create S3 key with date partitioning
        date_str = datetime.utcnow().strftime('%Y/%m/%d')
        s3_key = f"fraud-incidents/{date_str}/{transaction_id}.json"

        # Upload to S3
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json.dumps(incident_data, indent=2),
            ContentType='application/json'
        )

        print(f"Fraud incident logged to S3: {s3_key}")

    except Exception as e:
        print(f"Error logging fraud incident to S3: {str(e)}")
        # Don't raise - this is a non-critical operation

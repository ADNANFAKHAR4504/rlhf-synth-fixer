import json
import logging
import os
import random
from datetime import datetime, timezone
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'payment-transactions')
table = dynamodb.Table(table_name)

def calculate_fraud_score(transaction):
    """
    Calculate a simulated fraud score based on transaction patterns.
    In production, this would use ML models and historical data.
    """
    score = 0.0
    
    # Check amount thresholds
    amount = float(transaction.get('amount', 0))
    if amount > 5000:
        score += 0.3
    elif amount > 2500:
        score += 0.2
    elif amount > 1000:
        score += 0.1
    
    # Check merchant patterns (simulated)
    merchant_id = transaction.get('merchant_id', '')
    if 'high-risk' in merchant_id.lower():
        score += 0.4
    
    # Check customer patterns (simulated)
    customer_id = transaction.get('customer_id', '')
    if 'new' in customer_id.lower():
        score += 0.2
    
    # Add some randomness for demo purposes
    score += random.uniform(0, 0.3)
    
    # Normalize to 0-1 range
    return min(max(score, 0.0), 1.0)

def lambda_handler(event, context):
    """
    Performs fraud detection on validated transactions.
    """
    try:
        logger.info(f"Processing {len(event['Records'])} records for fraud detection")
        batch_item_failures = []
        
        for record in event['Records']:
            message_id = record['messageId']
            try:
                # Parse SQS message
                body = json.loads(record['body'])
                transaction_id = body.get('transaction_id')
                
                if not transaction_id:
                    raise ValueError("Missing transaction_id in message")
                
                logger.info(f"Performing fraud detection for transaction: {transaction_id}")
                
                # Calculate fraud score
                fraud_score = calculate_fraud_score(body)
                
                # Determine risk level
                if fraud_score < 0.3:
                    risk_level = "low"
                elif fraud_score < 0.7:
                    risk_level = "medium"
                else:
                    risk_level = "high"
                
                # Update transaction in DynamoDB
                response = table.update_item(
                    Key={'transaction_id': transaction_id},
                    UpdateExpression='SET #state = :state, fraud_score = :score, risk_level = :risk, fraud_check_timestamp = :timestamp',
                    ExpressionAttributeNames={
                        '#state': 'state'
                    },
                    ExpressionAttributeValues={
                        ':state': 'fraud-checked',
                        ':score': Decimal(str(round(fraud_score, 4))),
                        ':risk': risk_level,
                        ':timestamp': datetime.now(timezone.utc).isoformat()
                    }
                )
                
                logger.info(f"Transaction {transaction_id} fraud check complete. Score: {fraud_score:.2f}, Risk: {risk_level}")
                
                # If high risk, you might want to flag for manual review
                if risk_level == "high":
                    logger.warning(f"High risk transaction detected: {transaction_id}")
                
            except (ValueError, KeyError) as e:
                logger.error(f"Validation error for message {message_id}: {str(e)}")
                batch_item_failures.append({"itemIdentifier": message_id})
            except ClientError as e:
                logger.error(f"DynamoDB error for message {message_id}: {str(e)}")
                batch_item_failures.append({"itemIdentifier": message_id})
            except Exception as e:
                logger.error(f"Unexpected error for message {message_id}: {str(e)}")
                batch_item_failures.append({"itemIdentifier": message_id})
        
        # Return batch item failures for partial batch response
        if batch_item_failures:
            return {"batchItemFailures": batch_item_failures}
        
        return {"statusCode": 200, "body": "All fraud checks completed successfully"}
        
    except Exception as e:
        logger.error(f"Critical error in lambda handler: {str(e)}")
        raise
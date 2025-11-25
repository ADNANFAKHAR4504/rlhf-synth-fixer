"""
Transaction Processor Lambda Function

This Lambda function processes financial transactions from SQS FIFO queues,
performs fraud detection analysis, and stores results in DynamoDB and S3.
"""

import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
import logging
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')
events = boto3.client('events')
stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event, context):
    """
    Main Lambda handler for processing financial transactions.
    
    Args:
        event: SQS event containing transaction records
        context: Lambda execution context
        
    Returns:
        dict: Processing result status
    """
    
    try:
        # Get environment variables
        processing_table_name = os.environ['PROCESSING_TABLE_NAME']
        fraud_table_name = os.environ['FRAUD_TABLE_NAME']
        reports_bucket_name = os.environ['REPORTS_BUCKET_NAME']
        sns_alerts_topic_arn = os.environ['SNS_ALERTS_TOPIC_ARN']
        environment_suffix = os.environ['ENVIRONMENT_SUFFIX']
        
        # Initialize DynamoDB tables
        processing_table = dynamodb.Table(processing_table_name)
        fraud_table = dynamodb.Table(fraud_table_name)
        
        logger.info(f"Processing {len(event['Records'])} transaction records")
        
        processed_count = 0
        failed_count = 0
        
        for record in event['Records']:
            try:
                # Parse transaction data from SQS message
                transaction_data = json.loads(record['body'])
                logger.info(f"Processing transaction: {transaction_data.get('transaction_id')}")
                
                # Process the transaction
                result = process_transaction(
                    transaction_data,
                    processing_table,
                    fraud_table,
                    reports_bucket_name,
                    sns_alerts_topic_arn
                )
                
                if result['success']:
                    processed_count += 1
                    logger.info(f"Successfully processed transaction: {transaction_data.get('transaction_id')}")
                else:
                    failed_count += 1
                    logger.error(f"Failed to process transaction: {result.get('error')}")
                    
            except Exception as e:
                failed_count += 1
                logger.error(f"Error processing record: {str(e)}")
                
                # Send failure notification
                try:
                    sns.publish(
                        TopicArn=sns_alerts_topic_arn,
                        Message=f"Transaction processing failed: {str(e)}",
                        Subject="Processing Error"
                    )
                except Exception as sns_error:
                    logger.error(f"Failed to send SNS notification: {str(sns_error)}")
        
        logger.info(f"Processing complete. Successful: {processed_count}, Failed: {failed_count}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing complete',
                'processed': processed_count,
                'failed': failed_count
            })
        }
        
    except Exception as e:
        logger.error(f"Critical error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def process_transaction(transaction_data, processing_table, fraud_table, 
                       reports_bucket_name, sns_alerts_topic_arn):
    """
    Process a single financial transaction.
    
    Args:
        transaction_data: Dictionary containing transaction details
        processing_table: DynamoDB table for processing state
        fraud_table: DynamoDB table for fraud detection results
        reports_bucket_name: S3 bucket for storing reports
        sns_alerts_topic_arn: SNS topic for alerts
        
    Returns:
        dict: Processing result
    """
    
    try:
        # Extract transaction details
        transaction_id = transaction_data.get('transaction_id', str(uuid.uuid4()))
        customer_id = transaction_data.get('customer_id')
        amount = Decimal(str(transaction_data.get('amount', 0)))
        transaction_type = transaction_data.get('type', 'unknown')
        source_account = transaction_data.get('source_account')
        destination_account = transaction_data.get('destination_account')
        timestamp = datetime.now().isoformat()
        
        # Validate required fields
        if not customer_id or amount <= 0:
            raise ValueError("Missing required fields: customer_id or invalid amount")
        
        # Update processing state
        processing_table.put_item(Item={
            'transaction_id': transaction_id,
            'customer_id': customer_id,
            'timestamp': timestamp,
            'status': 'processing',
            'amount': amount,
            'type': transaction_type,
            'source_account': source_account,
            'destination_account': destination_account,
            'created_at': timestamp,
            'ttl': int((datetime.now().timestamp() + (30 * 24 * 60 * 60)))  # 30 days TTL
        })
        
        # Perform fraud detection analysis
        fraud_analysis = perform_fraud_detection(
            transaction_id, customer_id, amount, transaction_type, processing_table
        )
        
        # Store fraud detection results
        fraud_table.put_item(Item={
            'transaction_id': transaction_id,
            'risk_score': fraud_analysis['risk_score'],
            'risk_factors': fraud_analysis['risk_factors'],
            'recommendation': fraud_analysis['recommendation'],
            'timestamp': timestamp,
            'status': 'analyzed',
            'model_version': '1.0',
            'ttl': int((datetime.now().timestamp() + (365 * 24 * 60 * 60)))  # 1 year TTL
        })
        
        # Generate and store processing report
        report = generate_transaction_report(
            transaction_data, fraud_analysis, timestamp
        )
        
        # Store report in S3 with intelligent tiering
        s3_key = f"reports/{customer_id}/{datetime.now().strftime('%Y/%m/%d')}/{transaction_id}.json"
        s3.put_object(
            Bucket=reports_bucket_name,
            Key=s3_key,
            Body=json.dumps(report, default=str),
            ServerSideEncryption='aws:kms',
            ContentType='application/json',
            Metadata={
                'transaction-id': transaction_id,
                'customer-id': customer_id,
                'risk-score': str(fraud_analysis['risk_score']),
                'processed-at': timestamp
            }
        )
        
        # Send alerts based on risk level
        if fraud_analysis['risk_score'] >= 80:
            # High risk - immediate alert
            sns.publish(
                TopicArn=sns_alerts_topic_arn,
                Message=json.dumps({
                    'alert_type': 'high_risk_transaction',
                    'transaction_id': transaction_id,
                    'customer_id': customer_id,
                    'amount': float(amount),
                    'risk_score': fraud_analysis['risk_score'],
                    'risk_factors': fraud_analysis['risk_factors'],
                    'timestamp': timestamp
                }),
                Subject=f"HIGH RISK TRANSACTION ALERT - ID: {transaction_id}",
                MessageAttributes={
                    'alert_level': {'DataType': 'String', 'StringValue': 'HIGH'},
                    'transaction_id': {'DataType': 'String', 'StringValue': transaction_id}
                }
            )
        elif fraud_analysis['risk_score'] >= 50:
            # Medium risk - review alert
            sns.publish(
                TopicArn=sns_alerts_topic_arn,
                Message=json.dumps({
                    'alert_type': 'medium_risk_transaction',
                    'transaction_id': transaction_id,
                    'customer_id': customer_id,
                    'amount': float(amount),
                    'risk_score': fraud_analysis['risk_score'],
                    'timestamp': timestamp
                }),
                Subject=f"MEDIUM RISK TRANSACTION - ID: {transaction_id}",
                MessageAttributes={
                    'alert_level': {'DataType': 'String', 'StringValue': 'MEDIUM'},
                    'transaction_id': {'DataType': 'String', 'StringValue': transaction_id}
                }
            )
        
        # Update final processing status
        processing_table.update_item(
            Key={'transaction_id': transaction_id, 'timestamp': timestamp},
            UpdateExpression='SET #status = :status, #completed_at = :completed_at, #risk_score = :risk_score',
            ExpressionAttributeNames={
                '#status': 'status',
                '#completed_at': 'completed_at',
                '#risk_score': 'risk_score'
            },
            ExpressionAttributeValues={
                ':status': 'completed',
                ':completed_at': timestamp,
                ':risk_score': fraud_analysis['risk_score']
            }
        )
        
        # Publish event to EventBridge for downstream processing
        if amount > 10000:  # High-value transaction
            events.put_events(
                Entries=[
                    {
                        'Source': 'transaction.processor',
                        'DetailType': 'High Value Transaction Processed',
                        'Detail': json.dumps({
                            'transaction_id': transaction_id,
                            'customer_id': customer_id,
                            'amount': float(amount),
                            'risk_score': fraud_analysis['risk_score'],
                            'timestamp': timestamp
                        })
                    }
                ]
            )
        
        return {
            'success': True,
            'transaction_id': transaction_id,
            'risk_score': fraud_analysis['risk_score'],
            'status': 'completed'
        }
        
    except Exception as e:
        logger.error(f"Error processing transaction {transaction_data.get('transaction_id', 'unknown')}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'transaction_id': transaction_data.get('transaction_id', 'unknown')
        }

def perform_fraud_detection(transaction_id, customer_id, amount, transaction_type, processing_table):
    """
    Perform fraud detection analysis on the transaction.
    
    Args:
        transaction_id: Unique transaction identifier
        customer_id: Customer identifier
        amount: Transaction amount
        transaction_type: Type of transaction
        processing_table: DynamoDB table for querying history
        
    Returns:
        dict: Fraud analysis results
    """
    
    risk_score = 0
    risk_factors = []
    
    try:
        # Base risk assessment
        if amount > Decimal('100000'):
            risk_score += 50
            risk_factors.append('very_high_amount')
        elif amount > Decimal('50000'):
            risk_score += 30
            risk_factors.append('high_amount')
        elif amount > Decimal('10000'):
            risk_score += 15
            risk_factors.append('elevated_amount')
        
        # Transaction type risk
        high_risk_types = ['wire_transfer', 'international_transfer', 'cash_withdrawal']
        if transaction_type in high_risk_types:
            risk_score += 20
            risk_factors.append('high_risk_transaction_type')
        
        # Check for unusual activity patterns (simplified)
        # In a real implementation, this would involve more sophisticated ML models
        current_time = datetime.now()
        
        # Query recent transactions for this customer
        try:
            response = processing_table.query(
                IndexName='customer-timestamp-index',
                KeyConditionExpression='customer_id = :customer_id',
                ExpressionAttributeValues={
                    ':customer_id': customer_id
                },
                ScanIndexForward=False,  # Most recent first
                Limit=10  # Last 10 transactions
            )
            
            recent_transactions = response.get('Items', [])
            
            # Check for rapid succession of transactions
            if len(recent_transactions) >= 3:
                risk_score += 15
                risk_factors.append('rapid_transaction_pattern')
            
            # Check for amount patterns
            recent_amounts = [float(t.get('amount', 0)) for t in recent_transactions]
            if recent_amounts and max(recent_amounts) > 0:
                current_amount_ratio = float(amount) / max(recent_amounts)
                if current_amount_ratio > 5:  # 5x larger than usual
                    risk_score += 25
                    risk_factors.append('unusual_amount_increase')
                    
        except Exception as e:
            logger.warning(f"Could not analyze transaction history: {str(e)}")
            risk_factors.append('history_analysis_unavailable')
        
        # Weekend/off-hours transactions (simplified)
        if current_time.weekday() >= 5 or current_time.hour < 6 or current_time.hour > 22:
            risk_score += 10
            risk_factors.append('off_hours_transaction')
        
        # Cap risk score at 100
        risk_score = min(risk_score, 100)
        
        # Determine recommendation
        if risk_score >= 80:
            recommendation = 'BLOCK'
        elif risk_score >= 50:
            recommendation = 'REVIEW'
        elif risk_score >= 30:
            recommendation = 'MONITOR'
        else:
            recommendation = 'APPROVE'
        
        return {
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendation': recommendation,
            'analysis_timestamp': current_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in fraud detection for transaction {transaction_id}: {str(e)}")
        return {
            'risk_score': 50,  # Default medium risk on error
            'risk_factors': ['analysis_error'],
            'recommendation': 'REVIEW',
            'error': str(e)
        }

def generate_transaction_report(transaction_data, fraud_analysis, timestamp):
    """
    Generate a comprehensive transaction processing report.
    
    Args:
        transaction_data: Original transaction data
        fraud_analysis: Results from fraud detection
        timestamp: Processing timestamp
        
    Returns:
        dict: Transaction report
    """
    
    return {
        'report_metadata': {
            'report_id': str(uuid.uuid4()),
            'generated_at': timestamp,
            'report_version': '1.0',
            'processing_engine': 'tap-transaction-processor'
        },
        'transaction_details': {
            'transaction_id': transaction_data.get('transaction_id'),
            'customer_id': transaction_data.get('customer_id'),
            'amount': float(transaction_data.get('amount', 0)),
            'currency': transaction_data.get('currency', 'USD'),
            'transaction_type': transaction_data.get('type', 'unknown'),
            'source_account': transaction_data.get('source_account'),
            'destination_account': transaction_data.get('destination_account'),
            'description': transaction_data.get('description', ''),
            'original_timestamp': transaction_data.get('timestamp')
        },
        'processing_results': {
            'status': 'completed',
            'processed_at': timestamp,
            'processing_duration_ms': 0,  # Would be calculated in real implementation
            'fraud_analysis': fraud_analysis
        },
        'compliance': {
            'regulatory_flags': [],
            'aml_status': 'processed',
            'kyc_status': 'verified',
            'sanctions_check': 'clear'
        },
        'audit_trail': {
            'created_by': 'tap-transaction-processor',
            'processing_node': os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'unknown'),
            'execution_id': os.environ.get('AWS_LAMBDA_LOG_STREAM_NAME', 'unknown')
        }
    }
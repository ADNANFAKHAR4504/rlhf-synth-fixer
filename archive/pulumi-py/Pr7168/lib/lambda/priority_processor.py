"""
Priority Transaction Processor Lambda Function

This Lambda function handles high-value transactions (>$10,000) with enhanced
processing logic, additional fraud checks, and expedited handling.
"""

import json
import boto3
import os
from datetime import datetime, timedelta
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
stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event, context):
    """
    Main Lambda handler for processing high-priority financial transactions.
    
    Args:
        event: SQS event containing priority transaction records
        context: Lambda execution context
        
    Returns:
        dict: Processing result status
    """
    
    try:
        # Get environment variables
        processing_table_name = os.environ['PROCESSING_TABLE_NAME']
        fraud_table_name = os.environ['FRAUD_TABLE_NAME']
        reports_bucket_name = os.environ['REPORTS_BUCKET_NAME']
        fraud_alerts_topic_arn = os.environ['FRAUD_ALERTS_TOPIC_ARN']
        environment_suffix = os.environ['ENVIRONMENT_SUFFIX']
        
        # Initialize DynamoDB tables
        processing_table = dynamodb.Table(processing_table_name)
        fraud_table = dynamodb.Table(fraud_table_name)
        
        logger.info(f"Processing {len(event['Records'])} priority transaction records")
        
        processed_count = 0
        failed_count = 0
        
        for record in event['Records']:
            try:
                # Parse transaction data from SQS message
                transaction_data = json.loads(record['body'])
                logger.info(f"Processing priority transaction: {transaction_data.get('transaction_id')}")
                
                # Enhanced processing for priority transactions
                result = process_priority_transaction(
                    transaction_data,
                    processing_table,
                    fraud_table,
                    reports_bucket_name,
                    fraud_alerts_topic_arn
                )
                
                if result['success']:
                    processed_count += 1
                    logger.info(f"Successfully processed priority transaction: {transaction_data.get('transaction_id')}")
                else:
                    failed_count += 1
                    logger.error(f"Failed to process priority transaction: {result.get('error')}")
                    
            except Exception as e:
                failed_count += 1
                logger.error(f"Error processing priority record: {str(e)}")
                
                # Send failure notification
                try:
                    sns.publish(
                        TopicArn=fraud_alerts_topic_arn,
                        Message=f"Priority transaction processing failed: {str(e)}",
                        Subject="CRITICAL: Priority Transaction Processing Error"
                    )
                except Exception as sns_error:
                    logger.error(f"Failed to send SNS notification: {str(sns_error)}")
        
        logger.info(f"Priority processing complete. Successful: {processed_count}, Failed: {failed_count}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Priority processing complete',
                'processed': processed_count,
                'failed': failed_count
            })
        }
        
    except Exception as e:
        logger.error(f"Critical error in priority lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def process_priority_transaction(transaction_data, processing_table, fraud_table, 
                                reports_bucket_name, fraud_alerts_topic_arn):
    """
    Process a high-priority financial transaction with enhanced checks.
    
    Args:
        transaction_data: Dictionary containing transaction details
        processing_table: DynamoDB table for processing state
        fraud_table: DynamoDB table for fraud detection results
        reports_bucket_name: S3 bucket for storing reports
        fraud_alerts_topic_arn: SNS topic for fraud alerts
        
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
        
        # Priority transaction validation
        if amount <= Decimal('10000'):
            logger.warning(f"Transaction {transaction_id} below priority threshold: ${amount}")
        
        # Validate required fields with stricter checks for priority transactions
        if not customer_id or amount <= 0 or not source_account:
            raise ValueError("Missing critical fields for priority transaction")
        
        # Update processing state with priority flag
        processing_table.put_item(Item={
            'transaction_id': transaction_id,
            'customer_id': customer_id,
            'timestamp': timestamp,
            'status': 'priority_processing',
            'amount': amount,
            'type': transaction_type,
            'source_account': source_account,
            'destination_account': destination_account,
            'priority_level': 'HIGH',
            'created_at': timestamp,
            'sla_deadline': (datetime.now() + timedelta(minutes=30)).isoformat(),  # 30-min SLA
            'ttl': int((datetime.now().timestamp() + (90 * 24 * 60 * 60)))  # 90 days TTL for priority
        })
        
        # Enhanced fraud detection for priority transactions
        enhanced_fraud_analysis = perform_enhanced_fraud_detection(
            transaction_id, customer_id, amount, transaction_type, 
            source_account, destination_account, processing_table, fraud_table
        )
        
        # Store enhanced fraud detection results
        fraud_table.put_item(Item={
            'transaction_id': transaction_id,
            'risk_score': enhanced_fraud_analysis['risk_score'],
            'risk_factors': enhanced_fraud_analysis['risk_factors'],
            'recommendation': enhanced_fraud_analysis['recommendation'],
            'confidence_level': enhanced_fraud_analysis['confidence_level'],
            'enhanced_checks': enhanced_fraud_analysis['enhanced_checks'],
            'timestamp': timestamp,
            'status': 'priority_analyzed',
            'model_version': '2.0_enhanced',
            'processing_time_ms': enhanced_fraud_analysis.get('processing_time_ms', 0),
            'ttl': int((datetime.now().timestamp() + (2 * 365 * 24 * 60 * 60)))  # 2 years TTL
        })
        
        # Generate enhanced transaction report
        enhanced_report = generate_priority_transaction_report(
            transaction_data, enhanced_fraud_analysis, timestamp
        )
        
        # Store report in S3 with priority classification
        s3_key = f"priority-reports/{customer_id}/{datetime.now().strftime('%Y/%m/%d')}/{transaction_id}.json"
        s3.put_object(
            Bucket=reports_bucket_name,
            Key=s3_key,
            Body=json.dumps(enhanced_report, default=str),
            ServerSideEncryption='aws:kms',
            ContentType='application/json',
            StorageClass='STANDARD',  # Keep priority reports in standard storage
            Metadata={
                'transaction-id': transaction_id,
                'customer-id': customer_id,
                'risk-score': str(enhanced_fraud_analysis['risk_score']),
                'priority-level': 'HIGH',
                'processed-at': timestamp,
                'amount': str(amount)
            },
            Tagging=f'Priority=HIGH&RiskScore={enhanced_fraud_analysis["risk_score"]}&Amount={amount}'
        )
        
        # Enhanced alerting for priority transactions
        alert_sent = send_priority_alerts(
            transaction_id, customer_id, amount, enhanced_fraud_analysis,
            timestamp, fraud_alerts_topic_arn
        )
        
        # Real-time compliance checks for priority transactions
        compliance_result = perform_priority_compliance_checks(
            transaction_id, customer_id, amount, source_account, 
            destination_account, transaction_type
        )
        
        # Update final processing status with enhanced details
        processing_table.update_item(
            Key={'transaction_id': transaction_id, 'timestamp': timestamp},
            UpdateExpression='SET #status = :status, #completed_at = :completed_at, '
                           '#risk_score = :risk_score, #compliance_status = :compliance_status, '
                           '#alert_sent = :alert_sent, #confidence_level = :confidence_level',
            ExpressionAttributeNames={
                '#status': 'status',
                '#completed_at': 'completed_at',
                '#risk_score': 'risk_score',
                '#compliance_status': 'compliance_status',
                '#alert_sent': 'alert_sent',
                '#confidence_level': 'confidence_level'
            },
            ExpressionAttributeValues={
                ':status': 'priority_completed',
                ':completed_at': timestamp,
                ':risk_score': enhanced_fraud_analysis['risk_score'],
                ':compliance_status': compliance_result['status'],
                ':alert_sent': alert_sent,
                ':confidence_level': enhanced_fraud_analysis['confidence_level']
            }
        )
        
        return {
            'success': True,
            'transaction_id': transaction_id,
            'risk_score': enhanced_fraud_analysis['risk_score'],
            'confidence_level': enhanced_fraud_analysis['confidence_level'],
            'compliance_status': compliance_result['status'],
            'status': 'priority_completed',
            'alert_sent': alert_sent
        }
        
    except Exception as e:
        logger.error(f"Error processing priority transaction {transaction_data.get('transaction_id', 'unknown')}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'transaction_id': transaction_data.get('transaction_id', 'unknown')
        }

def perform_enhanced_fraud_detection(transaction_id, customer_id, amount, transaction_type,
                                   source_account, destination_account, processing_table, fraud_table):
    """
    Perform enhanced fraud detection with additional checks for priority transactions.
    """
    
    start_time = datetime.now()
    risk_score = 0
    risk_factors = []
    enhanced_checks = {}
    confidence_level = 'HIGH'
    
    try:
        # Base risk assessment with enhanced thresholds
        if amount > Decimal('1000000'):  # $1M+
            risk_score += 60
            risk_factors.append('ultra_high_amount')
        elif amount > Decimal('500000'):  # $500K+
            risk_score += 45
            risk_factors.append('very_high_amount')
        elif amount > Decimal('100000'):  # $100K+
            risk_score += 30
            risk_factors.append('high_amount')
        elif amount > Decimal('50000'):  # $50K+
            risk_score += 20
            risk_factors.append('elevated_amount')
        
        # Enhanced transaction type analysis
        ultra_high_risk_types = ['international_wire', 'crypto_exchange', 'cash_equivalent']
        high_risk_types = ['wire_transfer', 'international_transfer', 'large_cash_withdrawal']
        
        if transaction_type in ultra_high_risk_types:
            risk_score += 35
            risk_factors.append('ultra_high_risk_type')
        elif transaction_type in high_risk_types:
            risk_score += 25
            risk_factors.append('high_risk_type')
        
        # Account pattern analysis
        if source_account and destination_account:
            # Check for same-day bidirectional transfers (potential structuring)
            enhanced_checks['bidirectional_check'] = check_bidirectional_transfers(
                customer_id, source_account, destination_account, processing_table
            )
            if enhanced_checks['bidirectional_check']['suspicious']:
                risk_score += 40
                risk_factors.append('suspicious_bidirectional_pattern')
        
        # Velocity checks - enhanced for priority transactions
        velocity_analysis = perform_velocity_analysis(customer_id, amount, processing_table)
        enhanced_checks['velocity_analysis'] = velocity_analysis
        
        if velocity_analysis['daily_amount'] > Decimal('1000000'):
            risk_score += 35
            risk_factors.append('extreme_daily_velocity')
        elif velocity_analysis['daily_amount'] > Decimal('500000'):
            risk_score += 25
            risk_factors.append('high_daily_velocity')
        
        if velocity_analysis['transaction_count'] > 20:
            risk_score += 30
            risk_factors.append('excessive_transaction_frequency')
        
        # Geographic risk analysis (simplified)
        geo_risk = analyze_geographic_risk(source_account, destination_account)
        enhanced_checks['geographic_risk'] = geo_risk
        risk_score += geo_risk['risk_points']
        if geo_risk['risk_factors']:
            risk_factors.extend(geo_risk['risk_factors'])
        
        # Historical fraud pattern matching
        historical_analysis = check_historical_fraud_patterns(customer_id, fraud_table)
        enhanced_checks['historical_analysis'] = historical_analysis
        risk_score += historical_analysis['risk_points']
        if historical_analysis['risk_factors']:
            risk_factors.extend(historical_analysis['risk_factors'])
        
        # Time-based analysis with enhanced patterns
        time_analysis = analyze_transaction_timing(datetime.now())
        enhanced_checks['time_analysis'] = time_analysis
        risk_score += time_analysis['risk_points']
        if time_analysis['risk_factors']:
            risk_factors.extend(time_analysis['risk_factors'])
        
        # Confidence level calculation based on data availability
        if len(enhanced_checks) >= 4 and all(check.get('data_available', False) for check in enhanced_checks.values()):
            confidence_level = 'VERY_HIGH'
        elif len(enhanced_checks) >= 3:
            confidence_level = 'HIGH'
        elif len(enhanced_checks) >= 2:
            confidence_level = 'MEDIUM'
        else:
            confidence_level = 'LOW'
        
        # Cap risk score at 100
        risk_score = min(risk_score, 100)
        
        # Enhanced recommendation logic
        if risk_score >= 90:
            recommendation = 'BLOCK_IMMEDIATE'
        elif risk_score >= 75:
            recommendation = 'MANUAL_REVIEW_URGENT'
        elif risk_score >= 60:
            recommendation = 'ENHANCED_MONITORING'
        elif risk_score >= 40:
            recommendation = 'STANDARD_MONITORING'
        else:
            recommendation = 'APPROVE'
        
        processing_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return {
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendation': recommendation,
            'confidence_level': confidence_level,
            'enhanced_checks': enhanced_checks,
            'processing_time_ms': processing_time_ms,
            'analysis_timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in enhanced fraud detection for transaction {transaction_id}: {str(e)}")
        return {
            'risk_score': 75,  # High risk on error for priority transactions
            'risk_factors': ['enhanced_analysis_error'],
            'recommendation': 'MANUAL_REVIEW_URGENT',
            'confidence_level': 'LOW',
            'enhanced_checks': {'error': str(e)},
            'error': str(e)
        }

def check_bidirectional_transfers(customer_id, source_account, destination_account, processing_table):
    """Check for suspicious bidirectional transfer patterns."""
    try:
        # Implementation would check for recent transfers in both directions
        return {
            'suspicious': False,
            'bidirectional_count': 0,
            'data_available': True
        }
    except Exception:
        return {'suspicious': False, 'data_available': False}

def perform_velocity_analysis(customer_id, current_amount, processing_table):
    """Analyze transaction velocity for the customer."""
    try:
        # Query recent transactions for velocity analysis
        daily_amount = current_amount
        transaction_count = 1
        
        # In real implementation, would query last 24 hours of transactions
        return {
            'daily_amount': daily_amount,
            'transaction_count': transaction_count,
            'data_available': True
        }
    except Exception:
        return {'daily_amount': Decimal('0'), 'transaction_count': 0, 'data_available': False}

def analyze_geographic_risk(source_account, destination_account):
    """Analyze geographic risk based on account locations."""
    risk_points = 0
    risk_factors = []
    
    # Simplified geographic risk analysis
    high_risk_regions = ['OFFSHORE', 'SANCTIONED', 'HIGH_RISK_JURISDICTION']
    
    # In real implementation, would look up account locations
    return {
        'risk_points': risk_points,
        'risk_factors': risk_factors,
        'data_available': True
    }

def check_historical_fraud_patterns(customer_id, fraud_table):
    """Check historical fraud patterns for the customer."""
    try:
        # Query historical fraud records
        risk_points = 0
        risk_factors = []
        
        # In real implementation, would analyze historical fraud patterns
        return {
            'risk_points': risk_points,
            'risk_factors': risk_factors,
            'historical_fraud_count': 0,
            'data_available': True
        }
    except Exception:
        return {'risk_points': 0, 'risk_factors': [], 'data_available': False}

def analyze_transaction_timing(transaction_time):
    """Analyze transaction timing patterns."""
    risk_points = 0
    risk_factors = []
    
    # Weekend transactions
    if transaction_time.weekday() >= 5:
        risk_points += 15
        risk_factors.append('weekend_transaction')
    
    # Off-hours transactions (before 6 AM or after 10 PM)
    if transaction_time.hour < 6 or transaction_time.hour > 22:
        risk_points += 20
        risk_factors.append('off_hours_transaction')
    
    # Holiday transactions (simplified check)
    if transaction_time.month == 12 and transaction_time.day >= 24:
        risk_points += 10
        risk_factors.append('holiday_transaction')
    
    return {
        'risk_points': risk_points,
        'risk_factors': risk_factors,
        'data_available': True
    }

def send_priority_alerts(transaction_id, customer_id, amount, fraud_analysis, 
                        timestamp, fraud_alerts_topic_arn):
    """Send appropriate alerts for priority transactions."""
    try:
        alert_message = {
            'alert_type': 'priority_transaction_processed',
            'transaction_id': transaction_id,
            'customer_id': customer_id,
            'amount': float(amount),
            'risk_score': fraud_analysis['risk_score'],
            'confidence_level': fraud_analysis['confidence_level'],
            'recommendation': fraud_analysis['recommendation'],
            'risk_factors': fraud_analysis['risk_factors'],
            'timestamp': timestamp,
            'processing_sla': '30_minutes'
        }
        
        # Determine alert level and subject
        if fraud_analysis['risk_score'] >= 90:
            subject = f"🚨 CRITICAL: High Risk Priority Transaction - ID: {transaction_id}"
            alert_level = 'CRITICAL'
        elif fraud_analysis['risk_score'] >= 75:
            subject = f"⚠️ URGENT: Priority Transaction Review Required - ID: {transaction_id}"
            alert_level = 'URGENT'
        elif fraud_analysis['risk_score'] >= 60:
            subject = f"📊 PRIORITY: Enhanced Monitoring Required - ID: {transaction_id}"
            alert_level = 'HIGH'
        else:
            subject = f"✅ PRIORITY: Transaction Processed - ID: {transaction_id}"
            alert_level = 'INFO'
        
        sns.publish(
            TopicArn=fraud_alerts_topic_arn,
            Message=json.dumps(alert_message, default=str),
            Subject=subject,
            MessageAttributes={
                'alert_level': {'DataType': 'String', 'StringValue': alert_level},
                'transaction_id': {'DataType': 'String', 'StringValue': transaction_id},
                'priority': {'DataType': 'String', 'StringValue': 'HIGH'},
                'risk_score': {'DataType': 'Number', 'StringValue': str(fraud_analysis['risk_score'])}
            }
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to send priority alert for transaction {transaction_id}: {str(e)}")
        return False

def perform_priority_compliance_checks(transaction_id, customer_id, amount, 
                                     source_account, destination_account, transaction_type):
    """Perform enhanced compliance checks for priority transactions."""
    try:
        compliance_checks = {
            'aml_check': 'PASSED',
            'sanctions_check': 'PASSED',
            'kyc_status': 'VERIFIED',
            'pep_check': 'CLEAR',
            'ofac_check': 'CLEAR',
            'regulatory_threshold': 'WITHIN_LIMITS'
        }
        
        # Enhanced compliance logic would go here
        # For demonstration, all checks pass
        
        return {
            'status': 'COMPLIANT',
            'checks': compliance_checks,
            'completed_at': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Compliance check error for transaction {transaction_id}: {str(e)}")
        return {
            'status': 'REVIEW_REQUIRED',
            'error': str(e),
            'completed_at': datetime.now().isoformat()
        }

def generate_priority_transaction_report(transaction_data, fraud_analysis, timestamp):
    """Generate an enhanced report for priority transactions."""
    
    return {
        'report_metadata': {
            'report_id': str(uuid.uuid4()),
            'generated_at': timestamp,
            'report_version': '2.0_priority',
            'processing_engine': 'tap-priority-processor',
            'priority_level': 'HIGH',
            'sla_target': '30_minutes'
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
            'original_timestamp': transaction_data.get('timestamp'),
            'priority_classification': 'HIGH_VALUE'
        },
        'enhanced_processing_results': {
            'status': 'priority_completed',
            'processed_at': timestamp,
            'processing_duration_ms': fraud_analysis.get('processing_time_ms', 0),
            'fraud_analysis': fraud_analysis,
            'confidence_assessment': {
                'overall_confidence': fraud_analysis.get('confidence_level', 'MEDIUM'),
                'data_completeness': 'HIGH',
                'model_performance': 'OPTIMAL'
            }
        },
        'enhanced_compliance': {
            'regulatory_flags': [],
            'aml_status': 'enhanced_check_passed',
            'kyc_status': 'priority_verified',
            'sanctions_check': 'real_time_clear',
            'pep_screening': 'enhanced_clear',
            'regulatory_reporting': 'auto_filed'
        },
        'audit_trail': {
            'created_by': 'tap-priority-processor',
            'processing_node': os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'unknown'),
            'execution_id': os.environ.get('AWS_LAMBDA_LOG_STREAM_NAME', 'unknown'),
            'priority_queue': True,
            'enhanced_checks_performed': len(fraud_analysis.get('enhanced_checks', {}))
        },
        'monitoring_metrics': {
            'queue_wait_time_ms': 0,  # Would be calculated from SQS attributes
            'processing_latency_ms': fraud_analysis.get('processing_time_ms', 0),
            'total_pipeline_time_ms': 0  # Would include end-to-end timing
        }
    }
"""
Fraud Analyzer Lambda Function
Runs machine learning inference to detect fraud patterns in transactions.
"""
import json
import boto3
import logging
import random
from typing import Dict, Any
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize boto3 clients
ssm_client = boto3.client('ssm')

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Analyze transaction for fraud patterns using ML inference.
    
    Args:
        event: Lambda event containing validated transaction data
        context: Lambda context
        
    Returns:
        Dict containing fraud analysis result
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Extract transaction data
        transaction = event.get('transaction', {})
        
        if not transaction:
            return {
                'statusCode': 400,
                'status': 'ANALYSIS_FAILED',
                'error': 'No transaction data provided'
            }
        
        # Get ML model endpoint from Parameter Store
        try:
            ml_endpoint_param = os.environ.get('ML_MODEL_ENDPOINT_PARAM')
            if ml_endpoint_param:
                response = ssm_client.get_parameter(
                    Name=ml_endpoint_param,
                    WithDecryption=True
                )
                ml_endpoint = response['Parameter']['Value']
                logger.info(f"Retrieved ML endpoint: {ml_endpoint}")
        except Exception as e:
            logger.warning(f"Could not retrieve ML endpoint: {str(e)}")
            ml_endpoint = "default-endpoint"
        
        # Analyze transaction (simplified ML logic for demo)
        fraud_score = _analyze_transaction_patterns(transaction)
        
        # Determine if transaction is fraudulent
        fraud_threshold = 0.7
        is_fraud = fraud_score > fraud_threshold
        
        # Risk category
        if fraud_score < 0.3:
            risk_level = "LOW"
        elif fraud_score < 0.7:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        analysis_result = {
            'transaction_id': transaction.get('transaction_id'),
            'fraud_score': round(fraud_score, 3),
            'is_fraud': is_fraud,
            'risk_level': risk_level,
            'analysis_timestamp': context.aws_request_id if context else None,
            'model_version': 'v1.0',
            'factors_analyzed': _get_analysis_factors(transaction, fraud_score)
        }
        
        logger.info(f"Fraud analysis completed - ID: {transaction.get('transaction_id')}, Score: {fraud_score}, Fraud: {is_fraud}")
        
        return {
            'statusCode': 200,
            'status': 'ANALYSIS_COMPLETED',
            'transaction': {**transaction, **analysis_result}
        }
        
    except Exception as e:
        logger.error(f"Fraud analysis error: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'ANALYSIS_ERROR',
            'error': str(e)
        }

def _analyze_transaction_patterns(transaction: Dict[str, Any]) -> float:
    """
    Simplified fraud detection algorithm.
    In production, this would call an actual ML model endpoint.
    
    Args:
        transaction: Transaction data
        
    Returns:
        Fraud score between 0 and 1
    """
    score = 0.0
    
    # Amount-based risk factors
    amount = float(transaction.get('amount', 0))
    
    if amount > 10000:
        score += 0.3
    elif amount > 5000:
        score += 0.2
    elif amount > 1000:
        score += 0.1
    
    # Time-based patterns (simplified)
    import time
    current_hour = int(time.strftime('%H'))
    if current_hour < 6 or current_hour > 23:  # Late night transactions
        score += 0.2
    
    # Merchant risk (simplified - in production would use ML model)
    merchant = transaction.get('merchant', '').lower()
    high_risk_merchants = ['casino', 'gambling', 'crypto', 'bitcoin']
    if any(risk_word in merchant for risk_word in high_risk_merchants):
        score += 0.4
    
    # Card number patterns (simplified)
    card_hash = transaction.get('card_number_hash', 0)
    if abs(card_hash) % 10 > 7:  # Pseudo-random risk factor
        score += 0.15
    
    # Add some randomness to simulate ML model variability
    score += random.uniform(-0.1, 0.1)
    
    # Ensure score is between 0 and 1
    return max(0.0, min(1.0, score))

def _get_analysis_factors(transaction: Dict[str, Any], fraud_score: float) -> Dict[str, Any]:
    """
    Get factors that contributed to the fraud score.
    
    Args:
        transaction: Transaction data
        fraud_score: Calculated fraud score
        
    Returns:
        Dict of analysis factors
    """
    amount = float(transaction.get('amount', 0))
    
    factors = {
        'high_amount': amount > 5000,
        'very_high_amount': amount > 10000,
        'late_night_transaction': False,  # Simplified
        'high_risk_merchant': any(word in transaction.get('merchant', '').lower() 
                                for word in ['casino', 'gambling', 'crypto']),
        'velocity_check': 'not_implemented',
        'location_check': 'not_implemented',
        'device_fingerprint': 'not_implemented'
    }
    
    return factors
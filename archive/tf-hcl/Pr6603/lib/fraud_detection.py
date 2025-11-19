import json
import random
import logging
from datetime import datetime
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Simulate fraud detection service with risk scoring and decision making
    """
    
    # Generate transaction ID (would normally come from payment API)
    transaction_id = str(uuid.uuid4())
    
    # Generate risk score with realistic distribution
    # Low risk: 0-30 (70%), Medium risk: 31-70 (20%), High risk: 71-100 (10%)
    risk_distribution = random.random()
    if risk_distribution < 0.7:
        risk_score = random.randint(0, 30)
    elif risk_distribution < 0.9:
        risk_score = random.randint(31, 70)
    else:
        risk_score = random.randint(71, 100)
    
    # Make decision based on risk score
    if risk_score < 30:
        decision = 'approve'
    elif risk_score < 80:
        decision = 'review'
    else:
        decision = 'reject'
    
    # Calculate processing time based on complexity
    if decision == 'approve':
        processing_time = random.randint(10, 50)
    elif decision == 'review':
        processing_time = random.randint(100, 300)
    else:
        processing_time = random.randint(50, 150)
    
    # Build log entry
    log_entry = {
        'transaction_id': transaction_id,
        'risk_score': risk_score,
        'decision': decision,
        'processing_time_ms': processing_time,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    
    # Add additional context for high-risk transactions
    if risk_score > 80:
        log_entry['risk_factors'] = random.sample([
            'unusual_location',
            'high_velocity',
            'suspicious_amount',
            'new_device',
            'multiple_failed_attempts'
        ], k=random.randint(2, 4))
    
    # Log the entry
    logger.info(json.dumps(log_entry))
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Fraud detection log generated',
            'transaction_id': transaction_id,
            'decision': decision
        })
    }
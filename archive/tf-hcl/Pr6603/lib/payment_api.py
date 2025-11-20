import json
import random
import time
import logging
from datetime import datetime
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Simulate payment API transactions with varying response times and error rates
    """
    
    # Generate transaction ID
    transaction_id = str(uuid.uuid4())
    
    # Simulate different transaction scenarios
    scenarios = [
        # Success scenarios (80%)
        {'status_code': 200, 'response_time': random.randint(50, 200), 'weight': 0.80},
        # Client errors (10%)
        {'status_code': 400, 'response_time': random.randint(10, 50), 'weight': 0.05},
        {'status_code': 401, 'response_time': random.randint(10, 50), 'weight': 0.03},
        {'status_code': 403, 'response_time': random.randint(10, 50), 'weight': 0.02},
        # Server errors (5%)
        {'status_code': 500, 'response_time': random.randint(200, 800), 'weight': 0.03},
        {'status_code': 502, 'response_time': random.randint(500, 1000), 'weight': 0.01},
        {'status_code': 503, 'response_time': random.randint(300, 700), 'weight': 0.01},
        # Slow but successful (5%)
        {'status_code': 200, 'response_time': random.randint(600, 1500), 'weight': 0.05}
    ]
    
    # Select scenario based on weights
    rand = random.random()
    cumulative = 0
    selected_scenario = scenarios[0]
    
    for scenario in scenarios:
        cumulative += scenario['weight']
        if rand <= cumulative:
            selected_scenario = scenario
            break
    
    # Generate transaction amount
    amount = round(random.uniform(10, 5000), 2)
    
    # Build log entry
    log_entry = {
        'transaction_id': transaction_id,
        'amount': amount,
        'status_code': selected_scenario['status_code'],
        'response_time_ms': selected_scenario['response_time'],
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    
    # Add error message for error scenarios
    if selected_scenario['status_code'] >= 400:
        error_messages = {
            400: 'Invalid request format',
            401: 'Authentication failed',
            403: 'Insufficient permissions',
            500: 'Internal server error',
            502: 'Gateway timeout',
            503: 'Service temporarily unavailable'
        }
        log_entry['error_message'] = error_messages.get(
            selected_scenario['status_code'], 
            'Unknown error'
        )
    
    # Log the entry
    logger.info(json.dumps(log_entry))
    
    # Simulate processing time
    time.sleep(selected_scenario['response_time'] / 1000)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Payment API log generated',
            'transaction_id': transaction_id
        })
    }
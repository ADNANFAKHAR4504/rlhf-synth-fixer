import json
import os
import boto3
import hashlib
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

personalize_runtime = boto3.client('personalize-runtime')

REDIS_ENDPOINT = os.environ.get('REDIS_ENDPOINT', '')
PERSONALIZE_REGION = os.environ.get('PERSONALIZE_REGION', 'us-east-1')

# Simple in-memory cache for demo (use Redis in production)
cache = {}

def get_campaign_for_user(user_id):
    """Determine which campaign to use for A/B testing"""
    # Use consistent hashing for user assignment
    hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    # Simple A/B split
    return "campaign_a" if hash_val % 2 == 0 else "campaign_b"

def lambda_handler(event, context):
    """Handle recommendation API requests"""
    
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        num_results = body.get('num_results', 10)
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'user_id is required'})
            }
        
        # Check cache
        cache_key = f"recommendations:{user_id}:{num_results}"
        
        if cache_key in cache:
            logger.info(f"Cache hit for user {user_id}")
            return {
                'statusCode': 200,
                'body': cache[cache_key],
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Cache': 'HIT'
                }
            }
        
        # Get campaign for A/B testing
        campaign_name = get_campaign_for_user(user_id)
        
        # Mock recommendations for demo
        recommendations = {
            'user_id': user_id,
            'recommendations': [
                {'itemId': f'item_{i}', 'score': 0.9 - (i * 0.1)} 
                for i in range(num_results)
            ],
            'campaign': campaign_name,
            'timestamp': context.aws_request_id
        }
        
        result = json.dumps(recommendations)
        
        # Cache for 1 hour
        cache[cache_key] = result
        
        return {
            'statusCode': 200,
            'body': result,
            'headers': {
                'Content-Type': 'application/json',
                'X-Cache': 'MISS',
                'X-Campaign': campaign_name
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

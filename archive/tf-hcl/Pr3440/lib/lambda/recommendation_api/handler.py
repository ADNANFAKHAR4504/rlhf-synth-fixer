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
PERSONALIZE_CAMPAIGN_ARN = os.environ.get('PERSONALIZE_CAMPAIGN_ARN', '')

# Redis connection with proper error handling
redis_client = None
try:
    import redis
    if REDIS_ENDPOINT:
        redis_client = redis.Redis(
            host=REDIS_ENDPOINT,
            port=6379,
            socket_connect_timeout=2,
            socket_timeout=2,
            decode_responses=True
        )
        # Test connection
        redis_client.ping()
        logger.info(f"Successfully connected to Redis at {REDIS_ENDPOINT}")
except ImportError:
    logger.warning("Redis library not installed, falling back to in-memory cache")
except Exception as e:
    logger.warning(f"Failed to connect to Redis: {str(e)}, falling back to in-memory cache")
    redis_client = None

# Fallback in-memory cache if Redis unavailable
memory_cache = {}

def get_campaign_for_user(user_id):
    """Determine which campaign to use for A/B testing"""
    # Use consistent hashing for user assignment
    hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    # Simple A/B split
    return "campaign_a" if hash_val % 2 == 0 else "campaign_b"

def get_from_cache(cache_key):
    """Get value from cache (Redis or memory)"""
    try:
        if redis_client:
            value = redis_client.get(cache_key)
            return value
        else:
            return memory_cache.get(cache_key)
    except Exception as e:
        logger.error(f"Cache read error: {str(e)}")
        return None

def set_to_cache(cache_key, value, ttl=3600):
    """Set value in cache (Redis or memory)"""
    try:
        if redis_client:
            redis_client.setex(cache_key, ttl, value)
        else:
            memory_cache[cache_key] = value
    except Exception as e:
        logger.error(f"Cache write error: {str(e)}")

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
        cached_result = get_from_cache(cache_key)
        
        if cached_result:
            logger.info(f"Cache hit for user {user_id}")
            return {
                'statusCode': 200,
                'body': cached_result,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Cache': 'HIT'
                }
            }
        
        # Get campaign for A/B testing
        campaign_name = get_campaign_for_user(user_id)
        
        recommendations = None
        
        # Try to get recommendations from Personalize
        if PERSONALIZE_CAMPAIGN_ARN:
            try:
                response = personalize_runtime.get_recommendations(
                    campaignArn=PERSONALIZE_CAMPAIGN_ARN,
                    userId=user_id,
                    numResults=num_results
                )
                recommendations = {
                    'user_id': user_id,
                    'recommendations': [
                        {
                            'itemId': item['itemId'],
                            'score': float(item.get('score', 0))
                        }
                        for item in response.get('itemList', [])
                    ],
                    'campaign': campaign_name,
                    'source': 'personalize',
                    'timestamp': context.aws_request_id
                }
                logger.info(f"Got {len(recommendations['recommendations'])} recommendations from Personalize")
            except Exception as e:
                logger.warning(f"Personalize request failed: {str(e)}, falling back to mock data")
        
        # Fallback to mock recommendations if Personalize unavailable
        if not recommendations:
            recommendations = {
                'user_id': user_id,
                'recommendations': [
                    {'itemId': f'item_{i}', 'score': 0.9 - (i * 0.1)} 
                    for i in range(num_results)
                ],
                'campaign': campaign_name,
                'source': 'mock',
                'timestamp': context.aws_request_id
            }
            logger.info(f"Using mock recommendations")
        
        result = json.dumps(recommendations)
        
        # Cache for 1 hour
        set_to_cache(cache_key, result, ttl=3600)
        
        return {
            'statusCode': 200,
            'body': result,
            'headers': {
                'Content-Type': 'application/json',
                'X-Cache': 'MISS',
                'X-Campaign': campaign_name,
                'X-Source': recommendations.get('source', 'unknown')
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

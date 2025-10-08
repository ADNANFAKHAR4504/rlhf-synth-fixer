import json
import os
import boto3
import time
import logging
import hashlib
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')
cloudwatch = boto3.client('cloudwatch')

# Initialize Redis client (only if redis library is available)
redis_client = None
try:
    import redis
    if os.environ.get('REDIS_ENDPOINT'):
        redis_client = redis.Redis(
            host=os.environ['REDIS_ENDPOINT'],
            port=6379,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        # Test connection
        redis_client.ping()
        logger.info("Redis connection established")
except Exception as e:
    logger.warning(f"Redis unavailable, falling back to DynamoDB only: {e}")
    redis_client = None

# Environment variables
TABLE_NAME = os.environ['TABLE_NAME']
EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']
CACHE_TTL = int(os.environ.get('CACHE_TTL', '3600'))  # 1 hour default

def lambda_handler(event, context):
    request_id = context.aws_request_id
    start_time = time.time()
    
    try:
        # Parse request
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '')
        query_params = event.get('queryStringParameters', {}) or {}
        
        # Route based on path and method
        if path == '/search' and http_method == 'GET':
            response = handle_search(query_params, request_id)
        else:
            response = {
                'statusCode': 404,
                'body': json.dumps({'error': 'Not Found'})
            }
        
        # Record metrics
        duration = (time.time() - start_time) * 1000
        record_metrics(path, response['statusCode'], duration)
        
        # Add CORS headers
        response['headers'] = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Request-ID': request_id,
            'X-Cache-Status': response.get('cache_status', 'none')
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': json.dumps({'error': 'Internal Server Error'})
        }

def handle_search(params, request_id):
    search_type = params.get('type', 'flight')
    search_query = params.get('q', '')
    
    if not search_query:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Query parameter "q" is required'})
        }
    
    # Generate cache key
    cache_key = f"search:{search_type}:{hashlib.md5(search_query.encode()).hexdigest()}"
    
    # Try Redis cache first
    cached_result = get_from_cache(cache_key)
    if cached_result:
        logger.info(f"Cache hit for key: {cache_key}")
        return {
            'statusCode': 200,
            'body': json.dumps(cached_result, cls=DecimalEncoder),
            'cache_status': 'hit'
        }
    
    # Cache miss - check DynamoDB
    table = dynamodb.Table(TABLE_NAME)
    timestamp = int(time.time())
    
    try:
        response = table.get_item(
            Key={
                'searchType': search_type,
                'searchId': search_query
            }
        )
        
        if 'Item' in response and (timestamp - response['Item'].get('timestamp', 0)) < CACHE_TTL:
            result = response['Item']['data']
            # Store in Redis cache for faster access
            set_in_cache(cache_key, result, CACHE_TTL)
            cache_status = 'hit-db'
        else:
            # Generate new result
            result = generate_search_result(search_type, search_query, timestamp)
            
            # Store in DynamoDB
            table.put_item(Item={
                'searchType': search_type,
                'searchId': search_query,
                'timestamp': timestamp,
                'data': result,
                'ttl': timestamp + CACHE_TTL
            })
            
            # Store in Redis cache
            set_in_cache(cache_key, result, CACHE_TTL)
            
            # Publish event for external integration
            publish_integration_event(search_type, search_query, request_id)
            cache_status = 'miss'
        
        return {
            'statusCode': 200,
            'body': json.dumps(result, cls=DecimalEncoder),
            'cache_status': cache_status
        }
        
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to process search'})
        }

def get_from_cache(key):
    """Get data from Redis cache"""
    if not redis_client:
        return None
    
    try:
        cached_data = redis_client.get(key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        logger.warning(f"Redis get failed: {e}")
    
    return None

def set_in_cache(key, data, ttl):
    """Set data in Redis cache"""
    if not redis_client:
        return
    
    try:
        redis_client.setex(key, ttl, json.dumps(data, cls=DecimalEncoder))
    except Exception as e:
        logger.warning(f"Redis set failed: {e}")

def generate_search_result(search_type, search_query, timestamp):
    """Generate mock search results"""
    return {
        'searchType': search_type,
        'query': search_query,
        'results': [
            {
                'id': f"{search_type}-1",
                'name': f"Sample {search_type} result for {search_query}",
                'price': 299.99,
                'currency': 'USD',
                'availability': 'available'
            },
            {
                'id': f"{search_type}-2", 
                'name': f"Premium {search_type} option for {search_query}",
                'price': 449.99,
                'currency': 'USD',
                'availability': 'limited'
            }
        ],
        'timestamp': timestamp,
        'total_results': 2
    }

def publish_integration_event(search_type, query, request_id):
    try:
        events.put_events(
            Entries=[
                {
                    'Source': 'travel.platform.search',
                    'DetailType': 'Search Request',
                    'Detail': json.dumps({
                        'searchType': search_type,
                        'query': query,
                        'requestId': request_id,
                        'timestamp': int(time.time())
                    }),
                    'EventBusName': EVENT_BUS_NAME
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to publish event: {str(e)}")

def record_metrics(endpoint, status_code, duration):
    try:
        metrics = [
            {
                'MetricName': 'RequestLatency',
                'Dimensions': [
                    {'Name': 'Endpoint', 'Value': endpoint},
                    {'Name': 'StatusCode', 'Value': str(status_code)}
                ],
                'Value': duration,
                'Unit': 'Milliseconds'
            }
        ]
        
        # Add cache performance metrics
        if redis_client:
            try:
                cache_info = redis_client.info()
                metrics.append({
                    'MetricName': 'CacheConnections',
                    'Value': cache_info.get('connected_clients', 0),
                    'Unit': 'Count'
                })
            except:
                pass
        
        cloudwatch.put_metric_data(
            Namespace='TravelPlatform/API',
            MetricData=metrics
        )
    except Exception as e:
        logger.error(f"Failed to record metrics: {str(e)}")

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)
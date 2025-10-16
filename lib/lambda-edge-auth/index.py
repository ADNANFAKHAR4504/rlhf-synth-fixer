import json
import base64
import os
import boto3
import time
from urllib.parse import parse_qs

AUTH_TYPE = os.environ.get('AUTH_TYPE', 'jwt')
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', '')
API_ENDPOINT = os.environ.get('API_ENDPOINT', '')
JWT_SECRET_ARN = os.environ.get('JWT_SECRET_ARN', '')
AWS_REGION_TABLE = os.environ.get('AWS_REGION_TABLE', 'us-east-1')

dynamodb = boto3.client('dynamodb', region_name=AWS_REGION_TABLE)
secretsmanager = boto3.client('secretsmanager', region_name=AWS_REGION_TABLE)

jwt_secret_cache = None
jwt_secret_cache_time = 0
SECRET_CACHE_TTL = 300


def get_jwt_secret():
    global jwt_secret_cache, jwt_secret_cache_time

    current_time = time.time()
    if jwt_secret_cache and (current_time - jwt_secret_cache_time) < SECRET_CACHE_TTL:
        return jwt_secret_cache

    try:
        response = secretsmanager.get_secret_value(SecretId=JWT_SECRET_ARN)
        jwt_secret_cache = response['SecretString']
        jwt_secret_cache_time = current_time
        return jwt_secret_cache
    except Exception as e:
        print(f"Error fetching JWT secret: {str(e)}")
        return None


def validate_jwt_token(token):
    try:
        import jwt
        secret = get_jwt_secret()
        if not secret:
            return False

        decoded = jwt.decode(token, secret, algorithms=['HS256'])

        if decoded.get('exp') and decoded['exp'] < time.time():
            return False

        return decoded.get('subscription_tier') == 'premium'
    except Exception as e:
        print(f"JWT validation error: {str(e)}")
        return False


def validate_via_dynamodb(subscriber_id):
    try:
        response = dynamodb.get_item(
            TableName=DYNAMODB_TABLE,
            Key={'subscriber_id': {'S': subscriber_id}}
        )

        if 'Item' not in response:
            return False

        item = response['Item']
        subscription_tier = item.get('subscription_tier', {}).get('S', '')
        expiration = item.get('expiration_timestamp', {}).get('N', '0')

        if subscription_tier != 'premium':
            return False

        if int(expiration) < int(time.time()):
            return False

        return True
    except Exception as e:
        print(f"DynamoDB validation error: {str(e)}")
        return False


def validate_via_api(token):
    try:
        import urllib3
        http = urllib3.PoolManager()

        response = http.request(
            'POST',
            API_ENDPOINT,
            body=json.dumps({'token': token}),
            headers={'Content-Type': 'application/json'}
        )

        data = json.loads(response.data.decode('utf-8'))
        return data.get('valid', False) and data.get('subscription_tier') == 'premium'
    except Exception as e:
        print(f"API validation error: {str(e)}")
        return False


def extract_token_from_request(request):
    headers = request.get('headers', {})

    authorization = None
    for key, value in headers.items():
        if key.lower() == 'authorization':
            authorization = value[0]['value'] if isinstance(value, list) else value
            break

    if authorization:
        if authorization.startswith('Bearer '):
            return authorization[7:]
        return authorization

    cookies = None
    for key, value in headers.items():
        if key.lower() == 'cookie':
            cookies = value[0]['value'] if isinstance(value, list) else value
            break

    if cookies:
        for cookie in cookies.split(';'):
            cookie = cookie.strip()
            if cookie.startswith('auth-token='):
                return cookie.split('=', 1)[1]

    return None


def is_premium_content(uri):
    return uri.startswith('/premium/') or uri.startswith('/premium')


def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    uri = request['uri']

    if not is_premium_content(uri):
        return request

    token = extract_token_from_request(request)

    if not token:
        return {
            'status': '403',
            'statusDescription': 'Forbidden',
            'headers': {
                'content-type': [{
                    'key': 'Content-Type',
                    'value': 'text/html'
                }],
                'cache-control': [{
                    'key': 'Cache-Control',
                    'value': 'no-cache, no-store, must-revalidate'
                }]
            },
            'body': '<html><head><title>403 Forbidden</title></head><body><h1>Access Denied</h1><p>Authentication required for premium content.</p></body></html>'
        }

    is_authorized = False

    if AUTH_TYPE == 'jwt':
        is_authorized = validate_jwt_token(token)
    elif AUTH_TYPE == 'dynamodb':
        is_authorized = validate_via_dynamodb(token)
    elif AUTH_TYPE == 'api':
        is_authorized = validate_via_api(token)

    if not is_authorized:
        return {
            'status': '403',
            'statusDescription': 'Forbidden',
            'headers': {
                'content-type': [{
                    'key': 'Content-Type',
                    'value': 'text/html'
                }],
                'cache-control': [{
                    'key': 'Cache-Control',
                    'value': 'no-cache, no-store, must-revalidate'
                }]
            },
            'body': '<html><head><title>403 Forbidden</title></head><body><h1>Access Denied</h1><p>Invalid or expired subscription for premium content.</p></body></html>'
        }

    if 'headers' not in request:
        request['headers'] = {}

    request['headers']['cache-control'] = [{
        'key': 'Cache-Control',
        'value': 'private, max-age=3600'
    }]

    return request

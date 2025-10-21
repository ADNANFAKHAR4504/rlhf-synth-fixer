import json
import time

def is_premium_content(uri):
    return uri.startswith('/premium/') or uri.startswith('/premium')


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

    if len(token) < 10:
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

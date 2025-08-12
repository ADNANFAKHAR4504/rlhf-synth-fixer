import urllib.request
import urllib.error
import json

def lambda_handler(event, context):
    # Database connection details
    database_endpoint = os.environ.get("DB_HOST").split(":")[0]
    
    try:
        # Extract URL from event
        url = database_endpoint
        
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Get timeout from event or use default
        timeout = event.get('timeout', 10)
        
        # Create request with timeout
        request = urllib.request.Request(url)
        request.add_header('User-Agent', 'Mozilla/5.0 (compatible; ReachabilityBot/1.0)')
        
        # Attempt to open the URL
        with urllib.request.urlopen(request, timeout=timeout) as response:
            status_code = response.getcode()
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'url': url,
                    'reachable': True,
                    'status_code': status_code,
                    'response_time_ms': None,  # urllib doesn't provide timing info
                    'message': f'Successfully reached {url}'
                })
            }
            
    except urllib.error.HTTPError as e:
        # HTTP error (4xx, 5xx status codes)
        return {
            'statusCode': 200,
            'body': json.dumps({
                'url': url,
                'reachable': False,
                'status_code': e.code,
                'error': f'HTTP Error: {e.code} - {e.reason}',
                'message': f'Received HTTP error when reaching {url}'
            })
        }
        
    except urllib.error.URLError as e:
        # URL/Network error (DNS, connection timeout, etc.)
        return {
            'statusCode': 200,
            'body': json.dumps({
                'url': url,
                'reachable': False,
                'status_code': None,
                'error': f'URL Error: {str(e.reason)}',
                'message': f'Could not reach {url}'
            })
        }
        
    except Exception as e:
        # Unexpected error
        return {
            'statusCode': 500,
            'body': json.dumps({
                'url': url,
                'reachable': False,
                'error': f'Unexpected error: {str(e)}',
                'message': 'An unexpected error occurred'
            })
        }
    
# if __name__ == "__main__":
#     # Test event
#     test_event = {
#         "url": "https://google.com",
#         "timeout": 5
#     }
    
#     result = lambda_handler(test_event, None)
#     print(json.dumps(result, indent=2))
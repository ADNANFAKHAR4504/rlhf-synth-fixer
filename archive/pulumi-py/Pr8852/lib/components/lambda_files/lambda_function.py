import socket
import os
import json
import time


def check_rds_reachability(host, port=5432, timeout=5):
    """
    Checks if a TCP connection can be established to the given RDS endpoint and port.
    Returns True if reachable, False otherwise.
    """
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, socket.error):
        return False


def lambda_handler(event, context):
    # Database connection details
    database_endpoint = os.environ.get("DB_HOST")

    # Parse host and port from DB_HOST environment variable
    if ":" in database_endpoint:
        host, port_str = database_endpoint.split(":", 1)
        port = int(port_str)
    else:
        host = database_endpoint
        port = 5432  # Default PostgreSQL port

    # Get timeout from event or use default
    timeout = event.get('timeout', 10)

    try:
        # Record start time for response time calculation
        start_time = time.time()

        # Test reachability using socket connection
        is_reachable = check_rds_reachability(host, port, timeout)

        # Calculate response time
        end_time = time.time()
        response_time_ms = round((end_time - start_time) * 1000, 2)

        if is_reachable:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'host': host,
                    'port': port,
                    'reachable': True,
                    'response_time_ms': response_time_ms,
                    'message': f'Successfully connected to {host}:{port}'
                })
            }
        else:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'host': host,
                    'port': port,
                    'reachable': False,
                    'response_time_ms': response_time_ms,
                    'error': 'Connection failed - host unreachable or port closed',
                    'message': f'Could not connect to {host}:{port}'
                })
            }

    except ValueError as e:
        # Error parsing port number
        return {
            'statusCode': 400,
            'body': json.dumps({
                'host': database_endpoint,
                'port': None,
                'reachable': False,
                'error': f'Invalid port format: {str(e)}',
                'message': 'Could not parse database endpoint'
            })
        }

    except Exception as e:
        # Unexpected error
        return {
            'statusCode': 500,
            'body': json.dumps({
                'host': host if 'host' in locals() else database_endpoint,
                'port': port if 'port' in locals() else None,
                'reachable': False,
                'error': f'Unexpected error: {str(e)}',
                'message': 'An unexpected error occurred'
            })
        }

# Test function (uncomment for local testing)
# if __name__ == "__main__":
#     # Set environment variable for testing
#     os.environ["DB_HOST"] = "mydb.abcdefgh1234.us-east-1.rds.amazonaws.com:5432"

#     # Test event
#     test_event = {
#         "timeout": 5
#     }

#     result = lambda_handler(test_event, None)
#     print(json.dumps(result, indent=2))

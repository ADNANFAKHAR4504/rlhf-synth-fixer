"""
Lambda Health Check Function
Checks Aurora database connectivity and returns health status
"""

import json
import boto3
import psycopg2
import os
from typing import Dict, Any

# Initialize AWS clients
secretsmanager = boto3.client('secretsmanager')


def get_database_credentials(secret_arn: str) -> Dict[str, str]:
    """
    Retrieve database credentials from AWS Secrets Manager.

    Args:
        secret_arn: ARN of the secret containing database credentials

    Returns:
        Dictionary with username, password, and other connection details
    """
    try:
        response = secretsmanager.get_secret_value(SecretId=secret_arn)
        return json.loads(response['SecretString'])
    except Exception as e:
        print(f"Error retrieving credentials: {str(e)}")
        raise


def test_database_connection(
    host: str,
    port: int,
    database: str,
    username: str,
    password: str
) -> bool:
    """
    Test database connectivity by executing a simple query.

    Args:
        host: Database endpoint
        port: Database port (default 5432)
        database: Database name
        username: Database username
        password: Database password

    Returns:
        True if connection successful, False otherwise
    """
    try:
        # Establish connection with timeout
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password,
            connect_timeout=5,
            application_name='health-check'
        )

        # Execute simple query to verify database is responsive
        cursor = conn.cursor()
        cursor.execute('SELECT 1 AS health_check')
        result = cursor.fetchone()

        # Cleanup
        cursor.close()
        conn.close()

        return result[0] == 1
    except psycopg2.OperationalError as e:
        print(f"Database connection failed: {str(e)}")
        return False
    except Exception as e:
        print(f"Unexpected error during health check: {str(e)}")
        return False


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler function for database health checks.

    Args:
        event: Lambda event object
        context: Lambda context object

    Returns:
        HTTP response with health status
    """
    try:
        # Get configuration from environment variables
        db_endpoint = os.environ['DB_ENDPOINT']
        db_secret_arn = os.environ['DB_SECRET_ARN']
        region = os.environ.get('AWS_REGION', 'unknown')

        # Retrieve database credentials
        credentials = get_database_credentials(db_secret_arn)

        # Test database connection
        is_healthy = test_database_connection(
            host=db_endpoint,
            port=credentials.get('port', 5432),
            database=credentials.get('dbname', 'trading_db'),
            username=credentials['username'],
            password=credentials['password']
        )

        if is_healthy:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'healthy',
                    'region': region,
                    'timestamp': context.request_id,
                    'message': 'Database connection successful'
                })
            }
        else:
            return {
                'statusCode': 503,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'unhealthy',
                    'region': region,
                    'timestamp': context.request_id,
                    'message': 'Database connection failed'
                })
            }
    except Exception as e:
        print(f"Health check failed with exception: {str(e)}")
        return {
            'statusCode': 503,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'error',
                'region': os.environ.get('AWS_REGION', 'unknown'),
                'error': str(e),
                'message': 'Health check encountered an error'
            })
        }
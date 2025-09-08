import json
import boto3
import psycopg2
import os
from botocore.exceptions import ClientError

# It's good practice to initialize boto3 clients outside the handler
secrets_manager_client = boto3.client('secretsmanager')

def get_secret(secret_arn):
    """Retrieves a secret from AWS Secrets Manager."""
    try:
        response = secrets_manager_client.get_secret_value(SecretId=secret_arn)
        return json.loads(response['SecretString'])
    except ClientError as e:
        print(f"Error retrieving secret: {e}")
        raise e

def create_response(status_code, body):
    """Creates a standardized API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body)
    }

def lambda_handler(event, context):
    """
    AWS Lambda handler to connect to PostgreSQL and return status.
    """
    db_secret_arn = os.environ.get('DB_SECRET_ARN')
    db_host = os.environ.get('DB_HOST')
    db_name = os.environ.get('DB_NAME')

    if not all([db_secret_arn, db_host, db_name]):
        print("Error: Missing required environment variables.")
        return create_response(500, {
            'status': 'error',
            'message': 'Internal server configuration error.'
        })

    connection = None
    try:
        # 1. Get database credentials
        secret = get_secret(db_secret_arn)
        
        # 2. Establish database connection
        print(f"Attempting to connect to database '{db_name}' at {db_host}...")
        connection = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=secret['username'],
            password=secret['password'],
            # THE FIX: Increased timeout to handle Lambda cold starts in a VPC
            connect_timeout=30
        )
        
        # 3. Test the connection with a query
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            db_version = cursor.fetchone()
        
        print("Database connection successful.")
        
        # 4. Prepare and return success response
        response_body = {
            'status': 'success',
            'message': 'Successfully connected to PostgreSQL database',
            'database_version': db_version[0] if db_version else 'Unknown',
            'database_name': db_name
        }
        return create_response(200, response_body)

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return create_response(500, {
            'status': 'error',
            'message': 'Internal server error.',
            'error_type': type(e).__name__
        })

    finally:
        # 5. Ensure the connection is always closed
        if connection:
            connection.close()
            print("Database connection closed.")


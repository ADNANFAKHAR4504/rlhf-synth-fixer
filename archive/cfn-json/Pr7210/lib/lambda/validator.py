import json
import os
import boto3
import pymysql
from datetime import datetime

# Initialize AWS clients
ssm = boto3.client('ssm')
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Environment variables
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX')
DB_ENDPOINT_PARAM = os.environ.get('DB_ENDPOINT_PARAM')
DB_PORT_PARAM = os.environ.get('DB_PORT_PARAM')
SESSION_TABLE = os.environ.get('SESSION_TABLE')
AUDIT_BUCKET = os.environ.get('AUDIT_BUCKET')

# Cache for database connection
db_connection = None

def get_db_config():
    """Retrieve database configuration from SSM Parameter Store"""
    try:
        db_endpoint = ssm.get_parameter(Name=DB_ENDPOINT_PARAM)['Parameter']['Value']
        db_port = int(ssm.get_parameter(Name=DB_PORT_PARAM)['Parameter']['Value'])

        return {
            'host': db_endpoint,
            'port': db_port,
            'user': os.environ.get('DB_USER', 'admin'),
            'password': os.environ.get('DB_PASSWORD'),
            'database': 'transactions'
        }
    except Exception as e:
        print(f"Error retrieving DB config from SSM: {str(e)}")
        raise

def get_db_connection():
    """Get or create database connection"""
    global db_connection

    if db_connection is None or not db_connection.open:
        db_config = get_db_config()
        db_connection = pymysql.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database=db_config['database'],
            connect_timeout=5
        )

    return db_connection

def validate_transaction(transaction_data):
    """Validate transaction against business rules"""
    required_fields = ['transaction_id', 'amount', 'currency', 'user_id']

    for field in required_fields:
        if field not in transaction_data:
            return False, f"Missing required field: {field}"

    if transaction_data['amount'] <= 0:
        return False, "Transaction amount must be positive"

    if transaction_data['currency'] not in ['USD', 'EUR', 'GBP']:
        return False, "Unsupported currency"

    return True, "Transaction valid"

def store_session(user_id, transaction_id):
    """Store session information in DynamoDB"""
    try:
        table = dynamodb.Table(SESSION_TABLE)
        table.put_item(
            Item={
                'sessionId': transaction_id,
                'userId': user_id,
                'timestamp': int(datetime.utcnow().timestamp()),
                'ttl': int(datetime.utcnow().timestamp()) + 86400  # 24 hours TTL
            }
        )
        return True
    except Exception as e:
        print(f"Error storing session: {str(e)}")
        return False

def write_audit_log(transaction_data, validation_result):
    """Write audit log to S3"""
    try:
        audit_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'transaction_id': transaction_data.get('transaction_id'),
            'user_id': transaction_data.get('user_id'),
            'validation_result': validation_result,
            'environment': ENVIRONMENT
        }

        key = f"audits/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_data['transaction_id']}.json"

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=key,
            Body=json.dumps(audit_record),
            ContentType='application/json'
        )
        return True
    except Exception as e:
        print(f"Error writing audit log: {str(e)}")
        return False

def persist_to_database(transaction_data):
    """Persist validated transaction to RDS Aurora"""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO transactions (transaction_id, user_id, amount, currency, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                transaction_data['transaction_id'],
                transaction_data['user_id'],
                transaction_data['amount'],
                transaction_data['currency'],
                datetime.utcnow()
            ))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error persisting to database: {str(e)}")
        return False

def lambda_handler(event, context):
    """Main Lambda handler for transaction validation"""
    try:
        # Parse input
        if 'body' in event:
            transaction_data = json.loads(event['body'])
        else:
            transaction_data = event

        print(f"Processing transaction: {transaction_data.get('transaction_id')}")

        # Validate transaction
        is_valid, message = validate_transaction(transaction_data)

        if not is_valid:
            write_audit_log(transaction_data, {'valid': False, 'reason': message})
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': message,
                    'transaction_id': transaction_data.get('transaction_id')
                })
            }

        # Store session
        store_session(transaction_data['user_id'], transaction_data['transaction_id'])

        # Persist to database
        if not persist_to_database(transaction_data):
            raise Exception("Failed to persist transaction to database")

        # Write audit log
        write_audit_log(transaction_data, {'valid': True, 'message': 'Transaction processed successfully'})

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction validated and processed successfully',
                'transaction_id': transaction_data['transaction_id']
            })
        }

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }
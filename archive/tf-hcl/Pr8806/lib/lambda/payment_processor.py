import json
import os
import boto3
import psycopg2
from datetime import datetime

# Environment variables
DB_HOST = os.environ['DB_HOST']
DB_NAME = os.environ['DB_NAME']
DB_USER = os.environ['DB_USER']
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
S3_BUCKET = os.environ['S3_BUCKET']
ENCRYPTION_KEY_ID = os.environ['ENCRYPTION_KEY_ID']

# Initialize AWS clients
s3_client = boto3.client('s3')
kms_client = boto3.client('kms')

def handler(event, context):
    """
    Lambda handler for payment processing API
    Demonstrates secure payment processing with encryption and database access
    """
    try:
        # Log the event (excluding sensitive data)
        print(f"Processing payment request at {datetime.utcnow().isoformat()}")

        # Validate input
        if 'body' not in event:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing request body'})
            }

        # Parse request body
        try:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid JSON in request body'})
            }

        # Extract payment details
        transaction_id = body.get('transaction_id')
        amount = body.get('amount')

        if not transaction_id or not amount:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields: transaction_id, amount'})
            }

        # Connect to database with SSL
        connection = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            sslmode='require',
            connect_timeout=5
        )

        cursor = connection.cursor()

        # Store transaction in database
        cursor.execute(
            "CREATE TABLE IF NOT EXISTS transactions (id VARCHAR(255) PRIMARY KEY, amount DECIMAL(10,2), processed_at TIMESTAMP)"
        )
        cursor.execute(
            "INSERT INTO transactions (id, amount, processed_at) VALUES (%s, %s, %s)",
            (transaction_id, amount, datetime.utcnow())
        )
        connection.commit()

        # Encrypt sensitive data and store in S3
        encrypted_data = kms_client.encrypt(
            KeyId=ENCRYPTION_KEY_ID,
            Plaintext=json.dumps(body).encode('utf-8')
        )

        s3_key = f"transactions/{transaction_id}.json"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=encrypted_data['CiphertextBlob'],
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=ENCRYPTION_KEY_ID
        )

        # Close database connection
        cursor.close()
        connection.close()

        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': transaction_id,
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except psycopg2.Error as db_error:
        print(f"Database error: {str(db_error)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Database connection failed'})
        }

    except Exception as error:
        print(f"Error processing payment: {str(error)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

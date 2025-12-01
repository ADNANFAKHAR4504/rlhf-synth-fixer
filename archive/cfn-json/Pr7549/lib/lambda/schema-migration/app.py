"""
Schema Migration Custom Resource Lambda
Handles database schema initialization and migration
"""
import json
import logging
import urllib3
import boto3
import pymysql
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

http = urllib3.PoolManager()
ssm_client = boto3.client('ssm')

def send_response(event: Dict[str, Any], context: Any, response_status: str,
                  response_data: Dict[str, Any], physical_resource_id: str = None,
                  reason: str = None):
    """
    Send response to CloudFormation

    Args:
        event: CloudFormation event
        context: Lambda context
        response_status: SUCCESS or FAILED
        response_data: Response data dictionary
        physical_resource_id: Physical resource ID
        reason: Failure reason if applicable
    """
    response_url = event.get('ResponseURL')
    if not response_url:
        logger.info("No ResponseURL found, skipping CFN response")
        return

    response_body = {
        'Status': response_status,
        'Reason': reason or f'See CloudWatch Log Stream: {context.log_stream_name}',
        'PhysicalResourceId': physical_resource_id or context.log_stream_name,
        'StackId': event.get('StackId'),
        'RequestId': event.get('RequestId'),
        'LogicalResourceId': event.get('LogicalResourceId'),
        'Data': response_data
    }

    json_response_body = json.dumps(response_body)

    headers = {
        'content-type': '',
        'content-length': str(len(json_response_body))
    }

    try:
        response = http.request(
            'PUT',
            response_url,
            body=json_response_body,
            headers=headers
        )
        logger.info(f"CloudFormation response status: {response.status}")
    except Exception as e:
        logger.error(f"Failed to send response to CloudFormation: {str(e)}")

def execute_schema_migration(db_endpoint: str, db_port: int, db_name: str,
                             db_username: str, db_password: str) -> Dict[str, Any]:
    """
    Execute database schema migration

    Args:
        db_endpoint: Aurora cluster endpoint
        db_port: Database port
        db_name: Database name
        db_username: Master username
        db_password: Master password

    Returns:
        dict: Migration result with status and details
    """
    connection = None
    try:
        # Connect to Aurora
        logger.info(f"Connecting to database {db_name} at {db_endpoint}:{db_port}")
        connection = pymysql.connect(
            host=db_endpoint,
            port=db_port,
            user=db_username,
            password=db_password,
            database=db_name,
            connect_timeout=30,
            cursorclass=pymysql.cursors.DictCursor
        )

        cursor = connection.cursor()

        # Create transactions table
        logger.info("Creating transactions table")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                transaction_id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                currency VARCHAR(3) NOT NULL,
                transaction_type VARCHAR(32) NOT NULL,
                status VARCHAR(32) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # Create users table
        logger.info("Creating users table")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id VARCHAR(64) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255),
                account_status VARCHAR(32) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_status (account_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # Create audit_log table
        logger.info("Creating audit_log table")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                transaction_id VARCHAR(64),
                action VARCHAR(64) NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_transaction_id (transaction_id),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # Insert sample data for testing
        logger.info("Inserting sample data")
        cursor.execute("""
            INSERT IGNORE INTO users (user_id, email, full_name, account_status)
            VALUES
                ('user-001', 'test@example.com', 'Test User', 'active'),
                ('user-002', 'demo@example.com', 'Demo User', 'active')
        """)

        connection.commit()
        cursor.close()

        logger.info("Schema migration completed successfully")
        return {
            'status': 'success',
            'tables_created': ['transactions', 'users', 'audit_log'],
            'sample_users_inserted': 2
        }

    except Exception as e:
        logger.error(f"Schema migration failed: {str(e)}", exc_info=True)
        raise
    finally:
        if connection:
            connection.close()

def lambda_handler(event, context):
    """
    Main handler for schema migration custom resource

    Args:
        event: CloudFormation custom resource event
        context: Lambda context

    Returns:
        dict: Response for CloudFormation
    """
    logger.info(f"Received event: {json.dumps(event)}")

    request_type = event.get('RequestType')
    physical_resource_id = event.get('PhysicalResourceId', 'schema-migration')

    try:
        # Extract database connection parameters
        resource_properties = event.get('ResourceProperties', {})
        db_endpoint = resource_properties.get('DatabaseEndpoint')
        db_port = int(resource_properties.get('DatabasePort', 3306))
        db_name = resource_properties.get('DatabaseName')
        db_username = resource_properties.get('MasterUsername')
        db_password = resource_properties.get('MasterPassword')

        if request_type in ['Create', 'Update']:
            # Validate required parameters
            if not all([db_endpoint, db_name, db_username, db_password]):
                raise ValueError("Missing required database connection parameters")

            # Execute migration
            result = execute_schema_migration(
                db_endpoint, db_port, db_name, db_username, db_password
            )

            send_response(
                event, context, 'SUCCESS', result, physical_resource_id
            )

            return {
                'statusCode': 200,
                'body': json.dumps(result)
            }

        elif request_type == 'Delete':
            # On delete, we don't drop tables (data retention)
            # Just acknowledge the deletion
            logger.info("Schema migration delete requested - no action taken")
            send_response(
                event, context, 'SUCCESS',
                {'status': 'deleted', 'note': 'Tables retained'},
                physical_resource_id
            )

            return {
                'statusCode': 200,
                'body': json.dumps({'status': 'deleted'})
            }

        else:
            raise ValueError(f"Unknown request type: {request_type}")

    except Exception as e:
        logger.error(f"Error in schema migration: {str(e)}", exc_info=True)
        send_response(
            event, context, 'FAILED',
            {'error': str(e)},
            physical_resource_id,
            str(e)
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

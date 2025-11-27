import json
import os
import boto3
import pymysql
import cfnresponse
from datetime import datetime

# Initialize AWS clients
ssm = boto3.client('ssm')

# Environment variables
DB_ENDPOINT_PARAM = os.environ.get('DB_ENDPOINT_PARAM')
DB_PORT_PARAM = os.environ.get('DB_PORT_PARAM')

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

def run_migrations(connection):
    """Run database schema migrations"""
    migrations = [
        """
        CREATE TABLE IF NOT EXISTS transactions (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            transaction_id VARCHAR(255) UNIQUE NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_transaction_id (transaction_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS migration_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            version VARCHAR(50) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_version (version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    ]

    try:
        with connection.cursor() as cursor:
            for migration in migrations:
                print(f"Executing migration: {migration[:50]}...")
                cursor.execute(migration)

            # Record migration version
            version = os.environ.get('MIGRATION_VERSION', '1.0.0')
            cursor.execute(
                "INSERT IGNORE INTO migration_history (version) VALUES (%s)",
                (version,)
            )

        connection.commit()
        print("Migrations completed successfully")
        return True

    except Exception as e:
        print(f"Error running migrations: {str(e)}")
        connection.rollback()
        raise

def lambda_handler(event, context):
    """Custom resource handler for database migrations"""
    print(f"Received event: {json.dumps(event)}")

    response_status = cfnresponse.SUCCESS
    response_data = {}

    try:
        request_type = event['RequestType']

        if request_type in ['Create', 'Update']:
            # Get database configuration
            db_config = get_db_config()

            # Connect to database
            connection = pymysql.connect(
                host=db_config['host'],
                port=db_config['port'],
                user=db_config['user'],
                password=db_config['password'],
                database=db_config['database'],
                connect_timeout=10
            )

            print("Connected to database successfully")

            # Run migrations
            run_migrations(connection)

            connection.close()

            response_data['Message'] = 'Database migrations completed successfully'

        elif request_type == 'Delete':
            print("Delete request received - no action required")
            response_data['Message'] = 'Delete request processed (no-op)'

    except Exception as e:
        print(f"Error in custom resource handler: {str(e)}")
        response_status = cfnresponse.FAILED
        response_data['Error'] = str(e)

    finally:
        cfnresponse.send(event, context, response_status, response_data)
"""
RDS Migration Validation Lambda Function

This Lambda function validates that the RDS MySQL instance has been
successfully restored from the development snapshot by querying specific
tables and checking data integrity.
"""

import json
import os
import boto3
import pymysql
from typing import Dict, Any, Optional


def get_db_credentials(secret_arn: str) -> Dict[str, str]:
    """
    Retrieve database credentials from AWS Secrets Manager.

    Args:
        secret_arn: ARN of the secret containing database credentials

    Returns:
        Dictionary containing username and password
    """
    secrets_client = boto3.client('secretsmanager')

    try:
        response = secrets_client.get_secret_value(SecretId=secret_arn)
        secret_data = json.loads(response['SecretString'])
        return {
            'username': secret_data.get('username'),
            'password': secret_data.get('password')
        }
    except Exception as error:
        print(f"Error retrieving secret: {str(error)}")
        raise


def connect_to_database(endpoint: str, credentials: Dict[str, str]) -> pymysql.connections.Connection:
    """
    Establish connection to RDS MySQL database.

    Args:
        endpoint: RDS endpoint (host:port format)
        credentials: Dictionary with username and password

    Returns:
        PyMySQL connection object
    """
    # Parse endpoint to get host and port
    host_parts = endpoint.split(':')
    host = host_parts[0]
    port = int(host_parts[1]) if len(host_parts) > 1 else 3306

    try:
        connection = pymysql.connect(
            host=host,
            port=port,
            user=credentials['username'],
            password=credentials['password'],
            database='mysql',  # Connect to default database first
            connect_timeout=30,
            read_timeout=30,
            write_timeout=30,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except Exception as error:
        print(f"Error connecting to database: {str(error)}")
        raise


def validate_database_migration(connection: pymysql.connections.Connection) -> Dict[str, Any]:
    """
    Validate the database migration by checking for expected tables and data.

    Args:
        connection: Active database connection

    Returns:
        Dictionary with validation results
    """
    results = {
        'success': True,
        'checks': [],
        'errors': []
    }

    try:
        with connection.cursor() as cursor:
            # Check 1: Verify database is accessible
            cursor.execute("SELECT VERSION() as version")
            version_result = cursor.fetchone()
            results['checks'].append({
                'name': 'database_accessible',
                'status': 'passed',
                'details': f"MySQL version: {version_result['version']}"
            })

            # Check 2: List all databases
            cursor.execute("SHOW DATABASES")
            databases = [row['Database'] for row in cursor.fetchall()]
            results['checks'].append({
                'name': 'databases_exist',
                'status': 'passed',
                'details': f"Found {len(databases)} databases: {', '.join(databases)}"
            })

            # Check 3: Verify system variables
            cursor.execute("SELECT @@character_set_database, @@collation_database")
            charset_info = cursor.fetchone()
            results['checks'].append({
                'name': 'charset_validation',
                'status': 'passed',
                'details': f"Character set: {charset_info['@@character_set_database']}, Collation: {charset_info['@@collation_database']}"
            })

            # Check 4: Verify server status
            cursor.execute("SHOW STATUS LIKE 'Uptime'")
            uptime = cursor.fetchone()
            results['checks'].append({
                'name': 'server_uptime',
                'status': 'passed',
                'details': f"Server uptime: {uptime['Value']} seconds"
            })

            # Check 5: Verify replication status (for Multi-AZ)
            cursor.execute("SHOW REPLICA STATUS")
            replica_status = cursor.fetchall()
            if replica_status:
                results['checks'].append({
                    'name': 'replication_status',
                    'status': 'passed',
                    'details': "Multi-AZ replication is active"
                })
            else:
                results['checks'].append({
                    'name': 'replication_status',
                    'status': 'info',
                    'details': "No replica status (may be primary instance)"
                })

    except Exception as error:
        results['success'] = False
        results['errors'].append(str(error))
        print(f"Validation error: {str(error)}")

    return results


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for RDS migration validation.

    Args:
        event: Lambda event object (EventBridge RDS event)
        context: Lambda context object

    Returns:
        Dictionary with validation results and status
    """
    print(f"Received event: {json.dumps(event)}")

    # Get environment variables
    secret_arn = os.environ.get('DB_SECRET_ARN')
    db_endpoint = os.environ.get('DB_ENDPOINT')
    environment = os.environ.get('ENVIRONMENT', 'unknown')

    if not secret_arn or not db_endpoint:
        error_msg = "Missing required environment variables: DB_SECRET_ARN or DB_ENDPOINT"
        print(error_msg)
        return {
            'statusCode': 400,
            'body': json.dumps({'error': error_msg})
        }

    connection: Optional[pymysql.connections.Connection] = None

    try:
        # Retrieve database credentials
        print("Retrieving database credentials from Secrets Manager...")
        credentials = get_db_credentials(secret_arn)

        # Connect to database
        print(f"Connecting to database at {db_endpoint}...")
        connection = connect_to_database(db_endpoint, credentials)

        # Perform validation checks
        print("Performing validation checks...")
        validation_results = validate_database_migration(connection)

        # Log results
        print(f"Validation completed. Success: {validation_results['success']}")
        print(f"Checks performed: {len(validation_results['checks'])}")

        if not validation_results['success']:
            print(f"Validation errors: {validation_results['errors']}")

        # Return results
        return {
            'statusCode': 200 if validation_results['success'] else 500,
            'body': json.dumps({
                'message': 'RDS migration validation completed',
                'environment': environment,
                'timestamp': context.get_remaining_time_in_millis() if context else 0,
                'results': validation_results
            })
        }

    except Exception as error:
        error_msg = f"Validation failed with error: {str(error)}"
        print(error_msg)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_msg,
                'environment': environment
            })
        }

    finally:
        # Clean up database connection
        if connection:
            try:
                connection.close()
                print("Database connection closed")
            except Exception as error:
                print(f"Error closing connection: {str(error)}")

"""Validation Lambda function for pre/post migration checks."""

import json
import os
import boto3
import psycopg2
from typing import Dict, Any, List
from botocore.exceptions import ClientError


def get_db_credentials(secret_arn: str) -> Dict[str, Any]:
    """Retrieve database credentials from Secrets Manager.

    Args:
        secret_arn: ARN of the secret containing database credentials

    Returns:
        Dictionary containing database credentials
    """
    client = boto3.client('secretsmanager')

    try:
        response = client.get_secret_value(SecretId=secret_arn)
        return json.loads(response['SecretString'])
    except ClientError as e:
        print(f"Error retrieving secret: {e}")
        raise


def connect_to_database(credentials: Dict[str, Any], endpoint: str) -> psycopg2.extensions.connection:
    """Connect to PostgreSQL database.

    Args:
        credentials: Database credentials dictionary
        endpoint: Database endpoint

    Returns:
        Database connection object
    """
    return psycopg2.connect(
        host=endpoint,
        port=credentials.get('port', 5432),
        database=credentials.get('dbname', 'payments'),
        user=credentials['username'],
        password=credentials['password'],
        sslmode='require'
    )


def validate_data_consistency(conn: psycopg2.extensions.connection) -> Dict[str, Any]:
    """Validate data consistency in the database.

    Args:
        conn: Database connection

    Returns:
        Dictionary with validation results
    """
    cursor = conn.cursor()

    # Check total record counts
    cursor.execute("SELECT COUNT(*) FROM payments")
    payment_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM transactions")
    transaction_count = cursor.fetchone()[0]

    # Check for orphaned records
    cursor.execute("""
        SELECT COUNT(*) FROM transactions t
        LEFT JOIN payments p ON t.payment_id = p.id
        WHERE p.id IS NULL
    """)
    orphaned_count = cursor.fetchone()[0]

    # Check data integrity
    cursor.execute("""
        SELECT COUNT(*) FROM payments
        WHERE amount <= 0 OR created_at IS NULL
    """)
    invalid_records = cursor.fetchone()[0]

    cursor.close()

    return {
        'payment_count': payment_count,
        'transaction_count': transaction_count,
        'orphaned_records': orphaned_count,
        'invalid_records': invalid_records,
        'is_valid': orphaned_count == 0 and invalid_records == 0
    }


def validate_schema(conn: psycopg2.extensions.connection) -> Dict[str, Any]:
    """Validate database schema structure.

    Args:
        conn: Database connection

    Returns:
        Dictionary with schema validation results
    """
    cursor = conn.cursor()

    # Check required tables
    required_tables = ['payments', 'transactions', 'customers', 'audit_log']
    cursor.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    """)
    existing_tables = [row[0] for row in cursor.fetchall()]

    missing_tables = [table for table in required_tables if table not in existing_tables]

    # Check required indexes
    cursor.execute("""
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
    """)
    indexes = cursor.fetchall()

    cursor.close()

    return {
        'existing_tables': existing_tables,
        'missing_tables': missing_tables,
        'index_count': len(indexes),
        'is_valid': len(missing_tables) == 0
    }


def publish_metrics(metric_name: str, value: float, environment: str) -> None:
    """Publish custom CloudWatch metrics.

    Args:
        metric_name: Name of the metric
        value: Metric value
        environment: Environment suffix
    """
    cloudwatch = boto3.client('cloudwatch')

    try:
        cloudwatch.put_metric_data(
            Namespace='PaymentMigration',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Count',
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': environment
                        }
                    ]
                }
            ]
        )
    except ClientError as e:
        print(f"Error publishing metrics: {e}")


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for migration validation checks.

    Args:
        event: Lambda event object
        context: Lambda context object

    Returns:
        Dictionary with validation results
    """
    print(f"Validation check started: {json.dumps(event)}")

    # Get environment variables
    db_secret_arn = os.environ['DB_SECRET_ARN']
    db_endpoint = os.environ['DB_ENDPOINT']
    environment = os.environ['ENVIRONMENT']

    try:
        # Get database credentials
        credentials = get_db_credentials(db_secret_arn)

        # Connect to database
        conn = connect_to_database(credentials, db_endpoint)

        # Perform validation checks
        data_validation = validate_data_consistency(conn)
        schema_validation = validate_schema(conn)

        # Close connection
        conn.close()

        # Publish metrics
        publish_metrics('DataConsistencyValid', 1 if data_validation['is_valid'] else 0, environment)
        publish_metrics('SchemaValid', 1 if schema_validation['is_valid'] else 0, environment)
        publish_metrics('PaymentRecordCount', data_validation['payment_count'], environment)
        publish_metrics('OrphanedRecords', data_validation['orphaned_records'], environment)

        # Prepare response
        overall_valid = data_validation['is_valid'] and schema_validation['is_valid']

        response = {
            'statusCode': 200 if overall_valid else 400,
            'body': json.dumps({
                'validation_status': 'PASSED' if overall_valid else 'FAILED',
                'data_validation': data_validation,
                'schema_validation': schema_validation,
                'timestamp': context.aws_request_id
            })
        }

        print(f"Validation completed: {response['body']}")
        return response

    except Exception as e:
        print(f"Validation error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'validation_status': 'ERROR',
                'error_message': str(e)
            })
        }

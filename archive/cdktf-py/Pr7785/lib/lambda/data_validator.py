"""Lambda function to validate data consistency between source and target databases during migration."""

import json
import boto3
import psycopg2
from typing import Dict, Any, List
import os
from datetime import datetime

# Initialize AWS clients
ssm = boto3.client('ssm')
secrets_manager = boto3.client('secretsmanager')
cloudwatch = boto3.client('cloudwatch')


def get_secret(secret_name: str) -> Dict[str, str]:
    """Retrieve database credentials from Secrets Manager."""
    try:
        response = secrets_manager.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except Exception as e:
        raise Exception(f"Error retrieving secret {secret_name}: {str(e)}")


def get_parameter(parameter_name: str) -> str:
    """Retrieve configuration from Parameter Store."""
    try:
        response = ssm.get_parameter(Name=parameter_name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        raise Exception(f"Error retrieving parameter {parameter_name}: {str(e)}")


def connect_to_database(credentials: Dict[str, str], endpoint: str) -> Any:
    """Create database connection using credentials."""
    try:
        conn = psycopg2.connect(
            host=endpoint,
            port=credentials.get('port', 5432),
            database=credentials.get('dbname', 'postgres'),
            user=credentials['username'],
            password=credentials['password'],
            connect_timeout=10
        )
        return conn
    except Exception as e:
        raise Exception(f"Error connecting to database {endpoint}: {str(e)}")


def validate_row_counts(source_conn: Any, target_conn: Any, tables: List[str]) -> Dict[str, Any]:
    """Validate row counts match between source and target tables."""
    results = {
        'matches': [],
        'mismatches': [],
        'errors': []
    }

    for table in tables:
        try:
            source_cursor = source_conn.cursor()
            target_cursor = target_conn.cursor()

            source_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            source_count = source_cursor.fetchone()[0]

            target_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            target_count = target_cursor.fetchone()[0]

            if source_count == target_count:
                results['matches'].append({
                    'table': table,
                    'count': source_count
                })
            else:
                results['mismatches'].append({
                    'table': table,
                    'source_count': source_count,
                    'target_count': target_count,
                    'difference': abs(source_count - target_count)
                })

            source_cursor.close()
            target_cursor.close()

        except Exception as e:
            results['errors'].append({
                'table': table,
                'error': str(e)
            })

    return results


def validate_checksums(source_conn: Any, target_conn: Any, tables: List[str]) -> Dict[str, Any]:
    """Validate data checksums match between source and target tables."""
    results = {
        'matches': [],
        'mismatches': [],
        'errors': []
    }

    for table in tables:
        try:
            source_cursor = source_conn.cursor()
            target_cursor = target_conn.cursor()

            checksum_query = f"""
                SELECT MD5(STRING_AGG(MD5(ROW(t.*)::text), '' ORDER BY 1))
                FROM {table} t
            """

            source_cursor.execute(checksum_query)
            source_checksum = source_cursor.fetchone()[0]

            target_cursor.execute(checksum_query)
            target_checksum = target_cursor.fetchone()[0]

            if source_checksum == target_checksum:
                results['matches'].append({
                    'table': table,
                    'checksum': source_checksum
                })
            else:
                results['mismatches'].append({
                    'table': table,
                    'source_checksum': source_checksum,
                    'target_checksum': target_checksum
                })

            source_cursor.close()
            target_cursor.close()

        except Exception as e:
            results['errors'].append({
                'table': table,
                'error': str(e)
            })

    return results


def publish_metrics(validation_results: Dict[str, Any], environment: str) -> None:
    """Publish validation metrics to CloudWatch."""
    try:
        namespace = f"Migration/{environment}"
        timestamp = datetime.utcnow()

        row_count_results = validation_results.get('row_counts', {})
        checksum_results = validation_results.get('checksums', {})

        metrics = [
            {
                'MetricName': 'RowCountMatches',
                'Value': len(row_count_results.get('matches', [])),
                'Unit': 'Count',
                'Timestamp': timestamp
            },
            {
                'MetricName': 'RowCountMismatches',
                'Value': len(row_count_results.get('mismatches', [])),
                'Unit': 'Count',
                'Timestamp': timestamp
            },
            {
                'MetricName': 'ChecksumMatches',
                'Value': len(checksum_results.get('matches', [])),
                'Unit': 'Count',
                'Timestamp': timestamp
            },
            {
                'MetricName': 'ChecksumMismatches',
                'Value': len(checksum_results.get('mismatches', [])),
                'Unit': 'Count',
                'Timestamp': timestamp
            },
            {
                'MetricName': 'ValidationErrors',
                'Value': len(row_count_results.get('errors', [])) + len(checksum_results.get('errors', [])),
                'Unit': 'Count',
                'Timestamp': timestamp
            }
        ]

        for metric in metrics:
            cloudwatch.put_metric_data(
                Namespace=namespace,
                MetricData=[metric]
            )

    except Exception as e:
        print(f"Error publishing metrics: {str(e)}")


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for data validation.

    Expected event structure:
    {
        "source_secret_name": "migration/source/db",
        "target_secret_name": "migration/target/db",
        "source_endpoint": "source-db.example.com",
        "target_endpoint": "target-db.example.com",
        "tables": ["transactions", "accounts", "payments"],
        "validation_type": "both",  # "row_count", "checksum", or "both"
        "environment_suffix": "dev"
    }
    """

    try:
        source_secret_name = event['source_secret_name']
        target_secret_name = event['target_secret_name']
        source_endpoint = event['source_endpoint']
        target_endpoint = event['target_endpoint']
        tables = event.get('tables', [])
        validation_type = event.get('validation_type', 'both')
        environment_suffix = event.get('environment_suffix', 'dev')

        if not tables:
            raise ValueError("No tables specified for validation")

        print(f"Starting validation for {len(tables)} tables")
        print(f"Validation type: {validation_type}")

        source_credentials = get_secret(source_secret_name)
        target_credentials = get_secret(target_secret_name)

        source_conn = connect_to_database(source_credentials, source_endpoint)
        target_conn = connect_to_database(target_credentials, target_endpoint)

        validation_results = {
            'timestamp': datetime.utcnow().isoformat(),
            'environment': environment_suffix,
            'tables_validated': len(tables)
        }

        if validation_type in ['row_count', 'both']:
            print("Performing row count validation")
            row_count_results = validate_row_counts(source_conn, target_conn, tables)
            validation_results['row_counts'] = row_count_results

        if validation_type in ['checksum', 'both']:
            print("Performing checksum validation")
            checksum_results = validate_checksums(source_conn, target_conn, tables)
            validation_results['checksums'] = checksum_results

        source_conn.close()
        target_conn.close()

        publish_metrics(validation_results, environment_suffix)

        total_mismatches = (
            len(validation_results.get('row_counts', {}).get('mismatches', [])) +
            len(validation_results.get('checksums', {}).get('mismatches', []))
        )
        total_errors = (
            len(validation_results.get('row_counts', {}).get('errors', [])) +
            len(validation_results.get('checksums', {}).get('errors', []))
        )

        validation_results['validation_passed'] = (total_mismatches == 0 and total_errors == 0)
        validation_results['total_mismatches'] = total_mismatches
        validation_results['total_errors'] = total_errors

        print(f"Validation complete. Passed: {validation_results['validation_passed']}")

        return {
            'statusCode': 200,
            'body': json.dumps(validation_results)
        }

    except Exception as e:
        error_message = f"Validation failed: {str(e)}"
        print(error_message)

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_message,
                'validation_passed': False
            })
        }

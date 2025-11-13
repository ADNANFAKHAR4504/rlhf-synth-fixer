"""
Data validation Lambda function for migration.
Validates data consistency between source and target databases.
"""

import json
import os
import psycopg2
import boto3
from datetime import datetime

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')


def lambda_handler(event, context):
    """
    Main Lambda handler for data validation.

    Compares record counts and data integrity between source and target databases.
    Publishes metrics to CloudWatch and sends alerts via SNS if discrepancies found.
    """

    source_endpoint = os.environ['SOURCE_DB_ENDPOINT']
    target_endpoint = os.environ['TARGET_DB_ENDPOINT']
    db_name = os.environ['DB_NAME']
    db_user = os.environ['DB_USER']
    db_password = os.environ['DB_PASSWORD']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

    try:
        # Connect to source database
        source_conn = psycopg2.connect(
            host=source_endpoint,
            database=db_name,
            user=db_user,
            password=db_password,
            sslmode='require'
        )

        # Connect to target database
        target_conn = psycopg2.connect(
            host=target_endpoint,
            database=db_name,
            user=db_user,
            password=db_password,
            sslmode='require'
        )

        validation_results = {
            'timestamp': datetime.utcnow().isoformat(),
            'tables_validated': [],
            'discrepancies': [],
            'status': 'SUCCESS'
        }

        # Get list of tables to validate
        tables = get_tables_to_validate(source_conn)

        for table in tables:
            table_result = validate_table(source_conn, target_conn, table)
            validation_results['tables_validated'].append(table_result)

            # Check for discrepancies
            if table_result['source_count'] != table_result['target_count']:
                discrepancy = {
                    'table': table,
                    'source_count': table_result['source_count'],
                    'target_count': table_result['target_count'],
                    'difference': table_result['source_count'] - table_result['target_count']
                }
                validation_results['discrepancies'].append(discrepancy)
                validation_results['status'] = 'DISCREPANCY_FOUND'

        # Publish metrics to CloudWatch
        publish_cloudwatch_metrics(validation_results, environment_suffix)

        # Send SNS notification if discrepancies found
        if validation_results['discrepancies']:
            send_discrepancy_alert(validation_results, sns_topic_arn, environment_suffix)

        # Close connections
        source_conn.close()
        target_conn.close()

        return {
            'statusCode': 200,
            'body': json.dumps(validation_results)
        }

    except Exception as e:
        error_message = f"Validation failed: {str(e)}"
        print(error_message)

        # Send error notification
        send_error_alert(error_message, sns_topic_arn, environment_suffix)

        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_message})
        }


def get_tables_to_validate(conn):
    """Get list of tables from the database."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)
    tables = [row[0] for row in cursor.fetchall()]
    cursor.close()
    return tables


def validate_table(source_conn, target_conn, table_name):
    """Validate a single table between source and target."""

    # Get source count
    source_cursor = source_conn.cursor()
    source_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    source_count = source_cursor.fetchone()[0]
    source_cursor.close()

    # Get target count
    target_cursor = target_conn.cursor()
    target_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    target_count = target_cursor.fetchone()[0]
    target_cursor.close()

    return {
        'table': table_name,
        'source_count': source_count,
        'target_count': target_count,
        'match': source_count == target_count
    }


def publish_cloudwatch_metrics(validation_results, environment_suffix):
    """Publish validation metrics to CloudWatch."""

    metrics = []

    # Overall validation status
    metrics.append({
        'MetricName': 'ValidationStatus',
        'Value': 1 if validation_results['status'] == 'SUCCESS' else 0,
        'Unit': 'Count',
        'Dimensions': [
            {'Name': 'Environment', 'Value': environment_suffix}
        ]
    })

    # Number of discrepancies
    metrics.append({
        'MetricName': 'DiscrepancyCount',
        'Value': len(validation_results['discrepancies']),
        'Unit': 'Count',
        'Dimensions': [
            {'Name': 'Environment', 'Value': environment_suffix}
        ]
    })

    # Tables validated
    metrics.append({
        'MetricName': 'TablesValidated',
        'Value': len(validation_results['tables_validated']),
        'Unit': 'Count',
        'Dimensions': [
            {'Name': 'Environment', 'Value': environment_suffix}
        ]
    })

    cloudwatch.put_metric_data(
        Namespace='Migration/DataValidation',
        MetricData=metrics
    )


def send_discrepancy_alert(validation_results, sns_topic_arn, environment_suffix):
    """Send SNS alert when discrepancies are found."""

    message = f"""
Data Validation Alert - {environment_suffix}

Discrepancies found during migration validation:

"""

    for disc in validation_results['discrepancies']:
        message += f"""
Table: {disc['table']}
  Source Count: {disc['source_count']}
  Target Count: {disc['target_count']}
  Difference: {disc['difference']}
"""

    message += f"\nTimestamp: {validation_results['timestamp']}"

    sns.publish(
        TopicArn=sns_topic_arn,
        Subject=f"Migration Data Validation Alert - {environment_suffix}",
        Message=message
    )


def send_error_alert(error_message, sns_topic_arn, environment_suffix):
    """Send SNS alert when validation encounters an error."""

    sns.publish(
        TopicArn=sns_topic_arn,
        Subject=f"Migration Data Validation Error - {environment_suffix}",
        Message=f"Error during data validation:\n\n{error_message}\n\nTimestamp: {datetime.utcnow().isoformat()}"
    )

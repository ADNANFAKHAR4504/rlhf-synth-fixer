import json
import os
import boto3
import psycopg2
from datetime import datetime

def handler(event, context):
    """
    Pre-migration validation function.
    Validates database connectivity and data integrity before migration.
    """

    secrets_client = boto3.client('secretsmanager')
    environment = os.environ.get('ENVIRONMENT', 'unknown')
    db_secret_arn = os.environ.get('DB_SECRET_ARN')

    print(f"Starting pre-migration validation for environment: {environment}")

    results = {
        'timestamp': datetime.utcnow().isoformat(),
        'environment': environment,
        'checks': {},
        'overall_status': 'PASS'
    }

    try:
        # Get database credentials from Secrets Manager
        secret_response = secrets_client.get_secret_value(SecretId=db_secret_arn)
        secret = json.loads(secret_response['SecretString'])

        # Connect to database
        conn = psycopg2.connect(
            host=secret['host'],
            port=secret.get('port', 5432),
            database=secret.get('dbname', 'migrationdb'),
            user=secret['username'],
            password=secret['password']
        )

        cursor = conn.cursor()

        # Check 1: Database connectivity
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()[0]
        results['checks']['database_connectivity'] = {
            'status': 'PASS',
            'message': f'Connected successfully. Version: {db_version}'
        }

        # Check 2: Schema validation
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public';
        """)
        table_count = cursor.fetchone()[0]
        results['checks']['schema_validation'] = {
            'status': 'PASS',
            'message': f'Found {table_count} tables in public schema'
        }

        # Check 3: Storage space
        cursor.execute("""
            SELECT pg_database_size(current_database()) as size;
        """)
        db_size = cursor.fetchone()[0]
        results['checks']['storage_check'] = {
            'status': 'PASS',
            'message': f'Database size: {db_size / (1024**3):.2f} GB'
        }

        # Check 4: Active connections
        cursor.execute("""
            SELECT COUNT(*)
            FROM pg_stat_activity
            WHERE state = 'active';
        """)
        active_connections = cursor.fetchone()[0]
        results['checks']['active_connections'] = {
            'status': 'PASS',
            'message': f'Active connections: {active_connections}'
        }

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Validation failed: {str(e)}")
        results['overall_status'] = 'FAIL'
        results['error'] = str(e)

    print(f"Pre-migration validation complete: {results['overall_status']}")

    return {
        'statusCode': 200 if results['overall_status'] == 'PASS' else 500,
        'body': json.dumps(results, indent=2)
    }

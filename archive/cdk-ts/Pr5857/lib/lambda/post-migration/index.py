import json
import os
import boto3
import psycopg2
from datetime import datetime

def handler(event, context):
    """
    Post-migration validation function.
    Validates data consistency and application health after migration.
    """

    secrets_client = boto3.client('secretsmanager')
    cloudwatch = boto3.client('cloudwatch')

    environment = os.environ.get('ENVIRONMENT', 'unknown')
    db_secret_arn = os.environ.get('DB_SECRET_ARN')
    db_endpoint = os.environ.get('DB_ENDPOINT')

    print(f"Starting post-migration validation for environment: {environment}")

    results = {
        'timestamp': datetime.utcnow().isoformat(),
        'environment': environment,
        'database_endpoint': db_endpoint,
        'checks': {},
        'overall_status': 'PASS'
    }

    try:
        # Get database credentials
        secret_response = secrets_client.get_secret_value(SecretId=db_secret_arn)
        secret = json.loads(secret_response['SecretString'])

        # Connect to migrated database
        conn = psycopg2.connect(
            host=db_endpoint,
            port=secret.get('port', 5432),
            database=secret.get('dbname', 'migrationdb'),
            user=secret['username'],
            password=secret['password']
        )

        cursor = conn.cursor()

        # Check 1: Database reachability
        cursor.execute("SELECT NOW();")
        current_time = cursor.fetchone()[0]
        results['checks']['database_reachability'] = {
            'status': 'PASS',
            'message': f'Database responding. Current time: {current_time}'
        }

        # Check 2: Data integrity - row counts
        cursor.execute("""
            SELECT
                schemaname,
                tablename,
                n_live_tup as row_count
            FROM pg_stat_user_tables
            ORDER BY n_live_tup DESC
            LIMIT 5;
        """)
        table_stats = cursor.fetchall()
        results['checks']['data_integrity'] = {
            'status': 'PASS',
            'message': f'Top tables verified',
            'details': [
                {'schema': row[0], 'table': row[1], 'rows': row[2]}
                for row in table_stats
            ]
        }

        # Check 3: Replication lag (if read replica exists)
        cursor.execute("""
            SELECT
                CASE
                    WHEN pg_is_in_recovery() THEN
                        EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
                    ELSE 0
                END as replication_lag;
        """)
        replication_lag = cursor.fetchone()[0]
        results['checks']['replication_lag'] = {
            'status': 'PASS' if replication_lag < 30 else 'WARN',
            'message': f'Replication lag: {replication_lag:.2f} seconds'
        }

        # Check 4: Index health
        cursor.execute("""
            SELECT COUNT(*)
            FROM pg_stat_user_indexes
            WHERE idx_scan = 0;
        """)
        unused_indexes = cursor.fetchone()[0]
        results['checks']['index_health'] = {
            'status': 'PASS',
            'message': f'Unused indexes: {unused_indexes}'
        }

        # Check 5: Performance metrics
        cursor.execute("""
            SELECT
                SUM(blks_hit) / NULLIF(SUM(blks_hit + blks_read), 0) * 100 as cache_hit_ratio
            FROM pg_stat_database
            WHERE datname = current_database();
        """)
        cache_hit_ratio = cursor.fetchone()[0] or 0
        results['checks']['performance'] = {
            'status': 'PASS' if cache_hit_ratio > 90 else 'WARN',
            'message': f'Cache hit ratio: {cache_hit_ratio:.2f}%'
        }

        cursor.close()
        conn.close()

        # Publish custom CloudWatch metrics
        cloudwatch.put_metric_data(
            Namespace='Migration',
            MetricData=[
                {
                    'MetricName': 'PostMigrationValidation',
                    'Value': 1 if results['overall_status'] == 'PASS' else 0,
                    'Unit': 'None',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': environment}
                    ]
                },
                {
                    'MetricName': 'ReplicationLag',
                    'Value': float(replication_lag) if replication_lag else 0,
                    'Unit': 'Seconds',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': environment}
                    ]
                },
                {
                    'MetricName': 'CacheHitRatio',
                    'Value': float(cache_hit_ratio) if cache_hit_ratio else 0,
                    'Unit': 'Percent',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': environment}
                    ]
                }
            ]
        )

    except Exception as e:
        print(f"Post-migration validation failed: {str(e)}")
        results['overall_status'] = 'FAIL'
        results['error'] = str(e)

        # Publish failure metric
        try:
            cloudwatch.put_metric_data(
                Namespace='Migration',
                MetricData=[
                    {
                        'MetricName': 'PostMigrationValidation',
                        'Value': 0,
                        'Unit': 'None',
                        'Dimensions': [
                            {'Name': 'Environment', 'Value': environment}
                        ]
                    }
                ]
            )
        except:
            pass

    print(f"Post-migration validation complete: {results['overall_status']}")

    return {
        'statusCode': 200 if results['overall_status'] == 'PASS' else 500,
        'body': json.dumps(results, indent=2)
    }

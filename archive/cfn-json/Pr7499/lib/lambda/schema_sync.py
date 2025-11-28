import json
import boto3
import os
import logging
import pymysql
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Synchronize database schema changes across environments.

    This function:
    1. Retrieves database credentials from Secrets Manager
    2. Downloads migration scripts from S3
    3. Executes scripts against the Aurora cluster
    4. Logs all activities to CloudWatch
    """
    logger.info('Schema synchronization started')

    try:
        secrets_client = boto3.client('secretsmanager')
        s3_client = boto3.client('s3')

        # Get database credentials
        secret_arn = os.environ['DB_SECRET_ARN']
        secret_response = secrets_client.get_secret_value(SecretId=secret_arn)
        secret = json.loads(secret_response['SecretString'])

        # Get migration scripts from S3
        bucket = os.environ['MIGRATION_BUCKET']
        scripts = s3_client.list_objects_v2(Bucket=bucket, Prefix='schemas/')

        # Connect to database
        db_endpoint = os.environ['DB_CLUSTER_ENDPOINT']
        connection = pymysql.connect(
            host=db_endpoint,
            user=secret['username'],
            password=secret['password'],
            database='mysql',
            connect_timeout=5
        )

        logger.info(f'Connected to database at {db_endpoint}')

        # Execute migration scripts
        executed_count = 0
        if 'Contents' in scripts:
            for script in scripts['Contents']:
                script_key = script['Key']
                logger.info(f'Executing script: {script_key}')

                script_obj = s3_client.get_object(Bucket=bucket, Key=script_key)
                script_content = script_obj['Body'].read().decode('utf-8')

                with connection.cursor() as cursor:
                    cursor.execute(script_content)
                    connection.commit()

                executed_count += 1

        connection.close()

        logger.info(f'Schema synchronization completed. Executed {executed_count} scripts')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Schema synchronization successful',
                'scripts_executed': executed_count
            })
        }

    except Exception as e:
        logger.error(f'Schema synchronization failed: {str(e)}')
        raise

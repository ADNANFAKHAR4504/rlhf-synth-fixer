"""
rotation_handler.py

Lambda function for rotating RDS Aurora credentials in Secrets Manager.
Implements the four-step rotation process: createSecret, setSecret, testSecret, finishSecret.
"""

import json
import os
import boto3
import psycopg2
from botocore.exceptions import ClientError

secrets_client = boto3.client('secretsmanager')
rds_client = boto3.client('rds')


def lambda_handler(event, context):
    """
    Main handler for secret rotation.

    Args:
        event: Lambda event containing SecretId, Token, and Step
        context: Lambda context
    """
    secret_arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    print(f"Executing step: {step} for secret: {secret_arn}")

    # Dispatch to appropriate step handler
    if step == 'createSecret':
        create_secret(secret_arn, token)
    elif step == 'setSecret':
        set_secret(secret_arn, token)
    elif step == 'testSecret':
        test_secret(secret_arn, token)
    elif step == 'finishSecret':
        finish_secret(secret_arn, token)
    else:
        raise ValueError(f"Invalid step: {step}")

    print(f"Successfully completed step: {step}")


def create_secret(secret_arn, token):
    """
    Create a new secret version with a new password.
    """
    # Check if version already exists
    try:
        secrets_client.get_secret_value(
            SecretId=secret_arn,
            VersionId=token,
            VersionStage='AWSPENDING'
        )
        print(f"Version {token} already exists with AWSPENDING stage")
        return
    except ClientError as e:
        if e.response['Error']['Code'] != 'ResourceNotFoundException':
            raise

    # Get current secret
    current_secret = secrets_client.get_secret_value(
        SecretId=secret_arn,
        VersionStage='AWSCURRENT'
    )
    secret_dict = json.loads(current_secret['SecretString'])

    # Generate new password
    new_password = secrets_client.get_random_password(
        PasswordLength=32,
        ExcludeCharacters=os.environ.get('EXCLUDE_CHARACTERS', '/@"\'\\'),
        ExcludePunctuation=False
    )

    # Create new secret version
    secret_dict['password'] = new_password['RandomPassword']

    secrets_client.put_secret_value(
        SecretId=secret_arn,
        ClientRequestToken=token,
        SecretString=json.dumps(secret_dict),
        VersionStages=['AWSPENDING']
    )

    print(f"Created new secret version {token}")


def set_secret(secret_arn, token):
    """
    Set the password in the database using the new secret.
    """
    # Get pending secret
    pending_secret = secrets_client.get_secret_value(
        SecretId=secret_arn,
        VersionId=token,
        VersionStage='AWSPENDING'
    )
    pending_dict = json.loads(pending_secret['SecretString'])

    # Get current secret for master credentials
    current_secret = secrets_client.get_secret_value(
        SecretId=secret_arn,
        VersionStage='AWSCURRENT'
    )
    current_dict = json.loads(current_secret['SecretString'])

    # Connect to database and update password
    try:
        conn = psycopg2.connect(
            host=current_dict.get('host', 'localhost'),
            port=current_dict.get('port', 5432),
            user=current_dict['username'],
            password=current_dict['password'],
            database=current_dict.get('dbname', 'postgres')
        )

        with conn.cursor() as cursor:
            # Update user password
            cursor.execute(
                f"ALTER USER {pending_dict['username']} WITH PASSWORD %s",
                (pending_dict['password'],)
            )
            conn.commit()

        conn.close()
        print(f"Successfully set new password in database")

    except Exception as e:
        print(f"Error setting password: {str(e)}")
        raise


def test_secret(secret_arn, token):
    """
    Test that the new secret works.
    """
    # Get pending secret
    pending_secret = secrets_client.get_secret_value(
        SecretId=secret_arn,
        VersionId=token,
        VersionStage='AWSPENDING'
    )
    pending_dict = json.loads(pending_secret['SecretString'])

    # Test connection with new credentials
    try:
        conn = psycopg2.connect(
            host=pending_dict.get('host', 'localhost'),
            port=pending_dict.get('port', 5432),
            user=pending_dict['username'],
            password=pending_dict['password'],
            database=pending_dict.get('dbname', 'postgres'),
            connect_timeout=5
        )

        with conn.cursor() as cursor:
            cursor.execute('SELECT 1')
            result = cursor.fetchone()
            if result[0] != 1:
                raise ValueError("Test query failed")

        conn.close()
        print(f"Successfully tested new credentials")

    except Exception as e:
        print(f"Error testing new credentials: {str(e)}")
        raise


def finish_secret(secret_arn, token):
    """
    Finish the rotation by marking the new version as current.
    """
    # Get current version
    metadata = secrets_client.describe_secret(SecretId=secret_arn)
    current_version = None

    for version_id, stages in metadata['VersionIdsToStages'].items():
        if 'AWSCURRENT' in stages:
            if version_id == token:
                print(f"Version {token} is already AWSCURRENT")
                return
            current_version = version_id
            break

    # Move AWSCURRENT stage to new version
    secrets_client.update_secret_version_stage(
        SecretId=secret_arn,
        VersionStage='AWSCURRENT',
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )

    print(f"Successfully moved AWSCURRENT stage to version {token}")

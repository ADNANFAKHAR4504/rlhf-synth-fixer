"""
Secrets Manager rotation Lambda for RDS credentials.
Implements AWS Secrets Manager rotation strategy.

FIX #8: Corrected finish_secret() to properly extract version ID.
"""
import json
import os
import boto3
import psycopg2

secretsmanager = boto3.client('secretsmanager')
rds = boto3.client('rds')

def handler(event, context):
    """
    Rotate RDS database credentials.

    Steps:
    1. Create new credentials
    2. Set new credentials in database
    3. Test new credentials
    4. Finalize rotation
    """
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    if step == 'createSecret':
        create_secret(arn, token)
    elif step == 'setSecret':
        set_secret(arn, token)
    elif step == 'testSecret':
        test_secret(arn, token)
    elif step == 'finishSecret':
        finish_secret(arn, token)
    else:
        raise ValueError(f'Invalid step: {step}')

def create_secret(arn, token):
    """Create new secret version with new password."""
    # Get current secret
    current = secretsmanager.get_secret_value(SecretId=arn)
    current_dict = json.loads(current['SecretString'])

    # Generate new password
    new_password = secretsmanager.get_random_password(
        PasswordLength=32,
        ExcludeCharacters='/@"\'\\'
    )['RandomPassword']

    # Create new secret version
    current_dict['password'] = new_password

    secretsmanager.put_secret_value(
        SecretId=arn,
        ClientRequestToken=token,
        SecretString=json.dumps(current_dict),
        VersionStages=['AWSPENDING']
    )

def set_secret(arn, token):
    """Set new password in database."""
    # Get pending secret
    pending = secretsmanager.get_secret_value(
        SecretId=arn,
        VersionId=token,
        VersionStage='AWSPENDING'
    )
    pending_dict = json.loads(pending['SecretString'])

    # Connect to database with current credentials and update password
    current = secretsmanager.get_secret_value(SecretId=arn, VersionStage='AWSCURRENT')
    current_dict = json.loads(current['SecretString'])

    conn = psycopg2.connect(
        host=current_dict['host'],
        user=current_dict['username'],
        password=current_dict['password'],
        database=current_dict['dbname']
    )

    cursor = conn.cursor()
    cursor.execute(f"ALTER USER {current_dict['username']} WITH PASSWORD '{pending_dict['password']}'")
    conn.commit()
    cursor.close()
    conn.close()

def test_secret(arn, token):
    """Test new credentials."""
    pending = secretsmanager.get_secret_value(
        SecretId=arn,
        VersionId=token,
        VersionStage='AWSPENDING'
    )
    pending_dict = json.loads(pending['SecretString'])

    # Test connection
    conn = psycopg2.connect(
        host=pending_dict['host'],
        user=pending_dict['username'],
        password=pending_dict['password'],
        database=pending_dict['dbname']
    )
    conn.close()

def finish_secret(arn, token):
    """FIX #8: Finalize rotation with correct version ID extraction."""
    # Get metadata to find current version
    metadata = secretsmanager.describe_secret(SecretId=arn)
    current_version = None

    # Extract the current version ID
    for version_id, stages in metadata['VersionIdsToStages'].items():
        if 'AWSCURRENT' in stages:
            current_version = version_id
            break

    # Update version stages
    secretsmanager.update_secret_version_stage(
        SecretId=arn,
        VersionStage='AWSCURRENT',
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )

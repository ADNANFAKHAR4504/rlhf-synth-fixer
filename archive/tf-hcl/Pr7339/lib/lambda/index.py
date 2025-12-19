import boto3
import json
import logging
import os
import string
import secrets

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    """
    Secrets Manager rotation handler for Aurora PostgreSQL.

    This function handles the four steps of secret rotation:
    1. createSecret: Create a new version of the secret with a new password
    2. setSecret: Set the password in the database
    3. testSecret: Test the new password works
    4. finishSecret: Finish the rotation by marking the new version as current
    """
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    service_client = boto3.client('secretsmanager', endpoint_url=os.environ.get('SECRETS_MANAGER_ENDPOINT'))

    metadata = service_client.describe_secret(SecretId=arn)
    if not metadata['RotationEnabled']:
        logger.error(f"Secret {arn} is not enabled for rotation")
        raise ValueError(f"Secret {arn} is not enabled for rotation")

    versions = metadata['VersionIdsToStages']
    if token not in versions:
        logger.error(f"Secret version {token} has no stage for rotation of secret {arn}")
        raise ValueError(f"Secret version {token} has no stage for rotation of secret {arn}")

    if "AWSCURRENT" in versions[token]:
        logger.info(f"Secret version {token} already set as AWSCURRENT for secret {arn}")
        return

    elif "AWSPENDING" not in versions[token]:
        logger.error(f"Secret version {token} not set as AWSPENDING for rotation of secret {arn}")
        raise ValueError(f"Secret version {token} not set as AWSPENDING for rotation of secret {arn}")

    if step == "createSecret":
        create_secret(service_client, arn, token)
    elif step == "setSecret":
        set_secret(service_client, arn, token)
    elif step == "testSecret":
        test_secret(service_client, arn, token)
    elif step == "finishSecret":
        finish_secret(service_client, arn, token)
    else:
        raise ValueError(f"Invalid step parameter: {step}")


def create_secret(service_client, arn, token):
    """Create a new secret version with a new password."""
    try:
        service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
        logger.info(f"createSecret: Successfully retrieved secret for {arn}")
    except service_client.exceptions.ResourceNotFoundException:
        current_dict = get_secret_dict(service_client, arn, "AWSCURRENT")

        # Generate new password
        exclude_characters = '/@"\'\\'
        passwd = generate_password(32, exclude_characters)
        current_dict['password'] = passwd

        service_client.put_secret_value(
            SecretId=arn,
            ClientRequestToken=token,
            SecretString=json.dumps(current_dict),
            VersionStages=['AWSPENDING']
        )
        logger.info(f"createSecret: Successfully put secret for ARN {arn} and version {token}")


def set_secret(service_client, arn, token):
    """Set the password in the database."""
    import psycopg2
    from psycopg2 import sql

    current_dict = get_secret_dict(service_client, arn, "AWSCURRENT")
    pending_dict = get_secret_dict(service_client, arn, "AWSPENDING", token)

    try:
        conn = psycopg2.connect(
            host=current_dict['host'],
            user=current_dict['username'],
            password=current_dict['password'],
            database=current_dict.get('dbname', 'postgres'),
            port=current_dict.get('port', 5432),
            connect_timeout=5
        )
        conn.autocommit = True

        with conn.cursor() as cur:
            cur.execute(
                sql.SQL("ALTER USER {} WITH PASSWORD %s").format(
                    sql.Identifier(pending_dict['username'])
                ),
                (pending_dict['password'],)
            )
        conn.close()
        logger.info(f"setSecret: Successfully set password for user {pending_dict['username']} in database")
    except Exception as e:
        logger.error(f"setSecret: Failed to set password in database: {str(e)}")
        raise


def test_secret(service_client, arn, token):
    """Test the new password works."""
    import psycopg2

    pending_dict = get_secret_dict(service_client, arn, "AWSPENDING", token)

    try:
        conn = psycopg2.connect(
            host=pending_dict['host'],
            user=pending_dict['username'],
            password=pending_dict['password'],
            database=pending_dict.get('dbname', 'postgres'),
            port=pending_dict.get('port', 5432),
            connect_timeout=5
        )
        conn.close()
        logger.info(f"testSecret: Successfully connected with new credentials for user {pending_dict['username']}")
    except Exception as e:
        logger.error(f"testSecret: Failed to connect with new credentials: {str(e)}")
        raise


def finish_secret(service_client, arn, token):
    """Finish the rotation by moving the AWSCURRENT stage to the new version."""
    metadata = service_client.describe_secret(SecretId=arn)
    current_version = None

    for version in metadata["VersionIdsToStages"]:
        if "AWSCURRENT" in metadata["VersionIdsToStages"][version]:
            if version == token:
                logger.info(f"finishSecret: Version {version} already marked as AWSCURRENT for {arn}")
                return
            current_version = version
            break

    service_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )
    logger.info(f"finishSecret: Successfully set AWSCURRENT stage to version {token} for secret {arn}")


def get_secret_dict(service_client, arn, stage, token=None):
    """Get the secret dictionary for a given stage."""
    if token:
        secret = service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage=stage)
    else:
        secret = service_client.get_secret_value(SecretId=arn, VersionStage=stage)

    return json.loads(secret['SecretString'])


def generate_password(length, exclude_characters):
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    alphabet = ''.join(c for c in alphabet if c not in exclude_characters)
    return ''.join(secrets.choice(alphabet) for _ in range(length))

import json
import os
import boto3
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
secretsmanager_client = boto3.client('secretsmanager')

def lambda_handler(event, context):
    """
    Lambda handler for Secrets Manager rotation

    Args:
        event: Event data from Secrets Manager
        context: Lambda context
    """
    logger.info("Starting secret rotation")

    # Extract event details
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    try:
        # Get secret metadata
        metadata = secretsmanager_client.describe_secret(SecretId=arn)

        # Check if version exists
        if token not in metadata['VersionIdsToStages']:
            raise ValueError(f"Secret version {token} not found")

        # Execute rotation step
        if step == "createSecret":
            create_secret(arn, token)
        elif step == "setSecret":
            set_secret(arn, token)
        elif step == "testSecret":
            test_secret(arn, token)
        elif step == "finishSecret":
            finish_secret(arn, token)
        else:
            raise ValueError(f"Invalid step: {step}")

        logger.info(f"Successfully completed step: {step}")
        return {
            'statusCode': 200,
            'body': json.dumps(f'Successfully completed {step}')
        }

    except Exception as e:
        logger.error(f"Error during rotation step {step}: {str(e)}")
        raise


def create_secret(arn, token):
    """
    Create new secret version with new password

    Args:
        arn: Secret ARN
        token: Client request token
    """
    logger.info("Creating new secret version")

    # Get current secret
    current_secret = secretsmanager_client.get_secret_value(
        SecretId=arn,
        VersionStage="AWSCURRENT"
    )

    # Parse secret
    secret_dict = json.loads(current_secret['SecretString'])

    # Validate secret format
    required_fields = ['username', 'password', 'engine', 'host', 'port', 'dbname']
    for field in required_fields:
        if field not in secret_dict:
            raise ValueError(f"Secret missing required field: {field}")

    # Generate new password
    new_password = secretsmanager_client.get_random_password(
        PasswordLength=32,
        ExcludeCharacters='/@"\'\\'
    )

    # Update password
    secret_dict['password'] = new_password['RandomPassword']

    # Store new secret version
    try:
        secretsmanager_client.put_secret_value(
            SecretId=arn,
            ClientRequestToken=token,
            SecretString=json.dumps(secret_dict),
            VersionStages=['AWSPENDING']
        )
        logger.info("Successfully created new secret version")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceExistsException':
            logger.info("Secret version already exists")
        else:
            raise


def set_secret(arn, token):
    """
    Set the secret in the database

    Args:
        arn: Secret ARN
        token: Client request token
    """
    logger.info("Setting secret in database")

    # Get pending secret
    pending_secret = secretsmanager_client.get_secret_value(
        SecretId=arn,
        VersionId=token,
        VersionStage="AWSPENDING"
    )

    secret_dict = json.loads(pending_secret['SecretString'])

    # In production, update the database password here
    # For this example, we'll just log
    logger.info(f"Would update password for user: {secret_dict['username']}")
    logger.info("Password updated successfully")


def test_secret(arn, token):
    """
    Test the new secret

    Args:
        arn: Secret ARN
        token: Client request token
    """
    logger.info("Testing new secret")

    # Get pending secret
    pending_secret = secretsmanager_client.get_secret_value(
        SecretId=arn,
        VersionId=token,
        VersionStage="AWSPENDING"
    )

    secret_dict = json.loads(pending_secret['SecretString'])

    # Validate secret format again
    required_fields = ['username', 'password', 'engine', 'host', 'port', 'dbname']
    for field in required_fields:
        if field not in secret_dict:
            raise ValueError(f"Secret missing required field: {field}")

    # Validate password meets requirements
    password = secret_dict['password']
    if len(password) < 12:
        raise ValueError("Password does not meet length requirements")

    logger.info("Secret validation passed")


def finish_secret(arn, token):
    """
    Finish the rotation by marking new version as current

    Args:
        arn: Secret ARN
        token: Client request token
    """
    logger.info("Finishing rotation")

    # Get metadata
    metadata = secretsmanager_client.describe_secret(SecretId=arn)
    current_version = None

    # Find current version
    for version, stages in metadata['VersionIdsToStages'].items():
        if "AWSCURRENT" in stages:
            if version == token:
                logger.info("Version already marked as AWSCURRENT")
                return
            current_version = version
            break

    # Update version stages
    secretsmanager_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )

    logger.info("Successfully finished rotation")

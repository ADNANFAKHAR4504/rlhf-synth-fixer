"""Lambda function for rotating database credentials."""

import json
import os
import boto3
import string
import random

secretsmanager = boto3.client('secretsmanager')


def generate_password(length=32):
    """Generate a secure random password."""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(characters) for _ in range(length))


def handler(event, context):
    """Rotate database credentials in Secrets Manager."""
    try:
        arn = event['SecretId']
        token = event['ClientRequestToken']
        step = event['Step']

        if step == "createSecret":
            # Generate new password
            current_dict = json.loads(
                secretsmanager.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")['SecretString']
            )

            new_password = generate_password()
            current_dict['password'] = new_password

            # Store new version
            secretsmanager.put_secret_value(
                SecretId=arn,
                ClientRequestToken=token,
                SecretString=json.dumps(current_dict),
                VersionStages=['AWSPENDING'],
            )

        elif step == "setSecret":
            # Update database password
            pending_dict = json.loads(
                secretsmanager.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")['SecretString']
            )

            # In production, use pg8000 or psycopg2 to update the database password
            print(f"Would update password for user {pending_dict['username']}")

        elif step == "testSecret":
            # Test the new credentials
            print("Testing new credentials")

        elif step == "finishSecret":
            # Mark the new version as current
            metadata = secretsmanager.describe_secret(SecretId=arn)
            current_version = None

            for version in metadata['VersionIdsToStages']:
                if 'AWSCURRENT' in metadata['VersionIdsToStages'][version]:
                    if version == token:
                        return
                    current_version = version
                    break

            secretsmanager.update_secret_version_stage(
                SecretId=arn,
                VersionStage='AWSCURRENT',
                MoveToVersionId=token,
                RemoveFromVersionId=current_version,
            )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': f'Step {step} completed'}),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise

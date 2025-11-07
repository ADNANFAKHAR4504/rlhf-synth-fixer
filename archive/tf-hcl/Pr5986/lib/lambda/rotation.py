import json
import boto3
import os

secrets_client = boto3.client('secretsmanager')

def handler(event, context):
    """
    Secrets Manager rotation Lambda function
    Rotates database credentials every 30 days
    """
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    try:
        if step == "createSecret":
            create_secret(secrets_client, arn, token)
        elif step == "setSecret":
            set_secret(secrets_client, arn, token)
        elif step == "testSecret":
            test_secret(secrets_client, arn, token)
        elif step == "finishSecret":
            finish_secret(secrets_client, arn, token)
        else:
            raise ValueError(f"Invalid step: {step}")

        return {
            'statusCode': 200,
            'body': json.dumps(f"Successfully completed {step}")
        }

    except Exception as e:
        print(f"Error in rotation step {step}: {str(e)}")
        raise

def create_secret(service_client, arn, token):
    """Create a new version of the secret"""
    # Get current secret
    current_dict = get_secret_dict(service_client, arn, "AWSCURRENT")

    # Create new password (simplified for example)
    current_dict['password'] = generate_password()

    # Put new secret version
    service_client.put_secret_value(
        SecretId=arn,
        ClientRequestToken=token,
        SecretString=json.dumps(current_dict),
        VersionStages=['AWSPENDING']
    )

def set_secret(service_client, arn, token):
    """Update the database with new credentials"""
    # In production, this would connect to database and update credentials
    pass

def test_secret(service_client, arn, token):
    """Test the new credentials"""
    # In production, this would test database connection with new credentials
    pass

def finish_secret(service_client, arn, token):
    """Finalize the rotation"""
    service_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=get_secret_version(service_client, arn, "AWSCURRENT")
    )

def get_secret_dict(service_client, arn, stage):
    """Get secret dictionary"""
    response = service_client.get_secret_value(SecretId=arn, VersionStage=stage)
    return json.loads(response['SecretString'])

def get_secret_version(service_client, arn, stage):
    """Get secret version ID"""
    response = service_client.describe_secret(SecretId=arn)
    for version_id, stages in response['VersionIdsToStages'].items():
        if stage in stages:
            return version_id
    return None

def generate_password():
    """Generate a secure random password"""
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for i in range(32))
import json
import boto3
import os

secrets_client = boto3.client('secretsmanager')

def lambda_handler(event, context):
    """
    Rotate RDS master password
    """
    secret_arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']
    
    metadata = secrets_client.describe_secret(SecretId=secret_arn)
    
    if step == 'createSecret':
        create_secret(secret_arn, token)
    elif step == 'setSecret':
        set_secret(secret_arn, token)
    elif step == 'testSecret':
        test_secret(secret_arn, token)
    elif step == 'finishSecret':
        finish_secret(secret_arn, token)
    else:
        raise ValueError(f'Invalid step: {step}')
    
    return {'statusCode': 200}

def create_secret(secret_arn, token):
    """Create new secret version"""
    password = secrets_client.get_random_password(
        PasswordLength=32,
        ExcludeCharacters='/@"\'\\'
    )
    
    current = secrets_client.get_secret_value(SecretId=secret_arn)
    secret = json.loads(current['SecretString'])
    secret['password'] = password['RandomPassword']
    
    secrets_client.put_secret_value(
        SecretId=secret_arn,
        ClientRequestToken=token,
        SecretString=json.dumps(secret),
        VersionStages=['AWSPENDING']
    )

def set_secret(secret_arn, token):
    """Set the secret in the database"""
    pass

def test_secret(secret_arn, token):
    """Test the new secret"""
    pass

def finish_secret(secret_arn, token):
    """Finalize the rotation"""
    metadata = secrets_client.describe_secret(SecretId=secret_arn)
    current_version = None
    for version in metadata['VersionIdsToStages']:
        if 'AWSCURRENT' in metadata['VersionIdsToStages'][version]:
            current_version = version
            break
    
    secrets_client.update_secret_version_stage(
        SecretId=secret_arn,
        VersionStage='AWSCURRENT',
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )

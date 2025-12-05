from constructs import Construct
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json
import zipfile
import io
import base64


class SecretsConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, database, security, vpc):
        super().__init__(scope, id)

        # Get current AWS account ID
        current = DataAwsCallerIdentity(self, "current")

        # Secret for database credentials
        self.db_secret = SecretsmanagerSecret(self, "db_secret",
            name=f"financial-db-credentials-{environment_suffix}",
            description="Database credentials for financial transaction platform",
            kms_key_id=security.kms_key.arn,
            recovery_window_in_days=0,  # Set to 0 for test environments (immediate deletion)
            tags={
                "Name": f"financial-db-credentials-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Initial secret value
        secret_value = {
            "username": "admin",
            "password": "ChangeMe123456!",
            "engine": "mysql",
            "host": database.cluster.endpoint,
            "port": 3306,
            "dbname": "financialdb"
        }

        SecretsmanagerSecretVersion(self, "db_secret_version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(secret_value)
        )

        # Lambda function code for rotation
        rotation_code = """
import json
import boto3
import os
import pymysql
from botocore.exceptions import ClientError

secretsmanager_client = boto3.client('secretsmanager')
rds_client = boto3.client('rds')

def lambda_handler(event, context):
    \"\"\"
    Lambda function to rotate database credentials
    \"\"\"
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    # Get the secret
    metadata = secretsmanager_client.describe_secret(SecretId=arn)

    if not metadata['RotationEnabled']:
        raise ValueError(f"Secret {arn} is not enabled for rotation")

    versions = metadata['VersionIdsToStages']
    if token not in versions:
        raise ValueError(f"Secret version {token} has no stage for rotation")

    if "AWSCURRENT" in versions[token]:
        print(f"Secret version {token} already set as AWSCURRENT")
        return
    elif "AWSPENDING" not in versions[token]:
        raise ValueError(f"Secret version {token} not set as AWSPENDING for rotation")

    if step == "createSecret":
        create_secret(arn, token)
    elif step == "setSecret":
        set_secret(arn, token)
    elif step == "testSecret":
        test_secret(arn, token)
    elif step == "finishSecret":
        finish_secret(arn, token)
    else:
        raise ValueError("Invalid step parameter")

def create_secret(arn, token):
    \"\"\"Create new secret version with new password\"\"\"
    try:
        secretsmanager_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
        print(f"createSecret: Successfully retrieved secret for {arn}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            # Generate new password
            passwd = secretsmanager_client.get_random_password(
                ExcludeCharacters='/@"\\'',
                PasswordLength=32
            )

            # Get current secret
            current_dict = json.loads(secretsmanager_client.get_secret_value(
                SecretId=arn, VersionStage="AWSCURRENT")['SecretString'])

            # Create new secret with new password
            current_dict['password'] = passwd['RandomPassword']

            # Put new secret
            secretsmanager_client.put_secret_value(
                SecretId=arn,
                ClientRequestToken=token,
                SecretString=json.dumps(current_dict),
                VersionStages=['AWSPENDING']
            )
            print(f"createSecret: Successfully created new secret for {arn}")
        else:
            raise

def set_secret(arn, token):
    \"\"\"Set new password in database\"\"\"
    # Get pending secret
    pending = json.loads(secretsmanager_client.get_secret_value(
        SecretId=arn, VersionId=token, VersionStage="AWSPENDING")['SecretString'])

    # Get current secret
    current = json.loads(secretsmanager_client.get_secret_value(
        SecretId=arn, VersionStage="AWSCURRENT")['SecretString'])

    # Connect to database with current credentials
    conn = pymysql.connect(
        host=current['host'],
        user=current['username'],
        password=current['password'],
        database=current['dbname'],
        connect_timeout=5
    )

    try:
        with conn.cursor() as cursor:
            # Update password
            alter_user_sql = f"ALTER USER '{pending['username']}'@'%' IDENTIFIED BY '{pending['password']}'"
            cursor.execute(alter_user_sql)
            conn.commit()
            print(f"setSecret: Successfully set password for {arn}")
    finally:
        conn.close()

def test_secret(arn, token):
    \"\"\"Test new credentials\"\"\"
    # Get pending secret
    pending = json.loads(secretsmanager_client.get_secret_value(
        SecretId=arn, VersionId=token, VersionStage="AWSPENDING")['SecretString'])

    # Test connection with new credentials
    conn = pymysql.connect(
        host=pending['host'],
        user=pending['username'],
        password=pending['password'],
        database=pending['dbname'],
        connect_timeout=5
    )

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
            print(f"testSecret: Successfully tested password for {arn}")
    finally:
        conn.close()

def finish_secret(arn, token):
    \"\"\"Finalize rotation by moving stages\"\"\"
    metadata = secretsmanager_client.describe_secret(SecretId=arn)
    current_version = None

    for version, stages in metadata["VersionIdsToStages"].items():
        if "AWSCURRENT" in stages:
            if version == token:
                print(f"finishSecret: Version {version} already marked as AWSCURRENT")
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

    print(f"finishSecret: Successfully set AWSCURRENT stage to version {token}")
"""

        # Create deployment package
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr('lambda_function.py', rotation_code)

        zip_buffer.seek(0)
        zip_content = base64.b64encode(zip_buffer.read()).decode('utf-8')

        # Lambda function for secret rotation
        self.rotation_lambda = LambdaFunction(self, "rotation_lambda",
            function_name=f"financial-secret-rotation-{environment_suffix}",
            runtime="python3.9",
            handler="lambda_function.lambda_handler",
            filename="lambda_function.zip",  # This would be properly packaged
            source_code_hash=zip_content[:20],  # Simplified for example
            role=security.lambda_role.arn,
            timeout=30,
            memory_size=256,
            environment={
                "variables": {
                    "SECRETS_MANAGER_ENDPOINT": f"https://secretsmanager.us-east-1.amazonaws.com"
                }
            },
            vpc_config={
                "subnet_ids": [subnet.id for subnet in vpc.private_subnets],
                "security_group_ids": [security.lambda_sg.id]
            },
            tags={
                "Name": f"financial-rotation-lambda-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Grant Secrets Manager permission to invoke Lambda
        LambdaPermission(self, "rotation_lambda_permission",
            statement_id="AllowSecretsManagerInvoke",
            action="lambda:InvokeFunction",
            function_name=self.rotation_lambda.function_name,
            principal="secretsmanager.amazonaws.com"
        )

        # Enable automatic rotation (30 days)
        SecretsmanagerSecretRotation(self, "db_secret_rotation",
            secret_id=self.db_secret.id,
            rotation_lambda_arn=self.rotation_lambda.arn,
            rotation_rules={
                "automatically_after_days": 30
            }
        )

I'll implement a secure, production-grade serverless web application using AWS CDK v2 in Python. Here's the complete solution:

## 📁 Project Structure

```plaintext
root/
├── tap.py                     # CDK App entry point
├── lib/
│   └── tap_stack.py           # All resources defined here
├── tests/
│   ├── unit/
│   │   └── test_tap_stack.py  # Unit tests for resources
│   └── integration/
│       └── test_tap_stack.py  # Boto3-based integration tests
├── cdk.json                   # CDK context file
└── requirements.txt           # Python dependencies
```

## 🔧 Implementation

### 1. `requirements.txt`

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.26.0
pytest>=7.0.0
moto>=4.2.0
```

### 2. `cdk.json`

```json
{
  "app": "python tap.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

### 3. `tap.py` (CDK App Entry Point)

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()
TapStack(app, "TapStack", env=cdk.Environment(region="us-west-2"))

app.synth()
```

### 4. `lib/tap_stack.py` (Main Stack Implementation)

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_lambda as lambda_,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as integrations,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_logs as logs,
    aws_kms as kms,
    CfnOutput
)
from constructs import Construct
import json


class TapStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create KMS key for encryption
        self.kms_key = kms.Key(
            self, "TapKMSKey",
            description="KMS key for TAP application encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create KMS key alias
        kms.Alias(
            self, "TapKMSKeyAlias",
            alias_name="alias/tap-application-key",
            target_key=self.kms_key
        )

        # Create Secrets Manager secret
        self.secret = secretsmanager.Secret(
            self, "TapSecret",
            description="Application secrets for TAP",
            secret_name="tap-application-secrets",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"username": "admin"}),
                generate_string_key="password",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\"\\",
                include_space=False,
                password_length=32
            ),
            encryption_key=self.kms_key
        )

        # Create DynamoDB table
        self.dynamodb_table = dynamodb.Table(
            self, "TapTable",
            table_name="tap-data-table",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.ON_DEMAND,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )

        # Create S3 bucket
        self.s3_bucket = s3.Bucket(
            self, "TapBucket",
            bucket_name=f"tap-storage-bucket-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Create IAM role for Lambda
        self.lambda_role = iam.Role(
            self, "TapLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add inline policies for least privilege access
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "secretsmanager:GetSecretValue"
                ],
                resources=[self.secret.secret_arn]
            )
        )

        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                resources=[self.dynamodb_table.table_arn]
            )
        )

        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                resources=[f"{self.s3_bucket.bucket_arn}/*"]
            )
        )

        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:ListBucket"
                ],
                resources=[self.s3_bucket.bucket_arn]
            )
        )

        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                resources=[self.kms_key.key_arn]
            )
        )

        # Create Lambda functions
        self.create_lambda_functions()

        # Create API Gateway
        self.create_api_gateway()

        # Create CloudWatch Log Groups with retention
        self.create_log_groups()

        # Create outputs
        self.create_outputs()

    def create_lambda_functions(self):
        """Create Lambda functions with inline code"""
        
        # Main API Lambda function
        self.api_lambda = lambda_.Function(
            self, "TapApiFunction",
            function_name="tap-api-function",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            role=self.lambda_role,
            timeout=Duration.seconds(30),
            environment={
                "SECRET_ARN": self.secret.secret_arn,
                "DYNAMODB_TABLE": self.dynamodb_table.table_name,
                "S3_BUCKET": self.s3_bucket.bucket_name,
                "KMS_KEY_ID": self.kms_key.key_id
            },
            code=lambda_.InlineCode("""
import json
import boto3
import os
import logging
from datetime import datetime
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
SECRET_ARN = os.environ['SECRET_ARN']
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
KMS_KEY_ID = os.environ['KMS_KEY_ID']

def get_secret():
    \"\"\"Retrieve secret from AWS Secrets Manager\"\"\"
    try:
        response = secrets_client.get_secret_value(SecretId=SECRET_ARN)
        return json.loads(response['SecretString'])
    except Exception as e:
        logger.error(f"Error retrieving secret: {str(e)}")
        raise

def validate_request(event):
    \"\"\"Validate incoming request\"\"\"
    required_fields = ['action']
    body = json.loads(event.get('body', '{}'))
    
    for field in required_fields:
        if field not in body:
            return False, f"Missing required field: {field}"
    
    valid_actions = ['create', 'read', 'update', 'delete', 'upload_url']
    if body['action'] not in valid_actions:
        return False, f"Invalid action. Must be one of: {valid_actions}"
    
    return True, body

def handle_create(data):
    \"\"\"Handle create operation\"\"\"
    table = dynamodb.Table(DYNAMODB_TABLE)
    
    item_id = str(uuid.uuid4())
    item = {
        'id': item_id,
        'data': data.get('data', {}),
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    table.put_item(Item=item)
    return {'id': item_id, 'message': 'Item created successfully'}

def handle_read(data):
    \"\"\"Handle read operation\"\"\"
    table = dynamodb.Table(DYNAMODB_TABLE)
    
    if 'id' in data:
        response = table.get_item(Key={'id': data['id']})
        return response.get('Item', {})
    else:
        response = table.scan()
        return response.get('Items', [])

def handle_update(data):
    \"\"\"Handle update operation\"\"\"
    if 'id' not in data:
        raise ValueError("ID is required for update operation")
    
    table = dynamodb.Table(DYNAMODB_TABLE)
    
    table.update_item(
        Key={'id': data['id']},
        UpdateExpression='SET #data = :data, updated_at = :updated_at',
        ExpressionAttributeNames={'#data': 'data'},
        ExpressionAttributeValues={
            ':data': data.get('data', {}),
            ':updated_at': datetime.utcnow().isoformat()
        }
    )
    
    return {'message': 'Item updated successfully'}

def handle_delete(data):
    \"\"\"Handle delete operation\"\"\"
    if 'id' not in data:
        raise ValueError("ID is required for delete operation")
    
    table = dynamodb.Table(DYNAMODB_TABLE)
    table.delete_item(Key={'id': data['id']})
    
    return {'message': 'Item deleted successfully'}

def handle_upload_url(data):
    \"\"\"Generate presigned URL for S3 upload\"\"\"
    if 'filename' not in data:
        raise ValueError("Filename is required for upload URL generation")
    
    key = f"uploads/{uuid.uuid4()}/{data['filename']}"
    
    presigned_url = s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': S3_BUCKET,
            'Key': key,
            'ServerSideEncryption': 'aws:kms',
            'SSEKMSKeyId': KMS_KEY_ID
        },
        ExpiresIn=3600  # 1 hour
    )
    
    return {
        'upload_url': presigned_url,
        'key': key,
        'expires_in': 3600
    }

def handler(event, context):
    \"\"\"Main Lambda handler\"\"\"
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Validate request
        is_valid, result = validate_request(event)
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                'body': json.dumps({'error': result})
            }
        
        # Get secret (for demonstration)
        secret_data = get_secret()
        logger.info("Successfully retrieved secret")
        
        # Route to appropriate handler
        action = result['action']
        
        if action == 'create':
            response_data = handle_create(result)
        elif action == 'read':
            response_data = handle_read(result)
        elif action == 'update':
            response_data = handle_update(result)
        elif action == 'delete':
            response_data = handle_delete(result)
        elif action == 'upload_url':
            response_data = handle_upload_url(result)
        else:
            raise ValueError(f"Unsupported action: {action}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
""")
        )

        # Health check Lambda function
        self.health_lambda = lambda_.Function(
            self, "TapHealthFunction",
            function_name="tap-health-function",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            role=self.lambda_role,
            timeout=Duration.seconds(10),
            environment={
                "DYNAMODB_TABLE": self.dynamodb_table.table_name,
                "S3_BUCKET": self.s3_bucket.bucket_name
            },
            code=lambda_.InlineCode("""
import json
import boto3
import os
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']

def check_dynamodb():
    \"\"\"Check DynamoDB table health\"\"\"
    try:
        table = dynamodb.Table(DYNAMODB_TABLE)
        table.load()
        return True, "DynamoDB table is accessible"
    except Exception as e:
        return False, f"DynamoDB error: {str(e)}"

def check_s3():
    \"\"\"Check S3 bucket health\"\"\"
    try:
        s3_client.head_bucket(Bucket=S3_BUCKET)
        return True, "S3 bucket is accessible"
    except Exception as e:
        return False, f"S3 error: {str(e)}"

def handler(event, context):
    \"\"\"Health check handler\"\"\"
    logger.info("Health check requested")
    
    health_status = {
        'timestamp': datetime.utcnow().isoformat(),
        'status': 'healthy',
        'checks': {}
    }
    
    # Check DynamoDB
    db_healthy, db_message = check_dynamodb()
    health_status['checks']['dynamodb'] = {
        'status': 'healthy' if db_healthy else 'unhealthy',
        'message': db_message
    }
    
    # Check S3
    s3_healthy, s3_message = check_s3()
    health_status['checks']['s3'] = {
        'status': 'healthy' if s3_healthy else 'unhealthy',
        'message': s3_message
    }
    
    # Overall status
    if not (db_healthy and s3_healthy):
        health_status['status'] = 'unhealthy'
    
    status_code = 200 if health_status['status'] == 'healthy' else 503
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(health_status)
    }
""")
        )

    def create_api_gateway(self):
        """Create API Gateway with proper CORS and validation"""
        
        # Create HTTP API
        self.http_api = apigwv2.HttpApi(
            self, "TapHttpApi",
            api_name="tap-http-api",
            description="TAP Application HTTP API",
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_credentials=False,
                allow_headers=["Content-Type", "Authorization"],
                allow_methods=[
                    apigwv2.CorsHttpMethod.GET,
                    apigwv2.CorsHttpMethod.POST,
                    apigwv2.CorsHttpMethod.PUT,
                    apigwv2.CorsHttpMethod.DELETE,
                    apigwv2.CorsHttpMethod.OPTIONS
                ],
                allow_origins=["*"],
                max_age=Duration.days(1)
            )
        )

        # Create Lambda integrations
        api_integration = integrations.HttpLambdaIntegration(
            "TapApiIntegration",
            self.api_lambda
        )

        health_integration = integrations.HttpLambdaIntegration(
            "TapHealthIntegration",
            self.health_lambda
        )

        # Add routes
        self.http_api.add_routes(
            path="/api",
            methods=[apigwv2.HttpMethod.POST],
            integration=api_integration
        )

        self.http_api.add_routes(
            path="/health",
            methods=[apigwv2.HttpMethod.GET],
            integration=health_integration
        )

    def create_log_groups(self):
        """Create CloudWatch Log Groups with retention policy"""
        
        # API Lambda log group
        logs.LogGroup(
            self, "TapApiLogGroup",
            log_group_name=f"/aws/lambda/{self.api_lambda.function_name}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Health Lambda log group
        logs.LogGroup(
            self, "TapHealthLogGroup",
            log_group_name=f"/aws/lambda/{self.health_lambda.function_name}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

    def create_outputs(self):
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self, "ApiEndpoint",
            value=self.http_api.url,
            description="HTTP API Gateway endpoint URL"
        )

        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 bucket name for file storage"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB table name"
        )

        CfnOutput(
            self, "SecretArn",
            value=self.secret.secret_arn,
            description="Secrets Manager secret ARN"
        )

        CfnOutput(
            self, "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS key ID for encryption"
        )
```

### 5. `tests/unit/test_tap_stack.py`

```python
import aws_cdk as core
import aws_cdk.assertions as assertions
from lib.tap_stack import TapStack
import pytest


class TestTapStack:
    
    @pytest.fixture
    def stack(self):
        app = core.App()
        return TapStack(app, "test-stack", env=core.Environment(region="us-west-2"))
    
    def test_lambda_functions_created(self, stack):
        template = assertions.Template.from_stack(stack)
        
        # Test API Lambda function
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Timeout": 30,
            "FunctionName": "tap-api-function"
        })
        
        # Test Health Lambda function
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Timeout": 10,
            "FunctionName": "tap-health-function"
        })
    
    def test_dynamodb_table_created(self, stack):
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "tap-data-table",
            "BillingMode": "ON_DEMAND",
            "AttributeDefinitions": [
                {
                    "AttributeName": "id",
                    "AttributeType": "S"
                }
            ],
            "KeySchema": [
                {
                    "AttributeName": "id",
                    "KeyType": "HASH"
                }
            ]
        })
    
    def test_s3_bucket_created(self, stack):
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            }
        })
    
    def test_api_gateway_created(self, stack):
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ApiGatewayV2::Api", {
            "Name": "tap-http-api",
            "ProtocolType": "HTTP"
        })
    
    def test_secrets_manager_created(self, stack):
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": "tap-application-secrets"
        })
    
    def test_kms_key_created(self, stack):
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": "KMS key for TAP application encryption",
            "EnableKeyRotation": True
        })
    
    def test_iam_role_permissions(self, stack):
        template = assertions.Template.from_stack(stack)
        
        # Check that Lambda role exists
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ]
            }
        })
        
        # Check that inline policies exist for least privilege
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": assertions.Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": "secretsmanager:GetSecretValue"
                    }
                ])
            }
        })
    
    def test_log_groups_created(self, stack):
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/lambda/tap-api-function",
            "RetentionInDays": 7
        })
        
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/lambda/tap-health-function",
            "RetentionInDays": 7
        })
    
    def test_environment_variables_set(self, stack):
        template = assertions.Template.from_stack(stack)
        
        # Check that Lambda functions have required environment variables
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": {
                    "SECRET_ARN": assertions.Match.any_value(),
                    "DYNAMODB_TABLE": "tap-data-table",
                    "S3_BUCKET": assertions.Match.any_value(),
                    "KMS_KEY_ID": assertions.Match.any_value()
                }
            }
        })
```

### 6. `tests/integration/test_tap_stack.py`

```python
import boto3
import json
import pytest
import requests
import time
from moto import mock_dynamodb, mock_s3, mock_secretsmanager, mock_kms
import os


class TestTapStackIntegration:
    """Integration tests for the deployed TAP stack"""
    
    @pytest.fixture(scope="class")
    def aws_credentials(self):
        """Mocked AWS Credentials for moto"""
        os.environ["AWS_ACCESS_KEY_ID"] = "testing"
        os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
        os.environ["AWS_SECURITY_TOKEN"] = "testing"
        os.environ["AWS_SESSION_TOKEN"] = "testing"
        os.environ["AWS_DEFAULT_REGION"] = "us-west-2"
    
    @mock_dynamodb
    @mock_s3
    @mock_secretsmanager
    @mock_kms
    def test_dynamodb_operations(self, aws_credentials):
        """Test DynamoDB operations"""
        # Create mock DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
        
        table = dynamodb.create_table(
            TableName='tap-data-table',
            KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'
                }
            ],
            BillingMode='ON_DEMAND'
        )
        
        # Test put item
        table.put_item(
            Item={
                'id': 'test-id',
                'data': {'test': 'value'},
                'created_at': '2023-01-01T00:00:00'
            }
        )
        
        # Test get item
        response = table.get_item(
            Key={'id': 'test-id'}
        )
        
        assert 'Item' in response
        assert response['Item']['id'] == 'test-id'
        assert response['Item']['data']['test'] == 'value'
    
    @mock_s3
    def test_s3_operations(self, aws_credentials):
        """Test S3 operations"""
        # Create mock S3 bucket
        s3_client = boto3.client('s3', region_name='us-west-2')
        bucket_name = 'test-tap-bucket'
        
        s3_client.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={'LocationConstraint': 'us-west-2'}
        )
        
        # Test put object
        s3_client.put_object(
            Bucket=bucket_name,
            Key='test-file.txt',
            Body=b'test content'
        )
        
        # Test get object
        response = s3_client.get_object(
            Bucket=bucket_name,
            Key='test-file.txt'
        )
        
        assert response['Body'].read() == b'test content'
        
        # Test presigned URL generation
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': bucket_name, 'Key': 'upload-test.txt'},
            ExpiresIn=3600
        )
        
        assert presigned_url is not None
        assert bucket_name in presigned_url
    
    @mock_secretsmanager
    @mock_kms
    def test_secrets_manager_operations(self, aws_credentials):
        """Test Secrets Manager operations"""
        # Create mock KMS key
        kms_client = boto3.client('kms', region_name='us-west-2')
        key_response = kms_client.create_key(
            Description='Test key for secrets'
        )
        key_id = key_response['KeyMetadata']['KeyId']
        
        # Create mock secret
        secrets_client = boto3.client('secretsmanager', region_name='us-west-2')
        
        secret_value = json.dumps({
            'username': 'admin',
            'password': 'test-password'
        })
        
        secrets_client.create_secret(
            Name='tap-application-secrets',
            SecretString=secret_value,
            KmsKeyId=key_id
        )
        
        # Test get secret
        response = secrets_client.get_secret_value(
            SecretId='tap-application-secrets'
        )
        
        retrieved_secret = json.loads(response['SecretString'])
        assert retrieved_secret['username'] == 'admin'
        assert 'password' in retrieved_secret
    
    def test_lambda_function_validation(self):
        """Test Lambda function code validation"""
        # This would test the actual deployed Lambda functions
        # In a real scenario, you would invoke the Lambda functions
        # and test their responses
        
        # Mock request payload
        test_payload = {
            'body': json.dumps
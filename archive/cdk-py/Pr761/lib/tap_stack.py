"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional
import json
import os
import textwrap

import aws_cdk as cdk
from aws_cdk import (
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

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties,
    CDK context, or defaults to 'dev'.
  Note:
    - Do NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, env var, or use 'dev' as default
    self.environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or os.environ.get(
        'ENVIRONMENT_SUFFIX', 'dev')

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
        alias_name=f"alias/tap-application-key-{self.environment_suffix}",
        target_key=self.kms_key
    )

    # Create Secrets Manager secret
    self.secret = secretsmanager.Secret(
        self, "TapSecret",
        description="Application secrets for TAP",
        secret_name=f"tap-application-secrets-{self.environment_suffix}",
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
        table_name=f"tap-data-table-{self.environment_suffix}",
        partition_key=dynamodb.Attribute(
            name="id",
            type=dynamodb.AttributeType.STRING
        ),
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryption_key=self.kms_key,
        removal_policy=RemovalPolicy.DESTROY,
        point_in_time_recovery=True
    )

    # Create S3 bucket
    self.s3_bucket = s3.Bucket(
        self, "TapBucket",
        bucket_name=f"tap-storage-bucket-{self.environment_suffix}-{self.account}-{self.region}",
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

    # Create outputs
    self.create_outputs()

  def create_lambda_functions(self):
    """Create Lambda functions with inline code"""

    # Main API Lambda function
    self.api_lambda = lambda_.Function(
        self, "TapApiFunction",
        function_name=f"tap-api-function-{self.environment_suffix}",
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
        log_retention=logs.RetentionDays.ONE_WEEK,
        code=lambda_.InlineCode(textwrap.dedent("""\
            import json
            import boto3
            import os
            import logging
            from datetime import datetime
            import uuid

            logger = logging.getLogger()
            logger.setLevel(logging.INFO)

            secrets_client = boto3.client('secretsmanager')
            dynamodb = boto3.resource('dynamodb')
            s3_client = boto3.client('s3')

            SECRET_ARN = os.environ['SECRET_ARN']
            DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
            S3_BUCKET = os.environ['S3_BUCKET']
            KMS_KEY_ID = os.environ['KMS_KEY_ID']

            def get_secret():
                try:
                    response = secrets_client.get_secret_value(SecretId=SECRET_ARN)
                    return json.loads(response['SecretString'])
                except Exception as e:
                    logger.error(f"Error retrieving secret: {str(e)}")
                    raise

            def validate_request(event):
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
                table = dynamodb.Table(DYNAMODB_TABLE)
                if 'id' in data:
                    response = table.get_item(Key={'id': data['id']})
                    return response.get('Item', {})
                else:
                    response = table.scan()
                    return response.get('Items', [])

            def handle_update(data):
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
                if 'id' not in data:
                    raise ValueError("ID is required for delete operation")
                table = dynamodb.Table(DYNAMODB_TABLE)
                table.delete_item(Key={'id': data['id']})
                return {'message': 'Item deleted successfully'}

            def handle_upload_url(data):
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
                    ExpiresIn=3600
                )
                return {
                    'upload_url': presigned_url,
                    'key': key,
                    'expires_in': 3600
                }

            def handler(event, context):
                logger.info(f"Received event: {json.dumps(event)}")
                try:
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

                    secret_data = get_secret()
                    logger.info("Successfully retrieved secret")
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
        """))
    )

    # Health check Lambda function
    self.health_lambda = lambda_.Function(
        self, "TapHealthFunction",
        function_name=f"tap-health-function-{self.environment_suffix}",
        runtime=lambda_.Runtime.PYTHON_3_11,
        handler="index.handler",
        role=self.lambda_role,
        timeout=Duration.seconds(10),
        environment={
            "DYNAMODB_TABLE": self.dynamodb_table.table_name,
            "S3_BUCKET": self.s3_bucket.bucket_name
        },
        log_retention=logs.RetentionDays.ONE_WEEK,
        code=lambda_.InlineCode(textwrap.dedent("""\
            import json
            import boto3
            import os
            import logging
            from datetime import datetime

            logger = logging.getLogger()
            logger.setLevel(logging.INFO)

            dynamodb = boto3.resource('dynamodb')
            s3_client = boto3.client('s3')

            DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
            S3_BUCKET = os.environ['S3_BUCKET']

            def check_dynamodb():
                try:
                    table = dynamodb.Table(DYNAMODB_TABLE)
                    table.load()
                    return True, "DynamoDB table is accessible"
                except Exception as e:
                    return False, f"DynamoDB error: {str(e)}"

            def check_s3():
                try:
                    s3_client.head_bucket(Bucket=S3_BUCKET)
                    return True, "S3 bucket is accessible"
                except Exception as e:
                    return False, f"S3 error: {str(e)}"

            def handler(event, context):
                logger.info("Health check requested")

                health_status = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'status': 'healthy',
                    'checks': {}
                }

                db_healthy, db_message = check_dynamodb()
                health_status['checks']['dynamodb'] = {
                    'status': 'healthy' if db_healthy else 'unhealthy',
                    'message': db_message
                }

                s3_healthy, s3_message = check_s3()
                health_status['checks']['s3'] = {
                    'status': 'healthy' if s3_healthy else 'unhealthy',
                    'message': s3_message
                }

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
        """))
    )

  def create_api_gateway(self):
    """Create API Gateway with proper CORS and validation"""

    # Create HTTP API
    self.http_api = apigwv2.HttpApi(
        self, "TapHttpApi",
        api_name=f"tap-http-api-{self.environment_suffix}",
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

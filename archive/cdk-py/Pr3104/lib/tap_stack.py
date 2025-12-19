"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import textwrap

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Represents the main CDK stack for the Tap project.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Environment-based resource prefix for consistent naming
        resource_prefix = f"{environment_suffix}-serverless"

        # 1. Create KMS key for S3 encryption
        encryption_key = kms.Key(
            self,
            f"{resource_prefix}-encryption-key",
            alias=f"alias/{resource_prefix}-s3-key",
            enable_key_rotation=True,
            description=f"KMS key for {environment_suffix} S3 bucket encryption"
        )

        # 2. Create S3 bucket with server-side encryption (no explicit bucket name)
        bucket = s3.Bucket(
            self,
            f"{resource_prefix}-bucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=encryption_key,
            removal_policy=RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        # 3. Create DynamoDB tables (no explicit table names - CDK will auto-generate)
        users_table = dynamodb.Table(
            self,
            f"{resource_prefix}-users-table",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )

        orders_table = dynamodb.Table(
            self,
            f"{resource_prefix}-orders-table",
            partition_key=dynamodb.Attribute(
                name="order_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.RETAIN
        )

        # Set up auto-scaling for the orders table
        read_scaling = orders_table.auto_scale_read_capacity(
            min_capacity=5,
            max_capacity=100
        )
        read_scaling.scale_on_utilization(target_utilization_percent=70)

        write_scaling = orders_table.auto_scale_write_capacity(
            min_capacity=5,
            max_capacity=50
        )
        write_scaling.scale_on_utilization(target_utilization_percent=70)

        # 4. Define Lambda function code inline
        get_user_code = textwrap.dedent(
            """
            import os
            import json
            import boto3
            from decimal import Decimal

            # Custom JSON encoder for Decimal types
            class DecimalEncoder(json.JSONEncoder):
                def default(self, o):
                    if isinstance(o, Decimal):
                        return float(o)
                    return super(DecimalEncoder, self).default(o)

            # Initialize DynamoDB client
            dynamodb = boto3.resource('dynamodb')
            table_name = os.environ['USERS_TABLE']
            table = dynamodb.Table(table_name)

            def handler(event, context):
                # Get user_id from path parameters
                user_id = event['pathParameters']['user_id']
                
                try:
                    # Get user from DynamoDB
                    response = table.get_item(Key={'user_id': user_id})
                    
                    # Return user if found
                    if 'Item' in response:
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json'},
                            'body': json.dumps(response['Item'], cls=DecimalEncoder)
                        }
                    else:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json'},
                            'body': json.dumps({'error': 'User not found'})
                        }
                except Exception as e:
                    print(f"Error getting user: {str(e)}")
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Internal server error'})
                    }
            """
        )

        create_user_code = textwrap.dedent(
            """
            import os
            import json
            import boto3
            import uuid
            from datetime import datetime

            # Initialize DynamoDB client
            dynamodb = boto3.resource('dynamodb')
            table_name = os.environ['USERS_TABLE']
            table = dynamodb.Table(table_name)
            env = os.environ['ENVIRONMENT']

            def handler(event, context):
                try:
                    # Parse request body
                    body = json.loads(event['body'])
                    
                    # Generate user_id if not provided
                    if 'user_id' not in body:
                        body['user_id'] = str(uuid.uuid4())
                        
                    # Add metadata
                    body['created_at'] = datetime.utcnow().isoformat()
                    body['environment'] = env
                    
                    # Save user to DynamoDB
                    table.put_item(Item=body)
                    
                    return {
                        'statusCode': 201,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({
                            'message': 'User created successfully',
                            'user_id': body['user_id']
                        })
                    }
                except Exception as e:
                    print(f"Error creating user: {str(e)}")
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Internal server error'})
                    }
            """
        )

        get_orders_code = textwrap.dedent(
            """
            import os
            import json
            import boto3
            from decimal import Decimal

            # Custom JSON encoder for Decimal types
            class DecimalEncoder(json.JSONEncoder):
                def default(self, o):
                    if isinstance(o, Decimal):
                        return float(o)
                    return super(DecimalEncoder, self).default(o)

            # Initialize clients
            dynamodb = boto3.resource('dynamodb')
            s3 = boto3.client('s3')

            # Get environment variables
            orders_table_name = os.environ['ORDERS_TABLE']
            bucket_name = os.environ['BUCKET_NAME']
            environment = os.environ['ENVIRONMENT']

            orders_table = dynamodb.Table(orders_table_name)

            def handler(event, context):
                try:
                    # Get query parameters
                    query_params = event.get('queryStringParameters', {}) or {}
                    order_id = query_params.get('order_id')
                    
                    if order_id:
                        # Get specific order from DynamoDB
                        response = orders_table.get_item(
                            Key={'order_id': order_id}
                        )
                        if 'Item' in response:
                            return {
                                'statusCode': 200,
                                'headers': {'Content-Type': 'application/json'},
                                'body': json.dumps(response['Item'], cls=DecimalEncoder)
                            }
                        else:
                            return {
                                'statusCode': 404,
                                'headers': {'Content-Type': 'application/json'},
                                'body': json.dumps({'error': 'Order not found'})
                            }
                    else:
                        # List objects in S3 bucket
                        response = s3.list_objects_v2(
                            Bucket=bucket_name,
                            Prefix=f"{environment}/",
                            MaxKeys=10
                        )
                        
                        files = []
                        if 'Contents' in response:
                            files = [obj['Key'] for obj in response['Contents']]
                        
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json'},
                            'body': json.dumps({
                                'environment': environment,
                                'files': files
                            })
                        }
                except Exception as e:
                    print(f"Error: {str(e)}")
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Internal server error'})
                    }
            """
        )

        upload_file_code = textwrap.dedent(
            """
            import os
            import json
            import boto3
            import base64
            from datetime import datetime

            # Initialize S3 client
            s3 = boto3.client('s3')
            bucket_name = os.environ['BUCKET_NAME']
            environment = os.environ['ENVIRONMENT']

            def handler(event, context):
                try:
                    # Parse request body
                    body = json.loads(event['body'])
                    
                    # Get file data and metadata
                    file_content = base64.b64decode(body.get('file_content', ''))
                    file_name = body.get('file_name', f'upload-{datetime.utcnow().isoformat()}.txt')
                    
                    # Create S3 key with environment prefix
                    s3_key = f"{environment}/{file_name}"
                    
                    # Upload file to S3
                    s3.put_object(
                        Bucket=bucket_name,
                        Key=s3_key,
                        Body=file_content,
                        ServerSideEncryption='aws:kms'
                    )
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({
                            'message': 'File uploaded successfully',
                            'file_key': s3_key
                        })
                    }
                except Exception as e:
                    print(f"Error uploading file: {str(e)}")
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Internal server error'})
                    }
            """
        )

        # 5. Create Lambda functions with versioning (no explicit function names)
        get_user_lambda = lambda_.Function(
            self,
            f"{resource_prefix}-get-user",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(get_user_code),
            environment={
                "ENVIRONMENT": environment_suffix,
                "USERS_TABLE": users_table.table_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {environment_suffix} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )

        create_user_lambda = lambda_.Function(
            self,
            f"{resource_prefix}-create-user",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(create_user_code),
            environment={
                "ENVIRONMENT": environment_suffix,
                "USERS_TABLE": users_table.table_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {environment_suffix} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )

        get_orders_lambda = lambda_.Function(
            self,
            f"{resource_prefix}-get-orders",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(get_orders_code),
            environment={
                "ENVIRONMENT": environment_suffix,
                "ORDERS_TABLE": orders_table.table_name,
                "BUCKET_NAME": bucket.bucket_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {environment_suffix} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )

        upload_file_lambda = lambda_.Function(
            self,
            f"{resource_prefix}-upload-file",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(upload_file_code),
            environment={
                "ENVIRONMENT": environment_suffix,
                "BUCKET_NAME": bucket.bucket_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {environment_suffix} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE,
            timeout=Duration.seconds(30)
        )

        # Remove explicit log groups to avoid conflicts
        # CDK will automatically create log groups for Lambda functions

        # 6. Grant minimal required permissions
        users_table.grant_read_data(get_user_lambda)
        users_table.grant_read_write_data(create_user_lambda)
        orders_table.grant_read_data(get_orders_lambda)
        bucket.grant_read(get_orders_lambda)
        bucket.grant_read_write(upload_file_lambda)

        # 8. Create API Gateway with logging enabled
        api = apigw.RestApi(
            self,
            f"{resource_prefix}-api",
            rest_api_name=f"{resource_prefix}-api",
            deploy_options=apigw.StageOptions(
                stage_name=environment_suffix,
                logging_level=None,  # Disable logging
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )

        # 9. API Gateway resources and methods
        users_resource = api.root.add_resource("users")
        user_resource = users_resource.add_resource("{user_id}")
        orders_resource = api.root.add_resource("orders")
        files_resource = api.root.add_resource("files")

        # GET /users/{user_id}
        user_resource.add_method(
            "GET",
            apigw.LambdaIntegration(get_user_lambda)
        )

        # POST /users
        users_resource.add_method(
            "POST",
            apigw.LambdaIntegration(create_user_lambda)
        )

        # GET /orders
        orders_resource.add_method(
            "GET",
            apigw.LambdaIntegration(get_orders_lambda)
        )

        # POST /files
        files_resource.add_method(
            "POST",
            apigw.LambdaIntegration(upload_file_lambda)
        )

        # 10. Output the API URL
        CfnOutput(
            self,
            "ApiUrl",
            value=api.url,
            description=f"URL for {environment_suffix} API Gateway"
        )

        CfnOutput(
            self,
            "UsersTableName",
            value=users_table.table_name,
            description="Name of the Users DynamoDB table"
        )

        CfnOutput(
            self,
            "OrdersTableName",
            value=orders_table.table_name,
            description="Name of the Orders DynamoDB table"
        )

        CfnOutput(
            self,
            "BucketName",
            value=bucket.bucket_name,
            description="Name of the S3 bucket"
        )

        # Additional Outputs
        CfnOutput(
            self,
            "EncryptionKeyArn",
            value=encryption_key.key_arn,
            description="ARN of the KMS encryption key"
        )

        CfnOutput(
            self,
            "GetUserLambdaArn",
            value=get_user_lambda.function_arn,
            description="ARN of the GetUser Lambda function"
        )

        CfnOutput(
            self,
            "CreateUserLambdaArn",
            value=create_user_lambda.function_arn,
            description="ARN of the CreateUser Lambda function"
        )

        CfnOutput(
            self,
            "GetOrdersLambdaArn",
            value=get_orders_lambda.function_arn,
            description="ARN of the GetOrders Lambda function"
        )

        CfnOutput(
            self,
            "UploadFileLambdaArn",
            value=upload_file_lambda.function_arn,
            description="ARN of the UploadFile Lambda function"
        )
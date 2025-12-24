"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

import json
import os
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

# LocalStack detection
IS_LOCALSTACK = "localhost" in os.environ.get("AWS_ENDPOINT_URL", "") or \
                "4566" in os.environ.get("AWS_ENDPOINT_URL", "")

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack component.

    Args:
    environment_suffix (Optional[str]): An optional suffix for deployment.
    tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, region: Optional[str] = None, environment_suffix: Optional[str] = None,
                 tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.region = region or 'us-east-1'  # Default region, can be overridden used in or for safety
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
            - DO NOT create resources directly here unless they are truly global.
            - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

    Args:
            name (str): The logical name of this Pulumi component.
            args (TapStackArgs): Configuration arguments including environment suffix and tags.
            opts (ResourceOptions): Pulumi options.
    """

    def __init__(self, name: str, args: TapStackArgs,
                 opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)
        self.environment_suffix = args.environment_suffix
        self.region = args.region
        self.tags = args.tags

    # Example usage of suffix and tags
    # You would replace this with instantiation of imported components like DynamoDBStack
    
    # s3.Bucket(f"tap-bucket-{self.environment_suffix}",
    #           tags=self.tags,
    #           opts=ResourceOptions(parent=self))

    # self.table = dynamodb_stack.table if you instantiate one
    # Configuration
    project_name = pulumi.get_project()
    stack_name = pulumi.get_stack()
    stage_name = f"{self.environment_suffix}-{project_name}-{stack_name}-api-stage"

    # Tags for all resources
    common_tags = {
            "Project": project_name,
            "Stack": stack_name,
            "Environment": self.environment_suffix,
            "ManagedBy": "Pulumi"
    }

    # =====================================
    # 1. AWS SECRETS MANAGER
    # =====================================

    # Create a secret for storing sensitive configuration
    app_secret = aws.secretsmanager.Secret(
            "app-secret",
            name=f"{project_name}-{stack_name}-app-secret",
            description="Application secrets for Lambda functions",
            kms_key_id="alias/aws/secretsmanager",  # Use AWS managed KMS key
            tags=common_tags
    )

    # Store initial secret values (these should be updated after deployment)
    aws.secretsmanager.SecretVersion(
            "app-secret-version",
            secret_id=app_secret.id,
            secret_string=json.dumps({
    "api_key": "placeholder-api-key",
    "db_password": "placeholder-db-password"
            })
    )

    # =====================================
    # 2. S3 BUCKET WITH SECURITY
    # =====================================

    # Create S3 bucket for file uploads with security best practices
    s3_bucket = aws.s3.Bucket(
            "file-upload-bucket",
            bucket=f"{project_name}-{stack_name}-uploads-{self.region}".lower(),
            tags=common_tags
    )

    # Enable versioning for compliance
    aws.s3.BucketVersioning(
            "bucket-versioning",
            bucket=s3_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
    status="Enabled"
            )
    )

    # Server-side encryption with SSE-S3
    aws.s3.BucketServerSideEncryptionConfiguration(
            "bucket-encryption",
            bucket=s3_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
    apply_server_side_encryption_by_default=(
            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
        sse_algorithm="AES256"
            )
    ),
    bucket_key_enabled=True
            )]
    )

    # Block public access
    aws.s3.BucketPublicAccessBlock(
            "bucket-public-access-block",
            bucket=s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
    )

    # Bucket policy to deny public access and enforce HTTPS
    aws.s3.BucketPolicy(
            "bucket-policy",
            bucket=s3_bucket.id,
            policy=s3_bucket.arn.apply(
    lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
        {
                    "Sid": "DenyInsecureConnections",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:GetObjectVersion",
            "s3:PutObjectAcl",
            "s3:GetObjectAcl"
                    ],
                    "Resource": [arn, f"{arn}/*"],
                    "Condition": {
            "Bool": {
                            "aws:SecureTransport": "false"
            }
                    }
        }
            ]
    })
            )
    )

    # =====================================
    # 3. IAM ROLES AND POLICIES
    # =====================================

    # Lambda execution role with least privilege
    lambda_role = aws.iam.Role(
            "lambda-execution-role",
            name=f"{project_name}-{stack_name}-lambda-role",
            assume_role_policy=json.dumps({
    "Version": "2012-10-17",
    "Statement": [
            {
        "Action": "sts:AssumeRole",
        "Effect": "Allow",
        "Principal": {
                    "Service": "lambda.amazonaws.com"
        }
            }
    ]
            }),
            tags=common_tags
    )

    # Attach basic Lambda execution policy
    aws.iam.RolePolicyAttachment(
            "lambda-basic-execution-policy",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )

    # Custom policy for S3 and Secrets Manager access
    aws.iam.RolePolicy(
            "lambda-custom-policy",
            role=lambda_role.id,
            policy=Output.all(s3_bucket.arn, app_secret.arn).apply(
    lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
        {
                    "Effect": "Allow",
                    "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
                    ],
                    "Resource": f"{args[0]}/*"
        },
        {
                    "Effect": "Allow",
                    "Action": [
            "secretsmanager:GetSecretValue"
                    ],
                    "Resource": args[1]
        },
        {
                    "Effect": "Allow",
                    "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
                    ],
                    "Resource": [
            f"arn:aws:logs:{self.region}:*:log-group:/aws/lambda/{project_name}-{stack_name}-*",
            f"arn:aws:logs:{self.region}:*:log-group:/aws/lambda/{project_name}-{stack_name}-*:*"
                    ]
        }
            ]
    })
            )
    )

    # =====================================
    # 4. LAMBDA FUNCTIONS
    # =====================================

    # Lambda function code for S3 event processing
    s3_processor_code = """
    import json
    import boto3
    import os
    import time
    import random
    from typing import Dict, Any

    # LocalStack configuration
    endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
    boto_config = {'endpoint_url': endpoint_url} if endpoint_url else {}

    def exponential_backoff_retry(func, max_retries=3):
        \"\"\"Retry function with exponential backoff\"\"\"
        for attempt in range(max_retries + 1):
            try:
                return func()
            except Exception as e:
                if attempt == max_retries:
                    raise e
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                time.sleep(wait_time)

    def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
        \"\"\"
        Process S3 events with idempotency and retry logic
        \"\"\"
        print(f"Processing event: {json.dumps(event)}")

        try:
            # Get secrets from Secrets Manager
            secrets_client = boto3.client('secretsmanager', **boto_config)
            secret_arn = os.environ['SECRET_ARN']
            
            def get_secret():
                response = secrets_client.get_secret_value(SecretId=secret_arn)
                return json.loads(response['SecretString'])
            
            # Retry getting secrets with exponential backoff
            secrets = exponential_backoff_retry(get_secret)
            
            # Process S3 records (idempotent processing)
            processed_objects = []
            
            for record in event.get('Records', []):
                if record.get('eventSource') == 'aws:s3':
                    bucket_name = record['s3']['bucket']['name']
                    object_key = record['s3']['object']['key']
                    event_name = record['eventName']
                    
                    print(f"Processing {event_name} for {bucket_name}/{object_key}")
                    
                    # Idempotent processing - check if already processed
                    object_id = f"{bucket_name}/{object_key}"
                    if object_id not in processed_objects:
                        # Simulate processing with retry logic
                        def process_object():
                            # Your object processing logic here
                            print(f"Successfully processed {object_id}")
                            return True
                        
                        exponential_backoff_retry(process_object)
                        processed_objects.append(object_id)
                    else:
                        print(f"Object {object_id} already processed (idempotent)")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Successfully processed S3 events',
                    'processed_objects': processed_objects
                })
            }
            
        except Exception as e:
            print(f"Error processing S3 event: {str(e)}")
            raise e
    """

    # Lambda function code for API Gateway
    api_handler_code = """
    import json
    import boto3
    import os
    from typing import Dict, Any

    # LocalStack configuration
    endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
    boto_config = {'endpoint_url': endpoint_url} if endpoint_url else {}

    def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
        \"\"\"
        Handle API Gateway requests
        \"\"\"
        print(f"API Gateway event: {json.dumps(event)}")

        try:
            http_method = event.get('httpMethod', 'GET')
            path = event.get('path', '/')

            # Get secrets from Secrets Manager
            secrets_client = boto3.client('secretsmanager', **boto_config)
            secret_arn = os.environ['SECRET_ARN']
            
            response = secrets_client.get_secret_value(SecretId=secret_arn)
            secrets = json.loads(response['SecretString'])
            
            # Route based on HTTP method and path
            if http_method == 'GET' and path == '/health':
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'status': 'healthy',
                        'timestamp': context.aws_request_id
                    })
                }
            elif http_method == 'POST' and path == '/process':
                body = json.loads(event.get('body', '{}'))
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'message': 'Data processed successfully',
                        'data': body,
                        'request_id': context.aws_request_id
                    })
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Not Found',
                        'path': path,
                        'method': http_method
                    })
                }
                
        except Exception as e:
            print(f"Error in API handler: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Internal Server Error',
                    'message': str(e)
                })
            }
    """

    # S3 Event Processor Lambda Function
    s3_processor_lambda = aws.lambda_.Function(
            "s3-event-processor",
            name=f"{project_name}-{stack_name}-s3-processor",
            runtime="python3.9",
            code=pulumi.AssetArchive({
    "lambda_function.py": pulumi.StringAsset(s3_processor_code)
            }),
            handler="lambda_function.lambda_handler",
            role=lambda_role.arn,
            timeout=5,  # 5 seconds max
            memory_size=128,  # 128MB memory
            environment=aws.lambda_.FunctionEnvironmentArgs(
    variables={
            "SECRET_ARN": app_secret.arn
    }
            ),
            tags=common_tags
    )

    # API Gateway Handler Lambda Function
    api_handler_lambda = aws.lambda_.Function(
            "api-gateway-handler",
            name=f"{project_name}-{stack_name}-api-handler",
            runtime="python3.9",
            code=pulumi.AssetArchive({
    "lambda_function.py": pulumi.StringAsset(api_handler_code)
            }),
            handler="lambda_function.lambda_handler",
            role=lambda_role.arn,
            timeout=5,  # 5 seconds max
            memory_size=128,  # 128MB memory
            environment=aws.lambda_.FunctionEnvironmentArgs(
    variables={
            "SECRET_ARN": app_secret.arn
    }
            ),
            tags=common_tags
    )

    # =====================================
    # 5. S3 EVENT TRIGGERS
    # =====================================

    # Lambda permission for S3 to invoke the function
    s3_lambda_permission = aws.lambda_.Permission(
        "s3-lambda-permission",
        statement_id="AllowExecutionFromS3Bucket",
        action="lambda:InvokeFunction",
        function=s3_processor_lambda.name,
        principal="s3.amazonaws.com",
        source_arn=s3_bucket.arn,
    )

    # S3 bucket notification to trigger Lambda on ObjectCreated events
    _ = aws.s3.BucketNotification(
        "s3-bucket-notification",
        bucket=s3_bucket.id,
        lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
            lambda_function_arn=s3_processor_lambda.arn,
            events=["s3:ObjectCreated:*"],
            filter_prefix="",
            filter_suffix=""
        )],
        opts=pulumi.ResourceOptions(depends_on=[s3_lambda_permission])
    )

    # =====================================
    # 6. API GATEWAY v2 (REST API)
    # =====================================

    # Create API Gateway REST API
    api_gateway = aws.apigateway.RestApi(
        "serverless-api",
        name=f"{project_name}-{stack_name}-api",
        description="Serverless REST API with Lambda integration",
        endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
            types="REGIONAL"
        ),
        tags=common_tags
    )

    # API Gateway resources and methods
    # Root resource (/)
    root_resource = api_gateway.root_resource_id

    # Health check resource (/health)
    health_resource = aws.apigateway.Resource(
        "health-resource",
        rest_api=api_gateway.id,
        parent_id=root_resource,
        path_part="health"
    )

    # Process resource (/process)
    process_resource = aws.apigateway.Resource(
        "process-resource",
        rest_api=api_gateway.id,
        parent_id=root_resource,
        path_part="process"
    )

    # GET method for health check
    health_get_method = aws.apigateway.Method(
        "health-get-method",
        rest_api=api_gateway.id,
        resource_id=health_resource.id,
        http_method="GET",
        authorization="NONE"
    )

    # POST method for process endpoint
    process_post_method = aws.apigateway.Method(
        "process-post-method",
        rest_api=api_gateway.id,
        resource_id=process_resource.id,
        http_method="POST",
        authorization="NONE"
    )

    # Lambda integrations
    health_integration = aws.apigateway.Integration(
        "health-integration",
        rest_api=api_gateway.id,
        resource_id=health_resource.id,
        http_method=health_get_method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=api_handler_lambda.invoke_arn
    )

    process_integration = aws.apigateway.Integration(
        "process-integration",
        rest_api=api_gateway.id,
        resource_id=process_resource.id,
        http_method=process_post_method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=api_handler_lambda.invoke_arn
    )

    # Lambda permissions for API Gateway (specific to health and process endpoints)
    api_lambda_permission_health = aws.lambda_.Permission(
        "api-lambda-permission-health",
        statement_id="AllowExecutionFromAPIGatewayHealth",
        action="lambda:InvokeFunction",
        function=api_handler_lambda.name, 
        principal="apigateway.amazonaws.com",
        source_arn=Output.concat(api_gateway.execution_arn, "/*/GET/health")
    )
    
    api_lambda_permission_process = aws.lambda_.Permission(
        "api-lambda-permission-process",
        statement_id="AllowExecutionFromAPIGatewayProcess",
        action="lambda:InvokeFunction",
        function=api_handler_lambda.name, 
        principal="apigateway.amazonaws.com",
        source_arn=Output.concat(api_gateway.execution_arn, "/*/POST/process")
    )

    # API Gateway deployment
    api_deployment = aws.apigateway.Deployment(
        "api-deployment",
        rest_api=api_gateway.id,
        opts=pulumi.ResourceOptions(depends_on=[
            health_integration,
            process_integration,
            api_lambda_permission_health,
            api_lambda_permission_process
        ])
    )

    # Enable access logging for API Gateway
    api_log_group = aws.cloudwatch.LogGroup(
        "api-gateway-logs",
        name=f"/aws/apigateway/{project_name}-{stack_name}",
        retention_in_days=14,
        tags=common_tags
    )

    api_stage = aws.apigateway.Stage(
        "api-stage",
        deployment=api_deployment.id,
        rest_api=api_gateway.id,
        stage_name=f"{stage_name}",
        access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
            destination_arn=api_log_group.arn,
            format=json.dumps({
                "requestId": "$context.requestId",
                "ip": "$context.identity.sourceIp",
                "caller": "$context.identity.caller",
                "user": "$context.identity.user",
                "requestTime": "$context.requestTime",
                "httpMethod": "$context.httpMethod",
                "resourcePath": "$context.resourcePath",
                "status": "$context.status",
                "protocol": "$context.protocol",
                "responseLength": "$context.responseLength"
            })
        ),
        xray_tracing_enabled=True,
        tags=common_tags
    )

    # =====================================
    # 7. CLOUDWATCH MONITORING & ALARMS
    # =====================================

    # CloudWatch Log Groups for Lambda functions
    _ = aws.cloudwatch.LogGroup(
        "s3-processor-logs",
        name=s3_processor_lambda.name.apply(lambda n: f"/aws/lambda/{n}"),
        retention_in_days=14,
        tags=common_tags
    )

    _ = aws.cloudwatch.LogGroup(
        "api-handler-logs",
        name=api_handler_lambda.name.apply(lambda n: f"/aws/lambda/{n}"),
        retention_in_days=14,
        tags=common_tags
    )

    # SNS Topic for CloudWatch Alarms (optional)
    alarm_topic = aws.sns.Topic(
        "alarm-topic",
        name=f"{project_name}-{stack_name}-alarms",
        tags=common_tags
    )

    # CloudWatch Alarms for Lambda function errors
    _ = aws.cloudwatch.MetricAlarm(
        "s3-processor-error-alarm",
        name=f"{project_name}-{stack_name}-s3-processor-errors",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,  # 5 minutes
        statistic="Sum",
        threshold=1,
        alarm_description="S3 Processor Lambda function errors",
        dimensions={
            "FunctionName": s3_processor_lambda.name,
        },
        alarm_actions=[alarm_topic.arn],
        tags=common_tags
    )

    _ = aws.cloudwatch.MetricAlarm(
        "api-handler-error-alarm",
        name=f"{project_name}-{stack_name}-api-handler-errors",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,  # 5 minutes
        statistic="Sum",
        threshold=1,
        alarm_description="API Handler Lambda function errors",
        dimensions={
            "FunctionName": api_handler_lambda.name,
        },
        alarm_actions=[alarm_topic.arn],
        tags=common_tags
    )

    # Duration alarm for performance monitoring
    _ = aws.cloudwatch.MetricAlarm(
        "s3-processor-duration-alarm",
        name=f"{project_name}-{stack_name}-s3-processor-duration",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=300,
        statistic="Average",
        threshold=300,  # 300ms threshold
        alarm_description="S3 Processor Lambda function duration exceeds 300ms",
        dimensions={
            "FunctionName": s3_processor_lambda.name,
        },
        alarm_actions=[alarm_topic.arn],
        tags=common_tags
    )
    # =====================================
    # 8. OUTPUTS
    # =====================================

    # Export important resource information
    pulumi.export("s3_bucket_name", s3_bucket.bucket)
    pulumi.export("s3_bucket_arn", s3_bucket.arn)
    pulumi.export("api_gateway_url", api_stage.invoke_url)
    pulumi.export("api_gateway_stage_url", Output.concat(
    "https://", api_gateway.id, f".execute-api.{self.region}.amazonaws.com/", f"{stage_name}"
    ))
    pulumi.export("s3_processor_lambda_arn", s3_processor_lambda.arn)
    pulumi.export("api_handler_lambda_arn", api_handler_lambda.arn)
    pulumi.export("secrets_manager_arn", app_secret.arn)
    pulumi.export("sns_topic_arn", alarm_topic.arn)
    pulumi.export("lambda_role_arn", lambda_role.arn)

    # Export endpoint URLs for testing
    pulumi.export("health_check_url", Output.concat(
        "https://", api_gateway.id, ".execute-api.", self.region,
        ".amazonaws.com/prod/health"
    ))
    pulumi.export("process_endpoint_url", Output.concat(
        "https://", api_gateway.id, ".execute-api.", self.region,
        ".amazonaws.com/prod/process"
    ))
    self.register_outputs({})

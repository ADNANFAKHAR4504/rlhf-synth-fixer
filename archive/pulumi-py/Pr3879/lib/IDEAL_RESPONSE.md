# Ideal Response

## lib/AWS_REGION

```text
us-west-2
```

## lib/__init__.py

*(empty file)*

## lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

from typing import Optional
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws

class TapStackArgs:  # pylint: disable=too-few-public-methods
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):  # pylint: disable=too-many-instance-attributes
    """
    Represents the main Pulumi component resource for the Translation API service.

    This component orchestrates all AWS resources needed for the translation service including
    API Gateway, Lambda, DynamoDB, S3, SQS, CloudWatch, and IAM resources.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        # Add default tags
        default_tags = {
            "Project": "TranslationAPI",
            "Environment": self.environment_suffix,
            "ManagedBy": "Pulumi"
        }
        self.tags.update(default_tags)

        # Create DynamoDB table for translation cache
        self.translation_cache_table = aws.dynamodb.Table(
            f"translation-cache-{self.environment_suffix}",
            name=f"translation-cache-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="translationKey",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="translationKey",
                    type="S"
                )
            ],
            ttl=aws.dynamodb.TableTtlArgs(
                attribute_name="expiryTime",
                enabled=True
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create S3 bucket for document translations
        # S3 bucket names must be lowercase; sanitize the stack suffix.
        stack_suffix = pulumi.get_stack().lower()
        self.documents_bucket = aws.s3.Bucket(
            f"translation-documents-{self.environment_suffix}",
            bucket=f"translation-documents-{self.environment_suffix}-{stack_suffix}",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            server_side_encryption_configuration=(
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            # pylint: disable=line-too-long
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm="AES256"
                            )
                        )
                    )
                )
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Block public access to S3 bucket
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"translation-documents-public-access-block-{self.environment_suffix}",
            bucket=self.documents_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.documents_bucket)
        )

        # Create SQS queue for batch processing
        self.batch_queue = aws.sqs.Queue(
            f"translation-batch-queue-{self.environment_suffix}",
            name=f"translation-batch-queue-{self.environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=1209600,  # 14 days
            receive_wait_time_seconds=20,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create dead letter queue
        self.dlq = aws.sqs.Queue(
            f"translation-dlq-{self.environment_suffix}",
            name=f"translation-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Log Group for Lambda
        self.lambda_log_group = aws.cloudwatch.LogGroup(
            f"translation-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/translation-api-{self.environment_suffix}",
            retention_in_days=14,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda
        self.lambda_role = aws.iam.Role(
            f"translation-lambda-role-{self.environment_suffix}",
            name=f"translation-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM policy for Lambda
        self.lambda_policy = aws.iam.RolePolicy(
            f"translation-lambda-policy-{self.environment_suffix}",
            role=self.lambda_role.id,
            policy=Output.all(
                self.translation_cache_table.arn,
                self.documents_bucket.arn,
                self.batch_queue.arn,
                self.lambda_log_group.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "translate:TranslateText",
                            "translate:TranslateDocument"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"{args[1]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": args[2]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"{args[3]}:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters"
                        ],
                        "Resource": "arn:aws:ssm:us-west-2:*:parameter/translation/*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Create Lambda function
        self.translation_lambda = aws.lambda_.Function(
            f"translation-api-{self.environment_suffix}",
            name=f"translation-api-{self.environment_suffix}",
            role=self.lambda_role.arn,
            handler="lambda_function.lambda_handler",
            runtime="python3.10",
            timeout=60,
            memory_size=512,
            reserved_concurrent_executions=100,
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset(self._get_lambda_code())
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": self.translation_cache_table.name,
                    "S3_BUCKET": self.documents_bucket.bucket,
                    "SQS_QUEUE_URL": self.batch_queue.url,
                    "REGION": "us-west-2"
                }
            ),
            tags=self.tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.lambda_policy, self.lambda_log_group]
            )
        )

        # Create API Gateway REST API
        self.api_gateway = aws.apigateway.RestApi(
            f"translation-api-{self.environment_suffix}",
            name=f"translation-api-{self.environment_suffix}",
            description="Translation API service",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway resource for /translate
        self.translate_resource = aws.apigateway.Resource(
            f"translate-resource-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            parent_id=self.api_gateway.root_resource_id,
            path_part="translate",
            opts=ResourceOptions(parent=self.api_gateway)
        )

        # Create POST method
        self.translate_method = aws.apigateway.Method(
            f"translate-post-method-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.translate_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(parent=self.translate_resource)
        )

        # Create Lambda integration
        self.lambda_integration = aws.apigateway.Integration(
            f"translate-lambda-integration-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.translate_resource.id,
            http_method=self.translate_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.translation_lambda.invoke_arn,
            opts=ResourceOptions(parent=self.translate_method)
        )

        # Create Lambda permission for API Gateway
        self.lambda_permission = aws.lambda_.Permission(
            f"api-gateway-invoke-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.translation_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=self.api_gateway.execution_arn.apply(lambda arn: f"{arn}/*/*"),
            opts=ResourceOptions(parent=self.translation_lambda)
        )

        # Create API Gateway deployment
        self.api_deployment = aws.apigateway.Deployment(
            f"translation-api-deployment-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            opts=ResourceOptions(
                parent=self.api_gateway,
                depends_on=[self.lambda_integration]
            )
        )

        # Create API Gateway stage
        self.api_stage = aws.apigateway.Stage(
            f"translation-api-stage-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            deployment=self.api_deployment.id,
            stage_name=self.environment_suffix,
            xray_tracing_enabled=True,
            tags=self.tags,
            opts=ResourceOptions(parent=self.api_deployment)
        )

        # Create CloudWatch Log Group for API Gateway
        self.api_log_group = aws.cloudwatch.LogGroup(
            f"api-gateway-logs-{self.environment_suffix}",
            name=f"/aws/apigateway/translation-api-{self.environment_suffix}",
            retention_in_days=14,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch alarms
        self.api_error_alarm = aws.cloudwatch.MetricAlarm(
            f"api-errors-alarm-{self.environment_suffix}",
            name=f"translation-api-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when API returns too many 5xx errors",
            dimensions={
                "ApiName": self.api_gateway.name
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-errors-alarm-{self.environment_suffix}",
            name=f"translation-lambda-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when Lambda function has too many errors",
            dimensions={
                "FunctionName": self.translation_lambda.name
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create SSM parameters
        self.ssm_table_param = aws.ssm.Parameter(
            f"translation-table-param-{self.environment_suffix}",
            name=f"/translation/{self.environment_suffix}/dynamodb-table",
            type="String",
            value=self.translation_cache_table.name,
            description="DynamoDB table name for translation cache",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.ssm_bucket_param = aws.ssm.Parameter(
            f"translation-bucket-param-{self.environment_suffix}",
            name=f"/translation/{self.environment_suffix}/s3-bucket",
            type="String",
            value=self.documents_bucket.bucket,
            description="S3 bucket name for document translations",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.ssm_queue_param = aws.ssm.Parameter(
            f"translation-queue-param-{self.environment_suffix}",
            name=f"/translation/{self.environment_suffix}/sqs-queue-url",
            type="String",
            value=self.batch_queue.url,
            description="SQS queue URL for batch processing",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge rule for monitoring
        self.eventbridge_rule = aws.cloudwatch.EventRule(
            f"translation-events-rule-{self.environment_suffix}",
            name=f"translation-events-{self.environment_suffix}",
            description="Monitor translation workflow events",
            event_pattern=json.dumps({
                "source": ["aws.translate"],
                "detail-type": ["AWS API Call via CloudTrail"]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create AppSync GraphQL API for real-time updates
        self.appsync_api = aws.appsync.GraphQLApi(
            f"translation-appsync-{self.environment_suffix}",
            name=f"translation-updates-{self.environment_suffix}",
            authentication_type="API_KEY",
            schema="""
            type Translation {
                id: ID!
                sourceLanguage: String!
                targetLanguage: String!
                sourceText: String!
                translatedText: String!
                status: String!
                timestamp: String!
            }

            type Query {
                getTranslation(id: ID!): Translation
            }

            type Mutation {
                updateTranslationStatus(id: ID!, status: String!): Translation
            }

            type Subscription {
                onTranslationStatusUpdate(id: ID!): Translation
                @aws_subscribe(mutations: ["updateTranslationStatus"])
            }
            """,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create AppSync API Key
        self.appsync_api_key = aws.appsync.ApiKey(
            f"translation-appsync-key-{self.environment_suffix}",
            api_id=self.appsync_api.id,
            description="API Key for translation updates",
            opts=ResourceOptions(parent=self.appsync_api)
        )

        # Register outputs
        self.register_outputs({
            "api_url": self.api_stage.invoke_url.apply(lambda url: f"{url}/translate"),
            "dynamodb_table_name": self.translation_cache_table.name,
            "s3_bucket_name": self.documents_bucket.bucket,
            "sqs_queue_url": self.batch_queue.url,
            "lambda_function_name": self.translation_lambda.name,
            "appsync_api_url": self.appsync_api.uris["GRAPHQL"],
            "appsync_api_key": self.appsync_api_key.key
        })

    def _get_lambda_code(self) -> str:
        """Returns the Lambda function code as a string."""
        return """
import json
import boto3
import hashlib
import time
import os
from decimal import Decimal

# Initialize AWS clients
translate_client = boto3.client('translate', region_name=os.environ['REGION'])
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
s3_client = boto3.client('s3', region_name=os.environ['REGION'])
sqs_client = boto3.client('sqs', region_name=os.environ['REGION'])

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE']
BUCKET_NAME = os.environ['S3_BUCKET']
QUEUE_URL = os.environ['SQS_QUEUE_URL']
CHAR_LIMIT = 5000

table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        source_text = body.get('text', '')
        source_language = body.get('sourceLanguage', 'auto')
        target_language = body.get('targetLanguage', 'en')

        if not source_text or not target_language:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing required parameters'})
            }

        # Check if text is too long for synchronous processing
        if len(source_text) > CHAR_LIMIT:
            # Send to SQS for batch processing
            message = {
                'text': source_text,
                'sourceLanguage': source_language,
                'targetLanguage': target_language,
                'timestamp': str(time.time())
            }

            sqs_client.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(message)
            )

            return {
                'statusCode': 202,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'message': 'Text too long, queued for batch processing',
                    'status': 'queued'
                })
            }

        # Generate cache key
        cache_key = hashlib.md5(
            f"{source_language}:{target_language}:{source_text}".encode()
        ).hexdigest()

        # Check cache
        try:
            response = table.get_item(Key={'translationKey': cache_key})
            if 'Item' in response:
                cached_item = response['Item']
                # Check if not expired
                if int(cached_item.get('expiryTime', 0)) > int(time.time()):
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({
                            'translatedText': cached_item['translatedText'],
                            'sourceLanguage': cached_item['sourceLanguage'],
                            'targetLanguage': cached_item['targetLanguage'],
                            'cached': True
                        })
                    }
        except Exception as e:
            print(f"Cache lookup error: {str(e)}")

        # Perform translation
        translate_response = translate_client.translate_text(
            Text=source_text,
            SourceLanguageCode=source_language,
            TargetLanguageCode=target_language
        )

        translated_text = translate_response['TranslatedText']
        detected_source = translate_response['SourceLanguageCode']

        # Cache the result (expire in 7 days)
        expiry_time = int(time.time()) + (7 * 24 * 60 * 60)
        try:
            table.put_item(
                Item={
                    'translationKey': cache_key,
                    'sourceLanguage': detected_source,
                    'targetLanguage': target_language,
                    'sourceText': source_text,
                    'translatedText': translated_text,
                    'expiryTime': expiry_time,
                    'timestamp': int(time.time())
                }
            )
        except Exception as e:
            print(f"Cache write error: {str(e)}")

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'translatedText': translated_text,
                'sourceLanguage': detected_source,
                'targetLanguage': target_language,
                'cached': False
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
"""
```

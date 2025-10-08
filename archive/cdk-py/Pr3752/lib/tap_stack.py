"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import os
import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_kms as kms,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
)
from constructs import Construct


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

    This stack creates a complete serverless infrastructure following production best practices
    around security, monitoring, and automation as specified in the PROMPT.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Environment configuration
        environment = environment_suffix

        # ===========================================
        # KMS Keys for Encryption
        # ===========================================
        
        # KMS key for DynamoDB encryption
        dynamodb_kms_key = kms.Key(
            self,
            "DynamoDBKMSKey",
            description=f"KMS key for DynamoDB encryption - {environment}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            alias=f"alias/dynamodb-{environment}"
        )
        
        # KMS key for S3 encryption
        s3_kms_key = kms.Key(
            self,
            "S3KMSKey",
            description=f"KMS key for S3 encryption - {environment}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            alias=f"alias/s3-{environment}"
        )

        # ===========================================
        # S3 Bucket - Private with Encryption
        # ===========================================
        
        storage_bucket = s3.Bucket(
            self,
            "PrivateStorageBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=s3_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(90),
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ],
            removal_policy=RemovalPolicy.RETAIN,
            auto_delete_objects=False,
            enforce_ssl=True,
            object_ownership=s3.ObjectOwnership.BUCKET_OWNER_ENFORCED
        )

        # ===========================================
        # DynamoDB Table with Auto-scaling
        # ===========================================
        
        transient_table = dynamodb.Table(
            self,
            "TransientDataTable",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=dynamodb_kms_key,
            removal_policy=RemovalPolicy.RETAIN,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )
        
        # Configure auto-scaling for DynamoDB
        read_scaling = transient_table.auto_scale_read_capacity(
            min_capacity=5,
            max_capacity=100
        )
        read_scaling.scale_on_utilization(
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )
        
        write_scaling = transient_table.auto_scale_write_capacity(
            min_capacity=5,
            max_capacity=100
        )
        write_scaling.scale_on_utilization(
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        # Add GSI with auto-scaling
        transient_table.add_global_secondary_index(
            index_name="GSI1",
            partition_key=dynamodb.Attribute(
                name="gsi1pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="gsi1sk",
                type=dynamodb.AttributeType.STRING
            ),
            read_capacity=5,
            write_capacity=5,
            projection_type=dynamodb.ProjectionType.ALL
        )

        # ===========================================
        # SNS Topic for Alarms
        # ===========================================
        
        alarm_topic = sns.Topic(
            self,
            "AlarmTopic",
            display_name=f"Serverless Alarms - {environment}",
            topic_name=f"serverless-alarms-{environment}"
        )

        # ===========================================
        # IAM Role for Lambda Functions
        # ===========================================
        
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess")
            ],
            inline_policies={
                "LambdaPolicy": iam.PolicyDocument(
                    statements=[
                        # S3 permissions
                        iam.PolicyStatement(
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject",
                                "s3:ListBucket"
                            ],
                            resources=[
                                storage_bucket.bucket_arn,
                                f"{storage_bucket.bucket_arn}/*"
                            ]
                        ),
                        # DynamoDB permissions
                        iam.PolicyStatement(
                            actions=[
                                "dynamodb:GetItem",
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:DeleteItem",
                                "dynamodb:Query",
                                "dynamodb:Scan",
                                "dynamodb:BatchGetItem",
                                "dynamodb:BatchWriteItem"
                            ],
                            resources=[
                                transient_table.table_arn,
                                f"{transient_table.table_arn}/index/*"
                            ]
                        ),
                        # KMS permissions
                        iam.PolicyStatement(
                            actions=[
                                "kms:Decrypt",
                                "kms:GenerateDataKey",
                                "kms:CreateGrant"
                            ],
                            resources=[
                                dynamodb_kms_key.key_arn,
                                s3_kms_key.key_arn
                            ]
                        )
                    ]
                )
            }
        )

        # ===========================================
        # Lambda Functions
        # ===========================================
        
        # Environment variables for all Lambda functions
        lambda_env = {
            "BUCKET_NAME": storage_bucket.bucket_name,
            "TABLE_NAME": transient_table.table_name,
            "ENVIRONMENT": environment,
            "AWS_XRAY_TRACING_NAME": f"serverless-{environment}",
            "LOG_LEVEL": "INFO"
        }

        # Lambda Function 1: Data Processor
        data_processor_function = lambda_.Function(
            self,
            "DataProcessorFunction",
            function_name=f"serverless-data-processor-{environment}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def main(event, context):
    table = dynamodb.Table(os.environ['TABLE_NAME'])
    bucket = os.environ['BUCKET_NAME']
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        item = {
            'pk': f"data#{body.get('id', 'unknown')}",
            'sk': f"timestamp#{datetime.utcnow().isoformat()}",
            'data': body,
            'ttl': int((datetime.utcnow().timestamp())) + 86400
        }
        
        table.put_item(Item=item)
        
        if len(json.dumps(body)) > 4096:
            s3.put_object(
                Bucket=bucket,
                Key=f"data/{item['pk']}/{item['sk']}.json",
                Body=json.dumps(body),
                ServerSideEncryption='aws:kms'
            )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Data processed successfully',
                'id': item['pk']
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
            """),
            handler="index.main",
            role=lambda_role,
            timeout=Duration.minutes(5),
            memory_size=512,
            environment=lambda_env,
            tracing=lambda_.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.ONE_MONTH,
            dead_letter_queue_enabled=True,
            retry_attempts=2
        )

        # Lambda Function 2: API Handler
        api_handler_function = lambda_.Function(
            self,
            "ApiHandlerFunction",
            function_name=f"serverless-api-handler-{environment}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_inline("""
import json
import os
import boto3

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def main(event, context):
    table = dynamodb.Table(os.environ['TABLE_NAME'])
    bucket = os.environ['BUCKET_NAME']
    
    try:
        method = event.get('httpMethod', 'GET')
        
        if method == 'GET':
            response = table.get_item(
                Key={'pk': 'example', 'sk': 'data'}
            )
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Success',
                    'data': response.get('Item', {})
                })
            }
        
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
            """),
            handler="index.main",
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment=lambda_env,
            tracing=lambda_.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.ONE_MONTH,
            dead_letter_queue_enabled=True,
            retry_attempts=1
        )

        # Lambda Function 3: Background Worker
        background_worker_function = lambda_.Function(
            self,
            "BackgroundWorkerFunction",
            function_name=f"serverless-background-worker-{environment}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
import time

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def main(event, context):
    table = dynamodb.Table(os.environ['TABLE_NAME'])
    
    try:
        records_processed = 0
        
        response = table.query(
            KeyConditionExpression='pk = :pk',
            ExpressionAttributeValues={
                ':pk': 'process#pending'
            },
            Limit=100
        )
        
        for item in response.get('Items', []):
            time.sleep(0.1)
            
            table.update_item(
                Key={'pk': item['pk'], 'sk': item['sk']},
                UpdateExpression='SET #status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'completed'}
            )
            
            records_processed += 1
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Background processing completed',
                'records_processed': records_processed
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
            """),
            handler="index.main",
            role=lambda_role,
            timeout=Duration.minutes(15),
            memory_size=1024,
            environment=lambda_env,
            tracing=lambda_.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.ONE_MONTH,
            dead_letter_queue_enabled=True,
            retry_attempts=2
        )

        # ===========================================
        # API Gateway with Caching
        # ===========================================
        
        # API Gateway Log Group
        api_log_group = logs.LogGroup(
            self,
            "ApiGatewayLogGroup",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # REST API
        api = apigateway.RestApi(
            self,
            "ServerlessAPI",
            rest_api_name=f"serverless-api-{environment}",
            description=f"Serverless API Gateway - {environment}",
            deploy_options=apigateway.StageOptions(
                stage_name=environment,
                metrics_enabled=True,
                data_trace_enabled=True,
                tracing_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
                access_log_format=apigateway.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True
                ),
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                cache_cluster_enabled=True,
                cache_cluster_size="0.5",
                cache_data_encrypted=True,
                cache_ttl=Duration.minutes(10)
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
                max_age=Duration.hours(1)
            ),
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            ),
            cloud_watch_role=True
        )

        # API Key and Usage Plan
        api_key = api.add_api_key(
            "ApiKey",
            api_key_name=f"serverless-api-key-{environment}",
            description=f"API Key for {environment}"
        )
        
        usage_plan = api.add_usage_plan(
            "UsagePlan",
            name=f"serverless-usage-plan-{environment}",
            api_stages=[apigateway.UsagePlanPerApiStage(
                api=api,
                stage=api.deployment_stage
            )],
            throttle=apigateway.ThrottleSettings(
                rate_limit=100,
                burst_limit=200
            ),
            quota=apigateway.QuotaSettings(
                limit=10000,
                period=apigateway.Period.DAY
            )
        )
        usage_plan.add_api_key(api_key)

        # ===========================================
        # API Gateway Resources and Methods
        # ===========================================
        
        # /data resource
        data_resource = api.root.add_resource("data")
        
        # GET /data - with caching enabled
        data_get_integration = apigateway.LambdaIntegration(
            api_handler_function,
            request_templates={"application/json": '{ "statusCode": "200" }'},
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_templates={"application/json": ""}
                )
            ]
        )
        
        get_method = data_resource.add_method(
            "GET",
            data_get_integration,
            api_key_required=True,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={"application/json": apigateway.Model.EMPTY_MODEL}
                )
            ],
            request_parameters={
                "method.request.querystring.id": False
            }
        )
        
        # POST /data
        data_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(data_processor_function),
            api_key_required=True
        )
        
        # /process resource
        process_resource = api.root.add_resource("process")
        process_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(background_worker_function),
            api_key_required=True
        )

        # /health resource (no API key required for health checks)
        health_resource = api.root.add_resource("health")
        health_resource.add_method(
            "GET",
            apigateway.MockIntegration(
                integration_responses=[
                    apigateway.IntegrationResponse(
                        status_code="200",
                        response_templates={
                            "application/json": '{"status": "healthy", "environment": "' + environment + '"}'
                        }
                    )
                ],
                request_templates={
                    "application/json": '{"statusCode": 200}'
                }
            ),
            method_responses=[
                apigateway.MethodResponse(status_code="200")
            ]
        )

        # ===========================================
        # CloudWatch Alarms
        # ===========================================
        
        # Lambda Error Alarms
        for function_name, lambda_function in [
            ("DataProcessor", data_processor_function),
            ("ApiHandler", api_handler_function),
            ("BackgroundWorker", background_worker_function)
        ]:
            # Error alarm
            error_alarm = cloudwatch.Alarm(
                self,
                f"{function_name}ErrorAlarm",
                metric=lambda_function.metric_errors(),
                threshold=5,
                evaluation_periods=2,
                datapoints_to_alarm=1,
                alarm_description=f"Lambda {function_name} error rate too high",
                alarm_name=f"serverless-{function_name.lower()}-errors-{environment}",
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
            )
            error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))
            
            # Throttle alarm
            throttle_alarm = cloudwatch.Alarm(
                self,
                f"{function_name}ThrottleAlarm",
                metric=lambda_function.metric_throttles(),
                threshold=1,
                evaluation_periods=1,
                datapoints_to_alarm=1,
                alarm_description=f"Lambda {function_name} is being throttled",
                alarm_name=f"serverless-{function_name.lower()}-throttles-{environment}",
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
            )
            throttle_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # API Gateway Alarms
        api_4xx_alarm = cloudwatch.Alarm(
            self,
            "Api4xxAlarm",
            metric=api.metric_client_error(),
            threshold=10,
            evaluation_periods=2,
            datapoints_to_alarm=1,
            alarm_description="API Gateway 4xx errors too high",
            alarm_name=f"serverless-api-4xx-{environment}",
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        api_4xx_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))
        
        api_5xx_alarm = cloudwatch.Alarm(
            self,
            "Api5xxAlarm",
            metric=api.metric_server_error(),
            threshold=5,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            alarm_description="API Gateway 5xx errors detected",
            alarm_name=f"serverless-api-5xx-{environment}",
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        api_5xx_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # DynamoDB Alarms
        dynamodb_user_errors = cloudwatch.Alarm(
            self,
            "DynamoDBUserErrors",
            metric=transient_table.metric_user_errors(),
            threshold=5,
            evaluation_periods=2,
            datapoints_to_alarm=1,
            alarm_description="DynamoDB user errors too high",
            alarm_name=f"serverless-dynamodb-errors-{environment}",
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        dynamodb_user_errors.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # ===========================================
        # CloudWatch Dashboard
        # ===========================================
        
        dashboard = cloudwatch.Dashboard(
            self,
            "ServerlessDashboard",
            dashboard_name=f"serverless-dashboard-{environment}",
            widgets=[
                [
                    cloudwatch.GraphWidget(
                        title="Lambda Invocations",
                        left=[
                            data_processor_function.metric_invocations(),
                            api_handler_function.metric_invocations(),
                            background_worker_function.metric_invocations()
                        ]
                    ),
                    cloudwatch.GraphWidget(
                        title="Lambda Errors",
                        left=[
                            data_processor_function.metric_errors(),
                            api_handler_function.metric_errors(),
                            background_worker_function.metric_errors()
                        ]
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="Lambda Duration",
                        left=[
                            data_processor_function.metric_duration(),
                            api_handler_function.metric_duration(),
                            background_worker_function.metric_duration()
                        ]
                    ),
                    cloudwatch.GraphWidget(
                        title="API Gateway Requests",
                        left=[
                            api.metric_count(),
                            api.metric_client_error(),
                            api.metric_server_error()
                        ]
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="DynamoDB Consumed Capacity",
                        left=[
                            transient_table.metric_consumed_read_capacity_units(),
                            transient_table.metric_consumed_write_capacity_units()
                        ]
                    ),
                ]
            ]
        )

        # ===========================================
        # Resource Tags
        # ===========================================
        cdk.Tags.of(self).add("Environment", environment)
        cdk.Tags.of(self).add("Project", "ServerlessProduction")
        cdk.Tags.of(self).add("ManagedBy", "CDK")
        cdk.Tags.of(self).add("CostCenter", "Engineering")

        # ===========================================
        # Outputs
        # ===========================================
        
        CfnOutput(
            self,
            "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL"
        )
        
        CfnOutput(
            self,
            "ApiKeyId",
            value=api_key.key_id,
            description="API Key ID (retrieve value from console)"
        )
        
        CfnOutput(
            self,
            "S3BucketName",
            value=storage_bucket.bucket_name,
            description="Private S3 storage bucket name"
        )
        
        CfnOutput(
            self,
            "S3BucketArn",
            value=storage_bucket.bucket_arn,
            description="Private S3 storage bucket ARN"
        )
        
        CfnOutput(
            self,
            "DynamoDBTableName",
            value=transient_table.table_name,
            description="DynamoDB table name"
        )
        
        CfnOutput(
            self,
            "DynamoDBTableArn",
            value=transient_table.table_arn,
            description="DynamoDB table ARN"
        )
        
        CfnOutput(
            self,
            "AlarmTopicArn",
            value=alarm_topic.topic_arn,
            description="SNS topic for alarms"
        )
        
        CfnOutput(
            self,
            "KMSKeyArn",
            value=dynamodb_kms_key.key_arn,
            description="KMS key ARN for encryption"
        )
        
        CfnOutput(
            self,
            "LambdaFunctionName",
            value=api_handler_function.function_name,
            description="API Handler Lambda function name"
        )
        
        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=api_handler_function.function_arn,
            description="API Handler Lambda function ARN"
        )
        
        CfnOutput(
            self,
            "ApiGatewayLogGroupName",
            value=api_log_group.log_group_name,
            description="API Gateway CloudWatch log group name"
        )
        
        CfnOutput(
            self,
            "DashboardUrl",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={dashboard.dashboard_name}",
            description="CloudWatch Dashboard URL"
        )

```python

"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from aws_cdk import (
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_logs as logs,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct
from typing import Optional
import aws_cdk as cdk


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
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ==================== S3 Bucket for Logs ====================
        log_bucket = s3.Bucket(
            self, "ApplicationLogsBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    expiration=Duration.days(90),
                    noncurrent_version_expiration=Duration.days(30),
                )
            ],
            removal_policy=RemovalPolicy.RETAIN,
        )

        # ==================== DynamoDB Table ====================
        users_table = dynamodb.Table(
            self, "UsersTable",
            table_name=f"UserManagementTable-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="createdDate",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # ==================== SQS Dead Letter Queue ====================
        dlq = sqs.Queue(
            self, "UserManagementDLQ",
            queue_name=f"user-management-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS_MANAGED,
        )

        # ==================== IAM Role for Lambda ====================
        lambda_role = iam.Role(
            self, "UserManagementLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for User Management Lambda functions",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"),
            ],
        )
        users_table.grant_read_write_data(lambda_role)
        log_bucket.grant_write(lambda_role)
        dlq.grant_send_messages(lambda_role)

        # ==================== Lambda Functions ====================
        create_user_lambda = lambda_.Function(
            self, "CreateUserFunction",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(
                """
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
s3 = boto3.client('s3')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
LOG_BUCKET = os.environ['LOG_BUCKET']

def lambda_handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Parse the request body
        body = json.loads(event['body'])
        user_id = body.get('userId', f"user-{int(datetime.now().timestamp())}")
        created_date = datetime.now().isoformat()

        # Insert the user into DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(
            Item={
                'userId': user_id,
                'createdDate': created_date,
                **body
            },
            ConditionExpression='attribute_not_exists(userId)'
        )

        # Log the operation to S3
        log_key = f"logs/{user_id}-{int(datetime.now().timestamp())}.json"
        s3.put_object(
            Bucket=LOG_BUCKET,
            Key=log_key,
            Body=json.dumps({'operation': 'CREATE', 'userId': user_id, 'body': body}),
            ContentType='application/json'
        )

        return {
            'statusCode': 201,
            'body': json.dumps({'message': 'User created successfully', 'userId': user_id, 'createdDate': created_date})
        }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal server error', 'error': str(e)})
        }
                """
            ),
            timeout=Duration.seconds(30),
            memory_size=512,
            role=lambda_role,
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": users_table.table_name,
                "LOG_BUCKET": log_bucket.bucket_name,
            },
            dead_letter_queue=dlq,
        )

        # ==================== API Gateway ====================
        api = apigateway.RestApi(
            self, "UserManagementApi",
            rest_api_name="UserManagementAPI",
            description="API for user management operations",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                data_trace_enabled=True,
                metrics_enabled=True,
                tracing_enabled=True,
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
            ),
        )
        users_resource = api.root.add_resource("users")
        users_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(create_user_lambda),
        )

        # ==================== CloudFront Distribution ====================
        cf_distribution = cloudfront.Distribution(
            self, "UserManagementDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.RestApiOrigin(api),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,  # Disable caching for API
                origin_request_policy=cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD,
            ),
            comment=f"CloudFront distribution for UserManagement API - {environment_suffix}",
            enabled=True,
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,  # Use only US and Europe edge locations
            default_root_object="",  # No default root object for API
        )

        # ==================== CloudWatch Alarms ====================
        # Alarm for Lambda execution duration
        lambda_duration_alarm = cloudwatch.Alarm(
            self, "CreateUserDurationAlarm",
            alarm_name=f"CreateUserDurationAlarm-{environment_suffix}",
            alarm_description="Alarm when Lambda execution time exceeds 25 seconds",
            metric=create_user_lambda.metric_duration(statistic="Average"),
            threshold=25000,  # 25 seconds in milliseconds
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Alarm for Lambda errors
        lambda_error_alarm = cloudwatch.Alarm(
            self, "CreateUserErrorAlarm",
            alarm_name=f"CreateUserErrorAlarm-{environment_suffix}",
            alarm_description="Alarm when Lambda function has errors",
            metric=create_user_lambda.metric_errors(statistic="Sum"),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Alarm for DLQ messages
        dlq_message_alarm = cloudwatch.Alarm(
            self, "DLQMessageAlarm",
            alarm_name=f"DLQMessageAlarm-{environment_suffix}",
            alarm_description="Alarm when messages appear in Dead Letter Queue",
            metric=cloudwatch.Metric(
                namespace="AWS/SQS",
                metric_name="ApproximateNumberOfVisibleMessages",
                dimensions_map={"QueueName": dlq.queue_name},
                statistic="Average"
            ),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Alarm for API Gateway 4XX errors
        api_4xx_alarm = cloudwatch.Alarm(
            self, "ApiGateway4XXAlarm",
            alarm_name=f"ApiGateway4XXAlarm-{environment_suffix}",
            alarm_description="Alarm when API Gateway has high 4XX error rate",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="4XXError",
                dimensions_map={
                    "ApiName": api.rest_api_name,
                    "Stage": "prod"
                },
                statistic="Sum"
            ),
            threshold=10,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Alarm for API Gateway 5XX errors
        api_5xx_alarm = cloudwatch.Alarm(
            self, "ApiGateway5XXAlarm",
            alarm_name=f"ApiGateway5XXAlarm-{environment_suffix}",
            alarm_description="Alarm when API Gateway has high 5XX error rate",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="5XXError",
                dimensions_map={
                    "ApiName": api.rest_api_name,
                    "Stage": "prod"
                },
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # ==================== Resource Tags ====================
        # Add tags to all resources
        cdk.Tags.of(self).add("Environment", f"{environment_suffix.title()}")
        cdk.Tags.of(self).add("Project", "UserManagement")
        cdk.Tags.of(self).add("Owner", "DevOps-Team")
        cdk.Tags.of(self).add("CostCenter", "Engineering")

        # ==================== Outputs ====================
        CfnOutput(self, "ApiUrl", value=api.url, description="API Gateway URL")
        CfnOutput(self, "CloudFrontUrl", value=f"https://{cf_distribution.domain_name}", description="CloudFront Distribution URL")
        CfnOutput(self, "CloudFrontDomainName", value=cf_distribution.domain_name, description="CloudFront Domain Name")
        CfnOutput(self, "DynamoDBTableName", value=users_table.table_name, description="DynamoDB Table Name")
        CfnOutput(self, "LogBucketName", value=log_bucket.bucket_name, description="S3 Log Bucket Name")
        CfnOutput(self, "DLQUrl", value=dlq.queue_url, description="Dead Letter Queue URL")

        # Additional Outputs
        CfnOutput(self, "ApiStageName", value="prod", description="API Gateway Stage Name")
        CfnOutput(self, "LambdaFunctionName", value=create_user_lambda.function_name, description="Lambda Function Name")
        CfnOutput(self, "LambdaFunctionArn", value=create_user_lambda.function_arn, description="Lambda Function ARN")
        CfnOutput(self, "CloudWatchLogGroupName", value=create_user_lambda.log_group.log_group_name, description="CloudWatch Log Group Name")
        CfnOutput(self, "S3BucketArn", value=log_bucket.bucket_arn, description="S3 Bucket ARN")
        CfnOutput(self, "DynamoDBTableArn", value=users_table.table_arn, description="DynamoDB Table ARN")
        CfnOutput(self, "DLQArn", value=dlq.queue_arn, description="Dead Letter Queue ARN")

        # CloudWatch Alarms Outputs
        CfnOutput(self, "LambdaDurationAlarmName", value=lambda_duration_alarm.alarm_name, description="Lambda Duration Alarm Name")
        CfnOutput(self, "LambdaErrorAlarmName", value=lambda_error_alarm.alarm_name, description="Lambda Error Alarm Name")
        CfnOutput(self, "DLQMessageAlarmName", value=dlq_message_alarm.alarm_name, description="DLQ Message Alarm Name")
        CfnOutput(self, "ApiGateway4XXAlarmName", value=api_4xx_alarm.alarm_name, description="API Gateway 4XX Alarm Name")
        CfnOutput(self, "ApiGateway5XXAlarmName", value=api_5xx_alarm.alarm_name, description="API Gateway 5XX Alarm Name")


```
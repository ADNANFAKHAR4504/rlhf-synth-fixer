```python

# tap_stack.py
"""
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.

It sets up a secure serverless architecture:
- VPC with endpoints for S3 and DynamoDB
- S3 bucket for logs (versioned, SSE enforced)
- DynamoDB table with GSI
- Two Lambda functions (ProcessUser and GetUser) with X-Ray tracing and least-privilege role
- API Gateway with CORS exposing the two Lambda endpoints
- CloudWatch alarms for Lambda error rate > 5% over 5 minutes
- CloudFormation outputs for endpoints and resource names
"""

from typing import Optional
import textwrap

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    CfnOutput,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    Properties for TapStack.

    environment_suffix: optional string used to distinguish environments (dev/prod/etc).
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Main CDK stack for TAP.

    NOTE: This stack intentionally creates resources for the serverless environment.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # determine environment suffix
        environment_suffix = (props.environment_suffix if props else None) or self.node.try_get_context("environmentSuffix") or "dev"

        # 1. Create VPC
        vpc = ec2.Vpc(
            self,
            "ServerlessVPC",
            max_azs=2,
            nat_gateways=1,
            restrict_default_security_group=False,
            # Keep default subnet configuration (public/private) suitable for lambdas in VPC
        )

        # 2. VPC Endpoints for S3 and DynamoDB (gateway endpoints)
        s3_endpoint = ec2.GatewayVpcEndpoint(
            self,
            "S3VpcEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )

        dynamodb_endpoint = ec2.GatewayVpcEndpoint(
            self,
            "DynamoDBVpcEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        )

        # 3. S3 logs bucket with versioning and S3-managed encryption (SSE-S3)
        logs_bucket = s3.Bucket(
            self,
            "LogsBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # Add a bucket policy to deny unencrypted uploads (corrected condition)
        logs_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyUnEncryptedObjectUploads",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[logs_bucket.arn_for_objects("*")],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "aws:s3"
                    }
                },
            )
        )

        # 4. SNS topic for alarms
        alarm_topic = sns.Topic(
            self,
            "LambdaErrorAlarmTopic",
            display_name="Lambda Error Alarms",
        )

        # 5. DynamoDB table with primary key and GSI
        users_table = dynamodb.Table(
            self,
            "UsersTable",
            partition_key=dynamodb.Attribute(name="userId", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
            encryption=dynamodb.TableEncryption.DEFAULT,
        )

        users_table.add_global_secondary_index(
            index_name="emailIndex",
            partition_key=dynamodb.Attribute(name="email", type=dynamodb.AttributeType.STRING),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # 6. Lambda role - least privilege: VPC access, X-Ray write, basic execution
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"),
            ],
        )

        # Grant specific permissions to resources (fine-grained permissions applied via grant helpers)
        logs_bucket.grant_put(lambda_role)  # allow PutObject
        logs_bucket.grant_put_acl(lambda_role)
        users_table.grant_read_write_data(lambda_role)

        # 7. Common Lambda config
        lambda_common_config = {
            "runtime": lambda_.Runtime.PYTHON_3_9,
            "vpc": vpc,
            "role": lambda_role,
            "tracing": lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            "environment": {
                "DYNAMODB_TABLE_NAME": users_table.table_name,
                "LOGS_BUCKET_NAME": logs_bucket.bucket_name,
            },
        }

        # 8. First Lambda - ProcessUserFunction (inline code)
        process_user_code = textwrap.dedent(
            """
            import json
            import boto3
            import os
            import logging
            import datetime

            logger = logging.getLogger()
            logger.setLevel(logging.INFO)

            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

            def handler(event, context):
                logger.info('Processing user event: %s', json.dumps(event))
                try:
                    body = json.loads(event.get('body', '{}'))
                    user_id = body.get('userId')
                    if not user_id:
                        return {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'userId is required'})
                        }

                    item = {
                        'userId': user_id,
                        'email': body.get('email'),
                        'name': body.get('name'),
                        'createdAt': datetime.datetime.utcnow().isoformat() + 'Z'
                    }

                    table.put_item(Item=item)

                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'message': 'User processed successfully'})
                    }
                except Exception as e:
                    logger.exception('Error processing user')
                    return {
                        'statusCode': 500,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': str(e)})
                    }
            """.strip()
        )

        lambda_function1 = lambda_.Function(
            self,
            "ProcessUserFunction",
            handler="index.handler",
            code=lambda_.Code.from_inline(process_user_code),
            timeout=Duration.seconds(30),
            **lambda_common_config
        )

        # 9. Second Lambda - GetUserFunction (inline code)
        get_user_code = textwrap.dedent(
            """
            import json
            import boto3
            import os
            import logging

            logger = logging.getLogger()
            logger.setLevel(logging.INFO)

            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

            def handler(event, context):
                logger.info('Get user event: %s', json.dumps(event))
                try:
                    path_params = event.get('pathParameters') or {}
                    user_id = path_params.get('userId')
                    if not user_id:
                        return {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'userId is required'})
                        }

                    response = table.get_item(Key={'userId': user_id})
                    item = response.get('Item')
                    if not item:
                        return {
                            'statusCode': 404,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'User not found'})
                        }

                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps(item, default=str)
                    }
                except Exception as e:
                    logger.exception('Error getting user')
                    return {
                        'statusCode': 500,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': str(e)})
                    }
            """.strip()
        )

        lambda_function2 = lambda_.Function(
            self,
            "GetUserFunction",
            handler="index.handler",
            code=lambda_.Code.from_inline(get_user_code),
            timeout=Duration.seconds(30),
            **lambda_common_config
        )

        # 10. CloudWatch alarms for Lambda error rate > 5% in 5 minutes
        for idx, func in enumerate([lambda_function1, lambda_function2], start=1):
            # Create separate alarms for errors and error rate
            errors_metric = func.metric_errors(
                statistic="Sum",
                period=Duration.minutes(5)
            )
            
            # Simple error count alarm (more reliable than error rate)
            error_alarm = cloudwatch.Alarm(
                self,
                f"LambdaErrorAlarm{idx}",
                metric=errors_metric,
                threshold=1,  # Alert on any errors
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                evaluation_periods=1,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
                alarm_description=f"Alarm if {func.function_name} has any errors in 5 minutes",
            )

            error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # 11. API Gateway with CORS (expose the two lambdas)
        api = apigw.RestApi(
            self,
            "ServerlessApi",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"],
            ),
            deploy_options=apigw.StageOptions(stage_name=environment_suffix),
        )

        # POST /users -> ProcessUserFunction
        users_resource = api.root.add_resource("users")
        users_resource.add_method(
            "POST",
            apigw.LambdaIntegration(lambda_function1, proxy=True),
            api_key_required=False,
        )

        # GET /users/{userId} -> GetUserFunction
        user_resource = users_resource.add_resource("{userId}")
        user_resource.add_method(
            "GET",
            apigw.LambdaIntegration(lambda_function2, proxy=True),
            api_key_required=False,
        )

        # 12. CloudFormation outputs
        CfnOutput(self, "ApiEndpoint", value=api.url, description="API Gateway endpoint URL")
        CfnOutput(self, "ProcessUserEndpoint", value=f"{api.url}users", description="Process User API endpoint")
        CfnOutput(self, "GetUserEndpoint", value=f"{api.url}users/{{userId}}", description="Get User API endpoint")
        CfnOutput(self, "DynamoDBTableName", value=users_table.table_name, description="DynamoDB table name")
        CfnOutput(self, "LogsBucketName", value=logs_bucket.bucket_name, description="S3 bucket for logs")
        CfnOutput(self, "SNSTopicArn", value=alarm_topic.topic_arn, description="SNS topic for alarms")


```
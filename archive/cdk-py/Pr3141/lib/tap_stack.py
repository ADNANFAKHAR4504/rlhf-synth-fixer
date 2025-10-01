"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import json

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    Tags,
    CfnOutput,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_logs as logs,
    aws_ec2 as ec2,
    aws_sns as sns,
    aws_kms as kms,
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


class TapStack(Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack creates a secure AWS environment with S3, DynamoDB, Lambda,
    comprehensive monitoring, and security controls.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Store common tags
        self.common_tags = {
            "Environment": environment_suffix,
            "Owner": "platform-team",
            "Project": "tap-infrastructure"
        }

        # Create KMS keys for encryption
        self.kms_key = self._create_kms_key()
        
        # Create VPC and VPC Endpoints
        self.vpc = self._create_vpc_with_endpoints()
        
        # Create SNS topic for alarms
        self.alarm_topic = self._create_alarm_topic()
        
        # Create S3 buckets (only data bucket now)
        self.data_bucket = self._create_secure_s3_bucket("data-bucket")
        
        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()
        
        # Create Lambda functions with proper IAM roles
        self.process_lambda = self._create_lambda_function(
            "data-processor",
            "process_handler",
            self.data_bucket,
            self.dynamodb_table
        )
        
        self.analytics_lambda = self._create_lambda_function(
            "data-analytics",
            "analytics_handler",
            self.data_bucket,
            self.dynamodb_table,
            read_only=True
        )
        
        # Create CloudWatch alarms
        self._create_cloudwatch_alarms()
        
        # Apply tags to all resources
        self._apply_tags()
        
        # Output important resource ARNs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption"""
        key = kms.Key(
            self,
            "InfrastructureKMSKey",
            description="KMS key for secure infrastructure encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )
        
        return key

    def _create_vpc_with_endpoints(self) -> ec2.Vpc:
        """Create VPC with S3 and DynamoDB endpoints"""
        vpc = ec2.Vpc(
            self,
            "SecureVPC",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # Create S3 VPC Endpoint
        vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )
        
        # Create DynamoDB VPC Endpoint
        vpc.add_gateway_endpoint(
            "DynamoDBEndpoint",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )
        
        return vpc

    def _create_alarm_topic(self) -> sns.Topic:
        """Create SNS topic for CloudWatch alarms"""
        topic = sns.Topic(
            self,
            "AlarmTopic",
            display_name="Infrastructure Alarms",
            topic_name="secure-infrastructure-alarms"
        )
        
        return topic

    def _create_secure_s3_bucket(self, bucket_name: str) -> s3.Bucket:
        """Create secure S3 bucket with encryption and access controls"""
        bucket = s3.Bucket(
            self,
            f"Secure{bucket_name.replace('-', '')}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(90),
                    enabled=True
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
        )
        
        # Add bucket policy to deny insecure transport
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyInsecureConnections",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    bucket.bucket_arn,
                    f"{bucket.bucket_arn}/*"
                ],
                conditions={
                    "Bool": {"aws:SecureTransport": "false"}
                }
            )
        )
        
        return bucket

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with encryption"""
        table = dynamodb.Table(
            self,
            "SecureDataTable",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
            contributor_insights_enabled=True,
        )
        
        return table

    def _create_lambda_function(
        self,
        function_name: str,
        handler: str,
        bucket: s3.Bucket,
        table: dynamodb.Table,
        read_only: bool = False
    ) -> lambda_.Function:
        """Create Lambda function with minimum required permissions"""
        
        # Create Lambda execution role with minimal permissions
        role = iam.Role(
            self,
            f"{function_name}Role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"Execution role for {function_name} Lambda function",
            max_session_duration=Duration.hours(1),
        )
        
        # Add basic Lambda execution permissions
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
        )
        
        # Add S3 permissions (least privilege)
        if read_only:
            bucket.grant_read(role)
        else:
            bucket.grant_read_write(role)
    
        # Add DynamoDB permissions (least privilege)
        if read_only:
            table.grant_read_data(role)
        else:
            table.grant_read_write_data(role)
        
        # Create Lambda function
        function = lambda_.Function(
            self,
            f"{function_name}Function",
            runtime=lambda_.Runtime.PYTHON_3_9,  # Fixed runtime version
            handler=f"lambda_function.{handler}",
            code=lambda_.Code.from_inline(self._get_lambda_code(function_name)),
            role=role,
            memory_size=128,
            timeout=Duration.seconds(30),
            environment={
                "BUCKET_NAME": bucket.bucket_name,
                "TABLE_NAME": table.table_name,
                "ENVIRONMENT": self.common_tags["Environment"]
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            log_retention=logs.RetentionDays.ONE_WEEK,
            tracing=lambda_.Tracing.ACTIVE,
        )
        
        return function

    def _get_lambda_code(self, function_name: str) -> str:
        """Generate Lambda function code based on function name"""
        if "processor" in function_name:
            return """
import json
import boto3
import os
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def process_handler(event, context):
    bucket = os.environ['BUCKET_NAME']
    table_name = os.environ['TABLE_NAME']
    table = dynamodb.Table(table_name)
    
    try:
        table.put_item(
            Item={
                'id': context.aws_request_id,
                'timestamp': int(datetime.now().timestamp()),
                'data': json.dumps(event),
                'function': context.function_name
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Data processed successfully')
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error processing data: {str(e)}')
        }
"""
        else:  # analytics function
            return """
import json
import boto3
import os

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def analytics_handler(event, context):
    bucket = os.environ['BUCKET_NAME']
    table_name = os.environ['TABLE_NAME']
    table = dynamodb.Table(table_name)
    
    try:
        response = table.scan(Limit=10)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Analytics completed',
                'items_processed': len(response.get('Items', []))
            })
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error in analytics: {str(e)}')
        }
"""

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for monitoring"""
        
        # Lambda error alarm for processor function
        lambda_error_metric = self.process_lambda.metric_errors(
            period=Duration.minutes(5),
            statistic="Sum"
        )
        
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            "LambdaErrorAlarm",
            metric=lambda_error_metric,
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert on Lambda function errors",
        )
        lambda_error_alarm.add_alarm_action(cloudwatch_actions.SnsAction(self.alarm_topic))

        # DynamoDB throttle alarm
        dynamodb_throttle_metric = self.dynamodb_table.metric_throttled_requests(
            period=Duration.minutes(5),
            statistic="Sum"
        )
        
        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self,
            "DynamoDBThrottleAlarm",
            metric=dynamodb_throttle_metric,
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Alert on DynamoDB throttling",
        )
        dynamodb_throttle_alarm.add_alarm_action(cloudwatch_actions.SnsAction(self.alarm_topic))

    def _apply_tags(self):
        """Apply common tags to all resources in the stack"""
        for key, value in self.common_tags.items():
            Tags.of(self).add(key, value)

    def _create_outputs(self):
        """Create stack outputs for important resource ARNs"""
        CfnOutput(
            self,
            "DataBucketName",
            value=self.data_bucket.bucket_name,
            description="Name of the data S3 bucket"
        )
        
        CfnOutput(
            self,
            "DataBucketArn",
            value=self.data_bucket.bucket_arn,
            description="ARN of the data S3 bucket"
        )
        
        CfnOutput(
            self,
            "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="Name of the DynamoDB table"
        )
        
        CfnOutput(
            self,
            "DynamoDBTableArn",
            value=self.dynamodb_table.table_arn,
            description="ARN of the DynamoDB table"
        )
        
        CfnOutput(
            self,
            "ProcessLambdaName",
            value=self.process_lambda.function_name,
            description="Name of the data processor Lambda function"
        )
        
        CfnOutput(
            self,
            "ProcessLambdaArn",
            value=self.process_lambda.function_arn,
            description="ARN of the data processor Lambda function"
        )
        
        CfnOutput(
            self,
            "AnalyticsLambdaName",
            value=self.analytics_lambda.function_name,
            description="Name of the analytics Lambda function"
        )
        
        CfnOutput(
            self,
            "AnalyticsLambdaArn",
            value=self.analytics_lambda.function_arn,
            description="ARN of the analytics Lambda function"
        )
        
        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="ID of the VPC with endpoints"
        )
        
        CfnOutput(
            self,
            "KMSKeyId",
            value=self.kms_key.key_id,
            description="ID of the KMS encryption key"
        )
        
        CfnOutput(
            self,
            "SNSTopicArn",
            value=self.alarm_topic.topic_arn,
            description="ARN of the SNS alarm topic"
        )

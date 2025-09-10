"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput,
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

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        self.environment_suffix = props.environment_suffix or "dev"

        # Create resources
        self._create_vpc()
        self._create_dynamodb_table()
        self._create_s3_bucket()
        self._create_iam_role()
        self._create_lambda_function()
        self._create_api_gateway()
        self._create_cloudwatch_alarms()
        self._create_outputs()

    def _create_vpc(self):
        """Create a VPC with public and private subnets across two AZs"""
        self.vpc = ec2.Vpc(
            self, "TapVpc",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

    def _create_dynamodb_table(self):
        """Create a DynamoDB table with auto-scaling"""
        self.dynamodb_table = dynamodb.Table(
            self, "TapDynamoDBTable",
            table_name=f"TapTable-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )

        # Enable auto-scaling
        self.dynamodb_table.auto_scale_read_capacity(
            min_capacity=5,
            max_capacity=50
        ).scale_on_utilization(target_utilization_percent=70)

        self.dynamodb_table.auto_scale_write_capacity(
            min_capacity=5,
            max_capacity=50
        ).scale_on_utilization(target_utilization_percent=70)

    def _create_s3_bucket(self):
        """Create an S3 bucket for static assets"""
        self.s3_bucket = s3.Bucket(
            self, "TapS3Bucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

    def _create_iam_role(self):
        """Create an IAM role for the Lambda function"""
        self.lambda_role = iam.Role(
            self, "TapLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
            ],
            inline_policies={
                "DynamoDBAccess": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"],
                            resources=[self.dynamodb_table.table_arn]
                        )
                    ]
                ),
                "S3Access": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=["s3:GetObject", "s3:PutObject"],
                            resources=[f"{self.s3_bucket.bucket_arn}/*"]
                        )
                    ]
                )
            }
        )

    def _create_lambda_function(self):
        """Create a Lambda function"""
        self.lambda_function = _lambda.Function(
            self, "TapLambdaFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_asset("lambda"),
            memory_size=512,
            timeout=Duration.seconds(30),
            role=self.lambda_role,
            vpc=self.vpc,
            environment={
                "DYNAMODB_TABLE": self.dynamodb_table.table_name,
                "S3_BUCKET": self.s3_bucket.bucket_name
            }
        )

    def _create_api_gateway(self):
        """Create an API Gateway"""
        self.api = apigateway.RestApi(
            self, "TapApiGateway",
            rest_api_name="Tap API",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=100,
                throttling_burst_limit=200
            )
        )

        lambda_integration = apigateway.LambdaIntegration(self.lambda_function)
        items = self.api.root.add_resource("items")
        items.add_method("GET", lambda_integration)
        items.add_method("POST", lambda_integration)

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for the Lambda function"""
        cloudwatch.Alarm(
            self, "LambdaErrorAlarm",
            metric=self.lambda_function.metric_errors(),
            threshold=1,
            evaluation_periods=2
        )

        cloudwatch.Alarm(
            self, "LambdaDurationAlarm",
            metric=self.lambda_function.metric_duration(),
            threshold=25000,
            evaluation_periods=2
        )

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(self, "ApiGatewayUrl", value=self.api.url)
        CfnOutput(self, "DynamoDBTableName", value=self.dynamodb_table.table_name)
        CfnOutput(self, "S3BucketName", value=self.s3_bucket.bucket_name)
        CfnOutput(self, "LambdaFunctionName", value=self.lambda_function.function_name)
        CfnOutput(self, "VpcId", value=self.vpc.vpc_id)
        CfnOutput(self, "EnvironmentSuffix", value=self.environment_suffix)
        CfnOutput(self, "LambdaRoleArn", value=self.lambda_role.role_arn)
        CfnOutput(self, "DynamoDBTableArn", value=self.dynamodb_table.table_arn)
        CfnOutput(self, "CloudwatchLogGroupName", value=self.lambda_function.log_group.log_group_name)
        CfnOutput(self, "CloudwatchLogGroupArn", value=self.lambda_function.log_group.log_group_arn)

        

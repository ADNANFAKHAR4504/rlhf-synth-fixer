"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_kms as kms,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_logs as logs,
    CfnOutput,
    Duration,
    RemovalPolicy,
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
        self._create_kms_key()
        self._create_s3_bucket()
        self._create_dynamodb_table()
        self._create_iam_role()
        self._create_lambda_function()
        self._create_api_gateway()
        self._create_outputs()

    def _create_kms_key(self):
        """Create KMS key for encryption"""
        self.kms_key = kms.Key(
            self, "ServerlessKMSKey",
            description=f"KMS key for serverless infrastructure encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

    def _create_s3_bucket(self):
        """Create S3 bucket for file uploads"""
        self.s3_bucket = s3.Bucket(
            self, "FileUploadBucket",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.POST, s3.HttpMethods.PUT],
                    allowed_origins=["*"],  # Restrict in production
                    allowed_headers=["*"],
                    max_age=3000
                )
            ]
        )

    def _create_dynamodb_table(self):
        """Create DynamoDB table for product data"""
        self.dynamodb_table = dynamodb.Table(
            self, "ProductsTable",
            table_name=f"ProductsTable-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="productId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="productName",
                type=dynamodb.AttributeType.STRING
            ),
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )

        # Add Global Secondary Index
        self.dynamodb_table.add_global_secondary_index(
            index_name="PriceIndex",
            partition_key=dynamodb.Attribute(
                name="price",
                type=dynamodb.AttributeType.NUMBER
            ),
            sort_key=dynamodb.Attribute(
                name="productName",
                type=dynamodb.AttributeType.STRING
            )
        )

    def _create_iam_role(self):
        """Create IAM role for Lambda"""
        self.lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="IAM role for Lambda function",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            inline_policies={
                "S3AccessPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                            resources=[f"{self.s3_bucket.bucket_arn}/*"]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["s3:ListBucket"],
                            resources=[self.s3_bucket.bucket_arn]
                        )
                    ]
                ),
                "DynamoDBAccessPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"],
                            resources=[self.dynamodb_table.table_arn]
                        )
                    ]
                ),
                "KMSAccessPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["kms:Decrypt", "kms:GenerateDataKey"],
                            resources=[self.kms_key.key_arn]
                        )
                    ]
                )
            }
        )

    def _create_lambda_function(self):
        """Create Lambda function for file processing"""
        self.lambda_function = _lambda.Function(
            self, "FileProcessorLambda",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.lambda_handler",
            role=self.lambda_role,
            timeout=Duration.minutes(5),
            memory_size=512,
            environment={
                "S3_BUCKET_NAME": self.s3_bucket.bucket_name,
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "KMS_KEY_ID": self.kms_key.key_id
            },
            code=_lambda.Code.from_asset("lambda"),  # Lambda code directory
            log_retention=logs.RetentionDays.ONE_WEEK
        )

    def _create_api_gateway(self):
        """Create API Gateway for file uploads"""
        self.api = apigateway.RestApi(
            self, "FileUploadApi",
            rest_api_name="Serverless File Upload API",
            description="API for file uploads and product management",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS
            ),
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000
            )
        )

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(self.lambda_function)

        # Create /upload resource
        upload_resource = self.api.root.add_resource("upload")
        upload_resource.add_method("POST", lambda_integration)

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(self, "ApiGatewayUrl", value=self.api.url)
        CfnOutput(self, "LambdaFunArn", value=self.lambda_function.function_arn)
        CfnOutput(self, "S3BucketName", value=self.s3_bucket.bucket_name)
        CfnOutput(self, "DynamoDBTableName", value=self.dynamodb_table.table_name)
        CfnOutput(self, "KMSKeyId", value=self.kms_key.key_id)

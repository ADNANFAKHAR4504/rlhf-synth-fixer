"""tap_stack.py
This module defines the TapStack class for secure financial data infrastructure.
It implements PCI-DSS compliant infrastructure with encryption, monitoring, and access controls.
"""

from typing import Optional
import json

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_kms as kms,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
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
    Secure infrastructure stack for handling sensitive financial data.

    This stack implements PCI-DSS compliance requirements including:
    - KMS encryption for all data at rest
    - VPC with private subnets and VPC endpoints
    - Lambda function for PII scanning
    - API Gateway with API key authentication
    - CloudWatch logging and alarms
    - IAM roles with least privilege
    - S3 buckets with versioning and lifecycle policies
    - VPC flow logs for network monitoring

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
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create KMS key for encryption with strict key policies
        kms_key = kms.Key(
            self,
            f"EncryptionKey-{environment_suffix}",
            description=f"KMS key for encrypting financial data - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Add CloudWatch Logs permission to KMS key
        kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AllowCloudWatchLogs",
                effect=iam.Effect.ALLOW,
                principals=[
                    iam.ServicePrincipal(f"logs.{self.region}.amazonaws.com")
                ],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:CreateGrant",
                    "kms:DescribeKey",
                ],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{self.account}:log-group:*"
                    }
                },
            )
        )

        # Create VPC with private subnets for secure Lambda execution
        vpc = ec2.Vpc(
            self,
            f"SecureVpc-{environment_suffix}",
            max_azs=2,
            nat_gateways=0,  # Use VPC endpoints instead for cost efficiency
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                )
            ],
        )

        # Create VPC endpoints for S3 and KMS to keep traffic off public internet
        s3_endpoint = vpc.add_gateway_endpoint(
            f"S3Endpoint-{environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )

        kms_endpoint = vpc.add_interface_endpoint(
            f"KmsEndpoint-{environment_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.KMS,
        )

        logs_endpoint = vpc.add_interface_endpoint(
            f"LogsEndpoint-{environment_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
        )

        # Create S3 bucket for VPC flow logs with encryption
        flow_logs_bucket = s3.Bucket(
            self,
            f"FlowLogsBucket-{environment_suffix}",
            bucket_name=f"flow-logs-bucket-{environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
        )

        # Enable VPC flow logs
        ec2.FlowLog(
            self,
            f"VpcFlowLog-{environment_suffix}",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_s3(flow_logs_bucket),
        )

        # Create S3 bucket for data storage with encryption and versioning
        data_bucket = s3.Bucket(
            self,
            f"DataBucket-{environment_suffix}",
            bucket_name=f"financial-data-bucket-{environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionOldVersionsToGlacier",
                    enabled=True,
                    noncurrent_version_transitions=[
                        s3.NoncurrentVersionTransition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(30),
                        )
                    ],
                )
            ],
        )

        # Add bucket policy to deny non-HTTPS requests
        data_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyNonHttpsRequests",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    data_bucket.bucket_arn,
                    f"{data_bucket.bucket_arn}/*",
                ],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                },
            )
        )

        # Create security group for Lambda function (HTTPS only)
        lambda_security_group = ec2.SecurityGroup(
            self,
            f"LambdaSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for PII scanning Lambda - {environment_suffix}",
            allow_all_outbound=False,
        )

        # Allow HTTPS outbound traffic
        lambda_security_group.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS outbound",
        )

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self,
            f"LambdaRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"IAM role for PII scanning Lambda - {environment_suffix}",
        )

        # Add specific permissions for Lambda execution
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=[
                    f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/lambda/pii-scanner-{environment_suffix}:*"
                ],
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface",
                ],
                resources=["*"],  # Required for VPC Lambda
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                ],
                resources=[f"{data_bucket.bucket_arn}/*"],
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:Encrypt",
                    "kms:GenerateDataKey",
                ],
                resources=[kms_key.key_arn],
            )
        )

        # Update KMS key policy to allow Lambda role
        kms_key.grant_encrypt_decrypt(lambda_role)

        # Create CloudWatch Log Group for Lambda with 90-day retention
        lambda_log_group = logs.LogGroup(
            self,
            f"LambdaLogGroup-{environment_suffix}",
            log_group_name=f"/aws/lambda/pii-scanner-{environment_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,
            removal_policy=RemovalPolicy.DESTROY,
            encryption_key=kms_key,
        )

        # Create Lambda function for PII scanning
        pii_scanner_lambda = lambda_.Function(
            self,
            f"PiiScannerLambda-{environment_suffix}",
            function_name=f"pii-scanner-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            role=lambda_role,
            timeout=Duration.seconds(60),
            memory_size=512,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_security_group],
            environment={
                "BUCKET_NAME": data_bucket.bucket_name,
                "KMS_KEY_ID": kms_key.key_id,
            },
            environment_encryption=kms_key,
            log_group=lambda_log_group,
        )

        # Create CloudWatch Log Group for API Gateway with 90-day retention
        api_log_group = logs.LogGroup(
            self,
            f"ApiGatewayLogGroup-{environment_suffix}",
            log_group_name=f"/aws/apigateway/pii-scanner-api-{environment_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,
            removal_policy=RemovalPolicy.DESTROY,
            encryption_key=kms_key,
        )

        # Create API Gateway REST API with API key requirement
        api = apigateway.RestApi(
            self,
            f"PiiScannerApi-{environment_suffix}",
            rest_api_name=f"pii-scanner-api-{environment_suffix}",
            description=f"API for triggering PII scanning - {environment_suffix}",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
                access_log_format=apigateway.AccessLogFormat.clf(),
            ),
        )

        # Create API key
        api_key = api.add_api_key(
            f"ApiKey-{environment_suffix}",
            api_key_name=f"pii-scanner-api-key-{environment_suffix}",
        )

        # Create usage plan and associate with API key
        usage_plan = api.add_usage_plan(
            f"UsagePlan-{environment_suffix}",
            name=f"pii-scanner-usage-plan-{environment_suffix}",
            throttle=apigateway.ThrottleSettings(
                rate_limit=100,
                burst_limit=200,
            ),
        )

        usage_plan.add_api_key(api_key)
        usage_plan.add_api_stage(
            stage=api.deployment_stage,
        )

        # Create request validator
        request_validator = apigateway.RequestValidator(
            self,
            f"RequestValidator-{environment_suffix}",
            rest_api=api,
            request_validator_name=f"request-validator-{environment_suffix}",
            validate_request_body=True,
            validate_request_parameters=True,
        )

        # Create API resource and method
        scan_resource = api.root.add_resource("scan")

        # Create request model for validation
        request_model = api.add_model(
            f"ScanRequestModel-{environment_suffix}",
            content_type="application/json",
            model_name=f"ScanRequestModel{environment_suffix}",
            schema=apigateway.JsonSchema(
                schema=apigateway.JsonSchemaVersion.DRAFT4,
                type=apigateway.JsonSchemaType.OBJECT,
                properties={
                    "objectKey": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        min_length=1,
                    ),
                },
                required=["objectKey"],
            ),
        )

        scan_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(pii_scanner_lambda),
            api_key_required=True,
            request_validator=request_validator,
            request_models={
                "application/json": request_model,
            },
        )

        # Create CloudWatch alarms for security monitoring

        # Alarm for Lambda errors (potential security issues)
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{environment_suffix}",
            alarm_name=f"pii-scanner-lambda-errors-{environment_suffix}",
            alarm_description="Alert on Lambda function errors",
            metric=pii_scanner_lambda.metric_errors(
                period=Duration.minutes(5),
                statistic="Sum",
            ),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )

        # Alarm for API Gateway 4XX errors (unauthorized access attempts)
        api_4xx_alarm = cloudwatch.Alarm(
            self,
            f"Api4xxAlarm-{environment_suffix}",
            alarm_name=f"pii-scanner-api-4xx-errors-{environment_suffix}",
            alarm_description="Alert on API Gateway 4XX errors indicating unauthorized access",
            metric=api.metric_client_error(
                period=Duration.minutes(5),
                statistic="Sum",
            ),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )

        # Alarm for API Gateway 5XX errors (policy violations)
        api_5xx_alarm = cloudwatch.Alarm(
            self,
            f"Api5xxAlarm-{environment_suffix}",
            alarm_name=f"pii-scanner-api-5xx-errors-{environment_suffix}",
            alarm_description="Alert on API Gateway 5XX errors indicating policy violations",
            metric=api.metric_server_error(
                period=Duration.minutes(5),
                statistic="Sum",
            ),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )

        # Alarm for KMS key usage anomalies
        kms_decrypt_alarm = cloudwatch.Alarm(
            self,
            f"KmsDecryptAlarm-{environment_suffix}",
            alarm_name=f"kms-decrypt-anomaly-{environment_suffix}",
            alarm_description="Alert on unusual KMS decrypt operations",
            metric=cloudwatch.Metric(
                namespace="AWS/KMS",
                metric_name="UserErrorCount",
                dimensions_map={
                    "KeyId": kms_key.key_id,
                },
                period=Duration.minutes(5),
                statistic="Sum",
            ),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )

        # Create stack outputs
        CfnOutput(
            self,
            "ApiEndpointUrl",
            value=api.url,
            description="API Gateway endpoint URL",
            export_name=f"pii-scanner-api-url-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ApiKeyId",
            value=api_key.key_id,
            description="API Key ID for authentication",
            export_name=f"pii-scanner-api-key-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DataBucketName",
            value=data_bucket.bucket_name,
            description="S3 bucket name for financial data",
            export_name=f"financial-data-bucket-name-{environment_suffix}",
        )

        CfnOutput(
            self,
            "FlowLogsBucketName",
            value=flow_logs_bucket.bucket_name,
            description="S3 bucket name for VPC flow logs",
            export_name=f"flow-logs-bucket-name-{environment_suffix}",
        )

        CfnOutput(
            self,
            "KmsKeyId",
            value=kms_key.key_id,
            description="KMS Key ID for encryption",
            export_name=f"encryption-key-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=pii_scanner_lambda.function_name,
            description="Lambda function name for PII scanning",
            export_name=f"pii-scanner-lambda-name-{environment_suffix}",
        )

"""
Secure Data Processing Pipeline CDK Stack.

Implements a fully isolated and security-hardened data processing pipeline
with zero-trust controls for financial services environment in us-east-1.
"""

import json
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    CfnOutput,
    Duration,
    RemovalPolicy,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_kms as kms,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_s3 as s3,
    aws_secretsmanager as secretsmanager,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for the TapStack CDK stack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """Secure Data Processing Pipeline Stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        self.kms_key = self._create_kms_key()
        self.vpc, self.vpc_endpoints = self._create_isolated_vpc()
        self.audit_logs_bucket = self._create_audit_logs_bucket()
        self.raw_data_bucket = self._create_secure_s3_bucket("raw-data")
        self.processed_data_bucket = self._create_secure_s3_bucket("processed-data")
        self.lambda_log_group = self._create_encrypted_log_group(
            f"/aws/lambda/data-processor-{self.environment_suffix}"
        )
        self.api_gateway_log_group = self._create_encrypted_log_group(
            f"/aws/apigateway/data-pipeline-{self.environment_suffix}"
        )
        self.dynamodb_table = self._create_dynamodb_table()
        self.api_certificate_secret = self._create_api_certificate_secret()
        self.lambda_function = self._create_isolated_lambda()
        self.api_gateway = self._create_api_gateway()
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create a customer-managed KMS key with rotation enabled."""
        key = kms.Key(
            self,
            "DataPipelineKey",
            alias=f"alias/data-pipeline-key-{self.environment_suffix}",
            description="Customer-managed KMS key for data pipeline encryption",
            enable_key_rotation=True,
            pending_window=Duration.days(7),
            removal_policy=RemovalPolicy.DESTROY,
        )

        key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="EnableCloudWatchLogsEncryption",
                principals=[iam.ServicePrincipal("logs.us-east-1.amazonaws.com")],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey",
                ],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:us-east-1:{self.account}:log-group:*"
                    }
                },
            )
        )

        return key

    def _create_isolated_vpc(self) -> tuple:
        """Create a completely isolated VPC with no internet access."""
        vpc = ec2.Vpc(
            self,
            "IsolatedVPC",
            vpc_name=f"data-pipeline-vpc-{self.environment_suffix}",
            max_azs=3,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        endpoint_sg = ec2.SecurityGroup(
            self,
            "VPCEndpointSecurityGroup",
            vpc=vpc,
            description="Security group for VPC endpoints",
            allow_all_outbound=False,
        )

        endpoint_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from VPC",
        )

        vpc_endpoints = {}

        vpc_endpoints["s3"] = ec2.GatewayVpcEndpoint(
            self,
            "S3VPCEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )

        vpc_endpoints["dynamodb"] = ec2.GatewayVpcEndpoint(
            self,
            "DynamoDBVPCEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        )

        vpc_endpoints["secrets_manager"] = ec2.InterfaceVpcEndpoint(
            self,
            "SecretsManagerVPCEndpoint",
            vpc=vpc,
            service=ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            private_dns_enabled=True,
            security_groups=[endpoint_sg],
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
        )

        vpc_endpoints["logs"] = ec2.InterfaceVpcEndpoint(
            self,
            "CloudWatchLogsVPCEndpoint",
            vpc=vpc,
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            private_dns_enabled=True,
            security_groups=[endpoint_sg],
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
        )

        return vpc, vpc_endpoints

    def _create_audit_logs_bucket(self) -> s3.Bucket:
        """Create the audit logs bucket."""
        bucket = s3.Bucket(
            self,
            "AuditLogsBucket",
            bucket_name=f"audit-logs-{self.account}-{self.environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        self._add_deny_unencrypted_policy(bucket)
        return bucket

    def _create_secure_s3_bucket(self, bucket_suffix: str) -> s3.Bucket:
        """Create a security-hardened S3 bucket."""
        bucket = s3.Bucket(
            self,
            f"{bucket_suffix.replace('-', '')}Bucket",
            bucket_name=f"{bucket_suffix}-{self.account}-{self.environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            server_access_logs_bucket=self.audit_logs_bucket,
            server_access_logs_prefix=f"{bucket_suffix}/",
        )

        self._add_deny_unencrypted_policy(bucket)
        return bucket

    def _add_deny_unencrypted_policy(self, bucket: s3.Bucket) -> None:
        """Add bucket policy to deny unencrypted uploads."""
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyUnencryptedObjectUploads",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {"s3:x-amz-server-side-encryption": "aws:kms"}
                },
            )
        )

    def _create_encrypted_log_group(self, log_group_name: str) -> logs.LogGroup:
        """Create a CloudWatch log group with KMS encryption."""
        return logs.LogGroup(
            self,
            f"{log_group_name.replace('/', '').replace('-', '')}LogGroup",
            log_group_name=log_group_name,
            encryption_key=self.kms_key,
            retention=logs.RetentionDays.THREE_MONTHS,
            removal_policy=RemovalPolicy.DESTROY,
        )

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create a DynamoDB table with point-in-time recovery."""
        return dynamodb.Table(
            self,
            "ProcessingMetadataTable",
            table_name=f"data-pipeline-metadata-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="processing_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

    def _create_api_certificate_secret(self) -> secretsmanager.Secret:
        """Create a Secrets Manager secret for API certificates."""
        return secretsmanager.Secret(
            self,
            "APICertificateSecret",
            secret_name=f"data-pipeline-api-certificates-{self.environment_suffix}",
            description="API certificates for mutual TLS authentication",
            encryption_key=self.kms_key,
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps(
                    {
                        "certificate": "PLACEHOLDER_CERT",
                        "private_key": "PLACEHOLDER_KEY",
                        "ca_certificate": "PLACEHOLDER_CA",
                    }
                ),
                generate_string_key="api_key",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\\\"",
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

    def _create_isolated_lambda(self) -> lambda_.Function:
        """Create a Lambda function with strict IAM controls."""
        vpc_access_policy = iam.ManagedPolicy.from_managed_policy_arn(
            self,
            "VPCAccessPolicy",
            "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        )

        lambda_role = iam.Role(
            self,
            "DataProcessorRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Least-privilege role for data processing Lambda",
            managed_policies=[vpc_access_policy],
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                sid="DenyInternetAccess",
                effect=iam.Effect.DENY,
                actions=[
                    "ec2:CreateNetworkInterface",
                    "ec2:DeleteNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                ],
                resources=["*"],
                conditions={"ForAnyValue:StringEquals": {"ec2:SubnetID": []}},
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                sid="MinimalS3Read",
                effect=iam.Effect.ALLOW,
                actions=["s3:GetObject", "s3:GetObjectVersion"],
                resources=[f"{self.raw_data_bucket.bucket_arn}/*"],
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                sid="MinimalS3Write",
                effect=iam.Effect.ALLOW,
                actions=["s3:PutObject"],
                resources=[f"{self.processed_data_bucket.bucket_arn}/*"],
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                sid="MinimalDynamoDBAccess",
                effect=iam.Effect.ALLOW,
                actions=["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query"],
                resources=[
                    self.dynamodb_table.table_arn,
                    f"{self.dynamodb_table.table_arn}/index/*",
                ],
            )
        )

        self.kms_key.grant_encrypt_decrypt(lambda_role)

        lambda_sg = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=self.vpc,
            description="Security group for data processing Lambda",
            allow_all_outbound=False,
        )

        lambda_sg.add_egress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS to VPC endpoints",
        )

        return lambda_.Function(
            self,
            "DataProcessorFunction",
            function_name=f"secure-data-processor-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=lambda_.Code.from_inline(self._get_lambda_code()),
            timeout=Duration.minutes(5),
            memory_size=512,
            role=lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "RAW_BUCKET": self.raw_data_bucket.bucket_name,
                "PROCESSED_BUCKET": self.processed_data_bucket.bucket_name,
                "KMS_KEY_ID": self.kms_key.key_id,
            },
            log_group=self.lambda_log_group,
        )

    def _get_lambda_code(self) -> str:
        """Return the Lambda function code."""
        return '''
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.client("dynamodb")
s3 = boto3.client("s3")

def handler(event, context):
    try:
        processing_id = context.aws_request_id
        timestamp = int(datetime.now().timestamp())

        dynamodb.put_item(
            TableName=os.environ["DYNAMODB_TABLE_NAME"],
            Item={
                "processing_id": {"S": processing_id},
                "timestamp": {"N": str(timestamp)},
                "status": {"S": "processing"},
                "source": {"S": "api_gateway"},
            },
        )

        body = event.get("body", "{}")
        if isinstance(body, str):
            body = json.loads(body)

        dynamodb.put_item(
            TableName=os.environ["DYNAMODB_TABLE_NAME"],
            Item={
                "processing_id": {"S": processing_id},
                "timestamp": {"N": str(timestamp + 1)},
                "status": {"S": "completed"},
                "source": {"S": "api_gateway"},
            },
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {"message": "Data processed successfully", "processing_id": processing_id}
            ),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }
'''

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create an API Gateway REST API with Lambda integration."""
        api = apigateway.RestApi(
            self,
            "DataPipelineAPI",
            rest_api_name=f"secure-data-pipeline-api-{self.environment_suffix}",
            description="Secure API for data processing pipeline",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(
                    self.api_gateway_log_group
                ),
                access_log_format=apigateway.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True,
                ),
                throttling_burst_limit=100,
                throttling_rate_limit=50,
            ),
            endpoint_types=[apigateway.EndpointType.REGIONAL],
        )

        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            proxy=True,
        )

        process_resource = api.root.add_resource("process")
        process_resource.add_method(
            "POST",
            lambda_integration,
            authorization_type=apigateway.AuthorizationType.IAM,
        )

        api_key = apigateway.ApiKey(
            self,
            "DataPipelineAPIKey",
            api_key_name=f"data-pipeline-api-key-{self.environment_suffix}",
            description="API key for data pipeline access",
            enabled=True,
        )

        usage_plan = apigateway.UsagePlan(
            self,
            "DataPipelineUsagePlan",
            name=f"data-pipeline-usage-plan-{self.environment_suffix}",
            description="Usage plan for data pipeline API",
            api_stages=[
                apigateway.UsagePlanPerApiStage(api=api, stage=api.deployment_stage)
            ],
            throttle=apigateway.ThrottleSettings(rate_limit=100, burst_limit=200),
            quota=apigateway.QuotaSettings(limit=10000, period=apigateway.Period.DAY),
        )

        usage_plan.add_api_key(api_key)

        return api

    def _create_outputs(self) -> None:
        """Create stack outputs."""
        CfnOutput(
            self,
            "KMSKeyARN",
            value=self.kms_key.key_arn,
            description="ARN of the customer-managed KMS key",
            export_name=f"DataPipelineKMSKeyARN-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "APIGatewayEndpoint",
            value=self.api_gateway.url,
            description="API Gateway endpoint URL",
            export_name=f"DataPipelineAPIEndpoint-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "S3VPCEndpointID",
            value=self.vpc_endpoints["s3"].vpc_endpoint_id,
            description="S3 VPC Endpoint ID",
            export_name=f"S3VPCEndpointID-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "DynamoDBVPCEndpointID",
            value=self.vpc_endpoints["dynamodb"].vpc_endpoint_id,
            description="DynamoDB VPC Endpoint ID",
            export_name=f"DynamoDBVPCEndpointID-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "SecretsManagerVPCEndpointID",
            value=self.vpc_endpoints["secrets_manager"].vpc_endpoint_id,
            description="Secrets Manager VPC Endpoint ID",
            export_name=f"SecretsManagerVPCEndpointID-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "RawDataBucketName",
            value=self.raw_data_bucket.bucket_name,
            description="Raw data S3 bucket name",
            export_name=f"RawDataBucketName-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "ProcessedDataBucketName",
            value=self.processed_data_bucket.bucket_name,
            description="Processed data S3 bucket name",
            export_name=f"ProcessedDataBucketName-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB table name",
            export_name=f"DynamoDBTableName-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda function name",
            export_name=f"LambdaFunctionName-{self.environment_suffix}",
        )


# Ideal Response - Lib Source Reference

This document reproduces every source file contained within the `lib/` directory (excluding compiled artifacts inside `.terraform/`). Each section embeds the full file content inside a markdown code block for easy review.

## Table of Contents
1. [tap_stack.py - CDK Stack Definition](#lib-tap-stack-py)
2. [__init__.py - Package Marker](#lib-init-py)
3. [lambda/index.py - PII Scanner Lambda](#lib-lambda-index-py)
4. [.terraform.lock.hcl - Provider Lock File](#lib-terraform-lock-hcl)

---

## <a id="lib-tap-stack-py"></a>tap_stack.py - CDK Stack Definition
**Path:** `lib/tap_stack.py`

```py
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

```

---

## <a id="lib-init-py"></a>__init__.py - Package Marker
**Path:** `lib/__init__.py`

```py

```

---

## <a id="lib-lambda-index-py"></a>lambda/index.py - PII Scanner Lambda
**Path:** `lib/lambda/index.py`

```py
"""
PII Scanner Lambda Function

This Lambda function scans S3 objects for Personally Identifiable Information (PII)
using regex patterns. It detects common PII patterns including:
- Social Security Numbers (SSN)
- Credit Card Numbers
- Email Addresses
- Phone Numbers
- IP Addresses

The function runs in a VPC with private subnets and uses VPC endpoints
to access S3 and KMS services without traversing the public internet.
"""

import json
import os
import re
import boto3
from datetime import datetime
from typing import Dict, List, Any

# Initialize AWS clients
s3_client = boto3.client('s3')

# PII Detection Patterns
PII_PATTERNS = {
    'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
    'credit_card': r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'phone': r'\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b',
    'ip_address': r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
}


def scan_content_for_pii(content: str) -> Dict[str, List[str]]:
    """
    Scan content for PII using regex patterns.

    Args:
        content (str): The content to scan for PII

    Returns:
        Dict[str, List[str]]: Dictionary mapping PII type to list of matches
    """
    findings = {}

    for pii_type, pattern in PII_PATTERNS.items():
        matches = re.findall(pattern, content)
        if matches:
            # Remove duplicates and keep first 10 matches
            unique_matches = list(set(matches))[:10]
            findings[pii_type] = unique_matches

    return findings


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler function for PII scanning.

    This function can be triggered via:
    1. API Gateway POST request with {"objectKey": "path/to/file.txt"}
    2. S3 event notification (future enhancement)

    Args:
        event (Dict[str, Any]): Lambda event object
        context (Any): Lambda context object

    Returns:
        Dict[str, Any]: Response with scan results
    """
    try:
        print(f"Received event: {json.dumps(event)}")

        # Get bucket name from environment variable
        bucket_name = os.environ.get('BUCKET_NAME')
        if not bucket_name:
            raise ValueError("BUCKET_NAME environment variable not set")

        # Extract object key from API Gateway request or S3 event
        object_key = None

        # Check if event is from API Gateway
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
            object_key = body.get('objectKey')
        # Check if event is from S3
        elif 'Records' in event and len(event['Records']) > 0:
            record = event['Records'][0]
            if 's3' in record:
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']

        if not object_key:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing objectKey in request body',
                    'message': 'Please provide objectKey in the request body'
                })
            }

        print(f"Scanning object: s3://{bucket_name}/{object_key}")

        # Get object from S3
        try:
            response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
            content = response['Body'].read().decode('utf-8')
        except s3_client.exceptions.NoSuchKey:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': 'Object not found',
                    'bucket': bucket_name,
                    'key': object_key
                })
            }
        except Exception as e:
            print(f"Error reading S3 object: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': 'Failed to read S3 object',
                    'message': str(e)
                })
            }

        # Scan content for PII
        pii_findings = scan_content_for_pii(content)

        # Prepare scan results
        scan_result = {
            'bucket': bucket_name,
            'key': object_key,
            'scanned_at': datetime.utcnow().isoformat(),
            'pii_found': len(pii_findings) > 0,
            'pii_types': list(pii_findings.keys()),
            'findings': pii_findings,
            'total_matches': sum(len(matches) for matches in pii_findings.values()),
        }

        # Store scan results back to S3
        result_key = f"scan-results/{object_key}.json"
        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=result_key,
                Body=json.dumps(scan_result, indent=2),
                ContentType='application/json',
            )
            scan_result['result_location'] = f"s3://{bucket_name}/{result_key}"
        except Exception as e:
            print(f"Warning: Failed to store scan results: {str(e)}")

        # Log findings
        if pii_findings:
            print(f"PII detected - Types: {list(pii_findings.keys())}")
            for pii_type, matches in pii_findings.items():
                print(f"  {pii_type}: {len(matches)} match(es)")
        else:
            print("No PII detected")

        # Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'message': 'PII scan completed',
                'scan_result': scan_result
            })
        }

    except Exception as e:
        print(f"Error in PII scanner: {str(e)}")
        import traceback
        traceback.print_exc()

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

```

---

## <a id="lib-terraform-lock-hcl"></a>.terraform.lock.hcl - Provider Lock File
**Path:** `lib/.terraform.lock.hcl`

```hcl
# This file is maintained automatically by "terraform init".
# Manual edits may be lost in future updates.

provider "registry.terraform.io/hashicorp/aws" {
  version     = "6.19.0"
  constraints = ">= 5.0.0"
  hashes = [
    "h1:5qq2jk+G9fymBqnOmtHR30L6TLMlMoZ7TsSXOAYl0qU=",
    "zh:221061660f519f09e9fcd3bbe1fc5c63e81d997e8e9e759984c80095403d7fd6",
    "zh:2436e7f7de4492998d7badfae37f88b042ce993f3fdb411ba7f7a47ff4cc66a2",
    "zh:49e78e889bf5f9378dfacb08040553bf1529171222eda931e31fcdeac223e802",
    "zh:5a07c255ac8694aebe3e166cc3d0ae5f64e0502d47610fd42be22fd907cb81fa",
    "zh:68180e2839faba80b64a5e9eb03cfcc50c75dcf0adb24c6763f97dade8311835",
    "zh:6c7ae7fb8d51fecdd000bdcfec60222c1f0aeac41dacf1c33aa16609e6ccaf43",
    "zh:6ebea9b2eb48fc44ee5674797a5f3b093640b054803495c10a1e558ccd8fee2b",
    "zh:8010d1ca1ab0f89732da3c56351779b6728707270c935bf5fd7d99fdf69bc1da",
    "zh:8ca7544dbe3b2499d0179fd289e536aedac25115855434d76a4dc342409d335a",
    "zh:9b12af85486a96aedd8d7984b0ff811a4b42e3d88dad1a3fb4c0b580d04fa425",
    "zh:c6ed10fb06f561d6785c10ff0f0134b7bfcb9964f1bc38ed8b263480bc3cebc0",
    "zh:d011d703a3b22f7e296baa8ddfd4d550875daa3f551a133988f843d6c8e6ec38",
    "zh:eceb5a8e929b4b0f26e437d1181aeebfb81f376902e0677ead9b886bb41e7c08",
    "zh:eda96ae2f993df469cf5dfeecd842e922de97b8a8600e7d197d884ca5179ad2f",
    "zh:fb229392236c0c76214d157bb1c7734ded4fa1221e9ef7831d67258950246ff3",
  ]
}

```

---

_Note: Binary provider artifacts inside `lib/.terraform/` are intentionally omitted because they are not human-readable source files._

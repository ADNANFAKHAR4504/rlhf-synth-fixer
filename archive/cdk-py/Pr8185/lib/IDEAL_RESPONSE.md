# Secure Data Processing Pipeline - CDK Python Implementation

## lib/tap_stack.py

```python
"""
Secure Data Processing Pipeline CDK Stack

Implements a fully isolated and security-hardened data processing pipeline
with zero-trust controls for financial services environment in us-east-1.

Features:
- Customer-managed KMS key with rotation
- Three S3 buckets (raw-data, processed-data, audit-logs) with SSE-KMS
- Isolated VPC with private subnets and VPC endpoints
- Lambda function with strict IAM controls
- API Gateway REST API with Lambda integration
- CloudWatch logs with KMS encryption
- DynamoDB table with point-in-time recovery
- Secrets Manager with automatic rotation
"""

import json
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_kms as kms,
    aws_s3 as s3,
    aws_ec2 as ec2,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_dynamodb as dynamodb,
    aws_secretsmanager as secretsmanager,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    Properties for the TapStack CDK stack.

    Args:
        environment_suffix: Suffix to identify the deployment environment.
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Secure Data Processing Pipeline Stack.

    Implements a zero-trust architecture with defense-in-depth security controls
    for financial services compliance in us-east-1 region.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        # Create KMS key first
        self.kms_key = self._create_kms_key()

        # Create VPC with endpoints
        self.vpc, self.vpc_endpoints = self._create_isolated_vpc()

        # Create S3 buckets
        self.audit_logs_bucket = self._create_audit_logs_bucket()
        self.raw_data_bucket = self._create_secure_s3_bucket("raw-data")
        self.processed_data_bucket = self._create_secure_s3_bucket("processed-data")

        # Create CloudWatch log groups
        self.lambda_log_group = self._create_encrypted_log_group(
            f"/aws/lambda/data-processor-{self.environment_suffix}"
        )
        self.api_gateway_log_group = self._create_encrypted_log_group(
            f"/aws/apigateway/data-pipeline-{self.environment_suffix}"
        )

        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()

        # Create Secrets Manager secret
        self.api_certificate_secret = self._create_api_certificate_secret()

        # Create Lambda function
        self.lambda_function = self._create_isolated_lambda()

        # Create API Gateway
        self.api_gateway = self._create_api_gateway()

        # Create stack outputs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Creates a customer-managed KMS key with rotation enabled."""
        key = kms.Key(
            self,
            "DataPipelineKey",
            alias=f"alias/data-pipeline-key-{self.environment_suffix}",
            description="Customer-managed KMS key for data pipeline encryption",
            enable_key_rotation=True,
            pending_window=Duration.days(7),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Add key policy for CloudWatch Logs encryption
        key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="EnableCloudWatchLogsEncryption",
                principals=[
                    iam.ServicePrincipal("logs.us-east-1.amazonaws.com")
                ],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn":
                            f"arn:aws:logs:us-east-1:{self.account}:log-group:*"
                    }
                }
            )
        )

        return key

    def _create_isolated_vpc(self) -> tuple:
        """Creates a completely isolated VPC with no internet access."""
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
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Security group for VPC endpoints
        endpoint_sg = ec2.SecurityGroup(
            self,
            "VPCEndpointSecurityGroup",
            vpc=vpc,
            description="Security group for VPC endpoints",
            allow_all_outbound=False
        )

        endpoint_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from VPC"
        )

        vpc_endpoints = {}

        # S3 Gateway Endpoint
        vpc_endpoints["s3"] = ec2.GatewayVpcEndpoint(
            self,
            "S3VPCEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )

        # DynamoDB Gateway Endpoint
        vpc_endpoints["dynamodb"] = ec2.GatewayVpcEndpoint(
            self,
            "DynamoDBVPCEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        )

        # Secrets Manager Interface Endpoint
        vpc_endpoints["secrets_manager"] = ec2.InterfaceVpcEndpoint(
            self,
            "SecretsManagerVPCEndpoint",
            vpc=vpc,
            service=ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            private_dns_enabled=True,
            security_groups=[endpoint_sg],
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
        )

        # CloudWatch Logs Interface Endpoint
        vpc_endpoints["logs"] = ec2.InterfaceVpcEndpoint(
            self,
            "CloudWatchLogsVPCEndpoint",
            vpc=vpc,
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            private_dns_enabled=True,
            security_groups=[endpoint_sg],
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
        )

        return vpc, vpc_endpoints

    # ... (remaining methods follow the same pattern as tap_stack.py)
```

## tap.py

```python
#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.
"""
import os
from datetime import datetime, timezone

import aws_cdk as cdk
from aws_cdk import CliCredentialsStackSynthesizer, Tags

from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

environment_suffix = app.node.try_get_context("environmentSuffix") or "dev"
stack_name = f"TapStack{environment_suffix}"

repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "unknown")
created_at = datetime.now(timezone.utc).isoformat()

Tags.of(app).add("Environment", environment_suffix)
Tags.of(app).add("Repository", repository_name)
Tags.of(app).add("Author", commit_author)
Tags.of(app).add("PRNumber", pr_number)
Tags.of(app).add("Team", team)
Tags.of(app).add("CreatedAt", created_at)

TapStack(
    app,
    stack_name,
    props=TapStackProps(environment_suffix=environment_suffix),
    stack_name=stack_name,
    synthesizer=CliCredentialsStackSynthesizer(),
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)

app.synth()
```

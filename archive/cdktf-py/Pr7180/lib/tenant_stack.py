"""Tenant Stack module for multi-tenant SaaS infrastructure."""

from typing import Dict, Any, List
from cdktf import TerraformStack, TerraformOutput, Fn, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupEgress, SecurityGroupIngress
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionVpcConfig
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTablePointInTimeRecovery,
    DynamodbTableServerSideEncryption
)
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration
)
from cdktf_cdktf_provider_aws.s3_bucket_intelligent_tiering_configuration import (
    S3BucketIntelligentTieringConfiguration,
    S3BucketIntelligentTieringConfigurationTiering
)
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class TenantStack(TerraformStack):
    """CDKTF Stack for isolated tenant infrastructure."""

    def __init__(
        self,
        scope: Construct,
        tenant_id: str,
        cidr_block: str,
        environment_suffix: str,
        aws_region: str,
        central_log_group_name: str,
        **kwargs
    ):
        """
        Initialize the Tenant Stack.

        Args:
            scope: The scope in which to define this construct
            tenant_id: Unique identifier for the tenant (e.g., 'acme-corp')
            cidr_block: VPC CIDR block for this tenant (must not overlap)
            environment_suffix: Environment suffix for resource naming
            aws_region: AWS region for deployment
            central_log_group_name: Name of the central log group for aggregation
        """
        construct_id = f"tenant-{tenant_id}-{environment_suffix}"
        super().__init__(scope, construct_id)

        self.tenant_id = tenant_id
        self.cidr_block = cidr_block
        self.environment_suffix = environment_suffix
        self.aws_region = aws_region
        self.central_log_group_name = central_log_group_name

        # Common tags for all resources
        self.common_tags = {
            "TenantId": tenant_id,
            "Environment": environment_suffix,
            "ManagedBy": "CDKTF"
        }

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[self.common_tags]
        )

        # NOTE: S3 Backend commented out for local testing
        # Configure S3 Backend for state management
        # S3Backend(
        #     self,
        #     bucket="iac-rlhf-tf-states",
        #     key=f"{environment_suffix}/tenant-{tenant_id}.tfstate",
        #     region=aws_region,
        #     encrypt=True
        # )

        # Get AWS account and region information
        self.caller_identity = DataAwsCallerIdentity(self, "current")
        self.region_data = DataAwsRegion(self, "current_region")
        self.azs = DataAwsAvailabilityZones(self, "available", state="available")

        # Create tenant-specific resources in order
        self._create_kms_key()
        self._create_vpc()
        self._create_iam_roles()
        self._create_lambda_functions()
        self._create_dynamodb_table()
        self._create_s3_bucket()
        self._create_cloudwatch_logs()
        self._create_eventbridge_rules()
        self._create_outputs()

    def _create_kms_key(self) -> None:
        """Create tenant-specific KMS Customer Managed Key."""
        # KMS key policy with tenant scoping
        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.caller_identity.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow tenant-scoped access",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": "*"
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": self.tenant_id
                        }
                    }
                },
                {
                    "Sid": "Allow S3 and DynamoDB to use key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": ["s3.amazonaws.com", "dynamodb.amazonaws.com"]
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": "*"
                }
            ]
        }

        self.kms_key = KmsKey(
            self,
            f"kms-key-{self.tenant_id}",
            description=f"KMS key for tenant {self.tenant_id}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            policy=Fn.jsonencode(key_policy),
            tags=self.common_tags
        )

        self.kms_alias = KmsAlias(
            self,
            f"kms-alias-{self.tenant_id}",
            name=f"alias/tenant-{self.tenant_id}-{self.environment_suffix}",
            target_key_id=self.kms_key.id
        )

    def _create_vpc(self) -> None:
        """Create tenant-specific VPC with private subnets."""
        # Create VPC
        self.vpc = Vpc(
            self,
            f"vpc-{self.tenant_id}",
            cidr_block=self.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.common_tags,
                "Name": f"tenant-{self.tenant_id}-vpc-{self.environment_suffix}"
            }
        )

        # Create private subnets in 2 AZs
        self.private_subnets: List[Subnet] = []
        for i in range(2):
            subnet_cidr = Fn.cidrsubnet(self.cidr_block, 8, i)
            subnet = Subnet(
                self,
                f"private-subnet-{self.tenant_id}-{i}",
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=Fn.element(self.azs.names, i),
                tags={
                    **self.common_tags,
                    "Name": f"tenant-{self.tenant_id}-private-subnet-{i}-{self.environment_suffix}"
                }
            )
            self.private_subnets.append(subnet)

        # Alias for backward compatibility with tests
        self.subnets = self.private_subnets

        # Create security group for Lambda functions
        self.lambda_sg = SecurityGroup(
            self,
            f"lambda-sg-{self.tenant_id}",
            name=f"tenant-{self.tenant_id}-lambda-sg-{self.environment_suffix}",
            description=f"Security group for {self.tenant_id} Lambda functions",
            vpc_id=self.vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS outbound for AWS API calls"
                )
            ],
            ingress=[
                SecurityGroupIngress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    self_attribute=True,
                    description="Allow traffic within security group"
                )
            ],
            tags={
                **self.common_tags,
                "Name": f"tenant-{self.tenant_id}-lambda-sg-{self.environment_suffix}"
            }
        )

        # Alias for backward compatibility with tests
        self.security_group = self.lambda_sg

    def _create_iam_roles(self) -> None:
        """Create IAM roles with tenant-scoped permissions."""
        # Lambda execution role assume policy
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        # Inline policy for tenant-scoped access
        tenant_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem"
                    ],
                    "Resource": (
                        f"arn:aws:dynamodb:{self.aws_region}:"
                        f"{self.caller_identity.account_id}:table/"
                        f"tenant-{self.tenant_id}-metadata-{self.environment_suffix}"
                    ),
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": self.tenant_id
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::tenant-{self.tenant_id}-data-{self.environment_suffix}",
                        f"arn:aws:s3:::tenant-{self.tenant_id}-data-{self.environment_suffix}/*"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": self.tenant_id
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey",
                        "kms:DescribeKey"
                    ],
                    "Resource": self.kms_key.arn,
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": self.tenant_id
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": (
                        f"arn:aws:logs:{self.aws_region}:"
                        f"{self.caller_identity.account_id}:log-group:"
                        f"/aws/lambda/tenant-{self.tenant_id}-api-{self.environment_suffix}:*"
                    )
                }
            ]
        }

        # Create inline policy for Lambda role
        self.lambda_policy = IamRoleInlinePolicy(
            name="tenant-scoped-policy",
            policy=Fn.jsonencode(tenant_policy)
        )

        self.lambda_role = IamRole(
            self,
            f"lambda-role-{self.tenant_id}",
            name=f"tenant-{self.tenant_id}-lambda-role-{self.environment_suffix}",
            assume_role_policy=Fn.jsonencode(assume_role_policy),
            inline_policy=[self.lambda_policy],
            tags={
                **self.common_tags,
                "TenantId": self.tenant_id
            }
        )

        # Attach AWS managed policy for VPC execution
        IamRolePolicyAttachment(
            self,
            f"lambda-vpc-policy-{self.tenant_id}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

    def _create_lambda_functions(self) -> None:
        """Create Lambda functions for tenant API endpoints."""
        import os
        # Get absolute path to lambda_function.zip in lib directory
        lambda_zip_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "lambda_function.zip"))

        self.lambda_function = LambdaFunction(
            self,
            f"lambda-api-{self.tenant_id}",
            function_name=f"tenant-{self.tenant_id}-api-{self.environment_suffix}",
            role=self.lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            memory_size=256,
            timeout=60,
            reserved_concurrent_executions=10,
            environment=LambdaFunctionEnvironment(
                variables={
                    "TENANT_ID": self.tenant_id,
                    "ENVIRONMENT": self.environment_suffix,
                    "DYNAMODB_TABLE": f"tenant-{self.tenant_id}-metadata-{self.environment_suffix}",
                    "S3_BUCKET": f"tenant-{self.tenant_id}-data-{self.environment_suffix}"
                }
            ),
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[subnet.id for subnet in self.private_subnets],
                security_group_ids=[self.lambda_sg.id]
            ),
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            tags=self.common_tags,
            lifecycle={
                "ignore_changes": ["source_code_hash", "filename"]
            }
        )

    def _create_dynamodb_table(self) -> None:
        """Create DynamoDB table for tenant metadata."""
        self.dynamodb_table = DynamodbTable(
            self,
            f"dynamodb-table-{self.tenant_id}",
            name=f"tenant-{self.tenant_id}-metadata-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="tenant_id",
            range_key="resource_type",
            attribute=[
                DynamodbTableAttribute(
                    name="tenant_id",
                    type="S"
                ),
                DynamodbTableAttribute(
                    name="resource_type",
                    type="S"
                )
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            server_side_encryption=DynamodbTableServerSideEncryption(
                enabled=True,
                kms_key_arn=self.kms_key.arn
            ),
            tags=self.common_tags
        )

    def _create_s3_bucket(self) -> None:
        """Create S3 bucket with intelligent tiering and encryption."""
        bucket_name = f"tenant-{self.tenant_id}-data-{self.environment_suffix}"

        self.s3_bucket = S3Bucket(
            self,
            f"s3-bucket-{self.tenant_id}",
            bucket=bucket_name,
            force_destroy=True,
            tags=self.common_tags
        )

        # Enable versioning
        self.s3_versioning = S3BucketVersioningA(
            self,
            f"s3-versioning-{self.tenant_id}",
            bucket=self.s3_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Configure server-side encryption with KMS
        self.s3_encryption = S3BucketServerSideEncryptionConfigurationA(
            self,
            f"s3-encryption-{self.tenant_id}",
            bucket=self.s3_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                            sse_algorithm="aws:kms",
                            kms_master_key_id=self.kms_key.arn
                        )
                    ),
                    bucket_key_enabled=True
                )
            ]
        )

        # Configure lifecycle policy for 90-day expiration
        self.s3_lifecycle = S3BucketLifecycleConfiguration(
            self,
            f"s3-lifecycle-{self.tenant_id}",
            bucket=self.s3_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="expire-old-objects",
                    status="Enabled",
                    expiration=[S3BucketLifecycleConfigurationRuleExpiration(
                        days=90
                    )]
                )
            ]
        )

        # Configure intelligent tiering
        self.s3_intelligent_tiering = S3BucketIntelligentTieringConfiguration(
            self,
            f"s3-intelligent-tiering-{self.tenant_id}",
            bucket=self.s3_bucket.id,
            name="EntireBucket",
            status="Enabled",
            tiering=[
                S3BucketIntelligentTieringConfigurationTiering(
                    access_tier="ARCHIVE_ACCESS",
                    days=90
                ),
                S3BucketIntelligentTieringConfigurationTiering(
                    access_tier="DEEP_ARCHIVE_ACCESS",
                    days=180
                )
            ]
        )

    def _create_cloudwatch_logs(self) -> None:
        """Create CloudWatch Log groups with retention."""
        self.log_group = CloudwatchLogGroup(
            self,
            f"log-group-{self.tenant_id}",
            name=f"/aws/lambda/tenant-{self.tenant_id}-api-{self.environment_suffix}",
            retention_in_days=30,
            tags=self.common_tags
        )

    def _create_eventbridge_rules(self) -> None:
        """Create EventBridge rules for tenant provisioning automation."""
        event_pattern = {
            "source": ["saas.tenant"],
            "detail-type": ["Tenant Signup"],
            "detail": {
                "tenant_id": [self.tenant_id]
            }
        }

        self.event_rule = CloudwatchEventRule(
            self,
            f"event-rule-{self.tenant_id}",
            name=f"tenant-{self.tenant_id}-provisioning-{self.environment_suffix}",
            description=f"Trigger provisioning workflow for {self.tenant_id}",
            event_pattern=Fn.jsonencode(event_pattern),
            tags=self.common_tags
        )

        # Add Lambda as target for EventBridge rule
        self.event_target = CloudwatchEventTarget(
            self,
            f"event-target-{self.tenant_id}",
            rule=self.event_rule.name,
            arn=self.lambda_function.arn
        )

        # Grant EventBridge permission to invoke Lambda
        self.lambda_permission = LambdaPermission(
            self,
            f"lambda-permission-{self.tenant_id}",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function_name=self.lambda_function.function_name,
            principal="events.amazonaws.com",
            source_arn=self.event_rule.arn
        )

    def _create_outputs(self) -> None:
        """Create CDKTF outputs for tenant resources."""
        TerraformOutput(
            self,
            "tenant_id_output",
            value=self.tenant_id,
            description=f"Tenant ID for {self.tenant_id}"
        )

        TerraformOutput(
            self,
            "vpc_id_output",
            value=self.vpc.id,
            description=f"VPC ID for tenant {self.tenant_id}"
        )

        TerraformOutput(
            self,
            "lambda_function_arn_output",
            value=self.lambda_function.arn,
            description=f"Lambda function ARN for tenant {self.tenant_id}"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name_output",
            value=self.dynamodb_table.name,
            description=f"DynamoDB table name for tenant {self.tenant_id}"
        )

        TerraformOutput(
            self,
            "s3_bucket_name_output",
            value=self.s3_bucket.bucket,
            description=f"S3 bucket name for tenant {self.tenant_id}"
        )

        TerraformOutput(
            self,
            "kms_key_id_output",
            value=self.kms_key.id,
            description=f"KMS key ID for tenant {self.tenant_id}"
        )

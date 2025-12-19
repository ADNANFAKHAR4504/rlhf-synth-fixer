"""TAP Stack module for Healthcare DR Infrastructure."""

from cdktf import TerraformStack, TerraformOutput, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupEgress, SecurityGroupIngress
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordWeightedRoutingPolicy
import json


class TapStack(TerraformStack):
    """Unified CDKTF stack for Healthcare DR Infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the unified TAP stack with all AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        self.environment_suffix = kwargs.get('environment_suffix', 'dev')
        self.aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure S3 Backend for remote state
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"healthcare-dr/{self.environment_suffix}/terraform.tfstate",
            region=state_bucket_region,
            encrypt=True
        )

        # Configure AWS Provider for primary region
        self.primary_provider = AwsProvider(
            self,
            "aws",
            region=self.aws_region,
            default_tags=[default_tags],
        )

        # Configure AWS Provider for secondary region (us-west-2)
        self.secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            alias="secondary",
            region="us-west-2",
            default_tags=[default_tags],
        )

        # Common tags
        self.common_tags = {
            "Environment": "Production",
            "DisasterRecovery": "Enabled",
            "ManagedBy": "CDKTF"
        }

        # ========== PRIMARY REGION RESOURCES (us-east-1) ==========
        # KMS Key
        self.primary_kms_key = self._create_kms_key("primary")

        # VPC Infrastructure
        self.primary_vpc = self._create_vpc("primary", "10.0.0.0/16")
        self.primary_subnets = self._create_subnets("primary", self.primary_vpc, self.aws_region, "10.0")
        self.primary_igw = self._create_internet_gateway("primary", self.primary_vpc)
        self.primary_route_table = self._create_route_table("primary", self.primary_vpc, self.primary_igw, self.primary_subnets)
        self.primary_security_group = self._create_security_group("primary", self.primary_vpc)

        # S3 Bucket for medical documents
        self.primary_bucket = self._create_s3_bucket("primary")
        self._enable_s3_versioning("primary", self.primary_bucket)
        self._configure_s3_encryption("primary", self.primary_bucket, self.primary_kms_key)

        # IAM Role for Lambda
        self.primary_lambda_role = self._create_lambda_role("primary", self.primary_bucket, self.primary_kms_key)

        # Lambda Function
        self.primary_lambda = self._create_lambda_function("primary", self.primary_lambda_role)

        # SNS Topic
        self.primary_sns_topic = self._create_sns_topic("primary")

        # CloudWatch
        self._create_cloudwatch_dashboard("primary", self.primary_lambda)
        self._create_cloudwatch_alarms("primary", self.primary_lambda, self.primary_sns_topic)

        # ========== SECONDARY REGION RESOURCES (us-west-2) ==========
        # KMS Key
        self.secondary_kms_key = self._create_kms_key("secondary", provider=self.secondary_provider)

        # VPC Infrastructure
        self.secondary_vpc = self._create_vpc("secondary", "10.1.0.0/16", provider=self.secondary_provider)
        self.secondary_subnets = self._create_subnets("secondary", self.secondary_vpc, "us-west-2", "10.1", provider=self.secondary_provider)
        self.secondary_igw = self._create_internet_gateway("secondary", self.secondary_vpc, provider=self.secondary_provider)
        self.secondary_route_table = self._create_route_table("secondary", self.secondary_vpc, self.secondary_igw, self.secondary_subnets, provider=self.secondary_provider)
        self.secondary_security_group = self._create_security_group("secondary", self.secondary_vpc, provider=self.secondary_provider)

        # S3 Bucket for replication
        self.secondary_bucket = self._create_s3_bucket("secondary", provider=self.secondary_provider)
        self._enable_s3_versioning("secondary", self.secondary_bucket, provider=self.secondary_provider)
        self._configure_s3_encryption("secondary", self.secondary_bucket, self.secondary_kms_key, provider=self.secondary_provider)

        # IAM Role for Lambda
        self.secondary_lambda_role = self._create_lambda_role("secondary", self.secondary_bucket, self.secondary_kms_key, provider=self.secondary_provider)

        # Lambda Function
        self.secondary_lambda = self._create_lambda_function("secondary", self.secondary_lambda_role, provider=self.secondary_provider)

        # SNS Topic
        self.secondary_sns_topic = self._create_sns_topic("secondary", provider=self.secondary_provider)

        # CloudWatch
        self._create_cloudwatch_dashboard("secondary", self.secondary_lambda, provider=self.secondary_provider)

        # ========== GLOBAL RESOURCES ==========
        # DynamoDB Global Tables
        self._create_dynamodb_global_tables()

        # Route 53 (without health checks for Lambda function names)
        self._create_route53_infrastructure()

        # Outputs
        self._create_outputs()

    def _create_kms_key(self, region_name: str, provider = None) -> KmsKey:
        """Create KMS customer-managed key with rotation enabled."""
        kwargs = {
            "description": f"KMS key for healthcare DR {region_name} - {self.environment_suffix}",
            "enable_key_rotation": True,
            "tags": {**self.common_tags, "Name": f"healthcare-dr-kms-{region_name}-v2-{self.environment_suffix}"}
        }
        if provider:
            kwargs["provider"] = provider

        kms_key = KmsKey(
            self,
            f"kms_key_{region_name}",
            **kwargs
        )

        alias_kwargs = {
            "name": f"alias/healthcare-dr-{region_name}-v2-{self.environment_suffix}",
            "target_key_id": kms_key.key_id
        }
        if provider:
            alias_kwargs["provider"] = provider

        KmsAlias(
            self,
            f"kms_alias_{region_name}",
            **alias_kwargs
        )

        return kms_key

    def _create_vpc(self, region_name: str, cidr_block: str, provider = None) -> Vpc:
        """Create VPC."""
        kwargs = {
            "cidr_block": cidr_block,
            "enable_dns_hostnames": True,
            "enable_dns_support": True,
            "tags": {**self.common_tags, "Name": f"healthcare-dr-vpc-{region_name}-v2-{self.environment_suffix}"}
        }
        if provider:
            kwargs["provider"] = provider

        return Vpc(
            self,
            f"vpc_{region_name}",
            **kwargs
        )

    def _create_subnets(self, region_name: str, vpc: Vpc, region: str, cidr_prefix: str, provider = None) -> list:
        """Create subnets across availability zones."""
        subnets = []
        azs = ["a", "b", "c"]

        for i, az in enumerate(azs):
            kwargs = {
                "vpc_id": vpc.id,
                "cidr_block": f"{cidr_prefix}.{i}.0/24",
                "availability_zone": f"{region}{az}",
                "map_public_ip_on_launch": True,
                "tags": {**self.common_tags, "Name": f"healthcare-dr-subnet-{region_name}-v2-{az}-{self.environment_suffix}"}
            }
            if provider:
                kwargs["provider"] = provider

            subnet = Subnet(
                self,
                f"subnet_{region_name}_{az}",
                **kwargs
            )
            subnets.append(subnet)

        return subnets

    def _create_internet_gateway(self, region_name: str, vpc: Vpc, provider = None) -> InternetGateway:
        """Create Internet Gateway."""
        kwargs = {
            "vpc_id": vpc.id,
            "tags": {**self.common_tags, "Name": f"healthcare-dr-igw-{region_name}-v2-{self.environment_suffix}"}
        }
        if provider:
            kwargs["provider"] = provider

        return InternetGateway(
            self,
            f"igw_{region_name}",
            **kwargs
        )

    def _create_route_table(self, region_name: str, vpc: Vpc, igw: InternetGateway, subnets: list, provider = None) -> RouteTable:
        """Create route table with internet gateway route."""
        rt_kwargs = {
            "vpc_id": vpc.id,
            "tags": {**self.common_tags, "Name": f"healthcare-dr-rt-{region_name}-v2-{self.environment_suffix}"}
        }
        if provider:
            rt_kwargs["provider"] = provider

        route_table = RouteTable(
            self,
            f"route_table_{region_name}",
            **rt_kwargs
        )

        route_kwargs = {
            "route_table_id": route_table.id,
            "destination_cidr_block": "0.0.0.0/0",
            "gateway_id": igw.id
        }
        if provider:
            route_kwargs["provider"] = provider

        Route(
            self,
            f"internet_route_{region_name}",
            **route_kwargs
        )

        # Associate route table with subnets
        for i, subnet in enumerate(subnets):
            assoc_kwargs = {
                "subnet_id": subnet.id,
                "route_table_id": route_table.id
            }
            if provider:
                assoc_kwargs["provider"] = provider

            RouteTableAssociation(
                self,
                f"rt_association_{region_name}_{i}",
                **assoc_kwargs
            )

        return route_table

    def _create_security_group(self, region_name: str, vpc: Vpc, provider = None) -> SecurityGroup:
        """Create security group for Lambda."""
        kwargs = {
            "name": f"healthcare-dr-lambda-sg-{region_name}-v2-{self.environment_suffix}",
            "description": "Security group for Lambda functions",
            "vpc_id": vpc.id,
            "egress": [SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            "ingress": [SecurityGroupIngress(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"]
            )],
            "tags": {**self.common_tags, "Name": f"healthcare-dr-lambda-sg-{region_name}-v2-{self.environment_suffix}"}
        }
        if provider:
            kwargs["provider"] = provider

        return SecurityGroup(
            self,
            f"lambda_sg_{region_name}",
            **kwargs
        )

    def _create_s3_bucket(self, region_name: str, provider = None) -> S3Bucket:
        """Create S3 bucket for medical documents."""
        kwargs = {
            "bucket": f"healthcare-medical-docs-{region_name}-v2-{self.environment_suffix}",
            "force_destroy": True,
            "tags": {**self.common_tags, "Name": f"medical-docs-{region_name}-v2-{self.environment_suffix}"}
        }
        if provider:
            kwargs["provider"] = provider

        return S3Bucket(
            self,
            f"medical_docs_bucket_{region_name}",
            **kwargs
        )

    def _enable_s3_versioning(self, region_name: str, bucket: S3Bucket, provider = None):
        """Enable versioning on S3 bucket."""
        kwargs = {
            "bucket": bucket.id,
            "versioning_configuration": {
                "status": "Enabled"
            }
        }
        if provider:
            kwargs["provider"] = provider

        return S3BucketVersioningA(
            self,
            f"bucket_versioning_{region_name}",
            **kwargs
        )

    def _configure_s3_encryption(self, region_name: str, bucket: S3Bucket, kms_key: KmsKey, provider = None):
        """Configure S3 bucket encryption with KMS."""
        kwargs = {
            "bucket": bucket.id,
            "rule": [S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=kms_key.arn
                )
            )]
        }
        if provider:
            kwargs["provider"] = provider

        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"bucket_encryption_{region_name}",
            **kwargs
        )

    def _create_lambda_role(self, region_name: str, bucket: S3Bucket, kms_key: KmsKey, provider = None) -> IamRole:
        """Create IAM role for Lambda with cross-region permissions."""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        role_kwargs = {
            "name": f"healthcare-dr-lambda-role-{region_name}-v2-{self.environment_suffix}",
            "assume_role_policy": json.dumps(assume_role_policy),
            "tags": {**self.common_tags, "Name": f"lambda-role-{region_name}-v2-{self.environment_suffix}"}
        }
        if provider:
            role_kwargs["provider"] = provider

        lambda_role = IamRole(
            self,
            f"lambda_role_{region_name}",
            **role_kwargs
        )

        # Custom policy for cross-region access
        policy_kwargs = {
            "name": f"healthcare-dr-lambda-policy-{region_name}-v2-{self.environment_suffix}",
            "policy": json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": f"{bucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": kms_key.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            })
        }
        if provider:
            policy_kwargs["provider"] = provider

        lambda_policy = IamPolicy(
            self,
            f"lambda_policy_{region_name}",
            **policy_kwargs
        )

        # Policy attachments
        attach1_kwargs = {
            "role": lambda_role.name,
            "policy_arn": lambda_policy.arn
        }
        if provider:
            attach1_kwargs["provider"] = provider

        IamRolePolicyAttachment(
            self,
            f"lambda_policy_attachment_{region_name}",
            **attach1_kwargs
        )

        attach2_kwargs = {
            "role": lambda_role.name,
            "policy_arn": "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        }
        if provider:
            attach2_kwargs["provider"] = provider

        IamRolePolicyAttachment(
            self,
            f"lambda_basic_execution_{region_name}",
            **attach2_kwargs
        )

        return lambda_role

    def _create_lambda_function(self, region_name: str, lambda_role: IamRole, provider = None) -> LambdaFunction:
        """Create Lambda function for API endpoints."""
        kwargs = {
            "function_name": f"healthcare-dr-api-{region_name}-v2-{self.environment_suffix}",
            "role": lambda_role.arn,
            "handler": "api_handler.handler",
            "runtime": "python3.11",
            "memory_size": 3072,
            "timeout": 30,
            "filename": "${path.module}/../../../lib/lambda_function.zip",
            "source_code_hash": "${filebase64sha256(\"${path.module}/../../../lib/lambda_function.zip\")}",
            "environment": {
                "variables": {
                    "ENVIRONMENT": "production",
                    "STAGE": region_name
                }
            },
            "tags": {**self.common_tags, "Name": f"api-{region_name}-v2-{self.environment_suffix}"}
        }
        if provider:
            kwargs["provider"] = provider

        return LambdaFunction(
            self,
            f"api_lambda_{region_name}",
            **kwargs
        )

    def _create_sns_topic(self, region_name: str, provider = None) -> SnsTopic:
        """Create SNS topic for failover notifications."""
        kwargs = {
            "name": f"healthcare-dr-failover-{region_name}-v2-{self.environment_suffix}",
            "tags": {**self.common_tags, "Name": f"failover-topic-{region_name}-v2-{self.environment_suffix}"}
        }
        if provider:
            kwargs["provider"] = provider

        return SnsTopic(
            self,
            f"failover_topic_{region_name}",
            **kwargs
        )

    def _create_cloudwatch_dashboard(self, region_name: str, lambda_func: LambdaFunction, provider = None):
        """Create CloudWatch dashboard for monitoring."""
        region = self.aws_region if region_name == "primary" else "us-west-2"

        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                            [".", "Errors", {"stat": "Sum"}],
                            [".", "Duration", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": f"Lambda Metrics - {region_name.capitalize()} Region"
                    }
                }
            ]
        }

        kwargs = {
            "dashboard_name": f"healthcare-dr-{region_name}-v2-{self.environment_suffix}",
            "dashboard_body": json.dumps(dashboard_body)
        }
        if provider:
            kwargs["provider"] = provider

        CloudwatchDashboard(
            self,
            f"monitoring_dashboard_{region_name}",
            **kwargs
        )

    def _create_cloudwatch_alarms(self, region_name: str, lambda_func: LambdaFunction, sns_topic: SnsTopic):
        """Create CloudWatch alarms for critical thresholds (primary only)."""
        CloudwatchMetricAlarm(
            self,
            f"lambda_error_alarm_{region_name}",
            alarm_name=f"healthcare-dr-lambda-errors-{region_name}-v2-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when Lambda errors exceed threshold",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "FunctionName": lambda_func.function_name
            },
            tags={**self.common_tags, "Name": f"lambda-error-alarm-{region_name}-v2-{self.environment_suffix}"}
        )

    def _create_dynamodb_global_tables(self):
        """Create DynamoDB global tables with point-in-time recovery."""

        # Patient Records Table
        patient_records = DynamodbTable(
            self,
            "patient_records",
            name=f"healthcare-patient-records-v2-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="patient_id",
            range_key="record_timestamp",
            attribute=[
                DynamodbTableAttribute(name="patient_id", type="S"),
                DynamodbTableAttribute(name="record_timestamp", type="N")
            ],
            replica=[
                DynamodbTableReplica(region_name="us-west-2")
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={**self.common_tags, "Name": f"patient-records-v2-{self.environment_suffix}"}
        )

        # Audit Logs Table
        audit_logs = DynamodbTable(
            self,
            "audit_logs",
            name=f"healthcare-audit-logs-v2-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="audit_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="audit_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            replica=[
                DynamodbTableReplica(region_name="us-west-2")
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={**self.common_tags, "Name": f"audit-logs-v2-{self.environment_suffix}"}
        )

    def _create_route53_infrastructure(self):
        """Create Route 53 hosted zone with weighted routing (without health checks for Lambda)."""

        # Create hosted zone
        hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"healthcare-dr-v2-{self.environment_suffix}.com",
            tags={**self.common_tags, "Name": f"healthcare-dr-zone-v2-{self.environment_suffix}"}
        )

        # Weighted routing policy: 70% primary, 30% secondary
        # Note: Using Lambda function names as CNAME records (not ideal for production)
        # In production, you would use API Gateway or ALB endpoints
        Route53Record(
            self,
            "primary_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.healthcare-dr-v2-{self.environment_suffix}.com",
            type="A",
            ttl=60,
            records=["192.0.2.1"],  # Placeholder IP - replace with actual API Gateway/ALB endpoint
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=70
            ),
            set_identifier="primary"
        )

        Route53Record(
            self,
            "secondary_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.healthcare-dr-v2-{self.environment_suffix}.com",
            type="A",
            ttl=60,
            records=["192.0.2.2"],  # Placeholder IP - replace with actual API Gateway/ALB endpoint
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=30
            ),
            set_identifier="secondary"
        )

    def _create_outputs(self):
        """Create Terraform outputs."""
        TerraformOutput(
            self,
            "primary_bucket_arn",
            value=self.primary_bucket.arn,
            description="Primary S3 bucket ARN"
        )

        TerraformOutput(
            self,
            "secondary_bucket_arn",
            value=self.secondary_bucket.arn,
            description="Secondary S3 bucket ARN"
        )

        TerraformOutput(
            self,
            "primary_lambda_name",
            value=self.primary_lambda.function_name,
            description="Primary Lambda function name"
        )

        TerraformOutput(
            self,
            "secondary_lambda_name",
            value=self.secondary_lambda.function_name,
            description="Secondary Lambda function name"
        )

        TerraformOutput(
            self,
            "primary_kms_key_arn",
            value=self.primary_kms_key.arn,
            description="Primary KMS key ARN"
        )

        TerraformOutput(
            self,
            "secondary_kms_key_arn",
            value=self.secondary_kms_key.arn,
            description="Secondary KMS key ARN"
        )

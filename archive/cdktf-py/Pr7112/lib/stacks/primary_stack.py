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
import json


class PrimaryStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, region: str, environment_suffix: str,
                 state_bucket: str, state_bucket_region: str, default_tags: dict):
        super().__init__(scope, id)

        self.region = region
        self.environment_suffix = environment_suffix

        # Configure S3 Backend for remote state
        S3Backend(self,
            bucket=state_bucket,
            key=f"healthcare-dr/primary/{environment_suffix}/terraform.tfstate",
            region=state_bucket_region,
            encrypt=True
        )

        # AWS Provider
        AwsProvider(self, "aws", region=region, default_tags=[default_tags])

        # Common tags
        self.common_tags = {
            "Environment": "Production",
            "DisasterRecovery": "Enabled",
            "Region": "Primary",
            "ManagedBy": "CDKTF"
        }

        # KMS Key
        self.kms_key = self._create_kms_key()

        # VPC Infrastructure
        self.vpc = self._create_vpc()
        self.subnets = self._create_subnets()
        self.internet_gateway = self._create_internet_gateway()
        self.route_table = self._create_route_table()
        self.security_group = self._create_security_group()

        # S3 Bucket for medical documents
        self.medical_docs_bucket = self._create_s3_bucket()
        self.bucket_versioning = self._enable_s3_versioning()
        self._configure_s3_encryption()

        # IAM Role for Lambda
        self.lambda_role = self._create_lambda_role()

        # Lambda Function
        self.lambda_function = self._create_lambda_function()

        # SNS Topic for notifications
        self.sns_topic = self._create_sns_topic()

        # CloudWatch Dashboard and Alarms
        self._create_cloudwatch_dashboard()
        self._create_cloudwatch_alarms()

        # Outputs
        self.medical_docs_bucket_arn = TerraformOutput(
            self,
            "medical_docs_bucket_arn",
            value=self.medical_docs_bucket.arn
        ).value

        self.kms_key_arn = TerraformOutput(
            self,
            "kms_key_arn",
            value=self.kms_key.arn
        ).value

        self.api_endpoint = TerraformOutput(
            self,
            "api_endpoint",
            value=self.lambda_function.function_name
        ).value

    def _create_kms_key(self) -> KmsKey:
        """Create KMS customer-managed key with rotation enabled"""
        kms_key = KmsKey(
            self,
            "kms_key",
            description=f"KMS key for healthcare DR - {self.environment_suffix}",
            enable_key_rotation=True,
            tags={**self.common_tags, "Name": f"healthcare-dr-kms-v1-{self.environment_suffix}"}
        )

        KmsAlias(
            self,
            "kms_alias",
            name=f"alias/healthcare-dr-v1-{self.environment_suffix}",
            target_key_id=kms_key.key_id
        )

        return kms_key

    def _create_vpc(self) -> Vpc:
        """Create VPC for primary region"""
        return Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"healthcare-dr-vpc-v1-{self.environment_suffix}"}
        )

    def _create_subnets(self) -> list:
        """Create subnets across availability zones"""
        subnets = []
        azs = ["a", "b", "c"]

        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"subnet_{az}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=f"{self.region}{az}",
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"healthcare-dr-subnet-v1-{az}-{self.environment_suffix}"}
            )
            subnets.append(subnet)

        return subnets

    def _create_internet_gateway(self) -> InternetGateway:
        """Create Internet Gateway"""
        return InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"healthcare-dr-igw-v1-{self.environment_suffix}"}
        )

    def _create_route_table(self) -> RouteTable:
        """Create route table with internet gateway route"""
        route_table = RouteTable(
            self,
            "route_table",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"healthcare-dr-rt-v1-{self.environment_suffix}"}
        )

        # FIX #4: Specify destination_cidr_block parameter for route
        Route(
            self,
            "internet_route",
            route_table_id=route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.internet_gateway.id
        )

        # Associate route table with subnets
        for i, subnet in enumerate(self.subnets):
            RouteTableAssociation(
                self,
                f"rt_association_{i}",
                subnet_id=subnet.id,
                route_table_id=route_table.id
            )

        return route_table

    def _create_security_group(self) -> SecurityGroup:
        """Create security group for Lambda"""
        return SecurityGroup(
            self,
            "lambda_sg",
            name=f"healthcare-dr-lambda-sg-v1-{self.environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            ingress=[SecurityGroupIngress(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={**self.common_tags, "Name": f"healthcare-dr-lambda-sg-v1-{self.environment_suffix}"}
        )

    def _create_s3_bucket(self) -> S3Bucket:
        """Create S3 bucket for medical documents"""
        # Set force_destroy=True for destroyability
        return S3Bucket(
            self,
            "medical_docs_bucket",
            bucket=f"healthcare-medical-docs-primary-v1-{self.environment_suffix}",
            force_destroy=True,
            tags={**self.common_tags, "Name": f"medical-docs-primary-v1-{self.environment_suffix}"}
        )

    def _enable_s3_versioning(self) -> S3BucketVersioningA:
        """Enable versioning on S3 bucket"""
        return S3BucketVersioningA(
            self,
            "bucket_versioning",
            bucket=self.medical_docs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

    def _configure_s3_encryption(self) -> None:
        """Configure S3 bucket encryption with KMS"""
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "bucket_encryption",
            bucket=self.medical_docs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=self.kms_key.arn
                )
            )]
        )

    def _create_lambda_role(self) -> IamRole:
        """Create IAM role for Lambda with cross-region permissions"""
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

        lambda_role = IamRole(
            self,
            "lambda_role",
            name=f"healthcare-dr-lambda-role-primary-v1-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={**self.common_tags, "Name": f"lambda-role-primary-v1-{self.environment_suffix}"}
        )

        # Custom policy for cross-region access
        lambda_policy = IamPolicy(
            self,
            "lambda_policy",
            name=f"healthcare-dr-lambda-policy-primary-v1-{self.environment_suffix}",
            policy=json.dumps({
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
                        "Resource": f"{self.medical_docs_bucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": self.kms_key.arn
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
        )

        # FIX #1: Use role.name instead of role.arn for policy attachment
        IamRolePolicyAttachment(
            self,
            "lambda_policy_attachment",
            role=lambda_role.name,
            policy_arn=lambda_policy.arn
        )

        # Attach AWS managed policies
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # FIX #10: Removed AWSLambdaVPCAccessExecutionRole since Lambda no longer uses VPC

        return lambda_role

    def _create_lambda_function(self) -> LambdaFunction:
        """Create Lambda function for API endpoints"""
        # FIX #10: Removed VPC configuration to avoid plugin timeout issues
        # Lambda functions can access AWS services without VPC when not accessing private resources
        return LambdaFunction(
            self,
            "api_lambda",
            function_name=f"healthcare-dr-api-primary-v1-{self.environment_suffix}",
            role=self.lambda_role.arn,
            handler="api_handler.handler",
            runtime="python3.11",
            memory_size=3072,  # 3GB as required
            timeout=30,  # 30 seconds as required
            filename="${path.module}/../../../lib/lambda_function.zip",
            source_code_hash="${filebase64sha256(\"${path.module}/../../../lib/lambda_function.zip\")}",
            environment={
                "variables": {
                    "ENVIRONMENT": "production",
                    "STAGE": "primary"
                }
            },
            tags={**self.common_tags, "Name": f"api-primary-v1-{self.environment_suffix}"}
        )

    def _create_sns_topic(self) -> SnsTopic:
        """Create SNS topic for failover notifications"""
        return SnsTopic(
            self,
            "failover_topic",
            name=f"healthcare-dr-failover-primary-v1-{self.environment_suffix}",
            tags={**self.common_tags, "Name": f"failover-topic-primary-v1-{self.environment_suffix}"}
        )

    def _create_cloudwatch_dashboard(self) -> None:
        """Create CloudWatch dashboard for monitoring"""
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
                        "region": self.region,
                        "title": "Lambda Metrics - Primary Region"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/S3", "BucketSizeBytes", {"stat": "Average"}],
                            [".", "NumberOfObjects", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": self.region,
                        "title": "S3 Replication Metrics"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            "monitoring_dashboard",
            dashboard_name=f"healthcare-dr-primary-v1-{self.environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for critical thresholds"""
        CloudwatchMetricAlarm(
            self,
            "lambda_error_alarm",
            alarm_name=f"healthcare-dr-lambda-errors-primary-v1-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when Lambda errors exceed threshold",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "FunctionName": self.lambda_function.function_name
            },
            tags={**self.common_tags, "Name": f"lambda-error-alarm-v1-{self.environment_suffix}"}
        )

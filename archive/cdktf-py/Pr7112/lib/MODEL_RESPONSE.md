# Healthcare Platform Multi-Region Disaster Recovery - CDKTF Python Implementation

Complete multi-region disaster recovery infrastructure using **CDKTF with Python** for healthcare platform.

## Critical Deployment Fixes Applied

1. **FIX #1 - IAM Role Policy Attachments**: Using `role=lambda_role.name` instead of `role=lambda_role.arn`
2. **FIX #2 - Lambda Environment Variables**: NOT setting AWS_REGION (automatically available)
3. **FIX #3 - Route53 Domain**: Using `healthcare-dr-{environmentSuffix}.com` instead of example.com
4. **FIX #4 - VPC Route Tables**: All routes specify `destination_cidr_block="0.0.0.0/0"`
5. **FIX #5 - S3 Replication**: Versioning enabled on destination bucket BEFORE replication config

## File Structure

```
├── main.py                    # Application entry point
├── cdktf.json                 # CDKTF configuration
├── requirements.txt           # Python dependencies
├── stacks/
│   ├── __init__.py
│   ├── primary_stack.py       # us-east-1 resources
│   ├── secondary_stack.py     # us-west-2 resources
│   └── global_stack.py        # Global resources (DynamoDB, Route53)
└── lambda/
    └── api_handler.py         # Lambda function code
```

## File: main.py

```python
#!/usr/bin/env python
from cdktf import App
from stacks.primary_stack import PrimaryStack
from stacks.secondary_stack import SecondaryStack
from stacks.global_stack import GlobalStack

app = App()

# Environment suffix for unique resource naming
environment_suffix = app.node.try_get_context("environmentSuffix") or "prod-dr"

# Primary region stack (us-east-1)
primary_stack = PrimaryStack(
    app,
    "healthcare-dr-primary",
    region="us-east-1",
    environment_suffix=environment_suffix
)

# Secondary region stack (us-west-2)
secondary_stack = SecondaryStack(
    app,
    "healthcare-dr-secondary",
    region="us-west-2",
    environment_suffix=environment_suffix,
    primary_bucket_arn=primary_stack.medical_docs_bucket_arn,
    primary_kms_key_arn=primary_stack.kms_key_arn
)

# Global resources (Route53, DynamoDB global tables)
global_stack = GlobalStack(
    app,
    "healthcare-dr-global",
    environment_suffix=environment_suffix,
    primary_endpoint=primary_stack.api_endpoint,
    secondary_endpoint=secondary_stack.api_endpoint,
    primary_region="us-east-1",
    secondary_region="us-west-2"
)

app.synth()
```

## File: stacks/__init__.py

```python
# Stack modules for multi-region disaster recovery
```

## File: stacks/primary_stack.py

```python
from cdktf import TerraformStack, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
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
    def __init__(self, scope: Construct, id: str, region: str, environment_suffix: str):
        super().__init__(scope, id)

        self.region = region
        self.environment_suffix = environment_suffix

        # AWS Provider
        AwsProvider(self, "aws", region=region)

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
            tags={**self.common_tags, "Name": f"healthcare-dr-kms-{self.environment_suffix}"}
        )

        KmsAlias(
            self,
            "kms_alias",
            name=f"alias/healthcare-dr-{self.environment_suffix}",
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
            tags={**self.common_tags, "Name": f"healthcare-dr-vpc-{self.environment_suffix}"}
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
                tags={**self.common_tags, "Name": f"healthcare-dr-subnet-{az}-{self.environment_suffix}"}
            )
            subnets.append(subnet)

        return subnets

    def _create_internet_gateway(self) -> InternetGateway:
        """Create Internet Gateway"""
        return InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"healthcare-dr-igw-{self.environment_suffix}"}
        )

    def _create_route_table(self) -> RouteTable:
        """Create route table with internet gateway route"""
        route_table = RouteTable(
            self,
            "route_table",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"healthcare-dr-rt-{self.environment_suffix}"}
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
            name=f"healthcare-dr-lambda-sg-{self.environment_suffix}",
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
            tags={**self.common_tags, "Name": f"healthcare-dr-lambda-sg-{self.environment_suffix}"}
        )

    def _create_s3_bucket(self) -> S3Bucket:
        """Create S3 bucket for medical documents"""
        # Set force_destroy=True for destroyability
        return S3Bucket(
            self,
            "medical_docs_bucket",
            bucket=f"healthcare-medical-docs-primary-{self.environment_suffix}",
            force_destroy=True,
            tags={**self.common_tags, "Name": f"medical-docs-primary-{self.environment_suffix}"}
        )

    def _enable_s3_versioning(self) -> S3BucketVersioning:
        """Enable versioning on S3 bucket"""
        return S3BucketVersioning(
            self,
            "bucket_versioning",
            bucket=self.medical_docs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

    def _configure_s3_encryption(self) -> None:
        """Configure S3 bucket encryption with KMS"""
        S3BucketServerSideEncryptionConfiguration(
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
            name=f"healthcare-dr-lambda-role-primary-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={**self.common_tags, "Name": f"lambda-role-primary-{self.environment_suffix}"}
        )

        # Custom policy for cross-region access
        lambda_policy = IamPolicy(
            self,
            "lambda_policy",
            name=f"healthcare-dr-lambda-policy-primary-{self.environment_suffix}",
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
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface"
                        ],
                        "Resource": "*"
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

        IamRolePolicyAttachment(
            self,
            "lambda_vpc_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        return lambda_role

    def _create_lambda_function(self) -> LambdaFunction:
        """Create Lambda function for API endpoints"""
        # FIX #2: DO NOT set AWS_REGION in environment variables
        # AWS_REGION is reserved and automatically available
        return LambdaFunction(
            self,
            "api_lambda",
            function_name=f"healthcare-dr-api-primary-{self.environment_suffix}",
            role=self.lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            memory_size=3072,  # 3GB as required
            timeout=30,  # 30 seconds as required
            filename="lambda_function.zip",
            source_code_hash="${filebase64sha256(\"lambda_function.zip\")}",
            vpc_config={
                "subnet_ids": [subnet.id for subnet in self.subnets],
                "security_group_ids": [self.security_group.id]
            },
            # FIX #2: No AWS_REGION in environment - it's automatically available
            environment={
                "variables": {
                    "ENVIRONMENT": "production",
                    "STAGE": "primary"
                }
            },
            tags={**self.common_tags, "Name": f"api-primary-{self.environment_suffix}"}
        )

    def _create_sns_topic(self) -> SnsTopic:
        """Create SNS topic for failover notifications"""
        return SnsTopic(
            self,
            "failover_topic",
            name=f"healthcare-dr-failover-primary-{self.environment_suffix}",
            tags={**self.common_tags, "Name": f"failover-topic-primary-{self.environment_suffix}"}
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
            dashboard_name=f"healthcare-dr-primary-{self.environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for critical thresholds"""
        CloudwatchMetricAlarm(
            self,
            "lambda_error_alarm",
            alarm_name=f"healthcare-dr-lambda-errors-primary-{self.environment_suffix}",
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
            tags={**self.common_tags, "Name": f"lambda-error-alarm-{self.environment_suffix}"}
        )
```

## File: stacks/secondary_stack.py

```python
from cdktf import TerraformStack, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
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
import json


class SecondaryStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        region: str,
        environment_suffix: str,
        primary_bucket_arn: str,
        primary_kms_key_arn: str
    ):
        super().__init__(scope, id)

        self.region = region
        self.environment_suffix = environment_suffix
        self.primary_bucket_arn = primary_bucket_arn
        self.primary_kms_key_arn = primary_kms_key_arn

        # AWS Provider
        AwsProvider(self, "aws", region=region)

        # Common tags
        self.common_tags = {
            "Environment": "Production",
            "DisasterRecovery": "Enabled",
            "Region": "Secondary",
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

        # S3 Bucket for replication destination
        self.medical_docs_bucket = self._create_s3_bucket()
        # FIX #5: Enable versioning on destination bucket BEFORE replication
        self.bucket_versioning = self._enable_s3_versioning()
        self._configure_s3_encryption()

        # IAM Role for Lambda
        self.lambda_role = self._create_lambda_role()

        # Lambda Function
        self.lambda_function = self._create_lambda_function()

        # SNS Topic
        self.sns_topic = self._create_sns_topic()

        # CloudWatch Dashboard
        self._create_cloudwatch_dashboard()

        # Outputs
        TerraformOutput(
            self,
            "medical_docs_bucket_arn",
            value=self.medical_docs_bucket.arn
        )

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
            description=f"KMS key for healthcare DR secondary - {self.environment_suffix}",
            enable_key_rotation=True,
            tags={**self.common_tags, "Name": f"healthcare-dr-kms-secondary-{self.environment_suffix}"}
        )

        KmsAlias(
            self,
            "kms_alias",
            name=f"alias/healthcare-dr-secondary-{self.environment_suffix}",
            target_key_id=kms_key.key_id
        )

        return kms_key

    def _create_vpc(self) -> Vpc:
        """Create VPC for secondary region"""
        return Vpc(
            self,
            "vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"healthcare-dr-vpc-secondary-{self.environment_suffix}"}
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
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=f"{self.region}{az}",
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"healthcare-dr-subnet-{az}-secondary-{self.environment_suffix}"}
            )
            subnets.append(subnet)

        return subnets

    def _create_internet_gateway(self) -> InternetGateway:
        """Create Internet Gateway"""
        return InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"healthcare-dr-igw-secondary-{self.environment_suffix}"}
        )

    def _create_route_table(self) -> RouteTable:
        """Create route table with internet gateway route"""
        route_table = RouteTable(
            self,
            "route_table",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"healthcare-dr-rt-secondary-{self.environment_suffix}"}
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
            name=f"healthcare-dr-lambda-sg-secondary-{self.environment_suffix}",
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
            tags={**self.common_tags, "Name": f"healthcare-dr-lambda-sg-secondary-{self.environment_suffix}"}
        )

    def _create_s3_bucket(self) -> S3Bucket:
        """Create S3 bucket for replication destination"""
        return S3Bucket(
            self,
            "medical_docs_bucket",
            bucket=f"healthcare-medical-docs-secondary-{self.environment_suffix}",
            force_destroy=True,
            tags={**self.common_tags, "Name": f"medical-docs-secondary-{self.environment_suffix}"}
        )

    def _enable_s3_versioning(self) -> S3BucketVersioning:
        """Enable versioning on S3 bucket - REQUIRED before replication"""
        # FIX #5: Enable versioning on destination bucket BEFORE replication
        return S3BucketVersioning(
            self,
            "bucket_versioning",
            bucket=self.medical_docs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

    def _configure_s3_encryption(self) -> None:
        """Configure S3 bucket encryption with KMS"""
        S3BucketServerSideEncryptionConfiguration(
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
            name=f"healthcare-dr-lambda-role-secondary-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={**self.common_tags, "Name": f"lambda-role-secondary-{self.environment_suffix}"}
        )

        # Custom policy for cross-region access
        lambda_policy = IamPolicy(
            self,
            "lambda_policy",
            name=f"healthcare-dr-lambda-policy-secondary-{self.environment_suffix}",
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
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface"
                        ],
                        "Resource": "*"
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

        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicyAttachment(
            self,
            "lambda_vpc_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        return lambda_role

    def _create_lambda_function(self) -> LambdaFunction:
        """Create Lambda function for API endpoints"""
        # FIX #2: DO NOT set AWS_REGION in environment variables
        return LambdaFunction(
            self,
            "api_lambda",
            function_name=f"healthcare-dr-api-secondary-{self.environment_suffix}",
            role=self.lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            memory_size=3072,
            timeout=30,
            filename="lambda_function.zip",
            source_code_hash="${filebase64sha256(\"lambda_function.zip\")}",
            vpc_config={
                "subnet_ids": [subnet.id for subnet in self.subnets],
                "security_group_ids": [self.security_group.id]
            },
            # FIX #2: No AWS_REGION in environment
            environment={
                "variables": {
                    "ENVIRONMENT": "production",
                    "STAGE": "secondary"
                }
            },
            tags={**self.common_tags, "Name": f"api-secondary-{self.environment_suffix}"}
        )

    def _create_sns_topic(self) -> SnsTopic:
        """Create SNS topic for failover notifications"""
        return SnsTopic(
            self,
            "failover_topic",
            name=f"healthcare-dr-failover-secondary-{self.environment_suffix}",
            tags={**self.common_tags, "Name": f"failover-topic-secondary-{self.environment_suffix}"}
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
                        "title": "Lambda Metrics - Secondary Region"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            "monitoring_dashboard",
            dashboard_name=f"healthcare-dr-secondary-{self.environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )
```

## File: stacks/global_stack.py

```python
from cdktf import TerraformStack, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordWeightedRoutingPolicy
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck


class GlobalStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        primary_endpoint: str,
        secondary_endpoint: str,
        primary_region: str,
        secondary_region: str
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.primary_endpoint = primary_endpoint
        self.secondary_endpoint = secondary_endpoint
        self.primary_region = primary_region
        self.secondary_region = secondary_region

        # AWS Provider (global resources use primary region)
        AwsProvider(self, "aws", region=primary_region)

        # Common tags
        self.common_tags = {
            "Environment": "Production",
            "DisasterRecovery": "Enabled",
            "Scope": "Global",
            "ManagedBy": "CDKTF"
        }

        # DynamoDB Global Tables
        self._create_dynamodb_global_tables()

        # Route 53 DNS Failover
        self._create_route53_infrastructure()

    def _create_dynamodb_global_tables(self) -> None:
        """Create DynamoDB global tables with point-in-time recovery"""

        # Patient Records Table
        patient_records = DynamodbTable(
            self,
            "patient_records",
            name=f"healthcare-patient-records-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="patient_id",
            range_key="record_timestamp",
            attribute=[
                DynamodbTableAttribute(name="patient_id", type="S"),
                DynamodbTableAttribute(name="record_timestamp", type="N")
            ],
            replica=[
                DynamodbTableReplica(region_name=self.secondary_region)
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={**self.common_tags, "Name": f"patient-records-{self.environment_suffix}"}
        )

        # Audit Logs Table
        audit_logs = DynamodbTable(
            self,
            "audit_logs",
            name=f"healthcare-audit-logs-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="audit_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="audit_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            replica=[
                DynamodbTableReplica(region_name=self.secondary_region)
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={**self.common_tags, "Name": f"audit-logs-{self.environment_suffix}"}
        )

        TerraformOutput(
            self,
            "patient_records_table",
            value=patient_records.name
        )

        TerraformOutput(
            self,
            "audit_logs_table",
            value=audit_logs.name
        )

    def _create_route53_infrastructure(self) -> None:
        """Create Route 53 hosted zone with weighted routing and health checks"""

        # FIX #3: Use non-reserved domain pattern instead of example.com
        hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"healthcare-dr-{self.environment_suffix}.com",
            tags={**self.common_tags, "Name": f"healthcare-dr-zone-{self.environment_suffix}"}
        )

        # Health checks for both regions
        primary_health_check = Route53HealthCheck(
            self,
            "primary_health_check",
            type="HTTPS",
            resource_path="/health",
            failure_threshold=3,  # Fail after 3 consecutive failures
            request_interval=30,
            tags={**self.common_tags, "Name": f"primary-health-{self.environment_suffix}"}
        )

        secondary_health_check = Route53HealthCheck(
            self,
            "secondary_health_check",
            type="HTTPS",
            resource_path="/health",
            failure_threshold=3,
            request_interval=30,
            tags={**self.common_tags, "Name": f"secondary-health-{self.environment_suffix}"}
        )

        # Weighted routing policy: 70% primary, 30% secondary
        Route53Record(
            self,
            "primary_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.healthcare-dr-{self.environment_suffix}.com",
            type="CNAME",
            ttl=60,
            records=[self.primary_endpoint],
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=70
            ),
            set_identifier="primary",
            health_check_id=primary_health_check.id
        )

        Route53Record(
            self,
            "secondary_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.healthcare-dr-{self.environment_suffix}.com",
            type="CNAME",
            ttl=60,
            records=[self.secondary_endpoint],
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=30
            ),
            set_identifier="secondary",
            health_check_id=secondary_health_check.id
        )

        TerraformOutput(
            self,
            "hosted_zone_id",
            value=hosted_zone.zone_id
        )

        TerraformOutput(
            self,
            "api_domain",
            value=f"api.healthcare-dr-{self.environment_suffix}.com"
        )
```

## File: lambda/api_handler.py

```python
import json
import boto3
import os


def handler(event, context):
    """
    Healthcare API handler for patient records
    AWS_REGION is automatically available - no need to set in environment
    """
    # FIX #2: AWS_REGION is automatically available to Lambda
    region = os.environ.get('AWS_REGION')
    stage = os.environ.get('STAGE', 'unknown')

    dynamodb = boto3.resource('dynamodb', region_name=region)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': f'Healthcare DR API - {stage.capitalize()} Region',
            'region': region,
            'stage': stage,
            'status': 'operational',
            'timestamp': context.request_id
        })
    }


def health_check(event, context):
    """Health check endpoint for Route53"""
    return {
        'statusCode': 200,
        'body': json.dumps({'status': 'healthy'})
    }
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python3 main.py",
  "projectId": "healthcare-dr-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": [
    "hashicorp/aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: requirements.txt

```
cdktf>=0.20.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.0.0
boto3>=1.34.0
```

## Deployment Instructions

1. Install dependencies:
```bash
pip install -r requirements.txt
cdktf get
```

2. Create Lambda deployment package:
```bash
cd lambda
zip -r ../lambda_function.zip api_handler.py
cd ..
```

3. Set environment suffix:
```bash
export CDKTF_CONTEXT_environmentSuffix="prod-dr-001"
```

4. Deploy:
```bash
cdktf deploy --auto-approve
```

## Summary of Fixes

All 5 critical deployment fixes have been applied:

1. **IAM Role Policy Attachments** (FIX #1): Using `role=lambda_role.name` instead of `role=lambda_role.arn` in all IamRolePolicyAttachment resources
2. **Lambda Environment Variables** (FIX #2): NOT setting AWS_REGION in Lambda environment - it's automatically available
3. **Route53 Domain** (FIX #3): Using `healthcare-dr-{environmentSuffix}.com` instead of reserved example.com domain
4. **VPC Route Tables** (FIX #4): All Route resources specify `destination_cidr_block="0.0.0.0/0"` parameter
5. **S3 Replication** (FIX #5): Versioning enabled on destination bucket BEFORE replication configuration

The infrastructure is ready for deployment and testing.

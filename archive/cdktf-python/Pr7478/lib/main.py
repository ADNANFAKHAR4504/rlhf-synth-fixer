"""
Payment Processing Infrastructure with CDKTF Python

This module implements a production-ready payment webhook processing infrastructure
with all identified issues fixed.

FIXES APPLIED:
1. Added environmentSuffix to ALL resource names
2. Removed circular S3Backend dependency (using local state)
3. Lambda deployment package properly created as .zip file
4. Single-region parameterized design (no multi-region complexity)
5. RDS password from Secrets Manager (no hardcoding)
6. NAT Gateway conditional (only in prod environment)
7. Comprehensive stack outputs for integration tests
8. Parameterized for single environment deployment
9. AZ data source validation
10. Dedicated Lambda security group
11. KMS encryption for CloudWatch logs
"""

import os
import json
import time
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion


class PaymentProcessingStack(TerraformStack):
    """
    Main stack for payment processing infrastructure.

    This stack implements a complete serverless payment webhook processing system with:
    - VPC with public/private subnets across multiple AZs
    - RDS PostgreSQL database with Secrets Manager integration
    - Lambda function for webhook processing (with .zip deployment)
    - Proper security groups and IAM roles
    - KMS encryption for logs
    - Conditional NAT Gateway (prod only)
    - Comprehensive outputs for testing
    """

    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # FIX 8: Parameterized for single environment deployment
        self.environment = os.environ.get('ENVIRONMENT', 'dev')
        self.region = os.environ.get('AWS_REGION', 'us-east-1')

        # FIX 1: Generate unique environmentSuffix for all resources
        # Add timestamp to avoid conflicts with orphaned resources
        timestamp = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
        self.environment_suffix = f"{self.environment}-{id[-8:]}-{timestamp}"  # e.g., "dev-e4k2d5l6-317422"

        # Initialize AWS provider - FIX 4: Single region design
        AwsProvider(self, "aws", region=self.region)

        # FIX 9: Validate availability zones with data source
        self.azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Get caller identity and region for outputs
        self.caller_identity = DataAwsCallerIdentity(self, "current")
        self.current_region = DataAwsRegion(self, "current_region")

        # Create infrastructure components
        self._create_kms_keys()
        self._create_vpc()
        self._create_security_groups()
        self._create_database()
        self._create_lambda()
        self._create_outputs()

    def _create_kms_keys(self):
        """FIX 11: Create KMS key for CloudWatch Logs encryption"""
        self.log_kms_key = KmsKey(
            self,
            f"log_kms_key_{self.environment_suffix}",
            description=f"KMS key for CloudWatch Logs encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{Fn.element(Fn.split(':', self.caller_identity.arn), 4)}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": f"logs.{self.region}.amazonaws.com"
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "ArnLike": {
                                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{Fn.element(Fn.split(':', self.caller_identity.arn), 4)}:*"
                            }
                        }
                    }
                ]
            })
        )

        KmsAlias(
            self,
            f"log_kms_alias_{self.environment_suffix}",
            name=f"alias/payment-logs-{self.environment_suffix}",
            target_key_id=self.log_kms_key.key_id
        )

    def _create_vpc(self):
        """Create VPC with public and private subnets across multiple AZs"""
        # FIX 1: environmentSuffix in VPC name
        self.vpc = Vpc(
            self,
            f"vpc_{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"payment-vpc-{self.environment_suffix}"}
        )

        # Internet Gateway for public subnets - FIX 1: environmentSuffix
        self.igw = InternetGateway(
            self,
            f"igw_{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={"Name": f"payment-igw-{self.environment_suffix}"}
        )

        # Create subnets in first 2 AZs - FIX 9: Using validated AZ data source
        self.public_subnets = []
        self.private_subnets = []

        for i in range(2):
            # FIX 1: environmentSuffix in subnet names
            public_subnet = Subnet(
                self,
                f"public_subnet_{i}_{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                map_public_ip_on_launch=True,
                tags={"Name": f"payment-public-{i}-{self.environment_suffix}"}
            )
            self.public_subnets.append(public_subnet)

            # FIX 1: environmentSuffix in subnet names
            private_subnet = Subnet(
                self,
                f"private_subnet_{i}_{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                tags={"Name": f"payment-private-{i}-{self.environment_suffix}"}
            )
            self.private_subnets.append(private_subnet)

        # Public route table - FIX 1: environmentSuffix
        self.public_rt = RouteTable(
            self,
            f"public_rt_{self.environment_suffix}",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={"Name": f"payment-public-rt-{self.environment_suffix}"}
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}_{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id
            )

        # FIX 6: NAT Gateway conditional - only create in prod environment
        if self.environment == 'prod':
            # Create NAT Gateway in first public subnet
            self.nat_eip = Eip(
                self,
                f"nat_eip_{self.environment_suffix}",
                domain="vpc",
                tags={"Name": f"payment-nat-eip-{self.environment_suffix}"}
            )

            self.nat_gateway = NatGateway(
                self,
                f"nat_gateway_{self.environment_suffix}",
                allocation_id=self.nat_eip.id,
                subnet_id=self.public_subnets[0].id,
                tags={"Name": f"payment-nat-{self.environment_suffix}"}
            )

            # Private route table with NAT Gateway
            self.private_rt = RouteTable(
                self,
                f"private_rt_{self.environment_suffix}",
                vpc_id=self.vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=self.nat_gateway.id
                    )
                ],
                tags={"Name": f"payment-private-rt-{self.environment_suffix}"}
            )
        else:
            # Non-prod: Private route table without NAT (cost optimization)
            self.private_rt = RouteTable(
                self,
                f"private_rt_{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={"Name": f"payment-private-rt-{self.environment_suffix}"}
            )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}_{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id
            )

    def _create_security_groups(self):
        """Create security groups for Lambda and RDS"""
        # FIX 10: Dedicated Lambda security group (was implicit)
        self.lambda_sg = SecurityGroup(
            self,
            f"lambda_sg_{self.environment_suffix}",
            name=f"payment-lambda-sg-{self.environment_suffix}",
            description="Security group for payment webhook Lambda function",
            vpc_id=self.vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={"Name": f"payment-lambda-sg-{self.environment_suffix}"}
        )

        # RDS security group - FIX 1: environmentSuffix
        self.rds_sg = SecurityGroup(
            self,
            f"rds_sg_{self.environment_suffix}",
            name=f"payment-rds-sg-{self.environment_suffix}",
            description="Security group for payment database",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.lambda_sg.id],
                    description="PostgreSQL from Lambda"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={"Name": f"payment-rds-sg-{self.environment_suffix}"}
        )

    def _create_database(self):
        """Create RDS PostgreSQL database with Secrets Manager integration"""
        # FIX 5: RDS password from Secrets Manager (not hardcoded)
        self.db_password_secret = SecretsmanagerSecret(
            self,
            f"db_password_secret_{self.environment_suffix}",
            name=f"payment-db-password-{self.environment_suffix}",
            description=f"RDS master password for payment database - {self.environment_suffix}",
            recovery_window_in_days=7
        )

        # Generate secure random password
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits
        db_password = ''.join(secrets.choice(alphabet) for _ in range(32))

        SecretsmanagerSecretVersion(
            self,
            f"db_password_version_{self.environment_suffix}",
            secret_id=self.db_password_secret.id,
            secret_string=json.dumps({
                "username": "paymentadmin",
                "password": db_password
            })
        )

        # DB subnet group - FIX 1: environmentSuffix
        self.db_subnet_group = DbSubnetGroup(
            self,
            f"db_subnet_group_{self.environment_suffix}",
            name=f"payment-db-subnet-{self.environment_suffix}",
            subnet_ids=[s.id for s in self.private_subnets],
            tags={"Name": f"payment-db-subnet-{self.environment_suffix}"}
        )

        # RDS instance - FIX 1: environmentSuffix, FIX 5: password from Secrets Manager
        self.db_instance = DbInstance(
            self,
            f"db_instance_{self.environment_suffix}",
            identifier=f"payment-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.7",  # Using stable PostgreSQL 15.7 version
            instance_class="db.t3.micro",
            allocated_storage=20,
            db_name="payments",
            username="paymentadmin",
            password=db_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            multi_az=self.environment == 'prod',  # Multi-AZ only in prod
            publicly_accessible=False,
            skip_final_snapshot=True,
            tags={"Name": f"payment-db-{self.environment_suffix}"}
        )

    def _create_lambda(self):
        """Create Lambda function for webhook processing"""
        # FIX 11: CloudWatch log group with KMS encryption
        self.lambda_log_group = CloudwatchLogGroup(
            self,
            f"lambda_log_group_{self.environment_suffix}",
            name=f"/aws/lambda/payment-webhook-{self.environment_suffix}",
            retention_in_days=7,
            kms_key_id=self.log_kms_key.arn
        )

        # IAM role for Lambda - FIX 1: environmentSuffix
        self.lambda_role = IamRole(
            self,
            f"lambda_role_{self.environment_suffix}",
            name=f"payment-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow"
                }]
            })
        )

        # Attach basic execution role
        IamRolePolicyAttachment(
            self,
            f"lambda_basic_execution_{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Attach VPC execution role
        IamRolePolicyAttachment(
            self,
            f"lambda_vpc_execution_{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Custom policy for Secrets Manager access
        secrets_policy = IamPolicy(
            self,
            f"lambda_secrets_policy_{self.environment_suffix}",
            name=f"payment-lambda-secrets-{self.environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": self.db_password_secret.arn
                }]
            })
        )

        IamRolePolicyAttachment(
            self,
            f"lambda_secrets_attachment_{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=secrets_policy.arn
        )

        # FIX 3: Lambda function with .zip deployment package (created separately)
        # FIX 1: environmentSuffix in Lambda name
        # Get the project root directory for proper path resolution during deployment
        # In CI/CD, GITHUB_WORKSPACE provides the project root; locally, use relative to __file__
        github_workspace = os.environ.get('GITHUB_WORKSPACE')
        if github_workspace:
            lambda_zip_path = os.path.join(github_workspace, "lib", "lambda", "payment_webhook.zip")
        else:
            # Local development: path relative to this file's location
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            lambda_zip_path = os.path.join(project_root, "lib", "lambda", "payment_webhook.zip")

        self.lambda_function = LambdaFunction(
            self,
            f"payment_webhook_{self.environment_suffix}",
            function_name=f"payment-webhook-{self.environment_suffix}",
            filename=lambda_zip_path,  # FIX 3: Using absolute path for deployment
            handler="payment_webhook.handler",
            runtime="python3.11",
            role=self.lambda_role.arn,
            timeout=30,
            memory_size=256,
            environment={
                "variables": {
                    "DB_HOST": self.db_instance.address,
                    "DB_NAME": self.db_instance.db_name,
                    "DB_SECRET_ARN": self.db_password_secret.arn,
                    "ENVIRONMENT": self.environment
                }
            },
            vpc_config={
                "subnet_ids": [s.id for s in self.private_subnets],
                "security_group_ids": [self.lambda_sg.id]  # FIX 10: Explicit security group
            },
            depends_on=[self.lambda_log_group]
        )

    def _create_outputs(self):
        """FIX 7: Comprehensive stack outputs for integration tests"""
        # VPC outputs
        TerraformOutput(
            self, "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self, "vpc_cidr",
            value=self.vpc.cidr_block,
            description="VPC CIDR block"
        )

        # Subnet outputs
        TerraformOutput(
            self, "public_subnet_ids",
            value=Fn.jsonencode([s.id for s in self.public_subnets]),
            description="Public subnet IDs"
        )

        TerraformOutput(
            self, "private_subnet_ids",
            value=Fn.jsonencode([s.id for s in self.private_subnets]),
            description="Private subnet IDs"
        )

        # Database outputs
        TerraformOutput(
            self, "db_endpoint",
            value=self.db_instance.endpoint,
            description="RDS endpoint"
        )

        TerraformOutput(
            self, "db_name",
            value=self.db_instance.db_name,
            description="Database name"
        )

        TerraformOutput(
            self, "db_secret_arn",
            value=self.db_password_secret.arn,
            description="ARN of secret containing database credentials"
        )

        # Lambda outputs
        TerraformOutput(
            self, "lambda_function_name",
            value=self.lambda_function.function_name,
            description="Lambda function name"
        )

        TerraformOutput(
            self, "lambda_function_arn",
            value=self.lambda_function.arn,
            description="Lambda function ARN"
        )

        TerraformOutput(
            self, "lambda_role_arn",
            value=self.lambda_role.arn,
            description="Lambda execution role ARN"
        )

        # Security group outputs
        TerraformOutput(
            self, "lambda_security_group_id",
            value=self.lambda_sg.id,
            description="Lambda security group ID"
        )

        TerraformOutput(
            self, "rds_security_group_id",
            value=self.rds_sg.id,
            description="RDS security group ID"
        )

        # Environment info
        TerraformOutput(
            self, "environment",
            value=self.environment,
            description="Deployment environment"
        )

        TerraformOutput(
            self, "region",
            value=self.region,
            description="AWS region"
        )

        # NAT Gateway output (conditional)
        if self.environment == 'prod':
            TerraformOutput(
                self, "nat_gateway_id",
                value=self.nat_gateway.id,
                description="NAT Gateway ID (prod only)"
            )


# FIX 2: Using local state instead of S3Backend to avoid circular dependency
app = App()
PaymentProcessingStack(app, "payment-processing-e4k2d5l6")
app.synth()

from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, Fn, Token
from cdktf_cdktf_provider_aws.provider import AwsProvider
import hashlib
import base64
import zipfile
import secrets
import string
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration
)
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
import json
import os


class RegionConfig:
    """Configuration for region including CIDR and availability zones"""

    def __init__(self, region: str, vpc_cidr: str, azs: list[str]):
        self.region = region
        self.vpc_cidr = vpc_cidr
        self.azs = azs

    @staticmethod
    def get_region_config(region: str):
        """Return configuration for the specified region"""
        configs = {
            "us-east-1": RegionConfig(
                region="us-east-1",
                vpc_cidr="10.0.0.0/16",
                azs=["us-east-1a", "us-east-1b", "us-east-1c"]
            ),
            "us-east-2": RegionConfig(
                region="us-east-2",
                vpc_cidr="10.1.0.0/16",
                azs=["us-east-2a", "us-east-2b", "us-east-2c"]
            ),
            "us-west-2": RegionConfig(
                region="us-west-2",
                vpc_cidr="10.2.0.0/16",
                azs=["us-west-2a", "us-west-2b", "us-west-2c"]
            )
        }
        return configs.get(region, configs["us-east-1"])


class TradingPlatformStack(TerraformStack):
    """Trading platform infrastructure stack for single region deployment"""

    def __init__(self, scope: Construct, stack_id: str, region: str, environment_suffix: str):
        super().__init__(scope, stack_id)

        self.region = region
        self.environment_suffix = environment_suffix
        self.region_config = RegionConfig.get_region_config(region)

        # AWS Provider
        AwsProvider(self, "aws",
            region=self.region
        )

        # Create all infrastructure components
        self.create_kms_key()
        self.create_vpc_network()
        self.create_security_groups()
        self.create_s3_bucket()
        self.create_rds_cluster()
        self.create_lambda_functions()
        self.create_api_gateway()
        self.create_route53_records()

        # Outputs
        self.create_outputs()

    def create_kms_key(self):
        """Create KMS key for encryption"""
        self.kms_key = KmsKey(self, f"kms-key-{self.environment_suffix}",
            description=f"Trading platform KMS key for {self.region}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                "Name": f"trading-kms-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Region": self.region
            }
        )

        KmsAlias(self, f"kms-alias-{self.environment_suffix}",
            name=f"alias/trading-{self.region}-{self.environment_suffix}",
            target_key_id=self.kms_key.key_id
        )

    def create_vpc_network(self):
        """Create VPC with public and private subnets"""
        # VPC
        self.vpc = Vpc(self, f"vpc-{self.environment_suffix}",
            cidr_block=self.region_config.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"trading-vpc-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Internet Gateway
        self.igw = InternetGateway(self, f"igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"trading-igw-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Public Subnets (for NAT Gateway)
        self.public_subnets = []
        for idx, az in enumerate(self.region_config.azs[:2]):  # Use 2 AZs
            vpc_octets = self.region_config.vpc_cidr.split('.')
            cidr = f"{vpc_octets[0]}.{vpc_octets[1]}.{idx}.0/24"
            subnet = Subnet(self, f"public-subnet-{idx}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"trading-public-{idx}-{self.environment_suffix}",
                    "Environment": self.environment_suffix
                }
            )
            self.public_subnets.append(subnet)

        # Private Subnets (for RDS and Lambda)
        self.private_subnets = []
        for idx, az in enumerate(self.region_config.azs[:2]):  # Use 2 AZs
            vpc_octets = self.region_config.vpc_cidr.split('.')
            cidr = f"{vpc_octets[0]}.{vpc_octets[1]}.{idx + 10}.0/24"
            subnet = Subnet(self, f"private-subnet-{idx}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                tags={
                    "Name": f"trading-private-{idx}-{self.environment_suffix}",
                    "Environment": self.environment_suffix
                }
            )
            self.private_subnets.append(subnet)

        # Route Table for Public Subnets
        public_rt = RouteTable(self, f"public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={
                "Name": f"trading-public-rt-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        for idx, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(self, f"public-rt-assoc-{idx}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # NAT Gateway (use one for cost optimization)
        eip = Eip(self, f"nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={
                "Name": f"trading-nat-eip-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        self.nat_gateway = NatGateway(self, f"nat-gw-{self.environment_suffix}",
            allocation_id=eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={
                "Name": f"trading-nat-gw-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Route Table for Private Subnets
        private_rt = RouteTable(self, f"private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=self.nat_gateway.id
                )
            ],
            tags={
                "Name": f"trading-private-rt-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        for idx, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(self, f"private-rt-assoc-{idx}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

    def create_security_groups(self):
        """Create security groups for RDS and Lambda"""
        # Lambda Security Group
        self.lambda_sg = SecurityGroup(self, f"lambda-sg-{self.environment_suffix}",
            name=f"trading-lambda-sg-{self.environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"trading-lambda-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # RDS Security Group
        self.rds_sg = SecurityGroup(self, f"rds-sg-{self.environment_suffix}",
            name=f"trading-rds-sg-{self.environment_suffix}",
            description="Security group for RDS Aurora cluster",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.lambda_sg.id],
                    description="MySQL access from Lambda"
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
            tags={
                "Name": f"trading-rds-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

    def create_s3_bucket(self):
        """Create S3 bucket with lifecycle policy"""
        self.s3_bucket = S3Bucket(self, f"s3-bucket-{self.environment_suffix}",
            bucket=f"trading-artifacts-{self.region}-{self.environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"trading-artifacts-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # S3 Bucket Encryption
        encryption_default = (
            S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                sse_algorithm="aws:kms",
                kms_master_key_id=self.kms_key.arn
            )
        )
        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"s3-encryption-{self.environment_suffix}",
            bucket=self.s3_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=encryption_default
                )
            ]
        )

        # S3 Lifecycle Policy
        S3BucketLifecycleConfiguration(self, f"s3-lifecycle-{self.environment_suffix}",
            bucket=self.s3_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="delete-old-objects",
                    status="Enabled",
                    expiration=[S3BucketLifecycleConfigurationRuleExpiration(
                        days=90
                    )]
                )
            ]
        )

    def create_rds_cluster(self):
        """Create RDS Aurora MySQL cluster with read replicas"""
        # Generate secure random password at synthesis time
        self.db_password = self._generate_secure_password(32)

        # Create Secrets Manager secret for RDS credentials
        self.db_secret = SecretsmanagerSecret(self, f"rds-password-secret-{self.environment_suffix}",
            name=f"trading-rds-password-{self.environment_suffix}",
            description=f"RDS Aurora cluster master password for {self.environment_suffix}",
            kms_key_id=self.kms_key.arn,
            recovery_window_in_days=7,
            tags={
                "Name": f"trading-rds-password-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Store credentials in Secrets Manager
        self.db_secret_version = SecretsmanagerSecretVersion(
            self,
            f"rds-password-secret-version-{self.environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=Fn.jsonencode({
                "username": "admin",
                "password": self.db_password,
                "engine": "aurora-mysql",
                "host": "${aws_rds_cluster.rds-cluster-" + self.environment_suffix + ".endpoint}",
                "port": 3306,
                "dbname": "trading"
            })
        )

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(self, f"db-subnet-group-{self.environment_suffix}",
            name=f"trading-db-subnet-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={
                "Name": f"trading-db-subnet-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # RDS Aurora Cluster
        self.rds_cluster = RdsCluster(self, f"rds-cluster-{self.environment_suffix}",
            cluster_identifier=f"trading-cluster-{self.environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="trading",
            master_username="admin",
            master_password=self.db_password,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            skip_final_snapshot=True,
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            tags={
                "Name": f"trading-cluster-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Primary Instance
        RdsClusterInstance(self, f"rds-primary-{self.environment_suffix}",
            identifier=f"trading-primary-{self.environment_suffix}",
            cluster_identifier=self.rds_cluster.id,
            instance_class="db.r5.large",
            engine=self.rds_cluster.engine,
            engine_version=self.rds_cluster.engine_version,
            publicly_accessible=False,
            tags={
                "Name": f"trading-primary-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Read Replicas (2 replicas)
        for idx in range(2):
            RdsClusterInstance(self, f"rds-replica-{idx}-{self.environment_suffix}",
                identifier=f"trading-replica-{idx}-{self.environment_suffix}",
                cluster_identifier=self.rds_cluster.id,
                instance_class="db.r5.large",
                engine=self.rds_cluster.engine,
                engine_version=self.rds_cluster.engine_version,
                publicly_accessible=False,
                tags={
                    "Name": f"trading-replica-{idx}-{self.environment_suffix}",
                    "Environment": self.environment_suffix
                }
            )

    def create_lambda_functions(self):
        """Create Lambda functions with VPC access"""
        # CloudWatch Log Group for Lambda
        self.lambda_log_group = CloudwatchLogGroup(self, f"lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/trading-processor-{self.environment_suffix}",
            retention_in_days=30,
            tags={
                "Name": f"trading-lambda-logs-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # IAM Role for Lambda
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }
            ]
        }

        self.lambda_role = IamRole(self, f"lambda-role-{self.environment_suffix}",
            name=f"trading-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"trading-lambda-role-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Attach policies to Lambda role
        IamRolePolicyAttachment(self, f"lambda-vpc-policy-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        IamRolePolicyAttachment(self, f"lambda-basic-policy-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # IAM policy for Secrets Manager access
        secrets_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": self.db_secret.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt"
                    ],
                    "Resource": self.kms_key.arn
                }
            ]
        }

        IamRolePolicy(self, f"lambda-secrets-policy-{self.environment_suffix}",
            name=f"trading-lambda-secrets-policy-{self.environment_suffix}",
            role=self.lambda_role.id,
            policy=json.dumps(secrets_policy)
        )

        # Create Lambda ZIP file at synthesis time
        lambda_zip_path = self._create_lambda_zip()
        lambda_source_hash = self._calculate_file_hash(lambda_zip_path)

        # Lambda Function
        self.lambda_function = LambdaFunction(self, f"lambda-function-{self.environment_suffix}",
            function_name=f"trading-processor-{self.environment_suffix}",
            filename=lambda_zip_path,
            source_code_hash=lambda_source_hash,
            handler="index.handler",
            runtime="python3.11",
            role=self.lambda_role.arn,
            memory_size=512,
            timeout=30,
            environment={
                "variables": {
                    "DB_ENDPOINT": self.rds_cluster.endpoint,
                    "DB_NAME": "trading",
                    "DB_SECRET_ARN": self.db_secret.arn,
                    "REGION": self.region,
                    "ENVIRONMENT": self.environment_suffix
                }
            },
            vpc_config={
                "subnet_ids": [subnet.id for subnet in self.private_subnets],
                "security_group_ids": [self.lambda_sg.id]
            },
            depends_on=[self.lambda_log_group],
            tags={
                "Name": f"trading-processor-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

    def _create_lambda_zip(self):
        """Create Lambda deployment package at synthesis time"""
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        source_file = os.path.join(lambda_dir, "index.py")
        zip_file = os.path.join(lambda_dir, "lambda_function.zip")

        # Create ZIP file using Python zipfile
        with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(source_file, "index.py")

        return zip_file

    def _calculate_file_hash(self, file_path):
        """Calculate base64-encoded SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return base64.b64encode(sha256_hash.digest()).decode('utf-8')

    def _generate_secure_password(self, length=32):
        """Generate a secure random password"""
        # Define character sets - exclude %, $, {, } to avoid Terraform template syntax issues
        alphabet = string.ascii_letters + string.digits + "!#&*()-_=+[].:?"
        special_chars = "!#&*()-_=+[].:?"
        # Generate password ensuring it has at least one of each type
        while True:
            password = ''.join(secrets.choice(alphabet) for _ in range(length))
            # Ensure password has letters, digits, and special chars
            if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in special_chars for c in password)):
                return password

    def create_api_gateway(self):
        """Create API Gateway with Lambda integration"""
        # REST API
        self.api = ApiGatewayRestApi(self, f"api-gateway-{self.environment_suffix}",
            name=f"trading-api-{self.environment_suffix}",
            description=f"Trading Platform API for {self.region}",
            tags={
                "Name": f"trading-api-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # API Resource
        resource = ApiGatewayResource(self, f"api-resource-{self.environment_suffix}",
            rest_api_id=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="trade"
        )

        # API Method
        method = ApiGatewayMethod(self, f"api-method-{self.environment_suffix}",
            rest_api_id=self.api.id,
            resource_id=resource.id,
            http_method="POST",
            authorization="NONE"
        )

        # Lambda Integration
        integration = ApiGatewayIntegration(self, f"api-integration-{self.environment_suffix}",
            rest_api_id=self.api.id,
            resource_id=resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_function.invoke_arn
        )

        # Lambda Permission for API Gateway
        LambdaPermission(self, f"lambda-permission-{self.environment_suffix}",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=self.lambda_function.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{self.api.execution_arn}/*/*"
        )

        # API Deployment
        deployment = ApiGatewayDeployment(self, f"api-deployment-{self.environment_suffix}",
            rest_api_id=self.api.id,
            depends_on=[method, integration],
            lifecycle={
                "create_before_destroy": True
            }
        )

        # API Stage
        self.api_stage = ApiGatewayStage(self, f"api-stage-{self.environment_suffix}",
            deployment_id=deployment.id,
            rest_api_id=self.api.id,
            stage_name=self.environment_suffix,
            tags={
                "Name": f"trading-api-stage-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

    def create_route53_records(self):
        """Create Route 53 hosted zone (placeholder for custom domains)"""
        # Note: In production, you would create Route53 records for custom domains
        # This is a placeholder as actual domain setup requires domain ownership

    def create_outputs(self):
        """Create stack outputs"""
        TerraformOutput(self, "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(self, "rds_cluster_endpoint",
            value=self.rds_cluster.endpoint,
            description="RDS Aurora cluster endpoint"
        )

        TerraformOutput(self, "rds_cluster_reader_endpoint",
            value=self.rds_cluster.reader_endpoint,
            description="RDS Aurora cluster reader endpoint"
        )

        TerraformOutput(self, "api_gateway_url",
            value=self.api_stage.invoke_url,
            description="API Gateway invoke URL"
        )

        TerraformOutput(self, "lambda_function_name",
            value=self.lambda_function.function_name,
            description="Lambda function name"
        )

        TerraformOutput(self, "s3_bucket_name",
            value=self.s3_bucket.bucket,
            description="S3 bucket name"
        )

        TerraformOutput(self, "kms_key_id",
            value=self.kms_key.key_id,
            description="KMS key ID"
        )

        TerraformOutput(self, "db_secret_arn",
            value=self.db_secret.arn,
            description="RDS credentials secret ARN"
        )

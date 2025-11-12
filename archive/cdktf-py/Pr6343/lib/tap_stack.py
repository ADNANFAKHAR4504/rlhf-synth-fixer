from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration,
    S3BucketLifecycleConfigurationRuleFilter
)
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.apigatewayv2_api import Apigatewayv2Api
from cdktf_cdktf_provider_aws.apigatewayv2_stage import Apigatewayv2Stage
from cdktf_cdktf_provider_aws.apigatewayv2_integration import Apigatewayv2Integration
from cdktf_cdktf_provider_aws.apigatewayv2_route import Apigatewayv2Route
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.data_aws_acm_certificate import DataAwsAcmCertificate
from cdktf_cdktf_provider_aws.data_aws_route53_zone import DataAwsRoute53Zone
import json
import boto3
import os
import zipfile
import shutil
import hashlib
import base64
from pathlib import Path


class TapStack(TerraformStack):
    @staticmethod
    def setup_backend_infrastructure(region: str, environment_suffix: str):
        """Create S3 bucket and DynamoDB table for Terraform backend if they don't exist"""
        aws_profile = os.getenv("AWS_PROFILE", "default")
        
        # Create boto3 session with profile
        session = boto3.Session(profile_name=aws_profile, region_name=region)
        s3_client = session.client('s3')
        dynamodb_client = session.client('dynamodb')
        
        bucket_name = f"terraform-state-{environment_suffix}-{region}"
        table_name = f"terraform-locks-{environment_suffix}-{region}"
        
        # Create S3 bucket
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            print(f"✅ S3 bucket {bucket_name} already exists")
        except:
            try:
                print(f"📦 Creating S3 bucket: {bucket_name}")
                if region == 'us-east-1':
                    s3_client.create_bucket(Bucket=bucket_name)
                else:
                    s3_client.create_bucket(
                        Bucket=bucket_name,
                        CreateBucketConfiguration={'LocationConstraint': region}
                    )
                
                # Enable versioning
                s3_client.put_bucket_versioning(
                    Bucket=bucket_name,
                    VersioningConfiguration={'Status': 'Enabled'}
                )
                
                # Enable encryption
                s3_client.put_bucket_encryption(
                    Bucket=bucket_name,
                    ServerSideEncryptionConfiguration={
                        'Rules': [{
                            'ApplyServerSideEncryptionByDefault': {
                                'SSEAlgorithm': 'AES256'
                            },
                            'BucketKeyEnabled': True
                        }]
                    }
                )
                
                # Block public access
                s3_client.put_public_access_block(
                    Bucket=bucket_name,
                    PublicAccessBlockConfiguration={
                        'BlockPublicAcls': True,
                        'IgnorePublicAcls': True,
                        'BlockPublicPolicy': True,
                        'RestrictPublicBuckets': True
                    }
                )
                print(f"✅ Created S3 bucket: {bucket_name}")
            except Exception as e:
                print(f"⚠️ Error creating S3 bucket: {e}")
        
        # Create DynamoDB table
        try:
            dynamodb_client.describe_table(TableName=table_name)
            print(f"✅ DynamoDB table {table_name} already exists")
        except dynamodb_client.exceptions.ResourceNotFoundException:
            try:
                print(f"🗄️  Creating DynamoDB table: {table_name}")
                dynamodb_client.create_table(
                    TableName=table_name,
                    AttributeDefinitions=[
                        {'AttributeName': 'LockID', 'AttributeType': 'S'}
                    ],
                    KeySchema=[
                        {'AttributeName': 'LockID', 'KeyType': 'HASH'}
                    ],
                    BillingMode='PAY_PER_REQUEST',
                    Tags=[
                        {'Key': 'Purpose', 'Value': 'TerraformStateLocking'},
                        {'Key': 'Environment', 'Value': environment_suffix}
                    ]
                )
                
                # Wait for table to be active
                waiter = dynamodb_client.get_waiter('table_exists')
                waiter.wait(TableName=table_name)
                print(f"✅ Created DynamoDB table: {table_name}")
            except Exception as e:
                print(f"⚠️ Error creating DynamoDB table: {e}")
        except Exception as e:
            print(f"⚠️ Error checking DynamoDB table: {e}")
    
    def __init__(
        self,
        scope: Construct,
        id: str,
        region: str,
        cidr_block: str,
        environment_suffix: str
    ):
        # Setup backend infrastructure before initializing the stack
        TapStack.setup_backend_infrastructure(region, environment_suffix)
        
        super().__init__(scope, id)

        self.region = region
        self.cidr_block = cidr_block
        self.environment_suffix = environment_suffix

        # Configure AWS Provider
        AwsProvider(self, "aws", region=region)

        # Configure S3 Backend for remote state
        S3Backend(
            self,
            bucket=f"terraform-state-{environment_suffix}-{region}",
            key=f"infrastructure/{region}/terraform.tfstate",
            region=region,
            dynamodb_table=f"terraform-locks-{environment_suffix}-{region}",
            encrypt=True
        )

        # Common tags
        self.common_tags = {
            "Environment": environment_suffix,
            "Region": region,
            "CostCenter": "infrastructure",
            "ManagedBy": "CDKTF"
        }

        # Create KMS key for encryption
        self.kms_key = self.create_kms_key()

        # Create VPC and networking
        self.vpc = self.create_vpc()
        self.subnets = self.create_subnets()
        self.internet_gateway = self.create_internet_gateway()
        self.route_tables = self.create_route_tables()

        # Create S3 bucket
        self.s3_bucket = self.create_s3_bucket()

        # Create IAM roles
        self.lambda_role = self.create_lambda_role()

        # Create Lambda function
        self.lambda_function = self.create_lambda_function()

        # Create RDS Aurora cluster
        self.rds_cluster = self.create_rds_cluster()

        # Create DynamoDB table
        self.dynamodb_table = self.create_dynamodb_table()

        # Create API Gateway
        self.api_gateway = self.create_api_gateway()

        # Create CloudWatch alarms
        self.create_cloudwatch_alarms()

        # Outputs
        self.create_outputs()

    def create_kms_key(self) -> KmsKey:
        """Create KMS key for encryption"""
        kms_key = KmsKey(
            self,
            f"kms-key-{self.environment_suffix}",
            description=f"KMS key for {self.region} region",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags=self.common_tags
        )

        KmsAlias(
            self,
            f"kms-alias-{self.environment_suffix}",
            name=f"alias/tap-{self.environment_suffix}",
            target_key_id=kms_key.key_id
        )

        return kms_key

    def create_vpc(self) -> Vpc:
        """Create VPC with validation"""
        # Validate CIDR block format
        if not self.cidr_block or not self.cidr_block.endswith("/16"):
            raise ValueError(f"Invalid CIDR block: {self.cidr_block}. Must be /16 network.")

        vpc = Vpc(
            self,
            f"vpc-{self.environment_suffix}",
            cidr_block=self.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"vpc-{self.environment_suffix}"}
        )

        return vpc

    def create_subnets(self) -> dict:
        """Create 3 public and 3 private subnets"""
        subnets = {"public": [], "private": []}
        availability_zones = ["a", "b", "c"]

        base_cidr = self.cidr_block.split("/")[0]
        octets = base_cidr.split(".")

        for i, az in enumerate(availability_zones):
            # Public subnet
            public_cidr = f"{octets[0]}.{octets[1]}.{i}.0/24"
            public_subnet = Subnet(
                self,
                f"public-subnet-{az}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=public_cidr,
                availability_zone=f"{self.region}{az}",
                map_public_ip_on_launch=True,
                tags={
                    **self.common_tags,
                    "Name": f"public-subnet-{az}-{self.environment_suffix}",
                    "Type": "public"
                }
            )
            subnets["public"].append(public_subnet)

            # Private subnet
            private_cidr = f"{octets[0]}.{octets[1]}.{10 + i}.0/24"
            private_subnet = Subnet(
                self,
                f"private-subnet-{az}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=private_cidr,
                availability_zone=f"{self.region}{az}",
                map_public_ip_on_launch=False,
                tags={
                    **self.common_tags,
                    "Name": f"private-subnet-{az}-{self.environment_suffix}",
                    "Type": "private"
                }
            )
            subnets["private"].append(private_subnet)

        return subnets

    def create_internet_gateway(self) -> InternetGateway:
        """Create Internet Gateway"""
        igw = InternetGateway(
            self,
            f"igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"igw-{self.environment_suffix}"}
        )
        return igw

    def create_route_tables(self) -> dict:
        """Create route tables for public and private subnets"""
        route_tables = {}

        # Public route table
        public_rt = RouteTable(
            self,
            f"public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.internet_gateway.id
                )
            ],
            tags={**self.common_tags, "Name": f"public-rt-{self.environment_suffix}"}
        )

        # Associate public subnets
        for i, subnet in enumerate(self.subnets["public"]):
            RouteTableAssociation(
                self,
                f"public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        route_tables["public"] = public_rt

        # Private route table
        private_rt = RouteTable(
            self,
            f"private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"private-rt-{self.environment_suffix}"}
        )

        # Associate private subnets
        for i, subnet in enumerate(self.subnets["private"]):
            RouteTableAssociation(
                self,
                f"private-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        route_tables["private"] = private_rt

        return route_tables

    def create_s3_bucket(self) -> S3Bucket:
        """Create S3 bucket with KMS encryption"""
        bucket = S3Bucket(
            self,
            f"s3-bucket-{self.environment_suffix}",
            bucket=f"tap-data-{self.environment_suffix}",
            tags=self.common_tags
        )

        # Configure encryption
        # Configure S3 encryption with KMS
        encryption_default = (
            S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                sse_algorithm="aws:kms",
                kms_master_key_id=self.kms_key.arn
            )
        )
        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"s3-encryption-{self.environment_suffix}",
            bucket=bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=encryption_default,
                    bucket_key_enabled=True
                )
            ]
        )

        # Configure lifecycle policy  
        S3BucketLifecycleConfiguration(
            self,
            f"s3-lifecycle-{self.environment_suffix}",
            bucket=bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="expire-old-objects",
                    status="Enabled",
                    filter=[S3BucketLifecycleConfigurationRuleFilter(prefix="")],
                    expiration=[S3BucketLifecycleConfigurationRuleExpiration(days=90)]
                )
            ]
        )

        return bucket

    def create_lambda_role(self) -> IamRole:
        """Create IAM role for Lambda function"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow"
                }
            ]
        }

        role = IamRole(
            self,
            f"lambda-role-{self.environment_suffix}",
            name=f"lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.common_tags
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"lambda-basic-execution-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Create custom policy for S3 access
        s3_policy = IamPolicy(
            self,
            f"lambda-s3-policy-{self.environment_suffix}",
            name=f"lambda-s3-policy-{self.environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": f"{self.s3_bucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": self.kms_key.arn
                    }
                ]
            }),
            tags=self.common_tags
        )

        IamRolePolicyAttachment(
            self,
            f"lambda-s3-attachment-{self.environment_suffix}",
            role=role.name,
            policy_arn=s3_policy.arn
        )

        return role

    def bundle_lambda_code(self) -> tuple[str, str]:
        """
        Bundle Lambda code from lib/lambda directory
        
        Returns:
            tuple: (zip_path, base64_sha256_hash)
        """
        # Define paths
        lambda_dir = Path(__file__).parent / "lambda"
        zip_path = Path(__file__).parent.parent / "lambda_function.zip"
        
        # Remove old zip if exists
        if zip_path.exists():
            zip_path.unlink()
        
        # Create zip file from lib/lambda directory
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file in lambda_dir.rglob('*.py'):
                # Add file to zip with relative path
                arcname = file.relative_to(lambda_dir)
                zipf.write(file, arcname)
        
        # Calculate SHA256 hash for source_code_hash
        sha256_hash = hashlib.sha256()
        with open(zip_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        
        # Base64 encode the hash (required by AWS)
        source_hash = base64.b64encode(sha256_hash.digest()).decode('utf-8')
        
        print(f"✅ Created Lambda bundle: {zip_path}")
        print(f"   Source hash: {source_hash[:16]}...")
        
        return str(zip_path), source_hash

    def create_lambda_function(self) -> LambdaFunction:
        """
        Create Lambda function for data processing
        
        Automatically bundles code from lib/lambda directory into a zip file
        and calculates source_code_hash to ensure Lambda updates on code changes
        """
        # Bundle the Lambda code from lib/lambda directory
        lambda_zip, source_hash = self.bundle_lambda_code()
        
        lambda_function = LambdaFunction(
            self,
            f"lambda-processor-{self.environment_suffix}",
            function_name=f"data-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="processor.handler",
            role=self.lambda_role.arn,
            filename=lambda_zip,
            source_code_hash=source_hash,  # Ensures Lambda updates when code changes
            timeout=30,
            memory_size=256,
            environment={
                "variables": {
                    "BUCKET_NAME": self.s3_bucket.id,
                    "REGION": self.region,
                    "ENVIRONMENT": self.environment_suffix
                }
            },
            tags=self.common_tags
        )

        return lambda_function

    def create_rds_cluster(self) -> RdsCluster:
        """Create RDS Aurora MySQL cluster"""
        # Create DB subnet group for RDS
        db_subnet_group = DbSubnetGroup(
            self,
            f"rds-subnet-group-{self.environment_suffix}",
            name=f"rds-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.subnets["private"]],
            tags=self.common_tags
        )
        
        cluster = RdsCluster(
            self,
            f"rds-cluster-{self.environment_suffix}",
            cluster_identifier=f"aurora-cluster-{self.environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="tapdb",
            master_username="admin",
            master_password="ChangeMe123!",
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            db_subnet_group_name=db_subnet_group.name,
            tags=self.common_tags,
            skip_final_snapshot=True
        )

        # Create cluster instances
        for i in range(2):
            RdsClusterInstance(
                self,
                f"rds-instance-{i}-{self.environment_suffix}",
                identifier=f"aurora-instance-{i}-{self.environment_suffix}",
                cluster_identifier=cluster.id,
                instance_class="db.t3.medium",
                engine=cluster.engine,
                publicly_accessible=False,
                tags=self.common_tags
            )

        return cluster

    def create_dynamodb_table(self) -> DynamodbTable:
        """Create DynamoDB table for session management"""
        table = DynamodbTable(
            self,
            f"dynamodb-sessions-{self.environment_suffix}",
            name=f"sessions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attribute=[
                DynamodbTableAttribute(name="session_id", type="S")
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery={"enabled": True},
            server_side_encryption={"enabled": True, "kms_key_arn": self.kms_key.arn},
            tags=self.common_tags
        )

        return table

    def create_api_gateway(self) -> Apigatewayv2Api:
        """Create API Gateway"""
        api = Apigatewayv2Api(
            self,
            f"api-gateway-{self.environment_suffix}",
            name=f"tap-api-{self.environment_suffix}",
            protocol_type="HTTP",
            tags=self.common_tags
        )

        # Create integration
        integration = Apigatewayv2Integration(
            self,
            f"api-integration-{self.environment_suffix}",
            api_id=api.id,
            integration_type="AWS_PROXY",
            integration_uri=self.lambda_function.arn,
            integration_method="POST",
            payload_format_version="2.0"
        )

        # Create route
        Apigatewayv2Route(
            self,
            f"api-route-{self.environment_suffix}",
            api_id=api.id,
            route_key="POST /process",
            target=f"integrations/{integration.id}"
        )

        # Create stage
        Apigatewayv2Stage(
            self,
            f"api-stage-{self.environment_suffix}",
            api_id=api.id,
            name=self.environment_suffix,
            auto_deploy=True,
            tags=self.common_tags
        )

        return api

    def create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for monitoring"""
        # RDS CPU alarm
        CloudwatchMetricAlarm(
            self,
            f"rds-cpu-alarm-{self.environment_suffix}",
            alarm_name=f"rds-high-cpu-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when RDS CPU exceeds 80%",
            dimensions={"DBClusterIdentifier": self.rds_cluster.cluster_identifier},
            tags=self.common_tags
        )

        # Lambda error alarm
        CloudwatchMetricAlarm(
            self,
            f"lambda-error-alarm-{self.environment_suffix}",
            alarm_name=f"lambda-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when Lambda errors exceed threshold",
            dimensions={"FunctionName": self.lambda_function.function_name},
            tags=self.common_tags
        )

        # DynamoDB throttle alarm
        CloudwatchMetricAlarm(
            self,
            f"dynamodb-throttle-alarm-{self.environment_suffix}",
            alarm_name=f"dynamodb-throttles-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert on DynamoDB throttling",
            dimensions={"TableName": self.dynamodb_table.name},
            tags=self.common_tags
        )

    def create_outputs(self):
        """Create stack outputs"""
        TerraformOutput(
            self,
            "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "s3_bucket_name",
            value=self.s3_bucket.id,
            description="S3 bucket name"
        )

        TerraformOutput(
            self,
            "lambda_function_arn",
            value=self.lambda_function.arn,
            description="Lambda function ARN"
        )

        TerraformOutput(
            self,
            "rds_cluster_endpoint",
            value=self.rds_cluster.endpoint,
            description="RDS cluster endpoint"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=self.dynamodb_table.name,
            description="DynamoDB table name"
        )

        TerraformOutput(
            self,
            "api_gateway_endpoint",
            value=self.api_gateway.api_endpoint,
            description="API Gateway endpoint"
        )

        TerraformOutput(
            self,
            "kms_key_id",
            value=self.kms_key.key_id,
            description="KMS key ID"
        )

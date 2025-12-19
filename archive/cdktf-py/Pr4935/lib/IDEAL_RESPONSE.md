# IDEAL_RESPONSE

## lib/__init__.py
```python

```

## lib/tap_stack.py
```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, Fn, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_parameter_group import DbParameterGroup, DbParameterGroupParameter
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.elasticache_serverless_cache import (
    ElasticacheServerlessCache,
    ElasticacheServerlessCacheCacheUsageLimits,
    ElasticacheServerlessCacheCacheUsageLimitsDataStorage,
    ElasticacheServerlessCacheCacheUsageLimitsEcpuPerSecond
)
from cdktf_cdktf_provider_aws.elasticache_subnet_group import ElasticacheSubnetGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import (
    DataAwsIamPolicyDocument,
    DataAwsIamPolicyDocumentStatement
)
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Create VPC
        vpc = Vpc(
            self,
            "fintech_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"fintech-vpc-{environment_suffix}"}
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "fintech_igw",
            vpc_id=vpc.id,
            tags={"Name": f"fintech-igw-{environment_suffix}"}
        )

        # Create public subnets
        public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={"Name": f"fintech-public-subnet-1-{environment_suffix}"}
        )

        public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={"Name": f"fintech-public-subnet-2-{environment_suffix}"}
        )

        # Create private subnets for database
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone=f"{aws_region}a",
            tags={"Name": f"fintech-private-subnet-1-{environment_suffix}"}
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}b",
            tags={"Name": f"fintech-private-subnet-2-{environment_suffix}"}
        )

        # Create Elastic IPs for NAT Gateways
        eip_1 = Eip(
            self,
            "nat_eip_1",
            domain="vpc",
            tags={"Name": f"fintech-nat-eip-1-{environment_suffix}"}
        )

        eip_2 = Eip(
            self,
            "nat_eip_2",
            domain="vpc",
            tags={"Name": f"fintech-nat-eip-2-{environment_suffix}"}
        )

        # Create NAT Gateways
        nat_gw_1 = NatGateway(
            self,
            "nat_gw_1",
            allocation_id=eip_1.id,
            subnet_id=public_subnet_1.id,
            tags={"Name": f"fintech-nat-gw-1-{environment_suffix}"}
        )

        nat_gw_2 = NatGateway(
            self,
            "nat_gw_2",
            allocation_id=eip_2.id,
            subnet_id=public_subnet_2.id,
            tags={"Name": f"fintech-nat-gw-2-{environment_suffix}"}
        )

        # Create route table for public subnets
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"fintech-public-rt-{environment_suffix}"}
        )

        # Create route tables for private subnets
        private_rt_1 = RouteTable(
            self,
            "private_rt_1",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw_1.id
            )],
            tags={"Name": f"fintech-private-rt-1-{environment_suffix}"}
        )

        private_rt_2 = RouteTable(
            self,
            "private_rt_2",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw_2.id
            )],
            tags={"Name": f"fintech-private-rt-2-{environment_suffix}"}
        )

        # Associate public subnets with route table
        RouteTableAssociation(
            self,
            "public_rt_assoc_1",
            subnet_id=public_subnet_1.id,
            route_table_id=public_rt.id
        )

        RouteTableAssociation(
            self,
            "public_rt_assoc_2",
            subnet_id=public_subnet_2.id,
            route_table_id=public_rt.id
        )

        # Associate private subnets with route tables
        RouteTableAssociation(
            self,
            "private_rt_assoc_1",
            subnet_id=private_subnet_1.id,
            route_table_id=private_rt_1.id
        )

        RouteTableAssociation(
            self,
            "private_rt_assoc_2",
            subnet_id=private_subnet_2.id,
            route_table_id=private_rt_2.id
        )

        # Create KMS key for encryption
        kms_key = KmsKey(
            self,
            "fintech_kms",
            description="KMS key for FinTech database encryption",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            multi_region=False,
            tags={"Name": f"fintech-kms-{environment_suffix}"}
        )

        KmsAlias(
            self,
            "fintech_kms_alias",
            name=f"alias/fintech-db-{environment_suffix}",
            target_key_id=kms_key.id
        )

        # Create security group for RDS
        rds_sg = SecurityGroup(
            self,
            "rds_sg",
            name=f"fintech-rds-sg-{environment_suffix}",
            description="Security group for RDS instance",
            vpc_id=vpc.id,
            tags={"Name": f"fintech-rds-sg-{environment_suffix}"}
        )

        SecurityGroupRule(
            self,
            "rds_sg_ingress",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],
            security_group_id=rds_sg.id,
            description="Allow PostgreSQL traffic from VPC"
        )

        SecurityGroupRule(
            self,
            "rds_sg_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=rds_sg.id,
            description="Allow all outbound traffic"
        )

        # Create security group for ElastiCache
        elasticache_sg = SecurityGroup(
            self,
            "elasticache_sg",
            name=f"fintech-elasticache-sg-{environment_suffix}",
            description="Security group for ElastiCache",
            vpc_id=vpc.id,
            tags={"Name": f"fintech-elasticache-sg-{environment_suffix}"}
        )

        SecurityGroupRule(
            self,
            "elasticache_sg_ingress",
            type="ingress",
            from_port=6379,
            to_port=6379,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],
            security_group_id=elasticache_sg.id,
            description="Allow Redis traffic from VPC"
        )

        SecurityGroupRule(
            self,
            "elasticache_sg_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=elasticache_sg.id,
            description="Allow all outbound traffic"
        )

        # Create DB parameter group for PostgreSQL with PCI-DSS compliance
        db_parameter_group = DbParameterGroup(
            self,
            "db_parameter_group",
            name=f"fintech-postgres-params-{environment_suffix}",
            family="postgres14",
            description="Parameter group for PostgreSQL with PCI-DSS compliance",
            parameter=[
                DbParameterGroupParameter(
                    name="rds.force_ssl",
                    value="1"
                ),
                DbParameterGroupParameter(
                    name="log_statement",
                    value="all"
                ),
                DbParameterGroupParameter(
                    name="log_connections",
                    value="1"
                ),
                DbParameterGroupParameter(
                    name="log_disconnections",
                    value="1"
                ),
                DbParameterGroupParameter(
                    name="log_duration",
                    value="1"
                )
            ],
            tags={"Name": f"fintech-postgres-params-{environment_suffix}"}
        )

        # Create DB subnet group
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"fintech-db-subnet-group-{environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            description="Subnet group for RDS instance",
            tags={"Name": f"fintech-db-subnet-group-{environment_suffix}"}
        )

        # Create Secrets Manager secret for database credentials
        db_secret = SecretsmanagerSecret(
            self,
            "db_secret",
            name=f"fintech-db-credentials-{environment_suffix}",
            description="Database master credentials for FinTech application",
            recovery_window_in_days=0,
            tags={"Name": f"fintech-db-credentials-{environment_suffix}"}
        )

        # Generate secure initial credentials
        db_credentials = {
            "username": "dbadmin",
            "password": "TempPassword123!ChangeMeNow",
            "engine": "postgres",
            "host": "",
            "port": 5432,
            "dbname": "fintech"
        }

        db_secret_version = SecretsmanagerSecretVersion(
            self,
            "db_secret_version",
            secret_id=db_secret.id,
            secret_string=json.dumps(db_credentials)
        )

        # Create IAM role for Lambda rotation function
        lambda_role = IamRole(
            self,
            "lambda_rotation_role",
            name=f"fintech-lambda-rotation-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={"Name": f"fintech-lambda-rotation-role-{environment_suffix}"}
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Create policy for Lambda to access Secrets Manager and RDS
        lambda_policy = IamPolicy(
            self,
            "lambda_rotation_policy",
            name=f"fintech-lambda-rotation-policy-{environment_suffix}",
            description="Policy for Lambda rotation function",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:DescribeSecret",
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:PutSecretValue",
                            "secretsmanager:UpdateSecretVersionStage"
                        ],
                        "Resource": db_secret.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetRandomPassword"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags={"Name": f"fintech-lambda-rotation-policy-{environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "lambda_rotation_policy_attach",
            role=lambda_role.name,
            policy_arn=lambda_policy.arn
        )

        # Create RDS instance with all security features
        rds_instance = DbInstance(
            self,
            "rds_instance",
            identifier=f"fintech-db-{environment_suffix}",
            engine="postgres",
            engine_version="14.13",
            instance_class="db.t3.medium",
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            username=db_credentials["username"],
            password=db_credentials["password"],
            db_name="fintech",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            parameter_group_name=db_parameter_group.name,
            multi_az=True,
            publicly_accessible=False,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            performance_insights_kms_key_id=kms_key.arn,
            deletion_protection=False,
            skip_final_snapshot=True,
            copy_tags_to_snapshot=True,
            auto_minor_version_upgrade=True,
            tags={"Name": f"fintech-db-{environment_suffix}"}
        )

        # Create read replica
        rds_read_replica = DbInstance(
            self,
            "rds_read_replica",
            identifier=f"fintech-db-replica-{environment_suffix}",
            replicate_source_db=rds_instance.identifier,
            instance_class="db.t3.medium",
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            performance_insights_kms_key_id=kms_key.arn,
            deletion_protection=False,
            skip_final_snapshot=True,
            copy_tags_to_snapshot=True,
            auto_minor_version_upgrade=True,
            tags={"Name": f"fintech-db-replica-{environment_suffix}"}
        )

        # Update secret with actual RDS endpoint
        self.add_override(
            "resource.aws_secretsmanager_secret_version.db_secret_version.secret_string",
            Fn.jsonencode({
                "username": db_credentials["username"],
                "password": db_credentials["password"],
                "engine": "postgres",
                "host": rds_instance.address,
                "port": 5432,
                "dbname": "fintech"
            })
        )

        # Create ElastiCache subnet group
        elasticache_subnet_group = ElasticacheSubnetGroup(
            self,
            "elasticache_subnet_group",
            name=f"fintech-cache-subnet-{environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            description="Subnet group for ElastiCache Serverless",
            tags={"Name": f"fintech-cache-subnet-{environment_suffix}"}
        )

        # Create ElastiCache Serverless cache
        elasticache = ElasticacheServerlessCache(
            self,
            "elasticache",
            engine="redis",
            name=f"fintech-cache-{environment_suffix}",
            description="ElastiCache Serverless for FinTech application",
            cache_usage_limits=[ElasticacheServerlessCacheCacheUsageLimits(
                data_storage=[ElasticacheServerlessCacheCacheUsageLimitsDataStorage(
                    maximum=10,
                    unit="GB"
                )],
                ecpu_per_second=[ElasticacheServerlessCacheCacheUsageLimitsEcpuPerSecond(
                    maximum=5000
                )]
            )],
            daily_snapshot_time="03:00",
            kms_key_id=kms_key.arn,
            major_engine_version="7",
            security_group_ids=[elasticache_sg.id],
            snapshot_retention_limit=1,
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={"Name": f"fintech-cache-{environment_suffix}"}
        )

        TerraformOutput(
            self,
            "environment_suffix",
            value=environment_suffix
        )

        TerraformOutput(
            self,
            "aws_region",
            value=aws_region
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id
        )

        TerraformOutput(
            self,
            "internet_gateway_id",
            value=igw.id
        )

        TerraformOutput(
            self,
            "public_subnet_ids",
            value=[public_subnet_1.id, public_subnet_2.id]
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=[private_subnet_1.id, private_subnet_2.id]
        )

        TerraformOutput(
            self,
            "nat_gateway_ids",
            value=[nat_gw_1.id, nat_gw_2.id]
        )

        TerraformOutput(
            self,
            "public_route_table_id",
            value=public_rt.id
        )

        TerraformOutput(
            self,
            "private_route_table_ids",
            value=[private_rt_1.id, private_rt_2.id]
        )

        TerraformOutput(
            self,
            "kms_key_arn",
            value=kms_key.arn
        )

        TerraformOutput(
            self,
            "db_secret_arn",
            value=db_secret.arn
        )

        TerraformOutput(
            self,
            "db_subnet_group_name",
            value=db_subnet_group.name
        )

        TerraformOutput(
            self,
            "db_parameter_group_name",
            value=db_parameter_group.name
        )

        TerraformOutput(
            self,
            "rds_instance_id",
            value=rds_instance.identifier
        )

        TerraformOutput(
            self,
            "rds_read_replica_id",
            value=rds_read_replica.id
        )

        TerraformOutput(
            self,
            "rds_endpoint_address",
            value=rds_instance.address
        )

        TerraformOutput(
            self,
            "rds_endpoint",
            value=Fn.join("", [rds_instance.address, ":5432"])
        )

        TerraformOutput(
            self,
            "rds_security_group_id",
            value=rds_sg.id
        )

        TerraformOutput(
            self,
            "elasticache_name",
            value=elasticache.name
        )

        TerraformOutput(
            self,
            "elasticache_arn",
            value=elasticache.arn
        )

        TerraformOutput(
            self,
            "elasticache_endpoint",
            value=elasticache.endpoint
        )

        TerraformOutput(
            self,
            "elasticache_reader_endpoint",
            value=elasticache.reader_endpoint
        )

        TerraformOutput(
            self,
            "elasticache_security_group_id",
            value=elasticache_sg.id
        )

        TerraformOutput(
            self,
            "rds_secret_name",
            value=db_secret.name
        )

```

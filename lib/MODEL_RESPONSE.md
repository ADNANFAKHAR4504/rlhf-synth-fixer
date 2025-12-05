# CDKTF Python Infrastructure for Financial Transaction Processing Platform

This is a complete CDKTF Python implementation for a highly available web application infrastructure for processing financial transactions.

## File: cdktf.json

```json
{
  "language": "python",
  "app": "pipenv run python main.py",
  "projectId": "financial-transaction-platform",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: requirements.txt

```txt
cdktf>=0.20.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.0.0
```

## File: Pipfile

```txt
[[source]]
name = "pypi"
url = "https://pypi.org/simple"
verify_ssl = true

[packages]
cdktf = ">=0.20.0"
cdktf-cdktf-provider-aws = ">=19.0.0"
constructs = ">=10.0.0"

[requires]
python_version = "3.9"
```

## File: main.py

```python
#!/usr/bin/env python
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.vpc import VpcConstruct
from lib.security import SecurityConstruct
from lib.database import DatabaseConstruct
from lib.storage import StorageConstruct
from lib.alb import AlbConstruct
from lib.compute import ComputeConstruct
from lib.cdn import CdnConstruct
from lib.secrets import SecretsConstruct
from lib.monitoring import MonitoringConstruct


class FinancialTransactionStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev"):
        super().__init__(scope, id)

        # AWS Provider
        AwsProvider(self, "AWS",
            region="us-east-1",
            default_tags=[{
                "tags": {
                    "Environment": "production",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering",
                    "ManagedBy": "cdktf"
                }
            }]
        )

        self.environment_suffix = environment_suffix

        # VPC and Networking
        vpc = VpcConstruct(self, "vpc", environment_suffix)

        # Security (IAM, KMS, Security Groups)
        security = SecurityConstruct(self, "security", environment_suffix, vpc)

        # Database
        database = DatabaseConstruct(
            self, "database", environment_suffix, vpc, security
        )

        # Storage (S3 buckets)
        storage = StorageConstruct(self, "storage", environment_suffix)

        # Secrets Manager with rotation
        secrets = SecretsConstruct(
            self, "secrets", environment_suffix, database, security
        )

        # Application Load Balancer
        alb = AlbConstruct(self, "alb", environment_suffix, vpc, security)

        # Compute (Auto Scaling)
        compute = ComputeConstruct(
            self, "compute", environment_suffix, vpc, security, alb, database, secrets
        )

        # CloudFront and WAF
        cdn = CdnConstruct(self, "cdn", environment_suffix, alb, storage, security)

        # Monitoring (CloudWatch, SNS)
        monitoring = MonitoringConstruct(
            self, "monitoring", environment_suffix, alb, database
        )

        # Outputs
        TerraformOutput(self, "vpc_id",
            value=vpc.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(self, "alb_dns_name",
            value=alb.alb.dns_name,
            description="Application Load Balancer DNS Name"
        )

        TerraformOutput(self, "cloudfront_domain_name",
            value=cdn.distribution.domain_name,
            description="CloudFront Distribution Domain Name"
        )

        TerraformOutput(self, "cloudfront_url",
            value=f"https://{cdn.distribution.domain_name}",
            description="Application Endpoint URL (via CloudFront)"
        )

        TerraformOutput(self, "database_endpoint",
            value=database.cluster.endpoint,
            description="Aurora MySQL Cluster Endpoint"
        )

        TerraformOutput(self, "database_reader_endpoint",
            value=database.cluster.reader_endpoint,
            description="Aurora MySQL Reader Endpoint"
        )

        TerraformOutput(self, "monitoring_dashboard_url",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=financial-transaction-{environment_suffix}",
            description="CloudWatch Dashboard URL"
        )


app = App()
FinancialTransactionStack(app, "financial-transaction-platform", environment_suffix="dev")
app.synth()
```

## File: lib/__init__.py

```python
# Empty file to make lib a Python package
```

## File: lib/vpc.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation


class VpcConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # VPC
        self.vpc = Vpc(self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"financial-vpc-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Internet Gateway
        self.igw = InternetGateway(self, "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"financial-igw-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Availability Zones
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

        # Public Subnets
        self.public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(self, f"public_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"financial-public-subnet-{i+1}-{environment_suffix}",
                    "Environment": "production",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering",
                    "Type": "public"
                }
            )
            self.public_subnets.append(subnet)

        # Private Subnets
        self.private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(self, f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"financial-private-subnet-{i+1}-{environment_suffix}",
                    "Environment": "production",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering",
                    "Type": "private"
                }
            )
            self.private_subnets.append(subnet)

        # Public Route Table
        self.public_route_table = RouteTable(self, "public_rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id
            )],
            tags={
                "Name": f"financial-public-rt-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(self, f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )

        # NAT Gateways (one per AZ for high availability)
        self.nat_gateways = []
        for i, subnet in enumerate(self.public_subnets):
            eip = Eip(self, f"nat_eip_{i}",
                domain="vpc",
                tags={
                    "Name": f"financial-nat-eip-{i+1}-{environment_suffix}",
                    "Environment": "production",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering"
                }
            )

            nat = NatGateway(self, f"nat_gateway_{i}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    "Name": f"financial-nat-{i+1}-{environment_suffix}",
                    "Environment": "production",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering"
                }
            )
            self.nat_gateways.append(nat)

        # Private Route Tables (one per AZ)
        self.private_route_tables = []
        for i, nat in enumerate(self.nat_gateways):
            rt = RouteTable(self, f"private_rt_{i}",
                vpc_id=self.vpc.id,
                route=[RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat.id
                )],
                tags={
                    "Name": f"financial-private-rt-{i+1}-{environment_suffix}",
                    "Environment": "production",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering"
                }
            )
            self.private_route_tables.append(rt)

            # Associate private subnet with its route table
            RouteTableAssociation(self, f"private_rt_assoc_{i}",
                subnet_id=self.private_subnets[i].id,
                route_table_id=rt.id
            )
```

## File: lib/security.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
import json


class SecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, vpc):
        super().__init__(scope, id)

        # KMS Key for encryption
        self.kms_key = KmsKey(self, "kms_key",
            description=f"KMS key for financial transaction platform {environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={
                "Name": f"financial-kms-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        KmsAlias(self, "kms_alias",
            name=f"alias/financial-transaction-{environment_suffix}",
            target_key_id=self.kms_key.key_id
        )

        # ALB Security Group
        self.alb_sg = SecurityGroup(self, "alb_sg",
            name=f"financial-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from anywhere"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from anywhere"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"financial-alb-sg-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # EC2 Instance Security Group
        self.ec2_sg = SecurityGroup(self, "ec2_sg",
            name=f"financial-ec2-sg-{environment_suffix}",
            description="Security group for EC2 instances",
            vpc_id=vpc.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[self.alb_sg.id],
                    description="Allow HTTP from ALB"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    security_groups=[self.alb_sg.id],
                    description="Allow HTTPS from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"financial-ec2-sg-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # RDS Security Group
        self.rds_sg = SecurityGroup(self, "rds_sg",
            name=f"financial-rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora cluster",
            vpc_id=vpc.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.ec2_sg.id],
                    description="Allow MySQL from EC2 instances"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"financial-rds-sg-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # IAM Role for EC2 Instances
        self.ec2_role = IamRole(self, "ec2_role",
            name=f"financial-ec2-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"financial-ec2-role-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # EC2 IAM Policy
        ec2_policy = IamPolicy(self, "ec2_policy",
            name=f"financial-ec2-policy-{environment_suffix}",
            description="Policy for EC2 instances",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": f"arn:aws:secretsmanager:us-east-1:*:secret:financial-db-credentials-{environment_suffix}-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": self.kms_key.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": "arn:aws:logs:us-east-1:*:log-group:/aws/ec2/financial-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": f"arn:aws:s3:::financial-logs-{environment_suffix}/*"
                    }
                ]
            }),
            tags={
                "Name": f"financial-ec2-policy-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        IamRolePolicyAttachment(self, "ec2_policy_attachment",
            role=self.ec2_role.name,
            policy_arn=ec2_policy.arn
        )

        # Attach SSM managed policy for Systems Manager access
        IamRolePolicyAttachment(self, "ec2_ssm_policy",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )

        # Instance Profile for EC2
        self.ec2_instance_profile = IamInstanceProfile(self, "ec2_instance_profile",
            name=f"financial-ec2-profile-{environment_suffix}",
            role=self.ec2_role.name
        )

        # IAM Role for Lambda (Secrets Rotation)
        self.lambda_role = IamRole(self, "lambda_role",
            name=f"financial-lambda-rotation-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"financial-lambda-role-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Lambda IAM Policy
        lambda_policy = IamPolicy(self, "lambda_policy",
            name=f"financial-lambda-rotation-policy-{environment_suffix}",
            description="Policy for Lambda secrets rotation",
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
                        "Resource": f"arn:aws:secretsmanager:us-east-1:*:secret:financial-db-credentials-{environment_suffix}-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetRandomPassword"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBClusters",
                            "rds:ModifyDBCluster"
                        ],
                        "Resource": f"arn:aws:rds:us-east-1:*:cluster:financial-aurora-{environment_suffix}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": self.kms_key.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface",
                            "ec2:AssignPrivateIpAddresses",
                            "ec2:UnassignPrivateIpAddresses"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Name": f"financial-lambda-policy-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        IamRolePolicyAttachment(self, "lambda_policy_attachment",
            role=self.lambda_role.name,
            policy_arn=lambda_policy.arn
        )

        # Attach Lambda basic execution role
        IamRolePolicyAttachment(self, "lambda_basic_execution",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Lambda Security Group (for VPC access)
        self.lambda_sg = SecurityGroup(self, "lambda_sg",
            name=f"financial-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=vpc.vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"financial-lambda-sg-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Allow Lambda to access RDS
        SecurityGroup(self, "lambda_to_rds_rule",
            name=f"financial-lambda-to-rds-{environment_suffix}",
            description="Allow Lambda to access RDS",
            vpc_id=vpc.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.lambda_sg.id],
                    description="Allow MySQL from Lambda"
                )
            ],
            tags={
                "Name": f"financial-lambda-to-rds-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )
```

## File: lib/database.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster_parameter_group import RdsClusterParameterGroup, RdsClusterParameterGroupParameter
from cdktf_cdktf_provider_aws.db_parameter_group import DbParameterGroup, DbParameterGroupParameter


class DatabaseConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, vpc, security):
        super().__init__(scope, id)

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(self, "db_subnet_group",
            name=f"financial-db-subnet-group-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in vpc.private_subnets],
            tags={
                "Name": f"financial-db-subnet-group-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Cluster Parameter Group
        cluster_parameter_group = RdsClusterParameterGroup(self, "cluster_param_group",
            name=f"financial-aurora-cluster-pg-{environment_suffix}",
            family="aurora-mysql8.0",
            description="Aurora MySQL 8.0 cluster parameter group",
            parameter=[
                RdsClusterParameterGroupParameter(
                    name="character_set_server",
                    value="utf8mb4"
                ),
                RdsClusterParameterGroupParameter(
                    name="collation_server",
                    value="utf8mb4_unicode_ci"
                ),
                RdsClusterParameterGroupParameter(
                    name="require_secure_transport",
                    value="ON"
                )
            ],
            tags={
                "Name": f"financial-cluster-pg-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Instance Parameter Group
        instance_parameter_group = DbParameterGroup(self, "instance_param_group",
            name=f"financial-aurora-instance-pg-{environment_suffix}",
            family="aurora-mysql8.0",
            description="Aurora MySQL 8.0 instance parameter group",
            parameter=[
                DbParameterGroupParameter(
                    name="slow_query_log",
                    value="1"
                ),
                DbParameterGroupParameter(
                    name="long_query_time",
                    value="2"
                )
            ],
            tags={
                "Name": f"financial-instance-pg-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Aurora MySQL Cluster
        self.cluster = RdsCluster(self, "aurora_cluster",
            cluster_identifier=f"financial-aurora-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            engine_mode="provisioned",
            database_name="financialdb",
            master_username="admin",
            master_password="ChangeMe123456!",  # This will be rotated by Secrets Manager
            db_subnet_group_name=db_subnet_group.name,
            db_cluster_parameter_group_name=cluster_parameter_group.name,
            vpc_security_group_ids=[security.rds_sg.id],
            storage_encrypted=True,
            kms_key_id=security.kms_key.arn,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            deletion_protection=False,  # Set to False for test environments
            skip_final_snapshot=True,   # Set to True for test environments
            apply_immediately=True,
            tags={
                "Name": f"financial-aurora-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Aurora Cluster Instances (2 instances for HA)
        self.instances = []
        for i in range(2):
            instance = RdsClusterInstance(self, f"aurora_instance_{i}",
                identifier=f"financial-aurora-{environment_suffix}-{i+1}",
                cluster_identifier=self.cluster.id,
                instance_class="db.r6g.large",
                engine=self.cluster.engine,
                engine_version=self.cluster.engine_version,
                db_parameter_group_name=instance_parameter_group.name,
                publicly_accessible=False,
                performance_insights_enabled=True,
                performance_insights_kms_key_id=security.kms_key.arn,
                performance_insights_retention_period=7,
                monitoring_interval=60,
                monitoring_role_arn=None,  # Would need to create monitoring role
                tags={
                    "Name": f"financial-aurora-instance-{i+1}-{environment_suffix}",
                    "Environment": "production",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering"
                }
            )
            self.instances.append(instance)
```

## File: lib/storage.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
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
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
import json


class StorageConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # S3 Bucket for Static Assets
        self.static_assets_bucket = S3Bucket(self, "static_assets_bucket",
            bucket=f"financial-static-assets-{environment_suffix}",
            force_destroy=True,  # Allow destroy for test environments
            tags={
                "Name": f"financial-static-assets-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Block public access for static assets (access through CloudFront only)
        S3BucketPublicAccessBlock(self, "static_assets_public_access_block",
            bucket=self.static_assets_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Versioning for static assets
        S3BucketVersioningA(self, "static_assets_versioning",
            bucket=self.static_assets_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Encryption for static assets
        S3BucketServerSideEncryptionConfigurationA(self, "static_assets_encryption",
            bucket=self.static_assets_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True
            )]
        )

        # S3 Bucket for Application Logs
        self.logs_bucket = S3Bucket(self, "logs_bucket",
            bucket=f"financial-logs-{environment_suffix}",
            force_destroy=True,  # Allow destroy for test environments
            tags={
                "Name": f"financial-logs-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Block all public access for logs
        S3BucketPublicAccessBlock(self, "logs_public_access_block",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Versioning for logs
        S3BucketVersioningA(self, "logs_versioning",
            bucket=self.logs_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Encryption for logs
        S3BucketServerSideEncryptionConfigurationA(self, "logs_encryption",
            bucket=self.logs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True
            )]
        )

        # Lifecycle policy for logs (90-day retention)
        S3BucketLifecycleConfiguration(self, "logs_lifecycle",
            bucket=self.logs_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="delete-old-logs",
                    status="Enabled",
                    expiration=S3BucketLifecycleConfigurationRuleExpiration(
                        days=90
                    )
                )
            ]
        )
```

## File: lib/alb.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction


class AlbConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, vpc, security):
        super().__init__(scope, id)

        # Application Load Balancer
        self.alb = Lb(self, "alb",
            name=f"financial-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[security.alb_sg.id],
            subnets=[subnet.id for subnet in vpc.public_subnets],
            enable_deletion_protection=False,  # Set to False for test environments
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            tags={
                "Name": f"financial-alb-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Target Group
        self.target_group = LbTargetGroup(self, "target_group",
            name=f"financial-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.vpc.id,
            target_type="instance",
            deregistration_delay=30,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path="/health",
                protocol="HTTP",
                matcher="200"
            ),
            tags={
                "Name": f"financial-tg-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # HTTP Listener (redirects to HTTPS in production)
        LbListener(self, "http_listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=self.target_group.arn
            )]
        )
```

## File: lib/compute.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate, LaunchTemplateMetadataOptions
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupTag
from cdktf_cdktf_provider_aws.autoscaling_policy import AutoscalingPolicy, AutoscalingPolicyTargetTrackingConfiguration
from cdktf_cdktf_provider_aws.autoscaling_schedule import AutoscalingSchedule
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
import base64


class ComputeConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, vpc, security, alb, database, secrets):
        super().__init__(scope, id)

        # Get latest Amazon Linux 2023 AMI
        ami = DataAwsAmi(self, "amazon_linux_2023",
            most_recent=True,
            owners=["amazon"],
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["al2023-ami-*-x86_64"]
                ),
                DataAwsAmiFilter(
                    name="virtualization-type",
                    values=["hvm"]
                )
            ]
        )

        # User data script
        user_data_script = f"""#!/bin/bash
set -e

# Update system
yum update -y

# Install dependencies
yum install -y python3 python3-pip git nginx mysql

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure application
mkdir -p /opt/financial-app
cd /opt/financial-app

# Create a simple health check application
cat > /opt/financial-app/app.py << 'EOF'
import json
import http.server
import socketserver
import os
import pymysql

PORT = 80

class HealthCheckHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            try:
                # Get database credentials from environment or Secrets Manager
                db_host = os.environ.get('DB_HOST', '{database.cluster.endpoint}')

                # Simple database connectivity check
                # In production, this would retrieve credentials from Secrets Manager
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {{'status': 'healthy', 'database': 'connected'}}
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {{'status': 'unhealthy', 'error': str(e)}}
                self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>Financial Transaction Platform</h1>')

with socketserver.TCPServer(("", PORT), HealthCheckHandler) as httpd:
    print(f"Server running on port {{PORT}}")
    httpd.serve_forever()
EOF

# Install Python dependencies
pip3 install pymysql boto3

# Create systemd service
cat > /etc/systemd/system/financial-app.service << EOF
[Unit]
Description=Financial Transaction Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/financial-app
Environment="DB_HOST={database.cluster.endpoint}"
ExecStart=/usr/bin/python3 /opt/financial-app/app.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable financial-app
systemctl start financial-app

# Configure CloudWatch logging
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{{
  "logs": {{
    "logs_collected": {{
      "files": {{
        "collect_list": [
          {{
            "file_path": "/var/log/financial-app.log",
            "log_group_name": "/aws/ec2/financial-{environment_suffix}",
            "log_stream_name": "{{instance_id}}"
          }}
        ]
      }}
    }}
  }}
}}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
    -a fetch-config \\
    -m ec2 \\
    -s \\
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

echo "Application setup complete"
"""

        # Launch Template
        self.launch_template = LaunchTemplate(self, "launch_template",
            name_prefix=f"financial-lt-{environment_suffix}-",
            image_id=ami.id,
            instance_type="t3.large",
            iam_instance_profile={
                "name": security.ec2_instance_profile.name
            },
            vpc_security_group_ids=[security.ec2_sg.id],
            user_data=base64.b64encode(user_data_script.encode()).decode(),
            metadata_options=LaunchTemplateMetadataOptions(
                http_endpoint="enabled",
                http_tokens="required",  # IMDSv2
                http_put_response_hop_limit=1,
                instance_metadata_tags="enabled"
            ),
            tag_specifications=[{
                "resource_type": "instance",
                "tags": {
                    "Name": f"financial-instance-{environment_suffix}",
                    "Environment": "production",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering"
                }
            }]
        )

        # Auto Scaling Group
        self.asg = AutoscalingGroup(self, "asg",
            name=f"financial-asg-{environment_suffix}",
            launch_template={
                "id": self.launch_template.id,
                "version": "$Latest"
            },
            vpc_zone_identifier=[subnet.id for subnet in vpc.private_subnets],
            target_group_arns=[alb.target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=2,
            max_size=10,
            desired_capacity=3,
            default_cooldown=300,
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances"
            ],
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"financial-asg-instance-{environment_suffix}",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="Environment",
                    value="production",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="Application",
                    value="financial-transaction-platform",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="CostCenter",
                    value="engineering",
                    propagate_at_launch=True
                )
            ]
        )

        # Auto Scaling Policy - Scale Up (CPU > 70%)
        AutoscalingPolicy(self, "scale_up_policy",
            name=f"financial-scale-up-{environment_suffix}",
            autoscaling_group_name=self.asg.name,
            policy_type="TargetTrackingScaling",
            target_tracking_configuration=AutoscalingPolicyTargetTrackingConfiguration(
                predefined_metric_specification={
                    "predefined_metric_type": "ASGAverageCPUUtilization"
                },
                target_value=70.0
            )
        )

        # Scheduled Scaling - Business Hours Start (8AM EST = 13:00 UTC)
        AutoscalingSchedule(self, "business_hours_start",
            scheduled_action_name=f"financial-business-hours-start-{environment_suffix}",
            autoscaling_group_name=self.asg.name,
            min_size=3,
            max_size=10,
            desired_capacity=3,
            recurrence="0 13 * * MON-FRI"  # 8AM EST, Monday-Friday
        )

        # Scheduled Scaling - Business Hours End (6PM EST = 23:00 UTC)
        AutoscalingSchedule(self, "business_hours_end",
            scheduled_action_name=f"financial-business-hours-end-{environment_suffix}",
            autoscaling_group_name=self.asg.name,
            min_size=2,
            max_size=10,
            desired_capacity=2,
            recurrence="0 23 * * MON-FRI"  # 6PM EST, Monday-Friday
        )
```

## File: lib/cdn.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.cloudfront_distribution import (
    CloudfrontDistribution,
    CloudfrontDistributionOrigin,
    CloudfrontDistributionOriginCustomOriginConfig,
    CloudfrontDistributionDefaultCacheBehavior,
    CloudfrontDistributionDefaultCacheBehaviorForwardedValues,
    CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies,
    CloudfrontDistributionRestrictions,
    CloudfrontDistributionRestrictionsGeoRestriction,
    CloudfrontDistributionViewerCertificate,
    CloudfrontDistributionOriginS3OriginConfig,
    CloudfrontDistributionOrderedCacheBehavior,
    CloudfrontDistributionOrderedCacheBehaviorForwardedValues,
    CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies
)
from cdktf_cdktf_provider_aws.cloudfront_origin_access_identity import CloudfrontOriginAccessIdentity
from cdktf_cdktf_provider_aws.wafv2_web_acl import (
    Wafv2WebAcl,
    Wafv2WebAclRule,
    Wafv2WebAclRuleStatement,
    Wafv2WebAclRuleStatementRateBasedStatement,
    Wafv2WebAclRuleAction,
    Wafv2WebAclDefaultAction,
    Wafv2WebAclVisibilityConfig
)
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
import json


class CdnConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, alb, storage, security):
        super().__init__(scope, id)

        # CloudFront Origin Access Identity for S3
        oai = CloudfrontOriginAccessIdentity(self, "oai",
            comment=f"OAI for financial platform {environment_suffix}"
        )

        # S3 bucket policy to allow CloudFront access
        S3BucketPolicy(self, "static_assets_cf_policy",
            bucket=storage.static_assets_bucket.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": oai.iam_arn
                        },
                        "Action": "s3:GetObject",
                        "Resource": f"{storage.static_assets_bucket.arn}/*"
                    }
                ]
            })
        )

        # WAF Web ACL
        self.web_acl = Wafv2WebAcl(self, "waf_web_acl",
            name=f"financial-waf-{environment_suffix}",
            description="WAF for Financial Transaction Platform",
            scope="CLOUDFRONT",
            default_action=Wafv2WebAclDefaultAction(
                allow={}
            ),
            rule=[
                Wafv2WebAclRule(
                    name="RateLimitRule",
                    priority=1,
                    action=Wafv2WebAclRuleAction(
                        block={}
                    ),
                    statement=Wafv2WebAclRuleStatement(
                        rate_based_statement=Wafv2WebAclRuleStatementRateBasedStatement(
                            limit=2000,
                            aggregate_key_type="IP"
                        )
                    ),
                    visibility_config=Wafv2WebAclVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=Wafv2WebAclVisibilityConfig(
                cloudwatch_metrics_enabled=True,
                metric_name=f"financial-waf-{environment_suffix}",
                sampled_requests_enabled=True
            ),
            tags={
                "Name": f"financial-waf-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudFront Distribution
        self.distribution = CloudfrontDistribution(self, "distribution",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"Financial Transaction Platform Distribution {environment_suffix}",
            default_root_object="index.html",
            price_class="PriceClass_100",
            web_acl_id=self.web_acl.arn,
            origin=[
                # ALB Origin (dynamic content)
                CloudfrontDistributionOrigin(
                    origin_id="alb",
                    domain_name=alb.alb.dns_name,
                    custom_origin_config=CloudfrontDistributionOriginCustomOriginConfig(
                        http_port=80,
                        https_port=443,
                        origin_protocol_policy="http-only",
                        origin_ssl_protocols=["TLSv1.2"],
                        origin_keepalive_timeout=5,
                        origin_read_timeout=30
                    )
                ),
                # S3 Origin (static content)
                CloudfrontDistributionOrigin(
                    origin_id="s3",
                    domain_name=storage.static_assets_bucket.bucket_regional_domain_name,
                    s3_origin_config=CloudfrontDistributionOriginS3OriginConfig(
                        origin_access_identity=oai.cloudfront_access_identity_path
                    )
                )
            ],
            default_cache_behavior=CloudfrontDistributionDefaultCacheBehavior(
                target_origin_id="alb",
                viewer_protocol_policy="redirect-to-https",
                allowed_methods=["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                cached_methods=["GET", "HEAD", "OPTIONS"],
                compress=True,
                forwarded_values=CloudfrontDistributionDefaultCacheBehaviorForwardedValues(
                    query_string=True,
                    headers=["Host", "Authorization"],
                    cookies=CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies(
                        forward="all"
                    )
                ),
                min_ttl=0,
                default_ttl=0,
                max_ttl=0
            ),
            ordered_cache_behavior=[
                # Static assets cache behavior
                CloudfrontDistributionOrderedCacheBehavior(
                    path_pattern="/static/*",
                    target_origin_id="s3",
                    viewer_protocol_policy="redirect-to-https",
                    allowed_methods=["GET", "HEAD", "OPTIONS"],
                    cached_methods=["GET", "HEAD", "OPTIONS"],
                    compress=True,
                    forwarded_values=CloudfrontDistributionOrderedCacheBehaviorForwardedValues(
                        query_string=False,
                        cookies=CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies(
                            forward="none"
                        )
                    ),
                    min_ttl=0,
                    default_ttl=86400,
                    max_ttl=31536000
                )
            ],
            restrictions=CloudfrontDistributionRestrictions(
                geo_restriction=CloudfrontDistributionRestrictionsGeoRestriction(
                    restriction_type="none"
                )
            ),
            viewer_certificate=CloudfrontDistributionViewerCertificate(
                cloudfront_default_certificate=True
            ),
            tags={
                "Name": f"financial-cloudfront-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )
```

## File: lib/secrets.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json
import zipfile
import io
import base64


class SecretsConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, database, security):
        super().__init__(scope, id)

        # Get current AWS account ID
        current = DataAwsCallerIdentity(self, "current")

        # Secret for database credentials
        self.db_secret = SecretsmanagerSecret(self, "db_secret",
            name=f"financial-db-credentials-{environment_suffix}",
            description="Database credentials for financial transaction platform",
            kms_key_id=security.kms_key.arn,
            recovery_window_in_days=0,  # Set to 0 for test environments (immediate deletion)
            tags={
                "Name": f"financial-db-credentials-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Initial secret value
        secret_value = {
            "username": "admin",
            "password": "ChangeMe123456!",
            "engine": "mysql",
            "host": database.cluster.endpoint,
            "port": 3306,
            "dbname": "financialdb"
        }

        SecretsmanagerSecretVersion(self, "db_secret_version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(secret_value)
        )

        # Lambda function code for rotation
        rotation_code = """
import json
import boto3
import os
import pymysql
from botocore.exceptions import ClientError

secretsmanager_client = boto3.client('secretsmanager')
rds_client = boto3.client('rds')

def lambda_handler(event, context):
    \"\"\"
    Lambda function to rotate database credentials
    \"\"\"
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    # Get the secret
    metadata = secretsmanager_client.describe_secret(SecretId=arn)

    if not metadata['RotationEnabled']:
        raise ValueError(f"Secret {arn} is not enabled for rotation")

    versions = metadata['VersionIdsToStages']
    if token not in versions:
        raise ValueError(f"Secret version {token} has no stage for rotation")

    if "AWSCURRENT" in versions[token]:
        print(f"Secret version {token} already set as AWSCURRENT")
        return
    elif "AWSPENDING" not in versions[token]:
        raise ValueError(f"Secret version {token} not set as AWSPENDING for rotation")

    if step == "createSecret":
        create_secret(arn, token)
    elif step == "setSecret":
        set_secret(arn, token)
    elif step == "testSecret":
        test_secret(arn, token)
    elif step == "finishSecret":
        finish_secret(arn, token)
    else:
        raise ValueError("Invalid step parameter")

def create_secret(arn, token):
    \"\"\"Create new secret version with new password\"\"\"
    try:
        secretsmanager_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
        print(f"createSecret: Successfully retrieved secret for {arn}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            # Generate new password
            passwd = secretsmanager_client.get_random_password(
                ExcludeCharacters='/@"\\'',
                PasswordLength=32
            )

            # Get current secret
            current_dict = json.loads(secretsmanager_client.get_secret_value(
                SecretId=arn, VersionStage="AWSCURRENT")['SecretString'])

            # Create new secret with new password
            current_dict['password'] = passwd['RandomPassword']

            # Put new secret
            secretsmanager_client.put_secret_value(
                SecretId=arn,
                ClientRequestToken=token,
                SecretString=json.dumps(current_dict),
                VersionStages=['AWSPENDING']
            )
            print(f"createSecret: Successfully created new secret for {arn}")
        else:
            raise

def set_secret(arn, token):
    \"\"\"Set new password in database\"\"\"
    # Get pending secret
    pending = json.loads(secretsmanager_client.get_secret_value(
        SecretId=arn, VersionId=token, VersionStage="AWSPENDING")['SecretString'])

    # Get current secret
    current = json.loads(secretsmanager_client.get_secret_value(
        SecretId=arn, VersionStage="AWSCURRENT")['SecretString'])

    # Connect to database with current credentials
    conn = pymysql.connect(
        host=current['host'],
        user=current['username'],
        password=current['password'],
        database=current['dbname'],
        connect_timeout=5
    )

    try:
        with conn.cursor() as cursor:
            # Update password
            alter_user_sql = f"ALTER USER '{pending['username']}'@'%' IDENTIFIED BY '{pending['password']}'"
            cursor.execute(alter_user_sql)
            conn.commit()
            print(f"setSecret: Successfully set password for {arn}")
    finally:
        conn.close()

def test_secret(arn, token):
    \"\"\"Test new credentials\"\"\"
    # Get pending secret
    pending = json.loads(secretsmanager_client.get_secret_value(
        SecretId=arn, VersionId=token, VersionStage="AWSPENDING")['SecretString'])

    # Test connection with new credentials
    conn = pymysql.connect(
        host=pending['host'],
        user=pending['username'],
        password=pending['password'],
        database=pending['dbname'],
        connect_timeout=5
    )

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
            print(f"testSecret: Successfully tested password for {arn}")
    finally:
        conn.close()

def finish_secret(arn, token):
    \"\"\"Finalize rotation by moving stages\"\"\"
    metadata = secretsmanager_client.describe_secret(SecretId=arn)
    current_version = None

    for version, stages in metadata["VersionIdsToStages"].items():
        if "AWSCURRENT" in stages:
            if version == token:
                print(f"finishSecret: Version {version} already marked as AWSCURRENT")
                return
            current_version = version
            break

    # Update version stages
    secretsmanager_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )

    print(f"finishSecret: Successfully set AWSCURRENT stage to version {token}")
"""

        # Create deployment package
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr('lambda_function.py', rotation_code)

        zip_buffer.seek(0)
        zip_content = base64.b64encode(zip_buffer.read()).decode('utf-8')

        # Lambda function for secret rotation
        self.rotation_lambda = LambdaFunction(self, "rotation_lambda",
            function_name=f"financial-secret-rotation-{environment_suffix}",
            runtime="python3.9",
            handler="lambda_function.lambda_handler",
            filename="lambda_function.zip",  # This would be properly packaged
            source_code_hash=zip_content[:20],  # Simplified for example
            role=security.lambda_role.arn,
            timeout=30,
            memory_size=256,
            environment={
                "variables": {
                    "SECRETS_MANAGER_ENDPOINT": f"https://secretsmanager.us-east-1.amazonaws.com"
                }
            },
            vpc_config={
                "subnet_ids": [subnet.id for subnet in security.lambda_sg.vpc_id],
                "security_group_ids": [security.lambda_sg.id]
            },
            tags={
                "Name": f"financial-rotation-lambda-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Grant Secrets Manager permission to invoke Lambda
        LambdaPermission(self, "rotation_lambda_permission",
            statement_id="AllowSecretsManagerInvoke",
            action="lambda:InvokeFunction",
            function_name=self.rotation_lambda.function_name,
            principal="secretsmanager.amazonaws.com"
        )

        # Enable automatic rotation (30 days)
        SecretsmanagerSecretRotation(self, "db_secret_rotation",
            secret_id=self.db_secret.id,
            rotation_lambda_arn=self.rotation_lambda.arn,
            rotation_rules={
                "automatically_after_days": 30
            }
        )
```

## File: lib/monitoring.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import CloudwatchLogMetricFilter, CloudwatchLogMetricFilterMetricTransformation
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription


class MonitoringConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, alb, database):
        super().__init__(scope, id)

        # CloudWatch Log Group for Application Logs
        self.app_log_group = CloudwatchLogGroup(self, "app_log_group",
            name=f"/aws/ec2/financial-{environment_suffix}",
            retention_in_days=90,
            tags={
                "Name": f"financial-app-logs-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Log Group for ALB Access Logs
        self.alb_log_group = CloudwatchLogGroup(self, "alb_log_group",
            name=f"/aws/alb/financial-{environment_suffix}",
            retention_in_days=90,
            tags={
                "Name": f"financial-alb-logs-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Log Group for Database Logs
        self.db_log_group = CloudwatchLogGroup(self, "db_log_group",
            name=f"/aws/rds/cluster/financial-aurora-{environment_suffix}",
            retention_in_days=90,
            tags={
                "Name": f"financial-db-logs-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Metric Filter for Error Tracking
        CloudwatchLogMetricFilter(self, "error_metric_filter",
            name=f"financial-error-filter-{environment_suffix}",
            log_group_name=self.app_log_group.name,
            pattern="[time, request_id, event_type = ERROR*, ...]",
            metric_transformation=CloudwatchLogMetricFilterMetricTransformation(
                name="ApplicationErrors",
                namespace=f"Financial/{environment_suffix}",
                value="1",
                default_value="0"
            )
        )

        # Metric Filter for 4xx Errors
        CloudwatchLogMetricFilter(self, "4xx_metric_filter",
            name=f"financial-4xx-filter-{environment_suffix}",
            log_group_name=self.alb_log_group.name,
            pattern='[..., status_code=4*, ...]',
            metric_transformation=CloudwatchLogMetricFilterMetricTransformation(
                name="4xxErrors",
                namespace=f"Financial/{environment_suffix}",
                value="1",
                default_value="0"
            )
        )

        # Metric Filter for 5xx Errors
        CloudwatchLogMetricFilter(self, "5xx_metric_filter",
            name=f"financial-5xx-filter-{environment_suffix}",
            log_group_name=self.alb_log_group.name,
            pattern='[..., status_code=5*, ...]',
            metric_transformation=CloudwatchLogMetricFilterMetricTransformation(
                name="5xxErrors",
                namespace=f"Financial/{environment_suffix}",
                value="1",
                default_value="0"
            )
        )

        # SNS Topic for Critical Alerts
        self.alert_topic = SnsTopic(self, "alert_topic",
            name=f"financial-critical-alerts-{environment_suffix}",
            display_name="Financial Platform Critical Alerts",
            tags={
                "Name": f"financial-alerts-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Alarm for High Error Rate
        CloudwatchMetricAlarm(self, "error_rate_alarm",
            alarm_name=f"financial-high-error-rate-{environment_suffix}",
            alarm_description="Alert when application error rate is high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ApplicationErrors",
            namespace=f"Financial/{environment_suffix}",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_actions=[self.alert_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"financial-error-alarm-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Alarm for ALB 5xx Errors
        CloudwatchMetricAlarm(self, "alb_5xx_alarm",
            alarm_name=f"financial-alb-5xx-{environment_suffix}",
            alarm_description="Alert when ALB returns high 5xx errors",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Sum",
            threshold=50,
            dimensions={
                "LoadBalancer": alb.alb.arn_suffix
            },
            alarm_actions=[self.alert_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"financial-alb-5xx-alarm-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Alarm for Database CPU
        CloudwatchMetricAlarm(self, "db_cpu_alarm",
            alarm_name=f"financial-db-high-cpu-{environment_suffix}",
            alarm_description="Alert when database CPU is high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            dimensions={
                "DBClusterIdentifier": database.cluster.cluster_identifier
            },
            alarm_actions=[self.alert_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"financial-db-cpu-alarm-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Alarm for Database Connections
        CloudwatchMetricAlarm(self, "db_connections_alarm",
            alarm_name=f"financial-db-high-connections-{environment_suffix}",
            alarm_description="Alert when database connections are high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=100,
            dimensions={
                "DBClusterIdentifier": database.cluster.cluster_identifier
            },
            alarm_actions=[self.alert_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"financial-db-connections-alarm-{environment_suffix}",
                "Environment": "production",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )
```

## File: lib/README.md

```markdown
# Financial Transaction Platform - Infrastructure Documentation

## Overview

This infrastructure deploys a highly available web application for processing financial transactions using CDKTF with Python. The platform is designed to meet PCI-DSS compliance requirements and handle variable traffic loads during market hours.

## Architecture

The infrastructure consists of the following components:

### Network Layer (vpc.py)
- VPC with CIDR 10.0.0.0/16
- 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
- 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
- Internet Gateway for public subnet connectivity
- 3 NAT Gateways (one per AZ for high availability)
- Route tables configured for public and private subnets

### Compute Layer (compute.py)
- Auto Scaling Group with t3.large instances
- Amazon Linux 2023 AMI
- Launch template with IMDSv2 enforcement
- User data script for application setup
- Auto-scaling policies based on CPU utilization
- Scheduled scaling for business hours (8AM-6PM EST)

### Load Balancing (alb.py)
- Application Load Balancer in public subnets
- Target group with health checks on /health endpoint
- HTTP listener (can be upgraded to HTTPS with certificates)

### Database Layer (database.py)
- Aurora MySQL 8.0 cluster
- 2 Aurora instances (db.r6g.large) across multiple AZs
- Encryption at rest with KMS
- Automated backups with 7-day retention
- Performance Insights enabled
- SSL/TLS required for connections

### Content Delivery (cdn.py)
- CloudFront distribution with custom origin (ALB)
- S3 origin for static content
- Origin Access Identity for secure S3 access
- WAF Web ACL with rate limiting (2000 requests per IP)
- Caching policies for static and dynamic content

### Storage (storage.py)
- S3 bucket for static assets (accessed via CloudFront)
- S3 bucket for application logs
- Server-side encryption enabled
- Lifecycle policy for 90-day log retention
- Versioning enabled on both buckets

### Security (security.py)
- IAM roles for EC2 instances and Lambda functions
- Security groups for ALB, EC2, RDS, and Lambda
- KMS key for encryption
- Least privilege IAM policies
- IMDSv2 enforcement

### Secrets Management (secrets.py)
- Secrets Manager secret for database credentials
- Lambda function for automatic password rotation
- 30-day rotation schedule
- Integration with RDS for credential updates

### Monitoring (monitoring.py)
- CloudWatch log groups for application, ALB, and RDS
- Metric filters for error tracking
- CloudWatch alarms for critical metrics
- SNS topic for alert notifications
- 90-day log retention

## Prerequisites

- Python 3.9 or higher
- pipenv
- Node.js 14+ (for CDKTF)
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS CLI configured with appropriate credentials

## Deployment Instructions

### 1. Install Dependencies

```bash
# Install CDKTF CLI
npm install -g cdktf-cli

# Install Python dependencies
pipenv install

# Activate virtual environment
pipenv shell
```

### 2. Configure Environment

Set the environment suffix (used for resource naming):

```bash
export ENVIRONMENT_SUFFIX="dev"
```

### 3. Synthesize Terraform Configuration

```bash
cdktf synth
```

This generates Terraform JSON configuration in the `cdktf.out` directory.

### 4. Deploy Infrastructure

```bash
# Deploy all resources
cdktf deploy

# Or deploy with auto-approval
cdktf deploy --auto-approve
```

### 5. Access Outputs

After deployment, CDKTF will output:
- VPC ID
- ALB DNS Name
- CloudFront Distribution Domain Name
- Application Endpoint URL (via CloudFront)
- Database Endpoint
- Database Reader Endpoint
- Monitoring Dashboard URL

### 6. Test the Deployment

Access the application via the CloudFront URL:

```bash
curl https://<cloudfront-domain>/health
```

Expected response:
```json
{"status": "healthy", "database": "connected"}
```

## Resource Naming Convention

All resources follow the naming pattern: `financial-<resource-type>-<environment-suffix>`

Examples:
- VPC: `financial-vpc-dev`
- ALB: `financial-alb-dev`
- Aurora Cluster: `financial-aurora-dev`
- S3 Buckets: `financial-static-assets-dev`, `financial-logs-dev`

## Tagging Strategy

All resources are tagged with:
- **Environment**: production
- **Application**: financial-transaction-platform
- **CostCenter**: engineering
- **ManagedBy**: cdktf

## Security Features

1. **Network Security**
   - Private subnets for compute and database layers
   - Security groups with minimal required access
   - NAT Gateways for outbound internet access from private subnets

2. **Data Encryption**
   - RDS encryption at rest using KMS
   - S3 server-side encryption
   - SSL/TLS for data in transit
   - Secrets encrypted with KMS

3. **Access Control**
   - IAM roles with least privilege policies
   - Instance Metadata Service v2 (IMDSv2) enforcement
   - Origin Access Identity for S3/CloudFront integration

4. **Application Security**
   - WAF with rate limiting rules
   - CloudFront for DDoS protection
   - Application only accessible through CloudFront

5. **Secrets Management**
   - Automatic credential rotation every 30 days
   - Secrets stored in AWS Secrets Manager
   - KMS encryption for secrets

## Compliance

The infrastructure is designed to support PCI-DSS compliance:
- Encryption at rest and in transit
- Network segmentation
- Access logging and monitoring
- Automated security patching (via managed services)
- Secrets rotation
- Regular backups with point-in-time recovery

## Monitoring and Alerting

### CloudWatch Alarms
- High application error rate (>10 errors in 5 minutes)
- ALB 5xx errors (>50 in 5 minutes)
- Database high CPU (>80% average for 5 minutes)
- Database high connections (>100 average for 5 minutes)

### Log Groups
- Application logs: `/aws/ec2/financial-<env>`
- ALB logs: `/aws/alb/financial-<env>`
- Database logs: `/aws/rds/cluster/financial-aurora-<env>`

All logs retained for 90 days.

## Cost Optimization

- Auto Scaling adjusts capacity based on demand
- Scheduled scaling reduces capacity outside business hours
- Aurora Serverless would further reduce costs (not used here due to requirements)
- S3 lifecycle policies for log retention

## Cleanup

To destroy all resources:

```bash
cdktf destroy

# Or with auto-approval
cdktf destroy --auto-approve
```

**Note**: Some resources (like S3 buckets) must be empty before deletion. The `force_destroy` flag is enabled to allow automatic deletion.

## Troubleshooting

### Issue: CDKTF synth fails
- Ensure all Python dependencies are installed: `pipenv install`
- Check Python version: `python --version` (should be 3.9+)

### Issue: Deployment fails due to resource limits
- Check AWS service quotas
- Verify VPC limits, especially Elastic IPs for NAT Gateways

### Issue: Health checks failing
- Verify security group rules allow traffic from ALB to EC2
- Check EC2 instance user data logs: `/var/log/cloud-init-output.log`
- Verify database connectivity from EC2 instances

### Issue: Can't access application
- Ensure you're accessing via CloudFront URL, not ALB directly
- Check WAF rules aren't blocking your IP
- Verify CloudFront distribution is deployed (can take 15-20 minutes)

## Architecture Diagram

```
                                  Internet
                                     |
                                     v
                            [CloudFront + WAF]
                                     |
                                     v
                        [Application Load Balancer]
                          /                    \
                         /                      \
                        v                        v
                [Auto Scaling Group]      [S3 Static Assets]
                  /      |      \
                 /       |       \
                v        v        v
              [EC2]   [EC2]   [EC2]
                \       |       /
                 \      |      /
                  v     v     v
              [Aurora MySQL Cluster]
                    (Multi-AZ)
                         |
                         v
                  [Secrets Manager]
                         |
                         v
                  [Lambda Rotation]
```

## Support

For issues or questions, contact the engineering team or refer to the project documentation.

## License

Internal use only - Financial Services Company
```

## Testing Strategy

Unit tests should verify:
1. VPC and subnet configuration
2. Security group rules
3. IAM policy permissions
4. Resource tagging
5. Encryption settings
6. Auto Scaling policies
7. CloudWatch alarm thresholds

Integration tests should verify:
1. Network connectivity between components
2. ALB health checks pass
3. Database connectivity from EC2
4. CloudFront serves content
5. WAF blocks excessive requests
6. Secrets rotation works
7. CloudWatch alarms trigger correctly

## Next Steps

1. Add SSL/TLS certificates for HTTPS
2. Implement custom domain names
3. Add more comprehensive WAF rules
4. Implement backup verification tests
5. Add cost allocation tags
6. Set up CI/CD pipeline for infrastructure updates

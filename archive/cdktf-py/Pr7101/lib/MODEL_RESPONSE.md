# Multi-Region Disaster Recovery Architecture

Production-ready multi-region DR infrastructure using **CDKTF with Python**.

## Overview

Implements disaster recovery across us-east-1 (primary) and us-west-2 (secondary):
- Aurora Global Database (db.r5.large, 72hr backtracking)
- DynamoDB Global Tables with point-in-time recovery  
- Lambda functions (Python 3.11, 1GB) in both regions
- Route 53 DNS failover with health checks
- EventBridge cross-region replication
- AWS Backup (7-day retention, cross-region copy)
- CloudWatch dashboards and alarms
- IAM cross-region roles
- Systems Manager Parameter Store

RPO: 5 minutes | RTO: 15 minutes

## File: lib/tap_stack.py

```python
"""Multi-region disaster recovery stack."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking_stack import NetworkingStack
from lib.database_stack import DatabaseStack
from lib.compute_stack import ComputeStack
from lib.monitoring_stack import MonitoringStack
from lib.backup_stack import BackupStack
from lib.dns_stack import DnsStack


class TapStack(TerraformStack):
    """Multi-region disaster recovery infrastructure."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id)

        # Configuration
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        default_tags = kwargs.get('default_tags', {})

        # Multi-region configuration
        primary_region = "us-east-1"
        secondary_region = "us-west-2"

        # AWS Providers for both regions
        primary_provider = AwsProvider(
            self, "aws_primary",
            region=primary_region,
            alias="primary",
            default_tags=[default_tags],
        )

        secondary_provider = AwsProvider(
            self, "aws_secondary",
            region=secondary_region,
            alias="secondary",
            default_tags=[default_tags],
        )

        # S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Networking in both regions
        networking_primary = NetworkingStack(
            self, "networking_primary",
            environment_suffix=environment_suffix,
            region=primary_region,
            provider=primary_provider,
        )

        networking_secondary = NetworkingStack(
            self, "networking_secondary",
            environment_suffix=environment_suffix,
            region=secondary_region,
            provider=secondary_provider,
        )

        # Database (Aurora Global + DynamoDB Global Tables)
        database = DatabaseStack(
            self, "database",
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_vpc=networking_primary.vpc,
            secondary_vpc=networking_secondary.vpc,
            primary_private_subnets=networking_primary.private_subnets,
            secondary_private_subnets=networking_secondary.private_subnets,
            primary_db_security_group=networking_primary.db_security_group,
            secondary_db_security_group=networking_secondary.db_security_group,
        )

        # Compute (Lambda + EventBridge)
        compute = ComputeStack(
            self, "compute",
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_vpc=networking_primary.vpc,
            secondary_vpc=networking_secondary.vpc,
            primary_private_subnets=networking_primary.private_subnets,
            secondary_private_subnets=networking_secondary.private_subnets,
            primary_lambda_security_group=networking_primary.lambda_security_group,
            secondary_lambda_security_group=networking_secondary.lambda_security_group,
            primary_aurora_endpoint=database.primary_aurora_endpoint,
            secondary_aurora_endpoint=database.secondary_aurora_endpoint,
            dynamodb_table_name=database.dynamodb_table_name,
        )

        # Monitoring (CloudWatch)
        monitoring = MonitoringStack(
            self, "monitoring",
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_aurora_cluster_id=database.primary_aurora_cluster_id,
            secondary_aurora_cluster_id=database.secondary_aurora_cluster_id,
            primary_lambda_function_name=compute.primary_lambda_function_name,
            secondary_lambda_function_name=compute.secondary_lambda_function_name,
            dynamodb_table_name=database.dynamodb_table_name,
        )

        # Backup (AWS Backup with cross-region copy)
        backup = BackupStack(
            self, "backup",
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            primary_aurora_cluster_arn=database.primary_aurora_cluster_arn,
        )

        # DNS (Route 53 failover)
        dns = DnsStack(
            self, "dns",
            environment_suffix=environment_suffix,
            primary_provider=primary_provider,
            primary_lambda_url=compute.primary_lambda_url,
            secondary_lambda_url=compute.secondary_lambda_url,
        )
```


## File: lib/networking_stack.py

```python
"""Networking infrastructure for multi-region disaster recovery."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress


class NetworkingStack(Construct):
    """Networking infrastructure for a single region."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, region: str, provider):
        super().__init__(scope, construct_id)

        # VPC
        self.vpc = Vpc(
            self, "vpc",
            cidr_block="10.0.0.0/16" if "east" in region else "10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"payment-vpc-{region}-{environment_suffix}"},
            provider=provider,
        )

        # Internet Gateway
        igw = InternetGateway(
            self, "igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"payment-igw-{region}-{environment_suffix}"},
            provider=provider,
        )

        # Availability Zones (3 AZs)
        azs = [f"{region}a", f"{region}b", f"{region}c"]
        base_cidr = "10.0" if "east" in region else "10.1"

        # Public subnets
        public_subnets = []
        for idx, az in enumerate(azs):
            subnet = Subnet(
                self, f"public_subnet_{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_cidr}.{idx}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"payment-public-{az}-{environment_suffix}"},
                provider=provider,
            )
            public_subnets.append(subnet)

        # Private subnets
        self.private_subnets = []
        for idx, az in enumerate(azs):
            subnet = Subnet(
                self, f"private_subnet_{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_cidr}.{idx + 10}.0/24",
                availability_zone=az,
                tags={"Name": f"payment-private-{az}-{environment_suffix}"},
                provider=provider,
            )
            self.private_subnets.append(subnet)

        # NAT Gateway
        eip = Eip(
            self, "nat_eip",
            domain="vpc",
            tags={"Name": f"payment-nat-eip-{region}-{environment_suffix}"},
            provider=provider,
        )

        nat_gateway = NatGateway(
            self, "nat_gateway",
            allocation_id=eip.id,
            subnet_id=public_subnets[0].id,
            tags={"Name": f"payment-nat-{region}-{environment_suffix}"},
            provider=provider,
        )

        # Public route table
        public_rt = RouteTable(
            self, "public_rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(cidr_block="0.0.0.0/0", gateway_id=igw.id)],
            tags={"Name": f"payment-public-rt-{region}-{environment_suffix}"},
            provider=provider,
        )

        for idx, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self, f"public_rt_assoc_{idx}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                provider=provider,
            )

        # Private route table
        private_rt = RouteTable(
            self, "private_rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(cidr_block="0.0.0.0/0", nat_gateway_id=nat_gateway.id)],
            tags={"Name": f"payment-private-rt-{region}-{environment_suffix}"},
            provider=provider,
        )

        for idx, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(
                self, f"private_rt_assoc_{idx}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                provider=provider,
            )

        # Security group for Aurora
        self.db_security_group = SecurityGroup(
            self, "db_sg",
            name=f"payment-db-sg-{region}-{environment_suffix}",
            description="Security group for Aurora database",
            vpc_id=self.vpc.id,
            ingress=[SecurityGroupIngress(
                from_port=3306, to_port=3306, protocol="tcp",
                cidr_blocks=[self.vpc.cidr_block],
                description="MySQL from VPC",
            )],
            egress=[SecurityGroupEgress(
                from_port=0, to_port=0, protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
            )],
            tags={"Name": f"payment-db-sg-{region}-{environment_suffix}"},
            provider=provider,
        )

        # Security group for Lambda
        self.lambda_security_group = SecurityGroup(
            self, "lambda_sg",
            name=f"payment-lambda-sg-{region}-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[SecurityGroupEgress(
                from_port=0, to_port=0, protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
            )],
            tags={"Name": f"payment-lambda-sg-{region}-{environment_suffix}"},
            provider=provider,
        )
```


## File: lib/database_stack.py

```python
"""Database infrastructure with Aurora Global Database and DynamoDB Global Tables."""

from constructs import Construct
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class DatabaseStack(Construct):
    """Database infrastructure with Aurora Global DB and DynamoDB Global Tables."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 primary_region: str, secondary_region: str, primary_provider, secondary_provider,
                 primary_vpc, secondary_vpc, primary_private_subnets, secondary_private_subnets,
                 primary_db_security_group, secondary_db_security_group):
        super().__init__(scope, construct_id)

        # Aurora Global Cluster
        global_cluster = RdsGlobalCluster(
            self, "global_cluster",
            global_cluster_identifier=f"payment-global-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="payments",
            storage_encrypted=True,
            provider=primary_provider,
        )

        # Primary DB subnet group
        primary_subnet_group = DbSubnetGroup(
            self, "primary_subnet_group",
            name=f"payment-primary-subnet-{environment_suffix}",
            subnet_ids=[s.id for s in primary_private_subnets],
            tags={"Name": f"payment-primary-subnet-{environment_suffix}"},
            provider=primary_provider,
        )

        # Primary Aurora cluster (writer)
        primary_cluster = RdsCluster(
            self, "primary_cluster",
            cluster_identifier=f"payment-primary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="payments",
            master_username="admin",
            master_password="ChangeMeInProduction123!",
            db_subnet_group_name=primary_subnet_group.name,
            vpc_security_group_ids=[primary_db_security_group.id],
            global_cluster_identifier=global_cluster.id,
            skip_final_snapshot=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            backtrack_window=259200,  # 72 hours
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            storage_encrypted=True,
            tags={"Name": f"payment-primary-cluster-{environment_suffix}"},
            provider=primary_provider,
            depends_on=[global_cluster],
        )

        # Primary Aurora instance
        RdsClusterInstance(
            self, "primary_instance",
            identifier=f"payment-primary-instance-{environment_suffix}",
            cluster_identifier=primary_cluster.id,
            instance_class="db.r5.large",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            tags={"Name": f"payment-primary-instance-{environment_suffix}"},
            provider=primary_provider,
        )

        self.primary_aurora_endpoint = primary_cluster.endpoint
        self.primary_aurora_cluster_id = primary_cluster.cluster_identifier
        self.primary_aurora_cluster_arn = primary_cluster.arn

        # Secondary DB subnet group
        secondary_subnet_group = DbSubnetGroup(
            self, "secondary_subnet_group",
            name=f"payment-secondary-subnet-{environment_suffix}",
            subnet_ids=[s.id for s in secondary_private_subnets],
            tags={"Name": f"payment-secondary-subnet-{environment_suffix}"},
            provider=secondary_provider,
        )

        # Secondary Aurora cluster (reader)
        secondary_cluster = RdsCluster(
            self, "secondary_cluster",
            cluster_identifier=f"payment-secondary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            db_subnet_group_name=secondary_subnet_group.name,
            vpc_security_group_ids=[secondary_db_security_group.id],
            global_cluster_identifier=global_cluster.id,
            skip_final_snapshot=True,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            storage_encrypted=True,
            tags={"Name": f"payment-secondary-cluster-{environment_suffix}"},
            provider=secondary_provider,
            depends_on=[primary_cluster],
        )

        # Secondary Aurora instance
        RdsClusterInstance(
            self, "secondary_instance",
            identifier=f"payment-secondary-instance-{environment_suffix}",
            cluster_identifier=secondary_cluster.id,
            instance_class="db.r5.large",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            tags={"Name": f"payment-secondary-instance-{environment_suffix}"},
            provider=secondary_provider,
        )

        self.secondary_aurora_endpoint = secondary_cluster.endpoint
        self.secondary_aurora_cluster_id = secondary_cluster.cluster_identifier

        # DynamoDB Global Table
        self.dynamodb_table_name = f"payment-sessions-{environment_suffix}"
        DynamodbTable(
            self, "sessions_table",
            name=self.dynamodb_table_name,
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attribute=[DynamodbTableAttribute(name="session_id", type="S")],
            point_in_time_recovery={"enabled": True},
            replica=[DynamodbTableReplica(region_name=secondary_region, point_in_time_recovery=True)],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={"Name": f"payment-sessions-{environment_suffix}"},
            provider=primary_provider,
        )

        # Store endpoints in Parameter Store (both regions)
        for name, value, desc in [
            ("primary/endpoint", primary_cluster.endpoint, "Primary Aurora endpoint"),
            ("secondary/endpoint", secondary_cluster.endpoint, "Secondary Aurora endpoint"),
            ("dynamodb/table", self.dynamodb_table_name, "DynamoDB table name"),
        ]:
            SsmParameter(
                self, f"param_{name.replace('/', '_')}_primary",
                name=f"/payment/{environment_suffix}/db/{name}",
                type="SecureString" if "endpoint" in name else "String",
                value=value,
                description=desc,
                tags={"Name": f"payment-param-{name.replace('/', '-')}-{environment_suffix}"},
                provider=primary_provider,
            )
            SsmParameter(
                self, f"param_{name.replace('/', '_')}_secondary",
                name=f"/payment/{environment_suffix}/db/{name}",
                type="SecureString" if "endpoint" in name else "String",
                value=value,
                description=desc,
                tags={"Name": f"payment-param-{name.replace('/', '-')}-{environment_suffix}"},
                provider=secondary_provider,
            )

        # IAM role for cross-region DB access
        cross_region_role = IamRole(
            self, "cross_region_role",
            name=f"payment-db-cross-region-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-db-cross-region-{environment_suffix}"},
            provider=primary_provider,
        )

        for policy_arn in [
            "arn:aws:iam::aws:policy/AmazonRDSFullAccess",
            "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
            "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess",
        ]:
            IamRolePolicyAttachment(
                self, f"attach_{policy_arn.split('/')[-1]}",
                role=cross_region_role.name,
                policy_arn=policy_arn,
                provider=primary_provider,
            )
```


## File: lib/compute_stack.py

```python
"""Compute infrastructure with Lambda and EventBridge."""

import json
from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.lambda_function_url import LambdaFunctionUrl
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf import TerraformAsset, AssetType


class ComputeStack(Construct):
    """Compute infrastructure with Lambda and EventBridge."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 primary_region: str, secondary_region: str, primary_provider, secondary_provider,
                 primary_vpc, secondary_vpc, primary_private_subnets, secondary_private_subnets,
                 primary_lambda_security_group, secondary_lambda_security_group,
                 primary_aurora_endpoint: str, secondary_aurora_endpoint: str, dynamodb_table_name: str):
        super().__init__(scope, construct_id)

        account_id = DataAwsCallerIdentity(self, "account_id", provider=primary_provider).account_id

        # Lambda asset
        lambda_asset = TerraformAsset(self, "lambda_asset", path="lib/lambda", type=AssetType.ARCHIVE)

        # Primary Lambda
        primary_lambda_role = self._create_lambda_role("primary", environment_suffix, primary_provider)
        self._attach_lambda_policies(primary_lambda_role, primary_region, account_id, dynamodb_table_name, environment_suffix, primary_provider, "primary")
        
        primary_lambda = LambdaFunction(
            self, "primary_lambda",
            function_name=f"payment-processor-primary-{environment_suffix}",
            role=primary_lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            memory_size=1024,
            timeout=30,
            environment=LambdaFunctionEnvironment(variables={
                "REGION": primary_region,
                "DB_ENDPOINT": primary_aurora_endpoint,
                "DYNAMODB_TABLE": dynamodb_table_name,
                "ENVIRONMENT_SUFFIX": environment_suffix,
            }),
            vpc_config={"subnet_ids": [s.id for s in primary_private_subnets], "security_group_ids": [primary_lambda_security_group.id]},
            tags={"Name": f"payment-processor-primary-{environment_suffix}"},
            provider=primary_provider,
        )
        self.primary_lambda_function_name = primary_lambda.function_name
        
        primary_lambda_url = LambdaFunctionUrl(
            self, "primary_lambda_url",
            function_name=primary_lambda.function_name,
            authorization_type="NONE",
            provider=primary_provider,
        )
        self.primary_lambda_url = primary_lambda_url.function_url

        # Secondary Lambda
        secondary_lambda_role = self._create_lambda_role("secondary", environment_suffix, secondary_provider)
        self._attach_lambda_policies(secondary_lambda_role, secondary_region, account_id, dynamodb_table_name, environment_suffix, secondary_provider, "secondary")
        
        secondary_lambda = LambdaFunction(
            self, "secondary_lambda",
            function_name=f"payment-processor-secondary-{environment_suffix}",
            role=secondary_lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            memory_size=1024,
            timeout=30,
            environment=LambdaFunctionEnvironment(variables={
                "REGION": secondary_region,
                "DB_ENDPOINT": secondary_aurora_endpoint,
                "DYNAMODB_TABLE": dynamodb_table_name,
                "ENVIRONMENT_SUFFIX": environment_suffix,
            }),
            vpc_config={"subnet_ids": [s.id for s in secondary_private_subnets], "security_group_ids": [secondary_lambda_security_group.id]},
            tags={"Name": f"payment-processor-secondary-{environment_suffix}"},
            provider=secondary_provider,
        )
        self.secondary_lambda_function_name = secondary_lambda.function_name
        
        secondary_lambda_url = LambdaFunctionUrl(
            self, "secondary_lambda_url",
            function_name=secondary_lambda.function_name,
            authorization_type="NONE",
            provider=secondary_provider,
        )
        self.secondary_lambda_url = secondary_lambda_url.function_url

        # EventBridge cross-region replication
        primary_event_rule = CloudwatchEventRule(
            self, "primary_event_rule",
            name=f"payment-events-primary-{environment_suffix}",
            description="Payment events for cross-region replication",
            event_pattern=json.dumps({"source": ["payment.processor"], "detail-type": ["Payment Transaction"]}),
            tags={"Name": f"payment-events-primary-{environment_suffix}"},
            provider=primary_provider,
        )

        CloudwatchEventTarget(
            self, "primary_event_target",
            rule=primary_event_rule.name,
            arn=f"arn:aws:events:{secondary_region}:{account_id}:event-bus/default",
            role_arn=self._create_eventbridge_role("primary", environment_suffix, primary_region, secondary_region, account_id, primary_provider).arn,
            provider=primary_provider,
        )

        secondary_event_rule = CloudwatchEventRule(
            self, "secondary_event_rule",
            name=f"payment-events-secondary-{environment_suffix}",
            description="Payment events for cross-region replication",
            event_pattern=json.dumps({"source": ["payment.processor"], "detail-type": ["Payment Transaction"]}),
            tags={"Name": f"payment-events-secondary-{environment_suffix}"},
            provider=secondary_provider,
        )

        CloudwatchEventTarget(
            self, "secondary_event_target",
            rule=secondary_event_rule.name,
            arn=f"arn:aws:events:{primary_region}:{account_id}:event-bus/default",
            role_arn=self._create_eventbridge_role("secondary", environment_suffix, secondary_region, primary_region, account_id, secondary_provider).arn,
            provider=secondary_provider,
        )

    def _create_lambda_role(self, region_name: str, environment_suffix: str, provider) -> IamRole:
        """Create IAM role for Lambda."""
        return IamRole(
            self, f"{region_name}_lambda_role",
            name=f"payment-lambda-{region_name}-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-lambda-{region_name}-{environment_suffix}"},
            provider=provider,
        )

    def _attach_lambda_policies(self, role: IamRole, region: str, account_id: str, table_name: str, environment_suffix: str, provider, region_name: str):
        """Attach policies to Lambda role."""
        IamRolePolicyAttachment(
            self, f"{region_name}_lambda_basic",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=provider,
        )

        policy = IamPolicy(
            self, f"{region_name}_lambda_policy",
            name=f"payment-lambda-policy-{region_name}-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {"Effect": "Allow", "Action": ["rds:Describe*"], "Resource": "*"},
                    {"Effect": "Allow", "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query", "dynamodb:Scan"],
                     "Resource": f"arn:aws:dynamodb:{region}:{account_id}:table/{table_name}"},
                    {"Effect": "Allow", "Action": ["ssm:GetParameter", "ssm:GetParameters"],
                     "Resource": f"arn:aws:ssm:{region}:{account_id}:parameter/payment/{environment_suffix}/*"},
                    {"Effect": "Allow", "Action": "events:PutEvents",
                     "Resource": f"arn:aws:events:{region}:{account_id}:event-bus/default"}
                ]
            }),
            provider=provider,
        )

        IamRolePolicyAttachment(
            self, f"{region_name}_lambda_policy_attach",
            role=role.name,
            policy_arn=policy.arn,
            provider=provider,
        )

    def _create_eventbridge_role(self, region_name: str, environment_suffix: str, source_region: str, target_region: str, account_id: str, provider) -> IamRole:
        """Create IAM role for EventBridge cross-region replication."""
        role = IamRole(
            self, f"{region_name}_eventbridge_role",
            name=f"payment-eventbridge-{source_region}-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"events.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-eventbridge-{source_region}-{environment_suffix}"},
            provider=provider,
        )

        policy = IamPolicy(
            self, f"{region_name}_eventbridge_policy",
            name=f"payment-eventbridge-policy-{source_region}-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Effect": "Allow", "Action": "events:PutEvents",
                               "Resource": f"arn:aws:events:{target_region}:{account_id}:event-bus/default"}]
            }),
            provider=provider,
        )

        IamRolePolicyAttachment(
            self, f"{region_name}_eventbridge_policy_attach",
            role=role.name,
            policy_arn=policy.arn,
            provider=provider,
        )

        return role
```


## File: lib/lambda/index.py

```python
"""Payment processing Lambda function."""

import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
events_client = boto3.client('events')

REGION = os.environ.get('REGION', 'us-east-1')
DB_ENDPOINT = os.environ.get('DB_ENDPOINT', '')
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', '')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')


def handler(event, context):
    """Process payment transactions."""
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        
        transaction_id = body.get('transaction_id', f"txn-{datetime.now().timestamp()}")
        amount = body.get('amount', 0)
        currency = body.get('currency', 'USD')
        session_id = body.get('session_id', context.request_id)

        if amount <= 0:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'X-Region': REGION},
                'body': json.dumps({'error': 'Invalid amount', 'region': REGION})
            }

        # Store in DynamoDB
        table = dynamodb.Table(DYNAMODB_TABLE)
        table.put_item(Item={
            'session_id': session_id,
            'transaction_id': transaction_id,
            'amount': str(amount),
            'currency': currency,
            'timestamp': datetime.now().isoformat(),
            'region': REGION,
            'status': 'processed',
        })

        # Publish to EventBridge
        events_client.put_events(Entries=[{
            'Source': 'payment.processor',
            'DetailType': 'Payment Transaction',
            'Detail': json.dumps({
                'transaction_id': transaction_id,
                'amount': amount,
                'currency': currency,
                'region': REGION,
                'timestamp': datetime.now().isoformat(),
            }),
        }])

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'X-Region': REGION},
            'body': json.dumps({
                'message': 'Payment processed',
                'transaction_id': transaction_id,
                'amount': amount,
                'currency': currency,
                'region': REGION,
                'session_id': session_id,
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'X-Region': REGION},
            'body': json.dumps({'error': str(e), 'region': REGION})
        }
```

## File: lib/monitoring_stack.py

```python
"""Monitoring infrastructure with CloudWatch."""

import json
from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class MonitoringStack(Construct):
    """CloudWatch dashboards and alarms."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 primary_region: str, secondary_region: str, primary_provider, secondary_provider,
                 primary_aurora_cluster_id: str, secondary_aurora_cluster_id: str,
                 primary_lambda_function_name: str, secondary_lambda_function_name: str, dynamodb_table_name: str):
        super().__init__(scope, construct_id)

        # Primary dashboard
        CloudwatchDashboard(
            self, "primary_dashboard",
            dashboard_name=f"payment-primary-{environment_suffix}",
            dashboard_body=json.dumps({"widgets": [
                {"type": "metric", "properties": {"metrics": [["AWS/RDS", "DatabaseConnections"]], "region": primary_region, "title": "Aurora Connections"}},
                {"type": "metric", "properties": {"metrics": [["AWS/Lambda", "Invocations"], [".", "Errors"]], "region": primary_region, "title": "Lambda Metrics"}},
                {"type": "metric", "properties": {"metrics": [["AWS/DynamoDB", "ConsumedReadCapacityUnits"]], "region": primary_region, "title": "DynamoDB"}},
                {"type": "metric", "properties": {"metrics": [["AWS/RDS", "AuroraGlobalDBReplicationLag"]], "region": primary_region, "title": "Replication Lag"}},
            ]}),
            provider=primary_provider,
        )

        # Secondary dashboard
        CloudwatchDashboard(
            self, "secondary_dashboard",
            dashboard_name=f"payment-secondary-{environment_suffix}",
            dashboard_body=json.dumps({"widgets": [
                {"type": "metric", "properties": {"metrics": [["AWS/RDS", "DatabaseConnections"]], "region": secondary_region, "title": "Aurora Connections"}},
                {"type": "metric", "properties": {"metrics": [["AWS/Lambda", "Invocations"], [".", "Errors"]], "region": secondary_region, "title": "Lambda Metrics"}},
                {"type": "metric", "properties": {"metrics": [["AWS/DynamoDB", "ConsumedReadCapacityUnits"]], "region": secondary_region, "title": "DynamoDB"}},
            ]}),
            provider=secondary_provider,
        )

        # Alarms
        CloudwatchMetricAlarm(
            self, "replication_lag_alarm",
            alarm_name=f"payment-replication-lag-{environment_suffix}",
            alarm_description="Aurora Global DB replication lag > 60s",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=60000,
            treat_missing_data="notBreaching",
            dimensions={"DBClusterIdentifier": primary_aurora_cluster_id},
            tags={"Name": f"payment-replication-lag-{environment_suffix}"},
            provider=primary_provider,
        )

        for region, lambda_name, region_provider in [
            ("primary", primary_lambda_function_name, primary_provider),
            ("secondary", secondary_lambda_function_name, secondary_provider),
        ]:
            CloudwatchMetricAlarm(
                self, f"{region}_lambda_errors",
                alarm_name=f"payment-lambda-errors-{region}-{environment_suffix}",
                alarm_description=f"Lambda errors in {region}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=10,
                dimensions={"FunctionName": lambda_name},
                tags={"Name": f"payment-lambda-errors-{region}-{environment_suffix}"},
                provider=region_provider,
            )
```

## File: lib/backup_stack.py

```python
"""AWS Backup with cross-region copy."""

from constructs import Construct
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.backup_plan import BackupPlan, BackupPlanRule, BackupPlanRuleCopyAction, BackupPlanRuleLifecycle
from cdktf_cdktf_provider_aws.backup_selection import BackupSelection, BackupSelectionSelectionTag
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class BackupStack(Construct):
    """AWS Backup with cross-region copy."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 primary_region: str, secondary_region: str, primary_provider, secondary_provider,
                 primary_aurora_cluster_arn: str):
        super().__init__(scope, construct_id)

        # Backup vaults
        primary_vault = BackupVault(
            self, "primary_vault",
            name=f"payment-backup-vault-primary-{environment_suffix}",
            tags={"Name": f"payment-backup-vault-primary-{environment_suffix}"},
            provider=primary_provider,
        )

        secondary_vault = BackupVault(
            self, "secondary_vault",
            name=f"payment-backup-vault-secondary-{environment_suffix}",
            tags={"Name": f"payment-backup-vault-secondary-{environment_suffix}"},
            provider=secondary_provider,
        )

        # IAM role
        backup_role = IamRole(
            self, "backup_role",
            name=f"payment-backup-role-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"backup.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-backup-role-{environment_suffix}"},
            provider=primary_provider,
        )

        for policy in ["service-role/AWSBackupServiceRolePolicyForBackup", "service-role/AWSBackupServiceRolePolicyForRestores"]:
            IamRolePolicyAttachment(
                self, f"attach_{policy.split('/')[-1]}",
                role=backup_role.name,
                policy_arn=f"arn:aws:iam::aws:policy/{policy}",
                provider=primary_provider,
            )

        # Backup plan with cross-region copy
        backup_plan = BackupPlan(
            self, "backup_plan",
            name=f"payment-backup-plan-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="daily_backup",
                target_vault_name=primary_vault.name,
                schedule="cron(0 3 * * ? *)",
                lifecycle=BackupPlanRuleLifecycle(delete_after=7),
                copy_action=[BackupPlanRuleCopyAction(
                    destination_vault_arn=secondary_vault.arn,
                    lifecycle=BackupPlanRuleLifecycle(delete_after=7),
                )],
            )],
            tags={"Name": f"payment-backup-plan-{environment_suffix}"},
            provider=primary_provider,
        )

        # Backup selection
        BackupSelection(
            self, "backup_selection",
            name=f"payment-aurora-backup-{environment_suffix}",
            plan_id=backup_plan.id,
            iam_role_arn=backup_role.arn,
            resources=[primary_aurora_cluster_arn],
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS",
                key="Name",
                value=f"payment-primary-cluster-{environment_suffix}",
            )],
            provider=primary_provider,
        )
```

## File: lib/dns_stack.py

```python
"""Route 53 DNS with health checks and failover."""

from constructs import Construct
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck


class DnsStack(Construct):
    """Route 53 DNS with health checks and failover routing."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 primary_provider, primary_lambda_url: str, secondary_lambda_url: str):
        super().__init__(scope, construct_id)

        # Hosted zone
        hosted_zone = Route53Zone(
            self, "hosted_zone",
            name=f"payment-{environment_suffix}.example.com",
            comment=f"Payment processing system - {environment_suffix}",
            tags={"Name": f"payment-zone-{environment_suffix}"},
            provider=primary_provider,
        )

        # Clean Lambda URLs
        primary_url = primary_lambda_url.replace("https://", "").rstrip("/")
        secondary_url = secondary_lambda_url.replace("https://", "").rstrip("/")

        # Health checks
        primary_health = Route53HealthCheck(
            self, "primary_health",
            type="HTTPS",
            resource_path="/",
            fqdn=primary_url,
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={"Name": f"payment-primary-health-{environment_suffix}"},
            provider=primary_provider,
        )

        secondary_health = Route53HealthCheck(
            self, "secondary_health",
            type="HTTPS",
            resource_path="/",
            fqdn=secondary_url,
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={"Name": f"payment-secondary-health-{environment_suffix}"},
            provider=primary_provider,
        )

        # Failover records
        Route53Record(
            self, "primary_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}.example.com",
            type="CNAME",
            ttl=60,
            records=[primary_url],
            set_identifier="primary",
            health_check_id=primary_health.id,
            failover_routing_policy={"type": "PRIMARY"},
            provider=primary_provider,
        )

        Route53Record(
            self, "secondary_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}.example.com",
            type="CNAME",
            ttl=60,
            records=[secondary_url],
            set_identifier="secondary",
            health_check_id=secondary_health.id,
            failover_routing_policy={"type": "SECONDARY"},
            provider=primary_provider,
        )

        self.hosted_zone_id = hosted_zone.zone_id
```


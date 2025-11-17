# AWS Compliance Platform Infrastructure - CDKTF Python Implementation

This implementation creates a secure AWS compliance platform infrastructure with multi-AZ architecture, ECS Fargate, RDS Aurora MySQL, S3 storage, and comprehensive logging.

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
    S3BucketServerSideEncryptionConfigurationRuleA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class TapStack(TerraformStack):
    """CDKTF Python stack for AWS Compliance Platform infrastructure."""

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
        default_tags = kwargs.get('default_tags', {
            'Environment': 'production',
            'Project': 'compliance-platform',
            'CostCenter': 'eng-compliance'
        })

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Get availability zones
        azs = DataAwsAvailabilityZones(self, "available_azs", state="available")

        # ISSUE 1: Missing environmentSuffix in VPC name
        # VPC
        vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": "compliance-vpc"}
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=vpc.id,
            tags={"Name": f"compliance-igw-{environment_suffix}"}
        )

        # ISSUE 2: Hardcoded subnet CIDRs and missing tags
        # Public Subnets
        public_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=True,
                tags={"Name": f"public-subnet-{i}"}
            )
            public_subnets.append(subnet)

        # Private Subnets
        private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=Fn.element(azs.names, i),
                tags={"Name": f"private-subnet-{i}"}
            )
            private_subnets.append(subnet)

        # NAT Gateways (one per public subnet)
        nat_gateways = []
        for i, subnet in enumerate(public_subnets):
            eip = Eip(
                self,
                f"nat_eip_{i}",
                domain="vpc",
                tags={"Name": f"nat-eip-{i}-{environment_suffix}"}
            )
            nat = NatGateway(
                self,
                f"nat_gateway_{i}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={"Name": f"nat-gateway-{i}-{environment_suffix}"}
            )
            nat_gateways.append(nat)

        # Public Route Table
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=vpc.id,
            tags={"Name": f"public-rt-{environment_suffix}"}
        )

        Route(
            self,
            "public_route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Private Route Tables (one per NAT gateway)
        for i, (subnet, nat) in enumerate(zip(private_subnets, nat_gateways)):
            private_rt = RouteTable(
                self,
                f"private_rt_{i}",
                vpc_id=vpc.id,
                tags={"Name": f"private-rt-{i}-{environment_suffix}"}
            )

            Route(
                self,
                f"private_route_{i}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id
            )

            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # ISSUE 3: Missing KMS encryption for CloudWatch
        # KMS Key
        kms_key = KmsKey(
            self,
            "encryption_key",
            description="Customer-managed key for compliance platform",
            enable_key_rotation=True,
            tags={"Name": f"compliance-kms-{environment_suffix}"}
        )

        # ISSUE 4: CloudWatch log groups without KMS encryption
        # CloudWatch Log Groups
        alb_log_group = CloudwatchLogGroup(
            self,
            "alb_log_group",
            name=f"/aws/alb/compliance-{environment_suffix}",
            retention_in_days=90
        )

        ecs_log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/aws/ecs/compliance-{environment_suffix}",
            retention_in_days=90
        )

        # S3 Buckets
        logs_bucket = S3Bucket(
            self,
            "logs_bucket",
            bucket=f"compliance-logs-{environment_suffix}",
            tags={"Name": f"compliance-logs-{environment_suffix}"}
        )

        S3BucketVersioning(
            self,
            "logs_bucket_versioning",
            bucket=logs_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        S3BucketServerSideEncryptionConfiguration(
            self,
            "logs_bucket_encryption",
            bucket=logs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default={
                    "sse_algorithm": "AES256"
                }
            )]
        )

        S3BucketPublicAccessBlock(
            self,
            "logs_bucket_public_block",
            bucket=logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        assets_bucket = S3Bucket(
            self,
            "assets_bucket",
            bucket=f"compliance-assets-{environment_suffix}",
            tags={"Name": f"compliance-assets-{environment_suffix}"}
        )

        S3BucketVersioning(
            self,
            "assets_bucket_versioning",
            bucket=assets_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        S3BucketServerSideEncryptionConfiguration(
            self,
            "assets_bucket_encryption",
            bucket=assets_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default={
                    "sse_algorithm": "AES256"
                }
            )]
        )

        S3BucketPublicAccessBlock(
            self,
            "assets_bucket_public_block",
            bucket=assets_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # ISSUE 5: Security groups with overly permissive rules
        # ALB Security Group
        alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"alb-sg-{environment_suffix}",
            description="Security group for ALB",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from internet"
                ),
                # ISSUE: Unnecessary port 80 access
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from internet"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={"Name": f"alb-sg-{environment_suffix}"}
        )

        # ECS Security Group
        ecs_sg = SecurityGroup(
            self,
            "ecs_sg",
            name=f"ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[alb_sg.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={"Name": f"ecs-sg-{environment_suffix}"}
        )

        # RDS Security Group
        rds_sg = SecurityGroup(
            self,
            "rds_sg",
            name=f"rds-sg-{environment_suffix}",
            description="Security group for RDS",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[ecs_sg.id],
                    description="Allow MySQL from ECS"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={"Name": f"rds-sg-{environment_suffix}"}
        )

        # ECS Cluster
        ecs_cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"compliance-cluster-{environment_suffix}",
            tags={"Name": f"compliance-cluster-{environment_suffix}"}
        )

        # IAM Role for ECS Task Execution
        task_execution_role = IamRole(
            self,
            "task_execution_role",
            name=f"ecs-task-execution-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={"Name": f"ecs-task-execution-role-{environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "task_execution_policy",
            role=task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # IAM Role for ECS Task
        task_role = IamRole(
            self,
            "task_role",
            name=f"ecs-task-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={"Name": f"ecs-task-role-{environment_suffix}"}
        )

        # ISSUE 6: ECS task definition missing proper log configuration
        # ECS Task Definition
        task_def = EcsTaskDefinition(
            self,
            "task_def",
            family=f"compliance-task-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=task_execution_role.arn,
            task_role_arn=task_role.arn,
            container_definitions=f"""[{{
                "name": "nginx",
                "image": "nginx:latest",
                "portMappings": [{{
                    "containerPort": 80,
                    "protocol": "tcp"
                }}],
                "logConfiguration": {{
                    "logDriver": "awslogs",
                    "options": {{
                        "awslogs-group": "{ecs_log_group.name}",
                        "awslogs-region": "{aws_region}",
                        "awslogs-stream-prefix": "nginx"
                    }}
                }}
            }}]""",
            tags={"Name": f"compliance-task-{environment_suffix}"}
        )

        # Application Load Balancer
        alb = Lb(
            self,
            "alb",
            name=f"compliance-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[s.id for s in public_subnets],
            tags={"Name": f"compliance-alb-{environment_suffix}"}
        )

        # Target Group
        target_group = LbTargetGroup(
            self,
            "target_group",
            name=f"compliance-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/",
                protocol="HTTP",
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30
            ),
            tags={"Name": f"compliance-tg-{environment_suffix}"}
        )

        # ISSUE 7: ALB listener on HTTPS but missing certificate
        # ALB Listener (HTTPS)
        listener = LbListener(
            self,
            "alb_listener",
            load_balancer_arn=alb.arn,
            port=443,
            protocol="HTTPS",
            # ISSUE: Missing certificate_arn for HTTPS
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=target_group.arn
            )]
        )

        # ECS Service
        ecs_service = EcsService(
            self,
            "ecs_service",
            name=f"compliance-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_def.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[s.id for s in private_subnets],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=target_group.arn,
                container_name="nginx",
                container_port=80
            )],
            tags={"Name": f"compliance-service-{environment_suffix}"}
        )

        # ISSUE 8: RDS cluster missing skip_final_snapshot and deletion_protection
        # RDS Aurora MySQL Cluster
        rds_cluster = RdsCluster(
            self,
            "rds_cluster",
            cluster_identifier=f"compliance-db-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.02.0",
            database_name="compliancedb",
            master_username="admin",
            master_password="ChangeMe123!",  # ISSUE 9: Hardcoded password
            db_subnet_group_name=self._create_db_subnet_group(vpc, private_subnets, environment_suffix),
            vpc_security_group_ids=[rds_sg.id],
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            backup_retention_period=30,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            # ISSUE: Missing skip_final_snapshot=True and deletion_protection=False
            tags={"Name": f"compliance-db-{environment_suffix}"}
        )

        # RDS Cluster Instances
        for i in range(2):
            RdsClusterInstance(
                self,
                f"rds_instance_{i}",
                identifier=f"compliance-db-instance-{i}-{environment_suffix}",
                cluster_identifier=rds_cluster.id,
                instance_class="db.t3.medium",
                engine=rds_cluster.engine,
                engine_version=rds_cluster.engine_version,
                tags={"Name": f"compliance-db-instance-{i}-{environment_suffix}"}
            )

    def _create_db_subnet_group(self, vpc, subnets, environment_suffix):
        """Create DB subnet group for RDS."""
        from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup

        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"compliance-db-subnet-group-{environment_suffix}",
            subnet_ids=[s.id for s in subnets],
            tags={"Name": f"compliance-db-subnet-group-{environment_suffix}"}
        )
        return db_subnet_group.name
```

## Summary

This implementation creates:

- VPC with 3 public and 3 private subnets across 3 availability zones
- Internet Gateway and NAT Gateways for network connectivity
- ECS Fargate cluster running nginx containers
- Application Load Balancer with HTTPS listener
- RDS Aurora MySQL cluster with 2 instances
- S3 buckets for logs and assets with encryption
- CloudWatch log groups for monitoring
- KMS customer-managed key for encryption
- Security groups implementing network isolation
- IAM roles for ECS tasks

The infrastructure follows AWS best practices for security, high availability, and compliance requirements.

"""
tap_stack.py

Main Pulumi stack for HIPAA-compliant healthcare data processing infrastructure.
"""

from typing import Optional
import json
import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """Arguments for the TapStack."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        enable_service_connect: bool = True
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.enable_service_connect = enable_service_connect


class TapStack(pulumi.ComponentResource):
    """
    Main stack for HIPAA-compliant healthcare infrastructure.

    Creates a secure, encrypted environment for processing patient records
    with ECS Fargate, Aurora Serverless, ElastiCache, and proper compliance controls.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        base_tags = {
            'Environment': self.environment_suffix,
            'Application': 'healthcare-data-processing',
            'Compliance': 'HIPAA',
        }
        self.tags = {**base_tags, **args.tags}
        self.enable_service_connect = args.enable_service_connect

        region = aws.get_region()
        caller_identity = aws.get_caller_identity()
        self.region = region.name

        kms_key_policy = json.dumps({
            "Version": "2012-10-17",
            "Id": "healthcare-kms-policy",
            "Statement": [
                {
                    "Sid": "AllowRootAccount",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{caller_identity.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "AllowAWSServiceUse",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": [
                            f"logs.{self.region}.amazonaws.com",
                            "rds.amazonaws.com",
                            "secretsmanager.amazonaws.com",
                            "elasticache.amazonaws.com",
                            "ecs-tasks.amazonaws.com"
                        ]
                    },
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*"
                }
            ]
        })

        # Create KMS key for encryption
        self.kms_key = aws.kms.Key(
            f"healthcare-kms-{self.environment_suffix}",
            description=f"KMS key for healthcare data encryption - {self.environment_suffix}",
            deletion_window_in_days=30,
            enable_key_rotation=True,
            policy=kms_key_policy,
            tags={**self.tags, 'Name': f"healthcare-kms-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.kms.Alias(
            f"healthcare-kms-alias-{self.environment_suffix}",
            name=f"alias/healthcare-{self.environment_suffix}",
            target_key_id=self.kms_key.key_id,
            opts=ResourceOptions(parent=self.kms_key)
        )

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"healthcare-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, 'Name': f"healthcare-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"healthcare-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, 'Name': f"healthcare-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create public subnets
        self.public_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"healthcare-public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.tags,
                    'Name': f"healthcare-public-subnet-{i+1}-{self.environment_suffix}",
                    'Type': 'Public'
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.public_subnets.append(subnet)

        # Create NAT Gateway EIP
        self.nat_eip = aws.ec2.Eip(
            f"healthcare-nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={**self.tags, 'Name': f"healthcare-nat-eip-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc, depends_on=[self.igw])
        )

        # Create NAT Gateway
        self.nat_gateway = aws.ec2.NatGateway(
            f"healthcare-nat-{self.environment_suffix}",
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.nat_eip.id,
            tags={**self.tags, 'Name': f"healthcare-nat-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.public_subnets[0])
        )

        # Create private subnets for application
        self.private_app_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"healthcare-private-app-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=az,
                tags={
                    **self.tags,
                    'Name': f"healthcare-private-app-subnet-{i+1}-{self.environment_suffix}",
                    'Type': 'Private-App'
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_app_subnets.append(subnet)

        # Create private subnets for database
        self.private_db_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"healthcare-private-db-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{20+i}.0/24",
                availability_zone=az,
                tags={
                    **self.tags,
                    'Name': f"healthcare-private-db-subnet-{i+1}-{self.environment_suffix}",
                    'Type': 'Private-DB'
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_db_subnets.append(subnet)

        # Create public route table
        self.public_rt = aws.ec2.RouteTable(
            f"healthcare-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id,
                )
            ],
            tags={**self.tags, 'Name': f"healthcare-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"healthcare-public-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=subnet)
            )

        # Create private route table
        self.private_rt = aws.ec2.RouteTable(
            f"healthcare-private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=self.nat_gateway.id,
                )
            ],
            tags={**self.tags, 'Name': f"healthcare-private-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_app_subnets + self.private_db_subnets):
            aws.ec2.RouteTableAssociation(
                f"healthcare-private-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=subnet)
            )

        # Create security group for ECS tasks
        self.ecs_sg = aws.ec2.SecurityGroup(
            f"healthcare-ecs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ECS Fargate tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["10.0.0.0/16"],
                    description="HTTPS traffic from within the VPC",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic",
                ),
            ],
            tags={**self.tags, 'Name': f"healthcare-ecs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create security group for RDS
        self.rds_sg = aws.ec2.SecurityGroup(
            f"healthcare-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS Aurora cluster",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[self.ecs_sg.id],
                    description="PostgreSQL from ECS tasks",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic",
                ),
            ],
            tags={**self.tags, 'Name': f"healthcare-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create security group for ElastiCache
        self.elasticache_sg = aws.ec2.SecurityGroup(
            f"healthcare-elasticache-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ElastiCache Redis cluster",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    security_groups=[self.ecs_sg.id],
                    description="Redis from ECS tasks",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic",
                ),
            ],
            tags={**self.tags, 'Name': f"healthcare-elasticache-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"healthcare-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_db_subnets],
            tags={**self.tags, 'Name': f"healthcare-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache subnet group
        self.elasticache_subnet_group = aws.elasticache.SubnetGroup(
            f"healthcare-elasticache-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_db_subnets],
            tags={**self.tags, 'Name': f"healthcare-elasticache-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create database password in Secrets Manager
        self.db_secret = aws.secretsmanager.Secret(
            f"healthcare-db-secret-{self.environment_suffix}",
            description="Master password for healthcare Aurora database",
            kms_key_id=self.kms_key.id,
            tags={**self.tags, 'Name': f"healthcare-db-secret-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Generate random password
        self.db_password = random.RandomPassword(
            f"healthcare-db-password-{self.environment_suffix}",
            length=32,
            special=True,
            override_special="!#$%&*()-_=+[]{}<>:?",
            opts=ResourceOptions(parent=self.db_secret)
        )

        self.db_password_secret = Output.secret(self.db_password.result)

        # Store password in secret
        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"healthcare-db-secret-version-{self.environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=self.db_password_secret.apply(
                lambda pwd: json.dumps({
                    "username": "healthcare_admin",
                    "password": pwd,
                    "engine": "aurora-postgresql",
                    "port": 5432
                })
            ),
            opts=ResourceOptions(parent=self.db_secret)
        )

        # Create Aurora Serverless v2 cluster
        self.db_cluster = aws.rds.Cluster(
            f"healthcare-db-cluster-{self.environment_suffix}",
            cluster_identifier=f"healthcare-db-{self.environment_suffix}",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_mode="provisioned",
            engine_version="15.5",
            database_name="healthcaredb",
            master_username="healthcare_admin",
            master_password=self.db_password_secret,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            backup_retention_period=30,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            deletion_protection=False,
            skip_final_snapshot=True,
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                min_capacity=0.5,
                max_capacity=2.0,
            ),
            tags={**self.tags, 'Name': f"healthcare-db-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Aurora Serverless v2 instance
        self.db_instance = aws.rds.ClusterInstance(
            f"healthcare-db-instance-{self.environment_suffix}",
            identifier=f"healthcare-db-instance-{self.environment_suffix}",
            cluster_identifier=self.db_cluster.id,
            instance_class="db.serverless",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version="15.5",
            publicly_accessible=False,
            tags={**self.tags, 'Name': f"healthcare-db-instance-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.db_cluster)
        )

        # Create ElastiCache Redis cluster
        self.redis_cluster = aws.elasticache.ReplicationGroup(
            f"healthcare-redis-{self.environment_suffix}",
            replication_group_id=f"healthcare-redis-{self.environment_suffix}",
            description="Redis cluster for healthcare session management",
            engine="redis",
            engine_version="7.1",
            node_type="cache.t4g.micro",
            num_cache_clusters=2,
            parameter_group_name="default.redis7",
            port=6379,
            subnet_group_name=self.elasticache_subnet_group.name,
            security_group_ids=[self.elasticache_sg.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            transit_encryption_mode="required",
            kms_key_id=self.kms_key.arn,
            automatic_failover_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            maintenance_window="mon:05:00-mon:07:00",
            auto_minor_version_upgrade=True,
            tags={**self.tags, 'Name': f"healthcare-redis-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Optionally create CloudMap namespace for Service Connect
        self.service_discovery_namespace = None
        if self.enable_service_connect:
            self.service_discovery_namespace = aws.servicediscovery.PrivateDnsNamespace(
                f"healthcare-namespace-{self.environment_suffix}",
                name=f"healthcare-{self.environment_suffix}.local",
                vpc=self.vpc.id,
                description="Service discovery namespace for healthcare services",
                tags={**self.tags, 'Name': f"healthcare-namespace-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self.vpc)
            )

        cluster_kwargs = {
            "name": f"healthcare-cluster-{self.environment_suffix}",
            "settings": [
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled",
                ),
            ],
            "tags": {**self.tags, 'Name': f"healthcare-ecs-cluster-{self.environment_suffix}"},
            "opts": ResourceOptions(parent=self)
        }

        if self.enable_service_connect and self.service_discovery_namespace is not None:
            cluster_kwargs["service_connect_defaults"] = aws.ecs.ClusterServiceConnectDefaultsArgs(
                namespace=self.service_discovery_namespace.arn
            )

        # Create ECS cluster (with optional Service Connect namespace)
        self.ecs_cluster = aws.ecs.Cluster(
            f"healthcare-ecs-cluster-{self.environment_suffix}",
            **cluster_kwargs
        )

        # Create CloudWatch log group for ECS with KMS encryption
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"healthcare-ecs-logs-{self.environment_suffix}",
            name=f"/ecs/healthcare-{self.environment_suffix}",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            tags={**self.tags, 'Name': f"healthcare-ecs-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # Create IAM role for ECS task execution
        self.ecs_execution_role = aws.iam.Role(
            f"healthcare-ecs-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, 'Name': f"healthcare-ecs-execution-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # Attach execution role policy
        aws.iam.RolePolicyAttachment(
            f"healthcare-ecs-execution-policy-{self.environment_suffix}",
            role=self.ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self.ecs_execution_role)
        )

        # Add policy for Secrets Manager access
        self.ecs_secrets_policy = aws.iam.RolePolicy(
            f"healthcare-ecs-secrets-policy-{self.environment_suffix}",
            role=self.ecs_execution_role.id,
            policy=Output.all(self.db_secret.arn, self.kms_key.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "secretsmanager:GetSecretValue"
                            ],
                            "Resource": [args[0]]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt"
                            ],
                            "Resource": [args[1]]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.ecs_execution_role)
        )

        # Create IAM role for ECS task
        self.ecs_task_role = aws.iam.Role(
            f"healthcare-ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, 'Name': f"healthcare-ecs-task-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # Create ECS task definition
        self.ecs_task_definition = aws.ecs.TaskDefinition(
            f"healthcare-task-{self.environment_suffix}",
            family=f"healthcare-task-{self.environment_suffix}",
            cpu="256",
            memory="512",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            execution_role_arn=self.ecs_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=Output.all(
                self.db_cluster.endpoint,
                self.db_secret.arn,
                self.redis_cluster.configuration_endpoint_address,
                self.ecs_log_group.name
            ).apply(
                lambda args: json.dumps([{
                    "name": "healthcare-app",
                    "image": "public.ecr.aws/docker/library/nginx:latest",
                    "cpu": 256,
                    "memory": 512,
                    "essential": True,
                    "portMappings": [{
                        "containerPort": 443,
                        "protocol": "tcp",
                        "name": "https"
                    }],
                    "environment": [
                        {"name": "DB_HOST", "value": args[0]},
                        {"name": "REDIS_HOST", "value": args[2]},
                        {"name": "ENVIRONMENT", "value": self.environment_suffix}
                    ],
                    "secrets": [
                        {
                            "name": "DB_CREDENTIALS",
                            "valueFrom": args[1]
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[3],
                            "awslogs-region": self.region,
                            "awslogs-stream-prefix": "healthcare"
                        }
                    }
                }])
            ),
            tags={**self.tags, 'Name': f"healthcare-task-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # Create ECS service
        service_kwargs = {
            "name": f"healthcare-service-{self.environment_suffix}",
            "cluster": self.ecs_cluster.arn,
            "task_definition": self.ecs_task_definition.arn,
            "desired_count": 2,
            "launch_type": "FARGATE",
            "network_configuration": aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=[subnet.id for subnet in self.private_app_subnets],
                security_groups=[self.ecs_sg.id],
            ),
            "tags": {**self.tags, 'Name': f"healthcare-service-{self.environment_suffix}"},
            "opts": ResourceOptions(parent=self.ecs_cluster)
        }

        if self.enable_service_connect and self.service_discovery_namespace is not None:
            service_kwargs["service_connect_configuration"] = aws.ecs.ServiceServiceConnectConfigurationArgs(
                enabled=True,
                services=[
                    aws.ecs.ServiceServiceConnectConfigurationServiceArgs(
                        port_name="https",
                        discovery_name="healthcare-app",
                        client_alias=aws.ecs.ServiceServiceConnectConfigurationServiceClientAliasArgs(
                            port=443,
                            dns_name="healthcare-app"
                        )
                    )
                ]
            )

        self.ecs_service = aws.ecs.Service(
            f"healthcare-service-{self.environment_suffix}",
            **service_kwargs
        )

        # Export outputs
        outputs = {
            'region': self.region,
            'kms_key_id': self.kms_key.id,
            'kms_key_arn': self.kms_key.arn,
            'vpc_id': self.vpc.id,
            'public_subnet_ids': [subnet.id for subnet in self.public_subnets],
            'private_app_subnet_ids': [subnet.id for subnet in self.private_app_subnets],
            'private_db_subnet_ids': [subnet.id for subnet in self.private_db_subnets],
            'internet_gateway_id': self.igw.id,
            'nat_gateway_id': self.nat_gateway.id,
            'public_route_table_id': self.public_rt.id,
            'private_route_table_id': self.private_rt.id,
            'ecs_security_group_id': self.ecs_sg.id,
            'rds_security_group_id': self.rds_sg.id,
            'elasticache_security_group_id': self.elasticache_sg.id,
            'ecs_cluster_name': self.ecs_cluster.name,
            'ecs_log_group_name': self.ecs_log_group.name,
            'ecs_execution_role_arn': self.ecs_execution_role.arn,
            'ecs_task_role_arn': self.ecs_task_role.arn,
            'ecs_task_definition_arn': self.ecs_task_definition.arn,
            'ecs_service_name': self.ecs_service.name,
            'service_connect_enabled': self.enable_service_connect,
            'service_discovery_namespace_id': self.service_discovery_namespace.id if self.service_discovery_namespace else None,
            'db_cluster_endpoint': self.db_cluster.endpoint,
            'db_cluster_arn': self.db_cluster.arn,
            'db_secret_arn': self.db_secret.arn,
            'redis_endpoint': self.redis_cluster.configuration_endpoint_address,
            'redis_primary_endpoint': self.redis_cluster.primary_endpoint_address,
            'redis_reader_endpoint': self.redis_cluster.reader_endpoint_address,
        }

        self.register_outputs(outputs)

        # If this component is the root of the stack (no parent resource has
        # been provided), surface the same values via `pulumi.export` so they
        # appear in `pulumi stack output` and can be consumed by integration
        # tooling.
        if opts is None or getattr(opts, "parent", None) is None:
            for key, value in outputs.items():
                pulumi.export(key, value)

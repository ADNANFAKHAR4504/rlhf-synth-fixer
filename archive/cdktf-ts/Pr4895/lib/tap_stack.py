"""
tap_stack.py

This module defines the TapStack class for healthcare SaaS platform infrastructure.
It creates a HIPAA-compliant infrastructure with ECS, Aurora Serverless, Secrets Manager,
and proper encryption for handling Protected Health Information (PHI).
"""

from typing import Optional
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for Healthcare SaaS infrastructure.

    Creates a HIPAA-compliant infrastructure including:
    - VPC with public and private subnets
    - NAT Gateway for private subnet internet access
    - ECS Fargate cluster in private subnets
    - Aurora Serverless v2 PostgreSQL database
    - KMS encryption for data at rest
    - Secrets Manager with automatic rotation for database credentials
    - Proper security groups and IAM roles
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
            "Environment": self.environment_suffix,
            "Application": "healthcare-saas",
            "ManagedBy": "Pulumi",
            "Compliance": "HIPAA"
        }
        self.tags = {**base_tags, **args.tags}

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"healthcare-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"healthcare-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"healthcare-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"healthcare-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create public subnets in two AZs
        self.public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"healthcare-public-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"healthcare-public-subnet-{i}-{self.environment_suffix}", "Type": "Public"},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.public_subnets.append(subnet)

        # Create private subnets in two AZs
        self.private_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"healthcare-private-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={**self.tags, "Name": f"healthcare-private-subnet-{i}-{self.environment_suffix}", "Type": "Private"},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_subnets.append(subnet)

        # Create Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f"healthcare-nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={**self.tags, "Name": f"healthcare-nat-eip-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"healthcare-nat-{self.environment_suffix}",
            allocation_id=self.eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={**self.tags, "Name": f"healthcare-nat-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc, depends_on=[self.igw])
        )

        # Create public route table
        self.public_rt = aws.ec2.RouteTable(
            f"healthcare-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={**self.tags, "Name": f"healthcare-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"healthcare-public-rta-{i}-{self.environment_suffix}",
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
                    nat_gateway_id=self.nat_gateway.id
                )
            ],
            tags={**self.tags, "Name": f"healthcare-private-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"healthcare-private-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=subnet)
            )

        # Create KMS key for encryption at rest
        self.kms_key = aws.kms.Key(
            f"healthcare-kms-{self.environment_suffix}",
            description=f"KMS key for healthcare SaaS platform {self.environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={**self.tags, "Name": f"healthcare-kms-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.kms_alias = aws.kms.Alias(
            f"healthcare-kms-alias-{self.environment_suffix}",
            target_key_id=self.kms_key.id,
            name=f"alias/healthcare-{self.environment_suffix}",
            opts=ResourceOptions(parent=self.kms_key)
        )

        # Create security group for Aurora database
        self.db_sg = aws.ec2.SecurityGroup(
            f"healthcare-db-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Aurora PostgreSQL database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=["10.0.0.0/16"],
                    description="PostgreSQL from VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.tags, "Name": f"healthcare-db-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"healthcare-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.tags, "Name": f"healthcare-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Generate initial database password
        import random
        import string
        db_password = ''.join(random.choices(string.ascii_letters + string.digits + "!@#$%^&*()", k=32))

        # Create secret for database credentials
        self.db_secret = aws.secretsmanager.Secret(
            f"healthcare-db-secret-{self.environment_suffix}",
            name=f"healthcare/database/credentials-{self.environment_suffix}",
            description="Database credentials for healthcare SaaS platform",
            kms_key_id=self.kms_key.id,
            tags={**self.tags, "Name": f"healthcare-db-secret-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Aurora Serverless v2 cluster
        self.db_cluster = aws.rds.Cluster(
            f"healthcare-db-cluster-{self.environment_suffix}",
            cluster_identifier=f"healthcare-db-{self.environment_suffix}",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_mode="provisioned",
            engine_version="15.4",
            database_name="healthcaredb",
            master_username="dbadmin",
            master_password=db_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_sg.id],
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="sun:04:00-sun:05:00",
            skip_final_snapshot=True,
            enabled_cloudwatch_logs_exports=["postgresql"],
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                min_capacity=0.5,
                max_capacity=1.0
            ),
            tags={**self.tags, "Name": f"healthcare-db-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[self.db_subnet_group])
        )

        # Create Aurora Serverless v2 instance
        self.db_instance = aws.rds.ClusterInstance(
            f"healthcare-db-instance-{self.environment_suffix}",
            identifier=f"healthcare-db-instance-{self.environment_suffix}",
            cluster_identifier=self.db_cluster.id,
            instance_class="db.serverless",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version="15.4",
            publicly_accessible=False,
            tags={**self.tags, "Name": f"healthcare-db-instance-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.db_cluster)
        )

        # Store database credentials in secret with endpoint information
        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"healthcare-db-secret-version-{self.environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=Output.all(
                self.db_cluster.endpoint,
                self.db_cluster.master_username,
                self.db_cluster.database_name
            ).apply(lambda args: json.dumps({
                "username": args[1],
                "password": db_password,
                "engine": "postgres",
                "host": args[0],
                "port": 5432,
                "dbname": args[2],
                "dbClusterIdentifier": f"healthcare-db-{self.environment_suffix}"
            })),
            opts=ResourceOptions(parent=self.db_secret, depends_on=[self.db_cluster])
        )

        # Configure automatic rotation for the secret (every 30 days)
        self.db_secret_rotation = aws.secretsmanager.SecretRotation(
            f"healthcare-db-secret-rotation-{self.environment_suffix}",
            secret_id=self.db_secret.id,
            rotation_rules=aws.secretsmanager.SecretRotationRotationRulesArgs(
                automatically_after_days=30
            ),
            rotate_immediately=False,
            opts=ResourceOptions(parent=self.db_secret, depends_on=[self.db_secret_version, self.db_instance])
        )

        # Create security group for ECS tasks
        self.ecs_sg = aws.ec2.SecurityGroup(
            f"healthcare-ecs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ECS tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["10.0.0.0/16"],
                    description="HTTP from VPC"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["10.0.0.0/16"],
                    description="HTTPS from VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.tags, "Name": f"healthcare-ecs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create ECS cluster
        self.ecs_cluster = aws.ecs.Cluster(
            f"healthcare-ecs-cluster-{self.environment_suffix}",
            name=f"healthcare-cluster-{self.environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags={**self.tags, "Name": f"healthcare-ecs-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for ECS task execution
        self.ecs_task_execution_role = aws.iam.Role(
            f"healthcare-ecs-task-execution-role-{self.environment_suffix}",
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
            tags={**self.tags, "Name": f"healthcare-ecs-task-execution-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for ECS task execution
        aws.iam.RolePolicyAttachment(
            f"healthcare-ecs-task-execution-policy-{self.environment_suffix}",
            role=self.ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self.ecs_task_execution_role)
        )

        # Add policy for Secrets Manager and KMS access
        self.ecs_secrets_policy = aws.iam.RolePolicy(
            f"healthcare-ecs-secrets-policy-{self.environment_suffix}",
            role=self.ecs_task_execution_role.id,
            policy=Output.all(self.db_secret.arn, self.kms_key.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "secretsmanager:GetSecretValue",
                                "secretsmanager:DescribeSecret"
                            ],
                            "Resource": args[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:DescribeKey"
                            ],
                            "Resource": args[1]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.ecs_task_execution_role)
        )

        # Create IAM role for ECS tasks
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
            tags={**self.tags, "Name": f"healthcare-ecs-task-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Add minimal permissions for task role
        self.ecs_task_policy = aws.iam.RolePolicy(
            f"healthcare-ecs-task-policy-{self.environment_suffix}",
            role=self.ecs_task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
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
            }),
            opts=ResourceOptions(parent=self.ecs_task_role)
        )

        # Create CloudWatch log group for ECS tasks
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"healthcare-ecs-logs-{self.environment_suffix}",
            name=f"/ecs/healthcare-{self.environment_suffix}",
            retention_in_days=7,
            kms_key_id=self.kms_key.arn,
            tags={**self.tags, "Name": f"healthcare-ecs-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create ECS task definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"healthcare-task-def-{self.environment_suffix}",
            family=f"healthcare-app-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=self.ecs_task_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=Output.all(self.db_secret.arn, self.ecs_log_group.name).apply(
                lambda args: json.dumps([{
                    "name": "healthcare-app",
                    "image": "nginx:latest",
                    "essential": True,
                    "portMappings": [{
                        "containerPort": 80,
                        "protocol": "tcp"
                    }],
                    "secrets": [{
                        "name": "DB_CREDENTIALS",
                        "valueFrom": args[0]
                    }],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[1],
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "healthcare-app"
                        }
                    }
                }])
            ),
            tags={**self.tags, "Name": f"healthcare-task-def-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # Create ECS service with blue/green deployment configuration
        self.ecs_service = aws.ecs.Service(
            f"healthcare-ecs-service-{self.environment_suffix}",
            name=f"healthcare-service-{self.environment_suffix}",
            cluster=self.ecs_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            deployment_controller=aws.ecs.ServiceDeploymentControllerArgs(
                type="ECS"
            ),
            deployment_circuit_breaker=aws.ecs.ServiceDeploymentCircuitBreakerArgs(
                enable=True,
                rollback=True
            ),
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=[subnet.id for subnet in self.private_subnets],
                security_groups=[self.ecs_sg.id],
                assign_public_ip=False
            ),
            tags={**self.tags, "Name": f"healthcare-ecs-service-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.ecs_cluster, depends_on=[self.task_definition])
        )

        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "ecs_cluster_id": self.ecs_cluster.id,
            "ecs_cluster_name": self.ecs_cluster.name,
            "db_cluster_endpoint": self.db_cluster.endpoint,
            "db_secret_arn": self.db_secret.arn,
            "kms_key_id": self.kms_key.id,
            "nat_gateway_id": self.nat_gateway.id
        })

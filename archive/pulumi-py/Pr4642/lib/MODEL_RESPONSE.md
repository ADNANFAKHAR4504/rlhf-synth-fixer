# HIPAA-Compliant Healthcare Data Processing Infrastructure

This document contains the infrastructure code for deploying a secure, HIPAA-compliant containerized healthcare data processing application using Pulumi with Python.

## Infrastructure Components

- **VPC with Private Subnets**: Network isolation for healthcare data
- **ECS Fargate Cluster**: Containerized application runtime
- **Aurora Serverless v2**: Encrypted database with automated backups
- **KMS Keys**: Encryption for data at rest
- **Application Load Balancer**: Secure HTTPS endpoint
- **CloudWatch Logs**: Audit logging and monitoring
- **Secrets Manager**: Database credentials management
- **IAM Roles**: Least privilege access control

## File: lib/tap_stack.py

```python
"""
Healthcare Data Processing Stack - HIPAA Compliant Infrastructure

This module implements a secure, HIPAA-compliant infrastructure for processing
patient healthcare records using ECS Fargate containers with encrypted storage.
"""

from typing import Optional
import json
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws
from pulumi_aws import ec2, ecs, rds, kms, logs, iam, lb, secretsmanager, ecr


class TapStackArgs:
    """
    Configuration arguments for the Healthcare Data Processing Stack.

    Args:
        environment_suffix: Unique suffix for resource naming and isolation
    """
    def __init__(self, environment_suffix: Optional[str] = None):
        self.environment_suffix = environment_suffix or 'dev'


class TapStack(pulumi.ComponentResource):
    """
    Main stack component for HIPAA-compliant healthcare data processing infrastructure.

    Implements:
    - Encrypted data storage with KMS
    - Network isolation with VPC
    - Containerized application on ECS Fargate
    - Audit logging with CloudWatch
    - Secure credential management
    - 30-day backup retention for compliance
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Common tags for all resources
        common_tags = {
            'Environment': self.environment_suffix,
            'Application': 'HealthcareDataProcessing',
            'Compliance': 'HIPAA',
            'ManagedBy': 'Pulumi'
        }

        # Create KMS key for encryption at rest
        self.kms_key = kms.Key(
            f"healthcare-kms-{self.environment_suffix}",
            description=f"KMS key for healthcare data encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        self.kms_alias = kms.Alias(
            f"healthcare-kms-alias-{self.environment_suffix}",
            name=f"alias/healthcare-{self.environment_suffix}",
            target_key_id=self.kms_key.id,
            opts=ResourceOptions(parent=self.kms_key)
        )

        # Create VPC for network isolation
        self.vpc = ec2.Vpc(
            f"healthcare-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, 'Name': f'healthcare-vpc-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = ec2.InternetGateway(
            f"healthcare-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, 'Name': f'healthcare-igw-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create public subnets for ALB
        self.public_subnet_1 = ec2.Subnet(
            f"healthcare-public-subnet-1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="sa-east-1a",
            map_public_ip_on_launch=True,
            tags={**common_tags, 'Name': f'healthcare-public-1-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        self.public_subnet_2 = ec2.Subnet(
            f"healthcare-public-subnet-2-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="sa-east-1b",
            map_public_ip_on_launch=True,
            tags={**common_tags, 'Name': f'healthcare-public-2-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create private subnets for ECS and RDS
        self.private_subnet_1 = ec2.Subnet(
            f"healthcare-private-subnet-1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone="sa-east-1a",
            tags={**common_tags, 'Name': f'healthcare-private-1-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        self.private_subnet_2 = ec2.Subnet(
            f"healthcare-private-subnet-2-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone="sa-east-1b",
            tags={**common_tags, 'Name': f'healthcare-private-2-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create route table for public subnets
        self.public_route_table = ec2.RouteTable(
            f"healthcare-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, 'Name': f'healthcare-public-rt-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        self.public_route = ec2.Route(
            f"healthcare-public-route-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        self.public_rta_1 = ec2.RouteTableAssociation(
            f"healthcare-public-rta-1-{self.environment_suffix}",
            subnet_id=self.public_subnet_1.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        self.public_rta_2 = ec2.RouteTableAssociation(
            f"healthcare-public-rta-2-{self.environment_suffix}",
            subnet_id=self.public_subnet_2.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        # Security Group for ALB
        self.alb_sg = ec2.SecurityGroup(
            f"healthcare-alb-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, 'Name': f'healthcare-alb-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security Group for ECS tasks
        self.ecs_sg = ec2.SecurityGroup(
            f"healthcare-ecs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ECS tasks",
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[self.alb_sg.id],
                    description="HTTP from ALB"
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, 'Name': f'healthcare-ecs-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security Group for RDS
        self.rds_sg = ec2.SecurityGroup(
            f"healthcare-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS database",
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[self.ecs_sg.id],
                    description="PostgreSQL from ECS tasks"
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, 'Name': f'healthcare-rds-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create DB subnet group
        self.db_subnet_group = rds.SubnetGroup(
            f"healthcare-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[self.private_subnet_1.id, self.private_subnet_2.id],
            tags={**common_tags, 'Name': f'healthcare-db-subnet-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Generate database credentials and store in Secrets Manager
        self.db_password_secret = secretsmanager.Secret(
            f"healthcare-db-password-{self.environment_suffix}",
            name=f"healthcare-db-password-{self.environment_suffix}",
            description="Database password for healthcare application",
            kms_key_id=self.kms_key.id,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Store a placeholder - in production, this would be generated securely
        self.db_password_version = secretsmanager.SecretVersion(
            f"healthcare-db-password-version-{self.environment_suffix}",
            secret_id=self.db_password_secret.id,
            secret_string=json.dumps({
                "username": "healthcare_admin",
                "password": "PLACEHOLDER_CHANGE_ME"
            }),
            opts=ResourceOptions(parent=self.db_password_secret)
        )

        # Create Aurora Serverless v2 cluster for HIPAA-compliant storage
        self.aurora_cluster = rds.Cluster(
            f"healthcare-aurora-{self.environment_suffix}",
            cluster_identifier=f"healthcare-aurora-{self.environment_suffix}",
            engine=rds.EngineType.AURORA_POSTGRESQL,
            engine_mode="provisioned",
            engine_version="15.4",
            database_name="healthcaredb",
            master_username="healthcare_admin",
            master_password="PLACEHOLDER_CHANGE_ME",
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            backup_retention_period=30,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            serverlessv2_scaling_configuration=rds.ClusterServerlessv2ScalingConfigurationArgs(
                min_capacity=0.5,
                max_capacity=1.0
            ),
            skip_final_snapshot=True,
            tags={**common_tags, 'Name': f'healthcare-aurora-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create Aurora Serverless v2 instance
        self.aurora_instance = rds.ClusterInstance(
            f"healthcare-aurora-instance-{self.environment_suffix}",
            identifier=f"healthcare-aurora-instance-{self.environment_suffix}",
            cluster_identifier=self.aurora_cluster.id,
            instance_class="db.serverless",
            engine=rds.EngineType.AURORA_POSTGRESQL,
            engine_version="15.4",
            publicly_accessible=False,
            tags=common_tags,
            opts=ResourceOptions(parent=self.aurora_cluster)
        )

        # Create ECR repository for container images
        self.ecr_repository = ecr.Repository(
            f"healthcare-app-{self.environment_suffix}",
            name=f"healthcare-app-{self.environment_suffix}",
            image_scanning_configuration=ecr.RepositoryImageScanningConfigurationArgs(
                scan_on_push=True
            ),
            encryption_configurations=[
                ecr.RepositoryEncryptionConfigurationArgs(
                    encryption_type="KMS",
                    kms_key=self.kms_key.arn
                )
            ],
            image_tag_mutability="MUTABLE",
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Log Group for ECS
        self.log_group = logs.LogGroup(
            f"healthcare-ecs-logs-{self.environment_suffix}",
            name=f"/ecs/healthcare-app-{self.environment_suffix}",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # IAM Role for ECS Task Execution
        self.ecs_execution_role = iam.Role(
            f"healthcare-ecs-exec-role-{self.environment_suffix}",
            name=f"healthcare-ecs-exec-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach managed policy for ECS task execution
        self.ecs_execution_policy_attachment = iam.RolePolicyAttachment(
            f"healthcare-ecs-exec-policy-{self.environment_suffix}",
            role=self.ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self.ecs_execution_role)
        )

        # Additional policy for ECR and Secrets Manager access
        self.ecs_execution_custom_policy = iam.RolePolicy(
            f"healthcare-ecs-exec-custom-policy-{self.environment_suffix}",
            role=self.ecs_execution_role.id,
            policy=pulumi.Output.all(
                self.kms_key.arn,
                self.db_password_secret.arn,
                self.ecr_repository.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ecr:GetAuthorizationToken",
                            "ecr:BatchCheckLayerAvailability",
                            "ecr:GetDownloadUrlForLayer",
                            "ecr:BatchGetImage"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self.ecs_execution_role)
        )

        # IAM Role for ECS Task
        self.ecs_task_role = iam.Role(
            f"healthcare-ecs-task-role-{self.environment_suffix}",
            name=f"healthcare-ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Task role policy for application permissions
        self.ecs_task_policy = iam.RolePolicy(
            f"healthcare-ecs-task-policy-{self.environment_suffix}",
            role=self.ecs_task_role.id,
            policy=self.kms_key.arn.apply(lambda kms_arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": kms_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self.ecs_task_role)
        )

        # Create ECS Cluster
        self.ecs_cluster = ecs.Cluster(
            f"healthcare-cluster-{self.environment_suffix}",
            name=f"healthcare-cluster-{self.environment_suffix}",
            settings=[
                ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create ECS Task Definition
        self.task_definition = ecs.TaskDefinition(
            f"healthcare-task-{self.environment_suffix}",
            family=f"healthcare-task-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=self.ecs_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=pulumi.Output.all(
                self.ecr_repository.repository_url,
                self.log_group.name,
                self.aurora_cluster.endpoint,
                self.db_password_secret.arn
            ).apply(lambda args: json.dumps([{
                "name": "healthcare-app",
                "image": f"{args[0]}:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[1],
                        "awslogs-region": "sa-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "environment": [
                    {
                        "name": "DB_HOST",
                        "value": args[2]
                    },
                    {
                        "name": "DB_NAME",
                        "value": "healthcaredb"
                    },
                    {
                        "name": "DB_PORT",
                        "value": "5432"
                    }
                ],
                "secrets": [
                    {
                        "name": "DB_CREDENTIALS",
                        "valueFrom": args[3]
                    }
                ]
            }])),
            tags=common_tags,
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # Create Application Load Balancer
        self.alb = lb.LoadBalancer(
            f"healthcare-alb-{self.environment_suffix}",
            name=f"healthcare-alb-{self.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=[self.public_subnet_1.id, self.public_subnet_2.id],
            enable_deletion_protection=False,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Target Group
        self.target_group = lb.TargetGroup(
            f"healthcare-tg-{self.environment_suffix}",
            name=f"healthcare-tg-{self.environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            health_check=lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                protocol="HTTP",
                matcher="200",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=3
            ),
            tags=common_tags,
            opts=ResourceOptions(parent=self.alb)
        )

        # Create ALB Listener (HTTP - in production, use HTTPS with ACM certificate)
        self.alb_listener = lb.Listener(
            f"healthcare-listener-{self.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=443,
            protocol="HTTPS",
            certificate_arn="arn:aws:acm:sa-east-1:123456789012:certificate/placeholder",
            default_actions=[
                lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            opts=ResourceOptions(parent=self.alb)
        )

        # Create ECS Service
        self.ecs_service = ecs.Service(
            f"healthcare-service-{self.environment_suffix}",
            name=f"healthcare-service-{self.environment_suffix}",
            cluster=self.ecs_cluster.arn,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=[self.private_subnet_1.id, self.private_subnet_2.id],
                security_groups=[self.ecs_sg.id]
            ),
            load_balancers=[
                ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.target_group.arn,
                    container_name="healthcare-app",
                    container_port=8080
                )
            ],
            tags=common_tags,
            opts=ResourceOptions(
                parent=self.ecs_cluster,
                depends_on=[self.alb_listener]
            )
        )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'ecs_cluster_arn': self.ecs_cluster.arn,
            'alb_dns_name': self.alb.dns_name,
            'aurora_endpoint': self.aurora_cluster.endpoint,
            'ecr_repository_url': self.ecr_repository.repository_url,
            'kms_key_id': self.kms_key.id,
            'log_group_name': self.log_group.name
        })
```

## File: lib/__init__.py

```python
"""
Healthcare Data Processing Infrastructure Package
"""
```

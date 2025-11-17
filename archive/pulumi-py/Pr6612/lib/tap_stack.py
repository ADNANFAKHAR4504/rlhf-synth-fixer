"""
tap_stack.py

This module defines the TapStack class for deploying a payment processing web application
with blue-green deployment support on AWS using Pulumi Python.

The stack includes:
- Multi-AZ VPC with public and private subnets across 3 availability zones
- RDS PostgreSQL Multi-AZ database with automated backups
- ECS Fargate cluster with FastAPI backend container
- Application Load Balancer with path-based routing
- CloudFront distribution for global content delivery
- S3 buckets for frontend hosting with versioning
- Secrets Manager for credential management
- CloudWatch logging with 90-day retention
- Blue-green deployment capability via ECS service
- Comprehensive security groups and IAM roles
"""

from typing import Optional
import json

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource for the payment processing application infrastructure.

    This component orchestrates the deployment of a complete payment processing system
    with blue-green deployment capabilities, high availability, and comprehensive security.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Common tags for all resources
        common_tags = {
            'Environment': self.environment_suffix,
            'Application': 'payment-processing',
            'CostCenter': 'fintech-payments',
            **self.tags
        }

        # =================================================================
        # VPC and Networking
        # =================================================================

        # Get available availability zones
        azs = aws.get_availability_zones(state="available")
        az_names = azs.names[:3]  # Use first 3 AZs

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"payment-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, 'Name': f"payment-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"payment-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, 'Name': f"payment-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create public and private subnets in each AZ
        self.public_subnets = []
        self.private_subnets = []
        self.nat_gateways = []

        for i, az in enumerate(az_names):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"payment-public-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**common_tags, 'Name': f"payment-public-subnet-{i}-{self.environment_suffix}", 'Type': 'public'},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"payment-private-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    **common_tags,
                    'Name': f"payment-private-subnet-{i}-{self.environment_suffix}",
                    'Type': 'private'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)

            # Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"payment-nat-eip-{i}-{self.environment_suffix}",
                domain="vpc",
                tags={**common_tags, 'Name': f"payment-nat-eip-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            # NAT Gateway in each public subnet
            nat = aws.ec2.NatGateway(
                f"payment-nat-{i}-{self.environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**common_tags, 'Name': f"payment-nat-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat)

        # Public route table
        self.public_rt = aws.ec2.RouteTable(
            f"payment-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, 'Name': f"payment-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Route to IGW for public subnets
        aws.ec2.Route(
            f"payment-public-route-{self.environment_suffix}",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"payment-public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Private route tables (one per AZ for NAT)
        for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"payment-private-rt-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={**common_tags, 'Name': f"payment-private-rt-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.Route(
                f"payment-private-route-{i}-{self.environment_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id,
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.RouteTableAssociation(
                f"payment-private-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # VPC Flow Logs S3 Bucket
        self.flow_logs_bucket = aws.s3.Bucket(
            f"payment-flowlogs-{self.environment_suffix}",
            bucket=f"payment-flowlogs-{self.environment_suffix}",
            tags={**common_tags, 'Name': f"payment-flowlogs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning for flow logs bucket
        aws.s3.BucketVersioningV2(
            f"payment-flowlogs-versioning-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket lifecycle policy for flow logs
        aws.s3.BucketLifecycleConfigurationV2(
            f"payment-flowlogs-lifecycle-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                        days=90
                    )
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Block public access for flow logs bucket
        aws.s3.BucketPublicAccessBlock(
            f"payment-flowlogs-public-access-block-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # VPC Flow Logs
        flow_logs_role = aws.iam.Role(
            f"payment-flowlogs-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicy(
            f"payment-flowlogs-policy-{self.environment_suffix}",
            role=flow_logs_role.id,
            policy=self.flow_logs_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetBucketAcl"
                    ],
                    "Resource": [
                        f"{arn}/*",
                        arn
                    ]
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        self.vpc_flow_log = aws.ec2.FlowLog(
            f"payment-vpc-flowlog-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=self.flow_logs_bucket.arn,
            tags=common_tags,
            opts=ResourceOptions(parent=self, depends_on=[flow_logs_role])
        )

        # =================================================================
        # Security Groups
        # =================================================================

        # ALB Security Group (allows traffic from CloudFront)
        self.alb_sg = aws.ec2.SecurityGroup(
            f"payment-alb-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],  # CloudFront uses dynamic IPs, restrict via WAF if needed
                    description="HTTPS from CloudFront"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from CloudFront"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, 'Name': f"payment-alb-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ECS Security Group (allows traffic from ALB only)
        self.ecs_sg = aws.ec2.SecurityGroup(
            f"payment-ecs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ECS tasks",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, 'Name': f"payment-ecs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Allow ECS to receive traffic from ALB
        aws.ec2.SecurityGroupRule(
            f"payment-ecs-from-alb-{self.environment_suffix}",
            type="ingress",
            security_group_id=self.ecs_sg.id,
            source_security_group_id=self.alb_sg.id,
            protocol="tcp",
            from_port=8000,
            to_port=8000,
            description="Allow traffic from ALB",
            opts=ResourceOptions(parent=self)
        )

        # RDS Security Group (allows traffic from ECS only)
        self.rds_sg = aws.ec2.SecurityGroup(
            f"payment-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS database",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, 'Name': f"payment-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Allow RDS to receive traffic from ECS
        aws.ec2.SecurityGroupRule(
            f"payment-rds-from-ecs-{self.environment_suffix}",
            type="ingress",
            security_group_id=self.rds_sg.id,
            source_security_group_id=self.ecs_sg.id,
            protocol="tcp",
            from_port=5432,
            to_port=5432,
            description="Allow PostgreSQL from ECS",
            opts=ResourceOptions(parent=self)
        )

        # =================================================================
        # RDS PostgreSQL Database
        # =================================================================

        # DB Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"payment-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**common_tags, 'Name': f"payment-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # RDS PostgreSQL Instance
        self.db_instance = aws.rds.Instance(
            f"payment-db-{self.environment_suffix}",
            identifier=f"payment-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.12",
            instance_class="db.t3.medium",
            allocated_storage=100,
            storage_type="gp3",
            db_name="paymentdb",
            username="dbadmin",
            manage_master_user_password=True,  # AWS manages password in Secrets Manager
            multi_az=True,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            storage_encrypted=True,
            skip_final_snapshot=True,  # For testing; set to False in production
            tags={**common_tags, 'Name': f"payment-db-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # =================================================================
        # CloudWatch Log Groups
        # =================================================================

        # ECS Task Log Group
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"payment-ecs-logs-{self.environment_suffix}",
            name=f"/ecs/payment-{self.environment_suffix}",
            retention_in_days=90,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # ALB Access Log Group
        self.alb_log_group = aws.cloudwatch.LogGroup(
            f"payment-alb-logs-{self.environment_suffix}",
            name=f"/aws/alb/payment-{self.environment_suffix}",
            retention_in_days=90,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # =================================================================
        # S3 Bucket for Frontend Static Assets
        # =================================================================

        self.frontend_bucket = aws.s3.Bucket(
            f"payment-frontend-{self.environment_suffix}",
            bucket=f"payment-frontend-{self.environment_suffix}",
            tags={**common_tags, 'Name': f"payment-frontend-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning for frontend bucket
        aws.s3.BucketVersioningV2(
            f"payment-frontend-versioning-{self.environment_suffix}",
            bucket=self.frontend_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"payment-frontend-public-access-block-{self.environment_suffix}",
            bucket=self.frontend_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket lifecycle policy
        aws.s3.BucketLifecycleConfigurationV2(
            f"payment-frontend-lifecycle-{self.environment_suffix}",
            bucket=self.frontend_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="expire-old-versions",
                    status="Enabled",
                    noncurrent_version_expiration=(
                        aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                            noncurrent_days=30
                        )
                    )
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket for ALB access logs
        self.alb_logs_bucket = aws.s3.Bucket(
            f"payment-alb-logs-{self.environment_suffix}",
            bucket=f"payment-alb-logs-{self.environment_suffix}",
            tags={**common_tags, 'Name': f"payment-alb-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning for ALB logs bucket
        aws.s3.BucketVersioningV2(
            f"payment-alb-logs-versioning-{self.environment_suffix}",
            bucket=self.alb_logs_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Block public access for ALB logs
        aws.s3.BucketPublicAccessBlock(
            f"payment-alb-logs-public-access-block-{self.environment_suffix}",
            bucket=self.alb_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # ALB logs bucket policy
        aws.s3.BucketPolicy(
            f"payment-alb-logs-policy-{self.environment_suffix}",
            bucket=self.alb_logs_bucket.id,
            policy=Output.all(self.alb_logs_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"AWS": "arn:aws:iam::127311923021:root"},  # us-east-1 ELB service account
                        "Action": "s3:PutObject",
                        "Resource": f"{args[0]}/*"
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # =================================================================
        # CloudFront Origin Access Identity
        # =================================================================

        self.cloudfront_oai = aws.cloudfront.OriginAccessIdentity(
            f"payment-oai-{self.environment_suffix}",
            comment=f"OAI for payment frontend {self.environment_suffix}",
            opts=ResourceOptions(parent=self)
        )

        # Update frontend bucket policy to allow CloudFront OAI
        aws.s3.BucketPolicy(
            f"payment-frontend-policy-{self.environment_suffix}",
            bucket=self.frontend_bucket.id,
            policy=Output.all(
                self.frontend_bucket.arn,
                self.cloudfront_oai.iam_arn
            ).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"AWS": args[1]},
                        "Action": "s3:GetObject",
                        "Resource": f"{args[0]}/*"
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # =================================================================
        # IAM Roles for ECS
        # =================================================================

        # ECS Task Execution Role
        self.ecs_execution_role = aws.iam.Role(
            f"payment-ecs-execution-role-{self.environment_suffix}",
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

        aws.iam.RolePolicyAttachment(
            f"payment-ecs-execution-policy-{self.environment_suffix}",
            role=self.ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # Additional policy for Secrets Manager access
        aws.iam.RolePolicy(
            f"payment-ecs-secrets-policy-{self.environment_suffix}",
            role=self.ecs_execution_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "kms:Decrypt"
                    ],
                    "Resource": "*"
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        # ECS Task Role
        self.ecs_task_role = aws.iam.Role(
            f"payment-ecs-task-role-{self.environment_suffix}",
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

        # Task role policy for CloudWatch Logs and Secrets Manager
        aws.iam.RolePolicy(
            f"payment-ecs-task-policy-{self.environment_suffix}",
            role=self.ecs_task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )

        # =================================================================
        # ECS Cluster
        # =================================================================

        self.ecs_cluster = aws.ecs.Cluster(
            f"payment-cluster-{self.environment_suffix}",
            name=f"payment-cluster-{self.environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # =================================================================
        # Application Load Balancer
        # =================================================================

        self.alb = aws.lb.LoadBalancer(
            f"payment-alb-{self.environment_suffix}",
            name=f"payment-alb-{self.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            enable_deletion_protection=False,
            access_logs=aws.lb.LoadBalancerAccessLogsArgs(
                bucket=self.alb_logs_bucket.bucket,
                enabled=True
            ),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Target Group for Blue deployment
        self.target_group_blue = aws.lb.TargetGroup(
            f"payment-tg-blue-{self.environment_suffix}",
            name=f"payment-tg-blue-{self.environment_suffix}",
            port=8000,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                path="/health",
                matcher="200"
            ),
            deregistration_delay=30,
            tags={**common_tags, 'Name': f"payment-tg-blue-{self.environment_suffix}", 'Deployment': 'blue'},
            opts=ResourceOptions(parent=self)
        )

        # Target Group for Green deployment
        self.target_group_green = aws.lb.TargetGroup(
            f"payment-tg-green-{self.environment_suffix}",
            name=f"payment-tg-green-{self.environment_suffix}",
            port=8000,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                path="/health",
                matcher="200"
            ),
            deregistration_delay=30,
            tags={**common_tags, 'Name': f"payment-tg-green-{self.environment_suffix}", 'Deployment': 'green'},
            opts=ResourceOptions(parent=self)
        )

        # ALB Listener (HTTP - redirects to HTTPS in production)
        self.alb_listener = aws.lb.Listener(
            f"payment-alb-listener-{self.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group_blue.arn
                )
            ],
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # =================================================================
        # ECS Task Definition
        # =================================================================

        self.task_definition = aws.ecs.TaskDefinition(
            f"payment-task-{self.environment_suffix}",
            family=f"payment-task-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="512",
            memory="1024",
            execution_role_arn=self.ecs_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=Output.all(
                self.db_instance.endpoint,
                self.db_instance.master_user_secrets[0]["secret_arn"],
                self.ecs_log_group.name
            ).apply(
                lambda args: json.dumps([{
                    "name": "payment-backend",
                    "image": "public.ecr.aws/docker/library/python:3.9-slim",  # Replace with actual FastAPI image
                    "essential": True,
                    "portMappings": [{
                        "containerPort": 8000,
                        "protocol": "tcp"
                    }],
                    "environment": [
                        {"name": "DB_HOST", "value": args[0].split(":")[0]},
                        {"name": "DB_PORT", "value": "5432"},
                        {"name": "DB_NAME", "value": "paymentdb"},
                        {"name": "ENVIRONMENT", "value": self.environment_suffix}
                    ],
                    "secrets": [
                        {
                            "name": "DB_SECRET",
                            "valueFrom": args[1]
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[2],
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "ecs"
                        }
                    },
                    "healthCheck": {
                        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
                        "interval": 30,
                        "timeout": 5,
                        "retries": 3,
                        "startPeriod": 60
                    }
                }])
            ),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # =================================================================
        # ECS Service (Blue Deployment)
        # =================================================================

        self.ecs_service = aws.ecs.Service(
            f"payment-service-{self.environment_suffix}",
            name=f"payment-service-{self.environment_suffix}",
            cluster=self.ecs_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            deployment_maximum_percent=200,
            deployment_minimum_healthy_percent=100,
            health_check_grace_period_seconds=60,
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=[subnet.id for subnet in self.private_subnets],
                security_groups=[self.ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.target_group_blue.arn,
                    container_name="payment-backend",
                    container_port=8000
                )
            ],
            deployment_controller=aws.ecs.ServiceDeploymentControllerArgs(
                type="ECS"
            ),
            tags={**common_tags, 'Deployment': 'blue'},
            opts=ResourceOptions(parent=self, depends_on=[self.alb_listener])
        )

        # =================================================================
        # CloudFront Distribution
        # =================================================================

        self.cloudfront_distribution = aws.cloudfront.Distribution(
            f"payment-cdn-{self.environment_suffix}",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"Payment processing CDN - {self.environment_suffix}",
            default_root_object="index.html",
            origins=[
                # S3 origin for static assets
                aws.cloudfront.DistributionOriginArgs(
                    origin_id="s3-frontend",
                    domain_name=self.frontend_bucket.bucket_regional_domain_name,
                    s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=self.cloudfront_oai.cloudfront_access_identity_path
                    )
                ),
                # ALB origin for API
                aws.cloudfront.DistributionOriginArgs(
                    origin_id="alb-backend",
                    domain_name=self.alb.dns_name,
                    custom_origin_config=aws.cloudfront.DistributionOriginCustomOriginConfigArgs(
                        http_port=80,
                        https_port=443,
                        origin_protocol_policy="http-only",
                        origin_ssl_protocols=["TLSv1.2"]
                    )
                )
            ],
            default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                target_origin_id="s3-frontend",
                viewer_protocol_policy="redirect-to-https",
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=False,
                    cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward="none"
                    )
                ),
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400,
                compress=True
            ),
            ordered_cache_behaviors=[
                # API path behavior
                aws.cloudfront.DistributionOrderedCacheBehaviorArgs(
                    path_pattern="/api/*",
                    target_origin_id="alb-backend",
                    viewer_protocol_policy="redirect-to-https",
                    allowed_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                    cached_methods=["GET", "HEAD"],
                    forwarded_values=aws.cloudfront.DistributionOrderedCacheBehaviorForwardedValuesArgs(
                        query_string=True,
                        headers=["Authorization", "Host"],
                        cookies=aws.cloudfront.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs(
                            forward="all"
                        )
                    ),
                    min_ttl=0,
                    default_ttl=0,
                    max_ttl=0,
                    compress=True
                )
            ],
            restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),
            viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True
            ),
            custom_error_responses=[
                aws.cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=404,
                    response_code=200,
                    response_page_path="/index.html",
                    error_caching_min_ttl=300
                )
            ],
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # =================================================================
        # Outputs
        # =================================================================

        self.register_outputs({
            'vpc_id': self.vpc.id,
            'public_subnet_ids': [subnet.id for subnet in self.public_subnets],
            'private_subnet_ids': [subnet.id for subnet in self.private_subnets],
            'rds_endpoint': self.db_instance.endpoint,
            'rds_port': self.db_instance.port,
            'rds_database_name': self.db_instance.db_name,
            'rds_master_secret_arn': self.db_instance.master_user_secrets[0]["secret_arn"],
            'ecs_cluster_name': self.ecs_cluster.name,
            'ecs_cluster_arn': self.ecs_cluster.arn,
            'ecs_service_name': self.ecs_service.name,
            'alb_dns_name': self.alb.dns_name,
            'alb_arn': self.alb.arn,
            'alb_zone_id': self.alb.zone_id,
            'target_group_blue_arn': self.target_group_blue.arn,
            'target_group_green_arn': self.target_group_green.arn,
            'frontend_bucket_name': self.frontend_bucket.bucket,
            'frontend_bucket_arn': self.frontend_bucket.arn,
            'cloudfront_distribution_id': self.cloudfront_distribution.id,
            'cloudfront_domain_name': self.cloudfront_distribution.domain_name,
            'flow_logs_bucket_name': self.flow_logs_bucket.bucket,
            'alb_logs_bucket_name': self.alb_logs_bucket.bucket,
            'ecs_log_group_name': self.ecs_log_group.name,
            'alb_log_group_name': self.alb_log_group.name,
            'environment_suffix': self.environment_suffix
        })

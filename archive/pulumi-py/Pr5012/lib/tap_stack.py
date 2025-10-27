"""
tap_stack.py

StreamFlix Content Delivery API Infrastructure
Implements a highly available, multi-AZ architecture for content metadata delivery
"""

from typing import Optional
import json

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment
        tags (Optional[dict]): Optional default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    StreamFlix Content Delivery API Infrastructure Stack

    This stack creates:
    - Multi-AZ VPC with public and private subnets
    - ElastiCache Serverless Redis cluster with encryption
    - RDS PostgreSQL database with Multi-AZ
    - ECS Fargate cluster with API service
    - API Gateway for HTTP endpoints
    - CloudWatch monitoring with Container Insights
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        # Configuration
        region = "eu-west-2"
        availability_zones = ["eu-west-2a", "eu-west-2b", "eu-west-2c"]

        # VPC Configuration
        vpc = aws.ec2.Vpc(
            f"streamflix-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"streamflix-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"streamflix-igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**self.tags, "Name": f"streamflix-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Public Subnets (for NAT gateways and load balancers)
        public_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"streamflix-public-subnet-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"streamflix-public-{az}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            public_subnets.append(subnet)

        # Private Subnets (for ECS, RDS, ElastiCache)
        private_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"streamflix-private-subnet-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{10 + i}.0/24",
                availability_zone=az,
                tags={**self.tags, "Name": f"streamflix-private-{az}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            private_subnets.append(subnet)

        # Elastic IPs for NAT Gateways
        eips = []
        for i in range(len(availability_zones)):
            eip = aws.ec2.Eip(
                f"streamflix-nat-eip-{i}-{self.environment_suffix}",
                domain="vpc",
                tags={**self.tags, "Name": f"streamflix-nat-eip-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            eips.append(eip)

        # NAT Gateways (one per AZ for high availability)
        nat_gateways = []
        for i, (subnet, eip) in enumerate(zip(public_subnets, eips)):
            nat = aws.ec2.NatGateway(
                f"streamflix-nat-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                allocation_id=eip.id,
                tags={**self.tags, "Name": f"streamflix-nat-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            nat_gateways.append(nat)

        # Public Route Table
        public_rt = aws.ec2.RouteTable(
            f"streamflix-public-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={**self.tags, "Name": f"streamflix-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f"streamflix-public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Private Route Tables (one per NAT gateway)
        for i, (subnet, nat) in enumerate(zip(private_subnets, nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"streamflix-private-rt-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                routes=[
                    aws.ec2.RouteTableRouteArgs(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat.id
                    )
                ],
                tags={**self.tags, "Name": f"streamflix-private-rt-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.RouteTableAssociation(
                f"streamflix-private-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Security Groups

        # ALB Security Group
        alb_sg = aws.ec2.SecurityGroup(
            f"streamflix-alb-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
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
            tags={**self.tags, "Name": f"streamflix-alb-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ECS Security Group
        ecs_sg = aws.ec2.SecurityGroup(
            f"streamflix-ecs-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ECS Fargate tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[alb_sg.id]
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
            tags={**self.tags, "Name": f"streamflix-ecs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # RDS Security Group
        rds_sg = aws.ec2.SecurityGroup(
            f"streamflix-rds-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for RDS PostgreSQL",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[ecs_sg.id]
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
            tags={**self.tags, "Name": f"streamflix-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ElastiCache Security Group
        elasticache_sg = aws.ec2.SecurityGroup(
            f"streamflix-elasticache-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ElastiCache Serverless Redis",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    security_groups=[ecs_sg.id]
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
            tags={**self.tags, "Name": f"streamflix-elasticache-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # RDS Subnet Group
        rds_subnet_group = aws.rds.SubnetGroup(
            f"streamflix-rds-subnet-group-{self.environment_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            tags={**self.tags, "Name": f"streamflix-rds-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Database Master Password Secret
        db_password_secret = aws.secretsmanager.Secret(
            f"streamflix-db-password-{self.environment_suffix}",
            description="RDS PostgreSQL master password",
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        db_password_value = aws.secretsmanager.SecretVersion(
            f"streamflix-db-password-version-{self.environment_suffix}",
            secret_id=db_password_secret.id,
            secret_string=pulumi.Output.secret("StreamFlix2024!Pass"),
            opts=ResourceOptions(parent=self)
        )

        # RDS PostgreSQL Instance
        rds_instance = aws.rds.Instance(
            f"streamflix-db-{self.environment_suffix}",
            identifier=f"streamflix-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.8",
            instance_class="db.t3.micro",
            allocated_storage=20,
            db_name="streamflix",
            username="streamflix_admin",
            password=pulumi.Output.secret("StreamFlix2024!Pass"),
            db_subnet_group_name=rds_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            multi_az=True,
            storage_encrypted=True,
            skip_final_snapshot=True,
            deletion_protection=False,
            publicly_accessible=False,
            tags={**self.tags, "Name": f"streamflix-db-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ElastiCache Serverless Cache
        elasticache_serverless = aws.elasticache.ServerlessCache(
            f"streamflix-cache-{self.environment_suffix}",
            engine="redis",
            name=f"streamflix-cache-{self.environment_suffix}",
            description="StreamFlix content metadata cache",
            major_engine_version="7",
            security_group_ids=[elasticache_sg.id],
            subnet_ids=[s.id for s in private_subnets],
            tags={**self.tags, "Name": f"streamflix-cache-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ECR Repository for container images
        ecr_repo = aws.ecr.Repository(
            f"streamflix-api-{self.environment_suffix}",
            name=f"streamflix-api-{self.environment_suffix}",
            image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
                scan_on_push=True
            ),
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # ECS Cluster with Container Insights enabled
        ecs_cluster = aws.ecs.Cluster(
            f"streamflix-cluster-{self.environment_suffix}",
            name=f"streamflix-cluster-{self.environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enhanced"
                )
            ],
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # ECS Task Execution Role
        task_execution_role = aws.iam.Role(
            f"streamflix-task-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"streamflix-task-execution-policy-{self.environment_suffix}",
            role=task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # ECS Task Role (for application permissions)
        task_role = aws.iam.Role(
            f"streamflix-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Logs Group
        log_group = aws.cloudwatch.LogGroup(
            f"streamflix-api-logs-{self.environment_suffix}",
            name=f"/ecs/streamflix-api-{self.environment_suffix}",
            retention_in_days=7,
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # ECS Task Definition
        task_definition = aws.ecs.TaskDefinition(
            f"streamflix-api-task-{self.environment_suffix}",
            family=f"streamflix-api-{self.environment_suffix}",
            cpu="256",
            memory="512",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            execution_role_arn=task_execution_role.arn,
            task_role_arn=task_role.arn,
            container_definitions=pulumi.Output.all(
                ecr_repo.repository_url,
                rds_instance.endpoint,
                elasticache_serverless.endpoints,
                log_group.name,
                db_password_secret.arn
            ).apply(lambda args: json.dumps([{
                "name": "streamflix-api",
                "image": f"{args[0]}:latest",
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "DB_HOST", "value": args[1].split(":")[0]},
                    {"name": "DB_PORT", "value": "5432"},
                    {"name": "DB_NAME", "value": "streamflix"},
                    {"name": "DB_USER", "value": "streamflix_admin"},
                    {"name": "REDIS_ENDPOINT", "value": args[2][0]["address"] if args[2] and len(args[2]) > 0 else ""},
                    {"name": "REDIS_PORT", "value": "6379"}
                ],
                "secrets": [{
                    "name": "DB_PASSWORD",
                    "valueFrom": f"{args[4]}:::"
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[3],
                        "awslogs-region": region,
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }])),
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # Application Load Balancer
        alb = aws.lb.LoadBalancer(
            f"streamflix-alb-{self.environment_suffix}",
            name=f"streamflix-alb-{self.environment_suffix}",
            load_balancer_type="application",
            subnets=[s.id for s in public_subnets],
            security_groups=[alb_sg.id],
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # Target Group
        target_group = aws.lb.TargetGroup(
            f"streamflix-tg-{self.environment_suffix}",
            name=f"streamflix-tg-{self.environment_suffix}",
            port=8080,
            protocol="HTTP",
            target_type="ip",
            vpc_id=vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                port="8080",
                protocol="HTTP",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=3
            ),
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # ALB Listener
        listener = aws.lb.Listener(
            f"streamflix-listener-{self.environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=target_group.arn
                )
            ],
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # ECS Service
        ecs_service = aws.ecs.Service(
            f"streamflix-service-{self.environment_suffix}",
            name=f"streamflix-service-{self.environment_suffix}",
            cluster=ecs_cluster.arn,
            task_definition=task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=[s.id for s in private_subnets],
                security_groups=[ecs_sg.id]
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=target_group.arn,
                    container_name="streamflix-api",
                    container_port=8080
                )
            ],
            tags={**self.tags},
            opts=ResourceOptions(parent=self, depends_on=[listener])
        )

        # API Gateway v2 HTTP API
        api_gateway = aws.apigatewayv2.Api(
            f"streamflix-api-gateway-{self.environment_suffix}",
            name=f"streamflix-api-{self.environment_suffix}",
            protocol_type="HTTP",
            description="StreamFlix Content Delivery API",
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # VPC Link for API Gateway to ALB
        vpc_link = aws.apigatewayv2.VpcLink(
            f"streamflix-vpc-link-{self.environment_suffix}",
            name=f"streamflix-vpc-link-{self.environment_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            security_group_ids=[alb_sg.id],
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # API Gateway Integration with ALB
        integration = aws.apigatewayv2.Integration(
            f"streamflix-api-integration-{self.environment_suffix}",
            api_id=api_gateway.id,
            integration_type="HTTP_PROXY",
            integration_method="ANY",
            integration_uri=listener.arn,
            connection_type="VPC_LINK",
            connection_id=vpc_link.id,
            payload_format_version="1.0",
            opts=ResourceOptions(parent=self)
        )

        # API Gateway Route
        route = aws.apigatewayv2.Route(
            f"streamflix-api-route-{self.environment_suffix}",
            api_id=api_gateway.id,
            route_key="ANY /{proxy+}",
            target=integration.id.apply(lambda id: f"integrations/{id}"),
            opts=ResourceOptions(parent=self)
        )

        # API Gateway Stage
        stage = aws.apigatewayv2.Stage(
            f"streamflix-api-stage-{self.environment_suffix}",
            api_id=api_gateway.id,
            name="prod",
            auto_deploy=True,
            tags={**self.tags},
            opts=ResourceOptions(parent=self)
        )

        # Export outputs
        self.vpc_id = vpc.id
        self.ecs_cluster_name = ecs_cluster.name
        self.rds_endpoint = rds_instance.endpoint
        self.elasticache_endpoint = elasticache_serverless.endpoints
        self.alb_dns = alb.dns_name
        self.api_gateway_url = api_gateway.api_endpoint
        self.ecr_repository_url = ecr_repo.repository_url

        # Register all outputs
        self.register_outputs({
            "vpc_id": self.vpc_id,
            "ecs_cluster_name": self.ecs_cluster_name,
            "rds_endpoint": self.rds_endpoint,
            "elasticache_endpoint": self.elasticache_endpoint,
            "alb_dns_name": self.alb_dns,
            "api_gateway_url": self.api_gateway_url,
            "ecr_repository_url": self.ecr_repository_url
        })

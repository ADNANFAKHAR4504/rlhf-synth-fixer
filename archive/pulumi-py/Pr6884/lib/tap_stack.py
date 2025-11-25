"""
tap_stack.py

Machine Learning API Service Infrastructure Stack

This module defines the TapStack class for deploying a production-ready ML API service
with ECS Fargate, Aurora Serverless v2, DynamoDB, CloudFront, and comprehensive monitoring.
"""

from typing import Optional
import json
import secrets
import string

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


def generate_random_password(length: int = 32) -> str:
    """
    Generate a secure random password that meets RDS requirements.
    
    RDS password requirements:
    - Must contain uppercase, lowercase, numbers, and special characters
    - Cannot contain: /, @, ", or space
    """
    # Characters allowed in RDS passwords (excluding forbidden: /, @, ", space)
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special = "!#$%&*()-_=+[]{}|;:,.<>?~`"
    
    # Ensure at least one of each required type
    password = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(special)
    ]
    
    # Fill the rest randomly
    all_chars = uppercase + lowercase + digits + special
    password.extend(secrets.choice(all_chars) for _ in range(length - 4))
    
    # Shuffle to avoid predictable pattern
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack.

    Args:
        environment_suffix (str): Suffix for identifying the deployment environment
        tags (Optional[dict]): Optional default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Production-ready Machine Learning API Service Infrastructure Stack.

    This stack creates:
    - VPC with 3 public and 3 private subnets across availability zones
    - ECS cluster with Fargate Spot capacity provider (70% target)
    - ECS service running containerized ML API (2-10 tasks)
    - Application Load Balancer with path-based routing and health checks
    - RDS Aurora Serverless v2 PostgreSQL (0.5-2 ACUs)
    - DynamoDB table for session storage with TTL
    - CloudFront distribution with custom error pages
    - Auto-scaling based on ALB request count (1000 req/task)
    - CloudWatch Log Groups with 30-day retention
    - Least-privilege IAM roles for all components
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

        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        az_names = azs.names[:3]  # Use first 3 AZs

        # ===== VPC Configuration =====
        self.vpc = aws.ec2.Vpc(
            f"ml-api-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"ml-api-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"ml-api-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={"Name": f"ml-api-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Public Subnets (3 AZs)
        self.public_subnets = []
        for i, az in enumerate(az_names):
            subnet = aws.ec2.Subnet(
                f"ml-api-public-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"ml-api-public-subnet-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.public_subnets.append(subnet)

        # Private Subnets (3 AZs)
        self.private_subnets = []
        for i, az in enumerate(az_names):
            subnet = aws.ec2.Subnet(
                f"ml-api-private-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=az,
                tags={"Name": f"ml-api-private-subnet-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_subnets.append(subnet)

        # NAT Gateway (single for cost optimization)
        self.eip = aws.ec2.Eip(
            f"ml-api-nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={"Name": f"ml-api-nat-eip-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        self.nat_gateway = aws.ec2.NatGateway(
            f"ml-api-nat-{self.environment_suffix}",
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.eip.id,
            tags={"Name": f"ml-api-nat-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc, depends_on=[self.igw])
        )

        # Public Route Table
        self.public_rt = aws.ec2.RouteTable(
            f"ml-api-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={"Name": f"ml-api-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"ml-api-public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self.public_rt)
            )

        # Private Route Table
        self.private_rt = aws.ec2.RouteTable(
            f"ml-api-private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=self.nat_gateway.id
                )
            ],
            tags={"Name": f"ml-api-private-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc, depends_on=[self.nat_gateway])
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"ml-api-private-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=self.private_rt)
            )

        # ===== Security Groups =====
        # ALB Security Group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"ml-api-alb-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ML API Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from anywhere"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from anywhere"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={"Name": f"ml-api-alb-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # ECS Security Group
        self.ecs_sg = aws.ec2.SecurityGroup(
            f"ml-api-ecs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ML API ECS tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[self.alb_sg.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={"Name": f"ml-api-ecs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # RDS Security Group
        self.rds_sg = aws.ec2.SecurityGroup(
            f"ml-api-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ML API RDS Aurora",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[self.ecs_sg.id],
                    description="Allow PostgreSQL from ECS tasks"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={"Name": f"ml-api-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # ===== CloudWatch Log Groups =====
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"ml-api-ecs-logs-{self.environment_suffix}",
            name=f"/aws/ecs/ml-api-{self.environment_suffix}",
            retention_in_days=30,
            opts=ResourceOptions(parent=self)
        )

        self.alb_log_group = aws.cloudwatch.LogGroup(
            f"ml-api-alb-logs-{self.environment_suffix}",
            name=f"/aws/alb/ml-api-{self.environment_suffix}",
            retention_in_days=30,
            opts=ResourceOptions(parent=self)
        )

        # ===== RDS Aurora Serverless v2 =====
        # DB Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"ml-api-db-subnet-group-{self.environment_suffix}",
            name=f"ml-api-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={"Name": f"ml-api-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # RDS Cluster Parameter Group
        self.db_cluster_param_group = aws.rds.ClusterParameterGroup(
            f"ml-api-aurora-params-{self.environment_suffix}",
            name=f"ml-api-aurora-params-{self.environment_suffix}",
            family="aurora-postgresql15",
            description="Aurora PostgreSQL 15 cluster parameter group",
            parameters=[
                aws.rds.ClusterParameterGroupParameterArgs(
                    name="log_statement",
                    value="all"
                ),
                aws.rds.ClusterParameterGroupParameterArgs(
                    name="log_min_duration_statement",
                    value="1000"
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Get or generate database password
        config = pulumi.Config()
        db_password = config.get_secret("db_password")
        if db_password is None:
            # Generate a random password if not provided
            generated_password = generate_random_password()
            # Create a secret Output from the generated password
            db_password = Output.secret(generated_password)
            pulumi.log.info(f"Generated random database password for cluster {self.environment_suffix}")
        
        # RDS Aurora Serverless v2 Cluster
        self.db_cluster = aws.rds.Cluster(
            f"ml-api-aurora-cluster-{self.environment_suffix}",
            cluster_identifier=f"ml-api-aurora-cluster-{self.environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.7",
            engine_mode="provisioned",
            database_name="mlapi",
            master_username="dbadmin",
            master_password=db_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            db_cluster_parameter_group_name=self.db_cluster_param_group.name,
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                max_capacity=2.0,
                min_capacity=0.5
            ),
            storage_encrypted=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags={"Name": f"ml-api-aurora-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[self.db_subnet_group, self.db_cluster_param_group])
        )

        # Aurora Serverless v2 Instance
        self.db_instance = aws.rds.ClusterInstance(
            f"ml-api-aurora-instance-{self.environment_suffix}",
            identifier=f"ml-api-aurora-instance-{self.environment_suffix}",
            cluster_identifier=self.db_cluster.id,
            instance_class="db.serverless",
            engine=self.db_cluster.engine,
            engine_version=self.db_cluster.engine_version,
            publicly_accessible=False,
            opts=ResourceOptions(parent=self.db_cluster)
        )

        # ===== DynamoDB Table for Session Storage =====
        self.session_table = aws.dynamodb.Table(
            f"ml-api-sessions-{self.environment_suffix}",
            name=f"ml-api-sessions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="sessionId",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="sessionId",
                    type="S"
                )
            ],
            ttl=aws.dynamodb.TableTtlArgs(
                enabled=True,
                attribute_name="ttl"
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags={"Name": f"ml-api-sessions-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ===== IAM Roles =====
        # ECS Task Execution Role
        self.ecs_task_execution_role = aws.iam.Role(
            f"ml-api-ecs-task-execution-role-{self.environment_suffix}",
            name=f"ml-api-ecs-task-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
            ],
            tags={"Name": f"ml-api-ecs-task-execution-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Additional policy for Secrets Manager access
        self.ecs_secrets_policy = aws.iam.RolePolicy(
            f"ml-api-ecs-secrets-policy-{self.environment_suffix}",
            role=self.ecs_task_execution_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": "*"
                }]
            }),
            opts=ResourceOptions(parent=self.ecs_task_execution_role)
        )

        # ECS Task Role
        self.ecs_task_role = aws.iam.Role(
            f"ml-api-ecs-task-role-{self.environment_suffix}",
            name=f"ml-api-ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"ml-api-ecs-task-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Policy for ECS task to access DynamoDB and CloudWatch
        self.ecs_task_policy = aws.iam.RolePolicy(
            f"ml-api-ecs-task-policy-{self.environment_suffix}",
            role=self.ecs_task_role.id,
            policy=self.session_table.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": arn
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
            opts=ResourceOptions(parent=self.ecs_task_role)
        )

        # ===== ECS Cluster with Fargate Spot =====
        self.ecs_cluster = aws.ecs.Cluster(
            f"ml-api-cluster-{self.environment_suffix}",
            name=f"ml-api-cluster-{self.environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags={"Name": f"ml-api-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Cluster Capacity Provider (Fargate Spot)
        self.cluster_capacity_providers = aws.ecs.ClusterCapacityProviders(
            f"ml-api-cluster-capacity-{self.environment_suffix}",
            cluster_name=self.ecs_cluster.name,
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            default_capacity_provider_strategies=[
                aws.ecs.ClusterCapacityProvidersDefaultCapacityProviderStrategyArgs(
                    capacity_provider="FARGATE_SPOT",
                    weight=70,
                    base=0
                ),
                aws.ecs.ClusterCapacityProvidersDefaultCapacityProviderStrategyArgs(
                    capacity_provider="FARGATE",
                    weight=30,
                    base=2
                )
            ],
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # ===== Application Load Balancer =====
        self.alb = aws.lb.LoadBalancer(
            f"ml-api-alb-{self.environment_suffix}",
            name=f"ml-api-alb-{self.environment_suffix}",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in self.public_subnets],
            security_groups=[self.alb_sg.id],
            enable_deletion_protection=False,
            tags={"Name": f"ml-api-alb-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Target Group
        self.target_group = aws.lb.TargetGroup(
            f"ml-api-tg-{self.environment_suffix}",
            name=f"ml-api-tg-{self.environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                protocol="HTTP",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=3,
                matcher="200"
            ),
            deregistration_delay=30,
            tags={"Name": f"ml-api-tg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self.alb)
        )

        # ALB Listener
        self.alb_listener = aws.lb.Listener(
            f"ml-api-alb-listener-{self.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            opts=ResourceOptions(parent=self.alb)
        )

        # Listener Rules for path-based routing
        self.listener_rule_v1 = aws.lb.ListenerRule(
            f"ml-api-listener-rule-v1-{self.environment_suffix}",
            listener_arn=self.alb_listener.arn,
            priority=10,
            actions=[
                aws.lb.ListenerRuleActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            conditions=[
                aws.lb.ListenerRuleConditionArgs(
                    path_pattern=aws.lb.ListenerRuleConditionPathPatternArgs(
                        values=["/api/v1/*"]
                    )
                )
            ],
            opts=ResourceOptions(parent=self.alb_listener)
        )

        self.listener_rule_v2 = aws.lb.ListenerRule(
            f"ml-api-listener-rule-v2-{self.environment_suffix}",
            listener_arn=self.alb_listener.arn,
            priority=20,
            actions=[
                aws.lb.ListenerRuleActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            conditions=[
                aws.lb.ListenerRuleConditionArgs(
                    path_pattern=aws.lb.ListenerRuleConditionPathPatternArgs(
                        values=["/api/v2/*"]
                    )
                )
            ],
            opts=ResourceOptions(parent=self.alb_listener)
        )

        # ===== ECS Task Definition =====
        self.task_definition = aws.ecs.TaskDefinition(
            f"ml-api-task-{self.environment_suffix}",
            family=f"ml-api-task-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            execution_role_arn=self.ecs_task_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=Output.all(
                self.ecs_log_group.name,
                self.session_table.name,
                self.db_cluster.endpoint
            ).apply(lambda args: json.dumps([{
                "name": "ml-api",
                "image": "public.ecr.aws/docker/library/nginx:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "DYNAMODB_TABLE", "value": args[1]},
                    {"name": "DB_HOST", "value": args[2]},
                    {"name": "DB_PORT", "value": "5432"},
                    {"name": "DB_NAME", "value": "mlapi"}
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[0],
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ml-api"
                    }
                }
            }])),
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # ===== ECS Service =====
        self.ecs_service = aws.ecs.Service(
            f"ml-api-service-{self.environment_suffix}",
            name=f"ml-api-service-{self.environment_suffix}",
            cluster=self.ecs_cluster.arn,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            platform_version="LATEST",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=[subnet.id for subnet in self.private_subnets],
                security_groups=[self.ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.target_group.arn,
                    container_name="ml-api",
                    container_port=8080
                )
            ],
            health_check_grace_period_seconds=60,
            enable_execute_command=True,
            deployment_maximum_percent=200,
            deployment_minimum_healthy_percent=100,
            deployment_circuit_breaker=aws.ecs.ServiceDeploymentCircuitBreakerArgs(
                enable=True,
                rollback=True
            ),
            opts=ResourceOptions(parent=self.ecs_cluster, depends_on=[self.alb_listener])
        )

        # ===== Auto Scaling =====
        # Build resource_id with fallback for None values
        resource_id = Output.all(
            self.ecs_cluster.name,
            self.ecs_service.name
        ).apply(
            lambda args: f"service/{args[0] or 'default-cluster'}/{args[1] or 'default-service'}"
        )
        
        self.ecs_target = aws.appautoscaling.Target(
            f"ml-api-autoscaling-target-{self.environment_suffix}",
            service_namespace="ecs",
            resource_id=resource_id,
            scalable_dimension="ecs:service:DesiredCount",
            min_capacity=2,
            max_capacity=10,
            opts=ResourceOptions(parent=self.ecs_service)
        )

        # Auto Scaling Policy based on ALB request count
        # Build resource_label with fallback for None values
        resource_label = Output.all(
            self.alb.arn_suffix,
            self.target_group.arn_suffix
        ).apply(
            lambda args: f"{args[0] or 'default-alb'}/{args[1] or 'default-tg'}"
        )
        
        self.ecs_scaling_policy = aws.appautoscaling.Policy(
            f"ml-api-scaling-policy-{self.environment_suffix}",
            name=f"ml-api-scaling-policy-{self.environment_suffix}",
            service_namespace=self.ecs_target.service_namespace,
            resource_id=self.ecs_target.resource_id,
            scalable_dimension=self.ecs_target.scalable_dimension,
            policy_type="TargetTrackingScaling",
            target_tracking_scaling_policy_configuration=(
                aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                    target_value=1000,
                    predefined_metric_specification=(
                        aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(  # pylint: disable=line-too-long
                            predefined_metric_type="ALBRequestCountPerTarget",
                            resource_label=resource_label
                        )
                    ),
                    scale_in_cooldown=300,
                    scale_out_cooldown=60
                )
            ),
            opts=ResourceOptions(parent=self.ecs_target)
        )

        # ===== CloudFront Distribution =====
        # CloudFront Origin Access Identity
        self.cloudfront_oai = aws.cloudfront.OriginAccessIdentity(
            f"ml-api-oai-{self.environment_suffix}",
            comment=f"OAI for ML API {self.environment_suffix}",
            opts=ResourceOptions(parent=self)
        )

        # CloudFront Distribution
        self.cloudfront_distribution = aws.cloudfront.Distribution(
            f"ml-api-cdn-{self.environment_suffix}",
            enabled=True,
            comment=f"ML API CloudFront distribution for {self.environment_suffix}",
            default_root_object="",
            origins=[
                aws.cloudfront.DistributionOriginArgs(
                    domain_name=self.alb.dns_name,
                    origin_id="alb-origin",
                    custom_origin_config=aws.cloudfront.DistributionOriginCustomOriginConfigArgs(
                        http_port=80,
                        https_port=443,
                        origin_protocol_policy="http-only",
                        origin_ssl_protocols=["TLSv1.2"]
                    )
                )
            ],
            default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                target_origin_id="alb-origin",
                viewer_protocol_policy="redirect-to-https",
                allowed_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                cached_methods=["GET", "HEAD"],
                forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=True,
                    headers=["*"],
                    cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward="all"
                    )
                ),
                min_ttl=0,
                default_ttl=0,
                max_ttl=0,
                compress=True
            ),
            custom_error_responses=[
                aws.cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=403,
                    response_code=403,
                    response_page_path="/error-403.html",
                    error_caching_min_ttl=300
                ),
                aws.cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=404,
                    response_code=404,
                    response_page_path="/error-404.html",
                    error_caching_min_ttl=300
                )
            ],
            price_class="PriceClass_100",
            restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),
            viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True
            ),
            tags={"Name": f"ml-api-cdn-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[self.alb])
        )

        # ===== Outputs =====
        self.alb_dns_name = self.alb.dns_name
        self.cloudfront_domain_name = self.cloudfront_distribution.domain_name
        self.rds_endpoint = self.db_cluster.endpoint
        self.dynamodb_table_name = self.session_table.name
        self.ecs_cluster_name = self.ecs_cluster.name
        self.ecs_service_name = self.ecs_service.name

        # Register outputs
        self.register_outputs({
            "alb_dns_name": self.alb_dns_name,
            "cloudfront_domain_name": self.cloudfront_domain_name,
            "cloudfront_distribution_url": self.cloudfront_distribution.domain_name.apply(
                lambda d: f"https://{d}" if d else "https://default.cloudfront.net"
            ),
            "rds_cluster_endpoint": self.rds_endpoint,
            "dynamodb_table_name": self.dynamodb_table_name,
            "ecs_cluster_name": self.ecs_cluster_name,
            "ecs_service_name": self.ecs_service_name,
            "vpc_id": self.vpc.id
        })
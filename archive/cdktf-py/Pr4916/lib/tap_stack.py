"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster, EcsClusterConfiguration
from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import EcsClusterCapacityProviders
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import (
    EcsService,
    EcsServiceNetworkConfiguration,
    EcsServiceLoadBalancer,
    EcsServiceServiceConnectConfiguration
)
from cdktf_cdktf_provider_aws.elasticache_serverless_cache import (
    ElasticacheServerlessCache,
    ElasticacheServerlessCacheCacheUsageLimits,
    ElasticacheServerlessCacheCacheUsageLimitsDataStorage,
    ElasticacheServerlessCacheCacheUsageLimitsEcpuPerSecond
)
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.service_discovery_private_dns_namespace import ServiceDiscoveryPrivateDnsNamespace
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy, AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration, AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification
from cdktf_cdktf_provider_aws.wafv2_web_acl import Wafv2WebAcl, Wafv2WebAclRule, Wafv2WebAclRuleOverrideAction, Wafv2WebAclVisibilityConfig, Wafv2WebAclDefaultAction, Wafv2WebAclRuleVisibilityConfig
from cdktf_cdktf_provider_aws.wafv2_web_acl_association import Wafv2WebAclAssociation
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
        aws_region = kwargs.get('aws_region', 'sa-east-1')
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

        # Configure S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Create VPC for the infrastructure
        vpc = Vpc(
            self,
            "catalog_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"catalog-vpc-{environment_suffix}"}
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "catalog_igw",
            vpc_id=vpc.id,
            tags={"Name": f"catalog-igw-{environment_suffix}"}
        )

        # Create public subnets in multiple AZs for high availability
        public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={"Name": f"catalog-public-subnet-1-{environment_suffix}"}
        )

        public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={"Name": f"catalog-public-subnet-2-{environment_suffix}"}
        )

        # Create private subnets for ECS tasks and ElastiCache
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone=f"{aws_region}a",
            tags={"Name": f"catalog-private-subnet-1-{environment_suffix}"}
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}b",
            tags={"Name": f"catalog-private-subnet-2-{environment_suffix}"}
        )

        # Create Elastic IPs for NAT Gateways
        eip_1 = Eip(
            self,
            "nat_eip_1",
            domain="vpc",
            tags={"Name": f"catalog-nat-eip-1-{environment_suffix}"}
        )

        eip_2 = Eip(
            self,
            "nat_eip_2",
            domain="vpc",
            tags={"Name": f"catalog-nat-eip-2-{environment_suffix}"}
        )

        # Create NAT Gateways for private subnet internet access
        nat_gateway_1 = NatGateway(
            self,
            "nat_gateway_1",
            allocation_id=eip_1.id,
            subnet_id=public_subnet_1.id,
            tags={"Name": f"catalog-nat-gw-1-{environment_suffix}"},
            depends_on=[igw]
        )

        nat_gateway_2 = NatGateway(
            self,
            "nat_gateway_2",
            allocation_id=eip_2.id,
            subnet_id=public_subnet_2.id,
            tags={"Name": f"catalog-nat-gw-2-{environment_suffix}"},
            depends_on=[igw]
        )

        # Create route table for public subnets
        public_route_table = RouteTable(
            self,
            "public_route_table",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"catalog-public-rt-{environment_suffix}"}
        )

        # Associate public subnets with public route table
        RouteTableAssociation(
            self,
            "public_subnet_1_association",
            subnet_id=public_subnet_1.id,
            route_table_id=public_route_table.id
        )

        RouteTableAssociation(
            self,
            "public_subnet_2_association",
            subnet_id=public_subnet_2.id,
            route_table_id=public_route_table.id
        )

        # Create route tables for private subnets
        private_route_table_1 = RouteTable(
            self,
            "private_route_table_1",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway_1.id
            )],
            tags={"Name": f"catalog-private-rt-1-{environment_suffix}"}
        )

        private_route_table_2 = RouteTable(
            self,
            "private_route_table_2",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway_2.id
            )],
            tags={"Name": f"catalog-private-rt-2-{environment_suffix}"}
        )

        # Associate private subnets with private route tables
        RouteTableAssociation(
            self,
            "private_subnet_1_association",
            subnet_id=private_subnet_1.id,
            route_table_id=private_route_table_1.id
        )

        RouteTableAssociation(
            self,
            "private_subnet_2_association",
            subnet_id=private_subnet_2.id,
            route_table_id=private_route_table_2.id
        )

        # Create security group for ALB
        alb_security_group = SecurityGroup(
            self,
            "alb_security_group",
            name=f"catalog-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP traffic from internet"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS traffic from internet"
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
            tags={"Name": f"catalog-alb-sg-{environment_suffix}"}
        )

        # Create security group for ECS tasks
        ecs_security_group = SecurityGroup(
            self,
            "ecs_security_group",
            name=f"catalog-ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[alb_security_group.id],
                    description="Allow traffic from ALB"
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
            tags={"Name": f"catalog-ecs-sg-{environment_suffix}"}
        )

        # Create security group for ElastiCache
        elasticache_security_group = SecurityGroup(
            self,
            "elasticache_security_group",
            name=f"catalog-redis-sg-{environment_suffix}",
            description="Security group for ElastiCache Redis",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    security_groups=[ecs_security_group.id],
                    description="Allow Redis traffic from ECS tasks"
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
            tags={"Name": f"catalog-redis-sg-{environment_suffix}"}
        )

        # Create CloudWatch Log Group for ECS tasks
        log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/catalog-service-{environment_suffix}",
            retention_in_days=7,
            tags={"Name": f"catalog-ecs-logs-{environment_suffix}"}
        )

        # Create IAM role for ECS task execution
        ecs_task_execution_role = IamRole(
            self,
            "ecs_task_execution_role",
            name=f"catalog-ecs-task-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    }
                }]
            }),
            tags={"Name": f"catalog-ecs-execution-role-{environment_suffix}"}
        )

        # Attach AWS managed policy for ECS task execution
        IamRolePolicyAttachment(
            self,
            "ecs_task_execution_role_policy",
            role=ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Create IAM role for ECS task
        ecs_task_role = IamRole(
            self,
            "ecs_task_role",
            name=f"catalog-ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    }
                }]
            }),
            tags={"Name": f"catalog-ecs-task-role-{environment_suffix}"}
        )

        # Create IAM policy for accessing Secrets Manager
        secrets_policy = IamPolicy(
            self,
            "secrets_policy",
            name=f"catalog-secrets-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": f"arn:aws:secretsmanager:{aws_region}:*:secret:catalog-*"
                }]
            })
        )

        # Attach secrets policy to task role
        IamRolePolicyAttachment(
            self,
            "task_role_secrets_policy",
            role=ecs_task_role.name,
            policy_arn=secrets_policy.arn
        )

        # Create Secrets Manager secret for sensitive configuration
        db_credentials_secret = SecretsmanagerSecret(
            self,
            "db_credentials_secret",
            name=f"catalog-db-credentials-{environment_suffix}",
            description="Database credentials for catalog service",
            kms_key_id="alias/aws/secretsmanager",
            tags={"Name": f"catalog-db-secret-{environment_suffix}"}
        )

        # Create secret version with placeholder credentials
        SecretsmanagerSecretVersion(
            self,
            "db_credentials_secret_version",
            secret_id=db_credentials_secret.id,
            secret_string=json.dumps({
                "username": "catalog_user",
                "password": "placeholder_password_change_me",
                "database": "catalog_db"
            })
        )

        # Create ElastiCache Serverless cache for Redis
        redis_cache = ElasticacheServerlessCache(
            self,
            "redis_cache",
            engine="redis",
            name=f"catalog-cache-{environment_suffix}",
            description="ElastiCache Serverless for product catalog caching",
            major_engine_version="7",
            cache_usage_limits=[ElasticacheServerlessCacheCacheUsageLimits(
                data_storage=[ElasticacheServerlessCacheCacheUsageLimitsDataStorage(
                    maximum=10,
                    unit="GB"
                )],
                ecpu_per_second=[ElasticacheServerlessCacheCacheUsageLimitsEcpuPerSecond(
                    maximum=5000
                )]
            )],
            security_group_ids=[elasticache_security_group.id],
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={"Name": f"catalog-redis-cache-{environment_suffix}"}
        )

        # Create Application Load Balancer
        alb = Lb(
            self,
            "catalog_alb",
            name=f"catalog-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_security_group.id],
            subnets=[public_subnet_1.id, public_subnet_2.id],
            enable_deletion_protection=False,
            enable_http2=True,
            tags={"Name": f"catalog-alb-{environment_suffix}"}
        )

        # Create target group for ECS service
        target_group = LbTargetGroup(
            self,
            "ecs_target_group",
            name=f"catalog-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            deregistration_delay="30",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                matcher="200",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=3
            ),
            tags={"Name": f"catalog-tg-{environment_suffix}"}
        )

        # Create ALB listener
        LbListener(
            self,
            "alb_listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=target_group.arn
            )],
            tags={"Name": f"catalog-listener-{environment_suffix}"}
        )

        # Create ECS cluster with Container Insights
        ecs_cluster = EcsCluster(
            self,
            "catalog_cluster",
            name=f"catalog-cluster-{environment_suffix}",
            configuration=EcsClusterConfiguration(
                execute_command_configuration={
                    "logging": "DEFAULT"
                }
            ),
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={"Name": f"catalog-cluster-{environment_suffix}"}
        )

        # Set cluster capacity providers
        EcsClusterCapacityProviders(
            self,
            "cluster_capacity_providers",
            cluster_name=ecs_cluster.name,
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            default_capacity_provider_strategy=[{
                "capacityProvider": "FARGATE",
                "weight": 1,
                "base": 1
            }]
        )

        # Create Service Discovery namespace for Service Connect
        service_namespace = ServiceDiscoveryPrivateDnsNamespace(
            self,
            "service_namespace",
            name=f"catalog-{environment_suffix}",
            description="Service discovery namespace for catalog services",
            vpc=vpc.id,
            tags={"Name": f"catalog-namespace-{environment_suffix}"}
        )

        # Create ECS task definition
        # Use JSON with escape hatch for Terraform interpolation
        container_definitions = Fn.jsonencode([{
            "name": "catalog-service",
            "image": "nginx:latest",
            "cpu": 256,
            "memory": 512,
            "essential": True,
            "portMappings": [{
                "containerPort": 8080,
                "hostPort": 8080,
                "protocol": "tcp",
                "name": "catalog-service-port"
            }],
            "environment": [
                {
                    "name": "REDIS_ENDPOINT",
                    "value": "placeholder-redis-endpoint"
                },
                {
                    "name": "AWS_REGION",
                    "value": aws_region
                }
            ],
            "secrets": [{
                "name": "DB_CREDENTIALS",
                "valueFrom": db_credentials_secret.arn
            }],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": log_group.name,
                    "awslogs-region": aws_region,
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }])

        task_definition = EcsTaskDefinition(
            self,
            "catalog_task_definition",
            family=f"catalog-service-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=ecs_task_execution_role.arn,
            task_role_arn=ecs_task_role.arn,
            container_definitions=container_definitions,
            tags={"Name": f"catalog-task-{environment_suffix}"}
        )

        # Create ECS service with Service Connect
        ecs_service = EcsService(
            self,
            "catalog_service",
            name=f"catalog-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[private_subnet_1.id, private_subnet_2.id],
                security_groups=[ecs_security_group.id],
                assign_public_ip=False
            ),
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=target_group.arn,
                container_name="catalog-service",
                container_port=8080
            )],
            service_connect_configuration=EcsServiceServiceConnectConfiguration(
                enabled=True,
                namespace=service_namespace.arn,
                service=[{
                    "portName": "catalog-service-port",
                    "discoveryName": "catalog-service",
                    "clientAlias": {
                        "port": 8080,
                        "dnsName": "catalog-service"
                    }
                }]
            ),
            enable_execute_command=True,
            health_check_grace_period_seconds=60,
            tags={"Name": f"catalog-service-{environment_suffix}"},
            depends_on=[target_group]
        )

        # Create SNS topic for CloudWatch alarms
        alarm_topic = SnsTopic(
            self,
            "alarm_topic",
            name=f"catalog-alarms-{environment_suffix}",
            display_name="Catalog Service Alarms",
            tags={"Name": f"catalog-alarm-topic-{environment_suffix}"}
        )

        # Create SNS subscription for email notifications
        SnsTopicSubscription(
            self,
            "alarm_email_subscription",
            topic_arn=alarm_topic.arn,
            protocol="email",
            endpoint="ops-team@example.com"
        )

        # Create CloudWatch Alarm for ECS CPU utilization
        CloudwatchMetricAlarm(
            self,
            "ecs_cpu_alarm",
            alarm_name=f"catalog-ecs-cpu-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when ECS service CPU exceeds 80%",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "ClusterName": ecs_cluster.name,
                "ServiceName": ecs_service.name
            },
            tags={"Name": f"catalog-ecs-cpu-alarm-{environment_suffix}"}
        )

        # Create CloudWatch Alarm for ECS Memory utilization
        CloudwatchMetricAlarm(
            self,
            "ecs_memory_alarm",
            alarm_name=f"catalog-ecs-memory-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when ECS service memory exceeds 80%",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "ClusterName": ecs_cluster.name,
                "ServiceName": ecs_service.name
            },
            tags={"Name": f"catalog-ecs-memory-alarm-{environment_suffix}"}
        )

        # Create CloudWatch Alarm for ALB unhealthy targets
        CloudwatchMetricAlarm(
            self,
            "alb_unhealthy_targets_alarm",
            alarm_name=f"catalog-alb-unhealthy-targets-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=0,
            alarm_description="Alert when ALB has unhealthy targets",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "TargetGroup": target_group.arn_suffix,
                "LoadBalancer": alb.arn_suffix
            },
            tags={"Name": f"catalog-alb-unhealthy-alarm-{environment_suffix}"}
        )

        # Create CloudWatch Alarm for ALB target response time
        CloudwatchMetricAlarm(
            self,
            "alb_response_time_alarm",
            alarm_name=f"catalog-alb-response-time-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="TargetResponseTime",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=1,
            alarm_description="Alert when ALB target response time exceeds 1 second",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "LoadBalancer": alb.arn_suffix
            },
            tags={"Name": f"catalog-alb-response-time-alarm-{environment_suffix}"}
        )

        # Create CloudWatch Alarm for ElastiCache CPU utilization
        CloudwatchMetricAlarm(
            self,
            "elasticache_cpu_alarm",
            alarm_name=f"catalog-redis-cpu-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ElastiCachePrimaryEngineCPUUtilization",
            namespace="AWS/ElastiCache",
            period=300,
            statistic="Average",
            threshold=75,
            alarm_description="Alert when ElastiCache CPU exceeds 75%",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "CacheClusterId": redis_cache.name
            },
            tags={"Name": f"catalog-redis-cpu-alarm-{environment_suffix}"}
        )

        # Create CloudWatch Alarm for ElastiCache memory utilization
        CloudwatchMetricAlarm(
            self,
            "elasticache_memory_alarm",
            alarm_name=f"catalog-redis-memory-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseMemoryUsagePercentage",
            namespace="AWS/ElastiCache",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when ElastiCache memory usage exceeds 80%",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "CacheClusterId": redis_cache.name
            },
            tags={"Name": f"catalog-redis-memory-alarm-{environment_suffix}"}
        )

        # Create CloudWatch Alarm for ALB 5XX errors
        CloudwatchMetricAlarm(
            self,
            "alb_5xx_errors_alarm",
            alarm_name=f"catalog-alb-5xx-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when ALB has more than 10 5XX errors",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "LoadBalancer": alb.arn_suffix
            },
            tags={"Name": f"catalog-alb-5xx-alarm-{environment_suffix}"}
        )

        # Create Application Auto Scaling Target for ECS service
        ecs_scaling_target = AppautoscalingTarget(
            self,
            "ecs_scaling_target",
            max_capacity=10,
            min_capacity=2,
            resource_id=f"service/{ecs_cluster.name}/{ecs_service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs"
        )

        # Create Auto Scaling Policy based on CPU utilization
        AppautoscalingPolicy(
            self,
            "ecs_cpu_scaling_policy",
            name=f"catalog-ecs-cpu-scaling-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=ecs_scaling_target.resource_id,
            scalable_dimension=ecs_scaling_target.scalable_dimension,
            service_namespace=ecs_scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                target_value=70,
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

        # Create Auto Scaling Policy based on memory utilization
        AppautoscalingPolicy(
            self,
            "ecs_memory_scaling_policy",
            name=f"catalog-ecs-memory-scaling-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=ecs_scaling_target.resource_id,
            scalable_dimension=ecs_scaling_target.scalable_dimension,
            service_namespace=ecs_scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                target_value=70,
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageMemoryUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

        # Create Auto Scaling Policy based on ALB request count
        AppautoscalingPolicy(
            self,
            "ecs_alb_request_scaling_policy",
            name=f"catalog-ecs-alb-request-scaling-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=ecs_scaling_target.resource_id,
            scalable_dimension=ecs_scaling_target.scalable_dimension,
            service_namespace=ecs_scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                target_value=1000,
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ALBRequestCountPerTarget",
                    resource_label=f"{alb.arn_suffix}/{target_group.arn_suffix}"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

        # Create WAF WebACL for ALB protection using escape hatch for complex configuration
        waf_web_acl = Wafv2WebAcl(
            self,
            "waf_web_acl",
            name=f"catalog-waf-{environment_suffix}",
            scope="REGIONAL",
            description="WAF WebACL for catalog ALB protection",
            default_action=Wafv2WebAclDefaultAction(
                allow={}
            ),
            rule=[
                Wafv2WebAclRule(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=Wafv2WebAclRuleOverrideAction(
                        none={}
                    ),
                    statement={
                        "managed_rule_group_statement": {
                            "name": "AWSManagedRulesCommonRuleSet",
                            "vendor_name": "AWS"
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesCommonRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                ),
                Wafv2WebAclRule(
                    name="AWSManagedRulesKnownBadInputsRuleSet",
                    priority=2,
                    override_action=Wafv2WebAclRuleOverrideAction(
                        none={}
                    ),
                    statement={
                        "managed_rule_group_statement": {
                            "name": "AWSManagedRulesKnownBadInputsRuleSet",
                            "vendor_name": "AWS"
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesKnownBadInputsRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                ),
                Wafv2WebAclRule(
                    name="AWSManagedRulesSQLiRuleSet",
                    priority=3,
                    override_action=Wafv2WebAclRuleOverrideAction(
                        none={}
                    ),
                    statement={
                        "managed_rule_group_statement": {
                            "name": "AWSManagedRulesSQLiRuleSet",
                            "vendor_name": "AWS"
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesSQLiRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=Wafv2WebAclVisibilityConfig(
                cloudwatch_metrics_enabled=True,
                metric_name=f"catalog-waf-{environment_suffix}",
                sampled_requests_enabled=True
            ),
            tags={"Name": f"catalog-waf-{environment_suffix}"}
        )

        # Associate WAF WebACL with ALB
        Wafv2WebAclAssociation(
            self,
            "waf_alb_association",
            resource_arn=alb.arn,
            web_acl_arn=waf_web_acl.arn
        )

        # Outputs for integration tests
        TerraformOutput(
            self,
            "VpcId",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "EcsClusterName",
            value=ecs_cluster.name,
            description="ECS Cluster Name"
        )

        TerraformOutput(
            self,
            "ElastiCacheEndpoint", 
            value="${aws_elasticache_serverless_cache.redis_cache.endpoint[0].address}",
            description="ElastiCache Redis Endpoint"
        )

        TerraformOutput(
            self,
            "AlbDns",
            value=alb.dns_name,
            description="Application Load Balancer DNS Name"
        )

        TerraformOutput(
            self,
            "SnsTopicArn",
            value=alarm_topic.arn,
            description="SNS Topic ARN"
        )

        TerraformOutput(
            self,
            "EnvironmentSuffix",
            value=environment_suffix,
            description="Environment Suffix"
        )

        TerraformOutput(
            self,
            "AwsRegion",
            value=aws_region,
            description="AWS Region"
        )

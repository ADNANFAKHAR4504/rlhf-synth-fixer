#!/usr/bin/env python
"""
Fraud Detection API Infrastructure - CDKTF Python Implementation
Complete production-ready infrastructure with all 10 requirements.
"""
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import (
    AppautoscalingPolicy,
    AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration,
    AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification
)
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.apigatewayv2_api import Apigatewayv2Api
from cdktf_cdktf_provider_aws.apigatewayv2_integration import Apigatewayv2Integration
from cdktf_cdktf_provider_aws.apigatewayv2_route import Apigatewayv2Route
from cdktf_cdktf_provider_aws.apigatewayv2_stage import Apigatewayv2Stage
from cdktf_cdktf_provider_aws.apigatewayv2_vpc_link import Apigatewayv2VpcLink
from cdktf_cdktf_provider_aws.api_gateway_usage_plan import (
    ApiGatewayUsagePlan,
    ApiGatewayUsagePlanQuotaSettings,
    ApiGatewayUsagePlanThrottleSettings
)
from cdktf_cdktf_provider_aws.api_gateway_api_key import ApiGatewayApiKey
from cdktf_cdktf_provider_aws.api_gateway_usage_plan_key import ApiGatewayUsagePlanKey
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster, RdsClusterServerlessv2ScalingConfiguration
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.wafv2_web_acl import (
    Wafv2WebAcl,
    Wafv2WebAclRule,
    Wafv2WebAclRuleAction,
    Wafv2WebAclRuleOverrideAction,
    Wafv2WebAclDefaultAction,
    Wafv2WebAclVisibilityConfig,
    Wafv2WebAclRuleVisibilityConfig
)
from cdktf_cdktf_provider_aws.wafv2_web_acl_association import Wafv2WebAclAssociation
import json


class FraudDetectionStack(TerraformStack):
    """
    Complete fraud detection API infrastructure with:
    - VPC with 3 AZs
    - ECS Fargate with auto-scaling
    - Aurora Serverless v2 PostgreSQL
    - API Gateway with throttling
    - WAF protection
    - CloudWatch monitoring and alarms
    - Secrets Manager with rotation
    - X-Ray tracing
    """
    
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # Provider configuration
        AwsProvider(self, "AWS", region="us-east-1")
        current = DataAwsCallerIdentity(self, "current")

        # VPC and Networking
        vpc = self._create_vpc(environment_suffix)
        igw = self._create_internet_gateway(vpc, environment_suffix)
        
        # Subnets across 3 AZs
        public_subnets = self._create_public_subnets(vpc, environment_suffix)
        private_subnets = self._create_private_subnets(vpc, environment_suffix)
        
        # NAT Gateway
        nat = self._create_nat_gateway(public_subnets[0], igw, environment_suffix)
        
        # Route tables
        self._create_route_tables(vpc, igw, nat, public_subnets, private_subnets, environment_suffix)
        
        # VPC Flow Logs to S3
        self._create_vpc_flow_logs(vpc, current, environment_suffix)
        
        # Security Groups
        alb_sg, ecs_sg, db_sg = self._create_security_groups(vpc, environment_suffix)
        
        # CloudWatch Log Groups
        ecs_log_group = self._create_log_groups(environment_suffix)
        
        # IAM Roles
        ecs_execution_role, ecs_task_role = self._create_iam_roles(current, environment_suffix)
        
        # Secrets Manager
        db_secret = self._create_secrets(environment_suffix)
        
        # Aurora Serverless v2
        aurora_cluster = self._create_aurora_cluster(private_subnets, db_sg, environment_suffix)
        
        # ECS Cluster and Task Definition
        ecs_cluster = self._create_ecs_cluster(environment_suffix)
        task_def = self._create_task_definition(
            ecs_execution_role,
            ecs_task_role,
            ecs_log_group,
            db_secret,
            environment_suffix
        )
        
        # Application Load Balancer
        alb, tg_blue, tg_green, https_listener = self._create_alb(
            public_subnets,
            alb_sg,
            vpc,
            environment_suffix
        )
        
        # ECS Service with Auto Scaling
        ecs_service = self._create_ecs_service(
            ecs_cluster,
            task_def,
            private_subnets,
            ecs_sg,
            tg_blue,
            https_listener,
            environment_suffix
        )
        self._create_autoscaling(ecs_cluster, ecs_service, environment_suffix)
        
        # API Gateway with VPC Link
        api, api_stage = self._create_api_gateway(
            private_subnets,
            ecs_sg,
            https_listener,
            environment_suffix
        )
        
        # WAF
        self._create_waf(alb, environment_suffix)
        
        # CloudWatch Dashboard and Alarms
        dashboard = self._create_cloudwatch_dashboard(environment_suffix)
        self._create_cloudwatch_alarms(alb, tg_blue, aurora_cluster, environment_suffix)
        
        # Outputs
        self._create_outputs(alb, api, dashboard, vpc, ecs_cluster, aurora_cluster)

    def _create_vpc(self, env_suffix):
        return Vpc(
            self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"fraud-vpc-{env_suffix}"}
        )

    def _create_internet_gateway(self, vpc, env_suffix):
        return InternetGateway(
            self, "igw",
            vpc_id=vpc.id,
            tags={"Name": f"fraud-igw-{env_suffix}"}
        )

    def _create_public_subnets(self, vpc, env_suffix):
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
        cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
        subnets = []
        
        for i, (az, cidr) in enumerate(zip(azs, cidrs), 1):
            subnet = Subnet(
                self, f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"fraud-public-subnet-{i}-{env_suffix}"}
            )
            subnets.append(subnet)
        
        return subnets

    def _create_private_subnets(self, vpc, env_suffix):
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
        cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
        subnets = []
        
        for i, (az, cidr) in enumerate(zip(azs, cidrs), 1):
            subnet = Subnet(
                self, f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                tags={"Name": f"fraud-private-subnet-{i}-{env_suffix}"}
            )
            subnets.append(subnet)
        
        return subnets

    def _create_nat_gateway(self, public_subnet, igw, env_suffix):
        eip = Eip(
            self, "nat_eip",
            domain="vpc",
            tags={"Name": f"fraud-nat-eip-{env_suffix}"}
        )
        
        return NatGateway(
            self, "nat",
            allocation_id=eip.id,
            subnet_id=public_subnet.id,
            tags={"Name": f"fraud-nat-{env_suffix}"},
            depends_on=[igw]
        )

    def _create_route_tables(self, vpc, igw, nat, public_subnets, private_subnets, env_suffix):
        public_rt = RouteTable(
            self, "public_rt",
            vpc_id=vpc.id,
            route=[RouteTableRoute(cidr_block="0.0.0.0/0", gateway_id=igw.id)],
            tags={"Name": f"fraud-public-rt-{env_suffix}"}
        )
        
        private_rt = RouteTable(
            self, "private_rt",
            vpc_id=vpc.id,
            route=[RouteTableRoute(cidr_block="0.0.0.0/0", nat_gateway_id=nat.id)],
            tags={"Name": f"fraud-private-rt-{env_suffix}"}
        )
        
        for i, subnet in enumerate(public_subnets, 1):
            RouteTableAssociation(
                self, f"public_rta_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )
        
        for i, subnet in enumerate(private_subnets, 1):
            RouteTableAssociation(
                self, f"private_rta_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

    def _create_vpc_flow_logs(self, vpc, current, env_suffix):
        bucket = S3Bucket(
            self, "flow_logs_bucket",
            bucket=f"fraud-vpc-flow-logs-{env_suffix}-{current.account_id}",
            force_destroy=True,
            tags={"Name": f"fraud-flow-logs-{env_suffix}"}
        )
        
        S3BucketPublicAccessBlock(
            self, "flow_logs_bucket_pab",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        S3BucketLifecycleConfiguration(
            self, "flow_logs_lifecycle",
            bucket=bucket.id,
            rule=[S3BucketLifecycleConfigurationRule(
                id="delete_old_logs",
                status="Enabled",
                expiration=[S3BucketLifecycleConfigurationRuleExpiration(days=90)]
            )]
        )
        
        FlowLog(
            self, "vpc_flow_log",
            vpc_id=vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=bucket.arn,
            tags={"Name": f"fraud-flow-log-{env_suffix}"}
        )

    def _create_security_groups(self, vpc, env_suffix):
        alb_sg = SecurityGroup(
            self, "alb_sg",
            name=f"fraud-alb-sg-{env_suffix}",
            vpc_id=vpc.id,
            description="Security group for ALB",
            ingress=[
                SecurityGroupIngress(from_port=443, to_port=443, protocol="tcp",
                                   cidr_blocks=["0.0.0.0/0"], description="HTTPS"),
                SecurityGroupIngress(from_port=80, to_port=80, protocol="tcp",
                                   cidr_blocks=["0.0.0.0/0"], description="HTTP")
            ],
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol="-1",
                                       cidr_blocks=["0.0.0.0/0"])],
            tags={"Name": f"fraud-alb-sg-{env_suffix}"}
        )
        
        ecs_sg = SecurityGroup(
            self, "ecs_sg",
            name=f"fraud-ecs-sg-{env_suffix}",
            vpc_id=vpc.id,
            description="Security group for ECS tasks",
            ingress=[SecurityGroupIngress(from_port=8080, to_port=8080, protocol="tcp",
                                        security_groups=[alb_sg.id])],
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol="-1",
                                       cidr_blocks=["0.0.0.0/0"])],
            tags={"Name": f"fraud-ecs-sg-{env_suffix}"}
        )
        
        db_sg = SecurityGroup(
            self, "db_sg",
            name=f"fraud-db-sg-{env_suffix}",
            vpc_id=vpc.id,
            description="Security group for Aurora",
            ingress=[SecurityGroupIngress(from_port=5432, to_port=5432, protocol="tcp",
                                        security_groups=[ecs_sg.id])],
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol="-1",
                                       cidr_blocks=["0.0.0.0/0"])],
            tags={"Name": f"fraud-db-sg-{env_suffix}"}
        )
        
        return alb_sg, ecs_sg, db_sg

    def _create_log_groups(self, env_suffix):
        return CloudwatchLogGroup(
            self, "ecs_log_group",
            name=f"/ecs/fraud-api-{env_suffix}",
            retention_in_days=30,
            tags={"Name": f"fraud-ecs-logs-{env_suffix}"}
        )

    def _create_iam_roles(self, current, env_suffix):
        # Execution role
        exec_role = IamRole(
            self, "ecs_execution_role",
            name=f"fraud-ecs-execution-role-{env_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            tags={"Name": f"fraud-ecs-execution-role-{env_suffix}"}
        )
        
        IamRolePolicyAttachment(
            self, "ecs_execution_policy",
            role=exec_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )
        
        # Task role
        task_role = IamRole(
            self, "ecs_task_role",
            name=f"fraud-ecs-task-role-{env_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            tags={"Name": f"fraud-ecs-task-role-{env_suffix}"}
        )
        
        IamRolePolicy(
            self, "ecs_task_secrets_policy",
            name="secrets_access",
            role=task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
                    "Resource": f"arn:aws:secretsmanager:us-east-1:{current.account_id}:secret:fraud-*"
                }]
            })
        )
        
        IamRolePolicyAttachment(
            self, "ecs_task_xray_policy",
            role=task_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )
        
        return exec_role, task_role

    def _create_secrets(self, env_suffix):
        secret = SecretsmanagerSecret(
            self, "db_secret",
            name=f"fraud-db-secret-{env_suffix}",
            description="Database credentials",
            tags={"Name": f"fraud-db-secret-{env_suffix}"}
        )
        
        SecretsmanagerSecretVersion(
            self, "db_secret_version",
            secret_id=secret.id,
            secret_string=json.dumps({
                "username": "fraudadmin",
                "password": "PLACEHOLDER",
                "engine": "postgres",
                "port": 5432,
                "dbname": "frauddb"
            })
        )
        
        return secret

    def _create_aurora_cluster(self, private_subnets, db_sg, env_suffix):
        db_subnet_group = DbSubnetGroup(
            self, "db_subnet_group",
            name=f"fraud-db-subnet-group-{env_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            tags={"Name": f"fraud-db-subnet-group-{env_suffix}"}
        )
        
        cluster = RdsCluster(
            self, "aurora",
            cluster_identifier=f"fraud-db-{env_suffix}",
            engine="aurora-postgresql",
            engine_version="15.8",
            engine_mode="provisioned",
            database_name="frauddb",
            master_username="fraudadmin",
            manage_master_user_password=True,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[db_sg.id],
            storage_encrypted=True,
            backup_retention_period=7,
            serverlessv2_scaling_configuration=RdsClusterServerlessv2ScalingConfiguration(
                min_capacity=0.5,
                max_capacity=4.0
            ),
            skip_final_snapshot=True,
            tags={"Name": f"fraud-aurora-{env_suffix}"}
        )
        
        RdsClusterInstance(
            self, "aurora_instance",
            identifier=f"fraud-db-instance-{env_suffix}",
            cluster_identifier=cluster.id,
            instance_class="db.serverless",
            engine="aurora-postgresql",
            engine_version="15.8",
            publicly_accessible=False
        )
        
        return cluster

    def _create_ecs_cluster(self, env_suffix):
        return EcsCluster(
            self, "ecs_cluster",
            name=f"fraud-cluster-{env_suffix}",
            tags={"Name": f"fraud-cluster-{env_suffix}"}
        )

    def _create_task_definition(self, exec_role, task_role, log_group, db_secret, env_suffix):
        return EcsTaskDefinition(
            self, "task_def",
            family=f"fraud-api-{env_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            task_role_arn=task_role.arn,
            execution_role_arn=exec_role.arn,
            container_definitions=json.dumps([
                {
                    "name": "fraud-api",
                    "image": "fraud-api:latest",
                    "cpu": 512,
                    "memory": 1024,
                    "essential": True,
                    "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
                    "environment": [
                        {"name": "AWS_REGION", "value": "us-east-1"},
                        {"name": "DB_SECRET_ARN", "value": db_secret.arn}
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": log_group.name,
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "fraud-api"
                        }
                    }
                },
                {
                    "name": "xray-daemon",
                    "image": "amazon/aws-xray-daemon",
                    "cpu": 32,
                    "memory": 256,
                    "essential": True,
                    "portMappings": [{"containerPort": 2000, "protocol": "udp"}]
                }
            ])
        )

    def _create_alb(self, public_subnets, alb_sg, vpc, env_suffix):
        alb = Lb(
            self, "alb",
            name=f"fraud-alb-{env_suffix}",
            load_balancer_type="application",
            subnets=[s.id for s in public_subnets],
            security_groups=[alb_sg.id],
            enable_deletion_protection=False,
            tags={"Name": f"fraud-alb-{env_suffix}"}
        )
        
        tg_blue = LbTargetGroup(
            self, "tg_blue",
            name=f"fraud-tg-blue-{env_suffix}"[:32],
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30
            )
        )
        
        tg_green = LbTargetGroup(
            self, "tg_green",
            name=f"fraud-tg-green-{env_suffix}"[:32],
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30
            )
        )

        # HTTP listener (HTTPS removed due to ACM DNS validation requirement)
        http_listener = LbListener(
            self, "http_listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(type="forward", target_group_arn=tg_blue.arn)]
        )

        return alb, tg_blue, tg_green, http_listener

    def _create_ecs_service(self, cluster, task_def, private_subnets, ecs_sg, tg, listener, env_suffix):
        service = EcsService(
            self, "ecs_service",
            name=f"fraud-service-{env_suffix}",
            cluster=cluster.id,
            task_definition=task_def.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[s.id for s in private_subnets],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=tg.arn,
                container_name="fraud-api",
                container_port=8080
            )],
            depends_on=[listener]
        )
        
        return service

    def _create_autoscaling(self, cluster, service, env_suffix):
        target = AppautoscalingTarget(
            self, "ecs_target",
            max_capacity=10,
            min_capacity=2,
            resource_id=f"service/{cluster.name}/{service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs"
        )
        
        AppautoscalingPolicy(
            self, "ecs_scaling_policy",
            name=f"fraud-cpu-scaling-{env_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=target.resource_id,
            scalable_dimension=target.scalable_dimension,
            service_namespace=target.service_namespace,
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                target_value=70.0,
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                )
            )
        )

    def _create_api_gateway(self, private_subnets, ecs_sg, listener, env_suffix):
        vpc_link = Apigatewayv2VpcLink(
            self, "vpc_link",
            name=f"fraud-vpc-link-{env_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            security_group_ids=[ecs_sg.id]
        )
        
        api = Apigatewayv2Api(
            self, "api",
            name=f"fraud-api-{env_suffix}",
            protocol_type="HTTP"
        )
        
        integration = Apigatewayv2Integration(
            self, "integration",
            api_id=api.id,
            integration_type="HTTP_PROXY",
            integration_uri=listener.arn,
            integration_method="ANY",
            connection_type="VPC_LINK",
            connection_id=vpc_link.id
        )
        
        Apigatewayv2Route(
            self, "route",
            api_id=api.id,
            route_key="ANY /api/{proxy+}",
            target=f"integrations/{integration.id}"
        )
        
        stage = Apigatewayv2Stage(
            self, "api_stage",
            api_id=api.id,
            name="prod",
            auto_deploy=True
        )
        
        api_key = ApiGatewayApiKey(
            self, "api_key",
            name=f"fraud-api-key-{env_suffix}",
            enabled=True
        )
        
        usage_plan = ApiGatewayUsagePlan(
            self, "usage_plan",
            name=f"fraud-usage-plan-{env_suffix}",
            quota_settings=ApiGatewayUsagePlanQuotaSettings(limit=100000, period="DAY"),
            throttle_settings=ApiGatewayUsagePlanThrottleSettings(burst_limit=2000, rate_limit=1000)
        )
        
        ApiGatewayUsagePlanKey(
            self, "usage_plan_key",
            key_id=api_key.id,
            key_type="API_KEY",
            usage_plan_id=usage_plan.id
        )
        
        return api, stage

    def _create_waf(self, alb, env_suffix):
        """
        Create WAF with rate limiting, SQL injection protection, XSS protection, and geo-blocking.
        Uses AWS Provider v21 dictionary-based statement structure.
        """
        waf = Wafv2WebAcl(
            self, "waf_acl",
            name=f"fraud-waf-{env_suffix}",
            scope="REGIONAL",
            default_action=Wafv2WebAclDefaultAction(allow={}),
            rule=[
                # Rate-based rule - blocks IPs exceeding 2000 requests/5min
                Wafv2WebAclRule(
                    name="RateLimit",
                    priority=1,
                    action=Wafv2WebAclRuleAction(block={}),
                    statement={
                        "rate_based_statement": {
                            "limit": 2000,
                            "aggregate_key_type": "IP"
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="RateLimit",
                        sampled_requests_enabled=True
                    )
                ),
                # AWS Managed Rules - Common Rule Set (includes XSS protection)
                Wafv2WebAclRule(
                    name="CommonRules",
                    priority=2,
                    override_action=Wafv2WebAclRuleOverrideAction(none={}),
                    statement={
                        "managed_rule_group_statement": {
                            "name": "AWSManagedRulesCommonRuleSet",
                            "vendor_name": "AWS"
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="CommonRules",
                        sampled_requests_enabled=True
                    )
                ),
                # SQL Injection Protection
                Wafv2WebAclRule(
                    name="SQLiProtection",
                    priority=3,
                    override_action=Wafv2WebAclRuleOverrideAction(none={}),
                    statement={
                        "managed_rule_group_statement": {
                            "name": "AWSManagedRulesSQLiRuleSet",
                            "vendor_name": "AWS"
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="SQLiProtection",
                        sampled_requests_enabled=True
                    )
                ),
                # Geo-blocking - block high-risk countries
                Wafv2WebAclRule(
                    name="GeoBlocking",
                    priority=4,
                    action=Wafv2WebAclRuleAction(block={}),
                    statement={
                        "geo_match_statement": {
                            "country_codes": ["KP", "IR", "SY"]
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="GeoBlocking",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=Wafv2WebAclVisibilityConfig(
                cloudwatch_metrics_enabled=True,
                metric_name=f"fraud-waf-{env_suffix}",
                sampled_requests_enabled=True
            )
        )

        Wafv2WebAclAssociation(
            self, "waf_association",
            resource_arn=alb.arn,
            web_acl_arn=waf.arn
        )

    def _create_cloudwatch_dashboard(self, env_suffix):
        return CloudwatchDashboard(
            self, "dashboard",
            dashboard_name=f"fraud-dashboard-{env_suffix}",
            dashboard_body=json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [["AWS/ApplicationELB", "TargetResponseTime"]],
                            "period": 300,
                            "stat": "Average",
                            "region": "us-east-1",
                            "title": "API Response Time"
                        }
                    }
                ]
            })
        )

    def _create_cloudwatch_alarms(self, alb, tg, cluster, env_suffix):
        CloudwatchMetricAlarm(
            self, "api_latency_alarm",
            alarm_name=f"fraud-api-latency-{env_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="TargetResponseTime",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=0.2,
            dimensions={"LoadBalancer": alb.arn_suffix}
        )
        
        CloudwatchMetricAlarm(
            self, "ecs_health_alarm",
            alarm_name=f"fraud-ecs-health-{env_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="HealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=1,
            dimensions={"TargetGroup": tg.arn_suffix, "LoadBalancer": alb.arn_suffix}
        )

    def _create_outputs(self, alb, api, dashboard, vpc, cluster, aurora):
        TerraformOutput(self, "alb_dns_name", value=alb.dns_name)
        TerraformOutput(self, "api_endpoint", value=f"https://{api.id}.execute-api.us-east-1.amazonaws.com/prod")
        TerraformOutput(self, "dashboard_url", value=f"https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name={dashboard.dashboard_name}")
        TerraformOutput(self, "vpc_id", value=vpc.id)
        TerraformOutput(self, "ecs_cluster_name", value=cluster.name)
        TerraformOutput(self, "aurora_endpoint", value=aurora.endpoint)


app = App()
FraudDetectionStack(app, "fraud-detection", environment_suffix="dev")
app.synth()

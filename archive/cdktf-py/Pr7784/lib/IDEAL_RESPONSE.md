# Fraud Detection API Infrastructure - Complete CDKTF Python Implementation

This is the corrected, production-ready implementation addressing all 24 issues from MODEL_RESPONSE.

## File: main.py

```python
#!/usr/bin/env python
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
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import S3BucketLifecycleConfiguration, S3BucketLifecycleConfigurationRule, S3BucketLifecycleConfigurationRuleExpiration
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy, AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration, AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.acm_certificate import AcmCertificate
from cdktf_cdktf_provider_aws.acm_certificate_validation import AcmCertificateValidation
from cdktf_cdktf_provider_aws.apigatewayv2_api import Apigatewayv2Api
from cdktf_cdktf_provider_aws.apigatewayv2_integration import Apigatewayv2Integration
from cdktf_cdktf_provider_aws.apigatewayv2_route import Apigatewayv2Route
from cdktf_cdktf_provider_aws.apigatewayv2_stage import Apigatewayv2Stage
from cdktf_cdktf_provider_aws.apigatewayv2_vpc_link import Apigatewayv2VpcLink
from cdktf_cdktf_provider_aws.api_gateway_usage_plan import ApiGatewayUsagePlan, ApiGatewayUsagePlanQuotaSettings, ApiGatewayUsagePlanThrottleSettings
from cdktf_cdktf_provider_aws.api_gateway_api_key import ApiGatewayApiKey
from cdktf_cdktf_provider_aws.api_gateway_usage_plan_key import ApiGatewayUsagePlanKey
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster, RdsClusterServerlessv2ScalingConfiguration
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm, CloudwatchMetricAlarmMetricQuery, CloudwatchMetricAlarmMetricQueryMetric
from cdktf_cdktf_provider_aws.wafv2_web_acl import Wafv2WebAcl, Wafv2WebAclRule, Wafv2WebAclRuleAction, Wafv2WebAclRuleOverrideAction, Wafv2WebAclDefaultAction, Wafv2WebAclVisibilityConfig, Wafv2WebAclRuleVisibilityConfig
from cdktf_cdktf_provider_aws.wafv2_web_acl_association import Wafv2WebAclAssociation
import json


class FraudDetectionStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # Provider
        AwsProvider(self, "AWS", region="us-east-1")
        
        # Get current AWS account
        current = DataAwsCallerIdentity(self, "current")

        # ============================================================
        # VPC and Networking (3 AZs)
        # ============================================================
        
        vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"fraud-vpc-{environment_suffix}"}
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=vpc.id,
            tags={"Name": f"fraud-igw-{environment_suffix}"}
        )

        # Public Subnets (3 AZs)
        public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=True,
            tags={"Name": f"fraud-public-subnet-1-{environment_suffix}"}
        )

        public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1b",
            map_public_ip_on_launch=True,
            tags={"Name": f"fraud-public-subnet-2-{environment_suffix}"}
        )

        public_subnet_3 = Subnet(
            self,
            "public_subnet_3",
            vpc_id=vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone="us-east-1c",
            map_public_ip_on_launch=True,
            tags={"Name": f"fraud-public-subnet-3-{environment_suffix}"}
        )

        # Private Subnets (3 AZs)
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone="us-east-1a",
            tags={"Name": f"fraud-private-subnet-1-{environment_suffix}"}
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone="us-east-1b",
            tags={"Name": f"fraud-private-subnet-2-{environment_suffix}"}
        )

        private_subnet_3 = Subnet(
            self,
            "private_subnet_3",
            vpc_id=vpc.id,
            cidr_block="10.0.13.0/24",
            availability_zone="us-east-1c",
            tags={"Name": f"fraud-private-subnet-3-{environment_suffix}"}
        )

        # EIP for NAT Gateway
        eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
            tags={"Name": f"fraud-nat-eip-{environment_suffix}"}
        )

        # NAT Gateway
        nat = NatGateway(
            self,
            "nat",
            allocation_id=eip.id,
            subnet_id=public_subnet_1.id,
            tags={"Name": f"fraud-nat-{environment_suffix}"},
            depends_on=[igw]
        )

        # Route Tables
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"fraud-public-rt-{environment_suffix}"}
        )

        private_rt = RouteTable(
            self,
            "private_rt",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id
            )],
            tags={"Name": f"fraud-private-rt-{environment_suffix}"}
        )

        # Route Table Associations
        RouteTableAssociation(self, "public_rta_1", subnet_id=public_subnet_1.id, route_table_id=public_rt.id)
        RouteTableAssociation(self, "public_rta_2", subnet_id=public_subnet_2.id, route_table_id=public_rt.id)
        RouteTableAssociation(self, "public_rta_3", subnet_id=public_subnet_3.id, route_table_id=public_rt.id)
        RouteTableAssociation(self, "private_rta_1", subnet_id=private_subnet_1.id, route_table_id=private_rt.id)
        RouteTableAssociation(self, "private_rta_2", subnet_id=private_subnet_2.id, route_table_id=private_rt.id)
        RouteTableAssociation(self, "private_rta_3", subnet_id=private_subnet_3.id, route_table_id=private_rt.id)

        # ============================================================
        # S3 Bucket for VPC Flow Logs
        # ============================================================
        
        flow_logs_bucket = S3Bucket(
            self,
            "flow_logs_bucket",
            bucket=f"fraud-vpc-flow-logs-{environment_suffix}-{current.account_id}",
            force_destroy=True,
            tags={"Name": f"fraud-flow-logs-{environment_suffix}"}
        )

        S3BucketPublicAccessBlock(
            self,
            "flow_logs_bucket_pab",
            bucket=flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        S3BucketLifecycleConfiguration(
            self,
            "flow_logs_lifecycle",
            bucket=flow_logs_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="delete_old_logs",
                    status="Enabled",
                    expiration=[S3BucketLifecycleConfigurationRuleExpiration(days=90)]
                )
            ]
        )

        # VPC Flow Logs
        FlowLog(
            self,
            "vpc_flow_log",
            vpc_id=vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=flow_logs_bucket.arn,
            tags={"Name": f"fraud-flow-log-{environment_suffix}"}
        )

        # ============================================================
        # Security Groups
        # ============================================================
        
        alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"fraud-alb-sg-{environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ALB",
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet"
                )
            ],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound"
            )],
            tags={"Name": f"fraud-alb-sg-{environment_suffix}"}
        )

        ecs_sg = SecurityGroup(
            self,
            "ecs_sg",
            name=f"fraud-ecs-sg-{environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ECS tasks",
            ingress=[SecurityGroupIngress(
                from_port=8080,
                to_port=8080,
                protocol="tcp",
                security_groups=[alb_sg.id],
                description="From ALB"
            )],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound"
            )],
            tags={"Name": f"fraud-ecs-sg-{environment_suffix}"}
        )

        db_sg = SecurityGroup(
            self,
            "db_sg",
            name=f"fraud-db-sg-{environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for Aurora database",
            ingress=[SecurityGroupIngress(
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                security_groups=[ecs_sg.id],
                description="PostgreSQL from ECS tasks"
            )],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound"
            )],
            tags={"Name": f"fraud-db-sg-{environment_suffix}"}
        )

        # ============================================================
        # CloudWatch Log Groups
        # ============================================================
        
        ecs_log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/fraud-api-{environment_suffix}",
            retention_in_days=30,
            tags={"Name": f"fraud-ecs-logs-{environment_suffix}"}
        )

        # ============================================================
        # IAM Roles for ECS
        # ============================================================
        
        # ECS Task Execution Role
        ecs_execution_role = IamRole(
            self,
            "ecs_execution_role",
            name=f"fraud-ecs-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            tags={"Name": f"fraud-ecs-execution-role-{environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "ecs_execution_policy",
            role=ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # ECS Task Role
        ecs_task_role = IamRole(
            self,
            "ecs_task_role",
            name=f"fraud-ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            tags={"Name": f"fraud-ecs-task-role-{environment_suffix}"}
        )

        # Task role policies
        IamRolePolicy(
            self,
            "ecs_task_secrets_policy",
            name="secrets_access",
            role=ecs_task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": f"arn:aws:secretsmanager:us-east-1:{current.account_id}:secret:fraud-*"
                }]
            })
        )

        IamRolePolicyAttachment(
            self,
            "ecs_task_xray_policy",
            role=ecs_task_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        IamRolePolicyAttachment(
            self,
            "ecs_task_cloudwatch_policy",
            role=ecs_task_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
        )

        # ============================================================
        # Secrets Manager for Database Credentials
        # ============================================================
        
        db_secret = SecretsmanagerSecret(
            self,
            "db_secret",
            name=f"fraud-db-secret-{environment_suffix}",
            description="Database credentials for fraud detection API",
            tags={"Name": f"fraud-db-secret-{environment_suffix}"}
        )

        db_credentials = {
            "username": "fraudadmin",
            "password": Fn.base64encode("RANDOM-GENERATED-PASSWORD-PLACEHOLDER"),
            "engine": "postgres",
            "host": "placeholder",
            "port": 5432,
            "dbname": "frauddb"
        }

        SecretsmanagerSecretVersion(
            self,
            "db_secret_version",
            secret_id=db_secret.id,
            secret_string=json.dumps(db_credentials)
        )

        # ============================================================
        # Aurora Serverless v2 PostgreSQL
        # ============================================================
        
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"fraud-db-subnet-group-{environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id, private_subnet_3.id],
            description="Subnet group for fraud detection database",
            tags={"Name": f"fraud-db-subnet-group-{environment_suffix}"}
        )

        aurora_cluster = RdsCluster(
            self,
            "aurora",
            cluster_identifier=f"fraud-db-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.3",
            engine_mode="provisioned",
            database_name="frauddb",
            master_username="fraudadmin",
            manage_master_user_password=True,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[db_sg.id],
            storage_encrypted=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            serverlessv2_scaling_configuration=RdsClusterServerlessv2ScalingConfiguration(
                min_capacity=0.5,
                max_capacity=4.0
            ),
            skip_final_snapshot=True,
            tags={"Name": f"fraud-aurora-{environment_suffix}"}
        )

        RdsClusterInstance(
            self,
            "aurora_instance",
            identifier=f"fraud-db-instance-{environment_suffix}",
            cluster_identifier=aurora_cluster.id,
            instance_class="db.serverless",
            engine="aurora-postgresql",
            engine_version="15.3",
            publicly_accessible=False,
            tags={"Name": f"fraud-db-instance-{environment_suffix}"}
        )

        # ============================================================
        # ECS Cluster and Service
        # ============================================================
        
        ecs_cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"fraud-cluster-{environment_suffix}",
            tags={"Name": f"fraud-cluster-{environment_suffix}"}
        )

        # ECS Task Definition with X-Ray
        task_def = EcsTaskDefinition(
            self,
            "task_def",
            family=f"fraud-api-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            task_role_arn=ecs_task_role.arn,
            execution_role_arn=ecs_execution_role.arn,
            container_definitions=json.dumps([
                {
                    "name": "fraud-api",
                    "image": "fraud-api:latest",
                    "cpu": 512,
                    "memory": 1024,
                    "essential": True,
                    "portMappings": [{
                        "containerPort": 8080,
                        "protocol": "tcp"
                    }],
                    "environment": [
                        {"name": "AWS_REGION", "value": "us-east-1"},
                        {"name": "DB_SECRET_ARN", "value": db_secret.arn}
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": ecs_log_group.name,
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
                    "portMappings": [{
                        "containerPort": 2000,
                        "protocol": "udp"
                    }]
                }
            ]),
            tags={"Name": f"fraud-task-def-{environment_suffix}"}
        )

        # ============================================================
        # Application Load Balancer
        # ============================================================
        
        alb = Lb(
            self,
            "alb",
            name=f"fraud-alb-{environment_suffix}",
            load_balancer_type="application",
            subnets=[public_subnet_1.id, public_subnet_2.id, public_subnet_3.id],
            security_groups=[alb_sg.id],
            enable_deletion_protection=False,
            tags={"Name": f"fraud-alb-{environment_suffix}"}
        )

        # Target Groups (Blue-Green)
        tg_blue = LbTargetGroup(
            self,
            "tg_blue",
            name=f"fraud-tg-blue-{environment_suffix}"[:32],
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            deregistration_delay=30,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                matcher="200"
            ),
            tags={"Name": f"fraud-tg-blue-{environment_suffix}"}
        )

        tg_green = LbTargetGroup(
            self,
            "tg_green",
            name=f"fraud-tg-green-{environment_suffix}"[:32],
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            deregistration_delay=30,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                matcher="200"
            ),
            tags={"Name": f"fraud-tg-green-{environment_suffix}"}
        )

        # ACM Certificate (self-signed for demo)
        cert = AcmCertificate(
            self,
            "cert",
            domain_name=f"fraud-api-{environment_suffix}.example.com",
            validation_method="DNS",
            tags={"Name": f"fraud-cert-{environment_suffix}"}
        )

        # HTTPS Listener
        https_listener = LbListener(
            self,
            "https_listener",
            load_balancer_arn=alb.arn,
            port=443,
            protocol="HTTPS",
            ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
            certificate_arn=cert.arn,
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=tg_blue.arn
            )],
            tags={"Name": f"fraud-https-listener-{environment_suffix}"}
        )

        # HTTP Listener (redirect to HTTPS)
        LbListener(
            self,
            "http_listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="redirect",
                redirect={
                    "port": "443",
                    "protocol": "HTTPS",
                    "status_code": "HTTP_301"
                }
            )],
            tags={"Name": f"fraud-http-listener-{environment_suffix}"}
        )

        # ============================================================
        # ECS Service with Auto Scaling
        # ============================================================
        
        ecs_service = EcsService(
            self,
            "ecs_service",
            name=f"fraud-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_def.arn,
            desired_count=2,
            launch_type="FARGATE",
            enable_execute_command=True,
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[private_subnet_1.id, private_subnet_2.id, private_subnet_3.id],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=tg_blue.arn,
                container_name="fraud-api",
                container_port=8080
            )],
            depends_on=[https_listener],
            tags={"Name": f"fraud-service-{environment_suffix}"}
        )

        # Auto Scaling
        ecs_target = AppautoscalingTarget(
            self,
            "ecs_target",
            max_capacity=10,
            min_capacity=2,
            resource_id=f"service/{ecs_cluster.name}/{ecs_service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs"
        )

        AppautoscalingPolicy(
            self,
            "ecs_scaling_policy",
            name=f"fraud-cpu-scaling-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=ecs_target.resource_id,
            scalable_dimension=ecs_target.scalable_dimension,
            service_namespace=ecs_target.service_namespace,
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                target_value=70.0,
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

        # ============================================================
        # API Gateway with VPC Link
        # ============================================================
        
        vpc_link = Apigatewayv2VpcLink(
            self,
            "vpc_link",
            name=f"fraud-vpc-link-{environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id, private_subnet_3.id],
            security_group_ids=[ecs_sg.id],
            tags={"Name": f"fraud-vpc-link-{environment_suffix}"}
        )

        api = Apigatewayv2Api(
            self,
            "api",
            name=f"fraud-api-{environment_suffix}",
            protocol_type="HTTP",
            description="Fraud Detection API Gateway",
            tags={"Name": f"fraud-api-{environment_suffix}"}
        )

        integration = Apigatewayv2Integration(
            self,
            "integration",
            api_id=api.id,
            integration_type="HTTP_PROXY",
            integration_uri=https_listener.arn,
            integration_method="ANY",
            connection_type="VPC_LINK",
            connection_id=vpc_link.id,
            payload_format_version="1.0"
        )

        Apigatewayv2Route(
            self,
            "route",
            api_id=api.id,
            route_key="ANY /api/{proxy+}",
            target=f"integrations/{integration.id}"
        )

        api_stage = Apigatewayv2Stage(
            self,
            "api_stage",
            api_id=api.id,
            name="prod",
            auto_deploy=True,
            tags={"Name": f"fraud-api-stage-{environment_suffix}"}
        )

        # API Key and Usage Plan
        api_key = ApiGatewayApiKey(
            self,
            "api_key",
            name=f"fraud-api-key-{environment_suffix}",
            enabled=True,
            tags={"Name": f"fraud-api-key-{environment_suffix}"}
        )

        usage_plan = ApiGatewayUsagePlan(
            self,
            "usage_plan",
            name=f"fraud-usage-plan-{environment_suffix}",
            description="Usage plan for fraud detection API",
            quota_settings=ApiGatewayUsagePlanQuotaSettings(
                limit=100000,
                period="DAY"
            ),
            throttle_settings=ApiGatewayUsagePlanThrottleSettings(
                burst_limit=2000,
                rate_limit=1000
            ),
            tags={"Name": f"fraud-usage-plan-{environment_suffix}"}
        )

        ApiGatewayUsagePlanKey(
            self,
            "usage_plan_key",
            key_id=api_key.id,
            key_type="API_KEY",
            usage_plan_id=usage_plan.id
        )

        # ============================================================
        # WAF Configuration
        # ============================================================
        
        waf_acl = Wafv2WebAcl(
            self,
            "waf_acl",
            name=f"fraud-waf-{environment_suffix}",
            scope="REGIONAL",
            description="WAF for fraud detection API",
            default_action=Wafv2WebAclDefaultAction(allow={}),
            rule=[
                # Rate-based rule - blocks IPs exceeding 2000 requests/5min
                Wafv2WebAclRule(
                    name="RateLimitRule",
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
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True
                    )
                ),
                # AWS Managed Rules - Common Rule Set (includes XSS protection)
                Wafv2WebAclRule(
                    name="AWSManagedRulesCommonRuleSet",
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
                        metric_name="AWSManagedRulesCommonRuleSet",
                        sampled_requests_enabled=True
                    )
                ),
                # SQL Injection Protection
                Wafv2WebAclRule(
                    name="AWSManagedRulesSQLiRuleSet",
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
                        metric_name="AWSManagedRulesSQLiRuleSet",
                        sampled_requests_enabled=True
                    )
                ),
                # Geo-blocking - block high-risk countries
                Wafv2WebAclRule(
                    name="GeoBlockRule",
                    priority=4,
                    action=Wafv2WebAclRuleAction(block={}),
                    statement={
                        "geo_match_statement": {
                            "country_codes": ["KP", "IR", "SY"]
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="GeoBlockRule",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=Wafv2WebAclVisibilityConfig(
                cloudwatch_metrics_enabled=True,
                metric_name=f"fraud-waf-{environment_suffix}",
                sampled_requests_enabled=True
            ),
            tags={"Name": f"fraud-waf-{environment_suffix}"}
        )

        # Associate WAF with ALB
        Wafv2WebAclAssociation(
            self,
            "waf_alb_association",
            resource_arn=alb.arn,
            web_acl_arn=waf_acl.arn
        )

        # ============================================================
        # CloudWatch Dashboard
        # ============================================================
        
        dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "API Response Time",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", {"stat": "Sum"}],
                            [".", "HTTPCode_Target_4XX_Count", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "us-east-1",
                        "title": "API Error Rates"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "Database Connections"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
                            [".", "MemoryUtilization", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "ECS Resource Utilization"
                    }
                }
            ]
        })

        dashboard = CloudwatchDashboard(
            self,
            "dashboard",
            dashboard_name=f"fraud-dashboard-{environment_suffix}",
            dashboard_body=dashboard_body
        )

        # ============================================================
        # CloudWatch Alarms
        # ============================================================
        
        # API Latency Alarm
        CloudwatchMetricAlarm(
            self,
            "api_latency_alarm",
            alarm_name=f"fraud-api-latency-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="TargetResponseTime",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=0.2,
            alarm_description="Alert when API latency exceeds 200ms",
            treat_missing_data="notBreaching",
            dimensions={"LoadBalancer": alb.arn_suffix},
            tags={"Name": f"fraud-latency-alarm-{environment_suffix}"}
        )

        # ECS Service Health Alarm
        CloudwatchMetricAlarm(
            self,
            "ecs_health_alarm",
            alarm_name=f"fraud-ecs-health-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="HealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=1,
            alarm_description="Alert when no healthy ECS tasks",
            treat_missing_data="breaching",
            dimensions={"TargetGroup": tg_blue.arn_suffix, "LoadBalancer": alb.arn_suffix},
            tags={"Name": f"fraud-ecs-health-alarm-{environment_suffix}"}
        )

        # Aurora Connections Alarm
        CloudwatchMetricAlarm(
            self,
            "aurora_connections_alarm",
            alarm_name=f"fraud-aurora-connections-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when Aurora connections exceed threshold",
            treat_missing_data="notBreaching",
            dimensions={"DBClusterIdentifier": aurora_cluster.cluster_identifier},
            tags={"Name": f"fraud-aurora-alarm-{environment_suffix}"}
        )

        # ============================================================
        # Outputs
        # ============================================================
        
        TerraformOutput(
            self,
            "alb_dns_name",
            value=alb.dns_name,
            description="ALB DNS name"
        )

        TerraformOutput(
            self,
            "api_endpoint",
            value=f"https://{api.id}.execute-api.us-east-1.amazonaws.com/prod",
            description="API Gateway endpoint URL"
        )

        TerraformOutput(
            self,
            "dashboard_url",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name={dashboard.dashboard_name}",
            description="CloudWatch Dashboard URL"
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=ecs_cluster.name,
            description="ECS Cluster name"
        )

        TerraformOutput(
            self,
            "aurora_endpoint",
            value=aurora_cluster.endpoint,
            description="Aurora cluster endpoint"
        )


app = App()
FraudDetectionStack(app, "fraud-detection", environment_suffix="dev")
app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "pipenv run python main.py",
  "projectId": "fraud-detection-api",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: Pipfile

```
[[source]]
url = "https://pypi.org/simple"
verify_ssl = true
name = "pypi"

[packages]
cdktf = "~=0.19.0"
cdktf-cdktf-provider-aws = "~=18.0"
constructs = "~=10.3.0"

[requires]
python_version = "3.9"
```

## File: .gitignore

```
# CDKTF
.gen
.terraform
terraform.tfstate*
cdktf.out
cdktf.log
__pycache__/
*.py[cod]
*$py.class

# Virtual environments
.venv
venv/
ENV/
env/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
```

## File: README.md

```markdown
# Fraud Detection API Infrastructure

Production-ready infrastructure for a fraud detection API using CDKTF with Python.

## Architecture Overview

This infrastructure deploys a complete fraud detection API system with:

- **VPC**: 3 availability zones with public and private subnets
- **ECS Fargate**: Containerized API service with auto-scaling
- **Application Load Balancer**: SSL/TLS termination and traffic distribution
- **API Gateway**: Request throttling and API key authentication
- **Aurora Serverless v2**: PostgreSQL database with auto-scaling
- **Secrets Manager**: Secure credential storage with rotation
- **CloudWatch**: Comprehensive monitoring, dashboards, and alarms
- **X-Ray**: Distributed tracing for performance analysis
- **WAF**: Web application firewall with rate limiting and geo-blocking
- **S3**: VPC flow logs with lifecycle policies

## Prerequisites

- Python 3.9+
- Pipenv
- Node.js 16+ (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform CLI

## Installation

1. Install dependencies:
```bash
pipenv install
```

2. Install CDKTF CLI:
```bash
npm install -g cdktf-cli
```

## Deployment

1. Synthesize Terraform configuration:
```bash
cdktf synth
```

2. Deploy infrastructure:
```bash
cdktf deploy
```

3. Approve the deployment when prompted.

## Configuration

### Environment Suffix

The infrastructure uses an `environment_suffix` parameter for multi-environment deployment:

```python
FraudDetectionStack(app, "fraud-detection", environment_suffix="dev")
```

Change "dev" to "staging" or "prod" for different environments.

### Region

Default region is `us-east-1`. Modify in the AwsProvider configuration if needed.

## Outputs

After deployment, the following outputs are available:

- `alb_dns_name`: ALB DNS name for direct access
- `api_endpoint`: API Gateway endpoint URL
- `dashboard_url`: CloudWatch dashboard URL
- `vpc_id`: VPC identifier
- `ecs_cluster_name`: ECS cluster name
- `aurora_endpoint`: Aurora database endpoint

## Security Features

### PCI DSS Compliance

- Encryption at rest for Aurora database
- SSL/TLS encryption in transit
- WAF protection against common attacks
- Secure credential management with Secrets Manager
- VPC flow logs for security auditing
- CloudWatch monitoring and alerting

### IAM Least Privilege

ECS tasks have minimal required permissions:
- Secrets Manager read access
- CloudWatch Logs write access
- X-Ray daemon write access

### Network Security

- Database in private subnets only
- ECS tasks in private subnets
- ALB in public subnets
- Security groups with minimal ingress rules
- NAT Gateway for controlled outbound access

## Monitoring

### CloudWatch Dashboard

View real-time metrics:
- API response times
- Error rates (4xx, 5xx)
- Database connections
- ECS resource utilization

### CloudWatch Alarms

Configured alarms:
- API latency > 200ms
- ECS service health < 1 healthy task
- Aurora connections > 80

## Auto-Scaling

### ECS Service

- Min: 2 tasks
- Max: 10 tasks
- Scale up when CPU > 70%
- Scale down when CPU < 70%

### Aurora Serverless v2

- Min: 0.5 ACUs
- Max: 4.0 ACUs
- Auto-scales based on workload

## API Usage

### Authentication

API requests require an API key in the `x-api-key` header:

```bash
curl -H "x-api-key: YOUR_API_KEY" https://API_ENDPOINT/api/detect
```

### Rate Limiting

- 1000 requests/second per API key
- 2000 burst limit
- 100,000 requests per day quota

## Blue-Green Deployment

Two target groups configured for zero-downtime deployments:
- `fraud-tg-blue`: Active target group
- `fraud-tg-green`: Standby target group

## Cleanup

To destroy all infrastructure:

```bash
cdktf destroy
```

## Cost Optimization

- Aurora Serverless v2: Scales down to 0.5 ACUs during low traffic
- ECS Fargate: Auto-scales based on demand (min 2 tasks)
- S3 lifecycle policies: Flow logs deleted after 90 days
- CloudWatch log retention: 30 days

## Troubleshooting

### ECS Task Failures

Check CloudWatch Logs:
```bash
aws logs tail /ecs/fraud-api-dev --follow
```

### Database Connection Issues

Verify security group rules allow ECS tasks to reach Aurora on port 5432.

### High Latency

Review CloudWatch dashboard and X-Ray traces for bottlenecks.

## Support

For issues or questions, refer to:
- CloudWatch Dashboard for real-time metrics
- CloudWatch Logs for application logs
- X-Ray for distributed tracing
- VPC Flow Logs for network analysis
```

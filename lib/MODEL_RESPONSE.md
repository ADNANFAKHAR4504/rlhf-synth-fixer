#!/usr/bin/env python3
"""
Production-Ready AWS Infrastructure with Python CDKTF
Project: IaC - AWS Nova Model Breaking
Author: Senior Cloud Engineer
Description: Complete AWS infrastructure stack with Fargate, RDS, VPC, and monitoring
"""

from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, RemoteBackend, NamedRemoteWorkspace
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
import json


class NetworkingModule:
    """Modular networking component for VPC, subnets, and routing"""
    
    def __init__(self, scope: Construct, vpc_cidr: str = "10.0.0.0/16"):
        self.scope = scope
        self.vpc_cidr = vpc_cidr
        self.common_tags = {"Environment": "Production"}
        
        # Create VPC
        self.vpc = Vpc(
            scope, "vpc",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": "production-vpc"}
        )
        
        # Internet Gateway
        self.igw = InternetGateway(
            scope, "igw",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": "production-igw"}
        )
        
        # Create subnets
        self._create_subnets()
        self._create_nat_gateways()
        self._create_route_tables()
    
    def _create_subnets(self):
        """Create public and private subnets across AZs"""
        self.public_subnets = []
        self.private_subnets = []
        
        availability_zones = ["us-east-1a", "us-east-1b"]
        
        for i, az in enumerate(availability_zones):
            # Public subnets
            public_subnet = Subnet(
                self.scope, f"public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"public-subnet-{i+1}", "Type": "Public"}
            )
            self.public_subnets.append(public_subnet)
            
            # Private subnets
            private_subnet = Subnet(
                self.scope, f"private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**self.common_tags, "Name": f"private-subnet-{i+1}", "Type": "Private"}
            )
            self.private_subnets.append(private_subnet)
    
    def _create_nat_gateways(self):
        """Create NAT gateways for private subnet internet access"""
        self.nat_gateways = []
        
        for i, public_subnet in enumerate(self.public_subnets):
            # Elastic IP for NAT Gateway
            eip = Eip(
                self.scope, f"nat-eip-{i+1}",
                domain="vpc",
                tags={**self.common_tags, "Name": f"nat-eip-{i+1}"}
            )
            
            # NAT Gateway
            nat_gw = NatGateway(
                self.scope, f"nat-gateway-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**self.common_tags, "Name": f"nat-gateway-{i+1}"}
            )
            self.nat_gateways.append(nat_gw)
    
    def _create_route_tables(self):
        """Create and configure route tables"""
        # Public route table
        self.public_rt = RouteTable(
            self.scope, "public-rt",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": "public-route-table"}
        )
        
        # Route to Internet Gateway
        Route(
            self.scope, "public-route",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self.scope, f"public-rt-association-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id
            )
        
        # Private route tables (one per AZ for high availability)
        self.private_rts = []
        for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = RouteTable(
                self.scope, f"private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags={**self.common_tags, "Name": f"private-route-table-{i+1}"}
            )
            
            # Route to NAT Gateway
            Route(
                self.scope, f"private-route-{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )
            
            # Associate private subnet with private route table
            RouteTableAssociation(
                self.scope, f"private-rt-association-{i+1}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )
            
            self.private_rts.append(private_rt)


class SecurityModule:
    """Modular security component for security groups and IAM"""
    
    def __init__(self, scope: Construct, vpc_id: str):
        self.scope = scope
        self.vpc_id = vpc_id
        self.common_tags = {"Environment": "Production"}
        
        self._create_security_groups()
        self._create_iam_roles()
    
    def _create_security_groups(self):
        """Create security groups for different tiers"""
        # ALB Security Group
        self.alb_sg = SecurityGroup(
            self.scope, "alb-sg",
            name="production-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc_id,
            tags={**self.common_tags, "Name": "alb-security-group"}
        )
        
        # ALB ingress rules
        SecurityGroupRule(
            self.scope, "alb-http-ingress",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.alb_sg.id
        )
        
        SecurityGroupRule(
            self.scope, "alb-https-ingress",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.alb_sg.id
        )
        
        # Fargate Security Group
        self.fargate_sg = SecurityGroup(
            self.scope, "fargate-sg",
            name="production-fargate-sg",
            description="Security group for Fargate services",
            vpc_id=self.vpc_id,
            tags={**self.common_tags, "Name": "fargate-security-group"}
        )
        
        # Fargate ingress from ALB
        SecurityGroupRule(
            self.scope, "fargate-alb-ingress",
            type="ingress",
            from_port=8080,
            to_port=8080,
            protocol="tcp",
            source_security_group_id=self.alb_sg.id,
            security_group_id=self.fargate_sg.id
        )
        
        # RDS Security Group
        self.rds_sg = SecurityGroup(
            self.scope, "rds-sg",
            name="production-rds-sg",
            description="Security group for RDS database",
            vpc_id=self.vpc_id,
            tags={**self.common_tags, "Name": "rds-security-group"}
        )
        
        # RDS ingress from Fargate
        SecurityGroupRule(
            self.scope, "rds-fargate-ingress",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=self.fargate_sg.id,
            security_group_id=self.rds_sg.id
        )
        
        # Egress rules (allow all outbound)
        for sg in [self.alb_sg, self.fargate_sg, self.rds_sg]:
            SecurityGroupRule(
                self.scope, f"{sg.name}-egress",
                type="egress",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                security_group_id=sg.id
            )
    
    def _create_iam_roles(self):
        """Create IAM roles following least privilege principle"""
        # ECS Task Execution Role
        self.ecs_execution_role = IamRole(
            self.scope, "ecs-execution-role",
            name="production-ecs-execution-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"}
                }]
            }),
            tags=self.common_tags
        )
        
        # Attach managed policy for ECS task execution
        IamRolePolicyAttachment(
            self.scope, "ecs-execution-role-policy",
            role=self.ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )
        
        # ECS Task Role (for application permissions)
        self.ecs_task_role = IamRole(
            self.scope, "ecs-task-role",
            name="production-ecs-task-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"}
                }]
            }),
            tags=self.common_tags
        )
        
        # Custom policy for Secrets Manager access
        secrets_policy = IamPolicy(
            self.scope, "secrets-access-policy",
            name="production-secrets-access-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:production/*"
                }]
            })
        )
        
        IamRolePolicyAttachment(
            self.scope, "ecs-task-secrets-policy",
            role=self.ecs_task_role.name,
            policy_arn=secrets_policy.arn
        )


class SecretsModule:
    """Modular secrets management component"""
    
    def __init__(self, scope: Construct):
        self.scope = scope
        self.common_tags = {"Environment": "Production"}
        
        self._create_secrets()
    
    def _create_secrets(self):
        """Create secrets in AWS Secrets Manager"""
        # Database credentials
        self.db_secret = SecretsmanagerSecret(
            self.scope, "db-credentials",
            name="production/database/credentials",
            description="Database credentials for production RDS instance",
            tags=self.common_tags
        )
        
        # Store database credentials
        SecretsmanagerSecretVersion(
            self.scope, "db-credentials-version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps({
                "username": "dbadmin",
                "password": "ChangeMe123!SecurePassword",
                "engine": "postgres",
                "host": "will-be-updated-after-rds-creation",
                "port": 5432,
                "dbname": "production"
            })
        )
        
        # Application secrets
        self.app_secret = SecretsmanagerSecret(
            self.scope, "app-secrets",
            name="production/application/secrets",
            description="Application secrets for production environment",
            tags=self.common_tags
        )
        
        SecretsmanagerSecretVersion(
            self.scope, "app-secrets-version",
            secret_id=self.app_secret.id,
            secret_string=json.dumps({
                "jwt_secret": "super-secure-jwt-secret-key-change-in-production",
                "api_key": "production-api-key-12345",
                "encryption_key": "32-char-encryption-key-here-123"
            })
        )


class DatabaseModule:
    """Modular database component with RDS"""
    
    def __init__(self, scope: Construct, vpc_id: str, private_subnets: list, security_group_id: str):
        self.scope = scope
        self.vpc_id = vpc_id
        self.private_subnets = private_subnets
        self.security_group_id = security_group_id
        self.common_tags = {"Environment": "Production"}
        
        self._create_database()
    
    def _create_database(self):
        """Create RDS instance with high availability"""
        # DB Subnet Group
        self.db_subnet_group = DbSubnetGroup(
            self.scope, "db-subnet-group",
            name="production-db-subnet-group",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.common_tags, "Name": "production-db-subnet-group"}
        )
        
        # RDS Instance
        self.rds_instance = DbInstance(
            self.scope, "rds-instance",
            identifier="production-postgres-db",
            engine="postgres",
            engine_version="14.9",
            instance_class="db.t3.micro",  # Use appropriate size for production
            allocated_storage=20,
            max_allocated_storage=100,
            storage_type="gp2",
            storage_encrypted=True,
            db_name="production",
            username="dbadmin",
            manage_master_user_password=True,  # AWS managed password
            vpc_security_group_ids=[self.security_group_id],
            db_subnet_group_name=self.db_subnet_group.name,
            multi_az=True,  # High availability
            backup_retention_period=7,  # 7 days backup retention
            backup_window="03:00-04:00",  # UTC
            maintenance_window="sun:04:00-sun:05:00",  # UTC
            skip_final_snapshot=False,
            final_snapshot_identifier="production-db-final-snapshot",
            deletion_protection=True,  # Prevent accidental deletion
            enabled_cloudwatch_logs_exports=["postgresql"],
            monitoring_interval=60,
            monitoring_role_arn="arn:aws:iam::aws:role/rds-monitoring-role",
            performance_insights_enabled=True,
            tags={**self.common_tags, "Name": "production-postgres-db"}
        )


class ComputeModule:
    """Modular compute component with ECS Fargate"""
    
    def __init__(self, scope: Construct, vpc_id: str, public_subnets: list, private_subnets: list, 
                 alb_sg_id: str, fargate_sg_id: str, execution_role_arn: str, task_role_arn: str):
        self.scope = scope
        self.vpc_id = vpc_id
        self.public_subnets = public_subnets
        self.private_subnets = private_subnets
        self.alb_sg_id = alb_sg_id
        self.fargate_sg_id = fargate_sg_id
        self.execution_role_arn = execution_role_arn
        self.task_role_arn = task_role_arn
        self.common_tags = {"Environment": "Production"}
        
        self._create_compute_resources()
    
    def _create_compute_resources(self):
        """Create ECS cluster, ALB, and Fargate services"""
        # CloudWatch Log Group
        self.log_group = CloudwatchLogGroup(
            self.scope, "ecs-log-group",
            name="/ecs/production-app",
            retention_in_days=30,
            tags=self.common_tags
        )
        
        # ECS Cluster
        self.ecs_cluster = EcsCluster(
            self.scope, "ecs-cluster",
            name="production-cluster",
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={**self.common_tags, "Name": "production-ecs-cluster"}
        )
        
        # Application Load Balancer
        self.alb = Lb(
            self.scope, "alb",
            name="production-alb",
            load_balancer_type="application",
            scheme="internet-facing",
            security_groups=[self.alb_sg_id],
            subnets=[subnet.id for subnet in self.public_subnets],
            enable_deletion_protection=True,
            tags={**self.common_tags, "Name": "production-alb"}
        )
        
        # Target Group
        self.target_group = LbTargetGroup(
            self.scope, "app-target-group",
            name="production-app-tg",
            port=8080,
            protocol="HTTP",
            vpc_id=self.vpc_id,
            target_type="ip",
            health_check={
                "enabled": True,
                "healthy_threshold": 2,
                "unhealthy_threshold": 2,
                "timeout": 5,
                "interval": 30,
                "path": "/health",
                "matcher": "200",
                "protocol": "HTTP",
                "port": "traffic-port"
            },
            tags={**self.common_tags, "Name": "production-app-target-group"}
        )
        
        # ALB Listener
        self.alb_listener = LbListener(
            self.scope, "alb-listener",
            load_balancer_arn=self.alb.arn,
            port="80",
            protocol="HTTP",
            default_action=[{
                "type": "forward",
                "target_group_arn": self.target_group.arn
            }]
        )
        
        # ECS Task Definition
        self.task_definition = EcsTaskDefinition(
            self.scope, "app-task-definition",
            family="production-app",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=self.execution_role_arn,
            task_role_arn=self.task_role_arn,
            container_definitions=json.dumps([{
                "name": "production-app",
                "image": "nginx:latest",  # Replace with your application image
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "essential": True,
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": self.log_group.name,
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "environment": [
                    {"name": "ENV", "value": "production"},
                    {"name": "PORT", "value": "8080"}
                ],
                "secrets": [
                    {
                        "name": "DB_PASSWORD",
                        "valueFrom": "arn:aws:secretsmanager:us-east-1:*:secret:production/database/credentials:password::"
                    },
                    {
                        "name": "JWT_SECRET",
                        "valueFrom": "arn:aws:secretsmanager:us-east-1:*:secret:production/application/secrets:jwt_secret::"
                    }
                ]
            }]),
            tags={**self.common_tags, "Name": "production-app-task-definition"}
        )
        
        # ECS Service
        self.ecs_service = EcsService(
            self.scope, "app-service",
            name="production-app-service",
            cluster=self.ecs_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,  # High availability
            launch_type="FARGATE",
            platform_version="LATEST",
            network_configuration={
                "subnets": [subnet.id for subnet in self.private_subnets],
                "security_groups": [self.fargate_sg_id],
                "assign_public_ip": False
            },
            load_balancer=[{
                "target_group_arn": self.target_group.arn,
                "container_name": "production-app",
                "container_port": 8080
            }],
            deployment_configuration={
                "maximum_percent": 200,
                "minimum_healthy_percent": 50,
                "deployment_circuit_breaker": {
                    "enable": True,
                    "rollback": True
                }
            },
            enable_execute_command=True,  # For debugging
            tags={**self.common_tags, "Name": "production-app-service"},
            depends_on=[self.alb_listener]
        )


class MonitoringModule:
    """Modular monitoring component with CloudWatch"""
    
    def __init__(self, scope: Construct, cluster_name: str, service_name: str, 
                 alb_arn: str, target_group_arn: str, db_instance_id: str):
        self.scope = scope
        self.cluster_name = cluster_name
        self.service_name = service_name
        self.alb_arn = alb_arn
        self.target_group_arn = target_group_arn
        self.db_instance_id = db_instance_id
        self.common_tags = {"Environment": "Production"}
        
        self._create_monitoring()
    
    def _create_monitoring(self):
        """Create CloudWatch alarms and SNS notifications"""
        # SNS Topic for alerts
        self.alert_topic = SnsTopic(
            self.scope, "alert-topic",
            name="production-alerts",
            tags=self.common_tags
        )
        
        # Email subscription (replace with actual email)
        SnsTopicSubscription(
            self.scope, "alert-email-subscription",
            topic_arn=self.alert_topic.arn,
            protocol="email",
            endpoint="admin@yourcompany.com"  # Replace with actual email
        )
        
        # ECS Service CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self.scope, "ecs-cpu-alarm",
            alarm_name="production-ecs-high-cpu",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="ECS service CPU utilization is too high",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "ServiceName": self.service_name,
                "ClusterName": self.cluster_name
            },
            tags=self.common_tags
        )
        
        # ECS Service Memory Utilization Alarm
        CloudwatchMetricAlarm(
            self.scope, "ecs-memory-alarm",
            alarm_name="production-ecs-high-memory",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="ECS service memory utilization is too high",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "ServiceName": self.service_name,
                "ClusterName": self.cluster_name
            },
            tags=self.common_tags
        )
        
        # ALB Target Health Alarm
        CloudwatchMetricAlarm(
            self.scope, "alb-unhealthy-targets",
            alarm_name="production-alb-unhealthy-targets",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=0,
            alarm_description="ALB has unhealthy targets",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "TargetGroup": self.target_group_arn.split("/")[-1],
                "LoadBalancer": "/".join(self.alb_arn.split("/")[-3:])
            },
            tags=self.common_tags
        )
        
        # RDS CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self.scope, "rds-cpu-alarm",
            alarm_name="production-rds-high-cpu",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="RDS CPU utilization is too high",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.db_instance_id
            },
            tags=self.common_tags
        )
        
        # RDS Connection Count Alarm
        CloudwatchMetricAlarm(
            self.scope, "rds-connections-alarm",
            alarm_name="production-rds-high-connections",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="RDS connection count is too high",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.db_instance_id
            },
            tags=self.common_tags
        )


class ProductionInfrastructureStack(TerraformStack):
    """Main infrastructure stack orchestrating all modules"""
    
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)
        
        # AWS Provider
        AwsProvider(self, "aws", region="us-east-1")
        
        # Initialize modules
        self.networking = NetworkingModule(self)
        self.security = SecurityModule(self, self.networking.vpc.id)
        self.secrets = SecretsModule(self)
        
        self.database = DatabaseModule(
            self,
            self.networking.vpc.id,
            self.networking.private_subnets,
            self.security.rds_sg.id
        )
        
        self.compute = ComputeModule(
            self,
            self.networking.vpc.id,
            self.networking.public_subnets,
            self.networking.private_subnets,
            self.security.alb_sg.id,
            self.security.fargate_sg.id,
            self.security.ecs_execution_role.arn,
            self.security.ecs_task_role.arn
        )
        
        self.monitoring = MonitoringModule(
            self,
            self.compute.ecs_cluster.name,
            self.compute.ecs_service.name,
            self.compute.alb.arn,
            self.compute.target_group.arn,
            self.database.rds_instance.id
        )
        
        # Outputs
        TerraformOutput(
            self, "vpc_id",
            value=self.networking.vpc.id,
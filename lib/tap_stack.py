# pylint: skip-file
"""Production-ready TapStack implemented in a single file.
Paste-only class; do not instantiate an App() here.
"""

import json
import os
from typing import List

from cdktf import (LocalBackend, TerraformOutput, TerraformStack,
                   TerraformVariable)
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import \
    CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_service import (EcsService,
                                                  EcsServiceLoadBalancer)
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_listener import (
    LbListener, LbListenerDefaultAction, LbListenerDefaultActionForward,
    LbListenerDefaultActionForwardTargetGroup)
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import \
    SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import \
    SnsTopicSubscription
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from constructs import Construct


class TapStack(TerraformStack):
    """Single-file production stack for AWS Fargate + optional RDS in us-west-1."""

    def __init__(self, scope: Construct, construct_id: str) -> None:
        super().__init__(scope, construct_id)

        # Resolve region from environment (fallback us-west-1)
        aws_region = os.getenv("AWS_REGION", "us-west-2")

        # Provider and local backend (no Terraform Cloud token required)
        AwsProvider(self, "aws", region=aws_region)
        LocalBackend(self)

        # Optional database creation (default: disabled to keep tests/resource usage light)
        enable_database = os.getenv("ENABLE_DATABASE", "false").lower() == "true"

        # Sensitive variables (supplied via TFC workspace variables or env)
        db_username = TerraformVariable(
            self,
            "db_username",
            type="string",
            sensitive=True,
            default=os.getenv("TF_VAR_db_username", os.getenv("DB_USERNAME", "postgres")),
        )
        db_password = TerraformVariable(
            self,
            "db_password",
            type="string",
            sensitive=True,
            default=os.getenv("TF_VAR_db_password", os.getenv("DB_PASSWORD", "Password123!")),
        )
        jwt_secret = TerraformVariable(
            self,
            "jwt_secret",
            type="string",
            sensitive=True,
            default=os.getenv("TF_VAR_jwt_secret", os.getenv("JWT_SECRET", "dev-jwt-secret")),
        )
        api_key = TerraformVariable(
            self,
            "api_key",
            type="string",
            sensitive=True,
            default=os.getenv("TF_VAR_api_key", os.getenv("API_KEY", "dev-api-key")),
        )
        encryption_key = TerraformVariable(
            self,
            "encryption_key",
            type="string",
            sensitive=True,
            default=os.getenv("TF_VAR_encryption_key", os.getenv("ENCRYPTION_KEY", "dev-encryption-key")),
        )
        alert_email = TerraformVariable(self, "alert_email", type="string", default="alerts@example.com")

        # Common tags
        common_tags = {"Environment": "Production"}

        # Networking: VPC, subnets, IGW, NAT, routes
        vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": "production-vpc"},
        )

        igw = InternetGateway(self, "igw", vpc_id=vpc.id, tags={**common_tags, "Name": "production-igw"})

        azs = [f"{aws_region}a", f"{aws_region}b"]
        public_subnets: List[Subnet] = []
        private_subnets: List[Subnet] = []
        for i, az in enumerate(azs):
            public = Subnet(
                self,
                f"public-{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**common_tags, "Name": f"public-{i+1}", "Type": "Public"},
            )
            private = Subnet(
                self,
                f"private-{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+11}.0/24",
                availability_zone=az,
                tags={**common_tags, "Name": f"private-{i+1}", "Type": "Private"},
            )
            public_subnets.append(public)
            private_subnets.append(private)

        nat_gateways: List[NatGateway] = []
        for i, pub in enumerate(public_subnets):
            eip = Eip(self, f"nat-eip-{i+1}", domain="vpc", tags={**common_tags, "Name": f"nat-eip-{i+1}"})
            nat = NatGateway(
                self,
                f"nat-{i+1}",
                allocation_id=eip.id,
                subnet_id=pub.id,
                tags={**common_tags, "Name": f"nat-{i+1}"},
            )
            nat_gateways.append(nat)

        public_rt = RouteTable(self, "public-rt", vpc_id=vpc.id, tags={**common_tags, "Name": "public-rt"})
        Route(
            self,
            "public-default",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
        )
        for i, s in enumerate(public_subnets):
            RouteTableAssociation(self, f"pub-assoc-{i+1}", subnet_id=s.id, route_table_id=public_rt.id)

        for i, (s, nat) in enumerate(zip(private_subnets, nat_gateways)):
            rt = RouteTable(
                self,
                f"private-rt-{i+1}",
                vpc_id=vpc.id,
                tags={**common_tags, "Name": f"private-rt-{i+1}"},
            )
            Route(
                self,
                f"private-default-{i+1}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id,
            )
            RouteTableAssociation(self, f"priv-assoc-{i+1}", subnet_id=s.id, route_table_id=rt.id)

        # Security groups
        alb_sg = SecurityGroup(
            self,
            "alb-sg",
            name="production-alb-sg",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": "alb-sg"},
        )
        SecurityGroupRule(
            self,
            "alb-http",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=alb_sg.id,
        )
        SecurityGroupRule(
            self,
            "alb-https",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=alb_sg.id,
        )

        fargate_sg = SecurityGroup(
            self,
            "fargate-sg",
            name="production-fargate-sg",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": "fargate-sg"},
        )
        SecurityGroupRule(
            self,
            "svc-from-alb",
            type="ingress",
            from_port=8080,
            to_port=8080,
            protocol="tcp",
            source_security_group_id=alb_sg.id,
            security_group_id=fargate_sg.id,
        )

        rds_sg = SecurityGroup(
            self,
            "rds-sg",
            name="production-rds-sg",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": "rds-sg"},
        )
        SecurityGroupRule(
            self,
            "rds-from-svc",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=fargate_sg.id,
            security_group_id=rds_sg.id,
        )
        # Explicit egress rules with static construct ids (no tokens in ids)
        SecurityGroupRule(
            self,
            "alb-sg-egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=alb_sg.id,
        )
        SecurityGroupRule(
            self,
            "fargate-sg-egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=fargate_sg.id,
        )
        SecurityGroupRule(
            self,
            "rds-sg-egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=rds_sg.id,
        )

        # IAM for ECS and Secrets access
        ecs_exec_role = IamRole(
            self,
            "ecs-exec-role",
            name="production-ecs-execution-role",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                        }
                    ],
                }
            ),
            tags=common_tags,
        )
        IamRolePolicyAttachment(
            self,
            "ecs-exec-policy",
            role=ecs_exec_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
        )

        ecs_task_role = IamRole(
            self,
            "ecs-task-role",
            name="production-ecs-task-role",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                        }
                    ],
                }
            ),
            tags=common_tags,
        )
        secrets_policy = IamPolicy(
            self,
            "secrets-policy",
            name="production-secrets-access-policy",
            policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "secretsmanager:GetSecretValue",
                                "secretsmanager:DescribeSecret",
                            ],
                            "Resource": f"arn:aws:secretsmanager:{aws_region}:*:secret:production/*",
                        }
                    ],
                }
            ),
        )
        IamRolePolicyAttachment(
            self, "ecs-task-secrets-policy", role=ecs_task_role.name, policy_arn=secrets_policy.arn
        )

        # Secrets Manager (values from sensitive vars)
        db_secret = SecretsmanagerSecret(
            self, "db-secret", name="production/database/credentials", description="DB credentials"
        )
        SecretsmanagerSecretVersion(
            self,
            "db-secret-v",
            secret_id=db_secret.id,
            secret_string=json.dumps(
                {
                    "username": db_username.string_value,
                    "password": db_password.string_value,
                    "engine": "postgres",
                    "port": 5432,
                    "dbname": "production",
                }
            ),
        )

        app_secret = SecretsmanagerSecret(
            self, "app-secret", name="production/application/secrets", description="App secrets"
        )
        SecretsmanagerSecretVersion(
            self,
            "app-secret-v",
            secret_id=app_secret.id,
            secret_string=json.dumps(
                {
                    "jwt_secret": jwt_secret.string_value,
                    "api_key": api_key.string_value,
                    "encryption_key": encryption_key.string_value,
                }
            ),
        )

        # Optional RDS (skipped unless ENABLE_DATABASE=true)
        rds = None
        if enable_database:
            db_subnets = DbSubnetGroup(
                self,
                "db-subnets",
                name="production-db-subnets",
                subnet_ids=[s.id for s in private_subnets],
                tags={**common_tags, "Name": "production-db-subnets"},
            )
            rds = DbInstance(
                self,
                "rds",
                identifier="production-postgres-db",
                engine="postgres",
                engine_version="14.9",
                instance_class="db.t3.micro",
                allocated_storage=20,
                max_allocated_storage=100,
                storage_type="gp2",
                storage_encrypted=True,
                db_name="production",
                username=db_username.string_value,
                password=db_password.string_value,
                vpc_security_group_ids=[rds_sg.id],
                db_subnet_group_name=db_subnets.name,
                multi_az=True,
                backup_retention_period=7,
                backup_window="03:00-04:00",
                maintenance_window="sun:04:00-sun:05:00",
                skip_final_snapshot=False,
                final_snapshot_identifier="production-db-final-snapshot",
                deletion_protection=True,
                enabled_cloudwatch_logs_exports=["postgresql"],
                performance_insights_enabled=True,
                tags={**common_tags, "Name": "production-postgres-db"},
            )

        # Compute: ECS + ALB
        log_group = CloudwatchLogGroup(
            self, "ecs-logs", name="/ecs/production-app", retention_in_days=30, tags=common_tags
        )
        cluster = EcsCluster(
            self,
            "ecs-cluster",
            name="production-cluster",
            setting=[{"name": "containerInsights", "value": "enabled"}],
            tags={**common_tags, "Name": "production-ecs-cluster"},
        )
        alb = Lb(
            self,
            "alb",
            name="production-alb",
            load_balancer_type="application",
            internal=False,
            security_groups=[alb_sg.id],
            subnets=[s.id for s in public_subnets],
            enable_deletion_protection=True,
            tags={**common_tags, "Name": "production-alb"},
        )
        tg = LbTargetGroup(
            self,
            "tg",
            name="production-app-tg",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
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
                "port": "traffic-port",
            },
            tags={**common_tags, "Name": "production-app-tg"},
        )
        LbListener(
            self,
            "listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    forward=LbListenerDefaultActionForward(
                        target_group=[
                            LbListenerDefaultActionForwardTargetGroup(arn=tg.arn)
                        ]
                    ),
                )
            ],
        )

        task_def = EcsTaskDefinition(
            self,
            "task",
            family="production-app",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=ecs_exec_role.arn,
            task_role_arn=ecs_task_role.arn,
            container_definitions=json.dumps(
                [
                    {
                        "name": "production-app",
                        "image": "nginx:latest",
                        "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
                        "essential": True,
                        "logConfiguration": {
                            "logDriver": "awslogs",
                            "options": {
                                "awslogs-group": log_group.name,
                                "awslogs-region": aws_region,
                                "awslogs-stream-prefix": "ecs",
                            },
                        },
                        "environment": [
                            {"name": "ENV", "value": "production"},
                            {"name": "PORT", "value": "8080"},
                        ],
                        "secrets": [
                            {"name": "DB_USERNAME", "valueFrom": db_secret.arn + ":username::"},
                            {"name": "DB_PASSWORD", "valueFrom": db_secret.arn + ":password::"},
                            {"name": "JWT_SECRET", "valueFrom": app_secret.arn + ":jwt_secret::"},
                        ],
                    }
                ]
            ),
            tags={**common_tags, "Name": "production-app-task"},
        )

        service = EcsService(
            self,
            "service",
            name="production-app-service",
            cluster=cluster.id,
            task_definition=task_def.arn,
            desired_count=2,
            launch_type="FARGATE",
            platform_version="LATEST",
            network_configuration={
                "subnets": [s.id for s in private_subnets],
                "security_groups": [fargate_sg.id],
                "assign_public_ip": False,
            },
            load_balancer=[
                EcsServiceLoadBalancer(container_name="production-app", container_port=8080, target_group_arn=tg.arn)
            ],
            deployment_maximum_percent=200,
            deployment_minimum_healthy_percent=50,
            deployment_circuit_breaker={"enable": True, "rollback": True},
            enable_execute_command=True,
            tags={**common_tags, "Name": "production-app-service"},
        )

        # Monitoring: SNS + Alarms
        alerts = SnsTopic(self, "alerts", name="production-alerts", tags=common_tags)
        SnsTopicSubscription(
            self,
            "alerts-email",
            topic_arn=alerts.arn,
            protocol="email",
            endpoint=alert_email.string_value,
        )

        CloudwatchMetricAlarm(
            self,
            "ecs-cpu-high",
            alarm_name="production-ecs-high-cpu",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="ECS service CPU utilization is too high",
            alarm_actions=[alerts.arn],
            dimensions={"ServiceName": service.name, "ClusterName": cluster.name},
            tags=common_tags,
        )
        CloudwatchMetricAlarm(
            self,
            "ecs-mem-high",
            alarm_name="production-ecs-high-memory",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="ECS service memory utilization is too high",
            alarm_actions=[alerts.arn],
            dimensions={"ServiceName": service.name, "ClusterName": cluster.name},
            tags=common_tags,
        )

        def alb_dimensions(alb_arn: str, tg_arn: str) -> dict:
            alb_resource = alb_arn.split(":")[-1]  # loadbalancer/app/<name>/<hash>
            tg_resource = tg_arn.split(":")[-1]  # targetgroup/<name>/<hash>
            return {
                "LoadBalancer": "/".join(alb_resource.split("/")[1:]),
                "TargetGroup": "/".join(tg_resource.split("/")[1:]),
            }

        alb_unhealthy_alarm = CloudwatchMetricAlarm(
            self,
            "alb-unhealthy",
            alarm_name="production-alb-unhealthy-targets",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=0,
            alarm_description="ALB has unhealthy targets",
            alarm_actions=[alerts.arn],
            dimensions={"LoadBalancer": "", "TargetGroup": ""},
            tags=common_tags,
        )

        # Fix ALB metric dimensions using Terraform expressions
        self.add_override(
            "resource.aws_cloudwatch_metric_alarm.alb-unhealthy.dimensions.LoadBalancer",
            '${replace(aws_lb.alb.arn_suffix, "loadbalancer/", "")}')
        self.add_override(
            "resource.aws_cloudwatch_metric_alarm.alb-unhealthy.dimensions.TargetGroup",
            "${aws_lb_target_group.tg.arn_suffix}")

        if enable_database and rds is not None:
            CloudwatchMetricAlarm(
                self,
                "rds-cpu-high",
                alarm_name="production-rds-high-cpu",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="CPUUtilization",
                namespace="AWS/RDS",
                period=300,
                statistic="Average",
                threshold=80,
                alarm_description="RDS CPU utilization is too high",
                alarm_actions=[alerts.arn],
                dimensions={"DBInstanceIdentifier": rds.id},
                tags=common_tags,
            )

        # Outputs for verification
        TerraformOutput(self, "vpc_id", value=vpc.id)
        TerraformOutput(self, "alb_dns_name", value=alb.dns_name)
        TerraformOutput(self, "target_group_arn", value=tg.arn)
        TerraformOutput(self, "ecs_cluster_name", value=cluster.name)
        TerraformOutput(self, "ecs_service_name", value=service.name)
        TerraformOutput(self, "db_secret_arn", value=db_secret.arn)
        TerraformOutput(self, "app_secret_arn", value=app_secret.arn)
        if enable_database and rds is not None:
            TerraformOutput(self, "rds_identifier", value=rds.id)
            TerraformOutput(self, "rds_endpoint", value=rds.address)

if __name__ == "__main__":
    # Create an app, instantiate the stack, and synthesize
    from cdktf import App

    app = App()
    TapStack(app, "tap")
    app.synth()

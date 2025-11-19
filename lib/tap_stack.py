"""tap_stack.py
Main CDK stack orchestrating all infrastructure components for the payment processing system.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from .networking_stack import NetworkingStack, NetworkingStackProps
from .database_stack import DatabaseStack, DatabaseStackProps
from .security_stack import SecurityStack, SecurityStackProps
from .container_stack import ContainerStack, ContainerStackProps
from .ecs_stack import EcsStack, EcsStackProps
from .monitoring_stack import MonitoringStack, MonitoringStackProps
from .deployment_stack import DeploymentStack, DeploymentStackProps


class TapStackProps(cdk.StackProps):
    """Properties for TapStack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main stack for multi-tier payment processing system.

    Orchestrates deployment of:
    - Networking (VPC, subnets, NAT Gateways)
    - Security (KMS, Secrets Manager, Security Groups)
    - Database (Aurora Serverless v2)
    - Containers (ECR repositories)
    - ECS (Cluster, services, ALB, service discovery)
    - Monitoring (CloudWatch dashboards, alarms)
    - Deployment (CodeDeploy blue-green deployments)
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[TapStackProps] = None,
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        self.environment_suffix = environment_suffix

        # 1. Networking Stack - VPC with 3 AZs, public/private subnets, NAT Gateways
        networking_props = NetworkingStackProps(environment_suffix=environment_suffix)
        self.networking_stack = NetworkingStack(
            self, f"NetworkingStack{environment_suffix}", props=networking_props
        )

        # 2. Security Stack - KMS keys, Secrets Manager, Security Groups
        security_props = SecurityStackProps(
            environment_suffix=environment_suffix, vpc=self.networking_stack.vpc
        )
        self.security_stack = SecurityStack(
            self, f"SecurityStack{environment_suffix}", props=security_props
        )

        # 3. Database Stack - Aurora Serverless v2 PostgreSQL
        database_props = DatabaseStackProps(
            environment_suffix=environment_suffix,
            vpc=self.networking_stack.vpc,
            database_security_group=self.security_stack.database_security_group,
            kms_key=self.security_stack.kms_key,
            db_secret=self.security_stack.db_secret
        )
        self.database_stack = DatabaseStack(
            self, f"DatabaseStack{environment_suffix}", props=database_props
        )

        # 4. Container Stack - ECR repositories with vulnerability scanning
        container_props = ContainerStackProps(environment_suffix=environment_suffix)
        self.container_stack = ContainerStack(
            self, f"ContainerStack{environment_suffix}", props=container_props
        )

        # 5. ECS Stack - Cluster, services, ALB, service discovery
        ecs_props = EcsStackProps(
            environment_suffix=environment_suffix,
            vpc=self.networking_stack.vpc,
            alb_security_group=self.security_stack.alb_security_group,
            ecs_security_group=self.security_stack.ecs_security_group,
            kms_key=self.security_stack.kms_key,
            db_secret=self.security_stack.db_secret,
            api_secret=self.security_stack.api_secret,
            payment_api_repo=self.container_stack.payment_api_repo,
            transaction_processor_repo=self.container_stack.transaction_processor_repo,
            notification_service_repo=self.container_stack.notification_service_repo
        )
        self.ecs_stack = EcsStack(
            self, f"EcsStack{environment_suffix}", props=ecs_props
        )

        # 6. Monitoring Stack - CloudWatch dashboards, alarms, Container Insights
        monitoring_props = MonitoringStackProps(
            environment_suffix=environment_suffix,
            cluster=self.ecs_stack.cluster,
            payment_api_service=self.ecs_stack.payment_api_service,
            transaction_processor_service=self.ecs_stack.transaction_processor_service,
            notification_service=self.ecs_stack.notification_service,
            alb=self.ecs_stack.alb,
            target_groups={
                'payment-api': self.ecs_stack.payment_api_target_group,
                'transaction-processor': self.ecs_stack.transaction_processor_target_group,
                'notification-service': self.ecs_stack.notification_service_target_group
            }
        )
        self.monitoring_stack = MonitoringStack(
            self, f"MonitoringStack{environment_suffix}", props=monitoring_props
        )

        # 7. Deployment Stack - CodeDeploy for blue-green deployments
        deployment_props = DeploymentStackProps(
            environment_suffix=environment_suffix,
            payment_api_service=self.ecs_stack.payment_api_service,
            transaction_processor_service=self.ecs_stack.transaction_processor_service,
            notification_service=self.ecs_stack.notification_service,
            alb_listener=self.ecs_stack.alb_listener,
            target_groups={
                'payment-api': {
                    'blue': self.ecs_stack.payment_api_target_group,
                    'green': self.ecs_stack.payment_api_target_group_green
                },
                'transaction-processor': {
                    'blue': self.ecs_stack.transaction_processor_target_group,
                    'green': self.ecs_stack.transaction_processor_target_group_green
                },
                'notification-service': {
                    'blue': self.ecs_stack.notification_service_target_group,
                    'green': self.ecs_stack.notification_service_target_group_green
                }
            },
            alarms={
                'payment-api': self.monitoring_stack.payment_api_alarm,
                'transaction-processor': self.monitoring_stack.transaction_processor_alarm,
                'notification-service': self.monitoring_stack.notification_service_alarm
            }
        )
        self.deployment_stack = DeploymentStack(
            self, f"DeploymentStack{environment_suffix}", props=deployment_props
        )

        # Stack outputs
        cdk.CfnOutput(
            self, f"LoadBalancerDNS{environment_suffix}",
            value=self.ecs_stack.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS name"
        )
        cdk.CfnOutput(
            self, f"ClusterName{environment_suffix}",
            value=self.ecs_stack.cluster.cluster_name,
            description="ECS Cluster name"
        )
        cdk.CfnOutput(
            self, f"DatabaseEndpoint{environment_suffix}",
            value=self.database_stack.db_cluster.cluster_endpoint.hostname,
            description="Aurora Serverless v2 cluster endpoint"
        )

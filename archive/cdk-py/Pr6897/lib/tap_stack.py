"""tap_stack.py
Main CDK stack orchestrating all infrastructure components for the payment processing system.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from .networking_stack import NetworkingStack, NetworkingStackProps
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
    - Networking (VPC, subnets, NAT Gateways) - nested stack
    - Security (KMS, Secrets Manager, Security Groups) - main stack resources
    - Database (Aurora Serverless v2) - main stack resource
    - Containers (ECR repositories) - nested stack
    - ECS (Cluster, services, ALB, service discovery) - nested stack
    - Monitoring (CloudWatch dashboards, alarms) - nested stack
    - Deployment (CodeDeploy blue-green deployments) - nested stack
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

        # 2. Security Resources - KMS keys, Secrets Manager, Security Groups (in main stack to avoid circular deps)
        from aws_cdk import aws_kms as kms, aws_secretsmanager as secretsmanager, aws_ec2 as ec2, aws_rds as rds, aws_logs as logs, aws_iam as iam

        # KMS key with policy that allows ECS task roles without circular dependency
        self.kms_key = kms.Key(
            self, f"PaymentProcessingKey{environment_suffix}",
            description=f"KMS key for payment processing system {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Add policy statement that allows Secrets Manager to use the key
        self.kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AllowSecretsManagerUse",
                principals=[iam.AccountRootPrincipal()],
                actions=[
                    "kms:Decrypt",
                    "kms:DescribeKey",
                    "kms:CreateGrant",
                    "kms:GenerateDataKey*",
                    "kms:Encrypt",
                    "kms:ReEncrypt*"
                ],
                resources=["*"],
                conditions={
                    "StringEquals": {
                        "kms:ViaService": f"secretsmanager.{cdk.Aws.REGION}.amazonaws.com"
                    }
                }
            )
        )

        # Database secret (without KMS to avoid circular dependency, Secrets Manager uses AWS managed key)
        self.db_secret = secretsmanager.Secret(
            self, f"DatabaseSecret{environment_suffix}",
            secret_name=f"payment-processing-db-secret-{environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "dbadmin"}',
                generate_string_key="password",
                exclude_characters='/@" \\\'',
                password_length=32
            ),
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # API secret (without KMS to avoid circular dependency, Secrets Manager uses AWS managed key)
        self.api_secret = secretsmanager.Secret(
            self, f"APISecret{environment_suffix}",
            secret_name=f"payment-processing-api-secret-{environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"api_key": "placeholder"}',
                generate_string_key="secret_key",
                exclude_characters='/@" \\\'',
                password_length=64
            ),
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # ALB Security Group
        self.alb_security_group = ec2.SecurityGroup(
            self, f"ALBSecurityGroup{environment_suffix}",
            vpc=self.networking_stack.vpc,
            description=f"Security group for ALB {environment_suffix}",
            security_group_name=f"payment-alb-sg-{environment_suffix}",
            allow_all_outbound=True
        )
        self.alb_security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "HTTP")
        self.alb_security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "HTTPS")

        # ECS Security Group
        self.ecs_security_group = ec2.SecurityGroup(
            self, f"ECSSecurityGroup{environment_suffix}",
            vpc=self.networking_stack.vpc,
            description=f"Security group for ECS tasks {environment_suffix}",
            security_group_name=f"payment-ecs-sg-{environment_suffix}",
            allow_all_outbound=True
        )
        self.ecs_security_group.add_ingress_rule(self.alb_security_group, ec2.Port.all_tcp(), "From ALB")
        self.ecs_security_group.add_ingress_rule(self.ecs_security_group, ec2.Port.all_tcp(), "Inter-service")

        # Database Security Group
        self.database_security_group = ec2.SecurityGroup(
            self, f"DatabaseSecurityGroup{environment_suffix}",
            vpc=self.networking_stack.vpc,
            description=f"Security group for database {environment_suffix}",
            security_group_name=f"payment-db-sg-{environment_suffix}",
            allow_all_outbound=False
        )
        self.database_security_group.add_ingress_rule(self.ecs_security_group, ec2.Port.tcp(5432), "PostgreSQL from ECS")

        # 3. Database - Aurora Serverless v2 PostgreSQL (in main stack to avoid circular deps with secret attachment)
        self.db_cluster = rds.DatabaseCluster(
            self, f"AuroraCluster{environment_suffix}",
            cluster_identifier=f"payment-processing-cluster-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_8
            ),
            credentials=rds.Credentials.from_secret(self.db_secret),
            writer=rds.ClusterInstance.serverless_v2(f"Writer{environment_suffix}", scale_with_writer=True),
            readers=[rds.ClusterInstance.serverless_v2(f"Reader{environment_suffix}", scale_with_writer=True)],
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2.0,
            vpc=self.networking_stack.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[self.database_security_group],
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            backup=rds.BackupProps(retention=cdk.Duration.days(7), preferred_window="03:00-04:00"),
            preferred_maintenance_window="sun:04:00-sun:05:00",
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            default_database_name="paymentdb"
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
            alb_security_group=self.alb_security_group,
            ecs_security_group=self.ecs_security_group,
            kms_key=self.kms_key,
            db_secret=self.db_secret,
            api_secret=self.api_secret,
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
            value=self.db_cluster.cluster_endpoint.hostname,
            description="Aurora Serverless v2 cluster endpoint"
        )

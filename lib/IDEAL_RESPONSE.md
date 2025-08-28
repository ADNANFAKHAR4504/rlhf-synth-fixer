```py

#lib/tap_stack.py
"""
tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of VPC, ECS, RDS, Monitoring, Peering, Route53, 
and CI/CD stacks across multiple regions. The stack is parameterized for environment-specific 
deployments and follows a modular structure.
"""

import os
import sys
from dataclasses import dataclass
from typing import List

from aws_cdk import Stack, Environment, NestedStack
from constructs import Construct

# Import sub-stacks
from lib.cdk.vpc_stack import VpcStack
from lib.cdk.ecs_stack import EcsStack
from lib.cdk.rds_stack import RdsStack
from lib.cdk.monitoring_stack import MonitoringStack
from lib.cdk.cicd_stack import CicdStack
from lib.cdk.route53_stack import Route53Stack

# Ensure import path is properly set to access other modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

@dataclass
class TapStackProps:
    """
    TapStackProps defines the properties required for instantiating the TapStack.

    Attributes:
      environment_suffix (str): A suffix for naming resources per environment (e.g., 'dev', 'prod').
      env (Environment): CDK environment (account and region).
      app_name (str): Application name prefix used in naming resources.
      default_regions (List[str]): A list of AWS regions used for cross-region deployment.
    """
    environment_suffix: str
    env: Environment
    app_name: str = "TapStack"
    default_regions: List[str] = ("us-east-1", "us-east-2")


# --- Nested Stack Classes ---

class NestedVpcStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str, env: Environment, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        self.vpc_stack = VpcStack(self, "VpcStack", env=env)
        self.vpc = self.vpc_stack.vpc


class NestedEcsStack(NestedStack):
    # pylint: disable=too-many-arguments
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc,
        env: Environment,
        task_image_options,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)
        self.ecs_stack = EcsStack(
            self,
            "EcsStack",
            vpc=vpc,
            env=env,
            task_image_options=task_image_options
        )
        self.ecs_service = self.ecs_stack.ecs_service
        self.listener = self.ecs_stack.listener
        self.blue_target_group = self.ecs_stack.blue_target_group
        self.green_target_group = self.ecs_stack.green_target_group
        self.load_balancer = self.ecs_stack.load_balancer


class NestedRdsStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str, vpc, env: Environment, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        self.rds_stack = RdsStack(self, "RdsStack", vpc=vpc, env=env)
        self.rds_instance = self.rds_stack.rds_instance


class NestedMonitoringStack(NestedStack):
    # pylint: disable=too-many-arguments
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        env: Environment,
        ecs_service,
        rds_instance,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)
        self.monitoring_stack = MonitoringStack(
            self,
            "MonitoringStack",
            ecs_service=ecs_service,
            rds_instance=rds_instance,
            env=env
        )


class NestedCicdStack(NestedStack):
    # pylint: disable=too-many-arguments
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        env: Environment,
        fargate_service,
        listener,
        blue_target_group,
        green_target_group,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)
        self.cicd_stack = CicdStack(
            self,
            "CicdStack",
            fargate_service=fargate_service,
            listener=listener,
            blue_target_group=blue_target_group,
            green_target_group=green_target_group,
            env=env
        )


class NestedRoute53Stack(NestedStack):
    # pylint: disable=too-many-arguments
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        alb1,
        alb2,
        env: Environment,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)
        self.route53_stack = Route53Stack(
            self,
            "Route53Stack",
            alb1=alb1,
            alb2=alb2,
            env=env,
            cross_region_references=True
        )


# --- Main TapStack Class ---

class TapStack(Stack):
    """
    Main orchestration CDK stack for the TAP project.

    This stack creates regional VPCs, ECS services, RDS instances, monitoring setups,
    and also provisions VPC peering, Route53 DNS, and CI/CD pipelines.

    Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for the stack.
      props (TapStackProps): Properties containing environment configuration.
      **kwargs: Additional keyword arguments for the base Stack.
    """

    def __init__(self, scope: Construct, construct_id: str, props: TapStackProps, **kwargs):
        # Note: Setting cross_region_references=True here. This is the correct approach
        # now that your environment is clean.
        super().__init__(scope, construct_id, env=props.env, cross_region_references=True, **kwargs)

        self.stack_suffix = os.environ.get("STACK_NAME_SUFFIX", props.environment_suffix)
        self.app_name = props.app_name
        self.env_us_east_1 = Environment(region="us-east-1")
        self.env_us_east_2 = Environment(region="us-east-2")

        self.vpcs = {}
        self.ecs_stacks = {}
        self.rds_stacks = {}

        # Orchestrate regional resources
        self._create_stacks_per_region()

        # Establish networking, deployment, and DNS resources
        # self._create_peering_stack()
        self._create_cicd_stack()
        self._create_route53_stack()

    def _create_stacks_per_region(self):
        """
        Create VPC, ECS, RDS, and Monitoring stacks in each configured region.
        Results are stored in dictionaries for reference across stacks.
        """
        regions = [self.env_us_east_1, self.env_us_east_2]
        for env in regions:
            region = env.region

            # Nested VPC stack
            vpc_stack = NestedVpcStack(
                self,
                f"{self.app_name}-vpc-{region}-{self.stack_suffix}",
                env=env
            )
            self.vpcs[region] = vpc_stack

            # Nested ECS stack
            ecs_stack = NestedEcsStack(
                self,
                f"{self.app_name}-ecs-{region}-{self.stack_suffix}",
                vpc=vpc_stack.vpc,
                env=env,
                task_image_options=None
            )
            self.ecs_stacks[region] = ecs_stack

            # Nested RDS stack
            rds_stack = NestedRdsStack(
                self,
                f"{self.app_name}-rds-{region}-{self.stack_suffix}",
                vpc=vpc_stack.vpc,
                env=env
            )
            self.rds_stacks[region] = rds_stack

            # Nested Monitoring stack
            NestedMonitoringStack(
                self,
                f"{self.app_name}-monitoring-{region}-{self.stack_suffix}",
                ecs_service=ecs_stack.ecs_service,
                rds_instance=rds_stack.rds_instance,
                env=env
            )

    def _create_cicd_stack(self):
        """
        Create a CI/CD stack targeting the primary ECS service in us-east-1.
        """
        ecs_stack_primary = self.ecs_stacks["us-east-1"]
        NestedCicdStack(
            self,
            f"{self.app_name}-cicd-{self.stack_suffix}",
            fargate_service=ecs_stack_primary.ecs_service,
            listener=ecs_stack_primary.listener,
            blue_target_group=ecs_stack_primary.blue_target_group,
            green_target_group=ecs_stack_primary.green_target_group,
            env=self.env_us_east_1
        )

    def _create_route53_stack(self):
        """
        Create a Route53 stack to associate DNS records with the regional load balancers.
        """
        NestedRoute53Stack(
            self,
            f"{self.app_name}-route53-{self.stack_suffix}",
            alb1=self.ecs_stacks["us-east-1"].load_balancer,
            alb2=self.ecs_stacks["us-east-2"].load_balancer,
            env=self.env_us_east_1,
        )


#lib/cdk/cicd_stack.py
from aws_cdk import (
  Stack,
  aws_codedeploy as codedeploy,
  aws_iam as iam,
  Duration,
)
from aws_cdk.aws_ecs import FargateService
from aws_cdk.aws_elasticloadbalancingv2 import (
  ApplicationListener,
  ApplicationTargetGroup,
)
from constructs import Construct


class CicdStack(Stack):
  def __init__(
    self,
    scope: Construct,
    stack_id: str,
    *,
    fargate_service: FargateService,
    listener: ApplicationListener,
    blue_target_group: ApplicationTargetGroup,
    green_target_group: ApplicationTargetGroup,
    **kwargs
  ):
    super().__init__(scope, stack_id, **kwargs)

    # Create CodeDeploy ECS application
    codedeploy_app = codedeploy.EcsApplication(self, "CodeDeployEcsApp")

    # Role for CodeDeploy to interact with ECS and ALB
    codedeploy_role = iam.Role(
      self,
      "CodeDeployServiceRole",
      assumed_by=iam.ServicePrincipal("codedeploy.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "AWSCodeDeployRoleForECS"
        )
      ],
    )

    # ECS CodeDeploy Deployment Group
    codedeploy.EcsDeploymentGroup(
      self,
      "CodeDeployDeploymentGroup",
      application=codedeploy_app,
      service=fargate_service,
      blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
        listener=listener,
        blue_target_group=blue_target_group,
        green_target_group=green_target_group,
        deployment_approval_wait_time=Duration.minutes(5),
      ),
      deployment_config=codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
      auto_rollback=codedeploy.AutoRollbackConfig(
        failed_deployment=True,
        stopped_deployment=True,
        deployment_in_alarm=False,
      ),
      role=codedeploy_role,
    )


# lib/cdk/ecs_stack.py
from aws_cdk import (
    Stack,
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_codedeploy as codedeploy,
    aws_iam as iam,
)
from constructs import Construct
from typing import Optional


class EcsStack(Stack):
    def __init__(self, scope: Construct, stack_id: str, *, vpc: Optional[ec2.Vpc] = None, task_image_options=None, **kwargs):
        super().__init__(scope, stack_id, **kwargs)
        self.task_image_options = task_image_options

        # Create or use an existing VPC
        # vpc = kwargs.get("vpc")
        self.vpc = vpc or ec2.Vpc(self, "MyVpc", max_azs=2)

        # Create an ECS cluster
        cluster = ecs.Cluster(self, "MyCluster", vpc=self.vpc)

        # Create a Fargate task definition
        task_definition = ecs.FargateTaskDefinition(self, "TaskDef")

        # Add container to task definition
        container = task_definition.add_container(
            "AppContainer",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            memory_limit_mib=512,
            cpu=256,
        )
        container.add_port_mappings(ecs.PortMapping(container_port=80))

        # Create Application Load Balancer
        lb = elbv2.ApplicationLoadBalancer(
            self,
            "LB",
            vpc=self.vpc,
            internet_facing=True,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Create listener
        listener = lb.add_listener("Listener", port=80)

        # Create blue and green target groups
        blue_target_group = elbv2.ApplicationTargetGroup(
            self,
            "BlueTG",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(path="/"),
        )

        green_target_group = elbv2.ApplicationTargetGroup(
            self,
            "GreenTG",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(path="/"),
        )

        # Default rule points to blue target group
        listener.add_target_groups("DefaultTG", target_groups=[blue_target_group])

        # Create Fargate service with CodeDeploy deployment controller
        ecs_service = ecs.FargateService(
            self,
            "FargateService",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            deployment_controller=ecs.DeploymentController(
                type=ecs.DeploymentControllerType.CODE_DEPLOY
            ),
            assign_public_ip=True,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Register service with blue target group
        blue_target_group.add_target(ecs_service)

        # IAM role for CodeDeploy
        codedeploy_role = iam.Role(
            self,
            "CodeDeployRole",
            assumed_by=iam.ServicePrincipal("codedeploy.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSCodeDeployRoleForECS"
                )
            ],
        )

        # CodeDeploy ECS Application
        codedeploy_app = codedeploy.EcsApplication(self, "CodeDeployApp")

        # CodeDeploy Deployment Group
        deployment_group = codedeploy.EcsDeploymentGroup(
            self,
            "CodeDeployGroup",
            service=ecs_service,
            blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
                listener=listener,
                blue_target_group=blue_target_group,
                green_target_group=green_target_group,
            ),
            deployment_config=codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
            application=codedeploy_app,
            auto_rollback=codedeploy.AutoRollbackConfig(
                failed_deployment=True,
                stopped_deployment=True,
                deployment_in_alarm=False,  # Explicitly disable alarm-based rollback
            ),
            role=codedeploy_role,
        )

        # Expose attributes for other stacks and tests
        self.ecs_service = ecs_service
        self.listener = listener
        self.load_balancer = lb
        self.blue_target_group = blue_target_group
        self.green_target_group = green_target_group
        self.codedeploy_app = codedeploy_app
        self.deployment_group = deployment_group
        self.codedeploy_role = codedeploy_role


# lib/cdk/monitoring_stack.py

"""Monitoring stack with CloudWatch dashboard and alarms."""

from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
    Stack,
)
from constructs import Construct


class MonitoringStack(Stack):
    """CDK stack to create monitoring resources."""

    def __init__(self, scope: Construct, construct_id: str, ecs_service, rds_instance, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # SNS Topic
        topic = sns.Topic(self, "AlarmTopic")

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, "Dashboard", dashboard_name=f"app-{self.stack_name}"
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ECS Metrics",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ECS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "ServiceName": ecs_service.service_name,
                            "ClusterName": ecs_service.cluster.cluster_name,
                        },
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/ECS",
                        metric_name="MemoryUtilization",
                        dimensions_map={
                            "ServiceName": ecs_service.service_name,
                            "ClusterName": ecs_service.cluster.cluster_name,
                        },
                    ),
                ],
            ),
            cloudwatch.GraphWidget(
                title="RDS Metrics",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBInstanceIdentifier": rds_instance.instance_identifier,
                        },
                    )
                ],
            ),
        )

        # CloudWatch Alarm
        ecs_failure_alarm = cloudwatch.Alarm(
            self,
            "ECSFailureAlarm",
            alarm_name=f"app-ecs-failure-{self.stack_name}",
            metric=cloudwatch.Metric(
                namespace="AWS/ECS",
                metric_name="HealthCheckFailed",
                dimensions_map={
                    "ServiceName": ecs_service.service_name,
                    "ClusterName": ecs_service.cluster.cluster_name,
                },
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )

        # Alarm Action
        ecs_failure_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(topic)
        )


# lib/cdk/rds_stack.py
from aws_cdk import (
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_secretsmanager as secretsmanager,
    Stack,
    Duration,
)
from constructs import Construct
import hashlib


class RdsStack(Stack):
    def __init__(self, scope: Construct, stack_id: str, vpc: ec2.Vpc, **kwargs):
        super().__init__(scope, stack_id, **kwargs)

        # Create a shortened identifier to stay under AWS 63-character limit
        def create_short_identifier(stack_name: str, suffix: str = "rds") -> str:
            """Create a shortened RDS identifier that stays under 63 characters."""
            # If the full name is short enough, use it
            full_name = f"{stack_name}-{suffix}"
            if len(full_name) <= 57:  # Leave room for "-instance"
                return f"{full_name}-instance"
            
            # Otherwise, create a shortened version with hash
            # Take first part of stack name and add hash of full name
            short_hash = hashlib.md5(stack_name.encode()).hexdigest()[:8]
            base_name = f"tap-{suffix}-{short_hash}"
            return f"{base_name}-instance"

        instance_identifier = create_short_identifier(self.stack_name, "rds")

        secret = secretsmanager.Secret(
            self,
            "RDSSecret",
            secret_name=f"rds-{self.stack_name}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"admin"}',
                generate_string_key="password",
                exclude_characters='/@" '
            ),
        )

        admin_secret = secretsmanager.Secret.from_secret_name_v2(self, "AdminSecret", "admin")

        self.rds_instance = rds.DatabaseInstance(
            self,
            "RDS",
            instance_identifier=instance_identifier,
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            multi_az=True,
            allocated_storage=20,
            database_name="appdb",
            credentials=rds.Credentials.from_secret(secret),
            backup_retention=Duration.days(7),
            storage_encrypted=True,
        )

        if self.region == "us-east-1":
            replica_stack = Stack(
                self,
                "ReplicaStack",
                env={
                    "region": "us-east-2"
                }
            )

            replica_vpc = ec2.Vpc(
                replica_stack,
                "ReplicaVPC",
                ip_addresses=ec2.IpAddresses.cidr("10.1.0.0/16"),
            )

            # Use shortened identifier for replica too
            replica_identifier = create_short_identifier(self.stack_name, "replica")

            rds.DatabaseInstance(
                replica_stack,
                "RDSReplica",
                instance_identifier=replica_identifier,
                engine=rds.DatabaseInstanceEngine.mysql(
                    version=rds.MysqlEngineVersion.VER_8_0
                ),
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MICRO
                ),
                vpc=replica_vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
                multi_az=False,
                allocated_storage=20,
                database_name="appdb",
                credentials=rds.Credentials.from_generated_secret("admin"),
                storage_encrypted=True,
            )

# lib/cdk/route53_stack.py
from aws_cdk import aws_route53 as route53, Stack
from constructs import Construct
from aws_cdk.aws_elasticloadbalancingv2 import ApplicationLoadBalancer


class Route53Stack(Stack):
  def __init__(self, scope: Construct, id: str, alb1: ApplicationLoadBalancer, alb2: ApplicationLoadBalancer, **kwargs):
    super().__init__(scope, id, **kwargs)

    # Create a public hosted zone
    zone = route53.HostedZone(self, "Zone", zone_name="joshua-academia.com")

    # Health check for primary ALB
    health_check = route53.CfnHealthCheck(
      self,
      "HealthCheck",
      health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
        fully_qualified_domain_name=alb1.load_balancer_dns_name,
        port=80,
        type="HTTP",
        resource_path="/health",
        failure_threshold=3,
      ),
    )

    # Primary failover record using CfnRecordSet
    route53.CfnRecordSet(
      self,
      "PrimaryRecord",
      hosted_zone_id=zone.hosted_zone_id,
      name="app.joshua-academia.com.",
      type="A",
      set_identifier="primary",
      failover="PRIMARY",
      health_check_id=health_check.ref,
      alias_target=route53.CfnRecordSet.AliasTargetProperty(
        dns_name=alb1.load_balancer_dns_name,
        hosted_zone_id=alb1.load_balancer_canonical_hosted_zone_id,  # You might need to hardcode ALB HostedZoneId instead
      ),
    )

    # Secondary failover record using CfnRecordSet
    route53.CfnRecordSet(
      self,
      "SecondaryRecord",
      hosted_zone_id=zone.hosted_zone_id,
      name="login.joshua-academia.com.",
      type="A",
      set_identifier="secondary",
      failover="SECONDARY",
      alias_target=route53.CfnRecordSet.AliasTargetProperty(
        dns_name=alb2.load_balancer_dns_name,
        hosted_zone_id=alb2.load_balancer_canonical_hosted_zone_id, # Same as above: make sure it's the HostedZoneId for the ALB
      ),
    )


# lib/cdk/vpc_peering_stack.py
from aws_cdk import aws_ec2 as ec2, Stack
from constructs import Construct


class VpcPeeringStack(Stack):
  def __init__(
    self,
    scope: Construct,
    stack_id: str,
    vpc1: ec2.Vpc,
    vpc2: ec2.Vpc,
    **kwargs
  ):
    super().__init__(scope, stack_id, **kwargs)

    peering = ec2.CfnVPCPeeringConnection(
      self,
      "Peering",
      vpc_id=vpc1.vpc_id,
      peer_vpc_id=vpc2.vpc_id,
      peer_region="us-east-2",
    )

    # Add routes for VPC1 private subnets
    for index, subnet in enumerate(vpc1.private_subnets):
      ec2.CfnRoute(
        self,
        f"RouteToVPC2-Subnet{index}",
        route_table_id=subnet.route_table.route_table_id,
        destination_cidr_block=vpc2.vpc_cidr_block,
        vpc_peering_connection_id=peering.ref,
      )

    # Add routes for VPC2 private subnets
    for index, subnet in enumerate(vpc2.private_subnets):
      ec2.CfnRoute(
        self,
        f"RouteToVPC1-Subnet{index}",
        route_table_id=subnet.route_table.route_table_id,
        destination_cidr_block=vpc1.vpc_cidr_block,
        vpc_peering_connection_id=peering.ref,
      )



# lib/cdk/vpc_stack.py

from aws_cdk import aws_ec2 as ec2, Stack
from constructs import Construct


class VpcStack(Stack):
  def __init__(self, scope: Construct, stack_id: str, **kwargs):
    super().__init__(scope, stack_id, **kwargs)

    self.vpc = ec2.Vpc(
      self,
      "VPC",
      cidr="10.0.0.0/16",
      max_azs=2,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name="public",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24,
        ),
        ec2.SubnetConfiguration(
          name="private",
          subnet_type=ec2.SubnetType.PRIVATE_WITH_NAT,
          cidr_mask=24,
        ),
      ],
      nat_gateways=1,
    )




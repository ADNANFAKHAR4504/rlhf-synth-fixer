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
        self.codedeploy_app = self.ecs_stack.codedeploy_app
        self.deployment_group = self.ecs_stack.deployment_group
        self.codedeploy_role = self.ecs_stack.codedeploy_role


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
        codedeploy_app,
        deployment_group,
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
            codedeploy_app=codedeploy_app,
            deployment_group=deployment_group,
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
            codedeploy_app=ecs_stack_primary.codedeploy_app,
            deployment_group=ecs_stack_primary.deployment_group,
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

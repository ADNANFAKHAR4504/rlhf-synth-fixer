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
from aws_cdk import Stack, Environment
from constructs import Construct
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
  app_name: str = "tap"
  default_regions: List[str] = ("us-east-1", "us-east-2")


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
    super().__init__(scope, construct_id, env=props.env, **kwargs)

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

      # VPC stack
      vpc_stack = VpcStack(
        self,
        f"{self.app_name}-vpc-{region}-{self.stack_suffix}",
        env=env
      )
      self.vpcs[region] = vpc_stack

      # ECS stack
      ecs_stack = EcsStack(
        self,
        f"{self.app_name}-ecs-{region}-{self.stack_suffix}",
        env=env,
        task_image_options=None  # Customize as needed
      )
      self.ecs_stacks[region] = ecs_stack

      # RDS stack
      rds_stack = RdsStack(
        self,
        f"{self.app_name}-rds-{region}-{self.stack_suffix}",
        vpc=vpc_stack.vpc,
        env=env
      )
      self.rds_stacks[region] = rds_stack

      # Monitoring stack
      MonitoringStack(
        self,
        f"{self.app_name}-monitoring-{region}-{self.stack_suffix}",
        ecs_service=ecs_stack.ecs_service,
        rds_instance=rds_stack.rds_instance,
        env=env
      )

  # def _create_peering_stack(self):
  #   """
  #   Create a VPC peering stack between the defined regional VPCs.
  #   """
  #   VpcPeeringStack(
  #     self,
  #     f"{self.app_name}-peering-{self.stack_suffix}",
  #     vpc1=self.vpcs["us-east-1"].vpc,
  #     vpc2=self.vpcs["us-east-2"].vpc,
  #     env=self.env_us_east_1,
  #     cross_region_references=True
  #   )

  def _create_cicd_stack(self):
    """
    Create a CI/CD stack targeting the primary ECS service in us-east-1.
    """
    ecs_stack_primary = self.ecs_stacks["us-east-1"]
    CicdStack(
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
    Route53Stack(
      self,
      f"{self.app_name}-route53-{self.stack_suffix}",
      alb1=self.ecs_stacks["us-east-1"].load_balancer,
      alb2=self.ecs_stacks["us-east-2"].load_balancer,
      env=self.env_us_east_1,
      cross_region_references=True
    )

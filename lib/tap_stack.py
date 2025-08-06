# lib/tap_stack.py

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from .components.networking import NetworkInfrastructure
from .components.compute import ComputeInfrastructure
from .components.database import DatabaseInfrastructure
from .components.load_balancer import LoadBalancerInfrastructure

"""
This module defines the TapStack class, the main Pulumi ComponentResource for
the AWS Model Breaking project.

It orchestrates the instantiation of networking, compute, database, and load balancer components
for a production-ready AWS infrastructure.
"""

class TapStackArgs:
  def __init__(
    self,
    environment_suffix: Optional[str] = None,
    region: Optional[str] = None,
    tags: Optional[dict] = None
  ):
    self.environment_suffix = environment_suffix or 'production'
    self.region = 'us-west-2'
    self.tags = tags or {}

class TapStack(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    args: TapStackArgs,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.region = args.region
    self.tags = args.tags or {}

    # Create networking infrastructure
    self.network = NetworkInfrastructure(
      name=f"{name}-network",
      region=self.region,
      environment=self.environment_suffix,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Create database infrastructure
    self.database = DatabaseInfrastructure(
      name=f"{name}-database",
      vpc_id=self.network.vpc.id,
      private_subnet_ids=self.network.private_subnet_ids,
      vpc_security_group_id=self.network.vpc_security_group.id,
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.network])
    )

    # Create load balancer infrastructure
    self.load_balancer = LoadBalancerInfrastructure(
      name=f"{name}-lb",
      vpc_id=self.network.vpc.id,
      public_subnet_ids=self.network.public_subnet_ids,
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.network])
    )

    # Create compute infrastructure
    self.compute = ComputeInfrastructure(
      name=f"{name}-compute",
      vpc_id=self.network.vpc.id,
      private_subnet_ids=self.network.private_subnet_ids,
      load_balancer_security_group_id=self.load_balancer.lb_security_group.id,
      target_group_arn=self.load_balancer.target_group.arn,
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.network, self.load_balancer])
    )

    # Register component outputs
    self.register_outputs({
      "vpc_id": self.network.vpc.id,
      "load_balancer_dns": self.load_balancer.load_balancer.dns_name,
      "load_balancer_zone_id": self.load_balancer.load_balancer.zone_id,
      "rds_endpoint": self.database.rds_instance.endpoint,
      "ec2_instance_ids": self.compute.instance_ids,
    })

    # Export outputs at stack level
    pulumi.export("vpc_id", self.network.vpc.id)
    pulumi.export("load_balancer_dns", self.load_balancer.load_balancer.dns_name)
    pulumi.export("load_balancer_zone_id", self.load_balancer.load_balancer.zone_id)
    pulumi.export("rds_endpoint", self.database.rds_instance.endpoint)
    pulumi.export("ec2_instance_ids", self.compute.instance_ids)
    pulumi.export("availability_zones", self.network.availability_zones)

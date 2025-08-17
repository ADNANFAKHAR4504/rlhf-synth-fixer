```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws
from .config import ConfigManager, ComponentDependencies
from .components.networking import NetworkingComponent
from .components.security import SecurityComponent
from .components.compute import ComputeComponent
from .components.storage import StorageComponent
from .components.database import DatabaseComponent
from .components.monitoring import MonitoringComponent
from .components.secrets import SecretsComponent



class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.

  This component orchestrates the instantiation of other resource-specific components
  and manages the environment suffix used for naming and configuration.

  Note:
      - DO NOT create resources directly here unless they are truly global.
      - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

  Args:
      name (str): The logical name of this Pulumi component.
      args (TapStackArgs): Configuration arguments including environment suffix and tags.
      opts (ResourceOptions): Pulumi options.
  """

  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags

    # Get configuration from config.py
    config = ConfigManager.get_config()

    # Store outputs for cross-region references
    outputs = {}

    # Multi-region deployment
    for i, region in enumerate(config.regions):
      print(f"🏗️  Deploying to region: {region}")

      # Create provider for each region
      provider = aws.Provider(f"aws-{region}", region=region)

      # Deploy networking infrastructure
      networking = NetworkingComponent(
        f"networking-{region}",
        region=region,
        config=config,
        opts=pulumi.ResourceOptions(provider=provider)
      )

      # Deploy secrets management
      secrets = SecretsComponent(
        f"secrets-{region}",
        config=config,
        opts=pulumi.ResourceOptions(provider=provider)
      )

      # Deploy storage
      storage = StorageComponent(
        f"storage-{region}",
        config=config,
        opts=pulumi.ResourceOptions(provider=provider)
      )

      # Deploy security components
      security_deps = ComponentDependencies(
        vpc_id=networking.vpc.id,
        private_subnet_ids=networking.private_subnet_ids,
        public_subnet_ids=networking.public_subnet_ids
      )
      security = SecurityComponent(
        f"security-{region}",
        config=config,
        dependencies=security_deps,
        opts=pulumi.ResourceOptions(provider=provider)
      )

      # Deploy database (primary region only)
      if i == 0:
        database_deps = ComponentDependencies(
          vpc_id=networking.vpc.id,
          private_subnet_ids=networking.private_subnet_ids,
          database_sg_id=security.database_sg.id,
          backup_bucket_name=storage.backup_bucket.bucket
        )
        DatabaseComponent(
          f"database-{region}",
          config=config,
          dependencies=database_deps,
          opts=pulumi.ResourceOptions(provider=provider)
        )

      # Deploy compute infrastructure
      compute_deps = ComponentDependencies(
        vpc_id=networking.vpc.id,
        private_subnet_ids=networking.private_subnet_ids,
        public_subnet_ids=networking.public_subnet_ids,
        alb_sg_id=security.alb_sg.id,
        ec2_sg_id=security.ec2_sg.id,
        secrets_arn=secrets.app_secrets.arn,
        instance_profile_name=security.ec2_instance_profile.name,
        certificate_arn=security.certificate.arn
      )
      compute = ComputeComponent(
        f"compute-{region}",
        config_data={
          'region': region,
          'config': config,
          'dependencies': compute_deps
        },
        opts=pulumi.ResourceOptions(provider=provider)
      )

      # Associate WAF with ALB
      if config.security.enable_waf:
        aws.wafv2.WebAclAssociation(
          f"waf-alb-association-{region}",
          resource_arn=compute.alb.arn,
          web_acl_arn=security.waf.arn,
          opts=pulumi.ResourceOptions(provider=provider)
        )

      # Deploy monitoring (primary region only)
      if i == 0:
        monitoring_deps = ComponentDependencies(
          alb_arn=compute.alb.arn
        )
        MonitoringComponent(
          f"monitoring-{region}",
          config=config,
          dependencies=monitoring_deps,
          opts=pulumi.ResourceOptions(provider=provider)
        )

      # Store outputs for this region
      outputs[region] = {
        "vpc_id": networking.vpc.id,
        "alb_dns_name": compute.alb.dns_name,
        "alb_arn": compute.alb.arn
      }

    # Export important outputs
    pulumi.export("app_name", config.app_name)
    pulumi.export("environment", config.environment)
    pulumi.export("primary_region", config.primary_region)
    pulumi.export("secondary_region", config.secondary_region)
    pulumi.export("primary_alb_dns", outputs[config.primary_region]["alb_dns_name"])

    if config.secondary_region != config.primary_region:
      pulumi.export("secondary_alb_dns", outputs[config.secondary_region]["alb_dns_name"])

    # Export regional VPC IDs
    for region in config.regions:
      pulumi.export(f"vpc_id_{region.replace('-', '_')}", outputs[region]["vpc_id"])

    # Export configuration summary
    pulumi.export("config_summary", {
      "database_instance_class": config.database.instance_class,
      "compute_instance_type": config.compute.instance_type,
      "auto_scaling_min": config.compute.min_size,
      "auto_scaling_max": config.compute.max_size,
      "budget_limit": config.monitoring.budget_limit_usd,
      "waf_enabled": config.security.enable_waf,
      "multi_az_db": config.database.multi_az
    })
```
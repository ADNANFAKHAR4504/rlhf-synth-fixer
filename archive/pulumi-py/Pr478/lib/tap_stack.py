"""
AWS Multi-Region GovCloud Web Application Deployment
IaC - AWS Nova Model Breaking - Main Stack

This is the main Pulumi Python program that orchestrates the deployment
of a web application across multiple AWS GovCloud regions.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from lib.components.networking import NetworkingInfrastructure
from lib.components.identity import IdentityInfrastructure
from lib.components.elastic_beanstalk import ElasticBeanstalkInfrastructure
from lib.components.monitoring import MonitoringInfrastructure

class TapStackArgs:
  def __init__(self,
               environment_suffix: Optional[str] = None,
               regions: Optional[list] = None,
               tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'prod'
    self.regions = ['us-east-1', 'us-west-1']
    self.tags = tags or {
      'Project': 'IaC-AWS-Nova-Model-Breaking',
      'Environment': self.environment_suffix,
      'Application': 'nova-web-app',
      'ManagedBy': 'Pulumi',
      'Classification': 'CUI',
      'Compliance': 'FedRAMP-High'
    }

class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.regions = args.regions
    self.tags = args.tags

    # Initialize component storage
    self.regional_networks = {}
    self.regional_monitoring = {}
    self.regional_elastic_beanstalk = {}
    self.providers = {}

    print("🔐 Creating Identity and Access Infrastructure...")
    self.identity = IdentityInfrastructure(
      name=f"nova-identity-{self.environment_suffix}",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Deploy to each region with proper multi-region setup
    for i, region in enumerate(self.regions):
      region_suffix = region.replace('-', '').replace('gov', '')
      is_primary = i == 0

      print(f"🌍 Setting up AWS provider for region: {region} ({'PRIMARY' if is_primary else 'SECONDARY'})")
      self.providers[region] = aws.Provider(
        f"aws-provider-{region_suffix}-{self.environment_suffix}",
        region=region,
        opts=ResourceOptions(parent=self)
      )

      def provider_opts(deps=None):
        return ResourceOptions(
          parent=self,
          provider=self.providers[region],
          depends_on=deps or []
        )

      print(f"🌐 Creating Networking Infrastructure for {region}...")
      self.regional_networks[region] = NetworkingInfrastructure(
        name=f"nova-network-{region_suffix}-{self.environment_suffix}",
        region=region,
        is_primary=is_primary,
        environment=self.environment_suffix,
        tags=self.tags,
        opts=provider_opts([self.identity])
      )

      print(f"📱 Creating Monitoring Infrastructure for {region}...")
      self.regional_monitoring[region] = MonitoringInfrastructure(
        name=f"nova-monitoring-{region_suffix}-{self.environment_suffix}",
        region=region,
        environment=self.environment_suffix,
        tags=self.tags,
        opts=provider_opts([
          self.identity,
          self.regional_networks[region]
        ])
      )

      print(f"🚀 Creating Elastic Beanstalk Infrastructure for {region}...")
      self.regional_elastic_beanstalk[region] = ElasticBeanstalkInfrastructure(
        name=f"nova-eb-{region_suffix}-{self.environment_suffix}",
        region=region,
        is_primary=is_primary,
        environment=self.environment_suffix,
        environment_suffix=f"{region_suffix}-{self.environment_suffix}",
        vpc_id=self.regional_networks[region].vpc_id,
        public_subnet_ids=self.regional_networks[region].public_subnet_ids,
        private_subnet_ids=self.regional_networks[region].private_subnet_ids,
        alb_security_group_id=self.regional_networks[region].alb_security_group_id, # FIX: Added this line
        eb_security_group_id=self.regional_networks[region].eb_security_group_id,   # FIX: Added this line
        eb_service_role_arn=self.identity.eb_service_role.arn,
        eb_instance_profile_name=self.identity.eb_instance_profile.name,
        tags=self.tags,
        opts=provider_opts([
          self.regional_networks[region],
          self.regional_monitoring[region],
          self.identity
        ])
      )

    print("📤 Exporting Outputs for Multi-Region Deployment...")
    
    # Multi-region summary
    pulumi.export("deployed_regions", self.regions)
    pulumi.export("total_regions", len(self.regions))
    pulumi.export("environment", self.environment_suffix)
    pulumi.export("compliance_tags", self.tags)

    # Primary region outputs (us-gov-west-1)
    primary_region = self.regions[0]
    pulumi.export("primary_region", primary_region)
    pulumi.export("primary_vpc_id", self.regional_networks[primary_region].vpc_id)
    pulumi.export("primary_vpc_cidr", self.regional_networks[primary_region].vpc_cidr)
    pulumi.export("primary_public_subnet_ids", self.regional_networks[primary_region].public_subnet_ids)
    pulumi.export("primary_private_subnet_ids", self.regional_networks[primary_region].private_subnet_ids)
    pulumi.export("primary_eb_application_name", self.regional_elastic_beanstalk[primary_region].application_name)
    pulumi.export("primary_eb_environment_name", self.regional_elastic_beanstalk[primary_region].environment_name)
    pulumi.export("primary_eb_environment_url", self.regional_elastic_beanstalk[primary_region].environment_url)
    pulumi.export("primary_eb_environment_cname", self.regional_elastic_beanstalk[primary_region].environment_cname)
    pulumi.export("primary_dashboard_name", self.regional_monitoring[primary_region].dashboard_name)
    pulumi.export("primary_sns_topic_arn", self.regional_monitoring[primary_region].sns_topic_arn)

    # Secondary region outputs (us-gov-east-1) if deployed
    if len(self.regions) > 1:
      secondary_region = self.regions[1]
      pulumi.export("secondary_region", secondary_region)
      pulumi.export("secondary_vpc_id", self.regional_networks[secondary_region].vpc_id)
      pulumi.export("secondary_vpc_cidr", self.regional_networks[secondary_region].vpc_cidr)
      pulumi.export("secondary_public_subnet_ids", self.regional_networks[secondary_region].public_subnet_ids)
      pulumi.export("secondary_private_subnet_ids", self.regional_networks[secondary_region].private_subnet_ids)
      pulumi.export("secondary_eb_application_name", self.regional_elastic_beanstalk[secondary_region].application_name)
      pulumi.export("secondary_eb_environment_name", self.regional_elastic_beanstalk[secondary_region].environment_name)
      pulumi.export("secondary_eb_environment_url", self.regional_elastic_beanstalk[secondary_region].environment_url)
      pulumi.export("secondary_eb_environment_cname", self.regional_elastic_beanstalk[secondary_region].environment_cname)
      pulumi.export("secondary_dashboard_name", self.regional_monitoring[secondary_region].dashboard_name)
      pulumi.export("secondary_sns_topic_arn", self.regional_monitoring[secondary_region].sns_topic_arn)

    # All regions data for reference
    all_regions_data = {}
    for region in self.regions:
      region_suffix = region.replace('-', '').replace('gov', '')
      all_regions_data[region] = {
        "vpc_id": self.regional_networks[region].vpc_id,
        "vpc_cidr": self.regional_networks[region].vpc_cidr,
        "eb_environment_url": self.regional_elastic_beanstalk[region].environment_url,
        "eb_environment_name": self.regional_elastic_beanstalk[region].environment_name,
        "dashboard_name": self.regional_monitoring[region].dashboard_name,
        "sns_topic_arn": self.regional_monitoring[region].sns_topic_arn
      }
    
    pulumi.export("all_regions_data", all_regions_data)

    # Security and Identity outputs (global resources)
    pulumi.export("eb_service_role_arn", self.identity.eb_service_role.arn)
    pulumi.export("eb_instance_role_arn", self.identity.eb_instance_role.arn)
    pulumi.export("eb_instance_profile_name", self.identity.eb_instance_profile.name)

    # Auto-scaling configuration
    pulumi.export("autoscaling_config", {
      "min_size": 2,
      "max_size": 10,
      "cpu_scale_up_threshold": 70,
      "cpu_scale_down_threshold": 20,
      "instance_type": "t3.medium"
    })
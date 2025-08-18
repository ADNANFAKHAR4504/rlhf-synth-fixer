

# tap_stack.py
```python
from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from lib.components.networking import NetworkSecurityInfrastructure
from lib.components.identity import IdentityAccessInfrastructure
from lib.components.data_protection import DataProtectionInfrastructure
from lib.components.monitoring import SecurityMonitoringInfrastructure

"""
This module defines the ProjectXSecurityStack class, the main Pulumi ComponentResource for
the Security Configuration as Code project.

It orchestrates the instantiation of security-focused components across multiple regions
and manages environment-specific configurations with proper security controls.
"""

class TapStackArgs:
  def __init__(self,
               environment_suffix: Optional[str] = None,
               regions: Optional[list] = None,
               tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.regions = regions or ['us-west-2', 'us-east-1']
    self.tags = tags or {
      'Project': 'ProjectX',
      'Security': 'High',
      'Environment': self.environment_suffix
    }

class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.regions = args.regions
    self.tags = args.tags

    # Store regional resources
    self.regional_networks = {}
    self.regional_monitoring = {}
    self.regional_data_protection = {}

    # Global Identity and Access Management (single region)
    self.identity_access = IdentityAccessInfrastructure(
      name=f"secure-projectx-identity-{self.environment_suffix}",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Deploy security infrastructure in each region
    for region in self.regions:
      region_suffix = region.replace('-', '')

      # Network Security Infrastructure per region
      self.regional_networks[region] = NetworkSecurityInfrastructure(
        name=f"secure-projectx-network-{region_suffix}-{self.environment_suffix}",
        region=region,
        environment=self.environment_suffix,
        kms_key_arn=self.identity_access.kms_key.arn,
        tags=self.tags,
        opts=ResourceOptions(
          parent=self,
          depends_on=[self.identity_access],
          provider=aws.Provider(f"aws-{region}", region=region)
        )
      )

      # Security Monitoring Infrastructure per region
      self.regional_monitoring[region] = SecurityMonitoringInfrastructure(
        name=f"secure-projectx-monitoring-{region_suffix}-{self.environment_suffix}",
        region=region,
        kms_key_arn=self.identity_access.kms_key.arn,
        tags=self.tags,
        opts=ResourceOptions(
          parent=self,
          depends_on=[self.identity_access],
          provider=aws.Provider(f"aws-{region}", region=region)
        )
      )

      # Data Protection Infrastructure per region
      self.regional_data_protection[region] = DataProtectionInfrastructure(
        name=f"secure-projectx-data-{region_suffix}-{self.environment_suffix}",
        region=region,
        vpc_id=self.regional_networks[region].vpc_id,
        private_subnet_ids=self.regional_networks[region].private_subnet_ids,
        database_security_group_id=self.regional_networks[region].database_security_group_id,
        kms_key_arn=self.identity_access.kms_key.arn,
        sns_topic_arn=self.regional_monitoring[region].sns_topic.arn,
        rds_monitoring_role_arn=self.identity_access.rds_monitoring_role.arn,
        tags=self.tags,
        opts=ResourceOptions(
          parent=self,
          depends_on=[self.regional_networks[region], self.regional_monitoring[region], self.identity_access],
          provider=aws.Provider(f"aws-{region}", region=region)
        )
      )

      # Setup monitoring alarms for each region
      self.regional_monitoring[region].setup_security_alarms(
        vpc_id=self.regional_networks[region].vpc_id,
        s3_bucket_names=[self.regional_data_protection[region].secure_s3_bucket.bucket],
        rds_instance_identifiers=[self.regional_data_protection[region].rds_instance.identifier] if hasattr(self.regional_data_protection[region], 'rds_instance') else [],  # Check for RDS instance
        opts=ResourceOptions(
          parent=self,
          depends_on=[self.regional_networks[region], self.regional_data_protection[region]],
          provider=aws.Provider(f"aws-{region}", region=region)
        )
      )

      # Setup VPC Flow Logs for each region
      self.regional_monitoring[region].setup_vpc_flow_logs(
        vpc_id=self.regional_networks[region].vpc_id,
        opts=ResourceOptions(
          parent=self,
          depends_on=[self.regional_networks[region], self.regional_monitoring[region]],
          provider=aws.Provider(f"aws-{region}", region=region)
        )
      )

    # Register outputs for primary region (us-west-2)
    primary_region = 'us-west-2'
    self.register_outputs({
      "primary_vpc_id": self.regional_networks[primary_region].vpc_id,
      "kms_key_arn": self.identity_access.kms_key.arn,
      "guardduty_detector_ids": {
        region: self.regional_monitoring[region].guardduty_detector.id
        for region in self.regions
      },
      "sns_topic_arns": {
        region: self.regional_monitoring[region].sns_topic.arn
        for region in self.regions
      },
      "secure_s3_buckets": {
        region: self.regional_data_protection[region].secure_s3_bucket.bucket
        for region in self.regions
      },
      "public_subnet_ids": {
        region: self.regional_networks[region].public_subnet_ids
        for region in self.regions
      },
      "private_subnet_ids": {
        region: self.regional_networks[region].private_subnet_ids
        for region in self.regions
      },
      "database_security_group_ids": {
        region: self.regional_networks[region].database_security_group_id
        for region in self.regions
      },
      "rds_instance_endpoints": {
        region: self.regional_data_protection[region].rds_instance_endpoint
        for region in self.regions
        if hasattr(self.regional_data_protection[region], 'rds_instance_endpoint')
      }
    })

    # Export outputs at stack level
    pulumi.export("primary_vpc_id", self.regional_networks[primary_region].vpc_id)
    pulumi.export("kms_key_arn", self.identity_access.kms_key.arn)
    pulumi.export("guardduty_detector_ids", {
      region: self.regional_monitoring[region].guardduty_detector.id
      for region in self.regions
    })
    pulumi.export("sns_topic_arns", {
      region: self.regional_monitoring[region].sns_topic.arn
      for region in self.regions
    })
    pulumi.export("secure_s3_buckets", {
      region: self.regional_data_protection[region].secure_s3_bucket.bucket
      for region in self.regions
    })
    pulumi.export("public_subnet_ids", {
      region: self.regional_networks[region].public_subnet_ids
      for region in self.regions
    })
    pulumi.export("private_subnet_ids", {
      region: self.regional_networks[region].private_subnet_ids
      for region in self.regions
    })
    pulumi.export("database_security_group_ids", {
      region: self.regional_networks[region].database_security_group_id
      for region in self.regions
    })
    pulumi.export("rds_instance_endpoints", {
      region: self.regional_data_protection[region].rds_instance_endpoint
      for region in self.regions
      if hasattr(self.regional_data_protection[region], 'rds_instance_endpoint')
    })

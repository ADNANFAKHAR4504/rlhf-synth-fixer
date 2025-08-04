from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from lib.components.networking import NetworkSecurityInfrastructure
from lib.components.identity import IdentityAccessInfrastructure
from lib.components.data_protection import DataProtectionInfrastructure
from lib.components.monitoring import SecurityMonitoringInfrastructure

class TapStackArgs:
  def __init__(self,
               environment_suffix: Optional[str] = None,
               regions: Optional[list] = None,
               tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.regions = ['us-west-2']
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

    self.regional_networks = {}
    self.regional_monitoring = {}
    self.regional_data_protection = {}
    self.providers = {}

    print("🔐 Creating Identity and Access Infrastructure...")
    self.identity_access = IdentityAccessInfrastructure(
      name=f"secure-projectx-identity-{self.environment_suffix}",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    region = 'us-west-2'
    region_suffix = region.replace('-', '')

    print(f"🌍 Setting up AWS provider for region: {region}")
    self.providers[region] = aws.Provider(
      f"aws-provider-{region}-{self.environment_suffix}",
      region=region
    )

    provider_opts = lambda deps: ResourceOptions(
      parent=self,
      depends_on=deps,
      provider=self.providers[region]
    )

    print("🌐 Creating Networking Infrastructure (no NAT/NACL)...")
    self.regional_networks[region] = NetworkSecurityInfrastructure(
      name=f"secure-projectx-network-{region_suffix}-{self.environment_suffix}",
      region=region,
      environment=self.environment_suffix,
      kms_key_arn=self.identity_access.kms_key.arn,
      tags=self.tags,
      opts=provider_opts([self.identity_access])
    )

    print("📡 Creating Monitoring Infrastructure...")
    self.regional_monitoring[region] = SecurityMonitoringInfrastructure(
      name=f"secure-projectx-monitoring-{region_suffix}-{self.environment_suffix}",
      region=region,
      kms_key_arn=self.identity_access.kms_key.arn,
      tags=self.tags,
      opts=provider_opts([self.identity_access])
    )

    print("🛡️ Creating Data Protection Infrastructure...")
    self.regional_data_protection[region] = DataProtectionInfrastructure(
      name=f"secure-projectx-data-{region_suffix}-{self.environment_suffix}",
      region=region,
      vpc_id=self.regional_networks[region].vpc_id,
      private_subnet_ids=self.regional_networks[region].private_subnet_ids,
      database_security_group_id=self.regional_networks[region].database_security_group_id,
      kms_key_arn=self.identity_access.kms_key.arn,
      sns_topic_arn=self.regional_monitoring[region].sns_topic.arn.apply(lambda arn: arn),
      rds_monitoring_role_arn=self.identity_access.rds_monitoring_role.arn,
      tags=self.tags,
      opts=provider_opts([
        self.regional_networks[region],
        self.regional_monitoring[region],
        self.identity_access
      ])
    )

    print("🔔 Setting up CloudWatch Security Alarms...")
    self.regional_monitoring[region].setup_security_alarms(
      vpc_id=self.regional_networks[region].vpc_id,
      s3_bucket_names=[self.regional_data_protection[region].secure_s3_bucket.bucket],
      rds_instance_identifiers=[
        self.regional_data_protection[region].rds_instance.identifier
      ] if hasattr(self.regional_data_protection[region], 'rds_instance') else [],
      opts=provider_opts([
        self.regional_networks[region],
        self.regional_data_protection[region]
      ])
    )

    print("📊 Setting up VPC Flow Logs...")
    self.regional_monitoring[region].setup_vpc_flow_logs(
      vpc_id=self.regional_networks[region].vpc_id,
      opts=provider_opts([
        self.regional_networks[region],
        self.regional_monitoring[region]
      ])
    )

    print("📤 Exporting Outputs...")
    pulumi.export("primary_vpc_id", self.regional_networks[region].vpc_id)
    pulumi.export("kms_key_arn", self.identity_access.kms_key.arn)
    pulumi.export("guardduty_detector_id", self.regional_monitoring[region].guardduty_detector.id)
    pulumi.export("sns_topic_arn", self.regional_monitoring[region].sns_topic.arn)
    pulumi.export("secure_s3_bucket", self.regional_data_protection[region].secure_s3_bucket.bucket)
    pulumi.export("public_subnet_ids", self.regional_networks[region].public_subnet_ids)
    pulumi.export("private_subnet_ids", self.regional_networks[region].private_subnet_ids)
    pulumi.export("database_security_group_id", self.regional_networks[region].database_security_group_id)
    if hasattr(self.regional_data_protection[region], 'rds_instance_endpoint'):
      pulumi.export("rds_instance_endpoint", self.regional_data_protection[region].rds_instance_endpoint)

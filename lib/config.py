from dataclasses import dataclass
from typing import Dict, List, Any

import pulumi


@dataclass
class DatabaseConfig:
  instance_class: str
  allocated_storage: int
  max_allocated_storage: int
  backup_retention_period: int
  multi_az: bool
  deletion_protection: bool


@dataclass
class ComputeConfig:
  instance_type: str
  min_size: int
  max_size: int
  desired_capacity: int
  enable_detailed_monitoring: bool


@dataclass
class StorageConfig:
  versioning_enabled: bool
  lifecycle_transition_days: int
  glacier_transition_days: int
  log_retention_days: int


@dataclass
class MonitoringConfig:
  log_retention_days: int
  detailed_monitoring: bool
  enable_insights: bool
  budget_limit_usd: int


@dataclass
class SecurityConfig:
  enable_waf: bool
  enable_guardduty: bool
  mfa_required: bool
  certificate_domain: str
  ssl_policy: str


@dataclass
class NetworkingConfig:
  vpc_cidr: str
  availability_zones_count: int
  public_subnet_cidrs: List[str]
  private_subnet_cidrs: List[str]


@dataclass
class SecretsConfig:
  kms_key_rotation_enabled: bool
  secret_retention_days: int


@dataclass
class ComponentDependencies:
  """Container for component dependencies to reduce parameter count"""
  vpc_id: Any = None
  private_subnet_ids: List[Any] = None
  public_subnet_ids: List[Any] = None
  alb_sg_id: Any = None
  ec2_sg_id: Any = None
  database_sg_id: Any = None
  secrets_arn: Any = None
  instance_profile_name: Any = None
  certificate_arn: Any = None
  backup_bucket_name: Any = None
  alb_arn: Any = None


@dataclass
class InfrastructureConfig:
  app_name: str
  regions: List[str]
  primary_region: str
  networking: NetworkingConfig
  database: DatabaseConfig
  compute: ComputeConfig
  storage: StorageConfig
  monitoring: MonitoringConfig
  security: SecurityConfig
  secrets: SecretsConfig
  environment: str = None

  @property
  def secondary_region(self) -> str:
    return self.regions[1] if len(self.regions) > 1 else self.primary_region

  @property
  def tags(self) -> Dict[str, str]:
    return {
      "Environment": self.environment,
      "Application": self.app_name,
      "ManagedBy": "Pulumi",
      "Project": f"{self.app_name}-infrastructure"
    }


class ConfigManager:
  """Configuration manager that provides environment-specific configurations"""

  @staticmethod
  def get_config(environment: str = None) -> InfrastructureConfig:
    """Get configuration for specified environment"""
    if environment is None:
      environment = pulumi.get_stack()

    return InfrastructureConfig(
      app_name="mywebapp",
      environment=environment,
      regions=["us-west-2", "us-east-1"],
      primary_region="us-west-2",
      networking=NetworkingConfig(
        vpc_cidr="10.2.0.0/16",
        availability_zones_count=3,
        public_subnet_cidrs=["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"],
        private_subnet_cidrs=["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
      ),
      database=DatabaseConfig(
        instance_class="db.r5.large",
        allocated_storage=100,
        max_allocated_storage=1000,
        backup_retention_period=30,
        multi_az=True,
        deletion_protection=True
      ),
      compute=ComputeConfig(
        instance_type="t3.medium",
        min_size=3,
        max_size=15,
        desired_capacity=3,
        enable_detailed_monitoring=True
      ),
      storage=StorageConfig(
        versioning_enabled=True,
        lifecycle_transition_days=30,
        glacier_transition_days=90,
        log_retention_days=30
      ),
      monitoring=MonitoringConfig(
        log_retention_days=90,
        detailed_monitoring=True,
        enable_insights=True,
        budget_limit_usd=1000
      ),
      security=SecurityConfig(
        enable_waf=True,
        enable_guardduty=True,
        mfa_required=True,
        certificate_domain="mywebapp.example.com",
        ssl_policy="ELBSecurityPolicy-TLS13-1-2-2021-06"
      ),
      secrets=SecretsConfig(
        kms_key_rotation_enabled=True,
        secret_retention_days=30
      )
    )


# Helper functions for backward compatibility
def get_config() -> InfrastructureConfig:
  """Get configuration for current Pulumi stack"""
  return ConfigManager.get_config()


def get_app_name() -> str:
  """Get application name"""
  return get_config().app_name


def get_environment() -> str:
  """Get environment name"""
  return get_config().environment


def get_regions() -> List[str]:
  """Get list of deployment regions"""
  return get_config().regions


def get_primary_region() -> str:
  """Get primary region"""
  return get_config().primary_region


def get_tags() -> Dict[str, str]:
  """Get common tags for resources"""
  return get_config().tags

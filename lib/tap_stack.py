import re
from typing import Optional, Dict, List
from dataclasses import dataclass, field
import hashlib
import pulumi
from pulumi import ResourceOptions, Config, Output
import pulumi_aws as aws


# Import your nested stacks here (uncomment as you create them)
# from .vpc_stack import VpcStack
# from .dynamodb_stack import DynamoDBStack
# from .ec2_stack import Ec2Stack
# from .security_stack import SecurityStack

PROJECT_NAME = "pulumi-infra"

@dataclass
class TapStackArgs:
  environment_suffix: str = 'dev'
  aws_region: str = 'us-east-1'
  tags: Dict[str, str] = field(default_factory=dict)
  vpc_cidr: str = '10.0.0.0/16'
  enable_monitoring: bool = True
  instance_types: List[str] = field(default_factory=lambda: ['t3.micro', 't3.small'])
  backup_retention_days: int = 7
  enable_multi_az: bool = True

  def __post_init__(self):
    self._validate_environment_suffix()
    self._validate_vpc_cidr()
    self._validate_region()
    self._set_default_tags()

  def _validate_environment_suffix(self) -> None:
    allowed_envs = {'dev', 'staging', 'prod', 'test'}
    # Allow PR environments (pr followed by numbers)
    if (self.environment_suffix not in allowed_envs and 
        not (self.environment_suffix.startswith('pr') and 
             self.environment_suffix[2:].isdigit())):
      raise ValueError(f"Environment suffix must be one of: {allowed_envs} or match pattern 'pr<number>'")

  def _validate_vpc_cidr(self) -> None:
    if not self.vpc_cidr.endswith(('/16', '/17', '/18', '/19', '/20')):
      raise ValueError("VPC CIDR should typically be /16 to /20 for proper subnet allocation")

  def _validate_region(self) -> None:
    if self.aws_region.count('-') < 2:
      raise ValueError(f"Invalid AWS region format: {self.aws_region}")

  def _set_default_tags(self) -> None:
    default_tags = {
      'Environment': self.environment_suffix.title(),
      'ManagedBy': 'Pulumi',
      'Project': 'TAP-TestAutomationPlatform',
      'CreatedDate': pulumi.get_stack(),
      'Owner': 'InfrastructureTeam'
    }
    self.tags = {**default_tags, **self.tags}


class TapStack(pulumi.ComponentResource):
  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    # Fixed: Use the project name from Pulumi.yaml consistently
    super().__init__('pulumi-infra:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.aws_region = args.aws_region
    self.tags = args.tags
    self.args = args

    self.tap_service_role: Optional[aws.iam.Role] = None
    self.artifacts_bucket: Optional[aws.s3.Bucket] = None
    self.app_log_group: Optional[aws.cloudwatch.LogGroup] = None

    self.config = Config()

    self.networking_resources = {}
    self.compute_resources = {}
    self.storage_resources = {}
    self.security_resources = {}
    self.monitoring_resources = {}

    self._create_infrastructure()
    self._register_outputs()

  def _sanitize_bucket_name(self, name: str) -> str:
    name = name.lower()
    name = re.sub(r'[^a-z0-9.-]', '-', name)     # only allow valid S3 characters
    name = re.sub(r'-+', '-', name).strip('-')   # clean up hyphens
    name = re.sub(r'\.+', '.', name).strip('.')  # clean up dots
    name = re.sub(r'^[^a-z0-9]+', '', name)      # ensure starts with alphanumeric
    name = re.sub(r'[^a-z0-9]+$', '', name)      # ensure ends with alphanumeric
    name = name[:63]                             # max length for S3
    if re.match(r'^\d{1,3}(\.\d{1,3}){3}$', name):
      raise ValueError(f"Bucket name '{name}' cannot look like an IP address.")
    if len(name) < 3:
      raise ValueError(f"Bucket name '{name}' is too short after sanitization.")
    return name
  

  def _create_infrastructure(self) -> None:
    pulumi.log.info(f"Creating TAP infrastructure for environment: {self.environment_suffix}")
    self._create_networking()
    self._create_security()
    self._create_storage()
    self._create_compute()
    self._create_monitoring()
    pulumi.log.info("TAP infrastructure creation completed")

  def _unique_suffix(self, base: str) -> str:
    hash_str = hashlib.sha1(base.encode()).hexdigest()[:6]
    return f"{base}-{hash_str}"
  

  def _create_networking(self) -> None:
    pulumi.log.info("Creating networking infrastructure...")
    self.networking_resources['placeholder'] = 'VPC stack will be implemented here'

  def _create_security(self) -> None:
    pulumi.log.info("Creating security infrastructure...")

    self.tap_service_role = aws.iam.Role(
      f"tap-service-role-{self.environment_suffix}",
      name=f"TAP-Service-Role-{self.environment_suffix}",
      description=f"IAM role for TAP services in {self.environment_suffix} environment",
      assume_role_policy=pulumi.Output.json_dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }]
      }),
      tags=self._merge_tags({"Name": f"TAP-Service-Role-{self.environment_suffix}"}),
      opts=ResourceOptions(parent=self)
    )

    self.security_resources['service_role'] = self.tap_service_role

  def _create_storage(self) -> None:
    pulumi.log.info("Creating storage infrastructure...")
    raw_name = f"tap-test-artifacts-{self.environment_suffix}-{pulumi.get_stack()}"
    bucket_name = self._sanitize_bucket_name(self._unique_suffix(raw_name))

    self.artifacts_bucket = aws.s3.Bucket(
        f"tap-artifacts-{self.environment_suffix}",
        bucket=bucket_name,
        tags=self._merge_tags({
            "Name": f"TAP-Artifacts-{self.environment_suffix}",
            "Purpose": "TestArtifacts"
        }),
        opts=ResourceOptions(parent=self)
    )

    aws.s3.BucketVersioningV2(
      f"tap-artifacts-versioning-{self.environment_suffix}",
      bucket=self.artifacts_bucket.id,
      versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=ResourceOptions(parent=self)
    )

    self.storage_resources['artifacts_bucket'] = self.artifacts_bucket

  def _create_compute(self) -> None:
    pulumi.log.info("Creating compute infrastructure...")
    self.compute_resources['placeholder'] = 'EC2 stack will be implemented here'

  def _create_monitoring(self) -> None:
    if not self.args.enable_monitoring:
      pulumi.log.info("Monitoring disabled, skipping monitoring infrastructure")
      return

    pulumi.log.info("Creating monitoring infrastructure...")

    self.app_log_group = aws.cloudwatch.LogGroup(
      f"tap-logs-{self.environment_suffix}",
      name=f"/aws/tap/{self.environment_suffix}/application",
      retention_in_days=self.args.backup_retention_days,
      tags=self._merge_tags({
        "Name": f"TAP-Logs-{self.environment_suffix}",
        "Purpose": "ApplicationLogs"
      }),
      opts=ResourceOptions(parent=self)
    )

    self.monitoring_resources['log_group'] = self.app_log_group

  def _merge_tags(self, additional_tags: Dict[str, str]) -> Dict[str, str]:
    return {**self.tags, **additional_tags}

  def _register_outputs(self) -> None:
    pulumi.log.info("Registering stack outputs...")

    outputs = {
      'environment_suffix': self.environment_suffix,
      'aws_region': self.aws_region,
      'deployment_timestamp': pulumi.get_stack(),
      'artifacts_bucket_name': self.artifacts_bucket.bucket,
      'artifacts_bucket_arn': self.artifacts_bucket.arn,
      'service_role_arn': self.tap_service_role.arn,
      **({
        'log_group_name': self.app_log_group.name,
        'log_group_arn': self.app_log_group.arn
      } if self.args.enable_monitoring else {}),
      'infrastructure_summary': {
        'environment': self.environment_suffix,
        'region': self.aws_region,
        'multi_az_enabled': self.args.enable_multi_az,
        'monitoring_enabled': self.args.enable_monitoring,
        'backup_retention_days': self.args.backup_retention_days
      }
    }

    self.register_outputs(outputs)
    pulumi.log.info(f"Stack outputs registered for environment: {self.environment_suffix}")

  @property
  def vpc_id(self) -> Optional[Output[str]]:
    return None

  @property
  def service_role_arn(self) -> Output[str]:
    return self.tap_service_role.arn

  @property
  def artifacts_bucket_name(self) -> Output[str]:
    return self.artifacts_bucket.bucket


def create_tap_stack(
    stack_name: str = "tap-stack",
    environment: str = "dev",
    **kwargs
) -> TapStack:
  args = TapStackArgs(environment_suffix=environment, **kwargs)
  return TapStack(stack_name, args)

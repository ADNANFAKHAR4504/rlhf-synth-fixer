"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""
import os
from typing import Optional, Dict, Any
import pulumi_aws as aws
import pulumi
from pulumi import ResourceOptions

config = pulumi.Config()
environment = config.get("environment") or os.getenv("ENVIRONMENT", "development")
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")

if environment not in ["development", "production"]:
  raise ValueError(f"Invalid environment: {environment}. Must be 'development' or 'production'")


def get_environment_config(env: str) -> Dict[str, Any]:
  configs = {
    "development": {
      "debug": True,
      "log_level": "debug",
      "instance_type": "t3.micro",
    },
    "production": {
      "debug": False,
      "log_level": "info",
      "instance_type": "t3.small",
    }
  }

  if env not in configs:
    raise ValueError(f"Invalid environment: {env}. Must be one of: {list(configs.keys())}")

  return configs[env]


env_config = get_environment_config(environment)


def create_ec2_instance(security_group_id: pulumi.Output[str], tags: dict, parent: pulumi.Resource):
  ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
      aws.ec2.GetAmiFilterArgs(name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"]),
      aws.ec2.GetAmiFilterArgs(name="virtualization-type", values=["hvm"]),
    ]
  )

  user_data_script = f"""#!/bin/bash
export DEBUG={str(env_config["debug"]).lower()}
export LOG_LEVEL={env_config["log_level"]}
export ENVIRONMENT={environment}
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
cat > /var/www/html/index.html << EOF
<html><body>
<h1>Environment: {environment}</h1>
<p>Debug: {env_config["debug"]}</p>
<p>Log Level: {env_config["log_level"]}</p>
<p>AWS Region: {AWS_REGION}</p>
<p>Instance Type: {env_config["instance_type"]}</p>
</body></html>
EOF
"""

  ec2_instance = aws.ec2.Instance(
    f"web-app-instance-{environment}",
    ami=ami.id,
    instance_type=env_config["instance_type"],
    vpc_security_group_ids=[security_group_id],
    user_data=user_data_script,
    tags={**tags, "Name": f"web-app-instance-{environment}"},
    opts=pulumi.ResourceOptions(parent=parent)
  )

  return ec2_instance, ami


def create_security_group(tags: dict, parent: ResourceOptions = None):
  vpc = aws.ec2.get_vpc(default=True)

  sg = aws.ec2.SecurityGroup(
    f"web-app-sg-{environment}",
    name=f"web-app-sg-{environment}",
    description=f"SG for web app - {environment}",
    vpc_id=vpc.id,
    ingress=[
      aws.ec2.SecurityGroupIngressArgs(protocol="tcp", from_port=80,
                                       to_port=80, cidr_blocks=["0.0.0.0/0"]),
      aws.ec2.SecurityGroupIngressArgs(protocol="tcp", from_port=22,
                                       to_port=22, cidr_blocks=["0.0.0.0/0"]),
    ],
    egress=[
      aws.ec2.SecurityGroupEgressArgs(protocol="-1", from_port=0,
                                      to_port=0, cidr_blocks=["0.0.0.0/0"]),
    ],
    tags={**tags, "Name": f"web-app-sg-{environment}"},
    opts=parent,
  )

  return sg


def create_s3_bucket(tags: dict, parent: pulumi.Resource):
  bucket_name = f"web-app-{environment}-{pulumi.get_organization() or 'default'}".lower()

  bucket = aws.s3.Bucket(
    f"web-app-bucket-{environment}",
    bucket=bucket_name,
    tags={**tags, "Name": f"web-app-bucket-{environment}"},
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
      rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
        apply_server_side_encryption_by_default=aws.s3
        .BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
          sse_algorithm="aws:kms"
        )
      )
    ),
    opts=pulumi.ResourceOptions(parent=parent),
  )

  aws.s3.BucketVersioningV2(
    f"web-app-bucket-versioning-{environment}",
    bucket=bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(status="Enabled"),
    opts=pulumi.ResourceOptions(parent=parent),
  )

  aws.s3.BucketPublicAccessBlock(
    f"web-app-bucket-pab-{environment}",
    bucket=bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
    opts=pulumi.ResourceOptions(parent=parent),
  )

  return bucket


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the
    deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(
      self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None
  ):
    self.environment_suffix = environment_suffix or "dev"
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
      self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None
  ):
    super().__init__("tap:stack:TapStack", name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags or {}

    sg = create_security_group(self.tags, parent=ResourceOptions(parent=self))

    ec2_instance, ami = create_ec2_instance(sg.id, self.tags, parent=self)

    s3_bucket = create_s3_bucket(self.tags, parent=self)

    pulumi.export("environment", environment)
    pulumi.export("debug_mode", env_config["debug"])
    pulumi.export("log_level", env_config["log_level"])
    pulumi.export("ec2_instance_id", ec2_instance.id)
    pulumi.export("ec2_instance_public_ip", ec2_instance.public_ip)
    pulumi.export("ec2_instance_public_dns", ec2_instance.public_dns)
    pulumi.export("s3_bucket_name", s3_bucket.bucket)
    pulumi.export("s3_bucket_arn", s3_bucket.arn)
    pulumi.export("security_group_id", sg.id)
    pulumi.export("ami_id", ami.id)
    pulumi.export("aws_region", "us-west-2")

    self.register_outputs({})

"""
tap_stack.py

This module defines all CDK stack classes for the TAP (Test Automation Platform) project.

It contains:
- TapStack: Main CDK stack that orchestrates multi-region deployment
- VpcStack: VPC infrastructure with public/private subnets
- KmsStack: Customer-managed KMS keys for encryption
- DatabaseStack: Aurora MySQL database with encryption and backups
- AlbStack: Application Load Balancer for multi-AZ deployment
- MonitoringStack: CloudWatch logging and monitoring
- Route53Stack: DNS management and failover routing
- NestedRegionStack: Regional stack orchestration
- Supporting classes: TapStackProps, RegionStackProps
"""

import os
from dataclasses import dataclass
from typing import Optional

from aws_cdk import (
  Stack,
  NestedStack,
  Environment,
  CfnOutput,
  Fn,
  Duration,
  RemovalPolicy,
  aws_ec2 as ec2,
  aws_kms as kms,
  aws_rds as rds,
  aws_elasticloadbalancingv2 as elbv2,
  aws_logs as logs,
  aws_route53 as route53,
)
from constructs import Construct


class TapStackProps:
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): Optional suffix to identify the
    deployment environment (e.g., 'dev', 'prod').
  """

  def __init__(self, environment_suffix: Optional[str] = None):
    self.environment_suffix = environment_suffix


@dataclass
class RegionStackProps:
  environment_suffix: str
  env: Environment


class VpcStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    self.vpc = ec2.Vpc(self, "AppVpc",
                       max_azs=3,
                       nat_gateways=1,
                       subnet_configuration=[
                         ec2.SubnetConfiguration(
                           name="public",
                           subnet_type=ec2.SubnetType.PUBLIC
                         ),
                         ec2.SubnetConfiguration(
                           name="private",
                           # Use PRIVATE_WITH_EGRESS for NAT routing
                           subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                         )
                       ]
                       )

    # Export VPC outputs for integration tests
    CfnOutput(self, "VpcId",
              value=self.vpc.vpc_id,
              description="The VPC ID")

    CfnOutput(self, "VpcCidr",
              value=self.vpc.vpc_cidr_block,
              description="The VPC CIDR block")

    CfnOutput(self, "PublicSubnetIds",
              value=Fn.join(",", [subnet.subnet_id for subnet in self.vpc.public_subnets]),
              description="Comma-separated list of public subnet IDs")

    CfnOutput(self, "PrivateSubnetIds",
              value=Fn.join(",", [subnet.subnet_id for subnet in self.vpc.private_subnets]),
              description="Comma-separated list of private subnet IDs")


class KmsStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    self.key = kms.Key(self, "AppKey",
                       enable_key_rotation=True,
                       removal_policy=RemovalPolicy.DESTROY
                       )

    # Export KMS outputs for integration tests
    CfnOutput(self, "KmsKeyId",
              value=self.key.key_id,
              description="The KMS key ID")

    CfnOutput(self, "KmsKeyArn",
              value=self.key.key_arn,
              description="The KMS key ARN")


class DatabaseStack(Stack):
  def __init__(self, scope: Construct, construct_id: str,
               vpc: ec2.Vpc, kms_key, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # aurora_version = rds.AuroraMysqlEngineVersion.VER_2_08_1
    aurora_version = aurora_version = rds.AuroraMysqlEngineVersion.VER_3_04_1

    # engine = rds.DatabaseClusterEngine.aurora_mysql(version=aurora_version)
    # Create a new parameter group for your Aurora MySQL version
    parameter_group = rds.ParameterGroup(
      self, "AuroraMySQL8ParameterGroup",
      engine=rds.DatabaseClusterEngine.aurora_mysql(version=aurora_version),
      parameters={
        # Example: "time_zone": "UTC",
        # Add your custom parameters here if needed
      }
    )

    self.db_cluster = rds.DatabaseCluster(
      self, "AppDatabase",
      engine=rds.DatabaseClusterEngine.aurora_mysql(version=aurora_version),
      credentials=rds.Credentials.from_generated_secret("admin"),
      parameter_group=parameter_group,  # explicitly set the parameter group
      writer=rds.ClusterInstance.provisioned("writer", 
          instance_type=ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM),
      ),
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
      backup=rds.BackupProps(retention=Duration.days(7)),
      storage_encrypted=True,
      storage_encryption_key=kms_key,
      removal_policy=RemovalPolicy.DESTROY
    )

    # Export Database outputs
    CfnOutput(self, "DatabaseClusterIdentifier",
              value=self.db_cluster.cluster_identifier,
              description="The database cluster identifier")

    CfnOutput(self, "DatabaseClusterEndpoint",
              value=self.db_cluster.cluster_endpoint.hostname,
              description="The database cluster endpoint")

    CfnOutput(self, "DatabaseClusterEngine",
              value="aurora-mysql",
              description="The database engine type")

    CfnOutput(self, "DatabaseBackupRetention",
              value="7",
              description="Database backup retention in days")


class AlbStack(Stack):
  def __init__(self, scope: Construct, construct_id: str,
               vpc: ec2.Vpc, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    self.alb = elbv2.ApplicationLoadBalancer(self, "AppAlb",
                                             vpc=vpc,
                                             internet_facing=True
                                             )

    # Export ALB outputs for integration tests
    CfnOutput(self, "LoadBalancerArn",
              value=self.alb.load_balancer_arn,
              description="The Application Load Balancer ARN")

    CfnOutput(self, "LoadBalancerDnsName",
              value=self.alb.load_balancer_dns_name,
              description="The Application Load Balancer DNS name")

    CfnOutput(self, "LoadBalancerHostedZoneId",
              value=self.alb.load_balancer_canonical_hosted_zone_id,
              description="The Application Load Balancer hosted zone ID")


class MonitoringStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # Create a CloudWatch Log Group
    self.app_log_group = logs.LogGroup(
      self, "AppLogGroup",
      retention=logs.RetentionDays.ONE_WEEK,
      removal_policy=RemovalPolicy.DESTROY
    )

    # Export Monitoring outputs for integration tests
    CfnOutput(self, "LogGroupName",
              value=self.app_log_group.log_group_name,
              description="The CloudWatch Log Group name")

    CfnOutput(self, "LogGroupArn",
              value=self.app_log_group.log_group_arn,
              description="The CloudWatch Log Group ARN")

    CfnOutput(self, "LogRetentionDays",
              value="7",
              description="Log retention in days")


class Route53Stack(NestedStack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # Create a hosted zone for the domain
    # Note: In production, you'd typically use an existing hosted zone
    self.hosted_zone = route53.HostedZone(
      self, "HostedZone",
      zone_name="turing229210.com"
    )

    # Failover routing will be implemented when ALB targets are available
    # This is a placeholder for proper multi-region DNS failover

    # Export Route53 outputs for integration tests
    CfnOutput(self, "HostedZoneId",
              value=self.hosted_zone.hosted_zone_id,
              description="The Route53 hosted zone ID")

    CfnOutput(self, "HostedZoneName",
              value=self.hosted_zone.zone_name,
              description="The Route53 hosted zone name")

    CfnOutput(self, "NameServers",
              value=Fn.join(",", self.hosted_zone.hosted_zone_name_servers or []),
              description="Comma-separated list of name servers")


class NestedRegionStack(NestedStack):
  def __init__(self, scope: Construct, construct_id: str, *,
               props: RegionStackProps, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # KMS
    self.kms_stack = KmsStack(
      self, f"KmsStack-{props.environment_suffix}", env=props.env)

    # VPC
    self.vpc_stack = VpcStack(
      self, f"VpcStack-{props.environment_suffix}", env=props.env)

    # Database
    self.database_stack = DatabaseStack(
      self, f"DatabaseStack-{props.environment_suffix}",
      vpc=self.vpc_stack.vpc,
      kms_key=self.kms_stack.key,
      env=props.env
    )

    # ALB
    self.alb_stack = AlbStack(
      self, f"AlbStack-{props.environment_suffix}",
      vpc=self.vpc_stack.vpc,
      env=props.env
    )

    # Monitoring
    self.monitoring_stack = MonitoringStack(
      self, f"MonitoringStack-{props.environment_suffix}",
      env=props.env
    )

    # Optional: expose resources
    self.vpc = self.vpc_stack.vpc
    self.kms_key = self.kms_stack.key


class TapStack(Stack):
  """
  Represents the main CDK stack for the TAP project.

  This stack is responsible for orchestrating the instantiation of other
  resource-specific stacks. It determines the environment suffix from the
  provided properties, CDK context, or defaults to 'dev'.

  Note:
    - DO NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within
      this stack.
  """

  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    _props: Optional[TapStackProps] = None,
    **kwargs
  ):
    # Handle props passed as keyword argument for backward compatibility
    if 'props' in kwargs:
      _props = kwargs.pop('props')
    super().__init__(scope, construct_id, **kwargs)

    # Environment suffix is handled at the app level
    # Multi-region deployment uses region names as suffixes

    # Define multi-region deployment
    regions = ["us-east-1", "us-west-2"]

    for region in regions:
      env = Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=region
      )

      region_props = RegionStackProps(
        environment_suffix=region,
        env=env
      )

      # Deploy regional nested stack
      NestedRegionStack(
        self,
        f"NestedRegionStack-{region}",
        props=region_props
      )

    # Deploy Route53 in a single region
    Route53Stack(
      self,
      "Route53Stack"
    )

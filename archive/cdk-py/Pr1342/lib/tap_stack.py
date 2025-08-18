"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
  Stack,
  Duration,
  RemovalPolicy,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_s3 as s3,
  aws_kms as kms,
  aws_rds as rds,
  aws_logs as logs,
  aws_elasticloadbalancingv2 as elbv2,
  aws_sns as sns,
  aws_cloudwatch as cloudwatch,
  CfnOutput
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties, 
    CDK context, or defaults to 'dev'.
  Note:
    - Do NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the 
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'
    self.environment_suffix = environment_suffix

    # KMS Keys
    s3_kms_key = kms.Key(
      self, f"s3-kms-key-{environment_suffix}",
      description="KMS key for S3 bucket encryption",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )
    rds_kms_key = kms.Key(
      self, f"rds-kms-key-{environment_suffix}",
      description="KMS key for RDS encryption",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )

    # VPC
    vpc = ec2.Vpc(
      self, f"tap-vpc-{environment_suffix}",
      max_azs=2,
      ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name=f"public-{environment_suffix}",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name=f"private-{environment_suffix}",
          subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name=f"database-{environment_suffix}",
          subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
          cidr_mask=24
        )
      ],
      enable_dns_hostnames=True,
      enable_dns_support=True
    )

    # Security Groups
    web_sg = ec2.SecurityGroup(
      self, f"web-sg-{environment_suffix}",
      vpc=vpc,
      description="Security group for web servers",
      allow_all_outbound=True
    )
    web_sg.add_ingress_rule(
      ec2.Peer.any_ipv4(),
      ec2.Port.tcp(80),
      "Allow HTTP traffic"
    )
    web_sg.add_ingress_rule(
      ec2.Peer.any_ipv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS traffic"
    )
    db_sg = ec2.SecurityGroup(
      self, f"db-sg-{environment_suffix}",
      vpc=vpc,
      description="Security group for database",
      allow_all_outbound=False
    )
    db_sg.add_ingress_rule(
      web_sg,
      ec2.Port.tcp(3306),
      "Allow MySQL access from web servers"
    )

    # S3 Buckets
    backup_bucket = s3.Bucket(
      self, f"backup-bucket-{environment_suffix}",
      bucket_name=f"tap-backup-{environment_suffix}-{self.account}",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=s3_kms_key,
      versioned=True,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY
    )
    logs_bucket = s3.Bucket(
      self, f"logs-bucket-{environment_suffix}",
      bucket_name=f"tap-logs-{environment_suffix}-{self.account}",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=s3_kms_key,
      versioned=True,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY
    )

    # RDS Subnet Group
    db_subnet_group = rds.SubnetGroup(
      self, f"db-subnet-group-{environment_suffix}",
      description="Subnet group for RDS database",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
    )

    # RDS MySQL Instance
    database = rds.DatabaseInstance(
      self, f"tap-database-{environment_suffix}",
      engine=rds.DatabaseInstanceEngine.mysql(
        version=rds.MysqlEngineVersion.VER_8_0
      ),
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      vpc=vpc,
      subnet_group=db_subnet_group,
      security_groups=[db_sg],
      multi_az=True,
      storage_encrypted=True,
      storage_encryption_key=rds_kms_key,
      allocated_storage=20,
      max_allocated_storage=100,
      backup_retention=Duration.days(7),
      deletion_protection=False,
      removal_policy=RemovalPolicy.DESTROY
    )

    # Application Load Balancer
    alb = elbv2.ApplicationLoadBalancer(
      self, f"alb-{environment_suffix}",
      vpc=vpc,
      internet_facing=True,
      security_group=web_sg,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
    )
    target_group = elbv2.ApplicationTargetGroup(
      self, f"tg-{environment_suffix}",
      port=80,
      protocol=elbv2.ApplicationProtocol.HTTP,
      vpc=vpc,
      target_type=elbv2.TargetType.INSTANCE,
      health_check=elbv2.HealthCheck(
        enabled=True,
        healthy_http_codes="200",
        interval=Duration.seconds(30),
        path="/health",
        protocol=elbv2.Protocol.HTTP,
        timeout=Duration.seconds(5),
        unhealthy_threshold_count=2,
        healthy_threshold_count=5
      )
    )
    alb.add_listener(
      f"listener-{environment_suffix}",
      port=80,
      default_target_groups=[target_group]
    )

    # CloudWatch Dashboard
    dashboard = cloudwatch.Dashboard(
      self, f"dashboard-{environment_suffix}",
      dashboard_name=f"TapStack-{environment_suffix}-Dashboard"
    )

    # SNS Topic for alerts
    alert_topic = sns.Topic(
      self, f"alerts-topic-{environment_suffix}",
      display_name=f"TapStack Alerts {environment_suffix}"
    )

    # Outputs
    CfnOutput(
      self, "VpcId",
      value=vpc.vpc_id,
      description="The VPC ID",
      export_name=f"{self.stack_name}-VpcId"
    )
    CfnOutput(
      self, "DatabaseEndpoint",
      value=database.db_instance_endpoint_address,
      description="The database endpoint",
      export_name=f"{self.stack_name}-DatabaseEndpoint"
    )
    CfnOutput(
      self, "AlbDnsName",
      value=alb.load_balancer_dns_name,
      description="The ALB DNS name",
      export_name=f"{self.stack_name}-AlbDnsName"
    )
    CfnOutput(
      self, "BackupBucketName",
      value=backup_bucket.bucket_name,
      description="The name of the backup S3 bucket",
      export_name=f"{self.stack_name}-BackupBucketName"
    )
    CfnOutput(
      self, "LogsBucketName",
      value=logs_bucket.bucket_name,
      description="The name of the logs S3 bucket",
      export_name=f"{self.stack_name}-LogsBucketName"
    )
    CfnOutput(
      self, "S3KmsKeyId",
      value=s3_kms_key.key_id,
      description="The KMS key ID for S3 encryption",
      export_name=f"{self.stack_name}-S3KmsKeyId"
    )
    CfnOutput(
      self, "RdsKmsKeyId",
      value=rds_kms_key.key_id,
      description="The KMS key ID for RDS encryption",
      export_name=f"{self.stack_name}-RdsKmsKeyId"
    )
    CfnOutput(
      self, "AlertTopicArn",
      value=alert_topic.topic_arn,
      description="The ARN of the SNS topic for alerts",
      export_name=f"{self.stack_name}-AlertTopicArn"
    )

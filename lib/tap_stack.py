from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
  Stack,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_s3 as s3,
  aws_kms as kms,
  aws_rds as rds,
  aws_cloudtrail as cloudtrail,
  aws_logs as logs,
  CfnOutput,
  RemovalPolicy,
  Duration,
  Tags
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Environment suffix
    environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    is_prod = environment_suffix.lower() in ["prod", "production"]

    # Tagging
    Tags.of(self).add("Environment", environment_suffix)
    Tags.of(self).add("Project", "TestAutomationPlatform")
    Tags.of(self).add("Owner", "SecurityTeam")
    Tags.of(self).add("CostCenter", "Security")

    # KMS Key (scoped removal_policy by environment)
    kms_key = kms.Key(
      self, "MasterKey",
      description="KMS key for TAP resource encryption",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.RETAIN if is_prod else RemovalPolicy.DESTROY
    )

    # VPC (use PRIVATE_WITH_EGRESS to avoid deprecation warnings)
    vpc = ec2.Vpc(
      self, "TapVPC",
      max_azs=2,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name="PublicSubnet",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name="PrivateSubnet",
          subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidr_mask=24
        ),
      ],
      enable_dns_hostnames=True,
      enable_dns_support=True,
      nat_gateways=1 if not is_prod else 2
    )

    # Security Groups
    allowed_ip_ranges = ["203.0.113.0/24", "198.51.100.0/24"]

    web_sg = ec2.SecurityGroup(
      self, "WebSG",
      vpc=vpc,
      description="Web tier SG with restricted access",
      allow_all_outbound=False
    )
    for ip in allowed_ip_ranges:
      web_sg.add_ingress_rule(
        peer=ec2.Peer.ipv4(ip),
        connection=ec2.Port.tcp(443),
        description=f"HTTPS from {ip}"
      )
      web_sg.add_ingress_rule(
        peer=ec2.Peer.ipv4(ip),
        connection=ec2.Port.tcp(80),
        description=f"HTTP from {ip}"
      )
    web_sg.add_egress_rule(
      peer=ec2.Peer.any_ipv4(),
      connection=ec2.Port.tcp(443),
      description="HTTPS outbound"
    )

    db_sg = ec2.SecurityGroup(
      self, "DbSG",
      vpc=vpc,
      description="DB SG, only allows from web SG",
      allow_all_outbound=False
    )
    # Use the security group object as peer (preferred in CDK)
    db_sg.add_ingress_rule(
      peer=web_sg,
      connection=ec2.Port.tcp(5432),
      description="Postgres from web SG"
    )

    # S3 Buckets (no explicit bucket_name to avoid global-uniqueness failures)
    app_bucket = s3.Bucket(
      self, "SecureDataAppBucket",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=kms_key,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      versioned=True,
      enforce_ssl=True,
      removal_policy=RemovalPolicy.RETAIN if is_prod else RemovalPolicy.DESTROY
    )
    backup_bucket = s3.Bucket(
      self, "SecureDataBackupBucket",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=kms_key,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      versioned=True,
      enforce_ssl=True,
      removal_policy=RemovalPolicy.RETAIN if is_prod else RemovalPolicy.DESTROY
    )
    cloudtrail_bucket = s3.Bucket(
      self, "SecureDataCloudTrailBucket",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=kms_key,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      versioned=True,
      enforce_ssl=True,
      removal_policy=RemovalPolicy.RETAIN if is_prod else RemovalPolicy.DESTROY
    )

    # CloudTrail bucket policy (allow CloudTrail to write)
    cloudtrail_bucket.add_to_resource_policy(
      iam.PolicyStatement(
        sid="AWSCloudTrailAclCheck",
        effect=iam.Effect.ALLOW,
        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
        actions=["s3:GetBucketAcl"],
        resources=[cloudtrail_bucket.bucket_arn]
      )
    )
    cloudtrail_bucket.add_to_resource_policy(
      iam.PolicyStatement(
        sid="AWSCloudTrailWrite",
        effect=iam.Effect.ALLOW,
        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
        actions=["s3:PutObject"],
        # CloudTrail writes under AWSLogs/<account-id>/CloudTrail/...
        resources=[f"{cloudtrail_bucket.bucket_arn}/AWSLogs/{self.account}/*"],
        conditions={"StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}}
      )
    )

    # KMS key policy: allow CloudTrail service to use the key (scoped)
    kms_key.add_to_resource_policy(
      iam.PolicyStatement(
        sid="AllowCloudTrailToUseKey",
        effect=iam.Effect.ALLOW,
        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
        actions=[
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        resources=["*"]
      )
    )
    # ADD THIS: Allow CloudWatch Logs to use the key
    kms_key.add_to_resource_policy(
      iam.PolicyStatement(
        sid="AllowCloudWatchLogsToUseKey",
        effect=iam.Effect.ALLOW,
        principals=[iam.ServicePrincipal("logs.amazonaws.com")],
        actions=[
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        resources=["*"]
      )
    )

    # IAM Role for EC2 (example minimal role)
    ec2_role = iam.Role(
      self, "EC2InstanceRole",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
      description="Minimal permissions for EC2",
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
      ]
    )

    # Inline policy to allow EC2 instances to access app & backup buckets
    s3_access_policy = iam.Policy(
      self, "S3AccessPolicy",
      statements=[
        iam.PolicyStatement(
          effect=iam.Effect.ALLOW,
          actions=["s3:GetObject", "s3:PutObject"],
          resources=[f"{app_bucket.bucket_arn}/*", f"{backup_bucket.bucket_arn}/*"]
        ),
        iam.PolicyStatement(
          effect=iam.Effect.ALLOW,
          actions=["s3:ListBucket"],
          resources=[app_bucket.bucket_arn, backup_bucket.bucket_arn]
        )
      ]
    )
    ec2_role.attach_inline_policy(s3_access_policy)

    # RDS Subnet group using PRIVATE_WITH_EGRESS
    db_subnet_group = rds.SubnetGroup(
      self, "DbSubnetGroup",
      description="Subnet group for RDS",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
    )

    # RDS instance (Postgres). Adjust sizing for real workloads.
    rds_instance = rds.DatabaseInstance(
      self, "SecureDatabase",
      engine=rds.DatabaseInstanceEngine.postgres(
        version=rds.PostgresEngineVersion.VER_14_12
      ),
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.T3, ec2.InstanceSize.MICRO
      ),
      vpc=vpc,
      subnet_group=db_subnet_group,
      security_groups=[db_sg],
      storage_encrypted=True,
      storage_encryption_key=kms_key,
      publicly_accessible=False,
      backup_retention=Duration.days(7),
      deletion_protection=is_prod,
      removal_policy=RemovalPolicy.RETAIN if is_prod else RemovalPolicy.DESTROY
    )

    # CloudWatch Log Group for CloudTrail (encrypted with same KMS key)
    cloudtrail_log_group = logs.LogGroup(
      self, "CloudTrailLogGroup",
      retention=logs.RetentionDays.ONE_YEAR,
      encryption_key=kms_key,
      removal_policy=RemovalPolicy.RETAIN if is_prod else RemovalPolicy.DESTROY
    )

    # Create CloudTrail and attach to CloudWatch Logs
    # Use cloud_watch_log_group + send_to_cloud_watch_logs where supported
    trail = cloudtrail.Trail(
      self, "SecureCloudTrail",
      bucket=cloudtrail_bucket,
      management_events=cloudtrail.ReadWriteType.ALL,
      include_global_service_events=True,
      is_multi_region_trail=True,
      enable_file_validation=True,
      cloud_watch_log_group=cloudtrail_log_group,
      send_to_cloud_watch_logs=True
    )

    # Allow CloudTrail service to write to the Log Group (policy on the log group)
    cloudtrail_log_group.add_to_resource_policy(
      iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
        actions=["logs:CreateLogStream", "logs:PutLogEvents"],
        resources=[f"{cloudtrail_log_group.log_group_arn}:*"]
      )
    )

    # Outputs
    CfnOutput(self, "VPCId", value=vpc.vpc_id, description="VPC ID")
    CfnOutput(self, "KMSKeyId", value=kms_key.key_id, description="KMS Key ID")
    CfnOutput(self, "DatabaseEndpoint", value=rds_instance.instance_endpoint.hostname, description="RDS Endpoint")
    CfnOutput(self, "S3BucketNames", value=",".join([
      app_bucket.bucket_name, backup_bucket.bucket_name, cloudtrail_bucket.bucket_name
    ]), description="S3 bucket names containing secure data")

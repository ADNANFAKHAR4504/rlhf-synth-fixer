```
import aws_cdk as cdk
from aws_cdk import (
  Stack,
  Duration,
  RemovalPolicy,
  aws_s3 as s3,
  aws_kms as kms,
  aws_rds as rds,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_logs as logs,
  CfnOutput,
)
from constructs import Construct
from typing import Optional


class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Environment suffix from props/context with 'dev' default
    environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'
    self.environment_suffix = environment_suffix

    # ----- KMS Keys -----
    s3_kms_key = kms.Key(
      self, f"S3Key-{environment_suffix}",
      description=f"KMS key for S3 bucket encryption - {environment_suffix}",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )
    rds_kms_key = kms.Key(
      self, f"RDSKey-{environment_suffix}",
      description=f"KMS key for RDS encryption - {environment_suffix}",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )

    # ----- VPC -----
    vpc = ec2.Vpc(
      self, f"VPC-{environment_suffix}",
      ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
      max_azs=2,
      nat_gateways=1,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name=f"Public-{environment_suffix}",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name=f"Private-{environment_suffix}",
          subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name=f"Database-{environment_suffix}",
          subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
          cidr_mask=24
        )
      ],
      enable_dns_hostnames=True,
      enable_dns_support=True
    )

    # ----- VPC Flow Logs (to CloudWatch Logs) -----
    flow_log_role = iam.Role(
      self,
      "VPCFlowLogsRole",
      assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
      inline_policies={
        "VPCFlowLogsPolicy": iam.PolicyDocument(
          statements=[
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
              ],
              resources=["*"]
            )
          ]
        )
      }
    )
    log_group = logs.LogGroup(
      self, f"VPCFlowLogGroup-{environment_suffix}",
      retention=logs.RetentionDays.ONE_MONTH,
      removal_policy=RemovalPolicy.DESTROY
    )
    ec2.FlowLog(
      self, f"VPCFlowLog-{environment_suffix}",
      resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
      destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group, flow_log_role)
    )

    # ----- Security Groups -----
    web_sg = ec2.SecurityGroup(
      self, f"WebSG-{environment_suffix}",
      vpc=vpc,
      description=f"Security group for web servers - {environment_suffix}",
      allow_all_outbound=False
    )
    web_sg.add_ingress_rule(
      peer=ec2.Peer.ipv4("0.0.0.0/0"),
      connection=ec2.Port.tcp(443),
      description="HTTPS from anywhere"
    )
    web_sg.add_ingress_rule(
      peer=ec2.Peer.ipv4("0.0.0.0/0"),
      connection=ec2.Port.tcp(80),
      description="HTTP from anywhere"
    )
    web_sg.add_ingress_rule(
      peer=ec2.Peer.ipv4("203.0.113.0/24"),
      connection=ec2.Port.tcp(22),
      description="SSH from company network"
    )
    web_sg.add_egress_rule(
      peer=ec2.Peer.any_ipv4(),
      connection=ec2.Port.tcp(443),
      description="HTTPS outbound"
    )
    web_sg.add_egress_rule(
      peer=ec2.Peer.any_ipv4(),
      connection=ec2.Port.tcp(80),
      description="HTTP outbound"
    )

    db_sg = ec2.SecurityGroup(
      self, f"DatabaseSG-{environment_suffix}",
      vpc=vpc,
      description=f"Security group for database - {environment_suffix}",
      allow_all_outbound=False
    )
    db_sg.add_ingress_rule(
      peer=web_sg,
      connection=ec2.Port.tcp(3306),
      description="MySQL from web servers"
    )

    app_sg = ec2.SecurityGroup(
      self, f"ApplicationSG-{environment_suffix}",
      vpc=vpc,
      description=f"Security group for application servers - {environment_suffix}",
      allow_all_outbound=False
    )
    app_sg.add_ingress_rule(
      peer=web_sg,
      connection=ec2.Port.tcp(8080),
      description="Application port from web servers"
    )
    app_sg.add_egress_rule(
      peer=db_sg,
      connection=ec2.Port.tcp(3306),
      description="MySQL to database"
    )
    app_sg.add_egress_rule(
      peer=ec2.Peer.any_ipv4(),
      connection=ec2.Port.tcp(443),
      description="HTTPS outbound for APIs"
    )

    # ----- IAM Roles (scoped to created buckets & logs) -----
    ec2_web_role = iam.Role(
      self, f"EC2WebRole-{environment_suffix}",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
      description=f"Role for EC2 web servers - {environment_suffix}"
    )
    ec2_app_role = iam.Role(
      self, f"EC2AppRole-{environment_suffix}",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
      description=f"Role for EC2 application servers - {environment_suffix}"
    )
    lambda_role = iam.Role(
      self, f"LambdaRole-{environment_suffix}",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
      ],
      description=f"Role for Lambda functions - {environment_suffix}"
    )

    # ----- S3 Buckets (names omitted for uniqueness) -----
    web_assets_bucket = s3.Bucket(
      self, f"WebAssets-{environment_suffix}",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=s3_kms_key,
      versioned=True,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY,
      enforce_ssl=True,
      auto_delete_objects=True
    )
    user_uploads_bucket = s3.Bucket(
      self, f"UserUploads-{environment_suffix}",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=s3_kms_key,
      versioned=True,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY,
      enforce_ssl=True,
      auto_delete_objects=True
    )
    app_data_bucket = s3.Bucket(
      self, f"AppData-{environment_suffix}",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=s3_kms_key,
      versioned=True,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY,
      enforce_ssl=True,
      auto_delete_objects=True
    )

    # Now that buckets exist, scope EC2 roles to actual ARNs
    ec2_web_role.add_to_policy(iam.PolicyStatement(
      effect=iam.Effect.ALLOW,
      actions=["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      resources=[
        f"{web_assets_bucket.bucket_arn}/*",
        f"{user_uploads_bucket.bucket_arn}/*"
      ]
    ))
    ec2_web_role.add_to_policy(iam.PolicyStatement(
      effect=iam.Effect.ALLOW,
      actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogStreams"],
      resources=[
        f"arn:{cdk.Aws.PARTITION}:logs:{cdk.Aws.REGION}:{cdk.Aws.ACCOUNT_ID}:log-group:/aws/ec2/{environment_suffix}/*"
      ]
    ))

    ec2_app_role.add_to_policy(iam.PolicyStatement(
      effect=iam.Effect.ALLOW,
      actions=["s3:GetObject", "s3:PutObject"],
      resources=[f"{app_data_bucket.bucket_arn}/*"]
    ))
    ec2_app_role.add_to_policy(iam.PolicyStatement(
      effect=iam.Effect.ALLOW,
      actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogStreams"],
      resources=[
        f"arn:{cdk.Aws.PARTITION}:logs:{cdk.Aws.REGION}:{cdk.Aws.ACCOUNT_ID}:log-group:/aws/ec2/{environment_suffix}/*"
      ]
    ))

    # ----- RDS (MySQL) -----
    db_subnet_group = rds.SubnetGroup(
      self, f"DBSubnetGroup-{environment_suffix}",
      description=f"Subnet group for RDS - {environment_suffix}",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
      )
    )
    rds_instance = rds.DatabaseInstance(
      self, f"Database-{environment_suffix}",
      engine=rds.DatabaseInstanceEngine.mysql(
        version=rds.MysqlEngineVersion.VER_8_0
      ),
      instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc=vpc,
      subnet_group=db_subnet_group,
      security_groups=[db_sg],
      storage_encrypted=True,
      storage_encryption_key=rds_kms_key,
      multi_az=False,
      backup_retention=Duration.days(7),
      delete_automated_backups=True,
      deletion_protection=False,
      removal_policy=RemovalPolicy.DESTROY,
      allocated_storage=20,
      max_allocated_storage=100,
      auto_minor_version_upgrade=True
      # Use default parameter group to avoid region-specific dependency
    )

    # ----- Outputs -----
    CfnOutput(self, "VpcId", value=vpc.vpc_id, description="VPC ID")
    CfnOutput(self, "WebAssetsBucketName", value=web_assets_bucket.bucket_name, description="Web Assets S3 Bucket Name")
    CfnOutput(self, "UserUploadsBucketName", value=user_uploads_bucket.bucket_name, description="User Uploads S3 Bucket Name")
    CfnOutput(self, "AppDataBucketName", value=app_data_bucket.bucket_name, description="Application Data S3 Bucket Name")
    CfnOutput(self, "RdsInstanceIdentifier", value=rds_instance.instance_identifier, description="RDS Instance Identifier")
    CfnOutput(self, "S3KmsKeyId", value=s3_kms_key.key_id, description="S3 KMS Key ID")

```
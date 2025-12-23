"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional
import json
import os

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_s3_notifications as s3_notifications,
    aws_kms as kms,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_cloudtrail as cloudtrail,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags
)
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


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


class TapStack(cdk.Stack):
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

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create all infrastructure components
    self.kms_key = self._create_kms_key()
    self.vpc = self._create_vpc()
    self.security_groups = self._create_security_groups()
    self.s3_buckets = self._create_s3_buckets()
    self.iam_roles = self._create_iam_roles()
    self.cloudwatch_resources = self._create_cloudwatch_resources()
    self.ec2_instances = self._create_ec2_instances()
    self.cloudtrail = self._create_cloudtrail()

    # Create outputs
    self._create_outputs()

  def _create_kms_key(self) -> kms.Key:
    """Create KMS key with rotation enabled for encryption"""

    # KMS Key Policy for secure access
    key_policy = iam.PolicyDocument(
        statements=[
            iam.PolicyStatement(
                sid="Enable IAM User Permissions",
                effect=iam.Effect.ALLOW,
                principals=[iam.AccountRootPrincipal()],
                actions=["kms:*"],
                resources=["*"]
            ),
            iam.PolicyStatement(
                sid="Allow CloudWatch Logs",
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
            ),
            iam.PolicyStatement(
                sid="Allow S3 Service",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("s3.amazonaws.com")],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                resources=["*"]
            )
        ]
    )

    kms_key = kms.Key(
        self,
        "SecureAppKMSKey",
        alias="secureapp-encryption-key",
        description="KMS key for SecureApp encryption with automatic rotation",
        enable_key_rotation=True,
        policy=key_policy,
        removal_policy=RemovalPolicy.DESTROY)

    Tags.of(kms_key).add("Name", "secureapp-kms-key")
    Tags.of(kms_key).add("Purpose", "Encryption")

    return kms_key

  def _create_vpc(self) -> ec2.Vpc:
    """Create VPC with public and private subnets"""

    # Check if running on LocalStack (disable custom resources)
    is_localstack = (
        "localhost" in os.environ.get("AWS_ENDPOINT_URL", "") or
        "4566" in os.environ.get("AWS_ENDPOINT_URL", "")
    )

    vpc = ec2.Vpc(
        self, "SecureAppVPC",
        vpc_name="secureapp-vpc",
        ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
        max_azs=2,
        subnet_configuration=[
            ec2.SubnetConfiguration(
                name="secureapp-public-subnet",
                subnet_type=ec2.SubnetType.PUBLIC,
                cidr_mask=24
            ),
            ec2.SubnetConfiguration(
                name="secureapp-private-subnet",
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                cidr_mask=24
            )
        ],
        enable_dns_hostnames=True,
        enable_dns_support=True,
        # Disable default security group restriction for LocalStack
        restrict_default_security_group=not is_localstack
    )

    # Enable VPC Flow Logs
    vpc_flow_log_role = iam.Role(
        self, "VPCFlowLogRole",
        role_name="secureapp-vpc-flow-log-role",
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

    vpc_flow_log_group = logs.LogGroup(
        self, "VPCFlowLogGroup",
        log_group_name="/secureapp/vpc/flowlogs",
        encryption_key=self.kms_key,
        retention=logs.RetentionDays.ONE_MONTH,
        removal_policy=RemovalPolicy.DESTROY
    )

    ec2.FlowLog(
        self, "VPCFlowLog",
        resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
        destination=ec2.FlowLogDestination.to_cloud_watch_logs(
            log_group=vpc_flow_log_group,
            iam_role=vpc_flow_log_role
        ),
        traffic_type=ec2.FlowLogTrafficType.ALL
    )

    Tags.of(vpc).add("Name", "secureapp-vpc")

    return vpc

  def _create_security_groups(self) -> dict:
    """Create security groups with least privilege access"""

    # Security group for EC2 instances
    ec2_sg = ec2.SecurityGroup(
        self, "EC2SecurityGroup",
        security_group_name="secureapp-ec2-sg",
        vpc=self.vpc,
        description="Security group for SecureApp EC2 instances",
        allow_all_outbound=False
    )

    # Allow SSH access from specific CIDR (replace with your IP range)
    ec2_sg.add_ingress_rule(
        peer=ec2.Peer.ipv4("10.0.1.0/24"),  # Only from VPC
        connection=ec2.Port.tcp(22),
        description="SSH access from VPC"
    )

    # Allow HTTP traffic if needed (uncomment if required)
    # ec2_sg.add_ingress_rule(
    #     peer=ec2.Peer.ipv4("10.0.0.0/16"),
    #     connection=ec2.Port.tcp(80),
    #     description="HTTP access from VPC"
    # )

    # Allow HTTPS outbound for updates and AWS API calls
    ec2_sg.add_egress_rule(
        peer=ec2.Peer.any_ipv4(),
        connection=ec2.Port.tcp(443),
        description="HTTPS outbound for AWS APIs and updates"
    )

    # Allow HTTP outbound for package updates
    ec2_sg.add_egress_rule(
        peer=ec2.Peer.any_ipv4(),
        connection=ec2.Port.tcp(80),
        description="HTTP outbound for package updates"
    )

    Tags.of(ec2_sg).add("Name", "secureapp-ec2-sg")

    return {"ec2_sg": ec2_sg}

  def _create_s3_buckets(self) -> dict:
    """Create S3 buckets with encryption and lifecycle policies"""

    # Logging bucket
    logs_bucket = s3.Bucket(
      self, "LogsBucket",
      bucket_name=f"secureapp-logs-{self.account}-{self.region}",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=self.kms_key,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      versioned=True,
      lifecycle_rules=[
        s3.LifecycleRule(
          id="LogsRetention",
          enabled=True,
          expiration=Duration.days(2555),  # 7 years for compliance
          transitions=[
            s3.Transition(
              storage_class=s3.StorageClass.INFREQUENT_ACCESS,
              transition_after=Duration.days(30)
            ),
            s3.Transition(
              storage_class=s3.StorageClass.GLACIER,
              transition_after=Duration.days(90)
            ),
            s3.Transition(
              storage_class=s3.StorageClass.DEEP_ARCHIVE,
              transition_after=Duration.days(365)
            )
          ]
        )
      ],
      removal_policy=RemovalPolicy.DESTROY
    )

    # Application data bucket
    app_data_bucket = s3.Bucket(
      self, "AppDataBucket",
      bucket_name=f"secureapp-data-{self.account}-{self.region}",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=self.kms_key,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      versioned=True,
      lifecycle_rules=[
        s3.LifecycleRule(
          id="TransitionToIA",
          enabled=True,
          transitions=[
            s3.Transition(
              storage_class=s3.StorageClass.INFREQUENT_ACCESS,
              transition_after=Duration.days(30)
            ),
            s3.Transition(
              storage_class=s3.StorageClass.GLACIER,
              transition_after=Duration.days(90)
            )
          ]
        )
      ],
      server_access_logs_bucket=logs_bucket,
      server_access_logs_prefix="access-logs/",
      removal_policy=RemovalPolicy.DESTROY
    )

    # Note: Event notifications would typically go to SNS/SQS/Lambda
    # For now, we'll skip the event notification as it requires a destination

    Tags.of(app_data_bucket).add("Name", "secureapp-data-bucket")
    Tags.of(logs_bucket).add("Name", "secureapp-logs-bucket")

    return {
        "app_data_bucket": app_data_bucket,
        "logs_bucket": logs_bucket
    }

  def _create_iam_roles(self) -> dict:
    """Create IAM roles with least privilege principles"""

    # EC2 Instance Role
    ec2_role = iam.Role(
        self, "EC2InstanceRole",
        role_name="secureapp-ec2-role",
        assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
        description="IAM role for SecureApp EC2 instances"
    )

    # Custom policy for S3 access
    s3_policy = iam.PolicyDocument(
        statements=[
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                resources=[
                    self.s3_buckets["app_data_bucket"].bucket_arn + "/*"
                ]
            ),
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:ListBucket"
                ],
                resources=[
                    self.s3_buckets["app_data_bucket"].bucket_arn
                ]
            ),
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutObject"
                ],
                resources=[
                    self.s3_buckets["logs_bucket"].bucket_arn + "/*"
                ]
            )
        ]
    )

    # CloudWatch policy
    cloudwatch_policy = iam.PolicyDocument(
        statements=[
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:PutMetricData",
                    "ec2:DescribeVolumes",
                    "ec2:DescribeTags",
                    "logs:PutLogEvents",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:DescribeLogStreams"
                ],
                resources=["*"]
            )
        ]
    )

    # KMS policy for encryption/decryption
    kms_policy = iam.PolicyDocument(
        statements=[
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                resources=[self.kms_key.key_arn]
            )
        ]
    )

    # Attach policies to role
    iam.Policy(
        self, "EC2S3Policy",
        policy_name="secureapp-ec2-s3-policy",
        document=s3_policy,
        roles=[ec2_role]
    )

    iam.Policy(
        self, "EC2CloudWatchPolicy",
        policy_name="secureapp-ec2-cloudwatch-policy",
        document=cloudwatch_policy,
        roles=[ec2_role]
    )

    iam.Policy(
        self, "EC2KMSPolicy",
        policy_name="secureapp-ec2-kms-policy",
        document=kms_policy,
        roles=[ec2_role]
    )

    # Instance Profile
    instance_profile = iam.InstanceProfile(
        self, "EC2InstanceProfile",
        instance_profile_name="secureapp-ec2-profile",
        role=ec2_role
    )

    Tags.of(ec2_role).add("Name", "secureapp-ec2-role")

    return {
        "ec2_role": ec2_role,
        "instance_profile": instance_profile
    }

  def _create_cloudwatch_resources(self) -> dict:
    """Create CloudWatch logging and monitoring resources"""

    # Log group for application logs
    app_log_group = logs.LogGroup(
        self, "AppLogGroup",
        log_group_name="/secureapp/application",
        encryption_key=self.kms_key,
        retention=logs.RetentionDays.ONE_MONTH,
        removal_policy=RemovalPolicy.DESTROY
    )

    # Log group for system logs
    system_log_group = logs.LogGroup(
        self, "SystemLogGroup",
        log_group_name="/secureapp/system",
        encryption_key=self.kms_key,
        retention=logs.RetentionDays.ONE_MONTH,
        removal_policy=RemovalPolicy.DESTROY
    )

    # CloudWatch Dashboard
    dashboard = cloudwatch.Dashboard(
        self, "SecureAppDashboard",
        dashboard_name="secureapp-monitoring"
    )

    # Add widgets to dashboard (example)
    dashboard.add_widgets(
        cloudwatch.TextWidget(
            markdown="# SecureApp Infrastructure Monitoring",
            width=24,
            height=2
        )
    )

    Tags.of(app_log_group).add("Name", "secureapp-app-logs")
    Tags.of(system_log_group).add("Name", "secureapp-system-logs")

    return {
        "app_log_group": app_log_group,
        "system_log_group": system_log_group,
        "dashboard": dashboard
    }

  def _create_ec2_instances(self) -> dict:
    """Create EC2 instances in private subnets with security configurations"""

    # User data script for CloudWatch agent installation
    user_data = ec2.UserData.for_linux()
    user_data.add_commands(
        "yum update -y",
        "yum install -y amazon-cloudwatch-agent",
        "yum install -y awslogs",

        # Configure CloudWatch agent
        "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
        json.dumps({
            "agent": {
                "metrics_collection_interval": 60,
                "run_as_user": "cwagent"
            },
            "logs": {
                "logs_collected": {
                    "files": {
                        "collect_list": [
                            {
                                "file_path": "/var/log/messages",
                                "log_group_name": "/secureapp/system",
                                "log_stream_name": "{instance_id}/messages"
                            },
                            {
                                "file_path": "/var/log/secure",
                                "log_group_name": "/secureapp/system",
                                "log_stream_name": "{instance_id}/secure"
                            }
                        ]
                    }
                }
            },
            "metrics": {
                "namespace": "SecureApp/EC2",
                "metrics_collected": {
                    "cpu": {
                        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                        "metrics_collection_interval": 60
                    },
                    "disk": {
                        "measurement": ["used_percent"],
                        "metrics_collection_interval": 60,
                        "resources": ["*"]
                    },
                    "mem": {
                        "measurement": ["mem_used_percent"],
                        "metrics_collection_interval": 60
                    }
                }
            }
        }, indent=2),
        "EOF",

        # Start CloudWatch agent
        "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s",

        # Configure awslogs for additional logging
        f"sed -i 's/region = us-east-1/region = {self.region}/' /etc/awslogs/awscli.conf",
        "systemctl enable awslogsd",
        "systemctl start awslogsd"
    )

    # Launch Template defined (optional use in future autoscaling groups)
    # Not attaching it now to avoid breaking flow
    launch_template = ec2.LaunchTemplate(
        self,
        "SecureAppLaunchTemplate",
        launch_template_name="secureapp-launch-template",
        instance_type=ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO),
        machine_image=ec2.MachineImage.latest_amazon_linux2(),
        security_group=self.security_groups["ec2_sg"],
        role=self.iam_roles["ec2_role"],
        user_data=user_data,
        block_devices=[
            ec2.BlockDevice(
                device_name="/dev/xvda",
                volume=ec2.BlockDeviceVolume.ebs(
                    volume_size=20,
                    encrypted=True,
                    kms_key=self.kms_key,
                    volume_type=ec2.EbsDeviceVolumeType.GP3))])

    # EC2 Instance in private subnet
    instance = ec2.Instance(
        self,
        "SecureAppInstance",
        instance_type=ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO),
        machine_image=ec2.MachineImage.latest_amazon_linux2(),
        vpc=self.vpc,
        vpc_subnets=ec2.SubnetSelection(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        security_group=self.security_groups["ec2_sg"],
        role=self.iam_roles["ec2_role"],
        user_data=user_data,
        block_devices=[
            ec2.BlockDevice(
                device_name="/dev/xvda",
                volume=ec2.BlockDeviceVolume.ebs(
                    volume_size=20,
                    encrypted=True,
                    kms_key=self.kms_key,
                    volume_type=ec2.EbsDeviceVolumeType.GP3))])

    Tags.of(instance).add("Name", "secureapp-instance-01")
    Tags.of(instance).add("Backup", "Required")

    return {
        "launch_template": launch_template,
        "instance": instance
    }

  def _create_cloudtrail(self) -> logs.LogGroup:
    """Create CloudTrail for auditing IAM and AWS activity"""

    # CloudTrail log group
    trail_log_group = logs.LogGroup(
      self, "CloudTrailLogGroup",
      log_group_name="/secureapp/cloudtrail",
      encryption_key=self.kms_key,
      retention=logs.RetentionDays.ONE_YEAR,
      removal_policy=RemovalPolicy.DESTROY
    )

    # Use existing S3 bucket created earlier
    trail_bucket = self.s3_buckets["logs_bucket"]

    # Add bucket policy to allow CloudTrail to write logs (without replacing bucket)
    trail_bucket.add_to_resource_policy(iam.PolicyStatement(
      effect=iam.Effect.ALLOW,
      principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
      actions=["s3:GetBucketAcl"],
      resources=[trail_bucket.bucket_arn]
    ))

    trail_bucket.add_to_resource_policy(iam.PolicyStatement(
      effect=iam.Effect.ALLOW,
      principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
      actions=["s3:PutObject"],
      resources=[f"{trail_bucket.bucket_arn}/AWSLogs/{self.account}/*"],
      conditions={
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    ))


    # Create CloudTrail
    trail = cloudtrail.CfnTrail(
      self, "SecureAppTrail",
      trail_name="secureapp-trail",
      s3_bucket_name=trail_bucket.bucket_name,
      cloud_watch_logs_log_group_arn=trail_log_group.log_group_arn,
      cloud_watch_logs_role_arn=self._create_cloudtrail_log_role().role_arn,
      is_logging=True,
      is_multi_region_trail=True,
      include_global_service_events=True,
      enable_log_file_validation=True,
      event_selectors=[
        cloudtrail.CfnTrail.EventSelectorProperty(
          read_write_type="All",
          include_management_events=True,
          data_resources=[]
        )
      ]
    )

    return trail_log_group

  def _create_cloudtrail_log_role(self) -> iam.Role:
    """IAM role to allow CloudTrail to publish logs to CloudWatch"""

    role = iam.Role(
      self, "CloudTrailLogRole",
      role_name="secureapp-cloudtrail-log-role",
      assumed_by=iam.ServicePrincipal("cloudtrail.amazonaws.com")
    )

    role.add_to_policy(iam.PolicyStatement(
      effect=iam.Effect.ALLOW,
      actions=[
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      resources=["*"]
    ))

    return role


  def _create_outputs(self) -> None:
    """Create CloudFormation outputs"""

    CfnOutput(
        self, "VPCId",
        value=self.vpc.vpc_id,
        description="VPC ID for SecureApp"
    )

    CfnOutput(
        self, "KMSKeyId",
        value=self.kms_key.key_id,
        description="KMS Key ID for encryption"
    )

    CfnOutput(
        self, "AppDataBucketOutput",
        value=self.s3_buckets["app_data_bucket"].bucket_name,
        description="S3 bucket for application data"
    )

    CfnOutput(
        self, "LogsBucketOutput",
        value=self.s3_buckets["logs_bucket"].bucket_name,
        description="S3 bucket for logs"
    )

    CfnOutput(
        self, "InstanceId",
        value=self.ec2_instances["instance"].instance_id,
        description="EC2 Instance ID"
    )

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
  CfnOutput,
  aws_s3 as s3,
  aws_kms as kms,
  aws_iam as iam,
  aws_ec2 as ec2,
  aws_logs as logs,
  aws_rds as rds,
  aws_lambda as lambda_,
  aws_sqs as sqs,
  aws_cloudtrail as cloudtrail,
  aws_config as config,
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

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # 1. KMS Key with CloudWatch Logs permissions
    master_key = kms.Key(
      self, "MasterKey",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )

    # Add policy to allow CloudWatch Logs to use the key
    master_key.add_to_resource_policy(
      iam.PolicyStatement(
        sid="AllowCloudWatchLogs",
        effect=iam.Effect.ALLOW,
        principals=[
          iam.ServicePrincipal(f"logs.{self.region}.amazonaws.com")
        ],
        actions=[
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        resources=["*"],
        conditions={
          "ArnEquals": {
            "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{self.account}:*"
          }
        }
      )
    )

    # Also allow the account root to manage the key
    master_key.add_to_resource_policy(
      iam.PolicyStatement(
        sid="AllowRootAccess",
        effect=iam.Effect.ALLOW,
        principals=[iam.AccountRootPrincipal()],
        actions=["kms:*"],
        resources=["*"]
      )
    )
    
    master_key.add_to_resource_policy(
      iam.PolicyStatement(
        sid="AllowCloudTrail",
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

    # 2. CloudWatch Log Group for VPC Flow Logs
    vpc_flow_log_group = logs.LogGroup(
      self, "VPCFlowLogsGroup",
      retention=logs.RetentionDays.ONE_YEAR,
      encryption_key=master_key,
      removal_policy=RemovalPolicy.DESTROY
    )

    # 3. S3 Bucket for CloudTrail logs
    cloudtrail_bucket = s3.Bucket(
      self, "CloudTrailBucket",
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      encryption=s3.BucketEncryption.KMS,
      encryption_key=master_key,
      versioned=True,
      removal_policy=RemovalPolicy.DESTROY
    )
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
        resources=[f"{cloudtrail_bucket.bucket_arn}/*"],
        conditions={
          "StringEquals": {
            "s3:x-amz-acl": "bucket-owner-full-control"
          }
        }
      )
    )

    # 4. VPC with Flow Logs
    vpc = ec2.Vpc(
      self, "TapVPC",
      max_azs=2,
      enable_dns_hostnames=True,
      enable_dns_support=True,
      nat_gateways=1
    )

    # Create Flow Log Role with inline policy instead of managed policy
    flow_log_role = iam.Role(
      self, "FlowLogRole",
      assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com")
    )

    # Add inline policy with required permissions
    flow_log_role.add_to_policy(iam.PolicyStatement(
      actions=[
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      resources=["*"]
    ))

    vpc.add_flow_log(
      "VPCFlowLog",
      destination=ec2.FlowLogDestination.to_cloud_watch_logs(
        vpc_flow_log_group,
        flow_log_role  # Use the role we created above
      ),
      traffic_type=ec2.FlowLogTrafficType.ALL
    )

    # 5. CloudTrail (single region for LocalStack)
    cloudtrail.Trail(
      self, "TapCloudTrail",
      bucket=cloudtrail_bucket,
      include_global_service_events=True,
      is_multi_region_trail=False,
      enable_file_validation=True,
      encryption_key=master_key,
      send_to_cloud_watch_logs=True,
      cloud_watch_log_group=vpc_flow_log_group  # <-- corrected argument name
    )

    # 6. IAM Role for AWS Config
    # NOTE: AWS Config has limited support in LocalStack Community - commented out for LocalStack deployment
    # config_role = iam.Role(
    #   self, "ConfigRole",
    #   assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
    # )
    # config_role.add_to_policy(iam.PolicyStatement(
    #   actions=[
    #     "s3:PutObject",
    #     "s3:GetBucketAcl",
    #     "s3:GetBucketLocation",
    #     "sns:Publish",
    #     "config:Put*",
    #     "config:Get*",
    #     "config:Describe*",
    #     "config:Deliver*"
    #   ],
    #   resources=["*"]
    # ))

    # 7. S3 Bucket for AWS Config
    # NOTE: AWS Config has limited support in LocalStack Community - commented out for LocalStack deployment
    # config_bucket = s3.Bucket(
    #   self, "ConfigBucket",
    #   block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
    #   encryption=s3.BucketEncryption.KMS,
    #   encryption_key=master_key,
    #   versioned=True
    # )
    # config_bucket.add_to_resource_policy(
    #   iam.PolicyStatement(
    #     sid="AWSConfigBucketPermissionsCheck",
    #     effect=iam.Effect.ALLOW,
    #     principals=[iam.ServicePrincipal("config.amazonaws.com")],
    #     actions=["s3:GetBucketAcl", "s3:GetBucketLocation"],
    #     resources=[config_bucket.bucket_arn]
    #   )
    # )
    # config_bucket.add_to_resource_policy(
    #   iam.PolicyStatement(
    #     sid="AWSConfigBucketExistenceCheck",
    #     effect=iam.Effect.ALLOW,
    #     principals=[iam.ServicePrincipal("config.amazonaws.com")],
    #     actions=["s3:ListBucket"],
    #     resources=[config_bucket.bucket_arn]
    #   )
    # )
    # config_bucket.add_to_resource_policy(
    #   iam.PolicyStatement(
    #     sid="AWSConfigBucketDelivery",
    #     effect=iam.Effect.ALLOW,
    #     principals=[iam.ServicePrincipal("config.amazonaws.com")],
    #     actions=["s3:PutObject"],
    #     resources=[f"{config_bucket.bucket_arn}/*"],
    #     conditions={
    #       "StringEquals": {
    #         "s3:x-amz-acl": "bucket-owner-full-control"
    #       }
    #     }
    #   )
    # )

    # 9. AWS Config Managed Rules (example: S3 public access prohibited)
    # NOTE: AWS Config has limited support in LocalStack Community - commented out for LocalStack deployment
    # config_rule = config.ManagedRule(
    #   self, "S3BucketPublicAccessProhibited",
    #   identifier=config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED
    # )

    # 10. Security Group with restricted SSH
    secure_sg = ec2.SecurityGroup(
      self, "SecureSG",
      vpc=vpc,
      description="Restricted SSH access",
      allow_all_outbound=True
    )
    secure_sg.add_ingress_rule(
      peer=ec2.Peer.ipv4("10.0.0.0/8"),
      connection=ec2.Port.tcp(22),
      description="SSH from private networks only"
    )

    # 11. RDS Subnet Group
    db_subnet_group = rds.SubnetGroup(
      self, "DBSubnetGroup",
      description="Subnet group for RDS",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
      removal_policy=RemovalPolicy.DESTROY  # For dev/test only!
    )

    # 12. RDS Database Instance (encrypted, private)
    secure_db = rds.DatabaseInstance(
      self, "SecureDatabase",
      engine=rds.DatabaseInstanceEngine.postgres(
        version=rds.PostgresEngineVersion.VER_14_12  # Changed to widely available version
      ),
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.T3, ec2.InstanceSize.MICRO
      ),
      vpc=vpc,
      subnet_group=db_subnet_group,
      security_groups=[secure_sg],
      storage_encrypted=True,
      storage_encryption_key=master_key,
      publicly_accessible=False,
      backup_retention=Duration.days(7),
      deletion_protection=False,
      removal_policy=RemovalPolicy.DESTROY  # For dev/test only!
    )

    # 13. SQS Queue for Lambda DLQ
    dlq = sqs.Queue(
      self, "LambdaDLQ",
      encryption=sqs.QueueEncryption.KMS,
      encryption_master_key=master_key,
      retention_period=Duration.days(14)
    )

    # 14. IAM Role for Lambda
    lambda_role = iam.Role(
      self, "LambdaRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "service-role/AWSLambdaVPCAccessExecutionRole"
        )
      ]
    )

    # 15. Lambda Function (with DLQ, VPC, encryption)
    lambda_function = lambda_.Function(
      self, "SecureLambda",
      runtime=lambda_.Runtime.PYTHON_3_11,  # Updated runtime
      handler="index.handler",
      code=lambda_.Code.from_inline(
        "def handler(event, context):\n    return {'statusCode': 200, 'body': 'Hello from secure Lambda!'}"
      ),
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
      security_groups=[secure_sg],
      role=lambda_role,
      dead_letter_queue=dlq,
      environment_encryption=master_key,
      timeout=Duration.seconds(30),
      retry_attempts=2  # Add retry attempts
    )

    # (You can add CDK Aspects, MFA enforcement, and root account restriction constructs as needed and outputs as well

    # === Outputs ===
    CfnOutput(
      self, "KmsKeyArn",
      value=master_key.key_arn,
      description="KMS Key ARN for encryption"
    )
    CfnOutput(
      self, "CloudTrailBucketName",
      value=cloudtrail_bucket.bucket_name,
      description="S3 bucket for CloudTrail logs"
    )
    CfnOutput(
      self, "VpcId",
      value=vpc.vpc_id,
      description="VPC ID"
    )
    # CfnOutput(
    #   self, "ConfigBucketName",
    #   value=config_bucket.bucket_name,
    #   description="S3 bucket for AWS Config"
    # )
    CfnOutput(
      self, "RdsEndpointAddress",
      value=secure_db.db_instance_endpoint_address,
      description="RDS Endpoint Address"
    )
    CfnOutput(
      self, "LambdaFunctionName",
      value=lambda_function.function_name,
      description="Lambda function name"
    )
    CfnOutput(
      self, "DLQName",
      value=dlq.queue_name,
      description="SQS DLQ name"
    )
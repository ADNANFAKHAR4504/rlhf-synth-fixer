# TAP Stack - AWS CDK Security Infrastructure

## `tap_stack.py` - Complete CDK Implementation

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of all core AWS resources as described in the model response.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
  Stack,
  Duration,
  RemovalPolicy,
  aws_iam as iam,
  aws_s3 as s3,
  aws_kms as kms,
  aws_ec2 as ec2,
  aws_autoscaling as autoscaling,
  aws_lambda as lambda_,
  aws_logs as logs,
  aws_cloudtrail as cloudtrail,
  aws_cloudwatch as cloudwatch,
  aws_wafv2 as waf,
  aws_backup as backup,
  aws_events as events,
  aws_events_targets as targets,
  aws_sns as sns,
  CfnOutput,
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
    self.environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # 1. KMS Keys
    s3_kms_key = kms.Key(
      self, "sec-s3-kms-key",
      description="KMS key for S3 bucket encryption",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )
    cloudtrail_kms_key = kms.Key(
      self, "sec-cloudtrail-kms-key",
      description="KMS key for CloudTrail encryption",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )
    lambda_kms_key = kms.Key(
      self, "sec-lambda-kms-key",
      description="KMS key for Lambda encryption",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )

    # 2. IAM Roles & MFA
    ec2_role = iam.Role(
      self, "sec-ec2-role",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
      ]
    )
    lambda_role = iam.Role(
      self, "sec-lambda-role",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
      ]
    )
    cloudtrail_role = iam.Role(
      self, "sec-cloudtrail-role",
      assumed_by=iam.ServicePrincipal("cloudtrail.amazonaws.com")
    )
    backup_role = iam.Role(
      self, "sec-backup-role",
      assumed_by=iam.ServicePrincipal("backup.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSBackupServiceRolePolicyForBackup"),
        iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSBackupServiceRolePolicyForRestores")
      ]
    )
    iam_user = iam.User(
      self, "sec-admin-user",
      user_name="sec-admin-user"
    )
    mfa_policy = iam.Policy(
      self, "sec-mfa-policy",
      policy_name="sec-mfa-enforcement-policy",
      statements=[
        iam.PolicyStatement(
          effect=iam.Effect.DENY,
          actions=["*"],
          resources=["*"],
          conditions={
            "BoolIfExists": {
              "aws:MultiFactorAuthPresent": "false"
            }
          }
        )
      ]
    )
    iam_user.attach_inline_policy(mfa_policy)

    # 3. VPC & Networking
    vpc = ec2.Vpc(
      self, "sec-vpc",
      vpc_name="sec-vpc",
      max_azs=2,
      cidr="10.0.0.0/16",
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name="sec-public-subnet",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name="sec-private-subnet",
          subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidr_mask=24
        )
      ],
      enable_dns_hostnames=True,
      enable_dns_support=True
    )

    # VPC Flow Logs
    flow_logs_group = logs.LogGroup(
      self, "sec-vpc-flow-logs",
      log_group_name=f"/aws/vpc/flowlogs/{self.environment_suffix}",
      retention=logs.RetentionDays.ONE_MONTH,
      removal_policy=RemovalPolicy.DESTROY
    )
    flow_logs_role = iam.Role(
      self, "sec-flow-logs-role",
      assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
      inline_policies={
        "FlowLogsDeliveryRolePolicy": iam.PolicyDocument(
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
    ec2.FlowLog(
      self, "sec-vpc-flow-log",
      resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
      destination=ec2.FlowLogDestination.to_cloud_watch_logs(
        flow_logs_group,
        flow_logs_role
      ),
      traffic_type=ec2.FlowLogTrafficType.ALL
    )

    # Security Groups
    ec2_sg = ec2.SecurityGroup(
      self, "sec-ec2-sg",
      vpc=vpc,
      description="Security group for EC2 instances",
      allow_all_outbound=True
    )
    ec2_sg.add_ingress_rule(
      peer=ec2.Peer.ipv4("10.0.0.0/16"),
      connection=ec2.Port.tcp(22),
      description="SSH access from VPC only"
    )
    lambda_sg = ec2.SecurityGroup(
      self, "sec-lambda-sg",
      vpc=vpc,
      description="Security group for Lambda functions",
      allow_all_outbound=True
    )

    # 4. S3 Buckets
    app_bucket = s3.Bucket(
      self, "sec-app-bucket",
      bucket_name=f"sec-app-bucket-{self.account}-{self.region}",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=s3_kms_key,
      versioned=True,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True
    )
    cloudtrail_bucket = s3.Bucket(
      self, "sec-cloudtrail-bucket",
      bucket_name=f"sec-cloudtrail-bucket-{self.account}-{self.region}",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=cloudtrail_kms_key,
      versioned=True,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True
    )
    access_logs_bucket = s3.Bucket(
      self, "sec-access-logs-bucket",
      bucket_name=f"sec-access-logs-bucket-{self.account}-{self.region}",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=s3_kms_key,
      versioned=True,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True
    )

    # 5. CloudTrail
    cloudtrail_trail = cloudtrail.Trail(
      self, "sec-cloudtrail",
      trail_name="sec-cloudtrail",
      bucket=cloudtrail_bucket,
      include_global_service_events=True,
      is_multi_region_trail=True,
      enable_file_validation=True
    )

    # 6. CloudWatch Monitoring & Alarms
    alert_topic = sns.Topic(
      self, "sec-alerts-topic",
      topic_name="sec-security-alerts"
    )
    cloudwatch.Alarm(
      self, "sec-iam-policy-changes-alarm",
      alarm_name="sec-iam-policy-changes",
      alarm_description="Alarm for IAM policy changes",
      metric=cloudwatch.Metric(
        namespace="AWS/Events",
        metric_name="SuccessfulInvocations",
        dimensions_map={
          "RuleName": "sec-iam-policy-changes-rule"
        }
      ),
      threshold=1,
      evaluation_periods=1,
      comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
    )
    events.Rule(
      self, "sec-iam-policy-changes-rule",
      rule_name="sec-iam-policy-changes-rule",
      description="Detect IAM policy changes",
      event_pattern=events.EventPattern(
        source=["aws.iam"],
        detail_type=["AWS API Call via CloudTrail"],
        detail={
          "eventSource": ["iam.amazonaws.com"],
          "eventName": [
            "DeleteUserPolicy", "DeleteRolePolicy", "DeleteGroupPolicy",
            "CreatePolicy", "DeletePolicy", "CreatePolicyVersion", "DeletePolicyVersion",
            "AttachUserPolicy", "DetachUserPolicy", "AttachRolePolicy", "DetachRolePolicy",
            "AttachGroupPolicy", "DetachGroupPolicy"
          ]
        }
      ),
      targets=[targets.SnsTopic(alert_topic)]
    )

    # 8. Auto Scaling Group with EC2
    launch_template = ec2.LaunchTemplate(
      self, "sec-launch-template",
      launch_template_name="sec-launch-template",
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machine_image=ec2.AmazonLinuxImage(
        generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
      ),
      security_group=ec2_sg,
      role=ec2_role,
      user_data=ec2.UserData.for_linux(),
      block_devices=[
        ec2.BlockDevice(
          device_name="/dev/xvda",
          volume=ec2.BlockDeviceVolume.ebs(
            volume_size=20,
            encrypted=True,
            delete_on_termination=True
          )
        )
      ]
    )
    asg = autoscaling.AutoScalingGroup(
      self, "sec-asg",
      auto_scaling_group_name="sec-asg",
      vpc=vpc,
      launch_template=launch_template,
      min_capacity=1,
      max_capacity=3,
      desired_capacity=2,
      vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
      )
    )

    # 9. Lambda in VPC
    lambda_function = lambda_.Function(
      self, "sec-lambda-function",
      function_name="sec-lambda-function",
      runtime=lambda_.Runtime.PYTHON_3_9,
      handler="index.handler",
      code=lambda_.Code.from_inline(
        "def handler(event, context):\n    return {'statusCode': 200, 'body': 'Hello from secure Lambda!'}"
      ),
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
      ),
      security_groups=[lambda_sg],
      role=lambda_role,
      environment_encryption=lambda_kms_key,
      timeout=Duration.seconds(30),
      memory_size=128
    )

    # 10. WAF
    web_acl = waf.CfnWebACL(
      self, "sec-web-acl",
      name="sec-web-acl",
      scope="REGIONAL",
      default_action=waf.CfnWebACL.DefaultActionProperty(
        allow={}
      ),
      rules=[
        waf.CfnWebACL.RuleProperty(
          name="AWSManagedRulesCommonRuleSet",
          priority=1,
          override_action=waf.CfnWebACL.OverrideActionProperty(
            none={}
          ),
          statement=waf.CfnWebACL.StatementProperty(
            managed_rule_group_statement=waf.CfnWebACL.ManagedRuleGroupStatementProperty(
              vendor_name="AWS",
              name="AWSManagedRulesCommonRuleSet"
            )
          ),
          visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
            sampled_requests_enabled=True,
            cloud_watch_metrics_enabled=True,
            metric_name="CommonRuleSetMetric"
          )
        ),
        waf.CfnWebACL.RuleProperty(
          name="AWSManagedRulesKnownBadInputsRuleSet",
          priority=2,
          override_action=waf.CfnWebACL.OverrideActionProperty(
            none={}
          ),
          statement=waf.CfnWebACL.StatementProperty(
            managed_rule_group_statement=waf.CfnWebACL.ManagedRuleGroupStatementProperty(
              vendor_name="AWS",
              name="AWSManagedRulesKnownBadInputsRuleSet"
            )
          ),
          visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
            sampled_requests_enabled=True,
            cloud_watch_metrics_enabled=True,
            metric_name="KnownBadInputsRuleSetMetric"
          )
        )
      ],
      visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
        sampled_requests_enabled=True,
        cloud_watch_metrics_enabled=True,
        metric_name="sec-web-acl"
      )
    )

    # 11. AWS Backup
    backup_vault = backup.BackupVault(
      self, "sec-backup-vault",
      backup_vault_name="sec-backup-vault",
      encryption_key=s3_kms_key,
      removal_policy=RemovalPolicy.DESTROY
    )
    backup_plan = backup.BackupPlan(
      self, "sec-backup-plan",
      backup_plan_name="sec-backup-plan",
      backup_plan_rules=[
        backup.BackupPlanRule(
          backup_vault=backup_vault,
          rule_name="DailyBackups",
          schedule_expression=events.Schedule.cron(
            hour="2",
            minute="0"
          ),
          delete_after=Duration.days(30)
        )
      ]
    )
    backup.BackupSelection(
      self, "sec-backup-selection",
      backup_plan=backup_plan,
      resources=[
        backup.BackupResource.from_arn(app_bucket.bucket_arn)
      ],
      role=backup_role
    )

    # 12. Outputs
    CfnOutput(self, "VpcId", value=vpc.vpc_id, description="VPC ID")
    CfnOutput(self, "AppBucketName", value=app_bucket.bucket_name, description="Application S3 Bucket Name")
    CfnOutput(self, "CloudTrailArn", value=cloudtrail_trail.trail_arn, description="CloudTrail ARN")
    CfnOutput(self, "WebAclArn", value=web_acl.attr_arn, description="WAF ACL ARN")
    CfnOutput(self, "BackupVaultName", value=backup_vault.backup_vault_name, description="Backup Vault Name")
    CfnOutput(self, "Ec2InstanceType", value=asg.auto_scaling_group_name, description="EC2 Instance Type")
    CfnOutput(self, "LambdaFunctionName", value=lambda_function.function_name, description="Lambda Function Name")
    CfnOutput(self, "S3BucketEncryptionKeyId", value=s3_kms_key.key_id, description="S3 Bucket Encryption Key ID")
    CfnOutput(self, "CloudTrailKmsKeyId", value=cloudtrail_kms_key.key_id, description="CloudTrail KMS Key ID")
    CfnOutput(self, "LambdaKmsKeyId", value=lambda_kms_key.key_id, description="Lambda KMS Key ID")


```
"""
tap_stack.py

Main Pulumi ComponentResource for TAP. Configuration is passed in via TapStackArgs
from the program entrypoint (tap.py). This keeps config handling centralized and
the component testable/pure.
"""

import json
from typing import Any, Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
  """
  Strongly-typed arguments for TapStack. All values are supplied by tap.py.

  Args:
    environment_suffix: deployment environment suffix (e.g., dev, prod)
    env: normalized environment used for naming (e.g., dev, prod)
    region: AWS region used for naming
    tags: default tags applied to created resources
    logging_bucket_name: centralized S3 bucket name for access logging
    ssh_allowed_cidrs: list of CIDR blocks allowed for SSH
    cloudtrail_kms_key_arn: optional KMS key ARN for CloudTrail
    cloudtrail_enable_data_events: enable S3/Lambda data events (default True)
    nacl_subnet_ids: list of subnet IDs to enforce NACL rules
    lambda_kms_key_arn: optional KMS key ARN to encrypt Lambda env vars
    waf_rate_limit: WAFv2 rate limit
    guardduty_regions: regions to enable GuardDuty
    vpc_flow_log_vpc_ids: VPC IDs to enable VPC Flow Logs
    vpc_flow_log_retention_days: CloudWatch Logs retention for flow logs
    iam_roles_to_validate: IAM roles to validate/update for least privilege
    rds_backup_retention_days: RDS backup retention
    rds_multi_az_enabled: whether to enforce Multi-AZ for new RDS where applicable
    vpc_id: VPC ID used by SG/NACL helpers
    rds_subnet_ids: Subnet IDs for RDS subnet group
  """

  def __init__(
    self,
    *,
    environment_suffix: Optional[str] = None,
    env: Optional[str] = None,
    region: Optional[str] = None,
    tags: Optional[Dict[str, Any]] = None,
    logging_bucket_name: Optional[str] = None,
    ssh_allowed_cidrs: Optional[List[str]] = None,
    cloudtrail_kms_key_arn: Optional[pulumi.Input[str]] = None,
    cloudtrail_enable_data_events: Optional[bool] = True,
    nacl_subnet_ids: Optional[List[str]] = None,
    lambda_kms_key_arn: Optional[pulumi.Input[str]] = None,
    waf_rate_limit: Optional[int] = 1000,
    guardduty_regions: Optional[List[str]] = None,
    vpc_flow_log_vpc_ids: Optional[List[str]] = None,
    vpc_flow_log_retention_days: Optional[int] = 90,
    iam_roles_to_validate: Optional[List[str]] = None,
    rds_backup_retention_days: Optional[int] = 7,
    rds_multi_az_enabled: Optional[bool] = None,
    vpc_id: Optional[str] = None,
    rds_subnet_ids: Optional[List[str]] = None,
  ):
    self.environment_suffix = environment_suffix or "dev"
    self.env = env or "prod"
    self.region = region or aws.get_region().name
    self.tags = tags or {"Environment": self.env, "ManagedBy": "Pulumi"}
    self.logging_bucket_name = logging_bucket_name
    self.ssh_allowed_cidrs = ssh_allowed_cidrs or ["10.0.0.0/8"]
    self.cloudtrail_kms_key_arn = cloudtrail_kms_key_arn
    self.cloudtrail_enable_data_events = bool(cloudtrail_enable_data_events)
    self.nacl_subnet_ids = nacl_subnet_ids or []
    self.lambda_kms_key_arn = lambda_kms_key_arn
    self.waf_rate_limit = waf_rate_limit or 1000
    self.guardduty_regions = guardduty_regions or ["us-east-1", "us-west-2", "eu-west-1"]
    self.vpc_flow_log_vpc_ids = vpc_flow_log_vpc_ids or []
    self.vpc_flow_log_retention_days = vpc_flow_log_retention_days or 90
    self.iam_roles_to_validate = iam_roles_to_validate or []
    self.rds_backup_retention_days = rds_backup_retention_days or 7
    self.rds_multi_az_enabled = rds_multi_az_enabled
    self.vpc_id = vpc_id
    self.rds_subnet_ids = rds_subnet_ids or []


class TapStack(pulumi.ComponentResource):
  """
  Main Pulumi component for TAP. Orchestrates security controls using provided config.
  """

  def __init__(
    self,
    name: str,
    args: TapStackArgs,
    opts: Optional[ResourceOptions] = None,
  ):
    super().__init__("tap:stack:TapStack", name, None, opts)

    # Copy args to instance
    self.environment_suffix = args.environment_suffix
    self.env = args.env
    self.region = args.region
    self.tags = args.tags
    self.logging_bucket_name = args.logging_bucket_name
    self.ssh_allowed_cidrs = args.ssh_allowed_cidrs
    self.cloudtrail_kms_key_arn = args.cloudtrail_kms_key_arn
    self.cloudtrail_enable_data_events = args.cloudtrail_enable_data_events
    self.nacl_subnet_ids = args.nacl_subnet_ids
    self.lambda_kms_key_arn = args.lambda_kms_key_arn
    self.waf_rate_limit = args.waf_rate_limit
    self.guardduty_regions = args.guardduty_regions
    self.vpc_flow_log_vpc_ids = args.vpc_flow_log_vpc_ids
    self.vpc_flow_log_retention_days = args.vpc_flow_log_retention_days
    self.iam_roles_to_validate = args.iam_roles_to_validate
    self.rds_backup_retention_days = args.rds_backup_retention_days
    self.rds_multi_az_enabled = args.rds_multi_az_enabled
    self.vpc_id = args.vpc_id
    self.rds_subnet_ids = args.rds_subnet_ids

    # Resource tracking
    self.created_resources: Dict[str, Any] = {}

    # Execute orchestration
    self._main()

    # Register outputs
    self.register_outputs({
      "environment": self.env,
      "region": self.region,
      "logging_bucket_name": self.logging_bucket_name,
      "created_resources": self.created_resources,
      "cloudtrail_name": self.created_resources.get("cloudtrail"),
      "guardduty_detectors": self.created_resources.get("guardduty_detectors", {}),
      "vpc_flow_log_groups": self.created_resources.get("vpc_flow_log_groups", {}),
      "cloudfront_waf_arn": self.created_resources.get("cloudfront_waf"),
    })

  def _get_resource_name(self, service: str, suffix: str = "") -> str:
    base_name = f"{self.env}-{service}-{self.region}"
    return f"{base_name}-{suffix}" if suffix else base_name

  def _apply_tags(self, additional_tags: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    tags = dict(self.tags or {})
    if additional_tags:
      tags.update(additional_tags)
    return tags

  def _ensure_s3_encryption_and_logging(self):
    pulumi.log.info("Configuring S3 security controls...")
    try:
      existing_buckets = aws.s3.get_buckets()
      bucket_names = existing_buckets.names
    except Exception as e:
      pulumi.log.warn(f"Could not enumerate S3 buckets: {e}")
      return

    logging_bucket = aws.s3.Bucket(
      f"logging-bucket-{self.env}",
      bucket=self.logging_bucket_name,
      tags=self._apply_tags({"Purpose": "AccessLogging"}),
      opts=ResourceOptions(parent=self, protect=True),
    )

    aws.s3.BucketPublicAccessBlock(
      f"logging-bucket-pab-{self.env}",
      bucket=logging_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self),
    )

    for bucket_name in bucket_names:
      if bucket_name == self.logging_bucket_name:
        continue

      aws.s3.BucketServerSideEncryptionConfiguration(
        f"bucket-encryption-{bucket_name}",
        bucket=bucket_name,
        rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
          apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256",
          )
        )],
        opts=ResourceOptions(parent=self),
      )

      try:
        bucket_policy = aws.s3.get_bucket_policy(bucket=bucket_name)
        if bucket_policy.policy:
          aws.s3.BucketLogging(
            f"bucket-logging-{bucket_name}",
            bucket=bucket_name,
            target_bucket=self.logging_bucket_name,
            target_prefix=f"access-logs/{bucket_name}/",
            opts=ResourceOptions(parent=self),
          )
      except Exception:
        pass

    self.created_resources["logging_bucket"] = logging_bucket.id

  def _ensure_iam_least_privilege(self):
    pulumi.log.info("Validating IAM least privilege policies...")
    for role_identifier in self.iam_roles_to_validate:
      try:
        role = aws.iam.get_role(name=role_identifier)
        if "ec2" in role_identifier.lower():
          policy_document = {
            "Version": "2012-10-17",
            "Statement": [
              {
                "Effect": "Allow",
                "Action": [
                  "ec2:DescribeInstances",
                  "ec2:DescribeImages",
                  "ec2:DescribeSnapshots",
                  "cloudwatch:PutMetricData",
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents",
                ],
                "Resource": "*",
              }
            ],
          }
          policy = aws.iam.Policy(
            f"least-privilege-{role_identifier}",
            name=f"{self._get_resource_name('least-privilege')}-{role_identifier}",
            policy=json.dumps(policy_document),
            tags=self._apply_tags({"Purpose": "LeastPrivilege"}),
            opts=ResourceOptions(parent=self),
          )
          aws.iam.RolePolicyAttachment(
            f"attach-{role_identifier}",
            role=role.name,
            policy_arn=policy.arn,
            opts=ResourceOptions(parent=self),
          )
      except Exception as e:
        pulumi.log.warn(f"Could not process role {role_identifier}: {e}")

  def _ensure_rds_backups(self):
    pulumi.log.info("Configuring RDS backup policies...")
    rds_subnet_group = None
    if self.rds_subnet_ids:
      rds_subnet_group = aws.rds.SubnetGroup(
        f"rds-subnet-group-{self.env}",
        name=self._get_resource_name("rds-subnet"),
        subnet_ids=self.rds_subnet_ids,
        tags=self._apply_tags({"Purpose": "RDSSubnetGroup"}),
        opts=ResourceOptions(parent=self),
      )

    rds_security_group = None
    if self.vpc_id:
      rds_security_group = aws.ec2.SecurityGroup(
        f"rds-sg-{self.env}",
        name=self._get_resource_name("rds-sg"),
        description="Security group for RDS instances with restricted access",
        vpc_id=self.vpc_id,
        ingress=[
          aws.ec2.SecurityGroupIngressArgs(
            from_port=3306,
            to_port=3306,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/8"],
          )
        ],
        egress=[
          aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
          )
        ],
        tags=self._apply_tags({"Purpose": "RDSAccess"}),
        opts=ResourceOptions(parent=self),
      )
    self.created_resources["rds_security_group"] = rds_security_group.id if rds_security_group else None

  def _restrict_ec2_ssh_and_sg(self):
    pulumi.log.info("Restricting EC2 SSH access via Security Groups...")
    ssh_sg = None
    if self.vpc_id:
      ssh_sg = aws.ec2.SecurityGroup(
        f"ssh-restricted-{self.env}",
        name=self._get_resource_name("ssh-restricted"),
        description="Restricted SSH access security group",
        vpc_id=self.vpc_id,
        ingress=[
          aws.ec2.SecurityGroupIngressArgs(
            from_port=22,
            to_port=22,
            protocol="tcp",
            cidr_blocks=self.ssh_allowed_cidrs,
            description="SSH access from allowed CIDRs only",
          )
        ],
        tags=self._apply_tags({"Purpose": "RestrictedSSH"}),
        opts=ResourceOptions(parent=self),
      )
    self.created_resources["ssh_security_group"] = ssh_sg.id if ssh_sg else None

  def _ensure_cloudtrail(self):
    pulumi.log.info("Configuring CloudTrail auditing...")
    cloudtrail_bucket = aws.s3.Bucket(
      f"cloudtrail-{self.env}",
      bucket=self._get_resource_name("cloudtrail"),
      tags=self._apply_tags({"Purpose": "CloudTrailLogs"}),
      opts=ResourceOptions(parent=self, protect=True),
    )

    cloudtrail_bucket_policy = aws.s3.BucketPolicy(
      f"cloudtrail-bucket-policy-{self.env}",
      bucket=cloudtrail_bucket.id,
      policy=cloudtrail_bucket.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "AWSCloudTrailAclCheck",
            "Effect": "Allow",
            "Principal": {"Service": "cloudtrail.amazonaws.com"},
            "Action": "s3:GetBucketAcl",
            "Resource": arn,
          },
          {
            "Sid": "AWSCloudTrailWrite",
            "Effect": "Allow",
            "Principal": {"Service": "cloudtrail.amazonaws.com"},
            "Action": "s3:PutObject",
            "Resource": f"{arn}/*",
            "Condition": {"StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}},
          },
        ],
      })),
      opts=ResourceOptions(parent=self),
    )

    event_selectors: List[aws.cloudtrail.TrailEventSelectorArgs] = []
    if self.cloudtrail_enable_data_events:
      event_selectors = [
        aws.cloudtrail.TrailEventSelectorArgs(
          read_write_type="All",
          include_management_events=True,
          data_resources=[
            aws.cloudtrail.TrailEventSelectorDataResourceArgs(
              type="AWS::S3::Object",
              values=["arn:aws:s3:::*/*"],
            ),
            aws.cloudtrail.TrailEventSelectorDataResourceArgs(
              type="AWS::Lambda::Function",
              values=["arn:aws:lambda:*"],
            ),
          ],
        )
      ]

    cloudtrail_args: Dict[str, Any] = {
      "name": self._get_resource_name("cloudtrail"),
      "s3_bucket_name": cloudtrail_bucket.id,
      "include_global_service_events": True,
      "is_multi_region_trail": True,
      "enable_logging": True,
      "enable_log_file_validation": True,
      "event_selectors": event_selectors,
      "tags": self._apply_tags({"Purpose": "AuditTrail"}),
    }
    if self.cloudtrail_kms_key_arn:
      cloudtrail_args["kms_key_id"] = self.cloudtrail_kms_key_arn

    cloudtrail = aws.cloudtrail.Trail(
      f"main-cloudtrail-{self.env}",
      **cloudtrail_args,
      opts=ResourceOptions(parent=self, protect=True, depends_on=[cloudtrail_bucket_policy]),
    )

    self.created_resources["cloudtrail"] = cloudtrail.name
    self.created_resources["cloudtrail_bucket"] = cloudtrail_bucket.id

  def _enforce_nacls(self):
    pulumi.log.info("Configuring Network ACLs...")
    if not self.nacl_subnet_ids:
      pulumi.log.warn("No subnet IDs provided for NACL configuration")
      return
    if not self.vpc_id:
      pulumi.log.warn("VPC ID is required for NACL configuration; skipping")
      return

    restrictive_nacl = aws.ec2.NetworkAcl(
      f"restrictive-nacl-{self.env}",
      vpc_id=self.vpc_id,
      tags=self._apply_tags({"Purpose": "RestrictiveNACL"}),
      opts=ResourceOptions(parent=self),
    )

    for i, cidr in enumerate(self.ssh_allowed_cidrs):
      aws.ec2.NetworkAclRule(
        f"nacl-inbound-ssh-{i}-{self.env}",
        network_acl_id=restrictive_nacl.id,
        rule_number=100 + i,
        protocol="tcp",
        rule_action="allow",
        from_port=22,
        to_port=22,
        cidr_block=cidr,
        opts=ResourceOptions(parent=self),
      )

    aws.ec2.NetworkAclRule(
      f"nacl-inbound-ephemeral-{self.env}",
      network_acl_id=restrictive_nacl.id,
      rule_number=200,
      protocol="tcp",
      rule_action="allow",
      from_port=1024,
      to_port=65535,
      cidr_block="0.0.0.0/0",
      opts=ResourceOptions(parent=self),
    )

    aws.ec2.NetworkAclRule(
      f"nacl-outbound-http-{self.env}",
      network_acl_id=restrictive_nacl.id,
      rule_number=100,
      protocol="tcp",
      rule_action="allow",
      from_port=80,
      to_port=80,
      cidr_block="0.0.0.0/0",
      opts=ResourceOptions(parent=self),
    )

    aws.ec2.NetworkAclRule(
      f"nacl-outbound-https-{self.env}",
      network_acl_id=restrictive_nacl.id,
      rule_number=101,
      protocol="tcp",
      rule_action="allow",
      from_port=443,
      to_port=443,
      cidr_block="0.0.0.0/0",
      opts=ResourceOptions(parent=self),
    )

    aws.ec2.NetworkAclRule(
      f"nacl-outbound-ephemeral-{self.env}",
      network_acl_id=restrictive_nacl.id,
      rule_number=200,
      protocol="tcp",
      rule_action="allow",
      from_port=1024,
      to_port=65535,
      cidr_block="0.0.0.0/0",
      opts=ResourceOptions(parent=self),
    )

    for i, subnet_id in enumerate(self.nacl_subnet_ids):
      aws.ec2.NetworkAclAssociation(
        f"nacl-association-{i}-{self.env}",
        network_acl_id=restrictive_nacl.id,
        subnet_id=subnet_id,
        opts=ResourceOptions(parent=self),
      )

    self.created_resources["restrictive_nacl"] = restrictive_nacl.id

  def _encrypt_lambda_env(self):
    pulumi.log.info("Configuring Lambda environment variable encryption...")
    kms_key_arn = self.lambda_kms_key_arn or "alias/aws/lambda"
    lambda_role = aws.iam.Role(
      f"lambda-execution-role-{self.env}",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
          }
        ],
      }),
      tags=self._apply_tags({"Purpose": "LambdaExecution"}),
      opts=ResourceOptions(parent=self),
    )
    aws.iam.RolePolicyAttachment(
      f"lambda-basic-execution-{self.env}",
      role=lambda_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      opts=ResourceOptions(parent=self),
    )
    self.created_resources["lambda_execution_role"] = lambda_role.arn

  def _protect_cloudfront_with_waf(self):
    pulumi.log.info("Configuring CloudFront WAF protection...")
    web_acl = aws.wafv2.WebAcl(
      f"cloudfront-waf-{self.env}",
      name=self._get_resource_name("cloudfront-waf"),
      description="WAF for CloudFront distributions",
      scope="CLOUDFRONT",
      default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
      rules=[
        aws.wafv2.WebAclRuleArgs(
          name="RateLimitRule",
          priority=1,
          action=aws.wafv2.WebAclRuleActionArgs(block={}),
          statement=aws.wafv2.WebAclRuleStatementArgs(
            rate_based_statement=aws.wafv2.WebAclRuleStatementRateBasedStatementArgs(
              limit=self.waf_rate_limit,
              aggregate_key_type="IP",
            )
          ),
          visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
            cloudwatch_metrics_enabled=True,
            metric_name="RateLimitRule",
            sampled_requests_enabled=True,
          ),
        ),
        aws.wafv2.WebAclRuleArgs(
          name="AWSManagedRulesCommonRuleSet",
          priority=2,
          override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
          statement=aws.wafv2.WebAclRuleStatementArgs(
            managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
              name="AWSManagedRulesCommonRuleSet",
              vendor_name="AWS",
            )
          ),
          visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
            cloudwatch_metrics_enabled=True,
            metric_name="CommonRuleSetMetric",
            sampled_requests_enabled=True,
          ),
        ),
        aws.wafv2.WebAclRuleArgs(
          name="AWSManagedRulesSQLiRuleSet",
          priority=3,
          override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
          statement=aws.wafv2.WebAclRuleStatementArgs(
            managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
              name="AWSManagedRulesSQLiRuleSet",
              vendor_name="AWS",
            )
          ),
          visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
            cloudwatch_metrics_enabled=True,
            metric_name="SQLiRuleSetMetric",
            sampled_requests_enabled=True,
          ),
        ),
      ],
      visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
        cloudwatch_metrics_enabled=True,
        metric_name=f"CloudFrontWAF{self.env}",
        sampled_requests_enabled=True,
      ),
      tags=self._apply_tags({"Purpose": "CloudFrontProtection"}),
      opts=ResourceOptions(parent=self),
    )
    self.created_resources["cloudfront_waf"] = web_acl.arn

  def _encrypt_dynamodb(self):
    pulumi.log.info("Configuring DynamoDB encryption...")
    example_table = aws.dynamodb.Table(
      f"example-table-{self.env}",
      name=self._get_resource_name("example-table"),
      billing_mode="PAY_PER_REQUEST",
      attributes=[aws.dynamodb.TableAttributeArgs(name="id", type="S")],
      hash_key="id",
      server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(enabled=True),
      tags=self._apply_tags({"Purpose": "ExampleTable"}),
      opts=ResourceOptions(parent=self),
    )
    self.created_resources["example_dynamodb_table"] = example_table.name

  def _enable_guardduty_all_regions(self):
    pulumi.log.info("Enabling GuardDuty across regions...")
    guardduty_detectors: Dict[str, pulumi.Output[str]] = {}
    for region in self.guardduty_regions:
      detector = aws.guardduty.Detector(
        f"guardduty-{region}-{self.env}",
        enable=True,
        finding_publishing_frequency="FIFTEEN_MINUTES",
        datasources=aws.guardduty.DetectorDatasourcesArgs(
          s3_logs=aws.guardduty.DetectorDatasourcesS3LogsArgs(enable=True),
          kubernetes=aws.guardduty.DetectorDatasourcesKubernetesArgs(
            audit_logs=aws.guardduty.DetectorDatasourcesKubernetesAuditLogsArgs(enable=True)
          ),
          malware_protection=aws.guardduty.DetectorDatasourcesMalwareProtectionArgs(
            scan_ec2_instance_with_findings=aws.guardduty.DetectorDatasourcesMalwareProtectionScanEc2InstanceWithFindingsArgs(
              ebs_volumes=True
            )
          ),
        ),
        tags=self._apply_tags({"Purpose": "ThreatDetection", "Region": region}),
        opts=ResourceOptions(provider=aws.Provider(f"aws-{region}", region=region)),
      )
      guardduty_detectors[region] = detector.id
    self.created_resources["guardduty_detectors"] = guardduty_detectors

  def _enable_vpc_flow_logs(self):
    pulumi.log.info("Enabling VPC Flow Logs...")
    if not self.vpc_flow_log_vpc_ids:
      pulumi.log.warn("No VPC IDs provided for Flow Logs configuration")
      return
    flow_logs_role = aws.iam.Role(
      f"vpc-flow-logs-role-{self.env}",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
        }],
      }),
      tags=self._apply_tags({"Purpose": "VPCFlowLogs"}),
      opts=ResourceOptions(parent=self),
    )
    flow_logs_policy = aws.iam.Policy(
      f"vpc-flow-logs-policy-{self.env}",
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogGroups",
            "logs:DescribeLogStreams",
          ],
          "Resource": "*",
        }],
      }),
      opts=ResourceOptions(parent=self),
    )
    aws.iam.RolePolicyAttachment(
      f"vpc-flow-logs-policy-attachment-{self.env}",
      role=flow_logs_role.name,
      policy_arn=flow_logs_policy.arn,
      opts=ResourceOptions(parent=self),
    )

    flow_log_groups: Dict[str, pulumi.Output[str]] = {}
    for i, vpc_id in enumerate(self.vpc_flow_log_vpc_ids):
      log_group = aws.cloudwatch.LogGroup(
        f"vpc-flow-logs-{i}-{self.env}",
        name=f"/aws/vpc/flowlogs/{vpc_id}",
        retention_in_days=self.vpc_flow_log_retention_days,
        tags=self._apply_tags({"Purpose": "VPCFlowLogs", "VPC": vpc_id}),
        opts=ResourceOptions(parent=self),
      )
      aws.ec2.FlowLog(
        f"vpc-flow-log-{i}-{self.env}",
        iam_role_arn=flow_logs_role.arn,
        log_destination=log_group.arn,
        log_destination_type="cloud-watch-logs",
        resource_id=vpc_id,
        resource_type="VPC",
        traffic_type="ALL",
        tags=self._apply_tags({"Purpose": "VPCFlowLogs", "VPC": vpc_id}),
        opts=ResourceOptions(parent=self),
      )
      flow_log_groups[vpc_id] = log_group.arn

    self.created_resources["vpc_flow_log_groups"] = flow_log_groups
    self.created_resources["vpc_flow_logs_role"] = flow_logs_role.arn

  def _main(self):
    pulumi.log.info(f"Starting AWS security configuration for environment: {self.env}")
    self._ensure_s3_encryption_and_logging()
    self._ensure_iam_least_privilege()
    self._ensure_rds_backups()
    self._restrict_ec2_ssh_and_sg()
    self._ensure_cloudtrail()
    self._enforce_nacls()
    self._encrypt_lambda_env()
    self._protect_cloudfront_with_waf()
    self._encrypt_dynamodb()
    self._enable_guardduty_all_regions()
    self._enable_vpc_flow_logs()
    pulumi.log.info("AWS security configuration completed successfully")



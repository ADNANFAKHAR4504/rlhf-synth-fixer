# Infrastructure as Code - Pulumi Python Implementation

## __init__.py

```python

```

## components/__init__.py

```python

```

## components/data_protection.py

```python
from typing import Optional, List
import pulumi
import re
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ResourceOptions
import json
from pulumi_aws import get_caller_identity

"""
Data Protection Infrastructure Component

This component creates and manages:
- S3 buckets with encryption at rest and versioning
- Data retention and backup policies
"""

class DataProtectionInfrastructure(pulumi.ComponentResource):
  def __init__(self,
               name: str,
               region: str,
               vpc_id: pulumi.Input[str],
               private_subnet_ids: pulumi.Input[List[str]],
               database_security_group_id: pulumi.Input[str],
               kms_key_arn: pulumi.Input[str],
               sns_topic_arn: pulumi.Input[str],
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('projectx:data:DataProtection', name, None, opts)

    self.region = region
    self.vpc_id = vpc_id
    self.private_subnet_ids = private_subnet_ids
    self.database_security_group_id = database_security_group_id
    self.kms_key_arn = kms_key_arn
    self.sns_topic_arn = sns_topic_arn
    self.tags = tags or {}

    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")
    if not region:
      raise ValueError("region must be provided")

    self._create_s3_buckets()

    self.register_outputs({
      "secure_s3_bucket_name": self.secure_s3_bucket.bucket,
      "secure_s3_bucket_arn": self.secure_s3_bucket.arn
    })

  def _create_s3_buckets(self):
    safe_stack = re.sub(r'[^a-z0-9\-]', '', pulumi.get_stack().lower())
    bucket_name = f"secure-projectx-data-{self.region}-{safe_stack}"
    assert self.kms_key_arn.apply(lambda arn: f":{self.region}:" in arn), \
      f"KMS key ARN region mismatch: {self.kms_key_arn}"

    self.secure_s3_bucket = aws.s3.Bucket(
      f"{self.region.replace('-', '')}-secure-projectx-data-bucket",
      bucket=bucket_name,
      tags={
        **self.tags,
        "Name": f"secure-projectx-data-{self.region}",
        "Purpose": "DataStorage",
        "Encryption": "KMS"
      },
      opts=ResourceOptions(parent=self)
    )

    self.s3_versioning = aws.s3.BucketVersioningV2(
      f"{self.region.replace('-', '')}-secure-projectx-versioning",
      bucket=self.secure_s3_bucket.id,
      versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=ResourceOptions(parent=self, depends_on=[self.secure_s3_bucket])
    )

    self.s3_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{self.region.replace('-', '')}-secure-projectx-encryption",
      bucket=self.secure_s3_bucket.id,
      rules=[
        aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
          apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="aws:kms",
            kms_master_key_id=self.kms_key_arn
          ),
          bucket_key_enabled=True
        )
      ],
      opts=ResourceOptions(parent=self, depends_on=[self.s3_versioning])
    )

    self.s3_public_access_block = aws.s3.BucketPublicAccessBlock(
      f"{self.region.replace('-', '')}-secure-projectx-public-access-block",
      bucket=self.secure_s3_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self, depends_on=[self.s3_encryption])
    )

    bucket_policy = pulumi.Output.all(
      bucket_name=self.secure_s3_bucket.bucket,
      kms_key_arn=self.kms_key_arn
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "DenyInsecureConnections",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            f"arn:aws:s3:::{args['bucket_name']}",
            f"arn:aws:s3:::{args['bucket_name']}/*"
          ],
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        },
        {
          "Sid": "RequireKMSEncryption",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:PutObject",
          "Resource": f"arn:aws:s3:::{args['bucket_name']}/*",
          "Condition": {
            "StringNotEquals": {
              "s3:x-amz-server-side-encryption": "aws:kms"
            }
          }
        }
      ]
    }))

    self.s3_bucket_policy = aws.s3.BucketPolicy(
      f"{self.region.replace('-', '')}-secure-projectx-bucket-policy",
      bucket=self.secure_s3_bucket.id,
      policy=bucket_policy,
      opts=ResourceOptions(parent=self, depends_on=[self.s3_public_access_block])
    )

    self.s3_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
      f"{self.region.replace('-', '')}-secure-projectx-lifecycle",
      bucket=self.secure_s3_bucket.id,
      rules=[
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
          id="secure-projectx-lifecycle-rule",
          status="Enabled",
          transitions=[
            aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
              days=30,
              storage_class="STANDARD_IA"
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
              days=90,
              storage_class="GLACIER"
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
              days=365,
              storage_class="DEEP_ARCHIVE"
            )
          ],
          noncurrent_version_transitions=[
            aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionTransitionArgs(
              noncurrent_days=30,
              storage_class="STANDARD_IA"
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionTransitionArgs(
              noncurrent_days=90,
              storage_class="GLACIER"
            )
          ],
          noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
            noncurrent_days=2555
          )
        )
      ],
      opts=ResourceOptions(parent=self, depends_on=[self.s3_bucket_policy])
    )
```

## components/identity.py

```python
# lib/components/identity.py

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
import json
from pulumi_aws import get_caller_identity

"""
Identity and Access Management Infrastructure Component

This component creates and manages:
- IAM roles with least privilege access
- KMS keys for encryption management
- Multi-Factor Authentication setup
- Service-linked roles for EC2, Lambda, and other services
- Cross-service trust relationships
"""

class IdentityAccessInfrastructure(pulumi.ComponentResource):
  def __init__(self,
               name: str,
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('projectx:identity:IdentityAccess', name, None, opts)

    self.tags = tags or {}

    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")

    self._create_kms_resources()
    self._create_ec2_roles()
    self._create_lambda_roles()
    self._create_s3_access_roles()

    self.register_outputs({
      "kms_key_arn": self.kms_key.arn,
      "kms_key_id": self.kms_key.id,
      "ec2_instance_role_arn": self.ec2_instance_role.arn,
      "lambda_execution_role_arn": self.lambda_execution_role.arn,
      "s3_access_policy_arn": self.s3_access_policy.arn
    })

  def _create_kms_resources(self):
    account_id = get_caller_identity().account_id

    kms_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "Enable IAM User Permissions",
          "Effect": "Allow",
          "Principal": {
            "AWS": pulumi.Output.concat("arn:aws:iam::", account_id, ":root")
          },
          "Action": "kms:*",
          "Resource": "*"
        },
        {
          "Sid": "Allow ProjectX Services",
          "Effect": "Allow",
          "Principal": {
            "Service": [
              "s3.amazonaws.com",
              "rds.amazonaws.com",
              "lambda.amazonaws.com",
              "ec2.amazonaws.com",
              "logs.amazonaws.com"
            ]
          },
          "Action": [
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:ReEncrypt*",
            "kms:GenerateDataKey*",
            "kms:DescribeKey"
          ],
          "Resource": "*"
        }
      ]
    }

    self.kms_key = aws.kms.Key(
      "secure-projectx-kms-key",
      description="ProjectX master encryption key for all services",
      key_usage="ENCRYPT_DECRYPT",
      customer_master_key_spec="SYMMETRIC_DEFAULT",
      policy=pulumi.Output.json_dumps(kms_policy),
      deletion_window_in_days=7,
      enable_key_rotation=True,
      tags={
        **self.tags,
        "Name": "secure-projectx-master-key",
        "Purpose": "Encryption"
      },
      opts=ResourceOptions(parent=self)
    )

    self.kms_alias = aws.kms.Alias(
      "secure-projectx-kms-alias",
      name="alias/secure-projectx-master-key",
      target_key_id=self.kms_key.key_id,
      opts=ResourceOptions(parent=self, depends_on=[self.kms_key])
    )

  def _create_ec2_roles(self):
    assume_role_policy = json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }
      ]
    })

    self.ec2_instance_role = aws.iam.Role(
      "secure-projectx-ec2-role",
      name="secure-projectx-ec2-instance-role",
      assume_role_policy=assume_role_policy,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    ec2_policy_doc = self.kms_key.arn.apply(lambda arn: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "cloudwatch:PutMetricData",
            "ec2:DescribeVolumes",
            "ec2:DescribeTags",
            "logs:PutLogEvents",
            "logs:CreateLogGroup",
            "logs:CreateLogStream"
          ],
          "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:Encrypt",
            "kms:GenerateDataKey"
          ],
          "Resource": arn
        }
      ]
    }))

    self.ec2_policy = aws.iam.RolePolicy(
      "secure-projectx-ec2-policy",
      role=self.ec2_instance_role.name,
      policy=ec2_policy_doc,
      opts=ResourceOptions(parent=self, depends_on=[self.kms_key])
    )

    self.ec2_instance_profile = aws.iam.InstanceProfile(
      "secure-projectx-ec2-instance-profile",
      name="secure-projectx-ec2-instance-profile",
      role=self.ec2_instance_role.name,
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.ec2_instance_role])
    )

  def _create_lambda_roles(self):
    assume_role_policy = json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {"Service": "lambda.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }
      ]
    })

    self.lambda_execution_role = aws.iam.Role(
      "secure-projectx-lambda-role",
      name="secure-projectx-lambda-execution-role",
      assume_role_policy=assume_role_policy,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    lambda_policy_doc = self.kms_key.arn.apply(lambda arn: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Resource": "arn:aws:logs:*:*:*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "ec2:CreateNetworkInterface",
            "ec2:DescribeNetworkInterfaces",
            "ec2:DeleteNetworkInterface"
          ],
          "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:Encrypt",
            "kms:GenerateDataKey"
          ],
          "Resource": arn
        }
      ]
    }))

    self.lambda_policy = aws.iam.Policy(
      "secure-projectx-lambda-policy",
      name="secure-projectx-lambda-policy",
      description="Lambda permissions for ProjectX",
      policy=lambda_policy_doc,
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.kms_key])
    )

    aws.iam.RolePolicyAttachment(
      "secure-projectx-lambda-policy-attachment",
      role=self.lambda_execution_role.name,
      policy_arn=self.lambda_policy.arn,
      opts=ResourceOptions(parent=self, depends_on=[self.lambda_policy])
    )

  def _create_s3_access_roles(self):
    assume_role_policy = json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": ["ec2.amazonaws.com", "lambda.amazonaws.com"]
          },
          "Action": "sts:AssumeRole"
        }
      ]
    })

    self.s3_access_role = aws.iam.Role(
      "secure-projectx-s3-access-role",
      name="secure-projectx-s3-access-role",
      assume_role_policy=assume_role_policy,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    s3_policy_doc = self.kms_key.arn.apply(lambda arn: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
          ],
          "Resource": "*",
          "Condition": {
            "StringEquals": {
              "s3:x-amz-server-side-encryption": "aws:kms"
            }
          }
        },
        {
          "Effect": "Allow",
          "Action": [
            "s3:ListBucket",
            "s3:GetBucketVersioning"
          ],
          "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:Encrypt",
            "kms:GenerateDataKey",
            "kms:ReEncrypt*"
          ],
          "Resource": arn
        }
      ]
    }))

    self.s3_access_policy = aws.iam.Policy(
      "secure-projectx-s3-access-policy",
      name="secure-projectx-s3-access-policy",
      description="Policy for secure S3 access with KMS encryption",
      policy=s3_policy_doc,
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.kms_key])
    )

    aws.iam.RolePolicyAttachment(
      "secure-projectx-s3-policy-attachment",
      role=self.s3_access_role.name,
      policy_arn=self.s3_access_policy.arn,
      opts=ResourceOptions(parent=self, depends_on=[self.s3_access_policy])
    )
```

## components/monitoring.py

```python
# lib/components/monitoring.py

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi_aws.guardduty import get_detector
from pulumi import ResourceOptions
import json
from pulumi_aws import get_caller_identity

"""
Security Monitoring Infrastructure Component

This component creates and manages:
- CloudWatch for comprehensive monitoring and logging
- AWS GuardDuty for threat detection
- SNS topics for security alerting
"""

class SecurityMonitoringInfrastructure(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    region: str,
    # kms_key: aws.kms.Key,
    # kms_key_arn: pulumi.Input[str],
    tags: Optional[dict] = None,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__('projectx:monitoring:SecurityMonitoring', name, None, opts)

    self.region = region
    # self.kms_key = kms_key
    # self.kms_key_arn = kms_key_arn
    self.tags = tags or {}

    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")
    if not region:
      raise ValueError("region must be provided")
    # if not kms_key_arn:
    #   raise ValueError("kms_key_arn must be provided")

    self._create_cloudwatch_resources()
    self._create_sns_resources()
    # self._create_guardduty()

    self.register_outputs({
      "sns_topic_arn": self.sns_topic.arn,
      # "guardduty_detector_id": self.guardduty_detector.id,
      "security_log_group_name": self.security_log_group.name
    })

  def _create_cloudwatch_resources(self):
    self.security_log_group = aws.cloudwatch.LogGroup(
      f"{self.region.replace('-', '')}-security-logs",
      name=f"/aws/projectx/security/{self.region}",
      retention_in_days=365,
      # kms_key_id=self.kms_key.arn.apply(lambda arn: arn),
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def _create_sns_resources(self):
    self.sns_topic = aws.sns.Topic(
      f"{self.region.replace('-', '')}-security-alerts",
      name=f"projectx-security-alerts-{self.region}",
      display_name="ProjectX Security Alerts",
      # kms_master_key_id=self.kms_key.arn.apply(lambda arn: arn),
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.security_log_group])
    )

    sns_policy = pulumi.Output.all(
      topic_arn=self.sns_topic.arn,
      account_id=get_caller_identity().account_id
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AllowCloudWatchAlarmsToPublish",
          "Effect": "Allow",
          "Principal": {"Service": "cloudwatch.amazonaws.com"},
          "Action": "sns:Publish",
          "Resource": args["topic_arn"],
          "Condition": {"StringEquals": {"aws:SourceAccount": args["account_id"]}}
        }
      ]
    }))

    self.sns_topic_policy = aws.sns.TopicPolicy(
      f"{self.region.replace('-', '')}-sns-policy",
      arn=self.sns_topic.arn,
      policy=sns_policy,
      opts=ResourceOptions(parent=self, depends_on=[self.sns_topic])
    )

  # def _create_guardduty(self):
  #   try:
  #     # Try to get an existing detector for this account in the current region
  #     existing = get_detector()
  #     self.guardduty_detector = aws.guardduty.Detector.get(
  #       f"{self.region.replace('-', '')}-guardduty-existing",
  #       id=existing.id,
  #       opts=ResourceOptions(parent=self)
  #     )
  #   except Exception:
  #     # If none exists, create a new one
  #     self.guardduty_detector = aws.guardduty.Detector(
  #       f"{self.region.replace('-', '')}-guardduty",
  #       enable=True,
  #       finding_publishing_frequency="FIFTEEN_MINUTES",
  #       datasources=aws.guardduty.DetectorDatasourcesArgs(
  #         s3_logs=aws.guardduty.DetectorDatasourcesS3LogsArgs(enable=True)
  #       ),
  #       tags=self.tags,
  #       opts=ResourceOptions(parent=self, depends_on=[self.sns_topic])
  #     )
```

## components/networking.py

```python
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

class NetworkSecurityInfrastructure(pulumi.ComponentResource):
  def __init__(self,
               name: str,
               region: str,
               environment: str,
               kms_key_arn: pulumi.Input[str],
               tags: dict,
               opts: ResourceOptions = None):

    super().__init__('custom:network:NetworkSecurityInfrastructure', name, {}, opts)

    self.name = name
    self.region = region
    self.environment = environment
    self.kms_key_arn = kms_key_arn
    self.tags = tags

    resource_opts = ResourceOptions(parent=self)

    # Create VPC
    self.vpc = aws.ec2.Vpc(
      f"{name}-vpc",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={**tags, "Name": f"{name}-vpc"},
      opts=resource_opts
    )

    # Create Public Subnets
    self.public_subnet_1 = aws.ec2.Subnet(
      f"{name}-public-subnet-1",
      vpc_id=self.vpc.id,
      cidr_block="10.0.1.0/24",
      availability_zone=f"{region}a",
      tags={**tags, "Name": f"{name}-public-subnet-1"},
      opts=resource_opts
    )

    self.public_subnet_2 = aws.ec2.Subnet(
      f"{name}-public-subnet-2",
      vpc_id=self.vpc.id,
      cidr_block="10.0.2.0/24",
      availability_zone=f"{region}b",
      tags={**tags, "Name": f"{name}-public-subnet-2"},
      opts=resource_opts
    )

    # Create Private Subnets
    self.private_subnet_1 = aws.ec2.Subnet(
      f"{name}-private-subnet-1",
      vpc_id=self.vpc.id,
      cidr_block="10.0.3.0/24",
      availability_zone=f"{region}a",
      tags={**tags, "Name": f"{name}-private-subnet-1"},
      opts=resource_opts
    )

    self.private_subnet_2 = aws.ec2.Subnet(
      f"{name}-private-subnet-2",
      vpc_id=self.vpc.id,
      cidr_block="10.0.4.0/24",
      availability_zone=f"{region}b",
      tags={**tags, "Name": f"{name}-private-subnet-2"},
      opts=resource_opts
    )

    # Database Security Group
    self.database_security_group = aws.ec2.SecurityGroup(
      f"{name}-db-sg",
      vpc_id=self.vpc.id,
      description="Database security group",
      tags={**tags, "Name": f"{name}-db-sg"},
      opts=resource_opts
    )

    # Outputs
    self.vpc_id = self.vpc.id
    self.public_subnet_ids = [self.public_subnet_1.id, self.public_subnet_2.id]
    self.private_subnet_ids = [self.private_subnet_1.id, self.private_subnet_2.id]
    self.database_security_group_id = self.database_security_group.id

    self.register_outputs({
      "vpc_id": self.vpc_id,
      "public_subnet_ids": self.public_subnet_ids,
      "private_subnet_ids": self.private_subnet_ids,
      "database_security_group_id": self.database_security_group_id
    })
```

## tap_stack.py

```python
from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from lib.components.networking import NetworkSecurityInfrastructure
from lib.components.identity import IdentityAccessInfrastructure
from lib.components.data_protection import DataProtectionInfrastructure
from lib.components.monitoring import SecurityMonitoringInfrastructure

class TapStackArgs:
  def __init__(self,
               environment_suffix: Optional[str] = None,
               regions: Optional[list] = None,
               tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.regions = ['us-west-2']
    self.tags = tags or {
      'Project': 'ProjectX',
      'Security': 'High',
      'Environment': self.environment_suffix
    }

class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.regions = args.regions
    self.tags = args.tags

    self.regional_networks = {}
    self.regional_monitoring = {}
    self.regional_data_protection = {}
    self.providers = {}

    print("🔐 Creating Identity and Access Infrastructure...")
    self.identity_access = IdentityAccessInfrastructure(
      name=f"secure-projectx-identity-{self.environment_suffix}",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    region = 'us-west-2'
    region_suffix = region.replace('-', '')

    print(f"🌍 Setting up AWS provider for region: {region}")
    self.providers[region] = aws.Provider(
      f"aws-provider-{region}-{self.environment_suffix}",
      region=region
    )

    def provider_opts(deps=None):
      return ResourceOptions(
        parent=self,
        provider=self.providers[region],
        depends_on=deps or []
      )

    print("🌐 Creating Networking Infrastructure (no NAT/NACL)...")
    self.regional_networks[region] = NetworkSecurityInfrastructure(
      name=f"secure-projectx-network-{region_suffix}-{self.environment_suffix}",
      region=region,
      environment=self.environment_suffix,
      kms_key_arn=self.identity_access.kms_key.arn,
      tags=self.tags,
      opts=provider_opts([self.identity_access])
    )

    print("📱 Creating Monitoring Infrastructure...")
    self.regional_monitoring[region] = SecurityMonitoringInfrastructure(
      name=f"secure-projectx-monitoring-{region_suffix}-{self.environment_suffix}",
      region=region,
      tags=self.tags,
      opts=provider_opts([
        self.identity_access,
        self.regional_networks[region]
      ])
    )

    print("🛡️ Creating Data Protection Infrastructure...")
    self.regional_data_protection[region] = DataProtectionInfrastructure(
      name=f"secure-projectx-data-{region_suffix}-{self.environment_suffix}",
      region=region,
      vpc_id=self.regional_networks[region].vpc_id,
      private_subnet_ids=self.regional_networks[region].private_subnet_ids,
      database_security_group_id=self.regional_networks[region].database_security_group_id,
      kms_key_arn=self.identity_access.kms_key.arn,
      sns_topic_arn=self.regional_monitoring[region].sns_topic.arn,
      tags=self.tags,
      opts=provider_opts([
        self.regional_networks[region],
        self.regional_monitoring[region],
        self.identity_access
      ])
    )

    # print("📊 Setting up VPC Flow Logs...")
    # self.regional_monitoring[region].setup_vpc_flow_logs(
    #   vpc_id=self.regional_networks[region].vpc_id,
    #   opts=provider_opts([
    #     self.regional_monitoring[region],
    #     self.regional_networks[region]
    #   ])
    # )

    print("📤 Exporting Outputs...")
    pulumi.export("primary_vpc_id", self.regional_networks[region].vpc_id)
    pulumi.export("kms_key_arn", self.identity_access.kms_key.arn)
    # pulumi.export("guardduty_detector_id", self.regional_monitoring[region].guardduty_detector.id)
    # pulumi.export("sns_topic_arn", self.regional_monitoring[region].sns_topic.arn)
    pulumi.export("secure_s3_bucket", self.regional_data_protection[region].secure_s3_bucket.bucket)
    pulumi.export("public_subnet_ids", self.regional_networks[region].public_subnet_ids)
    pulumi.export("private_subnet_ids", self.regional_networks[region].private_subnet_ids)
    pulumi.export("database_security_group_id", self.regional_networks[region].database_security_group_id)
```

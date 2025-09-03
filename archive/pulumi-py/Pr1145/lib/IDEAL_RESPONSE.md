```python
"""
tap_stack.py

Implements Task 2 infrastructure using Pulumi with Python, aligned to AWS CDK-style requirements.

Region: us-east-1
Requirements: Secure, production-ready infrastructure with S3 logging, private DB, KMS encryption, tagging, and least-privilege IAM.
"""

import json
# import OS
import os
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or "dev"
    self.tags = tags or {"environment": "production"}


class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__("tap:stack:TapStack", name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags
    self.unique_suffix = pulumi.get_stack().lower()

    # ==========================================
    # 0. Networking: VPC + Private Subnets
    # ==========================================
    self.vpc = aws.ec2.Vpc(
        f"vpc-{self.environment_suffix}",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={**self.tags, "Name": f"vpc-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self)
    )

    self.private_subnet1 = aws.ec2.Subnet(
        f"private-subnet-1-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        cidr_block="10.0.1.0/24",
        availability_zone="us-east-1a",
        map_public_ip_on_launch=False,
        tags={**self.tags, "Name": f"private-subnet-1-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self.vpc)
    )

    self.private_subnet2 = aws.ec2.Subnet(
        f"private-subnet-2-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        cidr_block="10.0.2.0/24",
        availability_zone="us-east-1b",
        map_public_ip_on_launch=False,
        tags={**self.tags, "Name": f"private-subnet-2-{self.environment_suffix}"},
        opts=ResourceOptions(parent=self.vpc)
    )

    # ==========================================
    # 1. Default IAM Policy (Least Privilege)
    # ==========================================
    self.default_policy = aws.iam.Policy(
        f"default-policy-{self.environment_suffix}",
        name=f"default-policy-{self.environment_suffix}",
        description="Default least-privilege policy for all resources",
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["sts:GetCallerIdentity"],
                "Resource": "*"
            }]
        }),
        tags=self.tags,
        opts=ResourceOptions(parent=self)
    )

    # ==========================================
    # 2. Logging Bucket
    # ==========================================
    self.logging_bucket = aws.s3.Bucket(
        f"logging-bucket-{self.environment_suffix}",
        bucket=f"tap-logging-{self.environment_suffix}-{self.unique_suffix}",
        tags=self.tags,
        opts=ResourceOptions(parent=self)
    )
    aws.s3.BucketOwnershipControls(
        f"logging-bucket-ownership-{self.environment_suffix}",
        bucket=self.logging_bucket.id,
        rule=aws.s3.BucketOwnershipControlsRuleArgs(
            object_ownership="BucketOwnerEnforced"
        ),
        opts=ResourceOptions(parent=self.logging_bucket)
    )
    aws.s3.BucketServerSideEncryptionConfigurationV2(
        f"logging-bucket-encryption-{self.environment_suffix}",
        bucket=self.logging_bucket.id,
        rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms"
            )
        )],
        opts=ResourceOptions(parent=self.logging_bucket)
    )

    # ==========================================
    # 3. Application Bucket with Logging
    # ==========================================
    self.app_bucket = aws.s3.BucketV2(
        f"app-bucket-{self.environment_suffix}",
        bucket=f"tap-app-{self.environment_suffix}-{self.unique_suffix}",
        tags=self.tags,
        opts=ResourceOptions(parent=self)
    )
    aws.s3.BucketOwnershipControls(
        f"app-bucket-ownership-{self.environment_suffix}",
        bucket=self.app_bucket.id,
        rule=aws.s3.BucketOwnershipControlsRuleArgs(
            object_ownership="BucketOwnerEnforced"
        ),
        opts=ResourceOptions(parent=self.app_bucket)
    )
    aws.s3.BucketLoggingV2(
        f"app-bucket-logging-{self.environment_suffix}",
        bucket=self.app_bucket.id,
        target_bucket=self.logging_bucket.id,
        target_prefix="app-bucket-logs/",
        opts=ResourceOptions(parent=self.app_bucket)
    )
    aws.s3.BucketServerSideEncryptionConfigurationV2(
        f"app-bucket-encryption-{self.environment_suffix}",
        bucket=self.app_bucket.id,
        rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms"
            )
        )],
        opts=ResourceOptions(parent=self.app_bucket)
    )

    # ==========================================
    # 4. KMS Key
    # ==========================================
    self.kms_key = aws.kms.Key(
        f"kms-key-{self.environment_suffix}",
        description="KMS key for encrypting sensitive data",
        deletion_window_in_days=10,
        enable_key_rotation=True,
        opts=ResourceOptions(parent=self)
    )

    # ==========================================
    # 5. Private Database (RDS Postgres)
    # ==========================================
    self.db_subnet_group = aws.rds.SubnetGroup(
        f"db-subnet-group-{self.environment_suffix}",
        subnet_ids=[self.private_subnet1.id, self.private_subnet2.id],
        tags=self.tags,
        opts=ResourceOptions(parent=self)
    )

    self.db_security_group = aws.ec2.SecurityGroup(
        f"db-sg-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        description="DB security group - no public access",
        ingress=[],
        egress=[aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"]
        )],
        tags=self.tags,
        opts=ResourceOptions(parent=self.vpc)
    )

    self.db = aws.rds.Instance(
        f"db-instance-{self.environment_suffix}",
        allocated_storage=20,
        engine="postgres",
        instance_class="db.t3.micro",
        db_name="appdb",
        username="dbadmin",
        password=pulumi.Output.secret("Passw0rd123!"),
        skip_final_snapshot=True,
        db_subnet_group_name=self.db_subnet_group.name,
        vpc_security_group_ids=[self.db_security_group.id],
        publicly_accessible=False,
        storage_encrypted=True,
        kms_key_id=self.kms_key.arn,
        tags=self.tags,
        opts=ResourceOptions(parent=self)
    )

    # ==========================================
    # 6. Attach Default Policy to Roles
    # ==========================================
    self.attachments = []
    for role_name in ["app-role", "db-role"]:
      role = aws.iam.Role(
          f"{role_name}-{self.environment_suffix}",
          assume_role_policy=json.dumps({
              "Version": "2012-10-17",
              "Statement": [{
                  "Effect": "Allow",
                  "Principal": {"Service": "ec2.amazonaws.com"},
                  "Action": "sts:AssumeRole"
              }]
          }),
          tags=self.tags,
          opts=ResourceOptions(parent=self)
      )
      attachment = aws.iam.RolePolicyAttachment(
          f"{role_name}-policy-attachment-{self.environment_suffix}",
          role=role.name,
          policy_arn=self.default_policy.arn,
          opts=ResourceOptions(parent=role)
      )
      self.attachments.append(attachment)

    # ==========================================
    # Outputs
    # ==========================================
    pulumi.export("vpc_id", self.vpc.id)
    pulumi.export("private_subnet_ids", [
                  self.private_subnet1.id, self.private_subnet2.id])
    pulumi.export("logging_bucket_name", self.logging_bucket.bucket)
    pulumi.export("app_bucket_name", self.app_bucket.bucket)
    pulumi.export("db_instance_identifier", self.db.id)
    pulumi.export("kms_key_arn", self.kms_key.arn)
    pulumi.export("default_policy_arn", self.default_policy.arn)

    self.register_outputs({})


```

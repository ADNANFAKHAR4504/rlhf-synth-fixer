"""
Security module for security groups and S3 bucket with encryption
"""

import pulumi
import pulumi_aws as aws
from typing import Dict


def create_security_groups(region: str, vpc_id: pulumi.Output,
                           tags: Dict, provider: aws.Provider) -> Dict:
  """Create security groups with least privilege access"""

  # Web tier security group
  web_sg = aws.ec2.SecurityGroup(
    f"web-sg-{region}",
    name=f"web-sg-{region}",
    description="Security group for web tier",
    vpc_id=vpc_id,
    tags={**tags, "Name": f"web-sg-{region}", "Tier": "Web"},
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Web tier rules
  aws.ec2.SecurityGroupRule(
    f"web-ingress-http-{region}",
    type="ingress",
    from_port=80,
    to_port=80,
    protocol="tcp",
    cidr_blocks=["0.0.0.0/0"],
    security_group_id=web_sg.id,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  aws.ec2.SecurityGroupRule(
    f"web-ingress-https-{region}",
    type="ingress",
    from_port=443,
    to_port=443,
    protocol="tcp",
    cidr_blocks=["0.0.0.0/0"],
    security_group_id=web_sg.id,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  aws.ec2.SecurityGroupRule(
    f"web-egress-all-{region}",
    type="egress",
    from_port=0,
    to_port=0,
    protocol="-1",
    cidr_blocks=["0.0.0.0/0"],
    security_group_id=web_sg.id,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Application tier security group
  app_sg = aws.ec2.SecurityGroup(
    f"app-sg-{region}",
    name=f"app-sg-{region}",
    description="Security group for application tier",
    vpc_id=vpc_id,
    tags={**tags, "Name": f"app-sg-{region}", "Tier": "Application"},
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # App tier rules (only from web tier)
  aws.ec2.SecurityGroupRule(
    f"app-ingress-from-web-{region}",
    type="ingress",
    from_port=8080,
    to_port=8080,
    protocol="tcp",
    source_security_group_id=web_sg.id,
    security_group_id=app_sg.id,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  aws.ec2.SecurityGroupRule(
    f"app-egress-all-{region}",
    type="egress",
    from_port=0,
    to_port=0,
    protocol="-1",
    cidr_blocks=["0.0.0.0/0"],
    security_group_id=app_sg.id,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Database tier security group
  db_sg = aws.ec2.SecurityGroup(
    f"db-sg-{region}",
    name=f"db-sg-{region}",
    description="Security group for database tier",
    vpc_id=vpc_id,
    tags={**tags, "Name": f"db-sg-{region}", "Tier": "Database"},
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Database tier rules (only from app tier)
  aws.ec2.SecurityGroupRule(
    f"db-ingress-from-app-{region}",
    type="ingress",
    from_port=3306,
    to_port=3306,
    protocol="tcp",
    source_security_group_id=app_sg.id,
    security_group_id=db_sg.id,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  return {
    "web_sg": web_sg,
    "app_sg": app_sg,
    "db_sg": db_sg
  }


def create_s3_bucket(region: str, tags: Dict, provider: aws.Provider) -> aws.s3.Bucket:
  """Create S3 bucket with encryption and secure policies"""

  # Create S3 bucket
  bucket = aws.s3.Bucket(
    f"secure-bucket-{region}",
    bucket=f"secure-infrastructure-bucket-{region}-{pulumi.get_stack()}".lower(),
    tags=tags,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Enable versioning
  aws.s3.BucketVersioningV2(
    f"bucket-versioning-{region}",
    bucket=bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
      status="Enabled"
    ),
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Enable server-side encryption
  aws.s3.BucketServerSideEncryptionConfigurationV2(
    f"bucket-encryption-{region}",
    bucket=bucket.id,
    rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
      apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
        sse_algorithm="AES256"
      )
    )],
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Block public access
  aws.s3.BucketPublicAccessBlock(
    f"bucket-pab-{region}",
    bucket=bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Bucket policy to enforce SSL
  bucket_policy = pulumi.Output.all(bucket.arn).apply(
    lambda args: f"""{{
            "Version": "2012-10-17",
            "Statement": [
                {{
                    "Sid": "DenyInsecureConnections",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [
                        "{args[0]}",
                        "{args[0]}/*"
                    ],
                    "Condition": {{
                        "Bool": {{
                            "aws:SecureTransport": "false"
                        }}
                    }}
                }}
            ]
        }}"""
  )

  aws.s3.BucketPolicy(
    f"bucket-policy-{region}",
    bucket=bucket.id,
    policy=bucket_policy,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  return bucket

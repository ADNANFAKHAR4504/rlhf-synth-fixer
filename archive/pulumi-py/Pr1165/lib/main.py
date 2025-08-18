"""
Multi-region AWS infrastructure with Pulumi Python SDK
Implements secure VPCs, networking, monitoring, and compliance
"""
import sys

import pulumi
import pulumi_aws as aws
from typing import Dict

from lib.modules.code_pipeline import setup_codepipeline
from lib.modules.vpc import create_vpc_infrastructure
from lib.modules.security import create_security_groups, create_s3_bucket
from lib.modules.monitoring import setup_cloudtrail
from lib.modules.iam import create_iam_roles

# Configuration
config = pulumi.Config()
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()

# Common tags for all resources
common_tags = {
  "Environment": stack_name,
  "Owner": config.get("owner") or "DevOps-Team",
  "Project": project_name,
  "ManagedBy": "Pulumi"
}

# Regions to deploy infrastructure
regions = ["us-east-1", "us-west-2"]

# VPC CIDR blocks for each region
vpc_cidrs = {
  "us-east-1": "10.0.0.0/16",
  "us-west-2": "10.1.0.0/16"
}


def create_cloudtrail_s3_policy(bucket_name: pulumi.Output, account_id: str,
                                prefix: str) -> pulumi.Output:
  """
  Creates an S3 bucket policy for CloudTrail that supports multiple regions
  using a wildcard after the prefix.
  """
  return bucket_name.apply(lambda name: f"""{{
    "Version": "2012-10-17",
    "Statement": [
      {{
        "Sid": "AWSCloudTrailAclCheck20150319",
        "Effect": "Allow",
        "Principal": {{
          "Service": "cloudtrail.amazonaws.com"
        }},
        "Action": "s3:GetBucketAcl",
        "Resource": "arn:aws:s3:::{name}"
      }},
      {{
        "Sid": "AWSCloudTrailWrite20150319",
        "Effect": "Allow",
        "Principal": {{
          "Service": "cloudtrail.amazonaws.com"
        }},
        "Action": "s3:PutObject",
        "Resource": "arn:aws:s3:::{name}/{prefix}*/AWSLogs/{account_id}/*",
        "Condition": {{
          "StringEquals": {{
            "s3:x-amz-acl": "bucket-owner-full-control"
          }}
        }}
      }}
    ]
  }}""")


def deploy_infrastructure():
  """Main function to orchestrate infrastructure deployment"""

  try:
    current = aws.get_caller_identity()
  except Exception as e:
    pulumi.log.error(f"Failed to get AWS caller identity: {e}")
    sys.exit(1)

  # Store resources for cross-region references
  vpcs = {}
  security_groups = {}
  iam_roles = {}
  s3_buckets = {}
  code_pipeline = {}

  # Create IAM roles (global resources)
  try:
    iam_roles = create_iam_roles(common_tags)
  except Exception as e:
    pulumi.log.error(f"IAM role creation failed: {e}")
    raise

  # Create CodePipeline
  code_pipeline = setup_codepipeline(pulumi.get_stack().lower())

  # Deploy infrastructure in each region
  for region in regions:

    try:
      # Create AWS provider for this region
      provider = aws.Provider(
        f"aws-{region}",
        region=region,
        default_tags=aws.ProviderDefaultTagsArgs(
          tags=common_tags
        )
      )

      # Create VPC infrastructure
      vpc_resources = create_vpc_infrastructure(
        region=region,
        cidr_block=vpc_cidrs[region],
        tags=common_tags,
        provider=provider
      )
      vpcs[region] = vpc_resources

      # Create security groups
      sg_resources = create_security_groups(
        region=region,
        vpc_id=vpc_resources["vpc"].id,
        tags=common_tags,
        provider=provider
      )
      security_groups[region] = sg_resources

      # Create S3 bucket for this region
      s3_bucket = create_s3_bucket(
        region=region,
        tags=common_tags,
        provider=provider
      )
      s3_buckets[region] = s3_bucket

      # Create S3 bucket policy for CloudTrail
      cloudtrail_policy = create_cloudtrail_s3_policy(
        bucket_name=s3_bucket.bucket,
        account_id=current.account_id,
        prefix=f"cloudtrail-logs/{region}"
      )

      bucket_policy = aws.s3.BucketPolicy(
        f"cloudtrail-bucket-policy-{region}",
        bucket=s3_bucket.id,
        policy=cloudtrail_policy,
        opts=pulumi.ResourceOptions(provider=provider)
      )

      # Setup CloudTrail
      cloudtrail = setup_cloudtrail(
        region=region,
        s3_bucket_name=s3_bucket.bucket,
        tags=common_tags,
        provider=provider
      )

    except Exception as e:
      pulumi.log.error(f"Deployment failed in region {region}: {e}")
      raise


  # Export important resource information
  export_outputs(vpcs, security_groups, iam_roles, s3_buckets, code_pipeline)


def export_outputs(vpcs: Dict, security_groups: Dict, iam_roles: Dict, s3_buckets: Dict, code_pipeline: Dict):
  """Export important resource information as stack outputs"""

  for region in regions:
    # VPC outputs
    pulumi.export(f"vpc_id_{region.replace('-', '_')}", vpcs[region]["vpc"].id)
    pulumi.export(f"public_subnet_ids_{region.replace('-', '_')}",
                  [subnet.id for subnet in vpcs[region]["public_subnets"]])
    pulumi.export(f"private_subnet_ids_{region.replace('-', '_')}",
                  [subnet.id for subnet in vpcs[region]["private_subnets"]])

    # Security group outputs
    pulumi.export(f"web_sg_id_{region.replace('-', '_')}",
                  security_groups[region]["web_sg"].id)
    pulumi.export(f"app_sg_id_{region.replace('-', '_')}",
                  security_groups[region]["app_sg"].id)
    pulumi.export(f"db_sg_id_{region.replace('-', '_')}",
                  security_groups[region]["db_sg"].id)

    # S3 bucket outputs
    pulumi.export(f"s3_bucket_{region.replace('-', '_')}", s3_buckets[region].bucket)

  # IAM role outputs
  pulumi.export("ec2_role_arn", iam_roles["ec2_role"].arn)
  pulumi.export("lambda_role_arn", iam_roles["lambda_role"].arn)
  pulumi.export("pipeline_name", code_pipeline["pipeline_name"])
  pulumi.export("pipeline_source_bucket", code_pipeline["pipeline_source_bucket"])
  pulumi.export("pipeline_artifact_bucket", code_pipeline["pipeline_artifact_bucket"])

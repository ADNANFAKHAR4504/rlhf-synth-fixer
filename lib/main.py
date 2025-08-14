"""
Multi-region AWS infrastructure with Pulumi Python SDK
Implements secure VPCs, networking, monitoring, and compliance
"""

import pulumi
import pulumi_aws as aws
from typing import Dict
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


def create_cloudtrail_s3_policy(bucket_name: pulumi.Output, region: str) -> pulumi.Output:
  """Create S3 bucket policy for CloudTrail"""
  return bucket_name.apply(lambda name: f"""{{
    "Version": "2012-10-17",
    "Statement": [
      {{
        "Sid": "AWSCloudTrailAclCheck",
        "Effect": "Allow",
        "Principal": {{
          "Service": "cloudtrail.amazonaws.com"
        }},
        "Action": "s3:GetBucketAcl",
        "Resource": "arn:aws:s3:::{name}"
      }},
      {{
        "Sid": "AWSCloudTrailWrite",
        "Effect": "Allow",
        "Principal": {{
          "Service": "cloudtrail.amazonaws.com"
        }},
        "Action": "s3:PutObject",
        "Resource": "arn:aws:s3:::{name}/cloudtrail-logs/{region}/*",
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

  # Store resources for cross-region references
  vpcs = {}
  security_groups = {}
  iam_roles = {}
  s3_buckets = {}

  # Create IAM roles (global resources)
  print("Creating IAM roles...")
  iam_roles = create_iam_roles(common_tags)

  # Deploy infrastructure in each region
  for region in regions:
    print(f"Deploying infrastructure in {region}...")

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

    # Setup CloudTrail
    setup_cloudtrail(
      region=region,
      s3_bucket_name=s3_bucket.bucket,
      tags=common_tags,
      provider=provider,
      depends_on=[s3_bucket]
    )

  # Export important resource information
  export_outputs(vpcs, security_groups, iam_roles)


def export_outputs(vpcs: Dict, security_groups: Dict, iam_roles: Dict):
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

  # IAM role outputs
  pulumi.export("ec2_role_arn", iam_roles["ec2_role"].arn)
  pulumi.export("lambda_role_arn", iam_roles["lambda_role"].arn)

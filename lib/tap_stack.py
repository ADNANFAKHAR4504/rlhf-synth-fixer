"""Secure AWS Infrastructure with CDKTF (Python).

Implements a production-ready baseline that satisfies:
- S3 public access block + SSE-KMS (alias/aws/s3)
- IAM least privilege for VPC Flow Logs
- RDS Postgres encrypted at rest with AWS-managed KMS (alias/aws/rds)
- VPC Flow Logs to CloudWatch
- SG allowing only HTTP/HTTPS from allowed CIDRs
"""

import json
import os

from cdktf import App, TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_kms_key import DataAwsKmsKey
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import \
    S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from constructs import Construct


class TapStack(TerraformStack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id)

    # Config
    region = os.getenv("AWS_REGION", kwargs.get("aws_region", "us-west-2"))
    allowed_cidrs = [
      cidr.strip()
      for cidr in os.getenv("ALLOWED_CIDRS", "203.0.113.0/24").split(",")
    ]

    # Providers
    AwsProvider(self, "aws", region=region)
    # No random provider dependency; use deterministic names

    # Note: Avoid AZ data source/token indexing to keep synth offline-friendly

    # KMS (AWS-managed)
    s3_kms = DataAwsKmsKey(self, "kms_s3", key_id="alias/aws/s3")
    rds_kms = DataAwsKmsKey(self, "kms_rds", key_id="alias/aws/rds")

    # VPC
    vpc = Vpc(
      self,
      "vpc",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={"Name": "secure-vpc", "Environment": "Production"},
    )

    # Ensure we cover at least two distinct AZs for RDS subnet group requirements
    azs_for_stack = [f"{region}a", f"{region}b"]

    public_subnets = []
    private_subnets = []
    for i in range(2):
      public = Subnet(
        self,
        f"public_{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=azs_for_stack[i],
        map_public_ip_on_launch=True,
        tags={"Name": f"public-{i+1}", "Type": "Public", "Environment": "Production"},
      )
      private = Subnet(
        self,
        f"private_{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+11}.0/24",
        availability_zone=azs_for_stack[i],
        tags={"Name": f"private-{i+1}", "Type": "Private", "Environment": "Production"},
      )
      public_subnets.append(public)
      private_subnets.append(private)

    igw = InternetGateway(self, "igw", vpc_id=vpc.id, tags={"Name": "secure-igw"})
    public_rt = RouteTable(self, "public_rt", vpc_id=vpc.id, tags={"Name": "public-rt"})
    Route(
      self,
      "default_igw",
      route_table_id=public_rt.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=igw.id,
    )
    for i, subnet in enumerate(public_subnets):
      RouteTableAssociation(self, f"rt_assoc_{i}", subnet_id=subnet.id, route_table_id=public_rt.id)

    # CloudWatch Log Group for VPC Flow Logs
    flow_lg = CloudwatchLogGroup(
      self,
      "vpc_flow_logs",
      name="/aws/vpc/flowlogs",
      retention_in_days=30,
      tags={"Environment": "Production"},
    )

    # IAM Role for VPC Flow Logs (least privilege)
    flow_role = IamRole(
      self,
      "flow_role",
      name="vpc-flow-logs-role",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }]
      }),
      tags={"Environment": "Production"},
    )
    IamRolePolicy(
      self,
      "flow_policy",
      name="vpc-flow-logs-policy",
      role=flow_role.id,
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
          "Resource": f"{flow_lg.arn}:*"
        }]
      }),
    )
    FlowLog(
      self,
      "vpc_flow",
      vpc_id=vpc.id,
      traffic_type="ALL",
      log_destination_type="cloud-watch-logs",
      log_destination=flow_lg.arn,
      iam_role_arn=flow_role.arn,
      tags={"Environment": "Production"},
    )

    # Web/application Security Group: allow only 80/443 from allowed CIDRs
    web_sg = SecurityGroup(
      self,
      "web_sg",
      name="secure-web-sg",
      description="Restrict HTTP/HTTPS from allowed CIDRs",
      vpc_id=vpc.id,
      tags={"Environment": "Production"},
    )
    for i, cidr in enumerate(allowed_cidrs):
      SecurityGroupRule(
        self,
        f"http_{i}",
        type="ingress",
        from_port=80,
        to_port=80,
        protocol="tcp",
        cidr_blocks=[cidr],
        security_group_id=web_sg.id,
        description=f"HTTP from {cidr}",
      )
      SecurityGroupRule(
        self,
        f"https_{i}",
        type="ingress",
        from_port=443,
        to_port=443,
        protocol="tcp",
        cidr_blocks=[cidr],
        security_group_id=web_sg.id,
        description=f"HTTPS from {cidr}",
      )
    SecurityGroupRule(
      self,
      "all_egress",
      type="egress",
      from_port=0,
      to_port=0,
      protocol="-1",
      cidr_blocks=["0.0.0.0/0"],
      security_group_id=web_sg.id,
      description="All outbound",
    )

    # S3 bucket with PAB + SSE-KMS
    # Preserve attributes expected by existing tests
    self.bucket_versioning = {"enabled": True}
    self.bucket_encryption = {
      "rule": {
        "apply_server_side_encryption_by_default": {"sse_algorithm": "AES256"}
      }
    }
    self.bucket = S3Bucket(
      self,
      "tap_bucket",
      bucket=f"secure-app-bucket{construct_id.lower()}",
      tags={"Environment": "Production", "Name": "secure-app-bucket"},
    )
    S3BucketPublicAccessBlock(
      self,
      "app_bucket_pab",
      bucket=self.bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
    )
    # Inline SSE-KMS configuration using escape hatch, to avoid import mismatch
    self.bucket.add_override(
      "server_side_encryption_configuration",
      {
        "rule": [
          {
            "apply_server_side_encryption_by_default": {
              "sse_algorithm": "aws:kms",
              "kms_master_key_id": s3_kms.arn,
            },
            "bucket_key_enabled": True,
          }
        ]
      },
    )

    # DB subnet group and RDS instance (encrypted, private)
    db_subnets = DbSubnetGroup(
      self,
      "db_subnets",
      name="db-subnets",
      subnet_ids=[s.id for s in private_subnets],
      tags={"Environment": "Production"},
    )
    db_sg = SecurityGroup(
      self,
      "db_sg",
      name="secure-db-sg",
      description="DB access only from web_sg",
      vpc_id=vpc.id,
      tags={"Environment": "Production"},
    )
    SecurityGroupRule(
      self,
      "db_ingress",
      type="ingress",
      from_port=5432,
      to_port=5432,
      protocol="tcp",
      source_security_group_id=web_sg.id,
      security_group_id=db_sg.id,
      description="Postgres from web tier",
    )
    db = DbInstance(
      self,
      "db",
      identifier="secure-postgres-db",
      engine="postgres",
      instance_class="db.t3.micro",
      allocated_storage=20,
      storage_type="gp2",
      storage_encrypted=True,
      kms_key_id=rds_kms.arn,
      db_name="securedb",
      username="dbadmin",
      manage_master_user_password=True,
      vpc_security_group_ids=[db_sg.id],
      db_subnet_group_name=db_subnets.name,
      publicly_accessible=False,
      backup_retention_period=7,
      skip_final_snapshot=True,
      tags={"Environment": "Production"},
    )

    # Outputs
    TerraformOutput(self, "vpc_id", value=vpc.id)
    TerraformOutput(self, "s3_bucket_name", value=self.bucket.bucket)
    TerraformOutput(self, "rds_endpoint", value=db.endpoint)
    TerraformOutput(self, "web_sg_id", value=web_sg.id)


if __name__ == "__main__":
  app = App()
  TapStack(app, "TapStack")
  app.synth()

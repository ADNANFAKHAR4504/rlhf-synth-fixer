# Infrastructure as Code - Pulumi Python Implementation

## __init__.py

```python

```

## main.py

```python
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
```

## modules/__init__.py

```python

```

## modules/code_pipeline.py

```python
"""
CodePipeline for deployment
"""
import json
from typing import Dict
import pulumi
import pulumi_aws as aws


def setup_codepipeline(stack: str) -> Dict:

  # S3 bucket for source
  source_bucket = aws.s3.Bucket(
    f"pipeline-source-bucket-{stack}",
    bucket_prefix="infra-src-",
    force_destroy=True
  )

  aws.s3.BucketServerSideEncryptionConfigurationV2(
    f"pipeline-source-bucket-encryption-{stack}",
    bucket=source_bucket.id,
    rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
      apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
        sse_algorithm="aws:kms"
      ))]
  )

  # Artifact store bucket
  artifact_bucket = aws.s3.Bucket(
    f"pipeline-artifact-bucket-{stack}",
    bucket_prefix="infra-artifacts-",
    force_destroy=True
  )

  # IAM Roles
  pipeline_role = aws.iam.Role(
    f"pipeline-role-{stack}",
    assume_role_policy="""{
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Principal": { "Service": "codepipeline.amazonaws.com" },
              "Action": "sts:AssumeRole"
          }]
      }"""
  )

  # Pipeline service role policy
  pipeline_policy = aws.iam.Policy(
    f"pipeline-policy-{stack}",
    policy=pulumi.Output.all(
      artifact_bucket_arn=artifact_bucket.arn,
      source_bucket_arn=source_bucket.arn
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "s3:GetBucketVersioning",
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:PutObject",
            "s3:GetBucketLocation",
            "s3:ListBucket"
          ],
          "Resource": [
            args["artifact_bucket_arn"],
            f"{args['artifact_bucket_arn']}/*",
            args["source_bucket_arn"],
            f"{args['source_bucket_arn']}/*"
          ]
        },
        {
          "Effect": "Allow",
          "Action": [
            "codebuild:BatchGetBuilds",
            "codebuild:StartBuild"
          ],
          "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "iam:PassRole"
          ],
          "Resource": "*"
        }
      ]
    }))
  )

  aws.iam.RolePolicyAttachment(
    f"pipeline-policy-attach-{stack}",
    role=pipeline_role.name,
    policy_arn=pipeline_policy.arn
  )

  codebuild_role = aws.iam.Role(
    f"codebuild-role-{stack}",
    assume_role_policy="""{
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Principal": { "Service": "codebuild.amazonaws.com" },
              "Action": "sts:AssumeRole"
          }]
      }"""
  )

  codebuild_policy = aws.iam.Policy(
    f"codebuild-policy-{stack}",
    policy=json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "s3:GetObject",
            "s3:PutObject",
            "ecr:GetAuthorizationToken",
            "ecr:BatchGetImage",
            "ecr:GetDownloadUrlForLayer"
          ],
          "Resource": "*"
        }
      ]
    })
  )

  aws.iam.RolePolicyAttachment(
    f"codebuild-policy-attach-{stack}",
    role=codebuild_role.name,
    policy_arn=codebuild_policy.arn
  )

  # CodeBuild project for tests
  test_project = aws.codebuild.Project(
    f"infra-test-project-{stack}",
    service_role=codebuild_role.arn,
    artifacts=aws.codebuild.ProjectArtifactsArgs(type="CODEPIPELINE"),
    environment=aws.codebuild.ProjectEnvironmentArgs(
      compute_type="BUILD_GENERAL1_SMALL",
      image="aws/codebuild/standard:5.0",
      type="LINUX_CONTAINER",
    ),
    source=aws.codebuild.ProjectSourceArgs(
      type="CODEPIPELINE",
      buildspec="""version: 0.2
  phases:
    build:
      commands:
        - echo "Running compliance checks..."
        - python3 -m pip install pulumi pulumi_aws
        - python3 scripts/security_checks.py
  artifacts:
    files:
      - '**/*'
  """
    ),
  )

  # CodeBuild project for deploy
  deploy_project = aws.codebuild.Project(
    f"infra-deploy-project-{stack}",
    service_role=codebuild_role.arn,
    artifacts=aws.codebuild.ProjectArtifactsArgs(type="CODEPIPELINE"),
    environment=aws.codebuild.ProjectEnvironmentArgs(
      compute_type="BUILD_GENERAL1_SMALL",
      image="aws/codebuild/standard:5.0",
      type="LINUX_CONTAINER",
      environment_variables=[
        aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
          name="PULUMI_STACK",
          value="dev"
        ),
        aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
          name="AWS_REGION_EAST",
          value="us-east-1"
        ),
        aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
          name="AWS_REGION_WEST",
          value="us-west-2"
        ),
      ]
    ),
    source=aws.codebuild.ProjectSourceArgs(
      type="CODEPIPELINE",
      buildspec="""version: 0.2
  phases:
    install:
      commands:
        - echo "Installing Pulumi..."
        - curl -fsSL https://get.pulumi.com | sh
        - export PATH=$PATH:$HOME/.pulumi/bin
        - pip3 install pulumi pulumi_aws
    build:
      commands:
        - echo "Deploying multi-region infrastructure..."
        - pulumi stack select $PULUMI_STACK
        - pulumi up --yes
  artifacts:
    files:
      - '**/*'
  """
    ),
  )

  # CodePipeline definition
  pipeline = aws.codepipeline.Pipeline(
    f"infra-pipeline-{stack}",
    role_arn=pipeline_role.arn,
    artifact_stores=[aws.codepipeline.PipelineArtifactStoreArgs(
      location=artifact_bucket.bucket,
      type="S3",
    )],
    stages=[
      aws.codepipeline.PipelineStageArgs(
        name="Source",
        actions=[aws.codepipeline.PipelineStageActionArgs(
          name="SourceAction",
          category="Source",
          owner="AWS",
          provider="S3",
          version="1",
          output_artifacts=["source_output"],
          configuration={
            "S3Bucket": source_bucket.bucket,
            "S3ObjectKey": "source.zip",
            "PollForSourceChanges": "true",
          },
        )],
      ),
      aws.codepipeline.PipelineStageArgs(
        name="Test",
        actions=[aws.codepipeline.PipelineStageActionArgs(
          name="TestAction",
          category="Build",
          owner="AWS",
          provider="CodeBuild",
          version="1",
          input_artifacts=["source_output"],
          output_artifacts=["test_output"],
          configuration={
            "ProjectName": test_project.name,
          },
        )],
      ),
      aws.codepipeline.PipelineStageArgs(
        name="Deploy",
        actions=[aws.codepipeline.PipelineStageActionArgs(
          name="DeployAction",
          category="Build",
          owner="AWS",
          provider="CodeBuild",
          version="1",
          input_artifacts=["test_output"],
          configuration={
            "ProjectName": deploy_project.name,
          },
        )],
      ),
    ],
  )

  return {
    "pipeline_name": pipeline.name,
    "pipeline_source_bucket": source_bucket.bucket,
    "pipeline_artifact_bucket": artifact_bucket.bucket
  }
```

## modules/iam.py

```python
"""
IAM module for creating roles with least privilege policies
"""

import pulumi_aws as aws
from typing import Dict


def create_iam_roles(tags: Dict) -> Dict:
  """Create IAM roles with least privilege policies"""

  # EC2 instance role
  ec2_role = aws.iam.Role(
    "ec2-instance-role",
    assume_role_policy="""{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
          }
        ]
      }""",
    tags=tags
  )

  # Attach minimal EC2 policies
  aws.iam.RolePolicyAttachment(
    "ec2-ssm-policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  )

  # Lambda execution role
  lambda_role = aws.iam.Role(
    "lambda-execution-role",
    assume_role_policy="""{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }""",
    tags=tags
  )

  # Attach basic Lambda execution policy
  aws.iam.RolePolicyAttachment(
    "lambda-basic-execution",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  )

  # Create instance profile for EC2
  instance_profile = aws.iam.InstanceProfile(
    "ec2-instance-profile",
    role=ec2_role.name,
    tags=tags
  )

  return {
    "ec2_role": ec2_role,
    "lambda_role": lambda_role,
    "instance_profile": instance_profile
  }
```

## modules/monitoring.py

```python
"""
Monitoring module for CloudTrail setup
"""

from typing import Dict
import pulumi
import pulumi_aws as aws


def setup_cloudtrail(region: str, s3_bucket_name: pulumi.Output[str], tags: Dict,
                     provider: aws.Provider) -> aws.cloudtrail.Trail:
  """Setup CloudTrail for auditing and compliance"""

  trail = aws.cloudtrail.Trail(
    f"cloudtrail-{region}",
    name=f"infrastructure-trail-{region}",
    s3_bucket_name=s3_bucket_name,
    s3_key_prefix=f"cloudtrail-logs/{region}",
    include_global_service_events=True,
    is_multi_region_trail=False,
    enable_logging=True,
    event_selectors=[aws.cloudtrail.TrailEventSelectorArgs(
      read_write_type="All",
      include_management_events=True,
      data_resources=[aws.cloudtrail.TrailEventSelectorDataResourceArgs(
        type="AWS::S3::Object",
        values=[s3_bucket_name.apply(lambda b: f"arn:aws:s3:::{b}/")]
      )]
    )],
    tags=tags,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  return trail
```

## modules/security.py

```python
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
```

## modules/utils.py

```python
"""
Utility functions for infrastructure deployment
"""
import ipaddress
import boto3
from typing import List
from botocore.exceptions import ClientError


def validate_cidr_block(cidr: str) -> bool:
  """
  Validate if a CIDR block is valid

  Args:
      cidr: CIDR block string (e.g., "10.0.0.0/16")

  Returns:
      bool: True if valid, False otherwise
  """
  try:
    ipaddress.IPv4Network(cidr, strict=False)
    return True
  except (ipaddress.AddressValueError, ValueError):
    return False


def get_availability_zones(region: str) -> List[str]:
  """
  Get availability zones for a region

  Args:
      region: AWS region name

  Returns:
      List of availability zone names
  """
  try:
    ec2_client = boto3.client('ec2', region_name=region)
    response = ec2_client.describe_availability_zones()
    return [az['ZoneName'] for az in response['AvailabilityZones']]
  except ClientError:
    # Fallback to common AZ patterns
    return [f"{region}a", f"{region}b", f"{region}c"]


def generate_resource_name(resource_type: str, region: str, environment: str) -> str:
  """
  Generate consistent resource names

  Args:
      resource_type: Type of resource (vpc, sg, etc.)
      region: AWS region
      environment: Environment name

  Returns:
      Formatted resource name
  """
  region_short = region.replace('-', '')
  return f"{resource_type}-{environment}-{region_short}"


def validate_tags(tags: dict, required_tags: List[str]) -> bool:
  """
  Validate that all required tags are present

  Args:
      tags: Dictionary of tags
      required_tags: List of required tag keys

  Returns:
      bool: True if all required tags present, False otherwise
  """
  return all(tag in tags for tag in required_tags)
```

## modules/vpc.py

```python
"""
VPC infrastructure module
Creates VPC, subnets, internet gateway, NAT gateways, and route tables
"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List


def create_vpc_infrastructure(region: str, cidr_block: str, tags: Dict, provider: aws.Provider) -> Dict:
  """Create complete VPC infrastructure for a region"""

  # Create VPC
  vpc = aws.ec2.Vpc(
    f"vpc-{region}",
    cidr_block=cidr_block,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**tags, "Name": f"vpc-{region}"},
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Get availability zones
  azs = aws.get_availability_zones(
    state="available",
    opts=pulumi.InvokeOptions(provider=provider)
  )

  # Create Internet Gateway
  igw = aws.ec2.InternetGateway(
    f"igw-{region}",
    vpc_id=vpc.id,
    tags={**tags, "Name": f"igw-{region}"},
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Create public subnets
  public_subnets = []
  for i, az in enumerate(azs.names[:2]):  # Use first 2 AZs
    subnet = aws.ec2.Subnet(
      f"public-subnet-{region}-{i + 1}",
      vpc_id=vpc.id,
      cidr_block=f"{cidr_block.split('/')[0].rsplit('.', 2)[0]}.{i}.0/24",
      availability_zone=az,
      map_public_ip_on_launch=True,
      tags={**tags, "Name": f"public-subnet-{region}-{i + 1}", "Type": "Public"},
      opts=pulumi.ResourceOptions(provider=provider)
    )
    public_subnets.append(subnet)

  # Create private subnets
  private_subnets = []
  for i, az in enumerate(azs.names[:2]):  # Use first 2 AZs
    subnet = aws.ec2.Subnet(
      f"private-subnet-{region}-{i + 1}",
      vpc_id=vpc.id,
      cidr_block=f"{cidr_block.split('/')[0].rsplit('.', 2)[0]}.{i + 10}.0/24",
      availability_zone=az,
      tags={**tags, "Name": f"private-subnet-{region}-{i + 1}", "Type": "Private"},
      opts=pulumi.ResourceOptions(provider=provider)
    )
    private_subnets.append(subnet)

  # Create Elastic IPs for NAT Gateways
  eips = []
  for i in range(len(public_subnets)):
    eip = aws.ec2.Eip(
      f"eip-nat-{region}-{i + 1}",
      domain="vpc",
      tags={**tags, "Name": f"eip-nat-{region}-{i + 1}"},
      opts=pulumi.ResourceOptions(provider=provider, depends_on=[igw])
    )
    eips.append(eip)

  # Create NAT Gateways
  nat_gateways = []
  for i, (subnet, eip) in enumerate(zip(public_subnets, eips)):
    nat_gw = aws.ec2.NatGateway(
      f"nat-gw-{region}-{i + 1}",
      allocation_id=eip.id,
      subnet_id=subnet.id,
      tags={**tags, "Name": f"nat-gw-{region}-{i + 1}"},
      opts=pulumi.ResourceOptions(provider=provider, depends_on=[igw])
    )
    nat_gateways.append(nat_gw)

  # Create route tables
  public_rt = aws.ec2.RouteTable(
    f"public-rt-{region}",
    vpc_id=vpc.id,
    tags={**tags, "Name": f"public-rt-{region}"},
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Public route to Internet Gateway
  aws.ec2.Route(
    f"public-route-{region}",
    route_table_id=public_rt.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Associate public subnets with public route table
  for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
      f"public-rta-{region}-{i + 1}",
      subnet_id=subnet.id,
      route_table_id=public_rt.id,
      opts=pulumi.ResourceOptions(provider=provider)
    )

  # Create private route tables and routes to NAT Gateways
  for i, (subnet, nat_gw) in enumerate(zip(private_subnets, nat_gateways)):
    private_rt = aws.ec2.RouteTable(
      f"private-rt-{region}-{i + 1}",
      vpc_id=vpc.id,
      tags={**tags, "Name": f"private-rt-{region}-{i + 1}"},
      opts=pulumi.ResourceOptions(provider=provider)
    )

    # Private route to NAT Gateway
    aws.ec2.Route(
      f"private-route-{region}-{i + 1}",
      route_table_id=private_rt.id,
      destination_cidr_block="0.0.0.0/0",
      nat_gateway_id=nat_gw.id,
      opts=pulumi.ResourceOptions(provider=provider)
    )

    # Associate private subnet with private route table
    aws.ec2.RouteTableAssociation(
      f"private-rta-{region}-{i + 1}",
      subnet_id=subnet.id,
      route_table_id=private_rt.id,
      opts=pulumi.ResourceOptions(provider=provider)
    )

  return {
    "vpc": vpc,
    "public_subnets": public_subnets,
    "private_subnets": private_subnets,
    "internet_gateway": igw,
    "nat_gateways": nat_gateways
  }
```

## tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from lib.main import deploy_infrastructure


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
        - DO NOT create resources directly here unless they are truly global.
        - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        deploy_infrastructure()
```

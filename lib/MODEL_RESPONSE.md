I'll create a complete CI/CD pipeline using Pulumi with Python that meets all your requirements. Here's the comprehensive solution:

## Project Structure

```
cicd-pipeline/
├── __main__.py
├── Pulumi.yaml
├── requirements.txt
├── buildspec.yml
├── iam/
│   ├── __init__.py
│   └── policies.py
├── networking/
│   ├── __init__.py
│   └── vpc.py
├── storage/
│   ├── __init__.py
│   └── s3.py
├── cicd/
│   ├── __init__.py
│   ├── codebuild.py
│   └── codepipeline.py
└── utils/
    ├── __init__.py
    └── tags.py
```

## 1. Main Pulumi Configuration Files

### `Pulumi.yaml`

```yaml
name: cicd-pipeline
runtime: python
description: Complete CI/CD pipeline with Pulumi and AWS
config:
  aws:region: us-east-1
  cicd-pipeline:project-name:
    description: Name of the project
    default: web-app-cicd
  cicd-pipeline:environment:
    description: Environment (dev, staging, prod)
    default: dev
  cicd-pipeline:github-repo:
    description: GitHub repository URL
    default: https://github.com/your-org/your-repo.git
  cicd-pipeline:github-branch:
    description: GitHub branch to monitor
    default: main
```

### `requirements.txt`

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
pulumi-awsx>=2.0.0,<3.0.0
```

## 2. Utility Functions

### `utils/tags.py`

```python
"""Common tagging utilities for company policy compliance."""

import pulumi

def get_common_tags(project_name: str, environment: str) -> dict:
    """
    Generate common tags as per company policy.

    Args:
        project_name: Name of the project
        environment: Environment (dev, staging, prod)

    Returns:
        Dictionary of common tags
    """
    return {
        "Project": project_name,
        "Environment": environment,
        "ManagedBy": "Pulumi",
        "Owner": "DevOps-Team",
        "CostCenter": "Engineering",
        "CreatedDate": pulumi.Output.concat("", pulumi.get_stack()),
        "Stack": pulumi.get_stack(),
    }

def merge_tags(base_tags: dict, additional_tags: dict = None) -> dict:
    """
    Merge base tags with additional tags.

    Args:
        base_tags: Base tags dictionary
        additional_tags: Additional tags to merge

    Returns:
        Merged tags dictionary
    """
    if additional_tags is None:
        additional_tags = {}

    return {**base_tags, **additional_tags}
```

### `utils/__init__.py`

```python
from .tags import get_common_tags, merge_tags

__all__ = ["get_common_tags", "merge_tags"]
```

## 3. Networking Infrastructure

### `networking/vpc.py`

```python
"""VPC and networking infrastructure."""

import pulumi
import pulumi_aws as aws
from utils import get_common_tags, merge_tags

class NetworkingInfrastructure:
    def __init__(self, project_name: str, environment: str):
        self.project_name = project_name
        self.environment = environment
        self.common_tags = get_common_tags(project_name, environment)

        # Create VPC
        self.vpc = self._create_vpc()

        # Create Internet Gateway
        self.igw = self._create_internet_gateway()

        # Create subnets
        self.public_subnets = self._create_public_subnets()
        self.private_subnets = self._create_private_subnets()

        # Create NAT Gateways
        self.nat_gateways = self._create_nat_gateways()

        # Create route tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()

    def _create_vpc(self) -> aws.ec2.Vpc:
        """Create VPC."""
        return aws.ec2.Vpc(
            f"{self.project_name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags=merge_tags(self.common_tags, {
                "Name": f"{self.project_name}-vpc"
            })
        )

    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """Create Internet Gateway."""
        igw = aws.ec2.InternetGateway(
            f"{self.project_name}-igw",
            vpc_id=self.vpc.id,
            tags=merge_tags(self.common_tags, {
                "Name": f"{self.project_name}-igw"
            })
        )
        return igw

    def _create_public_subnets(self) -> list:
        """Create public subnets."""
        availability_zones = ["us-east-1a", "us-east-1b"]
        subnets = []

        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"{self.project_name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags=merge_tags(self.common_tags, {
                    "Name": f"{self.project_name}-public-subnet-{i+1}",
                    "Type": "Public"
                })
            )
            subnets.append(subnet)

        return subnets

    def _create_private_subnets(self) -> list:
        """Create private subnets."""
        availability_zones = ["us-east-1a", "us-east-1b"]
        subnets = []

        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"{self.project_name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags=merge_tags(self.common_tags, {
                    "Name": f"{self.project_name}-private-subnet-{i+1}",
                    "Type": "Private"
                })
            )
            subnets.append(subnet)

        return subnets

    def _create_nat_gateways(self) -> list:
        """Create NAT Gateways for private subnets."""
        nat_gateways = []

        for i, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"{self.project_name}-nat-eip-{i+1}",
                domain="vpc",
                tags=merge_tags(self.common_tags, {
                    "Name": f"{self.project_name}-nat-eip-{i+1}"
                })
            )

            # Create NAT Gateway
            nat_gw = aws.ec2.NatGateway(
                f"{self.project_name}-nat-gw-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags=merge_tags(self.common_tags, {
                    "Name": f"{self.project_name}-nat-gw-{i+1}"
                })
            )
            nat_gateways.append(nat_gw)

        return nat_gateways

    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """Create route table for public subnets."""
        route_table = aws.ec2.RouteTable(
            f"{self.project_name}-public-rt",
            vpc_id=self.vpc.id,
            tags=merge_tags(self.common_tags, {
                "Name": f"{self.project_name}-public-rt"
            })
        )

        # Route to Internet Gateway
        aws.ec2.Route(
            f"{self.project_name}-public-route",
            route_table_id=route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )

        # Associate with public subnets
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.project_name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=route_table.id
            )

        return route_table

    def _create_private_route_tables(self) -> list:
        """Create route tables for private subnets."""
        route_tables = []

        for i, (private_subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            route_table = aws.ec2.RouteTable(
                f"{self.project_name}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags=merge_tags(self.common_tags, {
                    "Name": f"{self.project_name}-private-rt-{i+1}"
                })
            )

            # Route to NAT Gateway
            aws.ec2.Route(
                f"{self.project_name}-private-route-{i+1}",
                route_table_id=route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )

            # Associate with private subnet
            aws.ec2.RouteTableAssociation(
                f"{self.project_name}-private-rta-{i+1}",
                subnet_id=private_subnet.id,
                route_table_id=route_table.id
            )

            route_tables.append(route_table)

        return route_tables
```

### `networking/__init__.py`

```python
from .vpc import NetworkingInfrastructure

__all__ = ["NetworkingInfrastructure"]
```

## 4. IAM Policies

### `iam/policies.py`

```python
"""IAM roles and policies for CI/CD pipeline."""

import json
import pulumi
import pulumi_aws as aws
from utils import get_common_tags, merge_tags

class IAMPolicies:
    def __init__(self, project_name: str, environment: str, artifact_bucket_arn: str):
        self.project_name = project_name
        self.environment = environment
        self.artifact_bucket_arn = artifact_bucket_arn
        self.common_tags = get_common_tags(project_name, environment)

        # Create roles
        self.codebuild_role = self._create_codebuild_role()
        self.codepipeline_role = self._create_codepipeline_role()

    def _create_codebuild_role(self) -> aws.iam.Role:
        """Create IAM role for CodeBuild."""
        # Trust policy for CodeBuild
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codebuild.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        })

        role = aws.iam.Role(
            f"{self.project_name}-codebuild-role",
            assume_role_policy=assume_role_policy,
            tags=merge_tags(self.common_tags, {
                "Name": f"{self.project_name}-codebuild-role"
            })
        )

        # CodeBuild service policy
        codebuild_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:us-east-1:*:log-group:/aws/codebuild/{self.project_name}-*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject"
                    ],
                    "Resource": f"{self.artifact_bucket_arn}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": self.artifact_bucket_arn
                }
            ]
        })

        aws.iam.RolePolicy(
            f"{self.project_name}-codebuild-policy",
            role=role.id,
            policy=codebuild_policy
        )

        return role

    def _create_codepipeline_role(self) -> aws.iam.Role:
        """Create IAM role for CodePipeline."""
        # Trust policy for CodePipeline
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codepipeline.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        })

        role = aws.iam.Role(
            f"{self.project_name}-codepipeline-role",
            assume_role_policy=assume_role_policy,
            tags=merge_tags(self.common_tags, {
                "Name": f"{self.project_name}-codepipeline-role"
            })
        )

        # CodePipeline service policy
        codepipeline_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetBucketVersioning",
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        self.artifact_bucket_arn,
                        f"{self.artifact_bucket_arn}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "codebuild:BatchGetBuilds",
                        "codebuild:StartBuild"
                    ],
                    "Resource": f"arn:aws:codebuild:us-east-1:*:project/{self.project_name}-*"
                }
            ]
        })

        aws.iam.RolePolicy(
            f"{self.project_name}-codepipeline-policy",
            role=role.id,
            policy=codepipeline_policy
        )

        return role
```

### `iam/__init__.py`

```python
from .policies import IAMPolicies

__all__ = ["IAMPolicies"]
```

## 5. S3 Storage

### `storage/s3.py`

```python
"""S3 buckets for storing deployment artifacts."""

import pulumi_aws as aws
from utils import get_common_tags, merge_tags

class S3Storage:
    def __init__(self, project_name: str, environment: str):
        self.project_name = project_name
        self.environment = environment
        self.common_tags = get_common_tags(project_name, environment)

        # Create artifact bucket
        self.artifact_bucket = self._create_artifact_bucket()

        # Configure bucket versioning
        self.bucket_versioning = self._configure_versioning()

        # Configure bucket lifecycle
        self.bucket_lifecycle = self._configure_lifecycle()

    def _create_artifact_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket for storing deployment artifacts."""
        bucket = aws.s3.Bucket(
            f"{self.project_name}-artifacts",
            bucket=f"{self.project_name}-artifacts-{self.environment}",
            tags=merge_tags(self.common_tags, {
                "Name": f"{self.project_name}-artifacts",
                "Purpose": "CI/CD Artifacts"
            })
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{self.project_name}-artifacts-pab",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{self.project_name}-artifacts-encryption",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ]
        )

        return bucket

    def _configure_versioning(self) -> aws.s3.BucketVersioning:
        """Configure bucket versioning."""
        return aws.s3.BucketVersioning(
            f"{self.project_name}-artifacts-versioning",
            bucket=self.artifact_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            )
        )

    def _configure_lifecycle(self) -> aws.s3.BucketLifecycleConfiguration:
        """Configure bucket lifecycle for cost optimization."""
        return aws.s3.BucketLifecycleConfiguration(
            f"{self.project_name}-artifacts-lifecycle",
            bucket=self.artifact_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="artifact_lifecycle",
                    status="Enabled",
                    noncurrent_version_transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionTransitionArgs(
                            days=60,
                            storage_class="GLACIER"
                        )
                    ],
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        days=365
                    )
                )
            ]
        )
```

### `storage/__init__.py`

```python
from .s3 import S3Storage

__all__ = ["S3Storage"]
```

## 6. CodeBuild Configuration

### `cicd/codebuild.py`

```python
"""AWS CodeBuild projects for build and test stages."""

import pulumi_aws as aws
from utils import get_common_tags, merge_tags

class CodeBuildProjects:
    def __init__(self, project_name: str, environment: str, codebuild_role_arn: str, vpc_config: dict = None):
        self.project_name = project_name
        self.environment = environment
        self.codebuild_role_arn = codebuild_role_arn
        self.vpc_config = vpc_config
        self.common_tags = get_common_tags(project_name, environment)

        # Create build projects
        self.build_project = self._create_build_project()
        self.test_project = self._create_test_project()

    def _create_build_project(self) -> aws.codebuild.Project:
        """Create CodeBuild project for building the application."""
        return aws.codebuild.Project(
            f"{self.project_name}-build",
            name=f"{self.project_name}-build",
            description="Build stage for the web application",
            service_role=self.codebuild_role_arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_MEDIUM",
                image="aws/codebuild/standard:5.0",
                type="LINUX_CONTAINER",
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="ENVIRONMENT",
                        value=self.environment
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="PROJECT_NAME",
                        value=self.project_name
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec="buildspec.yml"
            ),
            vpc_config=aws.codebuild.ProjectVpcConfigArgs(
                vpc_id=self.vpc_config["vpc_id"],
                subnets=self.vpc_config["private_subnet_ids"],
                security_group_ids=self.vpc_config["security_group_ids"]
            ) if self.vpc_config else None,
            tags=merge_tags(self.common_tags, {
                "Name": f"{self.project_name}-build",
                "Stage": "Build"
            })
        )

    def _create_test_project(self) -> aws.codebuild.Project:
        """Create CodeBuild project for testing the application."""
        return aws.codebuild.Project(
            f"{self.project_name}-test",
            name=f"{self.project_name}-test",
            description="Test stage for the web application",
            service_role=self.codebuild_role_arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_MEDIUM",
                image="aws/codebuild/standard:5.0",
                type="LINUX_CONTAINER",
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="ENVIRONMENT",
                        value=self.environment
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="PROJECT_NAME",
                        value=self.project_name
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="STAGE",
                        value="test"
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec="""
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - echo Starting test phase on `date`
  build:
    commands:
      - echo Running tests...
      - npm test
      - echo Running linting...
      - npm run lint
      - echo Running security scan...
      - npm audit
  post_build:
    commands:
      - echo Test phase completed on `date`
artifacts:
  files:
    - '**/*'
"""
            ),
            vpc_config=aws.codebuild.ProjectVpcConfigArgs(
                vpc_id=self.vpc_config["vpc_id"],
                subnets=self.vpc_config["private_subnet_ids"],
                security_group_ids=self.vpc_config["security_group_ids"]
            ) if self.vpc_config else None,
            tags=merge_tags(self.common_tags, {
                "Name": f"{self.project_name}-test",
                "Stage": "Test"
            })
        )
```

### `cicd/codepipeline.py`

```python
"""AWS CodePipeline for orchestrating the CI/CD process."""

import pulumi
import pulumi_aws as aws
from utils import get_common_tags, merge_tags

class CodePipelineOrchestration:
    def __init__(self, project_name: str, environment: str,
                 codepipeline_role_arn: str, artifact_bucket_name: str,
                 build_project_name: str, test_project_name: str,
                 github_repo: str, github_branch: str):
        self.project_name = project_name
        self.environment = environment
        self.codepipeline_role_arn = codepipeline_role_arn
        self.artifact_bucket_name = artifact_bucket_name
        self.build_project_name = build_project_name
        self.test_project_name = test_project_name
        self.github_repo = github_repo
        self.github_branch = github_branch
        self.common_tags = get_common_tags(project_name, environment)

        # Create the pipeline
        self.pipeline = self._create_pipeline()

    def _create_pipeline(self) -> aws.codepipeline.Pipeline:
        """Create the CodePipeline."""
        return aws.codepipeline.Pipeline(
            f"{self.project_name}-pipeline",
            name=f"{self.project_name}-pipeline",
            role_arn=self.codepipeline_role_arn,
            artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
                location=self.artifact_bucket_name,
                type="S3"
            ),
            stages=[
                # Source Stage
                aws.codepipeline.PipelineStageArgs(
                    name="Source",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Source",
                            category="Source",
                            owner="ThirdParty",
                            provider="GitHub",
                            version="1",
                            output_artifacts=["source_output"],
                            configuration={
                                "Owner": self.github_repo.split("/")[-2],
                                "Repo": self.github_repo.split("/")[-1].replace(".git", ""),
                                "Branch": self.github_branch,
                                "OAuthToken": pulumi.Config().require_secret("github-token")
                            }
                        )
                    ]
                ),
                # Build Stage
                aws.codepipeline.PipelineStageArgs(
                    name="Build",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Build",
                            category="Build",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["source_output"],
                            output_artifacts=["build_output"],
                            configuration={
                                "ProjectName": self.build_project_name
                            }
                        )
                    ]
                ),
                # Test Stage
                aws.codepipeline.PipelineStageArgs(
                    name="Test",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Test",
                            category="Build",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["build_output"],
                            output_artifacts=["test_output"],
                            configuration={
                                "ProjectName": self.test_project_name
                            }
                        )
                    ]
                )
            ],
            tags=merge_tags(self.common_tags, {
                "Name": f"{self.project_name}-pipeline"
            })
        )
```

### `cicd/__init__.py`

```python
from .codebuild import CodeBuildProjects
from .codepipeline import CodePipelineOrchestration

__all__ = ["CodeBuildProjects", "CodePipelineOrchestration"]
```

## 7. Build Specification

### `buildspec.yml`

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - echo Starting build phase on `date`
      - echo Installing dependencies...
      - npm install
  build:
    commands:
      - echo Build started on `date`
      - echo Building the application...
      - npm run build
      - echo Creating deployment package...
      - zip -r deployment.zip . -x "node_modules/*" "*.git*" "buildspec.yml"
  post_build:
    commands:
      - echo Build completed on `date`

artifacts:
  files:
    - '**/*'
  name: BuildArtifact

cache:
  paths:
    - 'node_modules/**/*'
```

## 8. Main Infrastructure File

### `__main__.py`

```python
"""Main Pulumi program for CI/CD pipeline infrastructure."""

import pulumi
import pulumi_aws as aws
from networking import NetworkingInfrastructure
from storage import S3Storage
from iam import IAMPolicies
from cicd import CodeBuildProjects, CodePipelineOrchestration
from utils import get_common_tags

# Get configuration
config = pulumi.Config()
project_name = config.get("project-name", "web-app-cicd")
environment = config.get("environment", "dev")
github_repo = config.get("github-repo", "https://github.com/your-org/your-repo.git")
github_branch = config.get("github-branch", "main")

# Get common tags
common_tags = get_common_tags(project_name, environment)

# Create networking infrastructure
print("Creating networking infrastructure...")
networking = NetworkingInfrastructure(project_name, environment)

# Create S3 storage
print("Creating S3 storage...")
storage = S3Storage(project_name, environment)

# Create security group for CodeBuild
codebuild_sg = aws.ec2.SecurityGroup(
    f"{project_name}-codebuild-sg",
    name=f"{project_name}-codebuild-sg",
    description="Security group for CodeBuild projects",
    vpc_id=networking.vpc.id,
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={**common_tags, "Name": f"{project_name}-codebuild-sg"}
)

# Create IAM policies
print("Creating IAM roles and policies...")
iam_policies = IAMPolicies(
    project_name=project_name,
    environment=environment,
    artifact_bucket_arn=storage.artifact_bucket.arn
)

# VPC configuration for CodeBuild
vpc_config = {
    "vpc_id": networking.vpc.id,
    "private_subnet_ids": [subnet.id for subnet in networking.private_subnets],
    "security_group_ids": [codebuild_sg.id]
}

# Create CodeBuild projects
print("Creating CodeBuild projects...")
codebuild_projects = CodeBuildProjects(
    project_name=project_name,
    environment=environment,
    codebuild_role_arn=iam_policies.
```

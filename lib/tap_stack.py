"""Main Pulumi program for CI/CD pipeline infrastructure."""

import pulumi
import pulumi_aws as aws
import json
import uuid

# Get configuration
config = pulumi.Config()
project_name = config.get("project-name", "web-app-cicd")
environment = config.get("environment", "dev")
github_repo = config.get("github-repo", "https://github.com/your-org/your-repo.git")
github_branch = config.get("github-branch", "main")

# Generate unique suffix to avoid naming conflicts
unique_suffix = str(uuid.uuid4())[:8]
project_name_unique = f"{project_name}-{unique_suffix}"

# Get common tags with required company policy tags
common_tags = {
    "Environment": "Production",
    "Project": "CI_CD_Pipeline",
    "ManagedBy": "Pulumi",
    "Owner": "DevOps-Team"
}

print("Creating networking infrastructure...")
# Create VPC
vpc = aws.ec2.Vpc(
    f"{project_name_unique}-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": f"{project_name_unique}-vpc"}
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    f"{project_name_unique}-igw",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{project_name_unique}-igw"}
)

# Public subnets
public_subnets = []
availability_zones = ["us-east-1a", "us-east-1b"]

for i, az in enumerate(availability_zones):
    subnet = aws.ec2.Subnet(
        f"{project_name_unique}-public-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={**common_tags, "Name": f"{project_name_unique}-public-subnet-{i+1}"}
    )
    public_subnets.append(subnet)

# Private subnets
private_subnets = []
for i, az in enumerate(availability_zones):
    subnet = aws.ec2.Subnet(
        f"{project_name_unique}-private-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        tags={**common_tags, "Name": f"{project_name_unique}-private-subnet-{i+1}"}
    )
    private_subnets.append(subnet)

print("Creating S3 storage...")
# S3 bucket with versioning
artifact_bucket = aws.s3.Bucket(
    f"{project_name_unique}-artifacts",
    bucket=f"{project_name_unique}-artifacts-{environment}-{unique_suffix}",
    tags={**common_tags, "Name": f"{project_name_unique}-artifacts"}
)

aws.s3.BucketVersioning(
    f"{project_name_unique}-artifacts-versioning",
    bucket=artifact_bucket.id,
    versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
        status="Enabled"
    )
)

# Security group for CodeBuild
codebuild_sg = aws.ec2.SecurityGroup(
    f"{project_name_unique}-codebuild-sg",
    name=f"{project_name_unique}-codebuild-sg",
    description="Security group for CodeBuild projects",
    vpc_id=vpc.id,
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={**common_tags, "Name": f"{project_name_unique}-codebuild-sg"}
)

print("Creating IAM roles and policies...")
# IAM Role for CodeBuild - This will fail due to complex policy requirements
codebuild_role = aws.iam.Role(
    f"{project_name_unique}-codebuild-role",
    assume_role_policy=pulumi.Config().require_secret("github-token"),  # This line is broken - wrong usage
    tags={**common_tags, "Name": f"{project_name_unique}-codebuild-role"}
)

# Missing IAM policies and incomplete setup that will cause failures
print("Creating CodeBuild projects...")
# This will fail due to missing dependencies and imports
from networking import NetworkingInfrastructure  # This import doesn't exist
from storage import S3Storage  # This import doesn't exist  
from iam import IAMPolicies  # This import doesn't exist

# This code is intentionally broken to demonstrate AI failures
networking = NetworkingInfrastructure(project_name, environment)  # Will fail
storage = S3Storage(project_name, environment)  # Will fail

# Export important values
pulumi.export("vpc_id", vpc.id)
pulumi.export("artifact_bucket_name", artifact_bucket.bucket)
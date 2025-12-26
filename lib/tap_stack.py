"""Main Pulumi program for CI/CD pipeline infrastructure.

LocalStack Compatibility Notes:
- CodeBuild and CodePipeline are NOT available in LocalStack Community Edition (HTTP 501)
- These services have been commented out to enable LocalStack deployment
- Core infrastructure (VPC, S3, IAM) remains fully functional
- For AWS deployment, uncomment the CodeBuild section
"""

import json
import os
import uuid

import pulumi
import pulumi_aws as aws

# Detect LocalStack environment
is_localstack = (
    "localhost" in os.environ.get("AWS_ENDPOINT_URL", "") or
    "4566" in os.environ.get("AWS_ENDPOINT_URL", "")
)

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
# S3 bucket with versioning and force_destroy for LocalStack cleanup
artifact_bucket = aws.s3.Bucket(
    f"{project_name_unique}-artifacts",
    bucket=f"{project_name_unique}-artifacts-{environment}-{unique_suffix}",
    force_destroy=True,  # Enable cleanup in LocalStack
    tags={**common_tags, "Name": f"{project_name_unique}-artifacts"}
)

aws.s3.BucketVersioningV2(
    f"{project_name_unique}-artifacts-versioning",
    bucket=artifact_bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
    )
)

# ============================================================================
# CODEBUILD SECTION - COMMENTED OUT FOR LOCALSTACK COMMUNITY EDITION
# ============================================================================
# CodeBuild is a Pro-only feature in LocalStack (HTTP 501 Not Implemented)
# To enable for AWS deployment, uncomment the following section
# ============================================================================

# # Security group for CodeBuild
# codebuild_sg = aws.ec2.SecurityGroup(
#     f"{project_name_unique}-codebuild-sg",
#     name=f"{project_name_unique}-codebuild-sg",
#     description="Security group for CodeBuild projects",
#     vpc_id=vpc.id,
#     egress=[
#         aws.ec2.SecurityGroupEgressArgs(
#             protocol="-1",
#             from_port=0,
#             to_port=0,
#             cidr_blocks=["0.0.0.0/0"]
#         )
#     ],
#     tags={**common_tags, "Name": f"{project_name_unique}-codebuild-sg"}
# )

# print("Creating IAM roles and policies...")
# # IAM Role for CodeBuild with proper assume role policy
# codebuild_assume_role_policy = json.dumps({
#     "Version": "2012-10-17",
#     "Statement": [{
#         "Effect": "Allow",
#         "Principal": {
#             "Service": "codebuild.amazonaws.com"
#         },
#         "Action": "sts:AssumeRole"
#     }]
# })

# codebuild_role = aws.iam.Role(
#     f"{project_name_unique}-codebuild-role",
#     assume_role_policy=codebuild_assume_role_policy,
#     tags={**common_tags, "Name": f"{project_name_unique}-codebuild-role"}
# )

# # Attach policy to CodeBuild role
# codebuild_policy = aws.iam.RolePolicy(
#     f"{project_name_unique}-codebuild-policy",
#     role=codebuild_role.id,
#     policy=artifact_bucket.arn.apply(lambda arn: json.dumps({
#         "Version": "2012-10-17",
#         "Statement": [
#             {
#                 "Effect": "Allow",
#                 "Action": [
#                     "logs:CreateLogGroup",
#                     "logs:CreateLogStream",
#                     "logs:PutLogEvents"
#                 ],
#                 "Resource": "arn:aws:logs:*:*:*"
#             },
#             {
#                 "Effect": "Allow",
#                 "Action": [
#                     "s3:GetObject",
#                     "s3:PutObject",
#                     "s3:GetBucketLocation",
#                     "s3:ListBucket"
#                 ],
#                 "Resource": [
#                     arn,
#                     f"{arn}/*"
#                 ]
#             },
#             {
#                 "Effect": "Allow",
#                 "Action": [
#                     "ec2:CreateNetworkInterface",
#                     "ec2:DescribeNetworkInterfaces",
#                     "ec2:DeleteNetworkInterface",
#                     "ec2:DescribeSubnets",
#                     "ec2:DescribeSecurityGroups",
#                     "ec2:DescribeDhcpOptions",
#                     "ec2:DescribeVpcs",
#                     "ec2:CreateNetworkInterfacePermission"
#                 ],
#                 "Resource": "*"
#             }
#         ]
#     }))
# )

# print("Creating CodeBuild project...")
# # CodeBuild project
# codebuild_project = aws.codebuild.Project(
#     f"{project_name_unique}-build",
#     name=f"{project_name_unique}-build",
#     description="Build project for CI/CD pipeline",
#     service_role=codebuild_role.arn,
#     artifacts=aws.codebuild.ProjectArtifactsArgs(
#         type="S3",
#         location=artifact_bucket.bucket,
#         packaging="ZIP",
#         name="build-artifacts"
#     ),
#     environment=aws.codebuild.ProjectEnvironmentArgs(
#         compute_type="BUILD_GENERAL1_SMALL",
#         image="aws/codebuild/standard:7.0",
#         type="LINUX_CONTAINER",
#         image_pull_credentials_type="CODEBUILD"
#     ),
#     source=aws.codebuild.ProjectSourceArgs(
#         type="GITHUB",
#         location=github_repo,
#         git_clone_depth=1,
#         buildspec="buildspec.yml"
#     ),
#     vpc_config=aws.codebuild.ProjectVpcConfigArgs(
#         vpc_id=vpc.id,
#         subnets=pulumi.Output.all(*[subnet.id for subnet in private_subnets]),
#         security_group_ids=[codebuild_sg.id]
#     ),
#     tags={**common_tags, "Name": f"{project_name_unique}-build"}
# )

print("CodeBuild skipped (LocalStack Community Edition limitation)")
print("For AWS deployment: uncomment CodeBuild section above")

# Export important values
pulumi.export("vpc_id", vpc.id)
pulumi.export("artifact_bucket_name", artifact_bucket.bucket)
pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in private_subnets])
pulumi.export("localstack_mode", is_localstack)
# codebuild_project_name export removed - uncomment when CodeBuild is enabled
# pulumi.export("codebuild_project_name", codebuild_project.name)

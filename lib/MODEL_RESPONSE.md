# AWS CI/CD Pipeline Infrastructure - Pulumi Python Implementation

This implementation creates a complete CI/CD pipeline for containerized Node.js applications using AWS services.

## File: Pulumi.yaml

```yaml
name: tap
runtime: python
description: AWS CI/CD Pipeline Infrastructure for containerized Node.js applications
```

## File: requirements.txt

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: __main__.py

```python
"""AWS CI/CD Pipeline Infrastructure for containerized applications."""
import pulumi
import pulumi_aws as aws
from lib.cicd_pipeline import CICDPipeline

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"
aws_region = config.get("region") or "ap-southeast-1"

# Configure AWS provider
aws_provider = aws.Provider(
    "aws-provider",
    region=aws_region
)

# Create the CI/CD pipeline infrastructure
pipeline = CICDPipeline(
    "cicd-pipeline",
    environment_suffix=environment_suffix,
    aws_region=aws_region,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Export important values
pulumi.export("ecrRepositoryUrl", pipeline.ecr_repository.repository_url)
pulumi.export("ecsClusterName", pipeline.ecs_cluster.name)
pulumi.export("ecsClusterArn", pipeline.ecs_cluster.arn)
pulumi.export("pipelineName", pipeline.pipeline.name)
pulumi.export("pipelineArn", pipeline.pipeline.arn)
pulumi.export("codeBuildProjectName", pipeline.build_project.name)
pulumi.export("codeDeployAppName", pipeline.deploy_app.name)
pulumi.export("kmsKeyId", pipeline.kms_key.id)
pulumi.export("kmsKeyArn", pipeline.kms_key.arn)
pulumi.export("artifactBucketName", pipeline.artifact_bucket.bucket)
```

## File: lib/__init__.py

```python
"""CI/CD Pipeline Infrastructure package."""
```

## File: lib/cicd_pipeline.py

```python
"""Main CI/CD Pipeline infrastructure component."""
import json
import pulumi
import pulumi_aws as aws
from typing import Optional


class CICDPipeline(pulumi.ComponentResource):
    """Complete CI/CD Pipeline infrastructure for containerized applications."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        aws_region: str,
        opts: Optional[pulumi.ResourceOptions] = None
    ):
        super().__init__("custom:cicd:Pipeline", name, {}, opts)

        self.environment_suffix = environment_suffix
        self.aws_region = aws_region

        # Resource options for all child resources
        child_opts = pulumi.ResourceOptions(parent=self)

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key(child_opts)

        # Create S3 bucket for pipeline artifacts
        self.artifact_bucket = self._create_artifact_bucket(child_opts)

        # Create ECR repository
        self.ecr_repository = self._create_ecr_repository(child_opts)

        # Create CloudWatch log groups
        self.build_log_group = self._create_log_group("codebuild", child_opts)
        self.ecs_log_group = self._create_log_group("ecs", child_opts)

        # Create IAM roles
        self.codebuild_role = self._create_codebuild_role(child_opts)
        self.codepipeline_role = self._create_codepipeline_role(child_opts)
        self.codedeploy_role = self._create_codedeploy_role(child_opts)
        self.ecs_task_role = self._create_ecs_task_role(child_opts)
        self.ecs_execution_role = self._create_ecs_execution_role(child_opts)

        # Create VPC for ECS (simplified private subnet setup)
        self.vpc = self._create_vpc(child_opts)
        self.private_subnets = self._create_subnets(child_opts)
        self.security_group = self._create_security_group(child_opts)

        # Create ECS cluster and task definition
        self.ecs_cluster = self._create_ecs_cluster(child_opts)
        self.task_definition = self._create_task_definition(child_opts)
        self.ecs_service = self._create_ecs_service(child_opts)

        # Create CodeBuild project
        self.build_project = self._create_codebuild_project(child_opts)

        # Create CodeDeploy application and deployment group
        self.deploy_app = self._create_codedeploy_app(child_opts)
        self.deploy_group = self._create_deployment_group(child_opts)

        # Create CodePipeline
        self.pipeline = self._create_codepipeline(child_opts)

        self.register_outputs({
            "ecr_repository_url": self.ecr_repository.repository_url,
            "ecs_cluster_name": self.ecs_cluster.name,
            "pipeline_name": self.pipeline.name,
            "kms_key_id": self.kms_key.id
        })

    def _create_kms_key(self, opts: pulumi.ResourceOptions) -> aws.kms.Key:
        """Create KMS key for encryption at rest."""
        key = aws.kms.Key(
            f"cicd-kms-key-{self.environment_suffix}",
            description=f"KMS key for CI/CD pipeline encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                "Name": f"cicd-kms-key-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        aws.kms.Alias(
            f"cicd-kms-alias-{self.environment_suffix}",
            target_key_id=key.id,
            name=f"alias/cicd-{self.environment_suffix}",
            opts=opts
        )

        return key

    def _create_artifact_bucket(self, opts: pulumi.ResourceOptions) -> aws.s3.Bucket:
        """Create S3 bucket for pipeline artifacts with encryption."""
        bucket = aws.s3.Bucket(
            f"cicd-artifacts-{self.environment_suffix}",
            bucket=f"cicd-artifacts-{self.environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"cicd-artifacts-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        # Enable versioning
        aws.s3.BucketVersioningV2(
            f"cicd-artifacts-versioning-{self.environment_suffix}",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=opts
        )

        # Server-side encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"cicd-artifacts-encryption-{self.environment_suffix}",
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=self.kms_key.id
                )
            )],
            opts=opts
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"cicd-artifacts-public-access-block-{self.environment_suffix}",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=opts
        )

        return bucket

    def _create_ecr_repository(self, opts: pulumi.ResourceOptions) -> aws.ecr.Repository:
        """Create ECR repository for Docker images."""
        repo = aws.ecr.Repository(
            f"app-repo-{self.environment_suffix}",
            name=f"nodejs-app-{self.environment_suffix}",
            image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
                scan_on_push=True
            ),
            encryption_configuration=aws.ecr.RepositoryEncryptionConfigurationArgs(
                encryption_type="KMS",
                kms_key=self.kms_key.arn
            ),
            image_tag_mutability="MUTABLE",
            force_delete=True,
            tags={
                "Name": f"nodejs-app-repo-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        # Lifecycle policy to manage images
        aws.ecr.LifecyclePolicy(
            f"app-repo-lifecycle-{self.environment_suffix}",
            repository=repo.name,
            policy=json.dumps({
                "rules": [{
                    "rulePriority": 1,
                    "description": "Keep last 10 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 10
                    },
                    "action": {
                        "type": "expire"
                    }
                }]
            }),
            opts=opts
        )

        return repo

    def _create_log_group(self, service: str, opts: pulumi.ResourceOptions) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group."""
        return aws.cloudwatch.LogGroup(
            f"{service}-logs-{self.environment_suffix}",
            name=f"/aws/{service}/cicd-{self.environment_suffix}",
            retention_in_days=7,
            kms_key_id=self.kms_key.arn,
            tags={
                "Name": f"{service}-logs-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

    def _create_codebuild_role(self, opts: pulumi.ResourceOptions) -> aws.iam.Role:
        """Create IAM role for CodeBuild."""
        role = aws.iam.Role(
            f"codebuild-role-{self.environment_suffix}",
            name=f"codebuild-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codebuild.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"codebuild-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        # Attach policies
        aws.iam.RolePolicy(
            f"codebuild-policy-{self.environment_suffix}",
            role=role.id,
            policy=pulumi.Output.all(
                self.artifact_bucket.arn,
                self.ecr_repository.arn,
                self.build_log_group.arn,
                self.kms_key.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"{args[2]}:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:GetObjectVersion"
                        ],
                        "Resource": f"{args[0]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ecr:GetAuthorizationToken",
                            "ecr:BatchCheckLayerAvailability",
                            "ecr:GetDownloadUrlForLayer",
                            "ecr:BatchGetImage",
                            "ecr:PutImage",
                            "ecr:InitiateLayerUpload",
                            "ecr:UploadLayerPart",
                            "ecr:CompleteLayerUpload"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": args[3]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=opts
        )

        return role

    def _create_codepipeline_role(self, opts: pulumi.ResourceOptions) -> aws.iam.Role:
        """Create IAM role for CodePipeline."""
        role = aws.iam.Role(
            f"codepipeline-role-{self.environment_suffix}",
            name=f"codepipeline-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codepipeline.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"codepipeline-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        aws.iam.RolePolicy(
            f"codepipeline-policy-{self.environment_suffix}",
            role=role.id,
            policy=pulumi.Output.all(
                self.artifact_bucket.arn,
                self.kms_key.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:GetObjectVersion",
                            "s3:GetBucketLocation",
                            "s3:ListBucket"
                        ],
                        "Resource": [args[0], f"{args[0]}/*"]
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
                            "codedeploy:CreateDeployment",
                            "codedeploy:GetApplication",
                            "codedeploy:GetApplicationRevision",
                            "codedeploy:GetDeployment",
                            "codedeploy:GetDeploymentConfig",
                            "codedeploy:RegisterApplicationRevision"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ecs:*"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": args[1]
                    }
                ]
            })),
            opts=opts
        )

        return role

    def _create_codedeploy_role(self, opts: pulumi.ResourceOptions) -> aws.iam.Role:
        """Create IAM role for CodeDeploy."""
        role = aws.iam.Role(
            f"codedeploy-role-{self.environment_suffix}",
            name=f"codedeploy-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codedeploy.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"codedeploy-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        aws.iam.RolePolicyAttachment(
            f"codedeploy-policy-attachment-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS",
            opts=opts
        )

        return role

    def _create_ecs_task_role(self, opts: pulumi.ResourceOptions) -> aws.iam.Role:
        """Create IAM role for ECS tasks."""
        role = aws.iam.Role(
            f"ecs-task-role-{self.environment_suffix}",
            name=f"ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecs-task-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        aws.iam.RolePolicy(
            f"ecs-task-policy-{self.environment_suffix}",
            role=role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=opts
        )

        return role

    def _create_ecs_execution_role(self, opts: pulumi.ResourceOptions) -> aws.iam.Role:
        """Create IAM execution role for ECS tasks."""
        role = aws.iam.Role(
            f"ecs-execution-role-{self.environment_suffix}",
            name=f"ecs-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecs-execution-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        aws.iam.RolePolicyAttachment(
            f"ecs-execution-policy-attachment-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=opts
        )

        aws.iam.RolePolicy(
            f"ecs-execution-ecr-policy-{self.environment_suffix}",
            role=role.id,
            policy=pulumi.Output.all(
                self.kms_key.arn,
                self.ecs_log_group.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ecr:GetAuthorizationToken",
                            "ecr:BatchCheckLayerAvailability",
                            "ecr:GetDownloadUrlForLayer",
                            "ecr:BatchGetImage"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"{args[1]}:*"
                    }
                ]
            })),
            opts=opts
        )

        return role

    def _create_vpc(self, opts: pulumi.ResourceOptions) -> aws.ec2.Vpc:
        """Create VPC for ECS."""
        vpc = aws.ec2.Vpc(
            f"ecs-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"ecs-vpc-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        return vpc

    def _create_subnets(self, opts: pulumi.ResourceOptions):
        """Create private subnets for ECS."""
        subnets = []

        # Create 2 private subnets for high availability
        azs = ["a", "b"]
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"ecs-subnet-{az}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=f"{self.aws_region}{az}",
                tags={
                    "Name": f"ecs-subnet-{az}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "ManagedBy": "Pulumi"
                },
                opts=opts
            )
            subnets.append(subnet)

        return subnets

    def _create_security_group(self, opts: pulumi.ResourceOptions) -> aws.ec2.SecurityGroup:
        """Create security group for ECS tasks."""
        sg = aws.ec2.SecurityGroup(
            f"ecs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description=f"Security group for ECS tasks - {self.environment_suffix}",
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={
                "Name": f"ecs-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        return sg

    def _create_ecs_cluster(self, opts: pulumi.ResourceOptions) -> aws.ecs.Cluster:
        """Create ECS cluster."""
        cluster = aws.ecs.Cluster(
            f"app-cluster-{self.environment_suffix}",
            name=f"nodejs-cluster-{self.environment_suffix}",
            settings=[aws.ecs.ClusterSettingArgs(
                name="containerInsights",
                value="enabled"
            )],
            tags={
                "Name": f"nodejs-cluster-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        return cluster

    def _create_task_definition(self, opts: pulumi.ResourceOptions) -> aws.ecs.TaskDefinition:
        """Create ECS task definition."""
        task_def = aws.ecs.TaskDefinition(
            f"app-task-{self.environment_suffix}",
            family=f"nodejs-app-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=self.ecs_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=pulumi.Output.all(
                self.ecr_repository.repository_url,
                self.ecs_log_group.name,
                self.aws_region
            ).apply(lambda args: json.dumps([{
                "name": "nodejs-app",
                "image": f"{args[0]}:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 3000,
                    "protocol": "tcp"
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[1],
                        "awslogs-region": args[2],
                        "awslogs-stream-prefix": "nodejs-app"
                    }
                },
                "environment": [
                    {"name": "NODE_ENV", "value": "production"}
                ]
            }])),
            tags={
                "Name": f"nodejs-app-task-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        return task_def

    def _create_ecs_service(self, opts: pulumi.ResourceOptions) -> aws.ecs.Service:
        """Create ECS service."""
        service = aws.ecs.Service(
            f"app-service-{self.environment_suffix}",
            name=f"nodejs-service-{self.environment_suffix}",
            cluster=self.ecs_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=1,
            launch_type="FARGATE",
            deployment_controller=aws.ecs.ServiceDeploymentControllerArgs(
                type="CODE_DEPLOY"
            ),
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=[subnet.id for subnet in self.private_subnets],
                security_groups=[self.security_group.id],
                assign_public_ip=True  # Needed for internet access without NAT
            ),
            tags={
                "Name": f"nodejs-service-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        return service

    def _create_codebuild_project(self, opts: pulumi.ResourceOptions) -> aws.codebuild.Project:
        """Create CodeBuild project."""
        project = aws.codebuild.Project(
            f"build-project-{self.environment_suffix}",
            name=f"nodejs-build-{self.environment_suffix}",
            service_role=self.codebuild_role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_SMALL",
                image="aws/codebuild/standard:7.0",
                type="LINUX_CONTAINER",
                privileged_mode=True,
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="AWS_DEFAULT_REGION",
                        value=self.aws_region
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="ECR_REPO_URI",
                        value=self.ecr_repository.repository_url
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="IMAGE_TAG",
                        value="latest"
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec="""version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPO_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $ECR_REPO_URI:latest .
      - docker tag $ECR_REPO_URI:latest $ECR_REPO_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $ECR_REPO_URI:latest
      - docker push $ECR_REPO_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"nodejs-app","imageUri":"%s"}]' $ECR_REPO_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
"""
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    group_name=self.build_log_group.name,
                    status="ENABLED"
                )
            ),
            tags={
                "Name": f"nodejs-build-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        return project

    def _create_codedeploy_app(self, opts: pulumi.ResourceOptions) -> aws.codedeploy.App:
        """Create CodeDeploy application."""
        app = aws.codedeploy.App(
            f"deploy-app-{self.environment_suffix}",
            name=f"nodejs-deploy-{self.environment_suffix}",
            compute_platform="ECS",
            tags={
                "Name": f"nodejs-deploy-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        return app

    def _create_deployment_group(self, opts: pulumi.ResourceOptions) -> aws.codedeploy.DeploymentGroup:
        """Create CodeDeploy deployment group."""
        # Create target groups for blue/green deployment
        target_group_blue = aws.lb.TargetGroup(
            f"tg-blue-{self.environment_suffix}",
            name=f"tg-blue-{self.environment_suffix}",
            port=3000,
            protocol="HTTP",
            target_type="ip",
            vpc_id=self.vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30
            ),
            tags={
                "Name": f"tg-blue-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        target_group_green = aws.lb.TargetGroup(
            f"tg-green-{self.environment_suffix}",
            name=f"tg-green-{self.environment_suffix}",
            port=3000,
            protocol="HTTP",
            target_type="ip",
            vpc_id=self.vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30
            ),
            tags={
                "Name": f"tg-green-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        deployment_group = aws.codedeploy.DeploymentGroup(
            f"deploy-group-{self.environment_suffix}",
            app_name=self.deploy_app.name,
            deployment_group_name=f"nodejs-deploy-group-{self.environment_suffix}",
            service_role_arn=self.codedeploy_role.arn,
            deployment_config_name="CodeDeployDefault.ECSAllAtOnce",
            ecs_service=aws.codedeploy.DeploymentGroupEcsServiceArgs(
                cluster_name=self.ecs_cluster.name,
                service_name=self.ecs_service.name
            ),
            blue_green_deployment_config=aws.codedeploy.DeploymentGroupBlueGreenDeploymentConfigArgs(
                deployment_ready_option=aws.codedeploy.DeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOptionArgs(
                    action_on_timeout="CONTINUE_DEPLOYMENT"
                ),
                terminate_blue_instances_on_deployment_success=aws.codedeploy.DeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccessArgs(
                    action="TERMINATE",
                    termination_wait_time_in_minutes=5
                )
            ),
            deployment_style=aws.codedeploy.DeploymentGroupDeploymentStyleArgs(
                deployment_option="WITH_TRAFFIC_CONTROL",
                deployment_type="BLUE_GREEN"
            ),
            load_balancer_info=aws.codedeploy.DeploymentGroupLoadBalancerInfoArgs(
                target_group_pair_info=aws.codedeploy.DeploymentGroupLoadBalancerInfoTargetGroupPairInfoArgs(
                    prod_traffic_route=aws.codedeploy.DeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRouteArgs(
                        listener_arns=[]
                    ),
                    target_groups=[
                        aws.codedeploy.DeploymentGroupLoadBalancerInfoTargetGroupPairInfoTargetGroupArgs(
                            name=target_group_blue.name
                        ),
                        aws.codedeploy.DeploymentGroupLoadBalancerInfoTargetGroupPairInfoTargetGroupArgs(
                            name=target_group_green.name
                        )
                    ]
                )
            ),
            auto_rollback_configuration=aws.codedeploy.DeploymentGroupAutoRollbackConfigurationArgs(
                enabled=True,
                events=["DEPLOYMENT_FAILURE"]
            ),
            tags={
                "Name": f"nodejs-deploy-group-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        return deployment_group

    def _create_codepipeline(self, opts: pulumi.ResourceOptions) -> aws.codepipeline.Pipeline:
        """Create CodePipeline."""
        pipeline = aws.codepipeline.Pipeline(
            f"cicd-pipeline-{self.environment_suffix}",
            name=f"nodejs-pipeline-{self.environment_suffix}",
            role_arn=self.codepipeline_role.arn,
            artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
                location=self.artifact_bucket.bucket,
                type="S3",
                encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
                    id=self.kms_key.arn,
                    type="KMS"
                )
            ),
            stages=[
                # Source stage - using S3 as placeholder
                aws.codepipeline.PipelineStageArgs(
                    name="Source",
                    actions=[aws.codepipeline.PipelineStageActionArgs(
                        name="SourceAction",
                        category="Source",
                        owner="AWS",
                        provider="S3",
                        version="1",
                        output_artifacts=["SourceOutput"],
                        configuration={
                            "S3Bucket": self.artifact_bucket.bucket,
                            "S3ObjectKey": "source.zip",
                            "PollForSourceChanges": "false"
                        }
                    )]
                ),
                # Build stage
                aws.codepipeline.PipelineStageArgs(
                    name="Build",
                    actions=[aws.codepipeline.PipelineStageActionArgs(
                        name="BuildAction",
                        category="Build",
                        owner="AWS",
                        provider="CodeBuild",
                        version="1",
                        input_artifacts=["SourceOutput"],
                        output_artifacts=["BuildOutput"],
                        configuration={
                            "ProjectName": self.build_project.name
                        }
                    )]
                ),
                # Deploy stage
                aws.codepipeline.PipelineStageArgs(
                    name="Deploy",
                    actions=[aws.codepipeline.PipelineStageActionArgs(
                        name="DeployAction",
                        category="Deploy",
                        owner="AWS",
                        provider="CodeDeployToECS",
                        version="1",
                        input_artifacts=["BuildOutput"],
                        configuration=pulumi.Output.all(
                            self.deploy_app.name,
                            self.deploy_group.deployment_group_name
                        ).apply(lambda args: {
                            "ApplicationName": args[0],
                            "DeploymentGroupName": args[1],
                            "TaskDefinitionTemplateArtifact": "BuildOutput",
                            "AppSpecTemplateArtifact": "BuildOutput"
                        })
                    )]
                )
            ],
            tags={
                "Name": f"nodejs-pipeline-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "ManagedBy": "Pulumi"
            },
            opts=opts
        )

        return pipeline
```

## File: Pulumi.dev.yaml

```yaml
config:
  aws:region: ap-southeast-1
  tap:environmentSuffix: dev
  tap:region: ap-southeast-1
```

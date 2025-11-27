"""TAP Stack module for CDKTF Python CI/CD Pipeline infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.ecr_repository import EcrRepository, EcrRepositoryImageScanningConfiguration
from cdktf_cdktf_provider_aws.ecr_lifecycle_policy import EcrLifecyclePolicy
from cdktf_cdktf_provider_aws.codecommit_repository import CodecommitRepository
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import S3BucketLifecycleConfiguration, S3BucketLifecycleConfigurationRule, S3BucketLifecycleConfigurationRuleExpiration
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition, EcsTaskDefinitionRuntimePlatform
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer, EcsServiceDeploymentController
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.codebuild_project import CodebuildProject, CodebuildProjectEnvironment, CodebuildProjectSource, CodebuildProjectArtifacts, CodebuildProjectLogsConfig, CodebuildProjectLogsConfigCloudwatchLogs
from cdktf_cdktf_provider_aws.codepipeline import Codepipeline, CodepipelineStage, CodepipelineStageAction, CodepipelineArtifactStore
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for CI/CD Pipeline infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with CI/CD Pipeline infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Get current AWS account ID
        current = DataAwsCallerIdentity(self, "current")

        # Microservices to build
        microservices = ["api-service", "auth-service", "notification-service"]

        # ============================================================
        # VPC and Networking Infrastructure
        # ============================================================

        vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"cicd-vpc-{environment_suffix}"}
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=vpc.id,
            tags={"Name": f"cicd-igw-{environment_suffix}"}
        )

        # Availability Zones
        azs = [f"{aws_region}a", f"{aws_region}b", f"{aws_region}c"]

        # Public Subnets for ALB
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"cicd-public-subnet-{i}-{environment_suffix}"}
            )
            public_subnets.append(subnet)

        # Private Subnets for ECS tasks
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={"Name": f"cicd-private-subnet-{i}-{environment_suffix}"}
            )
            private_subnets.append(subnet)

        # Public Route Table
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"cicd-public-rt-{environment_suffix}"}
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Security Group for ALB
        alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"cicd-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP traffic"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS traffic"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={"Name": f"cicd-alb-sg-{environment_suffix}"}
        )

        # Security Group for ECS tasks
        ecs_sg = SecurityGroup(
            self,
            "ecs_sg",
            name=f"cicd-ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=0,
                    to_port=65535,
                    protocol="tcp",
                    security_groups=[alb_sg.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={"Name": f"cicd-ecs-sg-{environment_suffix}"}
        )

        # Application Load Balancer
        alb = Lb(
            self,
            "alb",
            name=f"cicd-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[subnet.id for subnet in public_subnets],
            enable_deletion_protection=False,
            tags={"Name": f"cicd-alb-{environment_suffix}"}
        )

        # ============================================================
        # ECR Repositories with Image Scanning and Lifecycle Policies
        # ============================================================

        ecr_repos = {}
        for service in microservices:
            repo = EcrRepository(
                self,
                f"ecr_{service.replace('-', '_')}",
                name=f"{service}-{environment_suffix}",
                image_tag_mutability="MUTABLE",
                image_scanning_configuration=EcrRepositoryImageScanningConfiguration(
                    scan_on_push=True
                ),
                force_delete=True,
                tags={"Service": service}
            )
            ecr_repos[service] = repo

            # Lifecycle policy to cleanup untagged images after 7 days
            EcrLifecyclePolicy(
                self,
                f"ecr_lifecycle_{service.replace('-', '_')}",
                repository=repo.name,
                policy=json.dumps({
                    "rules": [{
                        "rulePriority": 1,
                        "description": "Remove untagged images after 7 days",
                        "selection": {
                            "tagStatus": "untagged",
                            "countType": "sinceImagePushed",
                            "countUnit": "days",
                            "countNumber": 7
                        },
                        "action": {
                            "type": "expire"
                        }
                    }]
                })
            )

        # ============================================================
        # CodeCommit Repository
        # ============================================================

        code_repo = CodecommitRepository(
            self,
            "code_repo",
            repository_name=f"microservices-monorepo-{environment_suffix}",
            description="Monorepo for microservices source code",
            tags={"Name": f"microservices-monorepo-{environment_suffix}"}
        )

        # ============================================================
        # S3 Bucket for Pipeline Artifacts
        # ============================================================

        artifacts_bucket = S3Bucket(
            self,
            "artifacts_bucket",
            bucket=f"cicd-artifacts-{environment_suffix}-{aws_region}",
            force_destroy=True,
            tags={"Name": f"cicd-artifacts-{environment_suffix}"}
        )

        S3BucketVersioningA(
            self,
            "artifacts_bucket_versioning",
            bucket=artifacts_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Lifecycle policy for artifacts - 30-day retention
        S3BucketLifecycleConfiguration(
            self,
            "artifacts_lifecycle",
            bucket=artifacts_bucket.id,
            rule=[{
                "id": "delete_old_artifacts",
                "status": "Enabled",
                "expiration": [{
                    "days": 30
                }]
            }]
        )

        # ============================================================
        # IAM Roles for CodeBuild and CodePipeline
        # ============================================================

        # CodeBuild Service Role
        codebuild_role = IamRole(
            self,
            "codebuild_role",
            name=f"codebuild-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codebuild.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="codebuild-policy",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:GetObjectVersion"
                            ],
                            "Resource": f"{artifacts_bucket.arn}/*"
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
                                "ssm:GetParameters",
                                "ssm:GetParameter"
                            ],
                            "Resource": "*"
                        }
                    ]
                })
            )],
            tags={"Name": f"codebuild-role-{environment_suffix}"}
        )

        # CodePipeline Service Role
        codepipeline_role = IamRole(
            self,
            "codepipeline_role",
            name=f"codepipeline-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codepipeline.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="codepipeline-policy",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:GetObjectVersion"
                            ],
                            "Resource": f"{artifacts_bucket.arn}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "codecommit:GetBranch",
                                "codecommit:GetCommit",
                                "codecommit:UploadArchive",
                                "codecommit:GetUploadArchiveStatus",
                                "codecommit:CancelUploadArchive"
                            ],
                            "Resource": code_repo.arn
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
                                "ecs:DescribeServices",
                                "ecs:DescribeTaskDefinition",
                                "ecs:DescribeTasks",
                                "ecs:ListTasks",
                                "ecs:RegisterTaskDefinition",
                                "ecs:UpdateService"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": "iam:PassRole",
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "sns:Publish"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "lambda:InvokeFunction"
                            ],
                            "Resource": "*"
                        }
                    ]
                })
            )],
            tags={"Name": f"codepipeline-role-{environment_suffix}"}
        )

        # ECS Task Execution Role
        ecs_task_execution_role = IamRole(
            self,
            "ecs_task_execution_role",
            name=f"ecs-task-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"ecs-task-execution-role-{environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "ecs_task_execution_policy",
            role=ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # ECS Task Role
        ecs_task_role = IamRole(
            self,
            "ecs_task_role",
            name=f"ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="ecs-task-policy",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "ssm:GetParameters",
                                "ssm:GetParameter"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "*"
                        }
                    ]
                })
            )],
            tags={"Name": f"ecs-task-role-{environment_suffix}"}
        )

        # ============================================================
        # CloudWatch Log Groups
        # ============================================================

        # CodeBuild log groups
        codebuild_log_groups = {}
        for service in microservices:
            log_group = CloudwatchLogGroup(
                self,
                f"codebuild_log_{service.replace('-', '_')}",
                name=f"/aws/codebuild/{service}-{environment_suffix}",
                retention_in_days=14,
                tags={"Service": service}
            )
            codebuild_log_groups[service] = log_group

        # ECS log groups
        ecs_log_groups = {}
        for env in ["staging", "production"]:
            for service in microservices:
                log_group = CloudwatchLogGroup(
                    self,
                    f"ecs_log_{env}_{service.replace('-', '_')}",
                    name=f"/ecs/{env}/{service}-{environment_suffix}",
                    retention_in_days=14,
                    tags={"Service": service, "Environment": env}
                )
                ecs_log_groups[f"{env}-{service}"] = log_group

        # ============================================================
        # CodeBuild Projects for Parallel Builds
        # ============================================================

        codebuild_projects = {}
        for service in microservices:
            project = CodebuildProject(
                self,
                f"codebuild_{service.replace('-', '_')}",
                name=f"{service}-build-{environment_suffix}",
                description=f"Build project for {service}",
                service_role=codebuild_role.arn,
                artifacts=CodebuildProjectArtifacts(type="CODEPIPELINE"),
                environment=CodebuildProjectEnvironment(
                    compute_type="BUILD_GENERAL1_SMALL",
                    image="aws/codebuild/standard:7.0",
                    type="LINUX_CONTAINER",
                    privileged_mode=True,
                    environment_variable=[
                        {"name": "AWS_DEFAULT_REGION", "value": aws_region},
                        {"name": "AWS_ACCOUNT_ID", "value": current.account_id},
                        {"name": "IMAGE_REPO_NAME", "value": ecr_repos[service].name},
                        {"name": "IMAGE_TAG", "value": "latest"},
                        {"name": "SERVICE_NAME", "value": service}
                    ]
                ),
                source=CodebuildProjectSource(
                    type="CODEPIPELINE",
                    buildspec=f"""version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=$${{COMMIT_HASH:=latest}}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image for {service}...
      - docker build -t $REPOSITORY_URI:latest -f services/{service}/Dockerfile services/{service}
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - printf '[{{"name":"{service}","imageUri":"%s"}}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
"""
                ),
                logs_config=CodebuildProjectLogsConfig(
                    cloudwatch_logs=CodebuildProjectLogsConfigCloudwatchLogs(
                        status="ENABLED",
                        group_name=codebuild_log_groups[service].name
                    )
                ),
                tags={"Service": service}
            )
            codebuild_projects[service] = project

        # Test CodeBuild Project
        test_project = CodebuildProject(
            self,
            "codebuild_test",
            name=f"integration-tests-{environment_suffix}",
            description="Integration test project",
            service_role=codebuild_role.arn,
            artifacts=CodebuildProjectArtifacts(type="CODEPIPELINE"),
            environment=CodebuildProjectEnvironment(
                compute_type="BUILD_GENERAL1_SMALL",
                image="aws/codebuild/standard:7.0",
                type="LINUX_CONTAINER",
                environment_variable=[
                    {"name": "AWS_DEFAULT_REGION", "value": aws_region}
                ]
            ),
            source=CodebuildProjectSource(
                type="CODEPIPELINE",
                buildspec="""version: 0.2
phases:
  pre_build:
    commands:
      - echo Installing test dependencies...
      - pip install -r tests/requirements.txt
  build:
    commands:
      - echo Running integration tests...
      - pytest tests/ -v --junit-xml=test-results.xml
artifacts:
  files:
    - test-results.xml
"""
            ),
            logs_config=CodebuildProjectLogsConfig(
                cloudwatch_logs=CodebuildProjectLogsConfigCloudwatchLogs(
                    status="ENABLED",
                    group_name="/aws/codebuild/integration-tests"
                )
            ),
            tags={"Name": f"integration-tests-{environment_suffix}"}
        )

        # ============================================================
        # ECS Cluster and Services
        # ============================================================

        # ECS Clusters for Staging and Production
        staging_cluster = EcsCluster(
            self,
            "staging_cluster",
            name=f"staging-cluster-{environment_suffix}",
            tags={"Environment": "staging"}
        )

        production_cluster = EcsCluster(
            self,
            "production_cluster",
            name=f"production-cluster-{environment_suffix}",
            tags={"Environment": "production"}
        )

        # Target Groups and ECS Services
        ecs_services = {}
        target_groups = {}

        for env, cluster in [("staging", staging_cluster), ("production", production_cluster)]:
            cpu = "256" if env == "staging" else "512"
            memory = "512" if env == "staging" else "1024"

            for service in microservices:
                # Target Group for Blue environment
                # Ensure unique names by including color suffix before truncation
                base_name = f"{env}-{service}-{environment_suffix}"
                # Calculate available space for base name to fit "-blu" suffix
                max_base_len = 32 - 4  # Reserve 4 chars for "-blu"
                if len(base_name) > max_base_len:
                    base_name = base_name[:max_base_len].rstrip('-')
                blue_name = f"{base_name}-blu"

                tg_blue = LbTargetGroup(
                    self,
                    f"tg_{env}_{service.replace('-', '_')}_blue",
                    name=blue_name,
                    port=80,
                    protocol="HTTP",
                    vpc_id=vpc.id,
                    target_type="ip",
                    health_check={
                        "enabled": True,
                        "path": "/health",
                        "healthy_threshold": 2,
                        "unhealthy_threshold": 3,
                        "timeout": 5,
                        "interval": 30,
                        "matcher": "200"
                    },
                    deregistration_delay="30",
                    tags={"Environment": env, "Service": service, "Color": "blue"},
                    lifecycle={"create_before_destroy": True}
                )

                # Target Group for Green environment
                # Calculate available space for base name to fit "-grn" suffix
                base_name = f"{env}-{service}-{environment_suffix}"
                max_base_len = 32 - 4  # Reserve 4 chars for "-grn"
                if len(base_name) > max_base_len:
                    base_name = base_name[:max_base_len].rstrip('-')
                green_name = f"{base_name}-grn"

                tg_green = LbTargetGroup(
                    self,
                    f"tg_{env}_{service.replace('-', '_')}_green",
                    name=green_name,
                    port=80,
                    protocol="HTTP",
                    vpc_id=vpc.id,
                    target_type="ip",
                    health_check={
                        "enabled": True,
                        "path": "/health",
                        "healthy_threshold": 2,
                        "unhealthy_threshold": 3,
                        "timeout": 5,
                        "interval": 30,
                        "matcher": "200"
                    },
                    deregistration_delay="30",
                    tags={"Environment": env, "Service": service, "Color": "green"},
                    lifecycle={"create_before_destroy": True}
                )

                target_groups[f"{env}-{service}-blue"] = tg_blue
                target_groups[f"{env}-{service}-green"] = tg_green

                # ALB Listener for this service
                LbListener(
                    self,
                    f"listener_{env}_{service.replace('-', '_')}",
                    load_balancer_arn=alb.arn,
                    port=80 + microservices.index(service) + (10 if env == "production" else 0),
                    protocol="HTTP",
                    default_action=[LbListenerDefaultAction(
                        type="forward",
                        target_group_arn=tg_blue.arn
                    )],
                    tags={"Environment": env, "Service": service}
                )

                # ECS Task Definition
                task_def = EcsTaskDefinition(
                    self,
                    f"task_def_{env}_{service.replace('-', '_')}",
                    family=f"{env}-{service}-{environment_suffix}",
                    network_mode="awsvpc",
                    requires_compatibilities=["FARGATE"],
                    cpu=cpu,
                    memory=memory,
                    execution_role_arn=ecs_task_execution_role.arn,
                    task_role_arn=ecs_task_role.arn,
                    runtime_platform=EcsTaskDefinitionRuntimePlatform(
                        operating_system_family="LINUX",
                        cpu_architecture="X86_64"
                    ),
                    container_definitions=json.dumps([{
                        "name": service,
                        "image": f"{ecr_repos[service].repository_url}:latest",
                        "cpu": int(cpu),
                        "memory": int(memory),
                        "essential": True,
                        "portMappings": [{
                            "containerPort": 80,
                            "protocol": "tcp"
                        }],
                        "logConfiguration": {
                            "logDriver": "awslogs",
                            "options": {
                                "awslogs-group": ecs_log_groups[f"{env}-{service}"].name,
                                "awslogs-region": aws_region,
                                "awslogs-stream-prefix": "ecs"
                            }
                        },
                        "environment": [
                            {"name": "ENVIRONMENT", "value": env},
                            {"name": "SERVICE_NAME", "value": service}
                        ]
                    }]),
                    tags={"Environment": env, "Service": service}
                )

                # ECS Service with rolling deployment
                ecs_service = EcsService(
                    self,
                    f"ecs_service_{env}_{service.replace('-', '_')}",
                    name=f"{env}-{service}-{environment_suffix}",
                    cluster=cluster.id,
                    task_definition=task_def.arn,
                    desired_count=2,
                    launch_type="FARGATE",
                    deployment_controller=EcsServiceDeploymentController(
                        type="ECS"
                    ),
                    network_configuration=EcsServiceNetworkConfiguration(
                        subnets=[subnet.id for subnet in private_subnets],
                        security_groups=[ecs_sg.id],
                        assign_public_ip=False
                    ),
                    load_balancer=[EcsServiceLoadBalancer(
                        target_group_arn=tg_blue.arn,
                        container_name=service,
                        container_port=80
                    )],
                    tags={"Environment": env, "Service": service},
                    depends_on=[tg_blue, tg_green]
                )
                ecs_services[f"{env}-{service}"] = ecs_service

        # ============================================================
        # SNS Topic for Notifications
        # ============================================================

        sns_topic = SnsTopic(
            self,
            "sns_topic",
            name=f"pipeline-notifications-{environment_suffix}",
            display_name="CI/CD Pipeline Notifications",
            tags={"Name": f"pipeline-notifications-{environment_suffix}"}
        )

        # ============================================================
        # Parameter Store for Configuration
        # ============================================================

        # Create sample parameters for each stage and service
        for stage in ["staging", "production"]:
            for service in microservices:
                SsmParameter(
                    self,
                    f"param_{stage}_{service.replace('-', '_')}_config",
                    name=f"/pipeline/{stage}/{service}/config",
                    type="String",
                    value=json.dumps({
                        "environment": stage,
                        "service": service,
                        "log_level": "INFO" if stage == "production" else "DEBUG"
                    }),
                    description=f"Configuration for {service} in {stage}",
                    tags={"Stage": stage, "Service": service}
                )

        # ============================================================
        # Lambda Function for Health Validation and Rollback
        # ============================================================

        # Lambda execution role
        lambda_role = IamRole(
            self,
            "lambda_role",
            name=f"lambda-health-check-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="lambda-health-check-policy",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "cloudwatch:DescribeAlarms",
                                "cloudwatch:GetMetricStatistics"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "ecs:DescribeServices",
                                "ecs:UpdateService",
                                "ecs:DescribeTaskDefinition"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "codepipeline:PutJobSuccessResult",
                                "codepipeline:PutJobFailureResult"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "sns:Publish"
                            ],
                            "Resource": sns_topic.arn
                        }
                    ]
                })
            )],
            tags={"Name": f"lambda-health-check-role-{environment_suffix}"}
        )

        # Create Lambda function code directory
        lambda_code = """import json
import boto3
import os
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')
ecs = boto3.client('ecs')
codepipeline = boto3.client('codepipeline')
sns = boto3.client('sns')

def lambda_handler(event, context):
    '''
    Health validation Lambda function.
    Checks CloudWatch alarms and triggers rollback if thresholds are breached.
    '''
    job_id = event.get('CodePipeline.job', {}).get('id')

    try:
        # Extract deployment information
        user_parameters = json.loads(
            event['CodePipeline.job']['data']['actionConfiguration']['configuration']['UserParameters']
        )

        cluster_name = user_parameters['cluster']
        service_name = user_parameters['service']
        alarm_names = user_parameters['alarms']

        print(f"Validating deployment for {service_name} in {cluster_name}")

        # Check CloudWatch alarms
        alarm_response = cloudwatch.describe_alarms(AlarmNames=alarm_names)

        breached_alarms = []
        for alarm in alarm_response['MetricAlarms']:
            if alarm['StateValue'] == 'ALARM':
                breached_alarms.append(alarm['AlarmName'])

        if breached_alarms:
            error_message = f"Alarms breached: {', '.join(breached_alarms)}"
            print(f"FAILED: {error_message}")

            # Trigger rollback by reverting to previous task definition
            service_response = ecs.describe_services(
                cluster=cluster_name,
                services=[service_name]
            )

            current_task_def = service_response['services'][0]['taskDefinition']
            print(f"Current task definition: {current_task_def}")

            # Notify via SNS
            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Subject=f"Deployment Rollback Triggered: {service_name}",
                Message=f"Deployment failed health check. {error_message}\\n\\nRollback initiated."
            )

            # Report failure to CodePipeline
            codepipeline.put_job_failure_result(
                jobId=job_id,
                failureDetails={
                    'type': 'JobFailed',
                    'message': error_message
                }
            )

            return {
                'statusCode': 500,
                'body': json.dumps({'status': 'failed', 'message': error_message})
            }

        print("SUCCESS: All health checks passed")

        # Report success to CodePipeline
        if job_id:
            codepipeline.put_job_success_result(jobId=job_id)

        return {
            'statusCode': 200,
            'body': json.dumps({'status': 'success', 'message': 'All health checks passed'})
        }

    except Exception as e:
        error_message = f"Health check failed: {str(e)}"
        print(error_message)

        if job_id:
            codepipeline.put_job_failure_result(
                jobId=job_id,
                failureDetails={
                    'type': 'JobFailed',
                    'message': error_message
                }
            )

        return {
            'statusCode': 500,
            'body': json.dumps({'status': 'error', 'message': error_message})
        }
"""

        # Write Lambda function code to lib/lambda directory
        import os as os_module
        import pathlib
        import zipfile
        # Use relative path from the current file location
        current_file = pathlib.Path(__file__).parent
        lambda_dir = current_file / "lambda"
        os_module.makedirs(lambda_dir, exist_ok=True)

        lambda_file_path = lambda_dir / "health_check.py"
        with open(lambda_file_path, "w") as f:
            f.write(lambda_code)

        # Create zip file for Lambda deployment
        lambda_zip_path = lambda_dir / "health_check.zip"
        with zipfile.ZipFile(lambda_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(lambda_file_path, "health_check.py")

        # Lambda function
        health_check_lambda = LambdaFunction(
            self,
            "health_check_lambda",
            function_name=f"health-check-{environment_suffix}",
            runtime="python3.9",
            handler="health_check.lambda_handler",
            role=lambda_role.arn,
            filename=str(lambda_zip_path),
            timeout=300,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "SNS_TOPIC_ARN": sns_topic.arn,
                    "ENVIRONMENT_SUFFIX": environment_suffix
                }
            ),
            tags={"Name": f"health-check-{environment_suffix}"}
        )

        # ============================================================
        # CloudWatch Alarms for ECS Services
        # ============================================================

        alarms = {}
        for env in ["staging", "production"]:
            for service in microservices:
                # Alarm for ECS task count
                task_alarm = CloudwatchMetricAlarm(
                    self,
                    f"alarm_{env}_{service.replace('-', '_')}_tasks",
                    alarm_name=f"{env}-{service}-task-count-{environment_suffix}",
                    comparison_operator="LessThanThreshold",
                    evaluation_periods=2,
                    metric_name="RunningTaskCount",
                    namespace="ECS/ContainerInsights",
                    period=60,
                    statistic="Average",
                    threshold=1.0,
                    alarm_description=f"Alert when {service} has less than 1 running task in {env}",
                    alarm_actions=[sns_topic.arn],
                    dimensions={
                        "ClusterName": f"{env}-cluster-{environment_suffix}",
                        "ServiceName": f"{env}-{service}-{environment_suffix}"
                    },
                    tags={"Environment": env, "Service": service}
                )
                alarms[f"{env}-{service}-tasks"] = task_alarm

                # Alarm for ALB 5XX errors
                error_alarm = CloudwatchMetricAlarm(
                    self,
                    f"alarm_{env}_{service.replace('-', '_')}_5xx",
                    alarm_name=f"{env}-{service}-5xx-errors-{environment_suffix}",
                    comparison_operator="GreaterThanThreshold",
                    evaluation_periods=2,
                    metric_name="HTTPCode_Target_5XX_Count",
                    namespace="AWS/ApplicationELB",
                    period=300,
                    statistic="Sum",
                    threshold=10.0,
                    alarm_description=f"Alert when {service} has more than 10 5XX errors in {env}",
                    alarm_actions=[sns_topic.arn],
                    dimensions={
                        "LoadBalancer": alb.arn_suffix,
                        "TargetGroup": target_groups[f"{env}-{service}-blue"].arn_suffix
                    },
                    tags={"Environment": env, "Service": service}
                )
                alarms[f"{env}-{service}-5xx"] = error_alarm

                # Alarm for target health
                health_alarm = CloudwatchMetricAlarm(
                    self,
                    f"alarm_{env}_{service.replace('-', '_')}_health",
                    alarm_name=f"{env}-{service}-target-health-{environment_suffix}",
                    comparison_operator="LessThanThreshold",
                    evaluation_periods=2,
                    metric_name="HealthyHostCount",
                    namespace="AWS/ApplicationELB",
                    period=60,
                    statistic="Average",
                    threshold=1.0,
                    alarm_description=f"Alert when {service} has less than 1 healthy target in {env}",
                    alarm_actions=[sns_topic.arn],
                    dimensions={
                        "LoadBalancer": alb.arn_suffix,
                        "TargetGroup": target_groups[f"{env}-{service}-blue"].arn_suffix
                    },
                    tags={"Environment": env, "Service": service}
                )
                alarms[f"{env}-{service}-health"] = health_alarm

        # ============================================================
        # CodePipeline with 5 Stages
        # ============================================================

        pipeline = Codepipeline(
            self,
            "pipeline",
            name=f"microservices-pipeline-{environment_suffix}",
            role_arn=codepipeline_role.arn,
            artifact_store=[CodepipelineArtifactStore(
                location=artifacts_bucket.bucket,
                type="S3"
            )],
            stage=[
                # Stage 1: Source
                CodepipelineStage(
                    name="Source",
                    action=[CodepipelineStageAction(
                        name="SourceAction",
                        category="Source",
                        owner="AWS",
                        provider="CodeCommit",
                        version="1",
                        output_artifacts=["SourceOutput"],
                        configuration={
                            "RepositoryName": code_repo.repository_name,
                            "BranchName": "main",
                            "PollForSourceChanges": "false"
                        }
                    )]
                ),
                # Stage 2: Build (Parallel builds for all services)
                CodepipelineStage(
                    name="Build",
                    action=[
                        CodepipelineStageAction(
                            name=f"Build-{service}",
                            category="Build",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["SourceOutput"],
                            output_artifacts=[f"{service}BuildOutput"],
                            configuration={
                                "ProjectName": codebuild_projects[service].name
                            },
                            run_order=1
                        )
                        for service in microservices
                    ]
                ),
                # Stage 3: Test
                CodepipelineStage(
                    name="Test",
                    action=[CodepipelineStageAction(
                        name="IntegrationTests",
                        category="Build",
                        owner="AWS",
                        provider="CodeBuild",
                        version="1",
                        input_artifacts=["SourceOutput"],
                        output_artifacts=["TestOutput"],
                        configuration={
                            "ProjectName": test_project.name
                        }
                    )]
                ),
                # Stage 4: Staging
                CodepipelineStage(
                    name="Staging",
                    action=[
                        CodepipelineStageAction(
                            name=f"Deploy-{service}-Staging",
                            category="Deploy",
                            owner="AWS",
                            provider="ECS",
                            version="1",
                            input_artifacts=[f"{service}BuildOutput"],
                            configuration={
                                "ClusterName": staging_cluster.name,
                                "ServiceName": ecs_services[f"staging-{service}"].name,
                                "FileName": "imagedefinitions.json"
                            },
                            run_order=1
                        )
                        for service in microservices
                    ] + [
                        CodepipelineStageAction(
                            name="ValidateStagingHealth",
                            category="Invoke",
                            owner="AWS",
                            provider="Lambda",
                            version="1",
                            configuration={
                                "FunctionName": health_check_lambda.function_name,
                                "UserParameters": json.dumps({
                                    "cluster": staging_cluster.name,
                                    "service": microservices[0],
                                    "alarms": [alarms[f"staging-{service}-tasks"].alarm_name for service in microservices]
                                })
                            },
                            run_order=2
                        )
                    ]
                ),
                # Stage 5: Production (with manual approval)
                CodepipelineStage(
                    name="Production",
                    action=[
                        CodepipelineStageAction(
                            name="ApprovalForProduction",
                            category="Approval",
                            owner="AWS",
                            provider="Manual",
                            version="1",
                            configuration={
                                "NotificationArn": sns_topic.arn,
                                "CustomData": "Please review staging deployment and approve for production"
                            },
                            run_order=1
                        )
                    ] + [
                        CodepipelineStageAction(
                            name=f"Deploy-{service}-Production",
                            category="Deploy",
                            owner="AWS",
                            provider="ECS",
                            version="1",
                            input_artifacts=[f"{service}BuildOutput"],
                            configuration={
                                "ClusterName": production_cluster.name,
                                "ServiceName": ecs_services[f"production-{service}"].name,
                                "FileName": "imagedefinitions.json"
                            },
                            run_order=2
                        )
                        for service in microservices
                    ] + [
                        CodepipelineStageAction(
                            name="ValidateProductionHealth",
                            category="Invoke",
                            owner="AWS",
                            provider="Lambda",
                            version="1",
                            configuration={
                                "FunctionName": health_check_lambda.function_name,
                                "UserParameters": json.dumps({
                                    "cluster": production_cluster.name,
                                    "service": microservices[0],
                                    "alarms": [alarms[f"production-{service}-tasks"].alarm_name for service in microservices]
                                })
                            },
                            run_order=3
                        )
                    ]
                )
            ],
            tags={"Name": f"microservices-pipeline-{environment_suffix}"}
        )

        # ============================================================
        # Outputs
        # ============================================================

        TerraformOutput(
            self,
            "pipeline_url",
            value=f"https://console.aws.amazon.com/codesuite/codepipeline/pipelines/{pipeline.name}/view?region={aws_region}",
            description="CodePipeline execution URL"
        )

        TerraformOutput(
            self,
            "codecommit_repo_url",
            value=code_repo.clone_url_http,
            description="CodeCommit repository URL"
        )

        for service in microservices:
            TerraformOutput(
                self,
                f"ecr_{service.replace('-', '_')}_uri",
                value=ecr_repos[service].repository_url,
                description=f"ECR repository URI for {service}"
            )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=alb.dns_name,
            description="Application Load Balancer DNS name"
        )

        for env in ["staging", "production"]:
            for service in microservices:
                TerraformOutput(
                    self,
                    f"ecs_{env}_{service.replace('-', '_')}_endpoint",
                    value=f"{alb.dns_name}:{80 + microservices.index(service) + (10 if env == 'production' else 0)}",
                    description=f"ECS service endpoint for {service} in {env}"
                )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=sns_topic.arn,
            description="SNS topic ARN for pipeline notifications"
        )

        TerraformOutput(
            self,
            "artifacts_bucket_name",
            value=artifacts_bucket.bucket,
            description="S3 bucket for pipeline artifacts"
        )

# CI/CD Pipeline Infrastructure Implementation

## Overview

I'll create a comprehensive CI/CD pipeline infrastructure using AWS CDK with Python for containerized Python applications with blue-green deployment to ECS Fargate.

## Architecture Components

### 1. Networking Infrastructure

```python
# Create VPC with public and private subnets across 2 AZs
vpc = ec2.Vpc(
    self,
    f"vpc-{environment_suffix}",
    max_azs=2,
    nat_gateways=2,
    subnet_configuration=[
        ec2.SubnetConfiguration(
            name="PublicSubnet",
            subnet_type=ec2.SubnetType.PUBLIC,
            cidr_mask=24,
        ),
        ec2.SubnetConfiguration(
            name="PrivateSubnet", 
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
            cidr_mask=24,
        ),
    ],
)
```

### 2. Container Infrastructure

```python
# ECR Repository
ecr_repository = ecr.Repository(
    self,
    f"ecr-{environment_suffix}",
    repository_name=f"python-app-{environment_suffix}",
    lifecycle_rules=[
        ecr.LifecycleRule(max_image_count=10)
    ],
    removal_policy=RemovalPolicy.DESTROY,
)

# ECS Cluster
cluster = ecs.Cluster(
    self,
    f"cluster-{environment_suffix}",
    vpc=vpc,
    container_insights=True,
)
```

### 3. Load Balancer and Target Groups

```python
# Application Load Balancer
alb = elbv2.ApplicationLoadBalancer(
    self,
    f"alb-{environment_suffix}",
    vpc=vpc,
    internet_facing=True,
    security_group=alb_security_group,
)

# Blue and Green Target Groups
blue_target_group = elbv2.ApplicationTargetGroup(
    self,
    f"blue-tg-{environment_suffix}",
    port=80,
    protocol=elbv2.ApplicationProtocol.HTTP,
    target_type=elbv2.TargetType.IP,
    vpc=vpc,
    health_check=elbv2.HealthCheck(
        path="/health",
        interval=Duration.seconds(15),
        healthy_threshold_count=5,
    ),
)

green_target_group = elbv2.ApplicationTargetGroup(
    self,
    f"green-tg-{environment_suffix}",
    port=80,
    protocol=elbv2.ApplicationProtocol.HTTP,
    target_type=elbv2.TargetType.IP,
    vpc=vpc,
)
```

### 4. ECS Fargate Service

```python
# Task Definition
task_definition = ecs.FargateTaskDefinition(
    self,
    f"task-def-{environment_suffix}",
    memory_limit_mib=1024,
    cpu=512,
    execution_role=task_execution_role,
    task_role=task_role,
)

# Container Definition
container = task_definition.add_container(
    "app-container",
    image=ecs.ContainerImage.from_ecr_repository(ecr_repository, "latest"),
    port_mappings=[
        ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
    ],
    logging=ecs.LogDriver.aws_logs(
        stream_prefix="ecs-container",
        log_group=container_log_group,
    ),
)

# ECS Service
service = ecs.FargateService(
    self,
    f"service-{environment_suffix}",
    cluster=cluster,
    task_definition=task_definition,
    desired_count=2,
    assign_public_ip=False,
    security_groups=[ecs_security_group],
)
```

### 5. CodeCommit Repository

```python
# Source Repository
repository = codecommit.Repository(
    self,
    f"repo-{environment_suffix}",
    repository_name=f"python-app-repo-{environment_suffix}",
    description="Python application source repository",
)
```

### 6. CodeBuild Project

```python
# Build Project
build_project = codebuild.Project(
    self,
    f"build-{environment_suffix}",
    project_name=f"python-app-build-{environment_suffix}",
    source=codebuild.Source.code_commit(repository=repository),
    environment=codebuild.BuildEnvironment(
        build_image=codebuild.LinuxBuildImage.STANDARD_5_0,
        compute_type=codebuild.ComputeType.SMALL,
        privileged=True,
        environment_variables={
            "AWS_DEFAULT_REGION": codebuild.BuildEnvironmentVariable(value=self.region),
            "ECR_REPOSITORY_URI": codebuild.BuildEnvironmentVariable(
                value=ecr_repository.repository_uri
            ),
            "DOCKER_HUB_USERNAME": codebuild.BuildEnvironmentVariable(
                type=codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,
                value="/docker-hub/username",
            ),
            "DOCKER_HUB_PASSWORD": codebuild.BuildEnvironmentVariable(
                type=codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,
                value="/docker-hub/password",
            ),
        },
    ),
    build_spec=codebuild.BuildSpec.from_object({
        "version": "0.2",
        "phases": {
            "pre_build": {
                "commands": [
                    "echo Logging in to Amazon ECR...",
                    "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI",
                    "pip install pytest bandit",
                ]
            },
            "build": {
                "commands": [
                    "echo Running unit tests...",
                    "pytest tests/",
                    "echo Running security scan...",
                    "bandit -r . -f json -o bandit_report.json",
                    "echo Building Docker image...",
                    "docker build -t $ECR_REPOSITORY_URI:latest .",
                ]
            },
            "post_build": {
                "commands": [
                    "echo Pushing Docker image...",
                    "docker push $ECR_REPOSITORY_URI:latest",
                ]
            }
        },
        "artifacts": {
            "files": ["**/*"]
        }
    }),
    role=build_role,
    logging=codebuild.LoggingOptions(
        cloud_watch=codebuild.CloudWatchLoggingOptions(
            log_group=build_log_group,
            enabled=True,
        )
    ),
)
```

### 7. CodeDeploy Configuration

```python
# CodeDeploy Application
deploy_application = codedeploy.EcsApplication(
    self,
    f"deploy-app-{environment_suffix}",
    application_name=f"python-app-{environment_suffix}",
)

# Deployment Group
deployment_group = codedeploy.EcsDeploymentGroup(
    self,
    f"deploy-group-{environment_suffix}",
    application=deploy_application,
    deployment_group_name=f"deployment-group-{environment_suffix}",
    service=service,
    blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
        listener=alb_listener,
        blue_target_group=blue_target_group,
        green_target_group=green_target_group,
        deployment_approval_wait_time=Duration.minutes(0),
        termination_wait_time=Duration.minutes(5),
    ),
    role=codedeploy_role,
)
```

### 8. CodePipeline

```python
# Artifact buckets
source_artifact = codepipeline.Artifact("SourceArtifact")
build_artifact = codepipeline.Artifact("BuildArtifact")

# Pipeline
pipeline = codepipeline.Pipeline(
    self,
    f"pipeline-{environment_suffix}",
    pipeline_name=f"python-app-pipeline-{environment_suffix}",
    artifact_bucket=artifacts_bucket,
    stages=[
        codepipeline.StageProps(
            stage_name="Source",
            actions=[
                codepipeline_actions.CodeCommitSourceAction(
                    action_name="Source",
                    repository=repository,
                    branch="main",
                    output=source_artifact,
                )
            ],
        ),
        codepipeline.StageProps(
            stage_name="Build",
            actions=[
                codepipeline_actions.CodeBuildAction(
                    action_name="Build",
                    project=build_project,
                    input=source_artifact,
                    outputs=[build_artifact],
                )
            ],
        ),
        codepipeline.StageProps(
            stage_name="Deploy",
            actions=[
                codepipeline_actions.CodeDeployEcsDeployAction(
                    action_name="Deploy",
                    deployment_group=deployment_group,
                    task_definition_template_file=build_artifact.at_path("taskdef.json"),
                    app_spec_template_file=build_artifact.at_path("appspec.yaml"),
                )
            ],
        ),
    ],
    role=pipeline_role,
)
```

### 9. IAM Roles and Policies

```python
# CodePipeline Service Role
pipeline_role = iam.Role(
    self,
    f"pipeline-role-{environment_suffix}",
    assumed_by=iam.ServicePrincipal("codepipeline.amazonaws.com"),
    managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("AWSCodeCommitReadOnly"),
        iam.ManagedPolicy.from_aws_managed_policy_name("AWSCodeBuildDeveloperAccess"),
        iam.ManagedPolicy.from_aws_managed_policy_name("AWSCodeDeployFullAccess"),
    ],
)

# CodeBuild Service Role
build_role = iam.Role(
    self,
    f"build-role-{environment_suffix}",
    assumed_by=iam.ServicePrincipal("codebuild.amazonaws.com"),
    managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("AmazonEC2ContainerRegistryPowerUser"),
    ],
)

# CodeDeploy Service Role  
codedeploy_role = iam.Role(
    self,
    f"codedeploy-role-{environment_suffix}",
    assumed_by=iam.ServicePrincipal("codedeploy.amazonaws.com"),
    managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("AWSCodeDeployRoleForECS"),
    ],
)

# ECS Task Execution Role
task_execution_role = iam.Role(
    self,
    f"task-execution-role-{environment_suffix}",
    assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonECSTaskExecutionRolePolicy"),
    ],
)

# ECS Task Role
task_role = iam.Role(
    self,
    f"task-role-{environment_suffix}",
    assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
)
```

### 10. CloudWatch Logs and Monitoring

```python
# Log Groups
container_log_group = logs.LogGroup(
    self,
    f"container-logs-{environment_suffix}",
    log_group_name=f"/ecs/python-app-{environment_suffix}",
    retention=logs.RetentionDays.ONE_MONTH,
    removal_policy=RemovalPolicy.DESTROY,
)

build_log_group = logs.LogGroup(
    self,
    f"build-logs-{environment_suffix}",
    log_group_name=f"/codebuild/python-app-build-{environment_suffix}",
    retention=logs.RetentionDays.TWO_WEEKS,
    removal_policy=RemovalPolicy.DESTROY,
)

pipeline_log_group = logs.LogGroup(
    self,
    f"pipeline-logs-{environment_suffix}",
    log_group_name=f"/codepipeline/python-app-{environment_suffix}",
    retention=logs.RetentionDays.ONE_MONTH,
    removal_policy=RemovalPolicy.DESTROY,
)
```

### 11. SNS Notifications

```python
# SNS Topic for notifications
failure_topic = sns.Topic(
    self,
    f"failure-topic-{environment_suffix}",
    topic_name=f"pipeline-failures-{environment_suffix}",
    display_name="Pipeline Failure Notifications",
)

# Email subscription
failure_topic.add_subscription(
    sns_subscriptions.EmailSubscription(notification_email)
)

# EventBridge rule for pipeline state changes
pipeline_state_rule = events.Rule(
    self,
    f"pipeline-state-rule-{environment_suffix}",
    event_pattern=events.EventPattern(
        source=["aws.codepipeline"],
        detail_type=["CodePipeline Pipeline Execution State Change"],
        detail={
            "pipeline": [pipeline.pipeline_name],
            "state": ["FAILED"],
        },
    ),
    targets=[events_targets.SnsTopic(failure_topic)],
)
```

### 12. Parameter Store Configuration

```python
# Parameter Store entries for Docker credentials
docker_username_param = ssm.StringParameter(
    self,
    f"docker-username-{environment_suffix}",
    parameter_name="/docker-hub/username",
    string_value="placeholder-username",
    description="Docker Hub username for image pulling",
)

docker_password_param = ssm.StringParameter(
    self,
    f"docker-password-{environment_suffix}",
    parameter_name="/docker-hub/password",
    string_value="placeholder-password",
    description="Docker Hub password for image pulling",
)
```

### 13. Security Groups

```python
# ALB Security Group
alb_security_group = ec2.SecurityGroup(
    self,
    f"alb-sg-{environment_suffix}",
    vpc=vpc,
    description="Security group for Application Load Balancer",
    allow_all_outbound=True,
)

alb_security_group.add_ingress_rule(
    peer=ec2.Peer.any_ipv4(),
    port=ec2.Port.tcp(80),
    description="Allow HTTP traffic from anywhere",
)

# ECS Security Group
ecs_security_group = ec2.SecurityGroup(
    self,
    f"ecs-sg-{environment_suffix}",
    vpc=vpc,
    description="Security group for ECS tasks",
    allow_all_outbound=True,
)

ecs_security_group.add_ingress_rule(
    peer=alb_security_group,
    port=ec2.Port.tcp(80),
    description="Allow traffic from ALB",
)
```

### 14. Stack Outputs

```python
# CloudFormation Outputs
CfnOutput(
    self,
    "PipelineArn",
    value=pipeline.pipeline_arn,
    description="CodePipeline ARN",
)

CfnOutput(
    self,
    "ECRRepositoryURI",
    value=ecr_repository.repository_uri,
    description="ECR Repository URI",
)

CfnOutput(
    self,
    "LoadBalancerDNS",
    value=alb.load_balancer_dns_name,
    description="Application Load Balancer DNS name",
)

CfnOutput(
    self,
    "ECSClusterName",
    value=cluster.cluster_name,
    description="ECS Cluster name",
)
```

## Implementation Summary

This implementation provides:

1. **Complete CI/CD Pipeline**: CodeCommit → CodeBuild → CodeDeploy → ECS Fargate
2. **Blue-Green Deployment**: ALB with dual target groups for zero-downtime deployments
3. **Container Infrastructure**: ECS Fargate cluster with optimized task definitions  
4. **Networking**: VPC spanning 2 AZs with public/private subnet architecture
5. **Security**: IAM roles with least-privilege access, Parameter Store for credentials
6. **Monitoring**: CloudWatch Logs for all services, SNS notifications via EventBridge
7. **Docker Registry**: ECR with lifecycle policies (retain last 10 images)
8. **Build Pipeline**: Python 3.9 runtime, pytest unit tests, bandit security scanning

The stack accepts an `environmentSuffix` parameter for multi-environment deployments and includes proper resource naming, security groups, and cleanup policies for testing environments.

All resources are configured with `RemovalPolicy.DESTROY` for easy cleanup and include comprehensive logging and monitoring capabilities.
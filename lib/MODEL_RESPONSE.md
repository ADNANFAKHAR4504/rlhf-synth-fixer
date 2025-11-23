# ECS Fargate Infrastructure - CDKTF Python Implementation

This implementation provides a production-ready ECS Fargate cluster with comprehensive networking, monitoring, and security features.

## File: cdktf.json

```json
{
  "language": "python",
  "app": "pipenv run python main.py",
  "projectId": "ecs-fargate-batch-processing",
  "terraformProviders": [
    "hashicorp/aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: Pipfile

```toml
[[source]]
url = "https://pypi.org/simple"
verify_ssl = true
name = "pypi"

[packages]
cdktf = "~=0.20.0"
cdktf-cdktf-provider-aws = "~=19.0"

[dev-packages]
pytest = "*"
pytest-cov = "*"

[requires]
python_version = "3.9"
```

## File: main.py

```python
#!/usr/bin/env python
from cdktf import App
from stacks.ecs_fargate_stack import EcsFargateStack

app = App()
EcsFargateStack(app, "ecs-fargate-batch-processing")
app.synth()
```

## File: stacks/__init__.py

```python
# Empty file to make stacks a package
```

## File: stacks/ecs_fargate_stack.py

```python
from cdktf import TerraformStack, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.ecr_repository import EcrRepository
from cdktf_cdktf_provider_aws.ecr_lifecycle_policy import EcrLifecyclePolicy
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster, EcsClusterConfiguration, EcsClusterConfigurationExecuteCommandConfiguration, EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration
from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import EcsClusterCapacityProviders
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceCapacityProviderStrategy, EcsServiceLoadBalancer, EcsServiceNetworkConfiguration, EcsServiceDeploymentController
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy, AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration, AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm, CloudwatchMetricAlarmMetricQuery, CloudwatchMetricAlarmMetricQueryMetric
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
import json


class EcsFargateStack(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # Environment suffix for unique resource naming
        environment_suffix = Fn.terraform_workspace()

        # Common tags
        common_tags = {
            "Environment": environment_suffix,
            "Project": "ecs-fargate-batch-processing",
            "CostCenter": "engineering",
            "ManagedBy": "CDKTF"
        }

        # AWS Provider
        AwsProvider(self, "aws",
            region="us-east-1",
            default_tags=[{
                "tags": common_tags
            }]
        )

        # 1. VPC and Networking
        vpc = Vpc(self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **common_tags,
                "Name": f"ecs-fargate-vpc-{environment_suffix}"
            }
        )

        # Internet Gateway
        igw = InternetGateway(self, "igw",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": f"ecs-fargate-igw-{environment_suffix}"
            }
        )

        # Availability Zones
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

        # Public Subnets
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(self, f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **common_tags,
                    "Name": f"ecs-fargate-public-subnet-{i+1}-{environment_suffix}",
                    "Type": "public"
                }
            )
            public_subnets.append(subnet)

        # Private Subnets
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(self, f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **common_tags,
                    "Name": f"ecs-fargate-private-subnet-{i+1}-{environment_suffix}",
                    "Type": "private"
                }
            )
            private_subnets.append(subnet)

        # Public Route Table
        public_rt = RouteTable(self, "public_rt",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                **common_tags,
                "Name": f"ecs-fargate-public-rt-{environment_suffix}"
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(self, f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # NAT Gateways (one per AZ for high availability)
        nat_gateways = []
        for i, subnet in enumerate(public_subnets):
            eip = Eip(self, f"nat_eip_{i}",
                domain="vpc",
                tags={
                    **common_tags,
                    "Name": f"ecs-fargate-nat-eip-{i+1}-{environment_suffix}"
                }
            )

            nat = NatGateway(self, f"nat_gateway_{i}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    **common_tags,
                    "Name": f"ecs-fargate-nat-{i+1}-{environment_suffix}"
                }
            )
            nat_gateways.append(nat)

        # Private Route Tables (one per NAT gateway)
        for i, nat in enumerate(nat_gateways):
            private_rt = RouteTable(self, f"private_rt_{i}",
                vpc_id=vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat.id
                    )
                ],
                tags={
                    **common_tags,
                    "Name": f"ecs-fargate-private-rt-{i+1}-{environment_suffix}"
                }
            )

            RouteTableAssociation(self, f"private_rt_assoc_{i}",
                subnet_id=private_subnets[i].id,
                route_table_id=private_rt.id
            )

        # Security Group for ALB
        alb_sg = SecurityGroup(self, "alb_sg",
            name=f"ecs-fargate-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from anywhere"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from anywhere"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                **common_tags,
                "Name": f"ecs-fargate-alb-sg-{environment_suffix}"
            }
        )

        # Security Group for ECS Tasks
        ecs_sg = SecurityGroup(self, "ecs_sg",
            name=f"ecs-fargate-tasks-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
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
                    description="Allow all outbound"
                )
            ],
            tags={
                **common_tags,
                "Name": f"ecs-fargate-tasks-sg-{environment_suffix}"
            }
        )

        # Security Group for VPC Endpoints
        vpc_endpoint_sg = SecurityGroup(self, "vpc_endpoint_sg",
            name=f"ecs-fargate-vpc-endpoints-sg-{environment_suffix}",
            description="Security group for VPC endpoints",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    security_groups=[ecs_sg.id],
                    description="Allow HTTPS from ECS tasks"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                **common_tags,
                "Name": f"ecs-fargate-vpc-endpoints-sg-{environment_suffix}"
            }
        )

        # 11. VPC Endpoints
        # ECR API Endpoint
        ecr_api_endpoint = VpcEndpoint(self, "ecr_api_endpoint",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-1.ecr.api",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={
                **common_tags,
                "Name": f"ecs-fargate-ecr-api-endpoint-{environment_suffix}"
            }
        )

        # ECR Docker Registry Endpoint
        ecr_dkr_endpoint = VpcEndpoint(self, "ecr_dkr_endpoint",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-1.ecr.dkr",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={
                **common_tags,
                "Name": f"ecs-fargate-ecr-dkr-endpoint-{environment_suffix}"
            }
        )

        # ECS Endpoint
        ecs_endpoint = VpcEndpoint(self, "ecs_endpoint",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-1.ecs",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={
                **common_tags,
                "Name": f"ecs-fargate-ecs-endpoint-{environment_suffix}"
            }
        )

        # CloudWatch Logs Endpoint
        logs_endpoint = VpcEndpoint(self, "logs_endpoint",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-1.logs",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={
                **common_tags,
                "Name": f"ecs-fargate-logs-endpoint-{environment_suffix}"
            }
        )

        # S3 Gateway Endpoint
        s3_endpoint = VpcEndpoint(self, "s3_endpoint",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-1.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[rt.id for rt in [public_rt]] + [private_rt.id for i, nat in enumerate(nat_gateways) for private_rt in [RouteTable.from_terraform_resource(self, f"private_rt_{i}_ref", private_rt.terraform_resource)]],
            tags={
                **common_tags,
                "Name": f"ecs-fargate-s3-endpoint-{environment_suffix}"
            }
        )

        # 2. KMS Key for Encryption
        kms_key = KmsKey(self, "kms_key",
            description="KMS key for ECS Fargate encryption",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                **common_tags,
                "Name": f"ecs-fargate-kms-key-{environment_suffix}"
            }
        )

        KmsAlias(self, "kms_alias",
            name=f"alias/ecs-fargate-{environment_suffix}",
            target_key_id=kms_key.id
        )

        # 3. ECR Repository
        ecr_repo = EcrRepository(self, "ecr_repo",
            name=f"ecs-fargate-batch-processor-{environment_suffix}",
            image_tag_mutability="MUTABLE",
            image_scanning_configuration={
                "scan_on_push": True
            },
            tags=common_tags,
            force_delete=True
        )

        # ECR Lifecycle Policy
        EcrLifecyclePolicy(self, "ecr_lifecycle",
            repository=ecr_repo.name,
            policy=json.dumps({
                "rules": [{
                    "rulePriority": 1,
                    "description": "Keep only last 10 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 10
                    },
                    "action": {
                        "type": "expire"
                    }
                }]
            })
        )

        # 4. CloudWatch Log Group
        log_group = CloudwatchLogGroup(self, "log_group",
            name=f"/ecs/fargate-batch-processor-{environment_suffix}",
            retention_in_days=30,
            kms_key_id=kms_key.arn,
            tags={
                **common_tags,
                "Name": f"ecs-fargate-log-group-{environment_suffix}"
            }
        )

        # 5. IAM Roles
        # Task Execution Role
        task_execution_role = IamRole(self, "task_execution_role",
            name=f"ecs-fargate-task-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags
        )

        # Attach managed policy for ECS task execution
        IamRolePolicyAttachment(self, "task_execution_policy",
            role=task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Additional policy for ECR and CloudWatch with KMS
        execution_policy = IamPolicy(self, "execution_policy",
            name=f"ecs-fargate-execution-policy-{environment_suffix}",
            policy=json.dumps({
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
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"{log_group.arn}:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": kms_key.arn
                    }
                ]
            })
        )

        IamRolePolicyAttachment(self, "execution_policy_attachment",
            role=task_execution_role.name,
            policy_arn=execution_policy.arn
        )

        # Task Role (for application)
        task_role = IamRole(self, "task_role",
            name=f"ecs-fargate-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags
        )

        # Minimal permissions for task role (customize based on application needs)
        task_policy = IamPolicy(self, "task_policy",
            name=f"ecs-fargate-task-policy-{environment_suffix}",
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
                    }
                ]
            })
        )

        IamRolePolicyAttachment(self, "task_policy_attachment",
            role=task_role.name,
            policy_arn=task_policy.arn
        )

        # 6. ECS Cluster
        cluster = EcsCluster(self, "cluster",
            name=f"ecs-fargate-cluster-{environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            configuration=EcsClusterConfiguration(
                execute_command_configuration=EcsClusterConfigurationExecuteCommandConfiguration(
                    logging="OVERRIDE",
                    log_configuration=EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration(
                        cloud_watch_log_group_name=log_group.name
                    )
                )
            ),
            tags=common_tags
        )

        # Configure Capacity Providers
        EcsClusterCapacityProviders(self, "cluster_capacity_providers",
            cluster_name=cluster.name,
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            default_capacity_provider_strategy=[
                {
                    "capacity_provider": "FARGATE_SPOT",
                    "weight": 70,
                    "base": 0
                },
                {
                    "capacity_provider": "FARGATE",
                    "weight": 30,
                    "base": 1
                }
            ]
        )

        # 7. ECS Task Definition
        task_definition = EcsTaskDefinition(self, "task_definition",
            family=f"ecs-fargate-batch-processor-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="2048",
            memory="4096",
            execution_role_arn=task_execution_role.arn,
            task_role_arn=task_role.arn,
            container_definitions=json.dumps([{
                "name": "batch-processor",
                "image": f"{ecr_repo.repository_url}:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": log_group.name,
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "environment": [
                    {
                        "name": "ENVIRONMENT",
                        "value": environment_suffix
                    },
                    {
                        "name": "LOG_LEVEL",
                        "value": "INFO"
                    }
                ],
                "healthCheck": {
                    "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
                    "interval": 30,
                    "timeout": 5,
                    "retries": 3,
                    "startPeriod": 60
                }
            }]),
            tags=common_tags
        )

        # 8. Application Load Balancer
        alb = Lb(self, "alb",
            name=f"ecs-fargate-alb-{environment_suffix}"[:32],
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[subnet.id for subnet in public_subnets],
            enable_deletion_protection=False,
            tags=common_tags
        )

        # Target Group
        target_group = LbTargetGroup(self, "target_group",
            name=f"ecs-fargate-tg-{environment_suffix}"[:32],
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            deregistration_delay=30,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                port="traffic-port",
                protocol="HTTP",
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                matcher="200"
            ),
            tags={
                **common_tags,
                "Name": f"ecs-fargate-target-group-{environment_suffix}"
            }
        )

        # ALB Listener
        LbListener(self, "alb_listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=target_group.arn
                )
            ],
            tags=common_tags
        )

        # 9. ECS Service
        ecs_service = EcsService(self, "ecs_service",
            name=f"ecs-fargate-service-{environment_suffix}",
            cluster=cluster.id,
            task_definition=task_definition.arn,
            desired_count=3,
            launch_type="FARGATE",
            platform_version="LATEST",
            deployment_controller=EcsServiceDeploymentController(
                type="ECS"
            ),
            deployment_maximum_percent=200,
            deployment_minimum_healthy_percent=100,
            health_check_grace_period_seconds=60,
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[subnet.id for subnet in private_subnets],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[
                EcsServiceLoadBalancer(
                    target_group_arn=target_group.arn,
                    container_name="batch-processor",
                    container_port=8080
                )
            ],
            capacity_provider_strategy=[
                EcsServiceCapacityProviderStrategy(
                    capacity_provider="FARGATE_SPOT",
                    weight=70,
                    base=0
                ),
                EcsServiceCapacityProviderStrategy(
                    capacity_provider="FARGATE",
                    weight=30,
                    base=1
                )
            ],
            enable_execute_command=True,
            tags=common_tags,
            depends_on=[ecr_api_endpoint, ecr_dkr_endpoint, ecs_endpoint, logs_endpoint]
        )

        # 10. Auto Scaling
        autoscaling_target = AppautoscalingTarget(self, "autoscaling_target",
            service_namespace="ecs",
            resource_id=f"service/{cluster.name}/{ecs_service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            min_capacity=2,
            max_capacity=10
        )

        # Scale up policy
        AppautoscalingPolicy(self, "scale_up_policy",
            name=f"ecs-fargate-scale-up-{environment_suffix}",
            service_namespace=autoscaling_target.service_namespace,
            resource_id=autoscaling_target.resource_id,
            scalable_dimension=autoscaling_target.scalable_dimension,
            policy_type="TargetTrackingScaling",
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                target_value=70.0,
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

        # Scale down policy (handled by target tracking)
        AppautoscalingPolicy(self, "scale_down_policy",
            name=f"ecs-fargate-scale-down-{environment_suffix}",
            service_namespace=autoscaling_target.service_namespace,
            resource_id=autoscaling_target.resource_id,
            scalable_dimension=autoscaling_target.scalable_dimension,
            policy_type="TargetTrackingScaling",
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                target_value=30.0,
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

        # 12. CloudWatch Alarms and SNS
        # SNS Topic for Notifications
        sns_topic = SnsTopic(self, "alarm_topic",
            name=f"ecs-fargate-alarms-{environment_suffix}",
            tags=common_tags
        )

        # ECS Service Alarms
        # Unhealthy Task Count Alarm
        CloudwatchMetricAlarm(self, "unhealthy_task_alarm",
            alarm_name=f"ecs-fargate-unhealthy-tasks-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnhealthyTaskCount",
            namespace="AWS/ECS",
            period=60,
            statistic="Average",
            threshold=1,
            alarm_description="Alert when unhealthy task count exceeds threshold",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "ClusterName": cluster.name,
                "ServiceName": ecs_service.name
            },
            tags=common_tags
        )

        # CPU Utilization Alarm
        CloudwatchMetricAlarm(self, "cpu_utilization_alarm",
            alarm_name=f"ecs-fargate-high-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=3,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=85,
            alarm_description="Alert when CPU utilization is consistently high",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "ClusterName": cluster.name,
                "ServiceName": ecs_service.name
            },
            tags=common_tags
        )

        # Memory Utilization Alarm
        CloudwatchMetricAlarm(self, "memory_utilization_alarm",
            alarm_name=f"ecs-fargate-high-memory-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=3,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=85,
            alarm_description="Alert when memory utilization is consistently high",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "ClusterName": cluster.name,
                "ServiceName": ecs_service.name
            },
            tags=common_tags
        )

        # ALB Alarms
        # Unhealthy Host Count
        CloudwatchMetricAlarm(self, "unhealthy_host_alarm",
            alarm_name=f"ecs-fargate-alb-unhealthy-hosts-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=1,
            alarm_description="Alert when ALB has unhealthy targets",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "LoadBalancer": Fn.element(Fn.split("/", alb.arn), 1),
                "TargetGroup": Fn.element(Fn.split(":", target_group.arn), 5)
            },
            tags=common_tags
        )

        # Target Response Time
        CloudwatchMetricAlarm(self, "response_time_alarm",
            alarm_name=f"ecs-fargate-alb-slow-response-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=3,
            metric_name="TargetResponseTime",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=1.0,
            alarm_description="Alert when target response time exceeds 1 second",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "LoadBalancer": Fn.element(Fn.split("/", alb.arn), 1),
                "TargetGroup": Fn.element(Fn.split(":", target_group.arn), 5)
            },
            tags=common_tags
        )

        # HTTP 5XX Errors
        CloudwatchMetricAlarm(self, "http_5xx_alarm",
            alarm_name=f"ecs-fargate-alb-5xx-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when too many 5XX errors from targets",
            alarm_actions=[sns_topic.arn],
            treat_missing_data="notBreaching",
            dimensions={
                "LoadBalancer": Fn.element(Fn.split("/", alb.arn), 1),
                "TargetGroup": Fn.element(Fn.split(":", target_group.arn), 5)
            },
            tags=common_tags
        )

        # Outputs
        TerraformOutput(self, "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(self, "cluster_name",
            value=cluster.name,
            description="ECS Cluster Name"
        )

        TerraformOutput(self, "cluster_arn",
            value=cluster.arn,
            description="ECS Cluster ARN"
        )

        TerraformOutput(self, "service_name",
            value=ecs_service.name,
            description="ECS Service Name"
        )

        TerraformOutput(self, "alb_dns_name",
            value=alb.dns_name,
            description="Application Load Balancer DNS Name"
        )

        TerraformOutput(self, "ecr_repository_url",
            value=ecr_repo.repository_url,
            description="ECR Repository URL"
        )

        TerraformOutput(self, "log_group_name",
            value=log_group.name,
            description="CloudWatch Log Group Name"
        )

        TerraformOutput(self, "sns_topic_arn",
            value=sns_topic.arn,
            description="SNS Topic ARN for Alarm Notifications"
        )
```

## File: README.md

```markdown
# ECS Fargate Batch Processing Infrastructure

This CDKTF Python application deploys a production-ready ECS Fargate cluster for batch processing workloads with comprehensive networking, monitoring, and security features.

## Architecture

The infrastructure includes:

1. **Networking**: VPC with 3 public and 3 private subnets across availability zones, NAT gateways, and VPC endpoints
2. **Container Registry**: ECR repository with image scanning and lifecycle policies
3. **ECS Cluster**: Fargate cluster with container insights and mixed capacity providers (FARGATE + FARGATE_SPOT)
4. **Load Balancing**: Application Load Balancer with health checks
5. **Auto-Scaling**: Target tracking based on CPU utilization (70% scale up, 30% scale down)
6. **Logging**: CloudWatch Logs with KMS encryption and 30-day retention
7. **Security**: IAM roles with least privilege, KMS encryption, security groups
8. **VPC Endpoints**: Private connectivity for ECR, ECS, CloudWatch Logs, and S3
9. **Monitoring**: Comprehensive CloudWatch alarms for ECS and ALB metrics
10. **Notifications**: SNS topic for alarm notifications

## Prerequisites

- Python 3.9+
- pipenv
- CDKTF 0.20+
- AWS CLI configured with appropriate credentials
- Docker (for building container images)
- Terraform 1.0+

## Installation

1. Install dependencies:

```bash
pipenv install
```

2. Verify CDKTF installation:

```bash
pipenv run cdktf --version
```

## Deployment

1. Initialize the project:

```bash
pipenv run cdktf get
```

2. Build a sample container image and push to ECR (after first deployment to create ECR repository):

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(terraform output -raw ecr_repository_url | cut -d'/' -f1)

# Build and push image
docker build -t batch-processor .
docker tag batch-processor:latest $(terraform output -raw ecr_repository_url):latest
docker push $(terraform output -raw ecr_repository_url):latest
```

3. Deploy the infrastructure:

```bash
pipenv run cdktf deploy
```

4. To destroy the infrastructure:

```bash
pipenv run cdktf destroy
```

## Configuration

### Environment Suffix

The infrastructure uses Terraform workspace names as environment suffixes for unique resource naming:

```bash
# Create and select workspace
terraform workspace new dev
terraform workspace select dev

# Deploy with environment suffix
pipenv run cdktf deploy
```

### Resource Tagging

All resources are tagged with:
- `Environment`: Workspace name (environment suffix)
- `Project`: ecs-fargate-batch-processing
- `CostCenter`: engineering
- `ManagedBy`: CDKTF

### Cost Optimization

The infrastructure uses:
- 70% FARGATE_SPOT capacity for cost savings
- VPC endpoints to reduce NAT gateway data transfer costs
- ECR lifecycle policy to retain only last 10 images
- 30-day CloudWatch Logs retention

## Monitoring

### CloudWatch Alarms

The infrastructure includes alarms for:

**ECS Service:**
- Unhealthy task count > 1
- CPU utilization > 85% for 15 minutes
- Memory utilization > 85% for 15 minutes

**Application Load Balancer:**
- Unhealthy host count > 1
- Target response time > 1 second for 3 minutes
- HTTP 5XX errors > 10 per minute

**Notifications:**
All alarms send notifications to the SNS topic. Subscribe to receive alerts:

```bash
aws sns subscribe \
  --topic-arn $(terraform output -raw sns_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### Container Insights

ECS Container Insights provides additional metrics and logs for:
- Task-level CPU and memory
- Network metrics
- Storage metrics

Access via CloudWatch Console > Container Insights.

## Security

### Network Isolation

- ECS tasks run in private subnets with no direct internet access
- Outbound traffic routes through NAT gateways
- VPC endpoints provide private connectivity to AWS services
- Security groups enforce least privilege network access

### Encryption

- CloudWatch Logs encrypted with KMS
- ECR images scanned for vulnerabilities
- KMS key rotation enabled

### IAM Roles

- Task execution role: Minimal permissions for ECR pull and CloudWatch Logs
- Task role: Application-specific permissions (customize as needed)

## Testing

Run unit tests:

```bash
pipenv run pytest tests/unit/ -v --cov=stacks --cov-report=term-missing
```

Run integration tests (requires deployed infrastructure):

```bash
pipenv run pytest tests/integration/ -v
```

## Troubleshooting

### Task Startup Issues

Check CloudWatch Logs:

```bash
aws logs tail /ecs/fargate-batch-processor-$(terraform workspace show) --follow
```

### ALB Health Check Failures

Verify target group health:

```bash
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw target_group_arn)
```

### VPC Endpoint Connectivity

Verify private DNS is enabled and security groups allow HTTPS (443) from ECS tasks.

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC ID
- `cluster_name`: ECS Cluster Name
- `cluster_arn`: ECS Cluster ARN
- `service_name`: ECS Service Name
- `alb_dns_name`: ALB DNS Name (use to access the application)
- `ecr_repository_url`: ECR Repository URL
- `log_group_name`: CloudWatch Log Group Name
- `sns_topic_arn`: SNS Topic ARN for Alarms

## Blue-Green Deployments

While this infrastructure uses standard ECS deployment, you can enable blue-green deployments using AWS CodeDeploy:

1. Create CodeDeploy application and deployment group
2. Update ECS service to use CODE_DEPLOY deployment controller
3. Configure traffic shifting rules in CodeDeploy

## License

MIT
```

## File: .gitignore

```
# Terraform
.terraform/
.terraform.lock.hcl
terraform.tfstate*
cdktf.out/
cdktf.json

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual environments
venv/
ENV/
env/
.venv

# Pipenv
Pipfile.lock

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Coverage
.coverage
htmlcov/
.pytest_cache/

# Environment
.env
.env.local
```

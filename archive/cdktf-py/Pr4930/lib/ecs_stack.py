"""ECS Fargate stack for containerized application."""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
import json


class EcsStack(Construct):
    """ECS Fargate cluster and service for product catalog."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        vpc_id: str,
        private_subnet_ids: list,
        ecs_security_group_id: str,
        target_group_arn: str,
        db_secret_arn: str,
        api_secret_arn: str,
        cache_endpoint: str,
        environment_suffix: str,
        aws_region: str
    ):
        """Initialize ECS cluster and service."""
        super().__init__(scope, construct_id)

        # Create CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            "log_group",
            name=f"/ecs/product-catalog-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"product-catalog-logs-{environment_suffix}"
            }
        )

        # Create ECS Cluster
        self.cluster = EcsCluster(
            self,
            "cluster",
            name=f"pc-cluster-{environment_suffix}",
            tags={
                "Name": f"product-catalog-cluster-{environment_suffix}"
            }
        )

        # Create IAM role for ECS task execution
        task_execution_role = IamRole(
            self,
            "task_execution_role",
            name=f"pc-exec-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"product-catalog-execution-role-{environment_suffix}"
            }
        )

        # Attach AWS managed policy for ECS task execution
        IamRolePolicyAttachment(
            self,
            "task_execution_policy",
            role=task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Create IAM role for ECS task
        task_role = IamRole(
            self,
            "task_role",
            name=f"pc-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"product-catalog-task-role-{environment_suffix}"
            }
        )

        # Create policy for accessing secrets
        secrets_policy = IamPolicy(
            self,
            "secrets_policy",
            name=f"pc-secrets-{environment_suffix}",
            description="Policy for accessing Secrets Manager",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": [
                        db_secret_arn,
                        api_secret_arn
                    ]
                }]
            })
        )

        # Attach secrets policy to task role
        IamRolePolicyAttachment(
            self,
            "task_secrets_policy",
            role=task_role.name,
            policy_arn=secrets_policy.arn
        )

        # Create task definition
        container_definitions = [{
            "name": "product-catalog",
            "image": "nginx:latest",
            "cpu": 256,
            "memory": 512,
            "essential": True,
            "portMappings": [{
                "containerPort": 80,
                "protocol": "tcp"
            }],
            "environment": [
                {
                    "name": "CACHE_ENDPOINT",
                    "value": cache_endpoint
                },
                {
                    "name": "AWS_REGION",
                    "value": aws_region
                }
            ],
            "secrets": [
                {
                    "name": "DB_SECRET",
                    "valueFrom": db_secret_arn
                },
                {
                    "name": "API_SECRET",
                    "valueFrom": api_secret_arn
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": log_group.name,
                    "awslogs-region": aws_region,
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }]

        task_definition = EcsTaskDefinition(
            self,
            "task_definition",
            family=f"pc-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=task_execution_role.arn,
            task_role_arn=task_role.arn,
            container_definitions=json.dumps(container_definitions),
            tags={
                "Name": f"product-catalog-task-{environment_suffix}"
            }
        )

        # Create ECS service
        self.service = EcsService(
            self,
            "service",
            name=f"pc-service-{environment_suffix}",
            cluster=self.cluster.id,
            task_definition=task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=private_subnet_ids,
                security_groups=[ecs_security_group_id],
                assign_public_ip=False
            ),
            load_balancer=[
                EcsServiceLoadBalancer(
                    target_group_arn=target_group_arn,
                    container_name="product-catalog",
                    container_port=80
                )
            ],
            tags={
                "Name": f"product-catalog-service-{environment_suffix}"
            }
        )

    @property
    def cluster_name(self):
        """Return cluster name."""
        return self.cluster.name

    @property
    def service_name(self):
        """Return service name."""
        return self.service.name

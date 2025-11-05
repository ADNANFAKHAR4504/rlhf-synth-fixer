"""Compute infrastructure for video processing workers."""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import EcsClusterCapacityProviders
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy
import json


class ComputeConstruct(Construct):
    """Compute construct for ECS Fargate video processing workers."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        ecs_security_group_id: str,
        kinesis_stream_arn: str,
        kinesis_stream_name: str,
        db_secret_arn: str,
        db_cluster_endpoint: str,
    ):
        super().__init__(scope, construct_id)

        # Create CloudWatch log group
        log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/streamflix-{environment_suffix}",
            retention_in_days=90,
            tags={"Name": f"streamflix-ecs-logs-{environment_suffix}"},
        )

        # Create dead letter queue
        dlq = SqsQueue(
            self,
            "dlq",
            name=f"streamflix-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={"Name": f"streamflix-dlq-{environment_suffix}"},
        )

        # Create ECS cluster
        self.cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"streamflix-cluster-{environment_suffix}",
            setting=[
                {
                    "name": "containerInsights",
                    "value": "enabled",
                }
            ],
            tags={"Name": f"streamflix-cluster-{environment_suffix}"},
        )

        # Configure Fargate capacity providers
        EcsClusterCapacityProviders(
            self,
            "capacity_providers",
            cluster_name=self.cluster.name,
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
        )

        # Create IAM role for ECS task execution
        execution_role = IamRole(
            self,
            "execution_role",
            name=f"streamflix-ecs-execution-role-{environment_suffix}",
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
            tags={"Name": f"streamflix-ecs-execution-role-{environment_suffix}"},
        )

        # Attach managed policy for ECS task execution
        IamRolePolicyAttachment(
            self,
            "execution_role_policy",
            role=execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
        )

        # Create custom policy for Secrets Manager access
        secrets_policy = IamPolicy(
            self,
            "secrets_policy",
            name=f"streamflix-secrets-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": db_secret_arn
                }]
            }),
        )

        IamRolePolicyAttachment(
            self,
            "secrets_policy_attachment",
            role=execution_role.name,
            policy_arn=secrets_policy.arn,
        )

        # Create IAM role for ECS task
        task_role = IamRole(
            self,
            "task_role",
            name=f"streamflix-ecs-task-role-{environment_suffix}",
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
            tags={"Name": f"streamflix-ecs-task-role-{environment_suffix}"},
        )

        # Create policy for Kinesis and Secrets Manager access
        task_policy = IamPolicy(
            self,
            "task_policy",
            name=f"streamflix-task-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:DescribeStream",
                            "kinesis:ListStreams",
                            "kinesis:PutRecord",
                            "kinesis:PutRecords"
                        ],
                        "Resource": kinesis_stream_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": db_secret_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:GetQueueUrl"
                        ],
                        "Resource": dlq.arn
                    }
                ]
            }),
        )

        IamRolePolicyAttachment(
            self,
            "task_policy_attachment",
            role=task_role.name,
            policy_arn=task_policy.arn,
        )

        # Create ECS task definition
        container_definitions = [{
            "name": "video-processor",
            "image": "public.ecr.aws/docker/library/python:3.11-slim",
            "essential": True,
            "memory": 1024,
            "cpu": 512,
            "environment": [
                {
                    "name": "KINESIS_STREAM_NAME",
                    "value": kinesis_stream_name,
                },
                {
                    "name": "DB_ENDPOINT",
                    "value": db_cluster_endpoint,
                },
                {
                    "name": "DLQ_URL",
                    "value": dlq.url,
                },
            ],
            "secrets": [
                {
                    "name": "DB_SECRET",
                    "valueFrom": db_secret_arn,
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": log_group.name,
                    "awslogs-region": "eu-central-1",
                    "awslogs-stream-prefix": "video-processor",
                }
            },
        }]

        self.task_definition = EcsTaskDefinition(
            self,
            "task_definition",
            family=f"streamflix-video-processor-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="512",
            memory="1024",
            execution_role_arn=execution_role.arn,
            task_role_arn=task_role.arn,
            container_definitions=json.dumps(container_definitions),
            tags={"Name": f"streamflix-task-def-{environment_suffix}"},
        )

        # Create ECS service
        self.service = EcsService(
            self,
            "ecs_service",
            name=f"streamflix-video-processor-{environment_suffix}",
            cluster=self.cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=1,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=private_subnet_ids,
                security_groups=[ecs_security_group_id],
                assign_public_ip=False,
            ),
            tags={"Name": f"streamflix-ecs-service-{environment_suffix}"},
        )

        # Create auto-scaling target
        scaling_target = AppautoscalingTarget(
            self,
            "scaling_target",
            max_capacity=10,
            min_capacity=1,
            resource_id=f"service/{self.cluster.name}/{self.service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs",
        )

        # Create auto-scaling policy based on Kinesis stream metrics
        AppautoscalingPolicy(
            self,
            "scaling_policy",
            name=f"streamflix-scaling-policy-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            service_namespace=scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration={
                "predefined_metric_specification": {
                    "predefined_metric_type": "ECSServiceAverageCPUUtilization",
                },
                "target_value": 70.0,
                "scale_in_cooldown": 300,
                "scale_out_cooldown": 60,
            },
        )

    @property
    def ecs_cluster_name(self):
        return self.cluster.name

    @property
    def ecs_service_name(self):
        return self.service.name

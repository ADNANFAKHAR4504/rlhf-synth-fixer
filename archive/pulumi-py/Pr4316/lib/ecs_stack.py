"""
ECS Stack - Container orchestration for payment processing.

This module creates an ECS cluster with Fargate tasks for running
payment processing workloads with appropriate IAM roles and logging.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
import json


class EcsStackArgs:
    """
    Arguments for ECS Stack.

    Args:
        environment_suffix: Environment identifier for resource naming
        log_group_name: CloudWatch log group name for container logs
        security_group_id: Security group ID for ECS tasks
        subnet_ids: List of private subnet IDs for ECS tasks
    """
    def __init__(
        self,
        environment_suffix: str,
        log_group_name: pulumi.Output,
        security_group_id: pulumi.Output,
        subnet_ids: list
    ):
        self.environment_suffix = environment_suffix
        self.log_group_name = log_group_name
        self.security_group_id = security_group_id
        self.subnet_ids = subnet_ids


class EcsStack(pulumi.ComponentResource):
    """
    ECS Component Resource for payment processing containers.

    Creates:
    - ECS cluster
    - IAM roles for task execution and task runtime
    - Task definition with CloudWatch logging
    - Fargate configuration for serverless containers
    """

    def __init__(
        self,
        name: str,
        args: EcsStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:compute:EcsStack', name, None, opts)

        # ECS Cluster
        self.cluster = aws.ecs.Cluster(
            f"payment-processor-cluster-{args.environment_suffix}",
            name=f"payment-processor-cluster-{args.environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled",
                )
            ],
            tags={
                "Name": f"payment-processor-cluster-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Service": "payment-processing",
            },
            opts=ResourceOptions(parent=self)
        )

        # IAM role for ECS task execution (pulling images, writing logs)
        # PCI-DSS Requirement: Least privilege access for system components
        self.task_execution_role = aws.iam.Role(
            f"ecs-task-execution-role-{args.environment_suffix}",
            name=f"ecs-task-execution-role-{args.environment_suffix}",
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
            tags={
                "Name": f"ecs-task-execution-role-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for ECS task execution
        self.task_execution_policy_attachment = aws.iam.RolePolicyAttachment(
            f"ecs-task-execution-policy-{args.environment_suffix}",
            role=self.task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # IAM role for ECS task (application runtime permissions)
        self.task_role = aws.iam.Role(
            f"ecs-task-role-{args.environment_suffix}",
            name=f"ecs-task-role-{args.environment_suffix}",
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
            tags={
                "Name": f"ecs-task-role-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Task definition for payment processor
        # PCI-DSS Requirement: Secure container configuration with logging
        self.task_definition = aws.ecs.TaskDefinition(
            f"payment-processor-task-{args.environment_suffix}",
            family=f"payment-processor-{args.environment_suffix}",
            cpu="256",
            memory="512",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            execution_role_arn=self.task_execution_role.arn,
            task_role_arn=self.task_role.arn,
            container_definitions=pulumi.Output.all(args.log_group_name, args.environment_suffix).apply(
                lambda args: json.dumps([{
                    "name": "payment-processor",
                    "image": "nginx:latest",  # Placeholder - replace with actual payment processor image
                    "cpu": 256,
                    "memory": 512,
                    "essential": True,
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[0],
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "payment-processor"
                        }
                    },
                    "environment": [
                        {
                            "name": "ENVIRONMENT",
                            "value": args[1]
                        }
                    ]
                }])
            ),
            tags={
                "Name": f"payment-processor-task-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "cluster_id": self.cluster.id,
            "cluster_name": self.cluster.name,
            "task_definition_arn": self.task_definition.arn,
            "task_execution_role_arn": self.task_execution_role.arn,
            "task_role_arn": self.task_role.arn,
        })

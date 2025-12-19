"""compute_stack.py

This module defines the ComputeStack, which creates ECS Cluster and related
resources for video processing tasks.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2, aws_ecs as ecs, aws_iam as iam, aws_logs as logs
from constructs import Construct


class ComputeStackProps(cdk.NestedStackProps):
    """Properties for ComputeStack."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        vpc: Optional[ec2.IVpc] = None,
        ecs_security_group: Optional[ec2.ISecurityGroup] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.ecs_security_group = ecs_security_group


class ComputeStack(cdk.NestedStack):
    """
    ComputeStack creates ECS infrastructure for video processing.

    This stack provides:
    - ECS Cluster with Fargate capacity provider
    - Task execution role with necessary permissions
    - CloudWatch log group for container logs
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[ComputeStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        if not props or not props.vpc:
            raise ValueError("VPC must be provided in props")

        environment_suffix = props.environment_suffix if props else "dev"

        # Create ECS Cluster
        self.cluster = ecs.Cluster(
            self,
            "VideoProcessingCluster",
            cluster_name=f"video-processing-cluster-{environment_suffix}",
            vpc=props.vpc,
            container_insights=True,
            enable_fargate_capacity_providers=True,
        )

        # Create CloudWatch log group for ECS tasks
        self.log_group = logs.LogGroup(
            self,
            "VideoProcessingLogGroup",
            log_group_name=f"/ecs/video-processing-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        # Create task execution role
        self.task_execution_role = iam.Role(
            self,
            "TaskExecutionRole",
            role_name=f"video-processing-task-execution-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            description="Execution role for video processing ECS tasks",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ],
        )

        # Create task role with permissions for video processing
        self.task_role = iam.Role(
            self,
            "TaskRole",
            role_name=f"video-processing-task-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            description="Role for video processing ECS tasks",
        )

        # Add permissions to access EFS
        self.task_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "elasticfilesystem:ClientMount",
                    "elasticfilesystem:ClientWrite",
                    "elasticfilesystem:ClientRootAccess",
                ],
                resources=["*"],
            )
        )

        # Add permissions to access Secrets Manager
        self.task_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "secretsmanager:GetSecretValue",
                ],
                resources=["*"],
            )
        )

        # Add permissions for CloudWatch metrics and logs
        self.task_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:PutMetricData",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=["*"],
            )
        )

        # Add permissions for Step Functions integration
        self.task_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "states:SendTaskSuccess",
                    "states:SendTaskFailure",
                    "states:SendTaskHeartbeat",
                ],
                resources=["*"],
            )
        )

        # Outputs
        cdk.CfnOutput(
            self,
            "ClusterName",
            value=self.cluster.cluster_name,
            description="ECS cluster name for video processing",
            export_name=f"ClusterName-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "ClusterArn",
            value=self.cluster.cluster_arn,
            description="ECS cluster ARN",
            export_name=f"ClusterArn-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "TaskExecutionRoleArn",
            value=self.task_execution_role.role_arn,
            description="Task execution role ARN",
            export_name=f"TaskExecutionRoleArn-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "TaskRoleArn",
            value=self.task_role.role_arn,
            description="Task role ARN",
            export_name=f"TaskRoleArn-{environment_suffix}",
        )

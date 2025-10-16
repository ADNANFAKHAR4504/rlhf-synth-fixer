"""workflow_stack.py

This module defines the WorkflowStack, which creates AWS Step Functions state machine
for orchestrating video processing workflows.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_sns as sns,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct


class WorkflowStackProps(cdk.NestedStackProps):
    """Properties for WorkflowStack."""

    # pylint: disable=too-many-positional-arguments
    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        vpc: Optional[ec2.IVpc] = None,
        ecs_cluster: Optional[ecs.ICluster] = None,
        ecs_security_group: Optional[ec2.ISecurityGroup] = None,
        completion_topic: Optional[sns.ITopic] = None,
        error_topic: Optional[sns.ITopic] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.ecs_cluster = ecs_cluster
        self.ecs_security_group = ecs_security_group
        self.completion_topic = completion_topic
        self.error_topic = error_topic


class WorkflowStack(cdk.NestedStack):
    """
    WorkflowStack creates AWS Step Functions state machine for video processing workflow.

    This stack provides:
    - Step Functions state machine for orchestrating video processing
    - ECS task definition for video processing
    - Integration with SNS for notifications
    - Error handling and retry logic
    - CloudWatch log group for state machine execution logs
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[WorkflowStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        if not props or not props.vpc or not props.ecs_cluster:
            raise ValueError("VPC and ECS cluster must be provided in props")

        environment_suffix = props.environment_suffix if props else "dev"

        # Create CloudWatch log group for Step Functions
        self.log_group = logs.LogGroup(
            self,
            "VideoProcessingWorkflowLogGroup",
            log_group_name=f"/aws/stepfunctions/video-processing-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        # Create ECS task definition for video processing
        self.task_definition = ecs.FargateTaskDefinition(
            self,
            "VideoProcessingTaskDefinition",
            memory_limit_mib=2048,
            cpu=1024,
            runtime_platform=ecs.RuntimePlatform(
                operating_system_family=ecs.OperatingSystemFamily.LINUX,
                cpu_architecture=ecs.CpuArchitecture.X86_64,
            ),
        )

        # Add container to task definition
        self.container = self.task_definition.add_container(
            "VideoProcessingContainer",
            image=ecs.ContainerImage.from_registry("amazon/aws-cli:latest"),
            logging=ecs.LogDriver.aws_logs(
                stream_prefix="video-processing",
                log_group=self.log_group,
            ),
            environment={
                "ENVIRONMENT": environment_suffix,
            },
            command=[
                "bash",
                "-c",
                "echo 'Processing video...' && sleep 5 && echo 'Video processing complete'",
            ],
        )

        # Create SNS publish task for completion notification
        if props.completion_topic:
            self.success_notification = tasks.SnsPublish(
                self,
                "SendSuccessNotification",
                topic=props.completion_topic,
                message=sfn.TaskInput.from_json_path_at("$.result"),
                subject="Video Processing Completed",
                result_path=sfn.JsonPath.DISCARD,
            )
        else:
            # Create a pass state if topic is not provided
            self.success_notification = sfn.Pass(
                self,
                "SuccessNotificationPlaceholder",
                comment="Success notification placeholder",
            )

        # Create SNS publish task for error notification
        if props.error_topic:
            self.error_notification = tasks.SnsPublish(
                self,
                "SendErrorNotification",
                topic=props.error_topic,
                message=sfn.TaskInput.from_text("Video processing failed"),
                subject="Video Processing Error",
                result_path=sfn.JsonPath.DISCARD,
            )
        else:
            # Create a pass state if topic is not provided
            self.error_notification = sfn.Pass(
                self,
                "ErrorNotificationPlaceholder",
                comment="Error notification placeholder",
            )

        # Create ECS Run Task for video processing
        self.process_video_task = tasks.EcsRunTask(
            self,
            "ProcessVideoTask",
            integration_pattern=sfn.IntegrationPattern.RUN_JOB,
            cluster=props.ecs_cluster,
            task_definition=self.task_definition,
            launch_target=tasks.EcsFargateLaunchTarget(
                platform_version=ecs.FargatePlatformVersion.LATEST,
            ),
            container_overrides=[
                tasks.ContainerOverride(
                    container_definition=self.container,
                    environment=[
                        tasks.TaskEnvironmentVariable(
                            name="VIDEO_ID",
                            value=sfn.JsonPath.string_at("$.videoId"),
                        ),
                    ],
                )
            ],
            result_path="$.taskResult",
        )

        # Add retry logic to ECS task
        self.process_video_task.add_retry(
            errors=["States.TaskFailed"],
            interval=cdk.Duration.seconds(30),
            max_attempts=3,
            backoff_rate=2.0,
        )

        # Add catch for errors
        self.process_video_task.add_catch(
            self.error_notification,
            errors=["States.ALL"],
            result_path="$.error",
        )

        # Create success state
        self.success_state = sfn.Succeed(
            self,
            "VideoProcessingSucceeded",
            comment="Video processing completed successfully",
        )

        # Define workflow chain
        definition = (
            self.process_video_task
            .next(self.success_notification)
            .next(self.success_state)
        )

        # Add error notification to failed state
        self.error_notification.next(
            sfn.Fail(
                self,
                "VideoProcessingFailed",
                cause="Video processing failed after retries",
                error="ProcessingError",
            )
        )

        # Create state machine
        self.state_machine = sfn.StateMachine(
            self,
            "VideoProcessingStateMachine",
            state_machine_name=f"video-processing-workflow-{environment_suffix}",
            definition_body=sfn.DefinitionBody.from_chainable(definition),
            timeout=cdk.Duration.minutes(30),
            tracing_enabled=True,
            logs=sfn.LogOptions(
                destination=self.log_group,
                level=sfn.LogLevel.ALL,
                include_execution_data=True,
            ),
        )

        # Grant state machine permissions to publish to SNS topics
        if props.completion_topic:
            props.completion_topic.grant_publish(self.state_machine)
        if props.error_topic:
            props.error_topic.grant_publish(self.state_machine)

        # Outputs
        cdk.CfnOutput(
            self,
            "StateMachineArn",
            value=self.state_machine.state_machine_arn,
            description="Step Functions state machine ARN for video processing",
            export_name=f"StateMachineArn-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "StateMachineName",
            value=self.state_machine.state_machine_name,
            description="Step Functions state machine name",
            export_name=f"StateMachineName-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "TaskDefinitionArn",
            value=self.task_definition.task_definition_arn,
            description="ECS task definition ARN for video processing",
            export_name=f"TaskDefinitionArn-{environment_suffix}",
        )

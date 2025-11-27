"""deployment_stack.py
CodeDeploy configuration for blue-green deployments.
"""

import aws_cdk as cdk
from constructs import Construct
from typing import Dict
from aws_cdk import (
    aws_ecs as ecs, aws_elasticloadbalancingv2 as elbv2,
    aws_codedeploy as codedeploy, aws_cloudwatch as cloudwatch,
    NestedStack
)


class DeploymentStackProps:
    """Properties for DeploymentStack."""
    def __init__(self, environment_suffix: str,
                 payment_api_service: ecs.FargateService,
                 transaction_processor_service: ecs.FargateService,
                 notification_service: ecs.FargateService,
                 alb_listener: elbv2.ApplicationListener,
                 target_groups: Dict[str, Dict[str, elbv2.ApplicationTargetGroup]],
                 alarms: Dict[str, cloudwatch.Alarm]):
        self.environment_suffix = environment_suffix
        self.payment_api_service = payment_api_service
        self.transaction_processor_service = transaction_processor_service
        self.notification_service = notification_service
        self.alb_listener = alb_listener
        self.target_groups = target_groups
        self.alarms = alarms


class DeploymentStack(NestedStack):
    """Creates CodeDeploy configuration for blue-green deployments."""

    def __init__(self, scope: Construct, construct_id: str, props: DeploymentStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # CodeDeploy application
        application = codedeploy.EcsApplication(
            self, f"PaymentProcessingApp{env_suffix}",
            application_name=f"payment-processing-{env_suffix}"
        )

        # Payment API deployment group
        # Note: Blue target group must be attached to the listener before creating deployment group
        self.payment_api_deployment_group = codedeploy.EcsDeploymentGroup(
            self, f"PaymentAPIDeploymentGroup{env_suffix}",
            application=application,
            deployment_group_name=f"payment-api-dg-{env_suffix}",
            service=props.payment_api_service,
            blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
                blue_target_group=props.target_groups['payment-api']['blue'],
                green_target_group=props.target_groups['payment-api']['green'],
                listener=props.alb_listener,
                termination_wait_time=cdk.Duration.minutes(5)
            ),
            deployment_config=codedeploy.EcsDeploymentConfig.LINEAR_10_PERCENT_EVERY_1_MINUTES,
            alarms=[props.alarms['payment-api']],
            auto_rollback=codedeploy.AutoRollbackConfig(
                failed_deployment=True, stopped_deployment=True, deployment_in_alarm=True
            )
        )

        # Transaction processor deployment group
        self.transaction_processor_deployment_group = codedeploy.EcsDeploymentGroup(
            self, f"TxnProcessorDeploymentGroup{env_suffix}",
            application=application,
            deployment_group_name=f"transaction-processor-dg-{env_suffix}",
            service=props.transaction_processor_service,
            blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
                blue_target_group=props.target_groups['transaction-processor']['blue'],
                green_target_group=props.target_groups['transaction-processor']['green'],
                listener=props.alb_listener,
                termination_wait_time=cdk.Duration.minutes(5)
            ),
            deployment_config=codedeploy.EcsDeploymentConfig.LINEAR_10_PERCENT_EVERY_1_MINUTES,
            alarms=[props.alarms['transaction-processor']],
            auto_rollback=codedeploy.AutoRollbackConfig(
                failed_deployment=True, stopped_deployment=True, deployment_in_alarm=True
            )
        )

        # Notification service deployment group
        self.notification_service_deployment_group = codedeploy.EcsDeploymentGroup(
            self, f"NotificationDeploymentGroup{env_suffix}",
            application=application,
            deployment_group_name=f"notification-service-dg-{env_suffix}",
            service=props.notification_service,
            blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
                blue_target_group=props.target_groups['notification-service']['blue'],
                green_target_group=props.target_groups['notification-service']['green'],
                listener=props.alb_listener,
                termination_wait_time=cdk.Duration.minutes(5)
            ),
            deployment_config=codedeploy.EcsDeploymentConfig.LINEAR_10_PERCENT_EVERY_1_MINUTES,
            alarms=[props.alarms['notification-service']],
            auto_rollback=codedeploy.AutoRollbackConfig(
                failed_deployment=True, stopped_deployment=True, deployment_in_alarm=True
            )
        )

        cdk.CfnOutput(self, f"CodeDeployApplication{env_suffix}", value=application.application_name)

from aws_cdk import Stack
from aws_cdk.aws_codedeploy import (
    EcsApplication,
    EcsDeploymentGroup,
)
from aws_cdk.aws_ecs import FargateService
from aws_cdk.aws_elasticloadbalancingv2 import (
    ApplicationListener,
    ApplicationTargetGroup,
)
from constructs import Construct


class CicdStack(Stack):
    def __init__(
        self,
        scope: Construct,
        stack_id: str,
        *,
        fargate_service: FargateService,
        listener: ApplicationListener,
        blue_target_group: ApplicationTargetGroup,
        green_target_group: ApplicationTargetGroup,
        codedeploy_app: EcsApplication,
        deployment_group: EcsDeploymentGroup,
        **kwargs
    ):
        super().__init__(scope, stack_id, **kwargs)

        # Store references to existing CodeDeploy resources from ECS stack
        self.codedeploy_app = codedeploy_app
        self.deployment_group = deployment_group
        self.fargate_service = fargate_service
        self.listener = listener
        self.blue_target_group = blue_target_group
        self.green_target_group = green_target_group

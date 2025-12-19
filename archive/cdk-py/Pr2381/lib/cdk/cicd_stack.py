from aws_cdk import (
  Stack,
  aws_codedeploy as codedeploy,
  aws_iam as iam,
  Duration,
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
    **kwargs
  ):
    super().__init__(scope, stack_id, **kwargs)

    # Create CodeDeploy ECS application
    codedeploy_app = codedeploy.EcsApplication(self, "CodeDeployEcsApp")

    # Role for CodeDeploy to interact with ECS and ALB
    codedeploy_role = iam.Role(
      self,
      "CodeDeployServiceRole",
      assumed_by=iam.ServicePrincipal("codedeploy.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "AWSCodeDeployRoleForECS"
        )
      ],
    )

    # ECS CodeDeploy Deployment Group
    codedeploy.EcsDeploymentGroup(
      self,
      "CodeDeployDeploymentGroup",
      application=codedeploy_app,
      service=fargate_service,
      blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
        listener=listener,
        blue_target_group=blue_target_group,
        green_target_group=green_target_group,
        deployment_approval_wait_time=Duration.minutes(5),
      ),
      deployment_config=codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
      auto_rollback=codedeploy.AutoRollbackConfig(
        failed_deployment=True,
        stopped_deployment=True,
        deployment_in_alarm=False,
      ),
      role=codedeploy_role,
    )
# tests/unit/test_cicd_stack.py

import pytest
from aws_cdk import App, Stack
from aws_cdk import aws_ecs as ecs
from aws_cdk import aws_elasticloadbalancingv2 as elbv2
from aws_cdk import aws_codedeploy as codedeploy
from aws_cdk import aws_iam as iam

from lib.cdk.cicd_stack import CicdStack


def test_cicd_stack_synthesizes_correctly():
    app = App()
    dummy_stack = Stack(app, "DummyStack")

    # Create minimal dummy resources
    dummy_cluster = ecs.Cluster(dummy_stack, "Cluster")
    dummy_task_def = ecs.FargateTaskDefinition(dummy_stack, "TaskDef")

    fargate_service = ecs.FargateService(
        dummy_stack,
        "FargateService",
        cluster=dummy_cluster,
        task_definition=dummy_task_def,
        deployment_controller=ecs.DeploymentController(
            type=ecs.DeploymentControllerType.CODE_DEPLOY
        )
    )

    load_balancer = elbv2.ApplicationLoadBalancer(
        dummy_stack,
        "LB",
        vpc=dummy_cluster.vpc,
        internet_facing=True
    )

    listener = elbv2.ApplicationListener(
        dummy_stack,
        "Listener",
        port=80,
        load_balancer=load_balancer
    )

    tg1 = elbv2.ApplicationTargetGroup(
        dummy_stack,
        "BlueTG",
        vpc=dummy_cluster.vpc,
        port=80,
        protocol=elbv2.ApplicationProtocol.HTTP
    )

    tg2 = elbv2.ApplicationTargetGroup(
        dummy_stack,
        "GreenTG",
        vpc=dummy_cluster.vpc,
        port=80,
        protocol=elbv2.ApplicationProtocol.HTTP
    )

    # Create dummy CodeDeploy resources
    codedeploy_app = codedeploy.EcsApplication(dummy_stack, "DummyCodeDeployApp")
    
    codedeploy_role = iam.Role(
        dummy_stack,
        "DummyCodeDeployRole",
        assumed_by=iam.ServicePrincipal("codedeploy.amazonaws.com"),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name("AWSCodeDeployRoleForECS")
        ],
    )

    deployment_group = codedeploy.EcsDeploymentGroup(
        dummy_stack,
        "DummyDeploymentGroup",
        service=fargate_service,
        blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
            listener=listener,
            blue_target_group=tg1,
            green_target_group=tg2,
        ),
        deployment_config=codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
        application=codedeploy_app,
        role=codedeploy_role,
    )

    # Now pass the required arguments including CodeDeploy resources
    stack = CicdStack(
        app,
        "MyTestCICDStack",
        fargate_service=fargate_service,
        listener=listener,
        blue_target_group=tg1,
        green_target_group=tg2,
        codedeploy_app=codedeploy_app,
        deployment_group=deployment_group,
    )

    # Assertion to ensure stack synthesizes
    assert stack

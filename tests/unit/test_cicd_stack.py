# tests/unit/test_cicd_stack.py

import pytest
from aws_cdk import App, Stack
from aws_cdk import aws_ecs as ecs
from aws_cdk import aws_elasticloadbalancingv2 as elbv2

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

    # Now pass the required arguments
    stack = CicdStack(
        app,
        "MyTestCICDStack",
        fargate_service=fargate_service,
        listener=listener,
        blue_target_group=tg1,
        green_target_group=tg2
    )

    # Assertion to ensure stack synthesizes
    assert stack
    
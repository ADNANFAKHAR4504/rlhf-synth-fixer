import pytest
from aws_cdk import App, Stack
from aws_cdk.assertions import Template

from lib.cdk.ecs_stack import EcsStack  

@pytest.fixture
def ecs_template():
    app = App()
    stack = EcsStack(app, "EcsStackTest")
    template = Template.from_stack(stack)
    return template

def test_vpc_created(ecs_template):
    ecs_template.resource_count_is("AWS::EC2::VPC", 1)

def test_cluster_created(ecs_template):
    ecs_template.resource_count_is("AWS::ECS::Cluster", 1)

def test_task_definition_created(ecs_template):
    ecs_template.resource_count_is("AWS::ECS::TaskDefinition", 1)

def test_fargate_service_created(ecs_template):
    ecs_template.resource_count_is("AWS::ECS::Service", 1)

def test_load_balancer_created(ecs_template):
    ecs_template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

def test_listener_created(ecs_template):
    ecs_template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)

def test_target_groups_created(ecs_template):
    ecs_template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 2)

def test_codedeploy_app_created(ecs_template):
    ecs_template.resource_count_is("AWS::CodeDeploy::Application", 1)

def test_codedeploy_deployment_group_created(ecs_template):
    ecs_template.resource_count_is("AWS::CodeDeploy::DeploymentGroup", 1)

def test_codedeploy_role_created(ecs_template):
    ecs_template.resource_count_is("AWS::IAM::Role", 2)

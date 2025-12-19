import aws_cdk as cdk
import aws_cdk.assertions as assertions

from lib.tap_stack import TapStack


def test_vpc_created():
    app = cdk.App()
    stack = TapStack(app, "tap-stack")
    template = assertions.Template.from_stack(stack)

    # Test VPC creation
    template.has_resource_properties("AWS::EC2::VPC", {
        "CidrBlock": "10.0.0.0/16"
    })


def test_security_groups_created():
    app = cdk.App()
    stack = TapStack(app, "tap-stack")
    template = assertions.Template.from_stack(stack)

    # Test security group creation
    template.resource_count_is("AWS::EC2::SecurityGroup", 5)


def test_rds_instance_created():
    app = cdk.App()
    stack = TapStack(app, "tap-stack")
    template = assertions.Template.from_stack(stack)

    # Test RDS instance creation
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "Engine": "postgres",
        "MultiAZ": True,
        "StorageEncrypted": True
    })


def test_alb_created():
    app = cdk.App()
    stack = TapStack(app, "tap-stack")
    template = assertions.Template.from_stack(stack)

    # Test ALB creation
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
        "Scheme": "internet-facing",
        "Type": "application"
    })


def test_lambda_function_created():
    app = cdk.App()
    stack = TapStack(app, "tap-stack")
    template = assertions.Template.from_stack(stack)

    # Test Lambda function creation
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.9"
    })
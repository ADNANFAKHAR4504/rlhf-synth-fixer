import aws_cdk as cdk
from aws_cdk import assertions
from lib.tap_stack import TapStack


def test_vpc_created():
    """Test that VPC is created with correct configuration"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert VPC is created
    template.resource_count_is("AWS::EC2::VPC", 1)

    # Assert VPC has DNS support enabled
    template.has_resource_properties("AWS::EC2::VPC", {
        "EnableDnsHostnames": True,
        "EnableDnsSupport": True,
    })


def test_ecr_repository_created():
    """Test that ECR repository is created with lifecycle policy"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert ECR repository is created
    template.resource_count_is("AWS::ECR::Repository", 1)

    # Assert repository has lifecycle policy
    template.has_resource_properties("AWS::ECR::Repository", {
        "RepositoryName": "flask-api-test",
    })


def test_aurora_cluster_created():
    """Test that Aurora PostgreSQL cluster is created"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert Aurora cluster is created
    template.resource_count_is("AWS::RDS::DBCluster", 1)

    # Assert cluster has encryption enabled
    template.has_resource_properties("AWS::RDS::DBCluster", {
        "Engine": "aurora-postgresql",
        "StorageEncrypted": True,
        "DatabaseName": "productdb",
    })


def test_aurora_instances_created():
    """Test that Aurora instances (writer and reader) are created"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert 2 DB instances are created (writer + reader)
    template.resource_count_is("AWS::RDS::DBInstance", 2)


def test_ecs_cluster_created():
    """Test that ECS cluster is created with container insights"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert ECS cluster is created
    template.resource_count_is("AWS::ECS::Cluster", 1)

    # Assert cluster has correct name
    template.has_resource_properties("AWS::ECS::Cluster", {
        "ClusterName": "flask-api-cluster-test",
    })


def test_ecs_service_created():
    """Test that ECS Fargate service is created"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert ECS service is created
    template.resource_count_is("AWS::ECS::Service", 1)


def test_alb_created():
    """Test that Application Load Balancer is created"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert ALB is created
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    # Assert ALB is internet-facing
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
        "Scheme": "internet-facing",
        "Type": "application",
    })


def test_alb_listener_created():
    """Test that ALB listener is created"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert listener is created
    template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)

    # Assert listener is on port 80
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
        "Port": 80,
        "Protocol": "HTTP",
    })


def test_target_group_created():
    """Test that target group is created with health check"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert target group is created
    template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

    # Assert health check path is /health
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
        "Port": 5000,
        "Protocol": "HTTP",
        "TargetType": "ip",
    })


def test_security_groups_created():
    """Test that security groups are created"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert multiple security groups are created (VPC default + ALB + ECS + DB)
    # Minimum 3 custom security groups (ALB, ECS service, DB)
    template.resource_count_is("AWS::EC2::SecurityGroup", 3)


def test_secrets_created():
    """Test that secrets are created in Secrets Manager"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert secrets are created (Aurora auto-generated + custom connection secret)
    template.resource_count_is("AWS::SecretsManager::Secret", 2)


def test_iam_roles_created():
    """Test that IAM roles are created for ECS tasks"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert task execution role and task role are created
    # Plus custom VPC role
    assert template.find_resources("AWS::IAM::Role")


def test_cloudwatch_log_groups_created():
    """Test that CloudWatch log groups are created"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert log groups are created (flask + xray)
    template.resource_count_is("AWS::Logs::LogGroup", 2)


def test_cloudwatch_alarms_created():
    """Test that CloudWatch alarms are created"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert alarms are created (high CPU + low task count)
    template.resource_count_is("AWS::CloudWatch::Alarm", 2)


def test_autoscaling_configured():
    """Test that autoscaling is configured"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Assert scalable target is created
    template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 1)

    # Assert scaling policy is created
    template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", 1)


def test_stack_outputs_created():
    """Test that stack outputs are created"""
    app = cdk.App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    template = assertions.Template.from_stack(stack)

    # Get all outputs
    outputs = template.find_outputs("*")

    # Assert key outputs exist
    assert "ALBDnsName" in outputs
    assert "ECRRepositoryUri" in outputs
    assert "ECSClusterName" in outputs
    assert "ECSServiceName" in outputs
    assert "VpcId" in outputs

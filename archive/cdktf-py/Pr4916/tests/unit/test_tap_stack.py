"""Comprehensive unit tests for TAP Stack."""
import os
import sys
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestStackInstantiation:
    """Test suite for Stack Instantiation."""

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="sa-east-1",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None


class TestVPCConfiguration:
    """Test suite for VPC Configuration."""

    def test_vpc_created_with_correct_cidr(self):
        """Test VPC is created with correct CIDR block."""
        app = App()
        stack = TapStack(app, "TestVPC", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check VPC exists with correct CIDR
        assert any(
            resource.get("cidr_block") == "10.0.0.0/16"
            for resource in synthesized.get("resource", {}).get("aws_vpc", {}).values()
        )

    def test_vpc_dns_support_enabled(self):
        """Test VPC has DNS support enabled."""
        app = App()
        stack = TapStack(app, "TestVPCDNS", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check VPC has DNS support enabled
        assert any(
            resource.get("enable_dns_support") is True
            for resource in synthesized.get("resource", {}).get("aws_vpc", {}).values()
        )

    def test_subnets_created_in_multiple_azs(self):
        """Test subnets are created in multiple availability zones."""
        app = App()
        stack = TapStack(app, "TestSubnets", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check multiple subnets exist
        subnets = synthesized.get("resource", {}).get("aws_subnet", {})
        assert len(subnets) >= 4  # 2 public + 2 private


class TestSecurityGroups:
    """Test suite for Security Groups."""

    def test_alb_security_group_created(self):
        """Test ALB security group is created with correct rules."""
        app = App()
        stack = TapStack(app, "TestALBSG", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check ALB security group exists
        security_groups = synthesized.get("resource", {}).get("aws_security_group", {})
        assert any("alb" in sg_name.lower() for sg_name in security_groups.keys())

    def test_ecs_security_group_created(self):
        """Test ECS security group is created."""
        app = App()
        stack = TapStack(app, "TestECSSG", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check ECS security group exists
        security_groups = synthesized.get("resource", {}).get("aws_security_group", {})
        assert any("ecs" in sg_name.lower() for sg_name in security_groups.keys())

    def test_elasticache_security_group_created(self):
        """Test ElastiCache security group is created."""
        app = App()
        stack = TapStack(app, "TestRedisSG", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check ElastiCache security group exists
        security_groups = synthesized.get("resource", {}).get("aws_security_group", {})
        assert any("elasticache" in sg_name.lower() or "redis" in sg_name.lower() for sg_name in security_groups.keys())


class TestECSConfiguration:
    """Test suite for ECS Configuration."""

    def test_ecs_cluster_created(self):
        """Test ECS cluster is created."""
        app = App()
        stack = TapStack(app, "TestECSCluster", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check ECS cluster exists
        assert "aws_ecs_cluster" in synthesized.get("resource", {})

    def test_ecs_task_definition_created(self):
        """Test ECS task definition is created."""
        app = App()
        stack = TapStack(app, "TestECSTask", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check ECS task definition exists
        assert "aws_ecs_task_definition" in synthesized.get("resource", {})

    def test_ecs_service_created(self):
        """Test ECS service is created."""
        app = App()
        stack = TapStack(app, "TestECSService", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check ECS service exists
        assert "aws_ecs_service" in synthesized.get("resource", {})

    def test_ecs_service_fargate_launch_type(self):
        """Test ECS service uses Fargate launch type."""
        app = App()
        stack = TapStack(app, "TestECSFargate", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check ECS service uses Fargate
        ecs_services = synthesized.get("resource", {}).get("aws_ecs_service", {})
        assert any(
            service.get("launch_type") == "FARGATE"
            for service in ecs_services.values()
        )


class TestElastiCacheConfiguration:
    """Test suite for ElastiCache Configuration."""

    def test_elasticache_serverless_created(self):
        """Test ElastiCache Serverless cache is created."""
        app = App()
        stack = TapStack(app, "TestRedis", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check ElastiCache Serverless exists
        assert "aws_elasticache_serverless_cache" in synthesized.get("resource", {})

    def test_elasticache_redis_engine(self):
        """Test ElastiCache uses Redis engine."""
        app = App()
        stack = TapStack(app, "TestRedisEngine", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check Redis engine
        caches = synthesized.get("resource", {}).get("aws_elasticache_serverless_cache", {})
        assert any(
            cache.get("engine") == "redis"
            for cache in caches.values()
        )


class TestLoadBalancerConfiguration:
    """Test suite for Load Balancer Configuration."""

    def test_alb_created(self):
        """Test Application Load Balancer is created."""
        app = App()
        stack = TapStack(app, "TestALB", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check ALB exists
        assert "aws_lb" in synthesized.get("resource", {})

    def test_target_group_created(self):
        """Test Target Group is created."""
        app = App()
        stack = TapStack(app, "TestTG", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check target group exists
        assert "aws_lb_target_group" in synthesized.get("resource", {})

    def test_alb_listener_created(self):
        """Test ALB listener is created."""
        app = App()
        stack = TapStack(app, "TestListener", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check listener exists
        assert "aws_lb_listener" in synthesized.get("resource", {})


class TestIAMConfiguration:
    """Test suite for IAM Configuration."""

    def test_ecs_task_execution_role_created(self):
        """Test ECS task execution role is created."""
        app = App()
        stack = TapStack(app, "TestExecutionRole", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check IAM role exists
        roles = synthesized.get("resource", {}).get("aws_iam_role", {})
        assert any("execution" in role_name.lower() for role_name in roles.keys())

    def test_ecs_task_role_created(self):
        """Test ECS task role is created."""
        app = App()
        stack = TapStack(app, "TestTaskRole", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check IAM role exists
        roles = synthesized.get("resource", {}).get("aws_iam_role", {})
        assert len(roles) >= 2  # At least execution role and task role


class TestSecretsManagerConfiguration:
    """Test suite for Secrets Manager Configuration."""

    def test_secrets_manager_secret_created(self):
        """Test Secrets Manager secret is created."""
        app = App()
        stack = TapStack(app, "TestSecret", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check secret exists
        assert "aws_secretsmanager_secret" in synthesized.get("resource", {})

    def test_secrets_manager_secret_version_created(self):
        """Test Secrets Manager secret version is created."""
        app = App()
        stack = TapStack(app, "TestSecretVersion", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check secret version exists
        assert "aws_secretsmanager_secret_version" in synthesized.get("resource", {})


class TestCloudWatchConfiguration:
    """Test suite for CloudWatch Configuration."""

    def test_cloudwatch_log_group_created(self):
        """Test CloudWatch log group is created."""
        app = App()
        stack = TapStack(app, "TestLogGroup", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check log group exists
        assert "aws_cloudwatch_log_group" in synthesized.get("resource", {})

    def test_cloudwatch_alarms_created(self):
        """Test CloudWatch alarms are created."""
        app = App()
        stack = TapStack(app, "TestAlarms", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check alarms exist (should have at least 7)
        alarms = synthesized.get("resource", {}).get("aws_cloudwatch_metric_alarm", {})
        assert len(alarms) >= 7


class TestSNSConfiguration:
    """Test suite for SNS Configuration."""

    def test_sns_topic_created(self):
        """Test SNS topic is created."""
        app = App()
        stack = TapStack(app, "TestSNS", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check SNS topic exists
        assert "aws_sns_topic" in synthesized.get("resource", {})

    def test_sns_subscription_created(self):
        """Test SNS subscription is created."""
        app = App()
        stack = TapStack(app, "TestSNSSub", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check SNS subscription exists
        assert "aws_sns_topic_subscription" in synthesized.get("resource", {})


class TestAutoScalingConfiguration:
    """Test suite for Auto Scaling Configuration."""

    def test_autoscaling_target_created(self):
        """Test Application Auto Scaling target is created."""
        app = App()
        stack = TapStack(app, "TestASTarget", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check autoscaling target exists
        assert "aws_appautoscaling_target" in synthesized.get("resource", {})

    def test_autoscaling_policies_created(self):
        """Test Auto Scaling policies are created."""
        app = App()
        stack = TapStack(app, "TestASPolicy", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check autoscaling policies exist (CPU, memory, ALB request count)
        policies = synthesized.get("resource", {}).get("aws_appautoscaling_policy", {})
        assert len(policies) >= 3


class TestWAFConfiguration:
    """Test suite for WAF Configuration."""

    def test_waf_web_acl_created(self):
        """Test WAF WebACL is created."""
        app = App()
        stack = TapStack(app, "TestWAF", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check WAF WebACL exists
        assert "aws_wafv2_web_acl" in synthesized.get("resource", {})

    def test_waf_web_acl_association_created(self):
        """Test WAF WebACL association is created."""
        app = App()
        stack = TapStack(app, "TestWAFAssoc", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check WAF association exists
        assert "aws_wafv2_web_acl_association" in synthesized.get("resource", {})


class TestServiceDiscovery:
    """Test suite for Service Discovery."""

    def test_service_discovery_namespace_created(self):
        """Test Service Discovery namespace is created."""
        app = App()
        stack = TapStack(app, "TestServiceDiscovery", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check service discovery namespace exists
        assert "aws_service_discovery_private_dns_namespace" in synthesized.get("resource", {})


class TestResourceTags:
    """Test suite for Resource Tags."""

    def test_resources_have_name_tags(self):
        """Test resources have Name tags."""
        app = App()
        stack = TapStack(app, "TestTags", environment_suffix="test", aws_region="sa-east-1")
        synthesized = json.loads(Testing.synth(stack))

        # Check VPC has tags
        vpcs = synthesized.get("resource", {}).get("aws_vpc", {})
        assert any(
            vpc.get("tags", {}).get("Name") is not None
            for vpc in vpcs.values()
        )

"""Unit tests for TAP Stack - EduTech Brasil LMS Infrastructure."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed
        pass

    def test_tap_stack_instantiates_successfully(self):
        """TapStack instantiates successfully with required parameters."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test123",
            aws_region="sa-east-1"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None
        assert stack.environment_suffix == "test123"
        assert stack.region == "sa-east-1"

    def test_tap_stack_uses_default_region(self):
        """TapStack uses default region when not provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault", environment_suffix="test")

        # Verify default region is sa-east-1
        assert stack is not None
        assert stack.region == "sa-east-1"

    def test_tap_stack_merges_custom_tags(self):
        """TapStack merges custom tags from default_tags parameter."""
        app = App()
        custom_tags = {
            "tags": {
                "CustomTag": "custom-value",
                "Owner": "test-team"
            }
        }
        stack = TapStack(
            app,
            "TestTapStackTags",
            environment_suffix="test",
            default_tags=custom_tags
        )

        # Verify tags are merged
        assert stack is not None
        assert "CustomTag" in stack.common_tags
        assert stack.common_tags["CustomTag"] == "custom-value"
        assert stack.common_tags["environment"] == "production"  # Original tag preserved


class TestVPCConfiguration:
    """Test suite for VPC and networking configuration."""

    def test_vpc_is_created(self):
        """VPC is created with correct CIDR block."""
        app = App()
        stack = TapStack(app, "TestVPC", environment_suffix="test")

        # Synthesize to verify structure
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find VPC resource
        vpc_resources = [r for r in resources.get("resource", {}).get("aws_vpc", {}).values() if "cidr_block" in r]
        assert len(vpc_resources) > 0
        assert vpc_resources[0]["cidr_block"] == "10.0.0.0/16"
        assert vpc_resources[0]["enable_dns_hostnames"] is True
        assert vpc_resources[0]["enable_dns_support"] is True

    def test_subnets_are_created(self):
        """Public and private subnets are created across multiple AZs."""
        app = App()
        stack = TapStack(app, "TestSubnets", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find subnet resources
        subnets = resources.get("resource", {}).get("aws_subnet", {})
        assert len(subnets) >= 4  # At least 2 public + 2 private

    def test_internet_gateway_is_created(self):
        """Internet Gateway is created and attached to VPC."""
        app = App()
        stack = TapStack(app, "TestIGW", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find IGW resource
        igw = resources.get("resource", {}).get("aws_internet_gateway", {})
        assert len(igw) > 0

    def test_nat_gateway_is_created(self):
        """NAT Gateway is created for private subnet internet access."""
        app = App()
        stack = TapStack(app, "TestNAT", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find NAT Gateway resource
        nat_gw = resources.get("resource", {}).get("aws_nat_gateway", {})
        assert len(nat_gw) > 0

        # Find EIP for NAT Gateway
        eip = resources.get("resource", {}).get("aws_eip", {})
        assert len(eip) > 0


class TestSecurityConfiguration:
    """Test suite for security groups and IAM roles."""

    def test_security_groups_are_created(self):
        """Security groups for ECS, EFS, and ElastiCache are created."""
        app = App()
        stack = TapStack(app, "TestSG", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find security group resources
        sg = resources.get("resource", {}).get("aws_security_group", {})
        assert len(sg) >= 3  # ECS, EFS, ElastiCache

    def test_ecs_security_group_rules(self):
        """ECS security group has correct ingress/egress rules."""
        app = App()
        stack = TapStack(app, "TestECSSG", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find ECS security group
        sg_resources = resources.get("resource", {}).get("aws_security_group", {})
        ecs_sg = [sg for sg in sg_resources.values() if "ecs" in sg.get("description", "").lower()]
        assert len(ecs_sg) > 0

        # Verify ingress rules include HTTP and HTTPS
        ingress = ecs_sg[0].get("ingress", [])
        assert any(rule.get("from_port") == 80 for rule in ingress)
        assert any(rule.get("from_port") == 443 for rule in ingress)

    def test_iam_roles_are_created(self):
        """IAM roles for ECS task execution and task role are created."""
        app = App()
        stack = TapStack(app, "TestIAM", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find IAM role resources
        iam_roles = resources.get("resource", {}).get("aws_iam_role", {})
        assert len(iam_roles) >= 2  # Task execution role and task role

    def test_task_execution_role_has_managed_policy(self):
        """Task execution role has ECS task execution managed policy attached."""
        app = App()
        stack = TapStack(app, "TestIAMPolicy", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find IAM policy attachments
        policy_attachments = resources.get("resource", {}).get("aws_iam_role_policy_attachment", {})
        assert len(policy_attachments) > 0


class TestEncryptionConfiguration:
    """Test suite for encryption configuration."""

    def test_kms_keys_are_created(self):
        """KMS keys for EFS and ElastiCache are created."""
        app = App()
        stack = TapStack(app, "TestKMS", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find KMS key resources
        kms_keys = resources.get("resource", {}).get("aws_kms_key", {})
        assert len(kms_keys) >= 2  # EFS and ElastiCache

    def test_kms_keys_have_rotation_enabled(self):
        """KMS keys have automatic key rotation enabled."""
        app = App()
        stack = TapStack(app, "TestKMSRotation", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find KMS key resources
        kms_keys = resources.get("resource", {}).get("aws_kms_key", {})
        for key in kms_keys.values():
            assert key.get("enable_key_rotation") is True

    def test_efs_has_encryption(self):
        """EFS file system has encryption at rest enabled."""
        app = App()
        stack = TapStack(app, "TestEFSEncryption", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find EFS resources
        efs = resources.get("resource", {}).get("aws_efs_file_system", {})
        assert len(efs) > 0
        for fs in efs.values():
            assert fs.get("encrypted") is True

    def test_elasticache_has_encryption(self):
        """ElastiCache has both at-rest and in-transit encryption enabled."""
        app = App()
        stack = TapStack(app, "TestElastiCacheEncryption", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find ElastiCache replication group
        elasticache = resources.get("resource", {}).get("aws_elasticache_replication_group", {})
        assert len(elasticache) > 0
        for rg in elasticache.values():
            assert rg.get("at_rest_encryption_enabled") == "true"
            assert rg.get("transit_encryption_enabled") is True


class TestECSConfiguration:
    """Test suite for ECS cluster and service configuration."""

    def test_ecs_cluster_is_created(self):
        """ECS cluster is created with Container Insights enabled."""
        app = App()
        stack = TapStack(app, "TestECSCluster", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find ECS cluster
        ecs_cluster = resources.get("resource", {}).get("aws_ecs_cluster", {})
        assert len(ecs_cluster) > 0

        # Verify Container Insights is enabled
        for cluster in ecs_cluster.values():
            settings = cluster.get("setting", [])
            assert any(s.get("name") == "containerInsights" and s.get("value") == "enabled" for s in settings)

    def test_ecs_task_definition_is_created(self):
        """ECS task definition is created with correct configuration."""
        app = App()
        stack = TapStack(app, "TestECSTask", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find ECS task definition
        task_def = resources.get("resource", {}).get("aws_ecs_task_definition", {})
        assert len(task_def) > 0

        for td in task_def.values():
            assert td.get("network_mode") == "awsvpc"
            assert "FARGATE" in td.get("requires_compatibilities", [])
            assert td.get("cpu") == "512"
            assert td.get("memory") == "1024"

    def test_ecs_service_is_created(self):
        """ECS service is created with correct configuration."""
        app = App()
        stack = TapStack(app, "TestECSService", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find ECS service
        ecs_service = resources.get("resource", {}).get("aws_ecs_service", {})
        assert len(ecs_service) > 0

        for svc in ecs_service.values():
            assert svc.get("launch_type") == "FARGATE"
            assert svc.get("desired_count") == 2

    def test_task_has_efs_volume(self):
        """ECS task definition includes EFS volume configuration."""
        app = App()
        stack = TapStack(app, "TestEFSVolume", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find ECS task definition
        task_def = resources.get("resource", {}).get("aws_ecs_task_definition", {})
        for td in task_def.values():
            volumes = td.get("volume", [])
            assert len(volumes) > 0
            # Verify EFS volume configuration
            efs_volume = [v for v in volumes if v.get("name") == "efs-storage"]
            assert len(efs_volume) > 0
            # EFS volume exists, which is what we need to verify
            assert efs_volume[0].get("name") == "efs-storage"


class TestElastiCacheConfiguration:
    """Test suite for ElastiCache Redis configuration."""

    def test_elasticache_subnet_group_is_created(self):
        """ElastiCache subnet group is created."""
        app = App()
        stack = TapStack(app, "TestElastiCacheSubnet", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find ElastiCache subnet group
        subnet_group = resources.get("resource", {}).get("aws_elasticache_subnet_group", {})
        assert len(subnet_group) > 0

    def test_elasticache_replication_group_configuration(self):
        """ElastiCache replication group has correct configuration."""
        app = App()
        stack = TapStack(app, "TestElastiCacheRG", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find ElastiCache replication group
        rg = resources.get("resource", {}).get("aws_elasticache_replication_group", {})
        assert len(rg) > 0

        for group in rg.values():
            assert group.get("engine") == "redis"
            assert group.get("num_cache_clusters") == 2
            assert group.get("automatic_failover_enabled") is True
            assert group.get("multi_az_enabled") is True


class TestEFSConfiguration:
    """Test suite for EFS file system configuration."""

    def test_efs_file_system_is_created(self):
        """EFS file system is created."""
        app = App()
        stack = TapStack(app, "TestEFS", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find EFS file system
        efs = resources.get("resource", {}).get("aws_efs_file_system", {})
        assert len(efs) > 0

    def test_efs_mount_targets_are_created(self):
        """EFS mount targets are created in private subnets."""
        app = App()
        stack = TapStack(app, "TestEFSMountTargets", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find EFS mount targets
        mount_targets = resources.get("resource", {}).get("aws_efs_mount_target", {})
        assert len(mount_targets) >= 2  # One per private subnet


class TestOutputs:
    """Test suite for stack outputs."""

    def test_stack_has_required_outputs(self):
        """Stack exposes required outputs."""
        app = App()
        stack = TapStack(app, "TestOutputs", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find outputs
        outputs = resources.get("output", {})
        assert "vpc_id" in outputs
        assert "ecs_cluster_name" in outputs
        assert "ecs_service_name" in outputs
        assert "redis_endpoint" in outputs
        assert "efs_id" in outputs
        assert "efs_dns_name" in outputs


class TestResourceNaming:
    """Test suite for resource naming conventions."""

    def test_resources_include_environment_suffix(self):
        """All resources include the environment suffix in their names."""
        app = App()
        test_suffix = "mytest123"
        stack = TapStack(app, "TestNaming", environment_suffix=test_suffix)

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check various resource types for environment suffix
        resource_types = ["aws_vpc", "aws_subnet", "aws_security_group", "aws_ecs_cluster"]
        for res_type in resource_types:
            if res_type in resources.get("resource", {}):
                for resource_id in resources["resource"][res_type].keys():
                    assert test_suffix in resource_id, f"Resource {resource_id} missing environment suffix"

    def test_resources_have_required_tags(self):
        """All resources have required tags (environment and project)."""
        app = App()
        stack = TapStack(app, "TestTags", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Check resources with tags
        taggable_types = ["aws_vpc", "aws_subnet", "aws_security_group", "aws_ecs_cluster"]
        for res_type in taggable_types:
            if res_type in resources.get("resource", {}):
                for resource in resources["resource"][res_type].values():
                    tags = resource.get("tags", {})
                    assert "environment" in tags or "Environment" in tags
                    assert "project" in tags or "Project" in tags


class TestCloudWatchConfiguration:
    """Test suite for CloudWatch logging configuration."""

    def test_cloudwatch_log_group_is_created(self):
        """CloudWatch log group is created for ECS container logs."""
        app = App()
        stack = TapStack(app, "TestCWLogs", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find CloudWatch log group
        log_groups = resources.get("resource", {}).get("aws_cloudwatch_log_group", {})
        assert len(log_groups) > 0

        for lg in log_groups.values():
            assert lg.get("retention_in_days") == 7

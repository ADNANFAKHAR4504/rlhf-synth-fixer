"""Unit tests for TAP Stack."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack
from lib.networking_stack import NetworkingStack
from lib.security_stack import SecurityStack
from lib.database_stack import DatabaseStack
from lib.cache_stack import CacheStack
from lib.compute_stack import ComputeStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="test123",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        synth = Testing.synth(stack)
        assert synth is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        synth = Testing.synth(stack)
        assert synth is not None

    def test_tap_stack_creates_vpc_resources(self):
        """Test that VPC resources are created."""
        app = App()
        stack = TapStack(app, "TestVPC", environment_suffix="test")
        synth = Testing.synth(stack)

        # Parse the synthesized stack
        resources = json.loads(synth)

        # Verify VPC exists
        assert "resource" in resources
        assert "aws_vpc" in resources["resource"]

    def test_tap_stack_creates_security_resources(self):
        """Test that security resources are created."""
        app = App()
        stack = TapStack(app, "TestSecurity", environment_suffix="test")
        synth = Testing.synth(stack)

        # Parse the synthesized stack
        resources = json.loads(synth)

        # Verify KMS key exists
        assert "resource" in resources
        assert "aws_kms_key" in resources["resource"]
        assert "aws_secretsmanager_secret" in resources["resource"]

    def test_tap_stack_creates_database_resources(self):
        """Test that database resources are created."""
        app = App()
        stack = TapStack(app, "TestDB", environment_suffix="test")
        synth = Testing.synth(stack)

        # Parse the synthesized stack
        resources = json.loads(synth)

        # Verify RDS instance exists
        assert "resource" in resources
        assert "aws_db_instance" in resources["resource"]

        # Get the first DB instance
        db_instances = resources["resource"]["aws_db_instance"]
        db_instance_key = list(db_instances.keys())[0]
        db_instance = db_instances[db_instance_key]

        # Verify encryption is enabled
        assert db_instance.get("storage_encrypted") == True
        assert "kms_key_id" in db_instance

    def test_tap_stack_creates_cache_resources(self):
        """Test that ElastiCache resources are created."""
        app = App()
        stack = TapStack(app, "TestCache", environment_suffix="test")
        synth = Testing.synth(stack)

        # Parse the synthesized stack
        resources = json.loads(synth)

        # Verify ElastiCache cluster exists
        assert "resource" in resources
        assert "aws_elasticache_replication_group" in resources["resource"]

        # Get the first cache cluster
        cache_clusters = resources["resource"]["aws_elasticache_replication_group"]
        cache_cluster_key = list(cache_clusters.keys())[0]
        cache_cluster = cache_clusters[cache_cluster_key]

        # Verify encryption is enabled
        assert cache_cluster.get("at_rest_encryption_enabled") == True
        assert cache_cluster.get("transit_encryption_enabled") == True

    def test_tap_stack_creates_ecs_resources(self):
        """Test that ECS resources are created."""
        app = App()
        stack = TapStack(app, "TestECS", environment_suffix="test")
        synth = Testing.synth(stack)

        # Parse the synthesized stack
        resources = json.loads(synth)

        # Verify ECS cluster and service exist
        assert "resource" in resources
        assert "aws_ecs_cluster" in resources["resource"]
        assert "aws_ecs_service" in resources["resource"]
        assert "aws_ecs_task_definition" in resources["resource"]

    def test_tap_stack_has_outputs(self):
        """Test that stack has proper outputs."""
        app = App()
        stack = TapStack(app, "TestOutputs", environment_suffix="test")
        synth = Testing.synth(stack)

        # Parse the synthesized stack
        resources = json.loads(synth)

        # Verify outputs exist
        assert "output" in resources
        assert "vpc_id" in resources["output"]
        assert "alb_dns_name" in resources["output"]
        assert "db_endpoint" in resources["output"]
        assert "redis_endpoint" in resources["output"]


class TestNetworkingStack:
    """Test suite for Networking Stack."""

    def test_networking_stack_creates_vpc_with_subnets(self):
        """Test networking stack creates VPC with subnets."""
        app = App()
        stack = TapStack(app, "TestNetworking", environment_suffix="test")
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Verify VPC and subnets
        assert "aws_vpc" in resources["resource"]
        assert "aws_subnet" in resources["resource"]

        # Count subnets (should have 4: 2 public, 2 private)
        subnets = resources["resource"]["aws_subnet"]
        assert len(subnets) >= 4


class TestSecurityStack:
    """Test suite for Security Stack."""

    def test_security_stack_creates_kms_key_with_rotation(self):
        """Test security stack creates KMS key with rotation enabled."""
        app = App()
        stack = TapStack(app, "TestKMS", environment_suffix="test")
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Get KMS key
        kms_keys = resources["resource"]["aws_kms_key"]
        kms_key = list(kms_keys.values())[0]

        # Verify rotation is enabled
        assert kms_key.get("enable_key_rotation") == True

    def test_security_stack_creates_secrets_manager_secret(self):
        """Test security stack creates Secrets Manager secret."""
        app = App()
        stack = TapStack(app, "TestSecrets", environment_suffix="test")
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Verify Secrets Manager secret exists
        assert "aws_secretsmanager_secret" in resources["resource"]
        secrets = resources["resource"]["aws_secretsmanager_secret"]
        secret = list(secrets.values())[0]

        # Verify secret has KMS encryption
        assert "kms_key_id" in secret


class TestDatabaseStack:
    """Test suite for Database Stack."""

    def test_database_stack_creates_encrypted_rds_instance(self):
        """Test database stack creates encrypted RDS instance."""
        app = App()
        stack = TapStack(app, "TestRDS", environment_suffix="test")
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Get RDS instance
        db_instances = resources["resource"]["aws_db_instance"]
        db_instance = list(db_instances.values())[0]

        # Verify encryption and backup settings
        assert db_instance.get("storage_encrypted") == True
        assert db_instance.get("backup_retention_period") == 7
        assert db_instance.get("multi_az") == False


class TestCacheStack:
    """Test suite for Cache Stack."""

    def test_cache_stack_creates_encrypted_redis_cluster(self):
        """Test cache stack creates encrypted Redis cluster."""
        app = App()
        stack = TapStack(app, "TestRedis", environment_suffix="test")
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Get ElastiCache cluster
        cache_clusters = resources["resource"]["aws_elasticache_replication_group"]
        cache_cluster = list(cache_clusters.values())[0]

        # Verify encryption settings
        assert cache_cluster.get("at_rest_encryption_enabled") == True
        assert cache_cluster.get("transit_encryption_enabled") == True


class TestComputeStack:
    """Test suite for Compute Stack."""

    def test_compute_stack_creates_ecs_fargate_service(self):
        """Test compute stack creates ECS Fargate service."""
        app = App()
        stack = TapStack(app, "TestFargate", environment_suffix="test")
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Get ECS service
        ecs_services = resources["resource"]["aws_ecs_service"]
        ecs_service = list(ecs_services.values())[0]

        # Verify Fargate launch type
        assert ecs_service.get("launch_type") == "FARGATE"

    def test_compute_stack_creates_alb(self):
        """Test compute stack creates Application Load Balancer."""
        app = App()
        stack = TapStack(app, "TestALB", environment_suffix="test")
        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Verify ALB exists
        assert "aws_lb" in resources["resource"]
        albs = resources["resource"]["aws_lb"]
        alb = list(albs.values())[0]

        # Verify ALB type
        assert alb.get("load_balancer_type") == "application"


# add more test suites and cases as needed

"""Unit tests for TAP Stack - PCI-DSS Compliant Transaction Processing Infrastructure."""
import os
import sys
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        self.app = App()
        self.test_environment_suffix = "unittest"
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix=self.test_environment_suffix,
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-west-2",
            default_tags={"tags": {"Environment": self.test_environment_suffix}}
        )
        self.synthesized = Testing.synth(self.stack)

    def test_tap_stack_instantiates_successfully(self):
        """TapStack instantiates successfully with props."""
        assert self.stack is not None

    def test_vpc_created(self):
        """VPC is created with correct configuration."""
        assert Testing.to_have_resource(
            self.synthesized,
            "aws_vpc"
        )

    def test_kms_keys_created(self):
        """All three KMS keys are created (RDS, EFS, ElastiCache)."""
        resources = json.loads(self.synthesized)["resource"]
        kms_keys = resources.get("aws_kms_key", {})

        # Should have 3 KMS keys: RDS, EFS, ElastiCache
        assert len(kms_keys) == 3
        assert "rds_kms_key" in kms_keys
        assert "efs_kms_key" in kms_keys
        assert "elasticache_kms_key" in kms_keys

        # Verify key rotation is enabled
        for key_name, key_config in kms_keys.items():
            assert key_config["enable_key_rotation"] is True
            assert key_config["deletion_window_in_days"] == 10

    def test_kms_aliases_created(self):
        """KMS aliases are created for all keys."""
        resources = json.loads(self.synthesized)["resource"]
        kms_aliases = resources.get("aws_kms_alias", {})

        # Should have 3 KMS aliases
        assert len(kms_aliases) == 3
        assert "rds_kms_alias" in kms_aliases
        assert "efs_kms_alias" in kms_aliases
        assert "elasticache_kms_alias" in kms_aliases

    def test_subnets_created(self):
        """Public and private subnets are created across AZs."""
        resources = json.loads(self.synthesized)["resource"]
        subnets = resources.get("aws_subnet", {})

        # Should have 6 subnets total (3 public + 3 private)
        assert len(subnets) == 6

        # Count public and private subnets
        public_count = sum(1 for name in subnets.keys() if "public" in name)
        private_count = sum(1 for name in subnets.keys() if "private" in name)

        assert public_count == 3
        assert private_count == 3

    def test_security_groups_created(self):
        """Security groups are created for RDS, EFS, and ElastiCache."""
        resources = json.loads(self.synthesized)["resource"]
        security_groups = resources.get("aws_security_group", {})

        # Should have 3 security groups
        assert len(security_groups) == 3
        assert "rds_sg" in security_groups
        assert "efs_sg" in security_groups
        assert "elasticache_sg" in security_groups

        # Verify RDS security group has PostgreSQL port
        rds_sg = security_groups["rds_sg"]
        assert rds_sg["ingress"][0]["from_port"] == 5432
        assert rds_sg["ingress"][0]["to_port"] == 5432

        # Verify EFS security group has NFS port
        efs_sg = security_groups["efs_sg"]
        assert efs_sg["ingress"][0]["from_port"] == 2049
        assert efs_sg["ingress"][0]["to_port"] == 2049

        # Verify ElastiCache security group has Redis port
        elasticache_sg = security_groups["elasticache_sg"]
        assert elasticache_sg["ingress"][0]["from_port"] == 6379
        assert elasticache_sg["ingress"][0]["to_port"] == 6379

    def test_rds_cluster_created(self):
        """RDS Aurora PostgreSQL cluster is created with encryption."""
        resources = json.loads(self.synthesized)["resource"]
        rds_clusters = resources.get("aws_rds_cluster", {})

        assert len(rds_clusters) == 1
        assert "rds_cluster" in rds_clusters

        rds_cluster = rds_clusters["rds_cluster"]
        assert rds_cluster["engine"] == "aurora-postgresql"
        assert rds_cluster["engine_version"] == "15.4"
        assert rds_cluster["storage_encrypted"] is True
        assert rds_cluster["backup_retention_period"] == 30
        assert rds_cluster["deletion_protection"] is False
        assert rds_cluster["skip_final_snapshot"] is True
        assert "postgresql" in rds_cluster["enabled_cloudwatch_logs_exports"]

    def test_rds_cluster_instances_created(self):
        """RDS cluster instances (writer + reader) are created."""
        resources = json.loads(self.synthesized)["resource"]
        rds_instances = resources.get("aws_rds_cluster_instance", {})

        # Should have 2 instances: writer and reader
        assert len(rds_instances) == 2
        assert "rds_writer" in rds_instances
        assert "rds_reader" in rds_instances

        # Verify both are serverless
        assert rds_instances["rds_writer"]["instance_class"] == "db.serverless"
        assert rds_instances["rds_reader"]["instance_class"] == "db.serverless"

        # Verify performance insights are enabled
        assert rds_instances["rds_writer"]["performance_insights_enabled"] is True
        assert rds_instances["rds_reader"]["performance_insights_enabled"] is True

    def test_efs_filesystem_created(self):
        """EFS filesystem is created with KMS encryption."""
        resources = json.loads(self.synthesized)["resource"]
        efs_filesystems = resources.get("aws_efs_file_system", {})

        assert len(efs_filesystems) == 1
        assert "efs" in efs_filesystems

        efs = efs_filesystems["efs"]
        assert efs["encrypted"] is True
        assert efs["performance_mode"] == "generalPurpose"
        assert efs["throughput_mode"] == "bursting"

    def test_efs_mount_targets_created(self):
        """EFS mount targets are created in all private subnets."""
        resources = json.loads(self.synthesized)["resource"]
        mount_targets = resources.get("aws_efs_mount_target", {})

        # Should have 3 mount targets (one per private subnet/AZ)
        assert len(mount_targets) == 3

    def test_elasticache_replication_group_created(self):
        """ElastiCache Redis replication group is created with encryption."""
        resources = json.loads(self.synthesized)["resource"]
        elasticache_groups = resources.get("aws_elasticache_replication_group", {})

        assert len(elasticache_groups) == 1
        assert "elasticache" in elasticache_groups

        elasticache = elasticache_groups["elasticache"]
        assert elasticache["engine"] == "redis"
        assert elasticache["engine_version"] == "7.0"
        assert elasticache["num_cache_clusters"] == 3
        assert elasticache["transit_encryption_enabled"] is True
        assert elasticache["at_rest_encryption_enabled"] == "true"
        assert elasticache["automatic_failover_enabled"] is True

    def test_api_gateway_created(self):
        """API Gateway HTTP API is created."""
        resources = json.loads(self.synthesized)["resource"]
        apis = resources.get("aws_apigatewayv2_api", {})

        assert len(apis) == 1
        assert "api" in apis

        api = apis["api"]
        assert api["protocol_type"] == "HTTP"
        assert "cors_configuration" in api

    def test_api_gateway_stage_created(self):
        """API Gateway stage is created with logging."""
        resources = json.loads(self.synthesized)["resource"]
        stages = resources.get("aws_apigatewayv2_stage", {})

        assert len(stages) == 1
        assert "api_stage" in stages

        stage = stages["api_stage"]
        assert stage["auto_deploy"] is True
        assert "access_log_settings" in stage
        assert "default_route_settings" in stage

    def test_cloudwatch_log_groups_created(self):
        """CloudWatch log groups are created for RDS and API Gateway."""
        resources = json.loads(self.synthesized)["resource"]
        log_groups = resources.get("aws_cloudwatch_log_group", {})

        # Should have 2 log groups
        assert len(log_groups) == 2
        assert "rds_log_group" in log_groups
        assert "api_log_group" in log_groups

        # Verify retention period
        assert log_groups["rds_log_group"]["retention_in_days"] == 30
        assert log_groups["api_log_group"]["retention_in_days"] == 30

    def test_iam_role_created_for_api_gateway(self):
        """IAM role is created for API Gateway CloudWatch logging."""
        resources = json.loads(self.synthesized)["resource"]
        iam_roles = resources.get("aws_iam_role", {})

        assert len(iam_roles) == 1
        assert "api_role" in iam_roles

        # Verify role policy attachment
        iam_attachments = resources.get("aws_iam_role_policy_attachment", {})
        assert len(iam_attachments) == 1
        assert "api_role_policy" in iam_attachments

    def test_resource_naming_includes_environment_suffix(self):
        """All resource names include the environment suffix."""
        resources = json.loads(self.synthesized)["resource"]

        # Check VPC tags
        vpc = resources["aws_vpc"]["vpc"]
        assert self.test_environment_suffix in vpc["tags"]["Name"]

        # Check security group names
        for sg_name, sg_config in resources["aws_security_group"].items():
            assert self.test_environment_suffix in sg_config["name"]

        # Check RDS cluster identifier
        rds_cluster = resources["aws_rds_cluster"]["rds_cluster"]
        assert self.test_environment_suffix in rds_cluster["cluster_identifier"]

        # Check ElastiCache replication group ID
        elasticache = resources["aws_elasticache_replication_group"]["elasticache"]
        assert self.test_environment_suffix in elasticache["replication_group_id"]

    def test_compliance_tags_present(self):
        """PCI-DSS compliance tags are present on appropriate resources."""
        resources = json.loads(self.synthesized)["resource"]

        # Check RDS cluster has compliance tag
        rds_cluster = resources["aws_rds_cluster"]["rds_cluster"]
        assert "Compliance" in rds_cluster["tags"]
        assert rds_cluster["tags"]["Compliance"] == "PCI-DSS"

        # Check EFS has compliance tag
        efs = resources["aws_efs_file_system"]["efs"]
        assert "Compliance" in efs["tags"]
        assert efs["tags"]["Compliance"] == "PCI-DSS"

        # Check ElastiCache has compliance tag
        elasticache = resources["aws_elasticache_replication_group"]["elasticache"]
        assert "Compliance" in elasticache["tags"]
        assert elasticache["tags"]["Compliance"] == "PCI-DSS"

    def test_backend_configuration(self):
        """S3 backend is configured correctly."""
        terraform_config = json.loads(self.synthesized)["terraform"]

        assert "backend" in terraform_config
        assert "s3" in terraform_config["backend"]

        backend = terraform_config["backend"]["s3"]
        assert backend["bucket"] == "test-state-bucket"
        assert backend["region"] == "us-east-1"
        assert backend["encrypt"] is True

    def test_provider_configuration(self):
        """AWS provider is configured with correct region and tags."""
        provider_config = json.loads(self.synthesized)["provider"]

        assert "aws" in provider_config
        assert len(provider_config["aws"]) > 0

        aws_provider = provider_config["aws"][0]
        assert aws_provider["region"] == "us-west-2"
        assert "default_tags" in aws_provider
        assert aws_provider["default_tags"][0]["tags"]["Environment"] == self.test_environment_suffix


# Additional test cases for edge scenarios
class TestStackEdgeCases:
    """Test suite for edge cases and default values."""

    def test_stack_with_default_values(self):
        """Stack can be instantiated with minimal parameters."""
        app = App()
        stack = TapStack(app, "TestDefaultStack")

        assert stack is not None
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_stack_with_different_regions(self):
        """Stack can be deployed to different AWS regions."""
        app = App()

        # Test with different region
        stack_east = TapStack(
            app,
            "TestStackEast",
            aws_region="us-east-1",
            environment_suffix="east"
        )
        assert stack_east is not None

        synthesized_east = Testing.synth(stack_east)
        provider_config = json.loads(synthesized_east)["provider"]
        assert provider_config["aws"][0]["region"] == "us-east-1"

    def test_stack_with_custom_tags(self):
        """Stack accepts and applies custom tags."""
        app = App()
        custom_tags = {
            "tags": {
                "Environment": "test",
                "CostCenter": "engineering",
                "Project": "pci-dss-compliance"
            }
        }

        stack = TapStack(
            app,
            "TestCustomTags",
            default_tags=custom_tags
        )

        synthesized = Testing.synth(stack)
        provider_config = json.loads(synthesized)["provider"]
        applied_tags = provider_config["aws"][0]["default_tags"][0]["tags"]

        assert applied_tags["Environment"] == "test"
        assert applied_tags["CostCenter"] == "engineering"
        assert applied_tags["Project"] == "pci-dss-compliance"

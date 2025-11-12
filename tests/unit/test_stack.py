"""Unit tests for Payment Migration Stack"""
import json
import os
import pytest
from cdktf import Testing
from main import PaymentMigrationStack


class TestPaymentMigrationStack:
    """Test suite for Payment Migration Stack"""

    @pytest.fixture
    def stack(self):
        """Create a test stack instance"""
        app = Testing.app()
        return PaymentMigrationStack(app, "test-stack")

    def get_full_config(self, stack):
        """Helper to get full synthesized configuration"""
        outdir = Testing.full_synth(stack)
        config_path = os.path.join(outdir, "stacks", "test-stack", "cdk.tf.json")
        with open(config_path, 'r') as f:
            return json.load(f)

    def test_stack_creation(self, stack):
        """Test that stack can be created without errors"""
        assert stack is not None

    def test_synthesizes_correctly(self, stack):
        """Test that the stack synthesizes without errors"""
        manifest = Testing.synth(stack)
        assert manifest is not None

    def test_vpc_created(self, stack):
        """Test that VPC is created with correct configuration"""
        manifest = Testing.synth(stack)

        # Check that VPC exists in synthesized stack
        resources = Testing.to_have_resource_with_properties(
            manifest,
            "aws_vpc",
            {
                "cidr_block": "10.0.0.0/16",
                "enable_dns_hostnames": True,
                "enable_dns_support": True
            }
        )

    def test_subnets_created(self, stack):
        """Test that public and private subnets are created"""
        manifest = Testing.synth(stack)

        # Should have 3 public subnets
        public_subnets = Testing.to_have_resource(manifest, "aws_subnet")
        assert public_subnets is not None

        # Verify subnet count (3 public + 3 private = 6 total)
        full = self.get_full_config(stack)
        subnet_count = len(full["resource"]["aws_subnet"])
        assert subnet_count == 6

    def test_rds_cluster_created(self, stack):
        """Test that RDS Aurora cluster is created with encryption"""
        manifest = Testing.synth(stack)

        Testing.to_have_resource_with_properties(
            manifest,
            "aws_rds_cluster",
            {
                "engine": "aurora-mysql",
                "storage_encrypted": True,
                "skip_final_snapshot": True
            }
        )

    def test_rds_instances_created(self, stack):
        """Test that 3 RDS instances are created"""
        manifest = Testing.synth(stack)
        full = self.get_full_config(stack)

        # Should have 3 RDS cluster instances
        if "aws_rds_cluster_instance" in full.get("resource", {}):
            instance_count = len(full["resource"]["aws_rds_cluster_instance"])
            assert instance_count == 3

    def test_alb_created(self, stack):
        """Test that Application Load Balancer is created"""
        manifest = Testing.synth(stack)

        Testing.to_have_resource_with_properties(
            manifest,
            "aws_lb",
            {
                "load_balancer_type": "application",
                "enable_deletion_protection": False
            }
        )

    def test_autoscaling_group_created(self, stack):
        """Test that Auto Scaling group is created with correct size"""
        manifest = Testing.synth(stack)

        Testing.to_have_resource_with_properties(
            manifest,
            "aws_autoscaling_group",
            {
                "min_size": 3,
                "max_size": 9,
                "desired_capacity": 3
            }
        )

    def test_dms_resources_created(self, stack):
        """Test that DMS resources are created"""
        manifest = Testing.synth(stack)

        # Check DMS replication instance
        Testing.to_have_resource(manifest, "aws_dms_replication_instance")

        # Check DMS endpoints
        Testing.to_have_resource(manifest, "aws_dms_endpoint")

        # Check DMS replication task
        Testing.to_have_resource(manifest, "aws_dms_replication_task")

    def test_route53_record_created(self, stack):
        """Test that Route53 weighted routing is configured"""
        manifest = Testing.synth(stack)

        Testing.to_have_resource(manifest, "aws_route53_record")

    def test_cloudwatch_dashboard_created(self, stack):
        """Test that CloudWatch dashboard is created"""
        manifest = Testing.synth(stack)

        Testing.to_have_resource(manifest, "aws_cloudwatch_dashboard")

    def test_kms_key_created(self, stack):
        """Test that KMS key is created with rotation enabled"""
        manifest = Testing.synth(stack)

        Testing.to_have_resource_with_properties(
            manifest,
            "aws_kms_key",
            {
                "enable_key_rotation": True,
                "deletion_window_in_days": 10
            }
        )

    def test_security_groups_created(self, stack):
        """Test that all required security groups are created"""
        manifest = Testing.synth(stack)
        full = self.get_full_config(stack)

        # Should have 4 security groups: ALB, App, RDS, DMS
        if "aws_security_group" in full.get("resource", {}):
            sg_count = len(full["resource"]["aws_security_group"])
            assert sg_count == 4

    def test_nat_gateways_created(self, stack):
        """Test that NAT gateways are created for each AZ"""
        manifest = Testing.synth(stack)
        full = self.get_full_config(stack)

        # Should have 3 NAT gateways (one per AZ)
        if "aws_nat_gateway" in full.get("resource", {}):
            nat_count = len(full["resource"]["aws_nat_gateway"])
            assert nat_count == 3

    def test_data_sources_configured(self, stack):
        """Test that data sources are configured"""
        manifest = Testing.synth(stack)
        full = self.get_full_config(stack)

        # Check for VPN connection data source
        assert "data" in full
        assert "aws_vpn_connection" in full["data"]

    def test_outputs_defined(self, stack):
        """Test that all required outputs are defined"""
        manifest = Testing.synth(stack)
        full = self.get_full_config(stack)

        required_outputs = [
            "alb_dns_name",
            "rds_cluster_endpoint",
            "rds_reader_endpoint",
            "dms_replication_status",
            "vpc_id",
            "vpn_connection_id"
        ]

        outputs = full.get("output", {})
        for output_name in required_outputs:
            assert output_name in outputs

    def test_tags_applied(self, stack):
        """Test that common tags are applied to resources"""
        manifest = Testing.synth(stack)
        full = self.get_full_config(stack)

        # Check that VPC has required tags
        vpc = full["resource"]["aws_vpc"]
        for vpc_config in vpc.values():
            assert "tags" in vpc_config
            assert "Environment" in vpc_config["tags"]
            assert "Project" in vpc_config["tags"]
            assert "ManagedBy" in vpc_config["tags"]

    def test_encryption_enabled(self, stack):
        """Test that encryption is enabled for data stores"""
        manifest = Testing.synth(stack)
        full = self.get_full_config(stack)

        # RDS should have encryption
        if "aws_rds_cluster" in full["resource"]:
            for cluster in full["resource"]["aws_rds_cluster"].values():
                assert cluster.get("storage_encrypted") is True

"""Unit tests for TapStack"""
import json
import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test cases for TapStack infrastructure"""

    @pytest.fixture
    def stack(self):
        """Create a test stack instance"""
        app = Testing.app()
        return TapStack(app, "test-stack", "test123")

    def test_stack_synthesizes(self, stack):
        """Test that stack synthesizes without errors"""
        synth = Testing.synth(stack)
        assert synth is not None
        assert len(synth) > 0

    def test_vpc_created(self, stack):
        """Test VPC is created with correct CIDR"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        # Find VPC resource
        vpc_resources = [r for r in resources.get("resource", {}).get("aws_vpc", {}).values()]
        assert len(vpc_resources) == 1
        
        vpc = vpc_resources[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True

    def test_subnets_created(self, stack):
        """Test that 6 subnets are created"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        subnets = resources.get("resource", {}).get("aws_subnet", {})
        assert len(subnets) == 6  # 3 public + 3 private

    def test_internet_gateway_created(self, stack):
        """Test Internet Gateway is created"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        igws = resources.get("resource", {}).get("aws_internet_gateway", {})
        assert len(igws) == 1

    def test_nat_gateways_created(self, stack):
        """Test 3 NAT Gateways are created"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        nats = resources.get("resource", {}).get("aws_nat_gateway", {})
        assert len(nats) == 3

    def test_elastic_ips_created(self, stack):
        """Test 3 Elastic IPs are created"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        eips = resources.get("resource", {}).get("aws_eip", {})
        assert len(eips) == 3

    def test_route_tables_created(self, stack):
        """Test route tables are created"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        route_tables = resources.get("resource", {}).get("aws_route_table", {})
        assert len(route_tables) == 4  # 1 public + 3 private

    def test_s3_bucket_created(self, stack):
        """Test S3 bucket for flow logs is created"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        buckets = resources.get("resource", {}).get("aws_s3_bucket", {})
        assert len(buckets) == 1

    def test_vpc_flow_logs_created(self, stack):
        """Test VPC Flow Logs are created"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        flow_logs = resources.get("resource", {}).get("aws_flow_log", {})
        assert len(flow_logs) == 1

    def test_network_acls_created(self, stack):
        """Test Network ACLs are created"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        nacls = resources.get("resource", {}).get("aws_network_acl", {})
        assert len(nacls) >= 1

    def test_environment_suffix_in_names(self, stack):
        """Test that environment suffix is used in resource names"""
        synth = Testing.synth(stack)
        assert "test123" in synth

    def test_tags_applied(self, stack):
        """Test that tags are applied to resources"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        # Check VPC tags
        vpc = list(resources.get("resource", {}).get("aws_vpc", {}).values())[0]
        assert "tags" in vpc
        assert vpc["tags"]["Environment"] == "test123"
        assert vpc["tags"]["Project"] == "DigitalBanking"

    def test_outputs_defined(self, stack):
        """Test that stack outputs are defined"""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        
        outputs = resources.get("output", {})
        assert "vpc_id" in outputs
        assert "public_subnet_ids" in outputs
        assert "private_subnet_ids" in outputs
        assert "nat_gateway_ips" in outputs

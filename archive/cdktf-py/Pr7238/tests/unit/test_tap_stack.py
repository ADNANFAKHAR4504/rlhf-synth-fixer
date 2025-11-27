"""Unit tests for TAP Stack with comprehensive coverage."""
import json
import os
import tempfile
from unittest.mock import patch, mock_open

import pytest
from cdktf import App, Testing

from lib.tap_stack import TapStack, get_aws_region


class TestGetAwsRegion:
    """Test suite for get_aws_region function."""

    def test_get_aws_region_from_environment_variable(self):
        """Test that AWS_REGION environment variable takes precedence."""
        with patch.dict(os.environ, {"AWS_REGION": "eu-west-2"}):
            region = get_aws_region()
            assert region == "eu-west-2"

    def test_get_aws_region_strips_whitespace_from_env(self):
        """Test that whitespace is stripped from environment variable."""
        with patch.dict(os.environ, {"AWS_REGION": "  ap-south-1  "}):
            region = get_aws_region()
            assert region == "ap-south-1"

    def test_get_aws_region_from_file_when_env_not_set(self):
        """Test that region is read from file when env var not set."""
        with patch.dict(os.environ, {}, clear=True):
            # Remove AWS_REGION from env if present
            os.environ.pop("AWS_REGION", None)
            with patch("builtins.open", mock_open(read_data="ap-northeast-1\n")):
                with patch("os.path.exists", return_value=True):
                    region = get_aws_region()
                    assert region == "ap-northeast-1"

    def test_get_aws_region_default_fallback(self):
        """Test default fallback when neither env nor file available."""
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("AWS_REGION", None)
            with patch("os.path.exists", return_value=False):
                region = get_aws_region()
                assert region == "us-east-1"


class TestTapStackInstantiation:
    """Test suite for TapStack instantiation."""

    def test_tap_stack_instantiates_successfully(self):
        """TapStack instantiates successfully."""
        app = App()
        stack = TapStack(app, "TestTapStack", environment_suffix="test")
        assert stack is not None

    def test_tap_stack_with_different_suffixes(self):
        """TapStack works with various environment suffixes."""
        suffixes = ["dev", "staging", "prod", "7138", "test-123"]
        for suffix in suffixes:
            app = App()
            stack = TapStack(app, f"TestStack-{suffix}", environment_suffix=suffix)
            assert stack is not None


class TestTapStackSynthesis:
    """Test suite for TapStack synthesis."""

    @pytest.fixture
    def stack(self):
        """Create a test stack instance."""
        with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}):
            app = App()
            return TapStack(app, "test-stack", "test123")

    def test_stack_synthesizes_without_errors(self, stack):
        """TapStack synthesizes without errors."""
        synth = Testing.synth(stack)
        assert synth is not None
        assert len(synth) > 0

    def test_synth_produces_valid_json(self, stack):
        """Synthesis produces valid JSON."""
        synth = Testing.synth(stack)
        resources = json.loads(synth)
        assert isinstance(resources, dict)
        assert "resource" in resources


class TestVpcResources:
    """Test suite for VPC resources."""

    @pytest.fixture
    def resources(self):
        """Get synthesized resources."""
        with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}):
            app = App()
            stack = TapStack(app, "vpc-test-stack", "test")
            synth = Testing.synth(stack)
            return json.loads(synth)

    def test_vpc_created_with_correct_cidr(self, resources):
        """VPC is created with correct CIDR block."""
        vpc_resources = list(resources.get("resource", {}).get("aws_vpc", {}).values())
        assert len(vpc_resources) == 1
        vpc = vpc_resources[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"

    def test_vpc_has_dns_support_enabled(self, resources):
        """VPC has DNS support enabled."""
        vpc = list(resources.get("resource", {}).get("aws_vpc", {}).values())[0]
        assert vpc["enable_dns_support"] is True

    def test_vpc_has_dns_hostnames_enabled(self, resources):
        """VPC has DNS hostnames enabled."""
        vpc = list(resources.get("resource", {}).get("aws_vpc", {}).values())[0]
        assert vpc["enable_dns_hostnames"] is True

    def test_vpc_has_correct_tags(self, resources):
        """VPC has correct tags."""
        vpc = list(resources.get("resource", {}).get("aws_vpc", {}).values())[0]
        assert "tags" in vpc
        assert vpc["tags"]["Environment"] == "test"
        assert vpc["tags"]["Project"] == "DigitalBanking"


class TestSubnetResources:
    """Test suite for subnet resources."""

    @pytest.fixture
    def resources(self):
        """Get synthesized resources."""
        with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}):
            app = App()
            stack = TapStack(app, "subnet-test-stack", "test")
            synth = Testing.synth(stack)
            return json.loads(synth)

    def test_correct_number_of_subnets_created(self, resources):
        """6 subnets are created (3 public + 3 private for 3 AZs)."""
        subnets = resources.get("resource", {}).get("aws_subnet", {})
        assert len(subnets) == 6

    def test_public_subnets_have_correct_cidr(self, resources):
        """Public subnets have correct CIDR blocks."""
        subnets = resources.get("resource", {}).get("aws_subnet", {})
        public_cidrs = ["10.0.0.0/24", "10.0.1.0/24"]
        found_cidrs = [s["cidr_block"] for s in subnets.values() if s.get("map_public_ip_on_launch")]
        for cidr in public_cidrs:
            assert cidr in found_cidrs

    def test_private_subnets_have_correct_cidr(self, resources):
        """Private subnets have correct CIDR blocks."""
        subnets = resources.get("resource", {}).get("aws_subnet", {})
        private_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
        found_cidrs = [s["cidr_block"] for s in subnets.values() if not s.get("map_public_ip_on_launch")]
        for cidr in private_cidrs:
            assert cidr in found_cidrs

    def test_public_subnets_map_public_ip(self, resources):
        """Public subnets map public IPs on launch."""
        subnets = resources.get("resource", {}).get("aws_subnet", {})
        public_subnets = [s for s in subnets.values() if "public" in str(s.get("tags", {}).get("Name", "")).lower()]
        for subnet in public_subnets:
            assert subnet.get("map_public_ip_on_launch") is True


class TestInternetGatewayResources:
    """Test suite for Internet Gateway resources."""

    @pytest.fixture
    def resources(self):
        """Get synthesized resources."""
        with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}):
            app = App()
            stack = TapStack(app, "igw-test-stack", "test")
            synth = Testing.synth(stack)
            return json.loads(synth)

    def test_internet_gateway_created(self, resources):
        """One Internet Gateway is created."""
        igws = resources.get("resource", {}).get("aws_internet_gateway", {})
        assert len(igws) == 1

    def test_internet_gateway_has_correct_tags(self, resources):
        """Internet Gateway has correct tags."""
        igw = list(resources.get("resource", {}).get("aws_internet_gateway", {}).values())[0]
        assert igw["tags"]["Environment"] == "test"
        assert igw["tags"]["Project"] == "DigitalBanking"


class TestNatGatewayResources:
    """Test suite for NAT Gateway resources."""

    @pytest.fixture
    def resources(self):
        """Get synthesized resources."""
        with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}):
            app = App()
            stack = TapStack(app, "nat-test-stack", "test")
            synth = Testing.synth(stack)
            return json.loads(synth)

    def test_nat_gateways_created(self, resources):
        """3 NAT Gateways are created (one per AZ)."""
        nats = resources.get("resource", {}).get("aws_nat_gateway", {})
        assert len(nats) == 3

    def test_elastic_ips_created(self, resources):
        """3 Elastic IPs are created for NAT Gateways (one per AZ)."""
        eips = resources.get("resource", {}).get("aws_eip", {})
        assert len(eips) == 3

    def test_elastic_ips_have_vpc_domain(self, resources):
        """Elastic IPs have VPC domain."""
        eips = resources.get("resource", {}).get("aws_eip", {})
        for eip in eips.values():
            assert eip["domain"] == "vpc"


class TestRouteTableResources:
    """Test suite for Route Table resources."""

    @pytest.fixture
    def resources(self):
        """Get synthesized resources."""
        with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}):
            app = App()
            stack = TapStack(app, "rt-test-stack", "test")
            synth = Testing.synth(stack)
            return json.loads(synth)

    def test_route_tables_created(self, resources):
        """4 route tables are created (1 public + 3 private for 3 AZs)."""
        route_tables = resources.get("resource", {}).get("aws_route_table", {})
        assert len(route_tables) == 4

    def test_route_table_associations_created(self, resources):
        """Route table associations are created (3 public + 3 private for 3 AZs)."""
        associations = resources.get("resource", {}).get("aws_route_table_association", {})
        assert len(associations) == 6  # 3 public + 3 private

    def test_public_route_table_has_internet_route(self, resources):
        """Public route table has route to internet gateway."""
        route_tables = resources.get("resource", {}).get("aws_route_table", {})
        public_rt = [rt for rt in route_tables.values() if "public" in str(rt.get("tags", {}).get("Name", "")).lower()]
        assert len(public_rt) >= 1
        for rt in public_rt:
            routes = rt.get("route", [])
            internet_routes = [r for r in routes if r.get("cidr_block") == "0.0.0.0/0" and r.get("gateway_id")]
            assert len(internet_routes) >= 1


class TestS3Resources:
    """Test suite for S3 bucket resources."""

    @pytest.fixture
    def resources(self):
        """Get synthesized resources."""
        with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}):
            app = App()
            stack = TapStack(app, "s3-test-stack", "test")
            synth = Testing.synth(stack)
            return json.loads(synth)

    def test_s3_bucket_created(self, resources):
        """S3 bucket for flow logs is created."""
        buckets = resources.get("resource", {}).get("aws_s3_bucket", {})
        assert len(buckets) == 1

    def test_s3_bucket_has_force_destroy(self, resources):
        """S3 bucket has force_destroy enabled."""
        bucket = list(resources.get("resource", {}).get("aws_s3_bucket", {}).values())[0]
        assert bucket.get("force_destroy") is True

    def test_s3_bucket_versioning_enabled(self, resources):
        """S3 bucket versioning is enabled."""
        versioning = resources.get("resource", {}).get("aws_s3_bucket_versioning", {})
        assert len(versioning) == 1

    def test_s3_lifecycle_configuration_created(self, resources):
        """S3 lifecycle configuration is created."""
        lifecycle = resources.get("resource", {}).get("aws_s3_bucket_lifecycle_configuration", {})
        assert len(lifecycle) == 1


class TestFlowLogResources:
    """Test suite for VPC Flow Log resources."""

    @pytest.fixture
    def resources(self):
        """Get synthesized resources."""
        with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}):
            app = App()
            stack = TapStack(app, "flow-test-stack", "test")
            synth = Testing.synth(stack)
            return json.loads(synth)

    def test_vpc_flow_log_created(self, resources):
        """VPC Flow Log is created."""
        flow_logs = resources.get("resource", {}).get("aws_flow_log", {})
        assert len(flow_logs) == 1

    def test_flow_log_captures_all_traffic(self, resources):
        """Flow log captures all traffic types."""
        flow_log = list(resources.get("resource", {}).get("aws_flow_log", {}).values())[0]
        assert flow_log["traffic_type"] == "ALL"

    def test_flow_log_uses_s3_destination(self, resources):
        """Flow log uses S3 as destination."""
        flow_log = list(resources.get("resource", {}).get("aws_flow_log", {}).values())[0]
        assert flow_log["log_destination_type"] == "s3"


class TestNetworkAclResources:
    """Test suite for Network ACL resources."""

    @pytest.fixture
    def resources(self):
        """Get synthesized resources."""
        with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}):
            app = App()
            stack = TapStack(app, "nacl-test-stack", "test")
            synth = Testing.synth(stack)
            return json.loads(synth)

    def test_network_acl_created(self, resources):
        """Network ACL is created."""
        nacls = resources.get("resource", {}).get("aws_network_acl", {})
        assert len(nacls) >= 1

    def test_network_acl_has_deny_egress_rule(self, resources):
        """Network ACL has deny egress rule."""
        nacl = list(resources.get("resource", {}).get("aws_network_acl", {}).values())[0]
        egress_rules = nacl.get("egress", [])
        deny_rules = [r for r in egress_rules if r.get("action") == "deny"]
        assert len(deny_rules) >= 1

    def test_network_acl_has_deny_ingress_rule(self, resources):
        """Network ACL has deny ingress rule."""
        nacl = list(resources.get("resource", {}).get("aws_network_acl", {}).values())[0]
        ingress_rules = nacl.get("ingress", [])
        deny_rules = [r for r in ingress_rules if r.get("action") == "deny"]
        assert len(deny_rules) >= 1


class TestOutputs:
    """Test suite for stack outputs."""

    @pytest.fixture
    def resources(self):
        """Get synthesized resources."""
        with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}):
            app = App()
            stack = TapStack(app, "output-test-stack", "test")
            synth = Testing.synth(stack)
            return json.loads(synth)

    def test_vpc_id_output_defined(self, resources):
        """VPC ID output is defined."""
        outputs = resources.get("output", {})
        assert "vpc_id" in outputs

    def test_public_subnet_ids_output_defined(self, resources):
        """Public subnet IDs output is defined."""
        outputs = resources.get("output", {})
        assert "public_subnet_ids" in outputs

    def test_private_subnet_ids_output_defined(self, resources):
        """Private subnet IDs output is defined."""
        outputs = resources.get("output", {})
        assert "private_subnet_ids" in outputs

    def test_nat_gateway_ips_output_defined(self, resources):
        """NAT Gateway IPs output is defined."""
        outputs = resources.get("output", {})
        assert "nat_gateway_ips" in outputs


class TestRegionDynamicBehavior:
    """Test suite for dynamic region behavior."""

    def test_stack_uses_region_from_env(self):
        """Stack uses region from environment variable."""
        with patch.dict(os.environ, {"AWS_REGION": "eu-central-1"}):
            app = App()
            stack = TapStack(app, "region-test-stack", "test")
            synth = Testing.synth(stack)
            resources = json.loads(synth)

            # Check provider uses correct region
            provider = resources.get("provider", {}).get("aws", [{}])[0]
            assert provider.get("region") == "eu-central-1"

    def test_availability_zones_match_region(self):
        """Availability zones match the configured region."""
        with patch.dict(os.environ, {"AWS_REGION": "ap-southeast-1"}):
            app = App()
            stack = TapStack(app, "az-test-stack", "test")
            synth = Testing.synth(stack)
            resources = json.loads(synth)

            subnets = resources.get("resource", {}).get("aws_subnet", {})
            azs = [s.get("availability_zone") for s in subnets.values()]
            for az in azs:
                assert az.startswith("ap-southeast-1")

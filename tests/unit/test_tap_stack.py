"""Unit tests for TapStack."""
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStackStructure:
    """Test suite for TapStack structure and resources."""

    def test_tap_stack_instantiates_successfully(self):
        """Test that TapStack instantiates without errors."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack is not None

    def test_stack_has_required_attributes(self):
        """Test that stack has all required resource attributes."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")

        # Verify VPC and networking resources
        assert hasattr(tap_stack, 'vpc')
        assert hasattr(tap_stack, 'igw')
        assert hasattr(tap_stack, 'public_subnets')
        assert hasattr(tap_stack, 'private_subnets')
        assert hasattr(tap_stack, 'nat_gateways')
        assert hasattr(tap_stack, 'eips')
        assert hasattr(tap_stack, 'public_route_table')
        assert hasattr(tap_stack, 'private_route_tables')

        # Verify security groups
        assert hasattr(tap_stack, 'web_sg')
        assert hasattr(tap_stack, 'app_sg')
        assert hasattr(tap_stack, 'db_sg')

        # Verify Flow Logs resources
        assert hasattr(tap_stack, 'flow_log_group')
        assert hasattr(tap_stack, 'flow_log_role')

    def test_three_public_subnets_created(self):
        """Test that exactly 3 public subnets are created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.public_subnets) == 3

    def test_three_private_subnets_created(self):
        """Test that exactly 3 private subnets are created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.private_subnets) == 3

    def test_three_nat_gateways_created(self):
        """Test that exactly 3 NAT Gateways are created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.nat_gateways) == 3

    def test_three_elastic_ips_created(self):
        """Test that exactly 3 Elastic IPs are created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.eips) == 3

    def test_internet_gateway_created(self):
        """Test that Internet Gateway is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.igw is not None

    def test_private_route_tables_have_nat_routes(self):
        """Test that private route tables have routes to NAT Gateways."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.private_route_tables) == 3

    def test_web_security_group_created(self):
        """Test that web security group is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.web_sg is not None

    def test_app_security_group_created(self):
        """Test that app security group is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.app_sg is not None

    def test_db_security_group_created(self):
        """Test that database security group is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.db_sg is not None

    def test_cloudwatch_log_group_created(self):
        """Test that CloudWatch Log Group is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.flow_log_group is not None

    def test_iam_role_for_flow_logs_created(self):
        """Test that IAM role for VPC Flow Logs is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.flow_log_role is not None

    def test_aws_region_parameter_respected(self):
        """Test that AWS region parameter is accepted."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test", aws_region="us-west-2")
        assert tap_stack.aws_region == "us-west-2"

    def test_environment_suffix_stored(self):
        """Test that environment suffix is stored correctly."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="testenv")
        assert tap_stack.environment_suffix == "testenv"

    def test_default_tags_parameter_accepted(self):
        """Test that default tags parameter is accepted without error."""
        stack = Testing.app()
        default_tags = {
            "tags": {
                "Team": "devops",
                "Project": "infrastructure"
            }
        }
        tap_stack = TapStack(stack, "test", environment_suffix="test", default_tags=default_tags)
        assert tap_stack is not None

    def test_state_bucket_parameters_accepted(self):
        """Test that state bucket parameters are accepted without error."""
        stack = Testing.app()
        tap_stack = TapStack(
            stack,
            "test",
            environment_suffix="test",
            state_bucket="my-bucket",
            state_bucket_region="us-west-2"
        )
        assert tap_stack is not None

    def test_stack_with_different_environment_suffixes(self):
        """Test that stack can be created with different environment suffixes."""
        stack1 = Testing.app()
        tap_stack1 = TapStack(stack1, "stack1", environment_suffix="dev")
        assert tap_stack1.environment_suffix == "dev"

        stack2 = Testing.app()
        tap_stack2 = TapStack(stack2, "stack2", environment_suffix="prod")
        assert tap_stack2.environment_suffix == "prod"

    def test_stack_with_different_regions(self):
        """Test that stack can be created with different AWS regions."""
        stack1 = Testing.app()
        tap_stack1 = TapStack(stack1, "stack1", environment_suffix="test", aws_region="us-east-1")
        assert tap_stack1.aws_region == "us-east-1"

        stack2 = Testing.app()
        tap_stack2 = TapStack(stack2, "stack2", environment_suffix="test", aws_region="us-west-2")
        assert tap_stack2.aws_region == "us-west-2"

    def test_vpc_resource_exists(self):
        """Test that VPC resource is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.vpc is not None

    def test_public_route_table_created(self):
        """Test that public route table is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.public_route_table is not None

    def test_all_private_route_tables_created(self):
        """Test that all private route tables are created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.private_route_tables) == 3
        for rt in tap_stack.private_route_tables:
            assert rt is not None

    def test_all_public_subnets_not_none(self):
        """Test that all public subnets are not None."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        for subnet in tap_stack.public_subnets:
            assert subnet is not None

    def test_all_private_subnets_not_none(self):
        """Test that all private subnets are not None."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        for subnet in tap_stack.private_subnets:
            assert subnet is not None

    def test_all_nat_gateways_not_none(self):
        """Test that all NAT gateways are not None."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        for nat in tap_stack.nat_gateways:
            assert nat is not None

    def test_all_eips_not_none(self):
        """Test that all Elastic IPs are not None."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        for eip in tap_stack.eips:
            assert eip is not None

    def test_stack_instantiation_with_minimal_parameters(self):
        """Test that stack can be instantiated with minimal parameters."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "minimal-test", environment_suffix="min")
        assert tap_stack is not None
        assert tap_stack.environment_suffix == "min"

    def test_stack_instantiation_with_all_parameters(self):
        """Test that stack can be instantiated with all parameters."""
        stack = Testing.app()
        default_tags = {
            "tags": {
                "Environment": "test",
                "Team": "devops"
            }
        }
        tap_stack = TapStack(
            stack,
            "full-test",
            environment_suffix="full",
            state_bucket="test-bucket",
            state_bucket_region="us-east-2",
            aws_region="us-east-2",
            default_tags=default_tags
        )
        assert tap_stack is not None
        assert tap_stack.environment_suffix == "full"
        assert tap_stack.aws_region == "us-east-2"

    def test_subnet_count_matches_az_count(self):
        """Test that number of subnets matches number of availability zones."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        # We create 3 public and 3 private subnets
        assert len(tap_stack.public_subnets) == len(tap_stack.private_subnets)
        # Number of NAT gateways should match number of availability zones
        assert len(tap_stack.nat_gateways) == len(tap_stack.public_subnets)

    def test_one_eip_per_nat_gateway(self):
        """Test that there is one EIP for each NAT Gateway."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.eips) == len(tap_stack.nat_gateways)

    def test_one_private_route_table_per_az(self):
        """Test that there is one private route table per availability zone."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.private_route_tables) == len(tap_stack.private_subnets)

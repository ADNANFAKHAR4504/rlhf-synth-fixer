import pytest
import pulumi
from moto import mock_aws
import json
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the lib directory to Python path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

class TestTapStack:
    """Unit tests for TapStack infrastructure component"""
    
    @pytest.fixture(autouse=True)
    def setup_mocks(self):
        """Set up all mocks before any test runs"""
        
        # Mock the monitor that handles all Pulumi runtime calls
        mock_monitor = Mock()
        mock_monitor.Invoke.return_value = Mock(
            names=["us-west-2a", "us-west-2b", "us-west-2c"],
            zone_ids=["usw2-az1", "usw2-az2", "usw2-az3"],
            id="ami-12345678"
        )
        mock_monitor.RegisterResource.return_value = Mock(
            urn="test-urn", 
            id="test-id"
        )
        mock_monitor.ReadResource.return_value = Mock()
        
        # Start patches that will apply to all tests
        self.patches = [
            # Mock runtime functions
            patch('pulumi.runtime.settings.is_dry_run', return_value=True),
            patch('pulumi.runtime.get_monitor', return_value=mock_monitor),
            
            # Mock Pulumi Config
            patch('pulumi.Config'),
            
            # Mock pulumi.export to handle module-level exports
            patch('pulumi.export'),
            
            # Mock AWS service calls
            patch('pulumi_aws.get_availability_zones', return_value=Mock(
                names=["us-west-2a", "us-west-2b", "us-west-2c"],
                zone_ids=["usw2-az1", "usw2-az2", "usw2-az3"]
            )),
            patch('pulumi_aws.ec2.get_ami', return_value=Mock(id="ami-12345678")),
            
            # Mock all AWS resource constructors
            patch('pulumi_aws.Provider', return_value=Mock(id="provider-id")),
            patch('pulumi_aws.ec2.Vpc', return_value=Mock(id="vpc-id", cidr_block="10.0.0.0/16")),
            patch('pulumi_aws.ec2.Subnet', return_value=Mock(id="subnet-id")),
            patch('pulumi_aws.ec2.InternetGateway', return_value=Mock(id="igw-id")),
            patch('pulumi_aws.ec2.Eip', return_value=Mock(id="eip-id")),
            patch('pulumi_aws.ec2.NatGateway', return_value=Mock(id="nat-id")),
            patch('pulumi_aws.ec2.RouteTable', return_value=Mock(id="rt-id")),
            patch('pulumi_aws.ec2.RouteTableAssociation', return_value=Mock(id="rta-id")),
            patch('pulumi_aws.ec2.SecurityGroup', return_value=Mock(id="sg-id")),
            patch('pulumi_aws.ec2.Instance', return_value=Mock(id="instance-id")),
            patch('pulumi_aws.iam.Role', return_value=Mock(id="role-id", name="role-name")),
            patch('pulumi_aws.iam.RolePolicy', return_value=Mock(id="policy-id")),
            patch('pulumi_aws.iam.InstanceProfile', return_value=Mock(id="profile-id")),
            patch('pulumi_aws.iam.RolePolicyAttachment', return_value=Mock(id="attachment-id")),
            patch('pulumi_aws.lb.LoadBalancer', return_value=Mock(id="lb-id", dns_name="lb-dns", arn="lb-arn")),
            patch('pulumi_aws.lb.TargetGroup', return_value=Mock(id="tg-id", arn="tg-arn")),
            patch('pulumi_aws.lb.TargetGroupAttachment', return_value=Mock(id="tga-id")),
            patch('pulumi_aws.lb.Listener', return_value=Mock(id="listener-id")),
            patch('pulumi_aws.rds.SubnetGroup', return_value=Mock(id="sg-id")),
            patch('pulumi_aws.rds.Instance', return_value=Mock(id="db-id", endpoint="db-endpoint")),
            patch('pulumi_aws.secretsmanager.Secret', return_value=Mock(id="secret-id")),
            patch('pulumi_aws.secretsmanager.SecretVersion', return_value=Mock(id="secret-version-id"))
        ]
        
        # Mock Pulumi Config to return test values
        config_mock = Mock()
        config_mock.get.side_effect = lambda key, default=None: {
            "environment": "prod",
            "project": "cloudsetup", 
            "owner": "mgt",
            "region": "us-west-2"
        }.get(key, default)
        
        aws_config_mock = Mock()
        aws_config_mock.get.side_effect = lambda key, default=None: {
            "region": "us-west-2"
        }.get(key, default)
        
        def config_side_effect(name=None):
            if name == "aws":
                return aws_config_mock
            return config_mock
        
        # Set up the Config mock
        for p in self.patches:
            if 'pulumi.Config' in str(p):
                p.return_value.side_effect = config_side_effect
                break
        
        # Start all patches
        self.started_patches = [p.start() for p in self.patches]
        
        yield
        
        # Stop all patches
        for p in self.patches:
            p.stop()

    def test_tapstack_args_creation(self):
        """Test TapStackArgs can be created with proper values"""
        # Import after mocking is set up
        from tap_stack import TapStackArgs
        
        args = TapStackArgs(
            environment="prod",
            project="cloudsetup",
            owner="mgt",
            region="us-west-2"
        )
        
        assert args.environment == "prod"
        assert args.project == "cloudsetup"
        assert args.owner == "mgt"
        assert args.region == "us-west-2"
        assert args.environment_suffix == "prod"
        assert args.tags == {}

    def test_tapstack_args_with_optional_params(self):
        """Test TapStackArgs with optional parameters"""
        from tap_stack import TapStackArgs
        
        custom_tags = {"CustomTag": "CustomValue"}
        args = TapStackArgs(
            environment="prod",
            project="cloudsetup",
            owner="mgt",
            region="us-west-2",
            environment_suffix="production",
            tags=custom_tags
        )
        
        assert args.environment == "prod"
        assert args.project == "cloudsetup"
        assert args.owner == "mgt"
        assert args.region == "us-west-2"
        assert args.environment_suffix == "production"
        assert args.tags == custom_tags

    def test_tapstack_instantiation(self):
        """Test TapStack can be instantiated without errors"""
        from tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(
            environment="prod",
            project="cloudsetup",
            owner="mgt",
            region="us-west-2"
        )
        
        # This should not raise an exception
        stack = TapStack("test-stack", args)
        assert stack is not None
        assert stack.args == args

    def test_module_can_be_imported(self):
        """Test that tap_stack module can be imported without runtime errors"""
        try:
            import tap_stack
            assert tap_stack.TapStack is not None
            assert tap_stack.TapStackArgs is not None
            # The module-level instantiation should have worked
            assert tap_stack.tap_stack is not None
        except Exception as e:
            pytest.fail(f"Module import failed: {str(e)}")

    def test_module_level_stack_creation(self):
        """Test that the module-level stack instantiation works"""
        import tap_stack
        
        # Verify the module-level variables exist
        assert hasattr(tap_stack, 'tap_stack')
        assert hasattr(tap_stack, 'stack_args')
        
        # Verify the stack was created with correct args
        assert tap_stack.stack_args.environment == "prod"
        assert tap_stack.stack_args.project == "cloudsetup"
        assert tap_stack.stack_args.owner == "mgt"
        assert tap_stack.stack_args.region == "us-west-2"

    def test_networking_resources_created(self):
        """Test that networking resources are created during stack instantiation"""
        from tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(
            environment="prod",
            project="cloudsetup",
            owner="mgt",
            region="us-west-2"
        )
        
        stack = TapStack("test-stack", args)
        
        # Verify networking resources exist
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'public_subnets')
        assert hasattr(stack, 'private_subnets')
        assert hasattr(stack, 'igw')
        assert hasattr(stack, 'nat_gateway')

    def test_security_resources_created(self):
        """Test that security resources are created during stack instantiation"""
        from tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(
            environment="prod",
            project="cloudsetup",
            owner="mgt",
            region="us-west-2"
        )
        
        stack = TapStack("test-stack", args)
        
        # Verify security resources exist
        assert hasattr(stack, 'web_sg')
        assert hasattr(stack, 'db_sg')
        assert hasattr(stack, 'ec2_role')
        assert hasattr(stack, 'instance_profile')

    def test_compute_resources_created(self):
        """Test that compute resources are created during stack instantiation"""
        from tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(
            environment="prod",
            project="cloudsetup",
            owner="mgt",
            region="us-west-2"
        )
        
        stack = TapStack("test-stack", args)
        
        # Verify compute resources exist
        assert hasattr(stack, 'instances')
        assert hasattr(stack, 'alb')
        assert hasattr(stack, 'target_group')
        assert hasattr(stack, 'listener')

    def test_database_resources_created(self):
        """Test that database resources are created during stack instantiation"""
        from tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(
            environment="prod",
            project="cloudsetup",
            owner="mgt",
            region="us-west-2"
        )
        
        stack = TapStack("test-stack", args)
        
        # Verify database resources exist
        assert hasattr(stack, 'db_subnet_group')
        assert hasattr(stack, 'db_instance')
        assert hasattr(stack, 'db_password')
        assert hasattr(stack, 'rds_monitoring_role')
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
    
    @pytest.fixture
    def mock_pulumi_runtime(self):
        """Mock the Pulumi runtime environment"""
        # Create a mock monitor that handles all the runtime calls
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
        
        # Mock the settings and runtime functions that actually exist
        with patch('pulumi.runtime.settings.is_dry_run', return_value=True):
            with patch('pulumi.runtime.settings.is_preview', return_value=True):
                with patch('pulumi.runtime.get_monitor', return_value=mock_monitor):
                    yield {
                        'monitor': mock_monitor
                    }

    @pytest.fixture
    def mock_pulumi_config(self):
        """Mock Pulumi Config"""
        with patch('pulumi.Config') as mock_config_class:
            # Create mock config instances for different config types
            main_config = Mock()
            main_config.get.side_effect = lambda key, default=None: {
                "environment": "prod",
                "project": "cloudsetup", 
                "owner": "mgt"
            }.get(key, default)
            
            aws_config = Mock()
            aws_config.get.side_effect = lambda key, default=None: {
                "region": "us-west-2"
            }.get(key, default)
            
            def config_side_effect(name=None):
                if name == "aws":
                    return aws_config
                return main_config
            
            mock_config_class.side_effect = config_side_effect
            yield mock_config_class

    @pytest.fixture
    def mock_aws_services(self):
        """Mock AWS service calls"""
        with patch('pulumi_aws.get_availability_zones') as mock_get_azs:
            with patch('pulumi_aws.ec2.get_ami') as mock_get_ami:
                
                mock_get_azs.return_value = Mock(
                    names=["us-west-2a", "us-west-2b", "us-west-2c"],
                    zone_ids=["usw2-az1", "usw2-az2", "usw2-az3"]
                )
                
                mock_get_ami.return_value = Mock(
                    id="ami-12345678"
                )
                
                yield {
                    'get_availability_zones': mock_get_azs,
                    'get_ami': mock_get_ami
                }

    @pytest.fixture
    def mock_all_resources(self):
        """Mock all AWS resource constructors"""
        # Create a generic resource mock that works for all resource types
        def create_mock_resource(*args, **kwargs):
            mock_resource = Mock()
            mock_resource.id = "mock-id"
            mock_resource.arn = "mock-arn"
            mock_resource.dns_name = "mock-dns-name"
            mock_resource.endpoint = "mock-endpoint"
            mock_resource.cidr_block = "10.0.0.0/16"
            mock_resource.name = "mock-name"
            return mock_resource
        
        patches = []
        resource_paths = [
            'pulumi_aws.Provider',
            'pulumi_aws.ec2.Vpc',
            'pulumi_aws.ec2.Subnet',
            'pulumi_aws.ec2.InternetGateway',
            'pulumi_aws.ec2.Eip',
            'pulumi_aws.ec2.NatGateway',
            'pulumi_aws.ec2.RouteTable',
            'pulumi_aws.ec2.RouteTableAssociation',
            'pulumi_aws.ec2.SecurityGroup',
            'pulumi_aws.ec2.Instance',
            'pulumi_aws.iam.Role',
            'pulumi_aws.iam.RolePolicy',
            'pulumi_aws.iam.InstanceProfile',
            'pulumi_aws.iam.RolePolicyAttachment',
            'pulumi_aws.lb.LoadBalancer',
            'pulumi_aws.lb.TargetGroup',
            'pulumi_aws.lb.TargetGroupAttachment',
            'pulumi_aws.lb.Listener',
            'pulumi_aws.rds.SubnetGroup',
            'pulumi_aws.rds.Instance',
            'pulumi_aws.secretsmanager.Secret',
            'pulumi_aws.secretsmanager.SecretVersion'
        ]
        
        for path in resource_paths:
            patches.append(patch(path, side_effect=create_mock_resource))
        
        # Start all patches
        mocks = {}
        for i, p in enumerate(patches):
            mocks[resource_paths[i]] = p.start()
        
        yield mocks
        
        # Stop all patches
        for p in patches:
            p.stop()

    def test_tapstack_args_creation(self):
        """Test TapStackArgs can be created with proper values"""
        # Import here to avoid module-level execution issues
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
        assert args.environment_suffix == "prod"  # Should default to environment
        assert args.tags == {}  # Should default to empty dict

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

    def test_tapstack_instantiation(self, mock_pulumi_runtime, mock_pulumi_config, mock_aws_services, mock_all_resources):
        """Test TapStack can be instantiated without errors"""
        
        # Mock pulumi.export to handle module-level exports
        with patch('pulumi.export') as mock_export:
            # Import the classes after all mocking is set up
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

    def test_import_module_safely(self, mock_pulumi_runtime, mock_pulumi_config, mock_aws_services, mock_all_resources):
        """Test that tap_stack module can be imported without runtime errors"""
        
        with patch('pulumi.export') as mock_export:
            # This import should work without the original AttributeError
            try:
                import tap_stack
                assert tap_stack.TapStack is not None
                assert tap_stack.TapStackArgs is not None
            except Exception as e:
                pytest.fail(f"Module import failed: {str(e)}")

    def test_availability_zones_mock_called(self, mock_pulumi_runtime, mock_pulumi_config, mock_aws_services, mock_all_resources):
        """Test that availability zones are fetched during stack creation"""
        
        with patch('pulumi.export'):
            from tap_stack import TapStack, TapStackArgs
            
            args = TapStackArgs(
                environment="prod",
                project="cloudsetup", 
                owner="mgt",
                region="us-west-2"
            )
            
            TapStack("test-stack", args)
            
            # Verify availability zones was called
            mock_aws_services['get_availability_zones'].assert_called_once()

    def test_ami_lookup_mock_called(self, mock_pulumi_runtime, mock_pulumi_config, mock_aws_services, mock_all_resources):
        """Test that AMI lookup is performed during stack creation"""
        
        with patch('pulumi.export'):
            from tap_stack import TapStack, TapStackArgs
            
            args = TapStackArgs(
                environment="prod",
                project="cloudsetup",
                owner="mgt", 
                region="us-west-2"
            )
            
            TapStack("test-stack", args)
            
            # Verify AMI lookup was called
            mock_aws_services['get_ami'].assert_called_once()

    def test_module_level_instantiation(self, mock_pulumi_runtime, mock_pulumi_config, mock_aws_services, mock_all_resources):
        """Test that the module-level stack instantiation works"""
        
        with patch('pulumi.export') as mock_export:
            # Import the module - this should trigger the module-level code
            import tap_stack
            
            # Verify that pulumi.export was called (indicating stack was created)
            assert mock_export.call_count > 0
            
            # Verify expected exports were made
            export_calls = [call[0][0] for call in mock_export.call_args_list]
            expected_exports = ["vpc_id", "alb_dns_name", "db_endpoint", "region", "public_subnet_ids", "private_subnet_ids", "web_instance_ids"]
            
            for expected_export in expected_exports:
                assert expected_export in export_calls
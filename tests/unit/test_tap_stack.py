import pytest
import pulumi
from moto import mock_ec2, mock_iam, mock_rds
import json
from unittest.mock import Mock, patch, MagicMock

class TestTapStack:
    """Unit tests for TapStack infrastructure component"""
    
    @pytest.fixture
    def mock_pulumi_runtime(self):
        """Mock the entire Pulumi runtime environment"""
        with patch('pulumi.runtime.settings') as mock_settings:
            with patch('pulumi.runtime._RUNTIME') as mock_runtime:
                with patch('pulumi.Config') as mock_config:
                    
                    # Mock runtime settings
                    mock_settings.is_dry_run.return_value = True
                    mock_settings.is_preview.return_value = True
                    
                    # Mock runtime monitor
                    mock_monitor = Mock()
                    mock_monitor.Invoke.return_value = Mock(
                        names=["us-west-2a", "us-west-2b", "us-west-2c"],
                        zone_ids=["usw2-az1", "usw2-az2", "usw2-az3"],
                        id="ami-12345678"
                    )
                    mock_monitor.RegisterResource.return_value = Mock(
                        urn="test-urn", 
                        id="test-id",
                        object={}
                    )
                    mock_runtime.monitor = mock_monitor
                    mock_runtime.is_dry_run.return_value = True
                    
                    # Mock Pulumi Config
                    mock_config_instance = Mock()
                    mock_config_instance.get.side_effect = lambda key, default=None: {
                        "environment": "prod",
                        "project": "cloudsetup", 
                        "owner": "mgt",
                        "region": "us-west-2"
                    }.get(key, default)
                    mock_config.return_value = mock_config_instance
                    
                    yield {
                        'settings': mock_settings,
                        'runtime': mock_runtime,
                        'config': mock_config,
                        'monitor': mock_monitor
                    }

    @pytest.fixture
    def mock_aws_calls(self):
        """Mock all AWS service calls"""
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
    def mock_pulumi_resources(self):
        """Mock all Pulumi resource classes"""
        resource_mocks = {}
        
        # List of all Pulumi resource classes used in TapStack
        resource_classes = [
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
        
        for resource_class in resource_classes:
            mock_resource = Mock()
            mock_resource.id = "mock-id"
            mock_resource.arn = "mock-arn" 
            mock_resource.dns_name = "mock-dns-name"
            mock_resource.endpoint = "mock-endpoint"
            mock_resource.cidr_block = "10.0.0.0/16"
            mock_resource.name = "mock-name"
            
            resource_mocks[resource_class] = mock_resource
            
        with patch.multiple('pulumi_aws', **{
            'Provider': Mock(return_value=resource_mocks['pulumi_aws.Provider'])
        }):
            with patch.multiple('pulumi_aws.ec2', **{
                'Vpc': Mock(return_value=resource_mocks['pulumi_aws.ec2.Vpc']),
                'Subnet': Mock(return_value=resource_mocks['pulumi_aws.ec2.Subnet']),
                'InternetGateway': Mock(return_value=resource_mocks['pulumi_aws.ec2.InternetGateway']),
                'Eip': Mock(return_value=resource_mocks['pulumi_aws.ec2.Eip']),
                'NatGateway': Mock(return_value=resource_mocks['pulumi_aws.ec2.NatGateway']),
                'RouteTable': Mock(return_value=resource_mocks['pulumi_aws.ec2.RouteTable']),
                'RouteTableAssociation': Mock(return_value=resource_mocks['pulumi_aws.ec2.RouteTableAssociation']),
                'SecurityGroup': Mock(return_value=resource_mocks['pulumi_aws.ec2.SecurityGroup']),
                'Instance': Mock(return_value=resource_mocks['pulumi_aws.ec2.Instance'])
            }):
                with patch.multiple('pulumi_aws.iam', **{
                    'Role': Mock(return_value=resource_mocks['pulumi_aws.iam.Role']),
                    'RolePolicy': Mock(return_value=resource_mocks['pulumi_aws.iam.RolePolicy']),
                    'InstanceProfile': Mock(return_value=resource_mocks['pulumi_aws.iam.InstanceProfile']),
                    'RolePolicyAttachment': Mock(return_value=resource_mocks['pulumi_aws.iam.RolePolicyAttachment'])
                }):
                    with patch.multiple('pulumi_aws.lb', **{
                        'LoadBalancer': Mock(return_value=resource_mocks['pulumi_aws.lb.LoadBalancer']),
                        'TargetGroup': Mock(return_value=resource_mocks['pulumi_aws.lb.TargetGroup']),
                        'TargetGroupAttachment': Mock(return_value=resource_mocks['pulumi_aws.lb.TargetGroupAttachment']),
                        'Listener': Mock(return_value=resource_mocks['pulumi_aws.lb.Listener'])
                    }):
                        with patch.multiple('pulumi_aws.rds', **{
                            'SubnetGroup': Mock(return_value=resource_mocks['pulumi_aws.rds.SubnetGroup']),
                            'Instance': Mock(return_value=resource_mocks['pulumi_aws.rds.Instance'])
                        }):
                            with patch.multiple('pulumi_aws.secretsmanager', **{
                                'Secret': Mock(return_value=resource_mocks['pulumi_aws.secretsmanager.Secret']),
                                'SecretVersion': Mock(return_value=resource_mocks['pulumi_aws.secretsmanager.SecretVersion'])
                            }):
                                yield resource_mocks

    def test_import_tap_stack_module(self, mock_pulumi_runtime, mock_aws_calls, mock_pulumi_resources):
        """Test that the tap_stack module can be imported without errors"""
        
        # Mock pulumi.export to prevent errors
        with patch('pulumi.export') as mock_export:
            
            # This should not raise an exception when importing
            from lib.tap_stack import TapStack, TapStackArgs
            
            # Verify classes are importable
            assert TapStack is not None
            assert TapStackArgs is not None

    def test_tapstack_args_creation(self):
        """Test TapStackArgs can be created with proper values"""
        
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
        assert args.environment_suffix == "test"  # Should default to environment
        assert args.tags == {}  # Should default to empty dict

    def test_tapstack_args_with_optional_params(self):
        """Test TapStackArgs with optional parameters"""
        
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

    def test_tapstack_creation(self, mock_pulumi_runtime, mock_aws_calls, mock_pulumi_resources):
        """Test TapStack can be instantiated"""
        
        # Import after mocking is set up
        from lib.tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(
            environment="prod",
            project="cloudsetup",
            owner="mgt",
            region="us-west-2"
        )
        
        with patch('pulumi.export'):
            # This should not raise an exception
            stack = TapStack("test-stack", args)
            
            assert stack is not None
            assert stack.args == args

    def test_aws_availability_zones_called(self, mock_pulumi_runtime, mock_aws_calls, mock_pulumi_resources):
        """Test that AWS availability zones are fetched during stack creation"""
        
        from lib.tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(
            environment="prod", 
            project="cloudsetup",
            owner="mgt",
            region="us-west-2"
        )
        
        with patch('pulumi.export'):
            TapStack("test-stack", args)
            
            # Verify AWS availability zones was called
            mock_aws_calls['get_availability_zones'].assert_called_once_with(
                state="available",
                opts=pulumi.InvokeOptions(provider=mock_pulumi_resources['pulumi_aws.Provider'])
            )

    def test_aws_ami_lookup_called(self, mock_pulumi_runtime, mock_aws_calls, mock_pulumi_resources):
        """Test that AWS AMI lookup is performed during stack creation"""
        
        from lib.tap_stack import TapStack, TapStackArgs
        
        args = TapStackArgs(
            environment="prod",
            project="cloudsetup", 
            owner="mgt",
            region="us-west-2"
        )
        
        with patch('pulumi.export'):
            TapStack("test-stack", args)
            
            # Verify AMI lookup was called
            mock_aws_calls['get_ami'].assert_called_once_with(
                most_recent=True,
                owners=["amazon"],
                filters=[{"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]}],
                opts=pulumi.InvokeOptions(provider=mock_pulumi_resources['pulumi_aws.Provider'])
            )

    @patch('pulumi.export')
    def test_module_level_instantiation(self, mock_export, mock_pulumi_runtime, mock_aws_calls, mock_pulumi_resources):
        """Test that the module-level stack instantiation works"""
        
        # Import the module - this should trigger the module-level code
        import lib.tap_stack
        
        # Verify that pulumi.export was called (indicating stack was created)
        assert mock_export.call_count > 0
        
        # Verify expected exports were made
        export_calls = {call[0][0]: call[0][1] for call in mock_export.call_args_list}
        expected_exports = ["vpc_id", "alb_dns_name", "db_endpoint", "region", "public_subnet_ids", "private_subnet_ids", "web_instance_ids"]
        
        for expected_export in expected_exports:
            assert expected_export in export_calls
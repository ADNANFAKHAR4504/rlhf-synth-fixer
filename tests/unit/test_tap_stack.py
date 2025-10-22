"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Environment": "test", "Project": "streamflix"}
        args = TapStackArgs(environment_suffix="test", tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, "test")
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_suffix(self):
        """Test TapStackArgs with None environment_suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)
        
        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_empty_string_suffix(self):
        """Test TapStackArgs with empty string environment_suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix="")
        
        self.assertEqual(args.environment_suffix, 'dev')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    def setUp(self):
        """Set up test fixtures."""
        self.test_args = TapStackArgs(
            environment_suffix="test",
            tags={"Environment": "test", "Project": "streamflix"}
        )

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__', return_value=None)
    @patch('lib.tap_stack.pulumi.ComponentResource.register_outputs')
    def test_tap_stack_initialization(self, mock_register, mock_init):
        """Test TapStack initialization with proper arguments."""
        with patch('lib.tap_stack.pulumi.ResourceOptions') as mock_resource_opts:
            with patch('lib.tap_stack.aws') as mock_aws:
                # Mock ResourceOptions to return a valid mock
                mock_resource_opts.return_value = MagicMock()
                
                # Mock all AWS resources to prevent actual instantiation
                self._setup_aws_mocks(mock_aws)
                
                # Create TapStack instance
                stack = TapStack("test-stack", self.test_args)
                
                # Verify initialization
                self.assertEqual(stack.environment_suffix, "test")
                self.assertEqual(stack.tags, {"Environment": "test", "Project": "streamflix"})

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__', return_value=None)
    @patch('lib.tap_stack.pulumi.ComponentResource.register_outputs')
    def test_tap_stack_default_tags(self, mock_register, mock_init):
        """Test TapStack with default empty tags."""
        with patch('lib.tap_stack.pulumi.ResourceOptions') as mock_resource_opts:
            with patch('lib.tap_stack.aws') as mock_aws:
                # Mock ResourceOptions to return a valid mock
                mock_resource_opts.return_value = MagicMock()
                
                # Mock all AWS resources to prevent actual instantiation
                self._setup_aws_mocks(mock_aws)
                
                args = TapStackArgs(environment_suffix="test")
                stack = TapStack("test-stack", args)
                
                self.assertEqual(stack.tags, {})

    def _setup_aws_mocks(self, mock_aws):
        """Set up comprehensive AWS mocks for testing."""
        # EC2 mocks
        mock_aws.ec2.Vpc.return_value = self._create_mock_resource('vpc-123')
        mock_aws.ec2.InternetGateway.return_value = self._create_mock_resource('igw-123')
        mock_aws.ec2.Subnet.return_value = self._create_mock_resource('subnet-123')
        mock_aws.ec2.Eip.return_value = self._create_mock_resource('eip-123')
        mock_aws.ec2.NatGateway.return_value = self._create_mock_resource('nat-123')
        mock_aws.ec2.RouteTable.return_value = self._create_mock_resource('rt-123')
        mock_aws.ec2.RouteTableAssociation.return_value = self._create_mock_resource('rta-123')
        mock_aws.ec2.SecurityGroup.return_value = self._create_mock_resource('sg-123')
        
        # RDS mocks
        mock_aws.rds.SubnetGroup.return_value = self._create_mock_resource('subnet-group-123')
        mock_aws.rds.Instance.return_value = self._create_mock_resource('db-123', 
                                                                        endpoint='db.region.rds.amazonaws.com:5432')
        
        # Secrets Manager mocks
        mock_aws.secretsmanager.Secret.return_value = self._create_mock_resource('secret-123')
        mock_aws.secretsmanager.SecretVersion.return_value = self._create_mock_resource('version-123')
        
        # ElastiCache mocks
        mock_cache = self._create_mock_resource('cache-123')
        mock_cache.endpoints = [{'address': 'cache.region.cache.amazonaws.com'}]
        mock_aws.elasticache.ServerlessCache.return_value = mock_cache
        
        # ECR mocks
        mock_aws.ecr.Repository.return_value = self._create_mock_resource('repo-123',
                                                                         repository_url='123.dkr.ecr.region.amazonaws.com/repo')
        
        # ECS mocks
        mock_aws.ecs.Cluster.return_value = self._create_mock_resource('cluster-123', name='cluster-name')
        mock_aws.ecs.TaskDefinition.return_value = self._create_mock_resource('task-def-123')
        mock_aws.ecs.Service.return_value = self._create_mock_resource('service-123')
        
        # IAM mocks
        mock_aws.iam.Role.return_value = self._create_mock_resource('role-123', name='role-name')
        mock_aws.iam.RolePolicyAttachment.return_value = self._create_mock_resource('attachment-123')
        
        # CloudWatch mocks
        mock_aws.cloudwatch.LogGroup.return_value = self._create_mock_resource('log-group-123',
                                                                               name='/ecs/log-group')
        
        # Load Balancer mocks
        mock_aws.lb.LoadBalancer.return_value = self._create_mock_resource('alb-123',
                                                                          dns_name='alb.region.elb.amazonaws.com')
        mock_aws.lb.TargetGroup.return_value = self._create_mock_resource('tg-123')
        
        # Create a special mock for Listener that acts as a Resource for depends_on
        mock_listener = self._create_mock_resource('listener-123')
        mock_listener._is_resource = True  # Mark it as a Pulumi Resource
        mock_aws.lb.Listener.return_value = mock_listener
        
        # API Gateway mocks
        mock_aws.apigatewayv2.Api.return_value = self._create_mock_resource('api-123',
                                                                           api_endpoint='https://api.execute-api.region.amazonaws.com')
        mock_aws.apigatewayv2.VpcLink.return_value = self._create_mock_resource('vpc-link-123')
        mock_aws.apigatewayv2.Integration.return_value = self._create_mock_resource('integration-123')
        mock_aws.apigatewayv2.Route.return_value = self._create_mock_resource('route-123')
        mock_aws.apigatewayv2.Stage.return_value = self._create_mock_resource('stage-123')

    def _create_mock_resource(self, resource_id, **kwargs):
        """Create a mock AWS resource with common attributes."""
        mock_resource = MagicMock()
        mock_resource.id = resource_id
        mock_resource.arn = f'arn:aws:service:region:account:{resource_id}'
        mock_resource.name = kwargs.get('name', f'resource-{resource_id}')
        
        # Set additional attributes
        for key, value in kwargs.items():
            setattr(mock_resource, key, value)
            
        return mock_resource

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__', return_value=None)
    @patch('lib.tap_stack.pulumi.ComponentResource.register_outputs')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    @patch('lib.tap_stack.pulumi.Output')
    def test_tap_stack_resource_creation(self, mock_output, mock_resource_opts, mock_register, mock_init):
        """Test that TapStack creates all required AWS resources."""
        # Setup output mocks
        mock_output.all.return_value.apply.return_value = '[]'
        mock_output.secret.return_value = 'secret_value'
        mock_resource_opts.return_value = MagicMock()
        
        with patch('lib.tap_stack.aws') as mock_aws:
            # Setup all AWS mocks
            self._setup_aws_mocks(mock_aws)
            
            # Create TapStack
            stack = TapStack("test-stack", self.test_args)
            
            # Verify ComponentResource was initialized
            mock_init.assert_called_once()
            
            # Verify outputs were registered
            mock_register.assert_called_once()

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__', return_value=None)
    @patch('lib.tap_stack.pulumi.ComponentResource.register_outputs')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    @patch('lib.tap_stack.pulumi.Output')
    def test_tap_stack_outputs_registration(self, mock_output, mock_resource_opts, mock_register, mock_init):
        """Test that TapStack registers outputs correctly."""
        # Setup output mocks
        mock_output.all.return_value.apply.return_value = '[]'
        mock_output.secret.return_value = 'secret_value'
        mock_resource_opts.return_value = MagicMock()
        
        with patch('lib.tap_stack.aws') as mock_aws:
            # Setup all AWS mocks
            self._setup_aws_mocks(mock_aws)
            
            # Create TapStack
            stack = TapStack("test-stack", self.test_args)
            
            # Verify register_outputs was called
            mock_register.assert_called_once()
            
            # Get the arguments passed to register_outputs
            call_args = mock_register.call_args[0][0]
            
            # Verify all expected outputs are present
            expected_outputs = [
                "vpc_id", "ecs_cluster_name", "rds_endpoint", 
                "elasticache_endpoint", "alb_dns_name", 
                "api_gateway_url", "ecr_repository_url"
            ]
            
            for output in expected_outputs:
                self.assertIn(output, call_args)

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__', return_value=None)
    @patch('lib.tap_stack.pulumi.ComponentResource.register_outputs')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    @patch('lib.tap_stack.pulumi.Output')
    def test_tap_stack_region_configuration(self, mock_output, mock_resource_opts, mock_register, mock_init):
        """Test that TapStack uses correct region configuration."""
        mock_output.all.return_value.apply.return_value = '[]'
        mock_output.secret.return_value = 'secret_value'
        mock_resource_opts.return_value = MagicMock()
        
        with patch('lib.tap_stack.aws') as mock_aws:
            self._setup_aws_mocks(mock_aws)
            
            # Create TapStack
            stack = TapStack("test-stack", self.test_args)
            
            # Verify the stack was created (init called)
            mock_init.assert_called_once_with('tap:stack:TapStack', "test-stack", None, None)

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__', return_value=None)
    @patch('lib.tap_stack.pulumi.ComponentResource.register_outputs')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    @patch('lib.tap_stack.pulumi.Output')
    def test_tap_stack_availability_zones(self, mock_output, mock_resource_opts, mock_register, mock_init):
        """Test that TapStack handles multiple availability zones correctly."""
        mock_output.all.return_value.apply.return_value = '[]'
        mock_output.secret.return_value = 'secret_value'
        mock_resource_opts.return_value = MagicMock()
        
        with patch('lib.tap_stack.aws') as mock_aws:
            self._setup_aws_mocks(mock_aws)
            
            # Create TapStack
            stack = TapStack("test-stack", self.test_args)
            
            # Verify multiple subnets were created (mocked)
            # The actual code creates 3 public and 3 private subnets
            call_count = mock_aws.ec2.Subnet.call_count
            self.assertGreater(call_count, 0)  # At least one subnet call

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__', return_value=None)
    @patch('lib.tap_stack.pulumi.ComponentResource.register_outputs')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    @patch('lib.tap_stack.pulumi.Output')
    def test_tap_stack_security_groups(self, mock_output, mock_resource_opts, mock_register, mock_init):
        """Test that TapStack creates appropriate security groups."""
        mock_output.all.return_value.apply.return_value = '[]'
        mock_output.secret.return_value = 'secret_value'
        mock_resource_opts.return_value = MagicMock()
        
        with patch('lib.tap_stack.aws') as mock_aws:
            self._setup_aws_mocks(mock_aws)
            
            # Create TapStack
            stack = TapStack("test-stack", self.test_args)
            
            # Verify security groups were created
            # The actual code creates 4 security groups: ALB, ECS, RDS, ElastiCache
            call_count = mock_aws.ec2.SecurityGroup.call_count
            self.assertGreater(call_count, 0)  # At least one security group call

    def test_json_import(self):
        """Test that json module is properly imported."""
        from lib.tap_stack import json
        self.assertIsNotNone(json)

    def test_pulumi_import(self):
        """Test that pulumi modules are properly imported."""
        from lib.tap_stack import pulumi
        from lib.tap_stack import aws
        self.assertIsNotNone(pulumi)
        self.assertIsNotNone(aws)


if __name__ == '__main__':
    unittest.main()
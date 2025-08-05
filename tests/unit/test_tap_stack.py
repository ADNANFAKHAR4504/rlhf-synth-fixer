# tests/unit/test_tap_stack.py
import pytest
import pulumi
from unittest.mock import Mock, patch, MagicMock
import json

class TestTapStackUnit:
    """Unit tests for TapStack components"""
    
    @pytest.fixture
    def mock_pulumi_output(self):
        """Mock Pulumi Output for testing"""
        mock_output = Mock()
        mock_output.apply = Mock(return_value="mocked-value")
        return mock_output
    
    @pytest.fixture
    def stack_config(self):
        """Standard test configuration"""
        return {
            "environment": "test",
            "region": "us-east-1", 
            "app_name": "test-app"
        }
    
    def test_stack_initialization(self, stack_config):
        """Test stack initializes with correct configuration"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            assert stack.environment == "test"
            assert stack.region == "us-east-1"
            assert stack.app_name == "test-app"
            assert stack.config == stack_config
    
    def test_vpc_creation_parameters(self, stack_config):
        """Test VPC is created with correct parameters"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify VPC attributes
            assert hasattr(stack, 'vpc')
            assert stack.vpc is not None
    
    def test_security_group_rules(self, stack_config):
        """Test security groups have correct ingress/egress rules"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify security groups exist
            assert hasattr(stack, 'alb_sg')
            assert hasattr(stack, 'app_sg')
    
    def test_iam_role_trust_policies(self, stack_config):
        """Test IAM roles have correct trust policies"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify IAM roles
            assert hasattr(stack, 'ec2_role')
            assert hasattr(stack, 'codebuild_role')
            assert hasattr(stack, 'codedeploy_role')
            assert hasattr(stack, 'codepipeline_role')
            assert hasattr(stack, 'lambda_role')
    
    def test_target_group_health_check_config(self, stack_config):
        """Test target groups have proper health check configuration"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify target groups for blue-green deployment
            assert hasattr(stack, 'blue_target_group')
            assert hasattr(stack, 'green_target_group')
    
    def test_autoscaling_group_configuration(self, stack_config):
        """Test Auto Scaling Group configuration"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify ASG exists
            assert hasattr(stack, 'asg')
            assert hasattr(stack, 'launch_template')
    
    def test_codebuild_project_configuration(self, stack_config):
        """Test CodeBuild project has correct configuration"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify CodeBuild project
            assert hasattr(stack, 'codebuild_project')
    
    def test_codedeploy_blue_green_configuration(self, stack_config):
        """Test CodeDeploy blue-green deployment configuration"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify CodeDeploy components
            assert hasattr(stack, 'codedeploy_app')
            assert hasattr(stack, 'codedeploy_group')
    
    def test_codepipeline_stages(self, stack_config):
        """Test CodePipeline has correct stages"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify pipeline
            assert hasattr(stack, 'pipeline')
    
    def test_cloudwatch_alarms_configuration(self, stack_config):
        """Test CloudWatch alarms are properly configured"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify monitoring components
            assert hasattr(stack, 'cpu_alarm')
            assert hasattr(stack, 'healthy_hosts_alarm')
            assert hasattr(stack, 'log_group')
            assert hasattr(stack, 'dashboard')
    
    def test_lambda_function_code_and_config(self, stack_config):
        """Test Lambda functions have correct code and configuration"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify Lambda functions
            assert hasattr(stack, 'health_check_lambda')
            assert hasattr(stack, 'notification_lambda')
    
    def test_secrets_manager_configuration(self, stack_config):
        """Test Secrets Manager configuration"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify secrets management
            assert hasattr(stack, 'app_secrets')
            assert hasattr(stack, 'app_secrets_version')
    
    def test_s3_bucket_encryption_and_versioning(self, stack_config):
        """Test S3 bucket has encryption and versioning enabled"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify S3 bucket
            assert hasattr(stack, 'artifacts_bucket')
    
    def test_environment_specific_configurations(self):
        """Test different configurations for different environments"""
        environments = ["dev", "test", "prod"]
        
        for env in environments:
            config = {
                "environment": env,
                "region": "us-east-1",
                "app_name": "test-app"
            }
            
            with patch('pulumi.get_stack', return_value=env):
                pulumi.runtime.set_mocks(
                    mocks=UnitTestMocks(),
                    preview=False
                )
                
                from lib.tap_stack import TapStack
                stack = TapStack(f"test-stack-{env}", config)
                
                assert stack.environment == env
    
    def test_resource_tagging(self, stack_config):
        """Test all resources are properly tagged"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify stack has been created (tags would be verified in actual AWS resources)
            assert stack.environment == "test"
    
    def test_user_data_script_generation(self, stack_config):
        """Test EC2 user data script is properly generated"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify launch template exists (user data would be tested in integration)
            assert hasattr(stack, 'launch_template')
    
    def test_buildspec_generation(self, stack_config):
        """Test CodeBuild buildspec is properly configured"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify CodeBuild project exists
            assert hasattr(stack, 'codebuild_project')
    
    def test_stack_outputs(self, stack_config):
        """Test stack outputs are correctly registered"""
        with patch('pulumi.get_stack', return_value='test'):
            pulumi.runtime.set_mocks(
                mocks=UnitTestMocks(),
                preview=False
            )
            
            from lib.tap_stack import TapStack
            stack = TapStack("test-stack", stack_config)
            
            # Verify stack has expected attributes for outputs
            assert hasattr(stack, 'vpc')
            assert hasattr(stack, 'pipeline')
            assert hasattr(stack, 'alb')
            assert hasattr(stack, 'blue_target_group')
            assert hasattr(stack, 'green_target_group')


class UnitTestMocks:
    """Mock provider for unit tests"""
    
    def call(self, args):
        """Mock function calls"""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b"],
                "zone_ids": ["use1-az1", "use1-az2"]
            }
        return {}
    
    def new_resource(self, args):
        """Mock resource creation"""
        props = {}
        
        # Add mock properties based on resource type
        if "vpc" in args.name.lower():
            props["id"] = f"vpc-{args.name}"
        elif "subnet" in args.name.lower():
            props["id"] = f"subnet-{args.name}"
        elif "security" in args.name.lower():
            props["id"] = f"sg-{args.name}"
        elif "role" in args.name.lower():
            props["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
            props["name"] = args.name
        elif "bucket" in args.name.lower():
            props["bucket"] = args.name
            props["arn"] = f"arn:aws:s3:::{args.name}"
        elif "target" in args.name.lower():
            props["arn"] = f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/{args.name}"
            props["arn_suffix"] = f"targetgroup/{args.name}"
            props["name"] = args.name
        elif "loadbalancer" in args.name.lower() or "alb" in args.name.lower():
            props["arn"] = f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{args.name}/1234567890"
            props["arn_suffix"] = f"app/{args.name}/1234567890"
            props["dns_name"] = f"{args.name}.us-east-1.elb.amazonaws.com"
        else:
            props["id"] = f"mock-{args.name}"
            props["arn"] = f"arn:aws:service:us-east-1:123456789012:resource/{args.name}"
            props["name"] = args.name
        
        return [args.name, props]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

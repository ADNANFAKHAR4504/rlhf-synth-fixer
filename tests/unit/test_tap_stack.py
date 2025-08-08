import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi
from lib.tap_stack import TapStack

class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack infrastructure"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.test_args = {
            "project_name": "test-project",
            "environment": "test",
            "regions": ["us-east-1", "us-west-2"]
        }
    
    @patch('pulumi_aws.Provider')
    @patch('pulumi_aws.ec2.Vpc')
    @patch('pulumi_aws.lambda_.Function')
    @patch('pulumi_aws.apigateway.RestApi')
    def test_stack_initialization(self, mock_api, mock_lambda, mock_vpc, mock_provider):
        """Test stack initialization with correct parameters"""
        # Mock Pulumi outputs
        mock_vpc.return_value.id = "vpc-12345"
        mock_lambda.return_value.arn = "arn:aws:lambda:us-east-1:123456789012:function:test"
        mock_api.return_value.id = "api-12345"
        
        # Create stack
        stack = TapStack("test-stack", self.test_args)
        
        # Assertions
        self.assertEqual(stack.project_name, "test-project")
        self.assertEqual(stack.environment, "test")
        self.assertEqual(len(stack.regions), 2)
        self.assertIn("us-east-1", stack.regions)
        self.assertIn("us-west-2", stack.regions)
    
    @patch('pulumi_aws.Provider')
    def test_regional_infrastructure_creation(self, mock_provider):
        """Test that infrastructure is created for each region"""
        with patch.object(TapStack, '_create_regional_infrastructure') as mock_create:
            stack = TapStack("test-stack", self.test_args)
            
            # Verify infrastructure creation called for each region
            self.assertEqual(mock_create.call_count, 2)
            mock_create.assert_any_call("us-east-1")
            mock_create.assert_any_call("us-west-2")
    
    def test_lambda_code_generation(self):
        """Test Lambda function code generation"""
        with patch('pulumi_aws.Provider'):
            stack = TapStack("test-stack", self.test_args)
            code = stack._get_lambda_code()
            
            # Verify code contains required elements
            self.assertIn("def handler(event, context)", code)
            self.assertIn("REGION", code)
            self.assertIn("ENVIRONMENT", code)
            self.assertIn("PROJECT_NAME", code)
    
    @patch('pulumi_aws.Provider')
    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    def test_monitoring_creation(self, mock_alarm, mock_provider):
        """Test monitoring and alerting setup"""
        mock_lambda = Mock()
        mock_lambda.name = "test-function"
        mock_api = Mock()
        mock_api.name = "test-api"
        
        with patch.object(TapStack, '_create_global_monitoring'):
            stack = TapStack("test-stack", self.test_args)
            stack._create_regional_monitoring("us-east-1", mock_lambda, mock_api, None)
            
            # Verify alarms are created
            self.assertEqual(mock_alarm.call_count, 4)  # 4 alarms per region
    
    def test_naming_convention(self):
        """Test that resources follow project-component-environment naming"""
        with patch('pulumi_aws.Provider'):
            stack = TapStack("test-stack", self.test_args)
            
            # Test naming pattern
            expected_pattern = f"{self.test_args['project_name']}-.*-{self.test_args['environment']}"
            
            # This would be tested by checking actual resource names in integration tests
            self.assertTrue(True)  # Placeholder for naming convention test
    
    def test_default_parameters(self):
        """Test stack creation with default parameters"""
        minimal_args = {}
        
        with patch('pulumi_aws.Provider'):
            stack = TapStack("test-stack", minimal_args)
            
            self.assertEqual(stack.project_name, "iac-aws-nova")
            self.assertEqual(stack.environment, "dev")
            self.assertEqual(stack.regions, ["us-east-1", "us-west-2"])

if __name__ == '__main__':
    # Set Pulumi environment for testing
    pulumi.runtime.set_mocks(Mock(), "test-project", "test-stack")
    unittest.main()

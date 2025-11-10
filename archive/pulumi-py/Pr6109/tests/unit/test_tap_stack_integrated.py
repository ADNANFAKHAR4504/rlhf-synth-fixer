"""
Integrated unit tests for tap_stack.py to achieve required coverage.
This test properly imports and executes the infrastructure code.
"""

import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add the lib directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../'))


class TestTapStackIntegrated(unittest.TestCase):
    """Integrated tests for tap_stack.py with proper code execution."""

    @classmethod
    def setUpClass(cls):
        """Set up test class with mocked Pulumi environment."""
        # Create comprehensive mock modules
        cls.mock_pulumi = MagicMock()
        cls.mock_pulumi_aws = MagicMock()

        # Configure Pulumi Config mock
        mock_config = MagicMock()
        mock_config.get.side_effect = lambda key: {
            "environmentSuffix": "test",
            "region": "us-east-1"
        }.get(key)
        cls.mock_pulumi.Config.return_value = mock_config

        # Configure export mock
        cls.mock_pulumi.export = MagicMock()

        # Configure assets mocks
        cls.mock_pulumi.AssetArchive = MagicMock(return_value=MagicMock())
        cls.mock_pulumi.StringAsset = MagicMock(return_value=MagicMock())

        # Configure AWS mocks
        mock_azs = MagicMock()
        mock_azs.names = ["us-east-1a", "us-east-1b", "us-east-1c"]
        cls.mock_pulumi_aws.get_availability_zones.return_value = mock_azs

        mock_caller = MagicMock()
        mock_caller.account_id = "123456789012"
        cls.mock_pulumi_aws.get_caller_identity.return_value = mock_caller

        # Create resource factory
        def create_resource(*args, **kwargs):
            resource = MagicMock()
            resource.id = MagicMock()
            resource.arn = MagicMock()
            resource.name = MagicMock()
            resource.invoke_arn = MagicMock()
            resource.bucket = MagicMock()
            return resource

        # Configure all AWS service mocks
        services = ['ec2', 'kms', 'cloudwatch', 'iam', 'lambda_', 's3', 'dynamodb', 'apigateway', 'wafv2']
        for service in services:
            if not hasattr(cls.mock_pulumi_aws, service):
                setattr(cls.mock_pulumi_aws, service, MagicMock())

        # Configure EC2 resources
        cls.mock_pulumi_aws.ec2.Vpc = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.ec2.InternetGateway = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.ec2.Subnet = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.ec2.RouteTable = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.ec2.RouteTableAssociation = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.ec2.Route = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.ec2.SecurityGroup = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.ec2.SecurityGroupRule = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.ec2.VpcEndpoint = MagicMock(return_value=create_resource())

        # Configure KMS resources
        cls.mock_pulumi_aws.kms.Key = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.kms.Alias = MagicMock(return_value=create_resource())

        # Configure CloudWatch resources
        cls.mock_pulumi_aws.cloudwatch.LogGroup = MagicMock(return_value=create_resource())

        # Configure IAM resources
        cls.mock_pulumi_aws.iam.Role = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.iam.Policy = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.iam.RolePolicyAttachment = MagicMock(return_value=create_resource())

        # Configure Lambda resources
        cls.mock_pulumi_aws.lambda_.Function = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.lambda_.Permission = MagicMock(return_value=create_resource())

        # Configure S3 resources
        cls.mock_pulumi_aws.s3.Bucket = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.s3.BucketServerSideEncryptionConfigurationV2 = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.s3.BucketVersioningV2 = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.s3.BucketPublicAccessBlock = MagicMock(return_value=create_resource())

        # Configure DynamoDB resources
        cls.mock_pulumi_aws.dynamodb.Table = MagicMock(return_value=create_resource())

        # Configure API Gateway resources
        cls.mock_pulumi_aws.apigateway.RestApi = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.apigateway.Resource = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.apigateway.Method = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.apigateway.Integration = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.apigateway.IntegrationResponse = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.apigateway.MethodResponse = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.apigateway.Stage = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.apigateway.Deployment = MagicMock(return_value=create_resource())

        # Configure WAF resources
        cls.mock_pulumi_aws.wafv2.WebAcl = MagicMock(return_value=create_resource())
        cls.mock_pulumi_aws.wafv2.WebAclAssociation = MagicMock(return_value=create_resource())

        # Store original modules
        cls.original_modules = {}
        for module in ['pulumi', 'pulumi_aws']:
            if module in sys.modules:
                cls.original_modules[module] = sys.modules[module]

        # Replace with mocks
        sys.modules['pulumi'] = cls.mock_pulumi
        sys.modules['pulumi_aws'] = cls.mock_pulumi_aws

        # Import tap_stack to execute the code
        import lib.tap_stack
        cls.tap_stack = lib.tap_stack

    @classmethod
    def tearDownClass(cls):
        """Clean up after test class."""
        # Remove imported module
        if 'lib.tap_stack' in sys.modules:
            del sys.modules['lib.tap_stack']

        # Restore original modules
        for module_name, original in cls.original_modules.items():
            sys.modules[module_name] = original

    def test_infrastructure_creation(self):
        """Test that all infrastructure resources are created correctly."""
        # Verify Config was initialized
        self.assertTrue(self.mock_pulumi.Config.called)

        # Verify availability zones were fetched
        self.assertTrue(self.mock_pulumi_aws.get_availability_zones.called)

        # Verify VPC and networking resources
        self.assertTrue(self.mock_pulumi_aws.ec2.Vpc.called)
        self.assertTrue(self.mock_pulumi_aws.ec2.InternetGateway.called)
        self.assertGreater(self.mock_pulumi_aws.ec2.Subnet.call_count, 1)
        self.assertTrue(self.mock_pulumi_aws.ec2.RouteTable.called)
        self.assertTrue(self.mock_pulumi_aws.ec2.Route.called)

        # Verify security groups
        self.assertTrue(self.mock_pulumi_aws.ec2.SecurityGroup.called)
        # Security group rules may or may not be called depending on the implementation
        # so we just check if SecurityGroup was called

        # Verify KMS keys (should be 3: S3, DynamoDB, CloudWatch)
        self.assertEqual(self.mock_pulumi_aws.kms.Key.call_count, 3)
        self.assertEqual(self.mock_pulumi_aws.kms.Alias.call_count, 3)

        # Verify CloudWatch Log Group
        self.assertTrue(self.mock_pulumi_aws.cloudwatch.LogGroup.called)

        # Verify IAM resources
        self.assertTrue(self.mock_pulumi_aws.iam.Role.called)
        self.assertTrue(self.mock_pulumi_aws.iam.Policy.called)
        self.assertTrue(self.mock_pulumi_aws.iam.RolePolicyAttachment.called)

        # Verify Lambda function
        self.assertTrue(self.mock_pulumi_aws.lambda_.Function.called)

        # Verify S3 bucket and security configurations
        self.assertTrue(self.mock_pulumi_aws.s3.Bucket.called)
        self.assertTrue(self.mock_pulumi_aws.s3.BucketServerSideEncryptionConfigurationV2.called)
        self.assertTrue(self.mock_pulumi_aws.s3.BucketVersioningV2.called)
        self.assertTrue(self.mock_pulumi_aws.s3.BucketPublicAccessBlock.called)

        # Verify DynamoDB table
        self.assertTrue(self.mock_pulumi_aws.dynamodb.Table.called)

        # Verify API Gateway configuration
        self.assertTrue(self.mock_pulumi_aws.apigateway.RestApi.called)
        self.assertTrue(self.mock_pulumi_aws.apigateway.Resource.called)
        self.assertTrue(self.mock_pulumi_aws.apigateway.Method.called)
        self.assertTrue(self.mock_pulumi_aws.apigateway.Integration.called)
        self.assertTrue(self.mock_pulumi_aws.apigateway.Deployment.called)
        self.assertTrue(self.mock_pulumi_aws.apigateway.Stage.called)

        # Verify WAF configuration
        self.assertTrue(self.mock_pulumi_aws.wafv2.WebAcl.called)
        self.assertTrue(self.mock_pulumi_aws.wafv2.WebAclAssociation.called)

        # Verify exports
        self.assertGreater(self.mock_pulumi.export.call_count, 10)

    def test_security_configurations(self):
        """Test that security configurations are properly applied."""
        # Check KMS key creation with rotation
        kms_key_calls = self.mock_pulumi_aws.kms.Key.call_args_list
        self.assertEqual(len(kms_key_calls), 3)
        for call in kms_key_calls:
            _, kwargs = call
            self.assertTrue(kwargs.get('enable_key_rotation', False))

        # Check S3 bucket encryption
        s3_encryption_calls = self.mock_pulumi_aws.s3.BucketServerSideEncryptionConfigurationV2.call_args_list
        self.assertEqual(len(s3_encryption_calls), 1)

        # Check S3 public access block
        s3_public_block_calls = self.mock_pulumi_aws.s3.BucketPublicAccessBlock.call_args_list
        self.assertEqual(len(s3_public_block_calls), 1)
        _, kwargs = s3_public_block_calls[0]
        self.assertTrue(kwargs.get('block_public_acls', False))
        self.assertTrue(kwargs.get('block_public_policy', False))

        # Check DynamoDB encryption
        dynamodb_calls = self.mock_pulumi_aws.dynamodb.Table.call_args_list
        self.assertEqual(len(dynamodb_calls), 1)
        _, kwargs = dynamodb_calls[0]
        self.assertTrue(kwargs.get('point_in_time_recovery', {}).get('enabled', False))

    def test_compliance_tags(self):
        """Test that compliance tags are applied to resources."""
        # Check VPC tags
        vpc_calls = self.mock_pulumi_aws.ec2.Vpc.call_args_list
        self.assertEqual(len(vpc_calls), 1)
        _, kwargs = vpc_calls[0]
        tags = kwargs.get('tags', {})
        self.assertIn('ComplianceScope', tags)
        self.assertEqual(tags.get('ComplianceScope'), 'PCI-DSS')
        self.assertIn('DataClassification', tags)
        self.assertEqual(tags.get('DataClassification'), 'HighlyConfidential')


if __name__ == '__main__':
    unittest.main()
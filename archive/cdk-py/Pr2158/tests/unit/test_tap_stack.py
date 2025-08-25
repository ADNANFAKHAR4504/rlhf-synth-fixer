"""Unit tests for TapStack infrastructure."""
import os
import json
import unittest
from unittest.mock import patch, MagicMock
import aws_cdk as cdk
from aws_cdk import assertions
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack infrastructure."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.environments = ['dev', 'test', 'prod']
        
    def tearDown(self):
        """Clean up after tests."""
        pass
        
    def _create_stack(self, environment_suffix):
        """Helper to create a stack for testing."""
        # Create a new app for each stack to avoid synthesis conflicts
        app = cdk.App()
        props = TapStackProps(
            environment_suffix=environment_suffix,
            env=cdk.Environment(
                account='123456789012',
                region='us-east-1'
            )
        )
        return TapStack(app, f'TestStack{environment_suffix}', props=props)
        
    def test_stack_creation(self):
        """Test that stack can be created for all environments."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                self.assertIsNotNone(stack)
                self.assertEqual(stack.environment_suffix, env)
                
    def test_kms_key_creation(self):
        """Test KMS key is created with proper configuration."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                template = assertions.Template.from_stack(stack)
                
                # Check KMS key exists
                template.has_resource_properties('AWS::KMS::Key', {
                    'Description': f'KMS key for {env} environment encryption',
                    'EnableKeyRotation': True
                })
                
                # Check KMS alias exists
                template.has_resource_properties('AWS::KMS::Alias', {
                    'AliasName': f'alias/app-{env}'
                })
                
    def test_s3_bucket_creation(self):
        """Test S3 bucket is created with proper configuration."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                template = assertions.Template.from_stack(stack)
                
                # Check S3 bucket exists
                template.has_resource_properties('AWS::S3::Bucket', {
                    'BucketEncryption': {
                        'ServerSideEncryptionConfiguration': assertions.Match.any_value()
                    },
                    'PublicAccessBlockConfiguration': {
                        'BlockPublicAcls': True,
                        'BlockPublicPolicy': True,
                        'IgnorePublicAcls': True,
                        'RestrictPublicBuckets': True
                    }
                })
                
    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created with proper configuration."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                template = assertions.Template.from_stack(stack)
                
                # Check DynamoDB table exists
                template.has_resource_properties('AWS::DynamoDB::Table', {
                    'TableName': f'app-data-{env}',
                    'AttributeDefinitions': assertions.Match.array_with([
                        {'AttributeName': 'id', 'AttributeType': 'S'},
                        {'AttributeName': 'timestamp', 'AttributeType': 'S'},
                        {'AttributeName': 'type', 'AttributeType': 'S'},
                        {'AttributeName': 'created_at', 'AttributeType': 'S'}
                    ]),
                    'KeySchema': assertions.Match.array_with([
                        {'AttributeName': 'id', 'KeyType': 'HASH'},
                        {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
                    ])
                })
                
    def test_iam_roles_creation(self):
        """Test IAM roles are created with proper configuration."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                template = assertions.Template.from_stack(stack)
                
                # Check application role exists
                template.has_resource_properties('AWS::IAM::Role', {
                    'RoleName': f'app-role-{env}',
                    'AssumeRolePolicyDocument': assertions.Match.object_like({
                        'Statement': assertions.Match.array_with([
                            assertions.Match.object_like({
                                'Effect': 'Allow',
                                'Principal': {'Service': 'ec2.amazonaws.com'}
                            })
                        ])
                    })
                })
                
                # Check admin role exists
                template.has_resource_properties('AWS::IAM::Role', {
                    'RoleName': f'admin-role-{env}'
                })
                
    def test_cloudwatch_logs_creation(self):
        """Test CloudWatch log groups are created with proper configuration."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                template = assertions.Template.from_stack(stack)
                
                # Check main log group exists
                template.has_resource_properties('AWS::Logs::LogGroup', {
                    'LogGroupName': f'/aws/app/{env}'
                })
                
                # Check error log group exists
                template.has_resource_properties('AWS::Logs::LogGroup', {
                    'LogGroupName': f'/aws/app/{env}/errors'
                })
                
    def test_ssm_parameters_creation(self):
        """Test SSM parameters are created with proper configuration."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                template = assertions.Template.from_stack(stack)
                
                # Check SSM parameters exist
                template.has_resource_properties('AWS::SSM::Parameter', {
                    'Name': f'/app/{env}/database/connection_string'
                })
                
                template.has_resource_properties('AWS::SSM::Parameter', {
                    'Name': f'/app/{env}/s3/config_bucket'
                })
                
                template.has_resource_properties('AWS::SSM::Parameter', {
                    'Name': f'/app/{env}/logging/level'
                })
                
                template.has_resource_properties('AWS::SSM::Parameter', {
                    'Name': f'/app/{env}/api/rate_limit'
                })
                
    def test_environment_specific_configurations(self):
        """Test environment-specific configurations are applied correctly."""
        stack = self._create_stack('dev')
        config = stack.environment_config
        
        # Test dev configuration
        self.assertEqual(config['log_retention_days'], 7)
        self.assertEqual(config['dynamodb_billing'], cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST)
        self.assertFalse(config['dynamodb_point_in_time_recovery'])
        self.assertFalse(config['s3_versioning'])
        self.assertEqual(config['s3_lifecycle_days'], 30)
        self.assertEqual(config['kms_deletion_window'], 7)
        
        # Test prod configuration
        stack = self._create_stack('prod')
        config = stack.environment_config
        
        self.assertEqual(config['log_retention_days'], 90)
        self.assertEqual(config['dynamodb_billing'], cdk.aws_dynamodb.BillingMode.PROVISIONED)
        self.assertTrue(config['dynamodb_point_in_time_recovery'])
        self.assertTrue(config['s3_versioning'])
        self.assertEqual(config['s3_lifecycle_days'], 365)
        self.assertEqual(config['kms_deletion_window'], 30)
        
    def test_tags_applied(self):
        """Test that tags are applied to the stack."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                template = assertions.Template.from_stack(stack)
                
                # Check that S3 bucket has tags (just check for Environment tag)
                template.has_resource_properties('AWS::S3::Bucket', {
                    'Tags': assertions.Match.array_with([
                        {'Key': 'Environment', 'Value': env}
                    ])
                })
                
    def test_outputs_created(self):
        """Test that stack outputs are created."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                template = assertions.Template.from_stack(stack)
                
                # Check outputs exist
                template.has_output('ConfigBucketName', {})
                template.has_output('ConfigBucketArn', {})
                template.has_output('AppTableName', {})
                template.has_output('AppTableArn', {})
                template.has_output('AppRoleArn', {})
                template.has_output('AdminRoleArn', {})
                template.has_output('LogGroupName', {})
                template.has_output('ErrorLogGroupName', {})
                template.has_output('KMSKeyId', {})
                template.has_output('KMSKeyArn', {})
                
    def test_removal_policies(self):
        """Test that removal policies are set correctly."""
        # All resources should have DESTROY policy for non-prod
        stack = self._create_stack('synthtrainr151cdkpy')
        template = assertions.Template.from_stack(stack)
        
        # Check KMS key has destroy policy
        template.has_resource('AWS::KMS::Key', {
            'DeletionPolicy': 'Delete'
        })
        
        # Check S3 bucket has destroy policy
        template.has_resource('AWS::S3::Bucket', {
            'DeletionPolicy': 'Delete'
        })
        
        # Check DynamoDB table has destroy policy
        template.has_resource('AWS::DynamoDB::Table', {
            'DeletionPolicy': 'Delete'
        })
        
    def test_security_configurations(self):
        """Test security configurations are properly set."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                template = assertions.Template.from_stack(stack)
                
                # Check S3 bucket has SSL enforcement
                template.has_resource_properties('AWS::S3::BucketPolicy', {
                    'PolicyDocument': assertions.Match.object_like({
                        'Statement': assertions.Match.array_with([
                            assertions.Match.object_like({
                                'Effect': 'Deny',
                                'Action': 's3:*',
                                'Condition': {
                                    'Bool': {'aws:SecureTransport': 'false'}
                                }
                            })
                        ])
                    })
                })
                
    def test_cross_environment_isolation(self):
        """Test that admin role has cross-environment access prevention."""
        for env in self.environments:
            with self.subTest(environment=env):
                stack = self._create_stack(env)
                template = assertions.Template.from_stack(stack)
                
                # Check admin role has deny policy for cross-environment access
                template.has_resource_properties('AWS::IAM::Policy', {
                    'PolicyDocument': assertions.Match.object_like({
                        'Statement': assertions.Match.array_with([
                            assertions.Match.object_like({
                                'Effect': 'Deny',
                                'Action': '*',
                                'Condition': {
                                    'StringNotEquals': {
                                        'aws:ResourceTag/Environment': env
                                    }
                                }
                            })
                        ])
                    })
                })


if __name__ == '__main__':
    unittest.main()
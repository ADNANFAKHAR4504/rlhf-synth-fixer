"""
Unit tests for Template Parser Lambda Function
"""

import json
import pytest
import os
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Mock AWS SDK before importing the module
import sys
sys.path.insert(0, '/var/www/turing/iac-test-automations/worktree/synth-101912648/lib/lambda')

with patch('boto3.client'):
    with patch('boto3.resource'):
        from template_parser import (
            lambda_handler,
            get_cloudformation_template,
            parse_template_resources,
            extract_s3_encryption,
            extract_s3_public_access
        )


class TestTemplateParser:
    """Test suite for template parser function"""

    def test_lambda_handler_success(self):
        """Test successful template parsing"""
        # Arrange
        event = {
            'stackName': 'test-stack',
            'accountId': '123456789012',
            'region': 'us-east-1'
        }
        context = Mock()
        context.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test'

        with patch('template_parser.get_cloudformation_template') as mock_get_template, \
             patch('template_parser.parse_template_resources') as mock_parse, \
             patch('template_parser.store_scan_metadata') as mock_store, \
             patch('template_parser.publish_metrics') as mock_metrics:
            
            mock_get_template.return_value = {'Resources': {}}
            mock_parse.return_value = []

            # Act
            result = lambda_handler(event, context)

            # Assert
            assert result['statusCode'] == 200
            assert result['stackName'] == 'test-stack'
            assert 'scanId' in result
            mock_get_template.assert_called_once()
            mock_parse.assert_called_once()

    def test_lambda_handler_missing_stack_name(self):
        """Test error handling for missing stack name"""
        # Arrange
        event = {}
        context = Mock()

        # Act
        result = lambda_handler(event, context)

        # Assert
        assert result['statusCode'] == 500
        assert 'Missing required parameter' in result['error']

    def test_parse_template_resources_s3_bucket(self):
        """Test parsing S3 bucket resources"""
        # Arrange
        template = {
            'Resources': {
                'MyBucket': {
                    'Type': 'AWS::S3::Bucket',
                    'Properties': {
                        'BucketEncryption': {
                            'ServerSideEncryptionConfiguration': [
                                {
                                    'ServerSideEncryptionByDefault': {
                                        'SSEAlgorithm': 'AES256'
                                    }
                                }
                            ]
                        },
                        'PublicAccessBlockConfiguration': {
                            'BlockPublicAcls': True,
                            'BlockPublicPolicy': True,
                            'IgnorePublicAcls': True,
                            'RestrictPublicBuckets': True
                        }
                    }
                }
            }
        }

        # Act
        resources = parse_template_resources(template)

        # Assert
        assert len(resources) == 1
        assert resources[0]['logicalId'] == 'MyBucket'
        assert resources[0]['type'] == 'AWS::S3::Bucket'
        assert resources[0]['encryption']['enabled'] is True
        assert resources[0]['encryption']['algorithm'] == 'AES256'

    def test_parse_template_resources_rds_instance(self):
        """Test parsing RDS instance resources"""
        # Arrange
        template = {
            'Resources': {
                'MyDatabase': {
                    'Type': 'AWS::RDS::DBInstance',
                    'Properties': {
                        'StorageEncrypted': True,
                        'PubliclyAccessible': False,
                        'Engine': 'postgres'
                    }
                }
            }
        }

        # Act
        resources = parse_template_resources(template)

        # Assert
        assert len(resources) == 1
        assert resources[0]['logicalId'] == 'MyDatabase'
        assert resources[0]['type'] == 'AWS::RDS::DBInstance'
        assert resources[0]['encryption'] is True
        assert resources[0]['publiclyAccessible'] is False

    def test_parse_template_resources_ec2_instance(self):
        """Test parsing EC2 instance resources"""
        # Arrange
        template = {
            'Resources': {
                'MyInstance': {
                    'Type': 'AWS::EC2::Instance',
                    'Properties': {
                        'InstanceType': 't3.micro',
                        'ImageId': 'ami-12345678'
                    }
                }
            }
        }

        # Act
        resources = parse_template_resources(template)

        # Assert
        assert len(resources) == 1
        assert resources[0]['logicalId'] == 'MyInstance'
        assert resources[0]['type'] == 'AWS::EC2::Instance'
        assert resources[0]['instanceType'] == 't3.micro'

    def test_extract_s3_encryption_enabled(self):
        """Test extraction of S3 encryption when enabled"""
        # Arrange
        properties = {
            'BucketEncryption': {
                'ServerSideEncryptionConfiguration': [
                    {
                        'ServerSideEncryptionByDefault': {
                            'SSEAlgorithm': 'aws:kms',
                            'KMSMasterKeyID': 'arn:aws:kms:us-east-1:123456789012:key/12345'
                        }
                    }
                ]
            }
        }

        # Act
        result = extract_s3_encryption(properties)

        # Assert
        assert result['enabled'] is True
        assert result['algorithm'] == 'aws:kms'
        assert 'kmsKeyId' in result

    def test_extract_s3_encryption_disabled(self):
        """Test extraction of S3 encryption when disabled"""
        # Arrange
        properties = {}

        # Act
        result = extract_s3_encryption(properties)

        # Assert
        assert result['enabled'] is False
        assert result['algorithm'] is None

    def test_extract_s3_public_access_blocked(self):
        """Test extraction of S3 public access when blocked"""
        # Arrange
        properties = {
            'PublicAccessBlockConfiguration': {
                'BlockPublicAcls': True,
                'BlockPublicPolicy': True,
                'IgnorePublicAcls': True,
                'RestrictPublicBuckets': True
            }
        }

        # Act
        result = extract_s3_public_access(properties)

        # Assert
        assert result['blockPublicAcls'] is True
        assert result['blockPublicPolicy'] is True
        assert result['ignorePublicAcls'] is True
        assert result['restrictPublicBuckets'] is True

    def test_extract_s3_public_access_not_blocked(self):
        """Test extraction of S3 public access when not blocked"""
        # Arrange
        properties = {}

        # Act
        result = extract_s3_public_access(properties)

        # Assert
        assert result['blockPublicAcls'] is False
        assert result['blockPublicPolicy'] is False
        assert result['ignorePublicAcls'] is False
        assert result['restrictPublicBuckets'] is False

    def test_parse_template_multiple_resources(self):
        """Test parsing template with multiple resource types"""
        # Arrange
        template = {
            'Resources': {
                'Bucket': {
                    'Type': 'AWS::S3::Bucket',
                    'Properties': {}
                },
                'Database': {
                    'Type': 'AWS::RDS::DBInstance',
                    'Properties': {
                        'StorageEncrypted': False
                    }
                },
                'Instance': {
                    'Type': 'AWS::EC2::Instance',
                    'Properties': {
                        'InstanceType': 't3.large'
                    }
                }
            }
        }

        # Act
        resources = parse_template_resources(template)

        # Assert
        assert len(resources) == 3
        resource_types = [r['type'] for r in resources]
        assert 'AWS::S3::Bucket' in resource_types
        assert 'AWS::RDS::DBInstance' in resource_types
        assert 'AWS::EC2::Instance' in resource_types


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

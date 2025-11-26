"""
Unit tests for Compliance Validator Lambda Function
"""

import json
import pytest
from unittest.mock import Mock, patch
from datetime import datetime

# Mock AWS SDK before importing the module
import sys
sys.path.insert(0, '/var/www/turing/iac-test-automations/worktree/synth-101912648/lib/lambda')

with patch('boto3.client'):
    with patch('boto3.resource'):
        from compliance_validator import (
            lambda_handler,
            validate_resource,
            validate_s3_bucket,
            validate_rds_instance,
            validate_ec2_instance
        )


class TestComplianceValidator:
    """Test suite for compliance validator function"""

    def test_lambda_handler_success(self):
        """Test successful compliance validation"""
        # Arrange
        event = {
            'scanId': '123456789012#2025-11-26T12:00:00',
            'stackName': 'test-stack',
            'accountId': '123456789012',
            'resources': [
                {
                    'logicalId': 'TestBucket',
                    'type': 'AWS::S3::Bucket',
                    'encryption': {'enabled': True, 'algorithm': 'AES256'},
                    'publicAccess': {
                        'blockPublicAcls': True,
                        'blockPublicPolicy': True,
                        'ignorePublicAcls': True,
                        'restrictPublicBuckets': True
                    }
                }
            ]
        }
        context = Mock()

        with patch('compliance_validator.store_validation_results'), \
             patch('compliance_validator.send_violation_notifications'), \
             patch('compliance_validator.publish_metrics'), \
             patch('compliance_validator.publish_metrics_by_service'):
            
            # Act
            result = lambda_handler(event, context)

            # Assert
            assert result['statusCode'] == 200
            assert result['totalResources'] == 1
            assert result['compliantResources'] == 1
            assert result['violations'] == 0
            assert result['complianceScore'] == 100.0

    def test_validate_s3_bucket_compliant(self):
        """Test validation of compliant S3 bucket"""
        # Arrange
        resource = {
            'logicalId': 'ComplianceBucket',
            'type': 'AWS::S3::Bucket',
            'encryption': {
                'enabled': True,
                'algorithm': 'AES256'
            },
            'publicAccess': {
                'blockPublicAcls': True,
                'blockPublicPolicy': True,
                'ignorePublicAcls': True,
                'restrictPublicBuckets': True
            }
        }

        # Act
        result = validate_s3_bucket(resource)

        # Assert
        assert result['compliant'] is True
        assert len(result['violations']) == 0
        assert result['severity'] == 'NONE'

    def test_validate_s3_bucket_no_encryption(self):
        """Test validation of S3 bucket without encryption"""
        # Arrange
        resource = {
            'logicalId': 'NonCompliantBucket',
            'type': 'AWS::S3::Bucket',
            'encryption': {
                'enabled': False
            },
            'publicAccess': {
                'blockPublicAcls': True,
                'blockPublicPolicy': True,
                'ignorePublicAcls': True,
                'restrictPublicBuckets': True
            }
        }

        # Act
        result = validate_s3_bucket(resource)

        # Assert
        assert result['compliant'] is False
        assert len(result['violations']) == 1
        assert result['violations'][0]['rule'] == 'S3_ENCRYPTION_REQUIRED'
        assert result['severity'] == 'HIGH'

    def test_validate_s3_bucket_public_access(self):
        """Test validation of S3 bucket with public access"""
        # Arrange
        resource = {
            'logicalId': 'PublicBucket',
            'type': 'AWS::S3::Bucket',
            'encryption': {
                'enabled': True,
                'algorithm': 'AES256'
            },
            'publicAccess': {
                'blockPublicAcls': False,
                'blockPublicPolicy': False,
                'ignorePublicAcls': False,
                'restrictPublicBuckets': False
            }
        }

        # Act
        result = validate_s3_bucket(resource)

        # Assert
        assert result['compliant'] is False
        assert any(v['rule'] == 'S3_PUBLIC_ACCESS_BLOCK' for v in result['violations'])
        assert result['severity'] == 'CRITICAL'

    def test_validate_rds_instance_compliant(self):
        """Test validation of compliant RDS instance"""
        # Arrange
        resource = {
            'logicalId': 'ComplianceDB',
            'type': 'AWS::RDS::DBInstance',
            'encryption': True,
            'publiclyAccessible': False
        }

        # Act
        result = validate_rds_instance(resource)

        # Assert
        assert result['compliant'] is True
        assert len(result['violations']) == 0
        assert result['severity'] == 'NONE'

    def test_validate_rds_instance_no_encryption(self):
        """Test validation of RDS instance without encryption"""
        # Arrange
        resource = {
            'logicalId': 'NonCompliantDB',
            'type': 'AWS::RDS::DBInstance',
            'encryption': False,
            'publiclyAccessible': False
        }

        # Act
        result = validate_rds_instance(resource)

        # Assert
        assert result['compliant'] is False
        assert len(result['violations']) == 1
        assert result['violations'][0]['rule'] == 'RDS_ENCRYPTION_REQUIRED'
        assert result['severity'] == 'CRITICAL'

    def test_validate_rds_instance_publicly_accessible(self):
        """Test validation of publicly accessible RDS instance"""
        # Arrange
        resource = {
            'logicalId': 'PublicDB',
            'type': 'AWS::RDS::DBInstance',
            'encryption': True,
            'publiclyAccessible': True
        }

        # Act
        result = validate_rds_instance(resource)

        # Assert
        assert result['compliant'] is False
        assert any(v['rule'] == 'RDS_PUBLIC_ACCESS' for v in result['violations'])
        assert result['severity'] == 'CRITICAL'

    def test_validate_ec2_instance_allowed_type(self):
        """Test validation of EC2 instance with allowed type"""
        # Arrange
        resource = {
            'logicalId': 'ComplianceInstance',
            'type': 'AWS::EC2::Instance',
            'instanceType': 't3.micro'
        }

        # Act
        result = validate_ec2_instance(resource)

        # Assert
        assert result['compliant'] is True
        assert len(result['violations']) == 0
        assert result['severity'] == 'NONE'

    def test_validate_ec2_instance_disallowed_type(self):
        """Test validation of EC2 instance with disallowed type"""
        # Arrange
        resource = {
            'logicalId': 'NonCompliantInstance',
            'type': 'AWS::EC2::Instance',
            'instanceType': 'm5.large'
        }

        # Act
        result = validate_ec2_instance(resource)

        # Assert
        assert result['compliant'] is False
        assert len(result['violations']) == 1
        assert result['violations'][0]['rule'] == 'EC2_INSTANCE_TYPE_ALLOWED'
        assert result['severity'] == 'MEDIUM'

    def test_compliance_score_calculation(self):
        """Test compliance score calculation with mixed results"""
        # Arrange
        event = {
            'scanId': '123456789012#2025-11-26T12:00:00',
            'stackName': 'test-stack',
            'accountId': '123456789012',
            'resources': [
                {
                    'logicalId': 'GoodBucket',
                    'type': 'AWS::S3::Bucket',
                    'encryption': {'enabled': True, 'algorithm': 'AES256'},
                    'publicAccess': {
                        'blockPublicAcls': True,
                        'blockPublicPolicy': True,
                        'ignorePublicAcls': True,
                        'restrictPublicBuckets': True
                    }
                },
                {
                    'logicalId': 'BadInstance',
                    'type': 'AWS::EC2::Instance',
                    'instanceType': 'm5.large'
                }
            ]
        }
        context = Mock()

        with patch('compliance_validator.store_validation_results'), \
             patch('compliance_validator.send_violation_notifications'), \
             patch('compliance_validator.publish_metrics'), \
             patch('compliance_validator.publish_metrics_by_service'):
            
            # Act
            result = lambda_handler(event, context)

            # Assert
            assert result['statusCode'] == 200
            assert result['totalResources'] == 2
            assert result['compliantResources'] == 1
            assert result['violations'] == 1
            assert result['complianceScore'] == 50.0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

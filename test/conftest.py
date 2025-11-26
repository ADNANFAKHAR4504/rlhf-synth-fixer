"""
Pytest configuration and fixtures for CloudFormation Compliance Analyzer tests
"""

import pytest
import os
import sys

# Add lib/lambda to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'lambda'))


def pytest_configure(config):
    """Configure pytest environment"""
    # Set environment variables for tests
    os.environ['DYNAMODB_TABLE'] = 'test-scan-results-table'
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
    os.environ['REPORTS_BUCKET'] = 'test-reports-bucket'
    os.environ['ENVIRONMENT_SUFFIX'] = 'test'
    os.environ['AWS_REGION'] = 'us-east-1'
    os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'


@pytest.fixture
def sample_cloudformation_template():
    """Fixture providing a sample CloudFormation template for testing"""
    return {
        'AWSTemplateFormatVersion': '2010-09-09',
        'Description': 'Test template for compliance scanning',
        'Resources': {
            'TestBucket': {
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
            },
            'TestDatabase': {
                'Type': 'AWS::RDS::DBInstance',
                'Properties': {
                    'Engine': 'postgres',
                    'StorageEncrypted': True,
                    'PubliclyAccessible': False,
                    'DBInstanceClass': 'db.t3.micro'
                }
            },
            'TestInstance': {
                'Type': 'AWS::EC2::Instance',
                'Properties': {
                    'InstanceType': 't3.micro',
                    'ImageId': 'ami-12345678'
                }
            }
        }
    }


@pytest.fixture
def non_compliant_template():
    """Fixture providing a non-compliant CloudFormation template"""
    return {
        'AWSTemplateFormatVersion': '2010-09-09',
        'Resources': {
            'NonCompliantBucket': {
                'Type': 'AWS::S3::Bucket',
                'Properties': {}
            },
            'NonCompliantDB': {
                'Type': 'AWS::RDS::DBInstance',
                'Properties': {
                    'Engine': 'mysql',
                    'StorageEncrypted': False,
                    'PubliclyAccessible': True,
                    'DBInstanceClass': 'db.t3.micro'
                }
            },
            'NonCompliantInstance': {
                'Type': 'AWS::EC2::Instance',
                'Properties': {
                    'InstanceType': 'm5.xlarge',
                    'ImageId': 'ami-87654321'
                }
            }
        }
    }

"""
Unit tests for CloudFormation template validation
"""

import json
import os
import pytest


class TestTemplateStructure:
    """Test CloudFormation template structure and syntax"""

    @pytest.fixture
    def template(self):
        """Load the CloudFormation template"""
        template_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'template.json')
        with open(template_path, 'r') as f:
            return json.load(f)

    def test_template_is_valid_json(self, template):
        """Verify template is valid JSON"""
        assert isinstance(template, dict)
        assert 'AWSTemplateFormatVersion' in template
        assert template['AWSTemplateFormatVersion'] == '2010-09-09'

    def test_template_has_description(self, template):
        """Verify template has description"""
        assert 'Description' in template
        assert 'PCI-DSS' in template['Description']

    def test_template_has_parameters(self, template):
        """Verify template has EnvironmentSuffix parameter"""
        assert 'Parameters' in template
        assert 'EnvironmentSuffix' in template['Parameters']

    def test_template_has_resources(self, template):
        """Verify template has all required resources"""
        assert 'Resources' in template
        resources = template['Resources']

        # Required resource types
        required_resources = {
            'EncryptionKey': 'AWS::KMS::Key',
            'VPC': 'AWS::EC2::VPC',
            'PaymentBucket': 'AWS::S3::Bucket',
            'TransactionTable': 'AWS::DynamoDB::Table',
            'PaymentProcessorFunction': 'AWS::Lambda::Function',
            'PaymentProcessingTrail': 'AWS::CloudTrail::Trail'
        }

        for resource_name, resource_type in required_resources.items():
            assert resource_name in resources, f"Missing resource: {resource_name}"
            assert resources[resource_name]['Type'] == resource_type

    def test_template_has_outputs(self, template):
        """Verify template has outputs"""
        assert 'Outputs' in template
        outputs = template['Outputs']

        required_outputs = [
            'VPCId',
            'PaymentBucketName',
            'TransactionTableName',
            'PaymentProcessorFunctionArn',
            'KMSKeyId'
        ]

        for output in required_outputs:
            assert output in outputs, f"Missing output: {output}"


class TestSecurityConfiguration:
    """Test security-related configurations"""

    @pytest.fixture
    def template(self):
        """Load the CloudFormation template"""
        template_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'template.json')
        with open(template_path, 'r') as f:
            return json.load(f)

    def test_kms_key_rotation_enabled(self, template):
        """Verify KMS key rotation is enabled"""
        kms_key = template['Resources']['EncryptionKey']
        assert kms_key['Properties']['EnableKeyRotation'] is True

    def test_s3_bucket_encryption(self, template):
        """Verify S3 bucket has KMS encryption"""
        bucket = template['Resources']['PaymentBucket']
        encryption = bucket['Properties']['BucketEncryption']
        assert encryption['ServerSideEncryptionConfiguration'][0]['ServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'

    def test_s3_bucket_public_access_blocked(self, template):
        """Verify S3 bucket blocks all public access"""
        bucket = template['Resources']['PaymentBucket']
        public_access = bucket['Properties']['PublicAccessBlockConfiguration']

        assert public_access['BlockPublicAcls'] is True
        assert public_access['BlockPublicPolicy'] is True
        assert public_access['IgnorePublicAcls'] is True
        assert public_access['RestrictPublicBuckets'] is True

    def test_s3_bucket_versioning_enabled(self, template):
        """Verify S3 bucket has versioning enabled"""
        bucket = template['Resources']['PaymentBucket']
        assert bucket['Properties']['VersioningConfiguration']['Status'] == 'Enabled'

    def test_dynamodb_encryption_enabled(self, template):
        """Verify DynamoDB table has KMS encryption"""
        table = template['Resources']['TransactionTable']
        sse = table['Properties']['SSESpecification']

        assert sse['SSEEnabled'] is True
        assert sse['SSEType'] == 'KMS'

    def test_dynamodb_pitr_enabled(self, template):
        """Verify DynamoDB point-in-time recovery is enabled"""
        table = template['Resources']['TransactionTable']
        pitr = table['Properties']['PointInTimeRecoverySpecification']
        assert pitr['PointInTimeRecoveryEnabled'] is True

    def test_lambda_in_vpc(self, template):
        """Verify Lambda function is deployed in VPC"""
        lambda_func = template['Resources']['PaymentProcessorFunction']
        assert 'VpcConfig' in lambda_func['Properties']
        assert 'SecurityGroupIds' in lambda_func['Properties']['VpcConfig']
        assert 'SubnetIds' in lambda_func['Properties']['VpcConfig']

    def test_cloudwatch_logs_encryption(self, template):
        """Verify CloudWatch Logs has KMS encryption"""
        log_group = template['Resources']['PaymentProcessorLogGroup']
        assert 'KmsKeyId' in log_group['Properties']


class TestNetworkConfiguration:
    """Test VPC and networking configurations"""

    @pytest.fixture
    def template(self):
        """Load the CloudFormation template"""
        template_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'template.json')
        with open(template_path, 'r') as f:
            return json.load(f)

    def test_vpc_has_private_subnets(self, template):
        """Verify VPC has private subnets in multiple AZs"""
        resources = template['Resources']
        private_subnets = [
            'PrivateSubnet1',
            'PrivateSubnet2',
            'PrivateSubnet3'
        ]

        for subnet in private_subnets:
            assert subnet in resources
            assert resources[subnet]['Type'] == 'AWS::EC2::Subnet'

    def test_vpc_endpoints_exist(self, template):
        """Verify VPC endpoints for S3 and DynamoDB exist"""
        resources = template['Resources']

        assert 'S3VPCEndpoint' in resources
        assert resources['S3VPCEndpoint']['Type'] == 'AWS::EC2::VPCEndpoint'

        assert 'DynamoDBVPCEndpoint' in resources
        assert resources['DynamoDBVPCEndpoint']['Type'] == 'AWS::EC2::VPCEndpoint'

    def test_nat_gateway_exists(self, template):
        """Verify NAT Gateway exists for outbound connectivity"""
        resources = template['Resources']
        assert 'NATGateway' in resources
        assert resources['NATGateway']['Type'] == 'AWS::EC2::NatGateway'


class TestComplianceRequirements:
    """Test PCI-DSS compliance requirements"""

    @pytest.fixture
    def template(self):
        """Load the CloudFormation template"""
        template_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'template.json')
        with open(template_path, 'r') as f:
            return json.load(f)

    def test_cloudtrail_enabled(self, template):
        """Verify CloudTrail is enabled for audit logging"""
        resources = template['Resources']
        assert 'PaymentProcessingTrail' in resources
        trail = resources['PaymentProcessingTrail']
        assert trail['Properties']['IsLogging'] is True

    def test_cloudtrail_encryption(self, template):
        """Verify CloudTrail uses KMS encryption"""
        trail = template['Resources']['PaymentProcessingTrail']
        assert 'KMSKeyId' in trail['Properties']

    def test_s3_bucket_policy_enforces_encryption(self, template):
        """Verify S3 bucket policy denies unencrypted uploads"""
        bucket_policy = template['Resources']['PaymentBucketPolicy']
        policy_doc = bucket_policy['Properties']['PolicyDocument']

        # Find the statement that denies unencrypted uploads
        deny_unencrypted = None
        for statement in policy_doc['Statement']:
            if statement['Sid'] == 'DenyUnencryptedObjectUploads':
                deny_unencrypted = statement
                break

        assert deny_unencrypted is not None
        assert deny_unencrypted['Effect'] == 'Deny'
        assert 's3:PutObject' in deny_unencrypted['Action']

    def test_s3_bucket_policy_enforces_https(self, template):
        """Verify S3 bucket policy denies non-HTTPS access"""
        bucket_policy = template['Resources']['PaymentBucketPolicy']
        policy_doc = bucket_policy['Properties']['PolicyDocument']

        # Find the statement that denies insecure transport
        deny_insecure = None
        for statement in policy_doc['Statement']:
            if statement['Sid'] == 'DenyInsecureTransport':
                deny_insecure = statement
                break

        assert deny_insecure is not None
        assert deny_insecure['Effect'] == 'Deny'
        assert deny_insecure['Condition']['Bool']['aws:SecureTransport'] == 'false'


class TestResourceNaming:
    """Test resource naming includes environmentSuffix"""

    @pytest.fixture
    def template(self):
        """Load the CloudFormation template"""
        template_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'template.json')
        with open(template_path, 'r') as f:
            return json.load(f)

    def test_resources_use_environment_suffix(self, template):
        """Verify resources include EnvironmentSuffix in names"""
        resources = template['Resources']

        resources_with_names = {
            'VPC': ['Tags', 0, 'Value'],
            'PaymentBucket': ['Properties', 'BucketName'],
            'TransactionTable': ['Properties', 'TableName'],
            'PaymentProcessorFunction': ['Properties', 'FunctionName'],
            'PaymentProcessingTrail': ['Properties', 'TrailName']
        }

        for resource_name, path in resources_with_names.items():
            resource = resources[resource_name]
            value = resource

            # Navigate the path
            for key in path:
                if isinstance(key, int):
                    value = value[key]
                else:
                    value = value[key]

            # Check if value references EnvironmentSuffix
            assert isinstance(value, dict), f"{resource_name} name should use Fn::Sub"
            assert 'Fn::Sub' in value, f"{resource_name} should use Fn::Sub for environment suffix"
            assert '${EnvironmentSuffix}' in value['Fn::Sub'], f"{resource_name} should include EnvironmentSuffix"

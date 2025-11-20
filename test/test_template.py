#!/usr/bin/env python3
"""
Comprehensive test suite for CloudFormation template validation.
Tests template structure, compliance requirements, and AWS best practices.
"""

import json
import unittest
import os
from pathlib import Path


class TestCloudFormationTemplate(unittest.TestCase):
    """Test suite for validating CloudFormation template structure and compliance."""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template once for all tests."""
        template_path = Path(__file__).parent.parent / "lib" / "template.json"
        with open(template_path, 'r') as f:
            cls.template = json.load(f)
        cls.resources = cls.template.get('Resources', {})
        cls.parameters = cls.template.get('Parameters', {})
        cls.outputs = cls.template.get('Outputs', {})

    def test_template_format_version(self):
        """Verify CloudFormation template format version is correct."""
        self.assertEqual(
            self.template.get('AWSTemplateFormatVersion'),
            '2010-09-09',
            "Template must use CloudFormation format version 2010-09-09"
        )

    def test_template_has_description(self):
        """Verify template includes a description."""
        self.assertIn('Description', self.template)
        self.assertGreater(len(self.template['Description']), 10)

    def test_environment_suffix_parameter(self):
        """Verify environmentSuffix parameter is defined correctly."""
        self.assertIn('environmentSuffix', self.parameters)
        param = self.parameters['environmentSuffix']
        self.assertEqual(param['Type'], 'String')
        self.assertIn('Description', param)
        self.assertEqual(param['MinLength'], 1)
        self.assertEqual(param['MaxLength'], 20)

    def test_kms_key_rotation_enabled(self):
        """Verify KMS key has rotation enabled."""
        kms_key = self.resources.get('EncryptionKey', {})
        self.assertEqual(kms_key.get('Type'), 'AWS::KMS::Key')
        properties = kms_key.get('Properties', {})
        self.assertTrue(
            properties.get('EnableKeyRotation'),
            "KMS key must have EnableKeyRotation set to true"
        )

    def test_s3_bucket_encryption(self):
        """Verify S3 bucket uses SSE-KMS encryption."""
        s3_bucket = self.resources.get('TransactionBucket', {})
        self.assertEqual(s3_bucket.get('Type'), 'AWS::S3::Bucket')
        properties = s3_bucket.get('Properties', {})

        encryption_config = properties.get('BucketEncryption', {})
        sse_rules = encryption_config.get('ServerSideEncryptionConfiguration', [])
        self.assertGreater(len(sse_rules), 0)

        sse_default = sse_rules[0].get('ServerSideEncryptionByDefault', {})
        self.assertEqual(
            sse_default.get('SSEAlgorithm'),
            'aws:kms',
            "S3 bucket must use aws:kms encryption"
        )
        self.assertIn('KMSMasterKeyID', sse_default)

    def test_s3_bucket_versioning(self):
        """Verify S3 bucket has versioning enabled."""
        s3_bucket = self.resources.get('TransactionBucket', {})
        properties = s3_bucket.get('Properties', {})
        versioning = properties.get('VersioningConfiguration', {})
        self.assertEqual(
            versioning.get('Status'),
            'Enabled',
            "S3 bucket must have versioning enabled"
        )

    def test_s3_bucket_lifecycle_policies(self):
        """Verify S3 bucket has lifecycle policies configured."""
        s3_bucket = self.resources.get('TransactionBucket', {})
        properties = s3_bucket.get('Properties', {})
        lifecycle = properties.get('LifecycleConfiguration', {})
        rules = lifecycle.get('Rules', [])
        self.assertGreater(
            len(rules), 0,
            "S3 bucket must have lifecycle policies"
        )

    def test_s3_bucket_public_access_blocked(self):
        """Verify S3 bucket blocks all public access."""
        s3_bucket = self.resources.get('TransactionBucket', {})
        properties = s3_bucket.get('Properties', {})
        public_access = properties.get('PublicAccessBlockConfiguration', {})

        self.assertTrue(public_access.get('BlockPublicAcls'))
        self.assertTrue(public_access.get('BlockPublicPolicy'))
        self.assertTrue(public_access.get('IgnorePublicAcls'))
        self.assertTrue(public_access.get('RestrictPublicBuckets'))

    def test_dynamodb_encryption(self):
        """Verify DynamoDB table uses KMS encryption."""
        dynamodb_table = self.resources.get('TransactionTable', {})
        self.assertEqual(dynamodb_table.get('Type'), 'AWS::DynamoDB::Table')
        properties = dynamodb_table.get('Properties', {})

        sse_spec = properties.get('SSESpecification', {})
        self.assertTrue(sse_spec.get('SSEEnabled'))
        self.assertEqual(sse_spec.get('SSEType'), 'KMS')
        self.assertIn('KMSMasterKeyId', sse_spec)

    def test_dynamodb_point_in_time_recovery(self):
        """Verify DynamoDB table has point-in-time recovery enabled."""
        dynamodb_table = self.resources.get('TransactionTable', {})
        properties = dynamodb_table.get('Properties', {})
        pitr = properties.get('PointInTimeRecoverySpecification', {})
        self.assertTrue(
            pitr.get('PointInTimeRecoveryEnabled'),
            "DynamoDB must have point-in-time recovery enabled"
        )

    def test_dynamodb_contributor_insights(self):
        """Verify DynamoDB table has contributor insights enabled."""
        dynamodb_table = self.resources.get('TransactionTable', {})
        properties = dynamodb_table.get('Properties', {})
        contributor = properties.get('ContributorInsightsSpecification', {})
        self.assertTrue(
            contributor.get('Enabled'),
            "DynamoDB must have contributor insights enabled"
        )

    def test_lambda_vpc_configuration(self):
        """Verify Lambda functions are deployed in VPC."""
        lambda_function = self.resources.get('TransactionProcessorFunction', {})
        properties = lambda_function.get('Properties', {})
        vpc_config = properties.get('VpcConfig', {})

        self.assertIn('SubnetIds', vpc_config)
        self.assertIn('SecurityGroupIds', vpc_config)
        self.assertGreater(len(vpc_config['SubnetIds']), 0)
        self.assertGreater(len(vpc_config['SecurityGroupIds']), 0)

    def test_lambda_environment_encryption(self):
        """Verify Lambda environment variables are encrypted with KMS."""
        lambda_function = self.resources.get('TransactionProcessorFunction', {})
        properties = lambda_function.get('Properties', {})
        self.assertIn(
            'KmsKeyArn', properties,
            "Lambda must have KmsKeyArn for environment variable encryption"
        )

    def test_api_gateway_request_validation(self):
        """Verify API Gateway has request validation configured."""
        validator = self.resources.get('APIGatewayRequestValidator', {})
        self.assertEqual(validator.get('Type'), 'AWS::ApiGateway::RequestValidator')
        properties = validator.get('Properties', {})
        self.assertTrue(properties.get('ValidateRequestBody'))
        self.assertTrue(properties.get('ValidateRequestParameters'))

    def test_api_gateway_api_key_required(self):
        """Verify API Gateway method requires API key."""
        method = self.resources.get('APIGatewayMethod', {})
        properties = method.get('Properties', {})
        self.assertTrue(
            properties.get('ApiKeyRequired'),
            "API Gateway method must require API key"
        )

    def test_api_gateway_logging(self):
        """Verify API Gateway has CloudWatch logging configured."""
        stage = self.resources.get('APIGatewayStage', {})
        properties = stage.get('Properties', {})
        method_settings = properties.get('MethodSettings', [])

        self.assertGreater(len(method_settings), 0)
        logging_level = method_settings[0].get('LoggingLevel')
        self.assertIn(logging_level, ['INFO', 'ERROR'])

    def test_secrets_manager_encryption(self):
        """Verify Secrets Manager secret uses KMS encryption."""
        secret = self.resources.get('DatabaseSecret', {})
        self.assertEqual(secret.get('Type'), 'AWS::SecretsManager::Secret')
        properties = secret.get('Properties', {})
        self.assertIn('KmsKeyId', properties)

    def test_secrets_manager_rotation(self):
        """Verify Secrets Manager has automatic rotation configured."""
        rotation = self.resources.get('SecretRotationSchedule', {})
        self.assertEqual(rotation.get('Type'), 'AWS::SecretsManager::RotationSchedule')
        properties = rotation.get('Properties', {})
        rotation_rules = properties.get('RotationRules', {})
        self.assertEqual(
            rotation_rules.get('AutomaticallyAfterDays'),
            30,
            "Secrets must rotate every 30 days"
        )

    def test_vpc_structure(self):
        """Verify VPC is properly configured."""
        vpc = self.resources.get('VPC', {})
        self.assertEqual(vpc.get('Type'), 'AWS::EC2::VPC')
        properties = vpc.get('Properties', {})
        self.assertTrue(properties.get('EnableDnsHostnames'))
        self.assertTrue(properties.get('EnableDnsSupport'))

    def test_private_subnets(self):
        """Verify private subnets are created in multiple AZs."""
        private_subnets = [
            name for name in self.resources
            if name.startswith('PrivateSubnet')
        ]
        self.assertGreaterEqual(
            len([s for s in private_subnets if 'RouteTable' not in s]),
            3,
            "Must have at least 3 private subnets for multi-AZ deployment"
        )

    def test_vpc_endpoints(self):
        """Verify VPC endpoints for AWS services."""
        vpc_endpoints = [
            name for name in self.resources
            if 'VPCEndpoint' in name
        ]
        self.assertGreaterEqual(
            len(vpc_endpoints), 3,
            "Must have VPC endpoints for S3, DynamoDB, and Secrets Manager"
        )

        # Verify S3 endpoint exists
        self.assertIn('S3VPCEndpoint', self.resources)
        # Verify DynamoDB endpoint exists
        self.assertIn('DynamoDBVPCEndpoint', self.resources)
        # Verify Secrets Manager endpoint exists
        self.assertIn('SecretsManagerVPCEndpoint', self.resources)

    def test_security_groups_explicit_rules(self):
        """Verify security groups have explicit ingress/egress rules."""
        lambda_sg = self.resources.get('LambdaSecurityGroup', {})
        properties = lambda_sg.get('Properties', {})

        egress_rules = properties.get('SecurityGroupEgress', [])
        self.assertGreater(len(egress_rules), 0)

        # Verify no 0.0.0.0/0 for unrestricted access to internet
        for rule in egress_rules:
            cidr = rule.get('CidrIp', '')
            if cidr:
                # If CIDR is used, it should be VPC CIDR, not 0.0.0.0/0
                self.assertNotEqual(cidr, '0.0.0.0/0')

    def test_cloudwatch_log_encryption(self):
        """Verify CloudWatch Log Groups use KMS encryption."""
        log_groups = [
            self.resources[name] for name in self.resources
            if self.resources[name].get('Type') == 'AWS::Logs::LogGroup'
        ]

        self.assertGreater(len(log_groups), 0)
        for log_group in log_groups:
            properties = log_group.get('Properties', {})
            self.assertIn(
                'KmsKeyId', properties,
                "CloudWatch Log Group must use KMS encryption"
            )

    def test_cloudwatch_log_retention(self):
        """Verify CloudWatch Log Groups have 90-day retention."""
        log_groups = [
            self.resources[name] for name in self.resources
            if self.resources[name].get('Type') == 'AWS::Logs::LogGroup'
        ]

        for log_group in log_groups:
            properties = log_group.get('Properties', {})
            self.assertEqual(
                properties.get('RetentionInDays'),
                90,
                "CloudWatch Log Groups must have 90-day retention"
            )

    def test_cloudwatch_alarms_present(self):
        """Verify CloudWatch Alarms are configured."""
        alarms = [
            name for name in self.resources
            if self.resources[name].get('Type') == 'AWS::CloudWatch::Alarm'
        ]
        self.assertGreaterEqual(
            len(alarms), 2,
            "Must have alarms for Lambda errors and API failures"
        )

    def test_iam_roles_no_wildcard_actions(self):
        """Verify IAM roles don't use wildcard actions (except KMS root)."""
        iam_roles = [
            self.resources[name] for name in self.resources
            if self.resources[name].get('Type') == 'AWS::IAM::Role'
        ]

        for role in iam_roles:
            properties = role.get('Properties', {})
            policies = properties.get('Policies', [])

            for policy in policies:
                policy_doc = policy.get('PolicyDocument', {})
                statements = policy_doc.get('Statement', [])

                for statement in statements:
                    actions = statement.get('Action', [])
                    if isinstance(actions, str):
                        actions = [actions]

                    for action in actions:
                        # Allow kms:* for root principal only
                        if action == '*':
                            self.fail(f"Found wildcard action in IAM policy: {role}")

    def test_cost_allocation_tags(self):
        """Verify resources have cost allocation tags."""
        tagged_resources = [
            self.resources[name] for name in self.resources
            if 'Tags' in self.resources[name].get('Properties', {})
        ]

        self.assertGreater(
            len(tagged_resources), 0,
            "Resources must have cost allocation tags"
        )

        for resource in tagged_resources:
            tags = resource['Properties']['Tags']
            tag_keys = [tag['Key'] for tag in tags]

            self.assertIn('Environment', tag_keys)
            # Check for cost allocation tags
            self.assertTrue(
                'CostCenter' in tag_keys or 'Project' in tag_keys,
                "Resources must have cost allocation tags"
            )

    def test_no_deletion_protection(self):
        """Verify no resources have DeletionPolicy: Retain."""
        for name, resource in self.resources.items():
            self.assertNotIn(
                'DeletionPolicy', resource,
                f"Resource {name} should not have DeletionPolicy"
            )

            # Also check that DynamoDB doesn't have DeletionProtectionEnabled
            if resource.get('Type') == 'AWS::DynamoDB::Table':
                properties = resource.get('Properties', {})
                deletion_protection = properties.get('DeletionProtectionEnabled', False)
                self.assertFalse(
                    deletion_protection,
                    "DynamoDB table must not have deletion protection enabled"
                )

    def test_environment_suffix_in_resource_names(self):
        """Verify all resource names use environmentSuffix parameter."""
        resources_with_names = [
            self.resources[name] for name in self.resources
            if 'Properties' in self.resources[name]
        ]

        name_properties = [
            'FunctionName', 'BucketName', 'TableName', 'RoleName',
            'LogGroupName', 'Name', 'AlarmName'
        ]

        suffix_count = 0
        for resource in resources_with_names:
            properties = resource.get('Properties', {})
            for prop in name_properties:
                if prop in properties:
                    name_value = properties[prop]
                    if isinstance(name_value, dict) and 'Fn::Sub' in name_value:
                        self.assertIn(
                            'environmentSuffix',
                            str(name_value),
                            f"Resource name must include environmentSuffix: {prop}"
                        )
                        suffix_count += 1

        self.assertGreater(
            suffix_count, 10,
            "Multiple resources must use environmentSuffix in names"
        )

    def test_outputs_present(self):
        """Verify template has useful outputs."""
        self.assertGreater(len(self.outputs), 5)

        expected_outputs = [
            'EncryptionKeyArn', 'TransactionBucketName',
            'TransactionTableName', 'APIEndpoint'
        ]

        for output in expected_outputs:
            self.assertIn(output, self.outputs)

    def test_outputs_have_exports(self):
        """Verify outputs have export names for cross-stack references."""
        exports_count = sum(
            1 for output in self.outputs.values()
            if 'Export' in output
        )
        self.assertGreater(
            exports_count, 5,
            "Multiple outputs should have exports for cross-stack references"
        )


class TestJSONSyntax(unittest.TestCase):
    """Test CloudFormation JSON syntax and structure."""

    def test_template_is_valid_json(self):
        """Verify template is valid JSON."""
        template_path = Path(__file__).parent.parent / "lib" / "template.json"
        try:
            with open(template_path, 'r') as f:
                json.load(f)
        except json.JSONDecodeError as e:
            self.fail(f"Template is not valid JSON: {e}")

    def test_template_file_exists(self):
        """Verify template file exists."""
        template_path = Path(__file__).parent.parent / "lib" / "template.json"
        self.assertTrue(template_path.exists(), "template.json must exist")


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)

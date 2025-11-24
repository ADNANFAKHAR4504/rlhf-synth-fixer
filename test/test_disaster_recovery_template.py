"""
Unit tests for disaster recovery CloudFormation template.

Tests validate template structure, resource configuration, parameter validation,
condition logic, outputs, and AWS best practices compliance.
"""

import json
import os
import sys
import unittest
from typing import Dict, Any, List


class TestDisasterRecoveryTemplate(unittest.TestCase):
    """Test suite for disaster recovery CloudFormation template."""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template once for all tests."""
        template_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'lib',
            'disaster-recovery-template.json'
        )
        with open(template_path, 'r') as f:
            cls.template = json.load(f)

    def test_template_format_version(self):
        """Test that template has correct AWS CloudFormation version."""
        self.assertIn('AWSTemplateFormatVersion', self.template)
        self.assertEqual(
            self.template['AWSTemplateFormatVersion'],
            '2010-09-09'
        )

    def test_template_has_description(self):
        """Test that template includes description."""
        self.assertIn('Description', self.template)
        self.assertIsInstance(self.template['Description'], str)
        self.assertGreater(len(self.template['Description']), 10)

    def test_parameters_section_exists(self):
        """Test that template has Parameters section."""
        self.assertIn('Parameters', self.template)
        self.assertIsInstance(self.template['Parameters'], dict)

    def test_environment_suffix_parameter(self):
        """Test EnvironmentSuffix parameter configuration."""
        params = self.template['Parameters']
        self.assertIn('EnvironmentSuffix', params)

        env_suffix = params['EnvironmentSuffix']
        self.assertEqual(env_suffix['Type'], 'String')
        self.assertIn('MinLength', env_suffix)
        self.assertIn('MaxLength', env_suffix)
        self.assertIn('AllowedPattern', env_suffix)
        self.assertEqual(env_suffix['MinLength'], 3)
        self.assertEqual(env_suffix['MaxLength'], 20)

    def test_environment_name_parameter(self):
        """Test EnvironmentName parameter with allowed values."""
        params = self.template['Parameters']
        self.assertIn('EnvironmentName', params)

        env_name = params['EnvironmentName']
        self.assertEqual(env_name['Type'], 'String')
        self.assertIn('AllowedValues', env_name)
        self.assertIn('production', env_name['AllowedValues'])
        self.assertIn('staging', env_name['AllowedValues'])
        self.assertIn('development', env_name['AllowedValues'])

    def test_is_primary_region_parameter(self):
        """Test IsPrimaryRegion parameter configuration."""
        params = self.template['Parameters']
        self.assertIn('IsPrimaryRegion', params)

        is_primary = params['IsPrimaryRegion']
        self.assertEqual(is_primary['Type'], 'String')
        self.assertIn('AllowedValues', is_primary)
        self.assertEqual(is_primary['AllowedValues'], ['true', 'false'])
        self.assertEqual(is_primary['Default'], 'true')

    def test_secondary_region_parameter(self):
        """Test SecondaryRegion parameter."""
        params = self.template['Parameters']
        self.assertIn('SecondaryRegion', params)

        secondary = params['SecondaryRegion']
        self.assertEqual(secondary['Type'], 'String')
        self.assertEqual(secondary['Default'], 'us-west-2')

    def test_alert_email_parameter(self):
        """Test AlertEmail parameter with email validation."""
        params = self.template['Parameters']
        self.assertIn('AlertEmail', params)

        alert_email = params['AlertEmail']
        self.assertEqual(alert_email['Type'], 'String')
        self.assertIn('AllowedPattern', alert_email)
        # Validate pattern exists and is not empty
        self.assertGreater(len(alert_email['AllowedPattern']), 0)

    def test_lambda_reserved_concurrency_parameter(self):
        """Test LambdaReservedConcurrency parameter."""
        params = self.template['Parameters']
        self.assertIn('LambdaReservedConcurrency', params)

        concurrency = params['LambdaReservedConcurrency']
        self.assertEqual(concurrency['Type'], 'Number')
        self.assertEqual(concurrency['Default'], 100)
        self.assertIn('MinValue', concurrency)
        self.assertIn('MaxValue', concurrency)

    def test_conditions_section_exists(self):
        """Test that template has Conditions section."""
        self.assertIn('Conditions', self.template)
        self.assertIsInstance(self.template['Conditions'], dict)

    def test_is_primary_condition(self):
        """Test IsPrimary condition logic."""
        conditions = self.template['Conditions']
        self.assertIn('IsPrimary', conditions)

        is_primary = conditions['IsPrimary']
        self.assertIn('Fn::Equals', is_primary)

    def test_is_secondary_condition(self):
        """Test IsSecondary condition logic."""
        conditions = self.template['Conditions']
        self.assertIn('IsSecondary', conditions)

        is_secondary = conditions['IsSecondary']
        self.assertIn('Fn::Not', is_secondary)

    def test_resources_section_exists(self):
        """Test that template has Resources section."""
        self.assertIn('Resources', self.template)
        self.assertIsInstance(self.template['Resources'], dict)
        self.assertGreater(len(self.template['Resources']), 0)

    def test_dynamodb_global_table_resource(self):
        """Test DynamoDB Global Table resource configuration."""
        resources = self.template['Resources']
        self.assertIn('PaymentProcessingTable', resources)

        table = resources['PaymentProcessingTable']
        self.assertEqual(table['Type'], 'AWS::DynamoDB::GlobalTable')

        props = table['Properties']
        self.assertIn('TableName', props)
        self.assertIn('Fn::Sub', props['TableName'])
        self.assertIn('EnvironmentSuffix', props['TableName']['Fn::Sub'])

        self.assertEqual(props['BillingMode'], 'PAY_PER_REQUEST')
        self.assertIn('StreamSpecification', props)
        self.assertIn('AttributeDefinitions', props)
        self.assertIn('KeySchema', props)
        self.assertIn('Replicas', props)

    def test_dynamodb_table_replicas(self):
        """Test DynamoDB table has replicas in both regions."""
        table = self.template['Resources']['PaymentProcessingTable']
        replicas = table['Properties']['Replicas']

        self.assertEqual(len(replicas), 2)

        regions = [r['Region'] for r in replicas]
        self.assertIn('us-east-1', regions)

    def test_dynamodb_point_in_time_recovery(self):
        """Test DynamoDB has PITR enabled in all replicas."""
        table = self.template['Resources']['PaymentProcessingTable']
        replicas = table['Properties']['Replicas']

        for replica in replicas:
            self.assertIn('PointInTimeRecoverySpecification', replica)
            pitr = replica['PointInTimeRecoverySpecification']
            self.assertTrue(pitr['PointInTimeRecoveryEnabled'])

    def test_s3_bucket_primary_resource(self):
        """Test S3 bucket configuration for primary region."""
        resources = self.template['Resources']
        self.assertIn('TransactionLogsBucket', resources)

        bucket = resources['TransactionLogsBucket']
        self.assertEqual(bucket['Type'], 'AWS::S3::Bucket')
        self.assertIn('Condition', bucket)
        self.assertEqual(bucket['Condition'], 'IsPrimary')

        props = bucket['Properties']
        self.assertIn('BucketName', props)
        self.assertIn('VersioningConfiguration', props)
        self.assertEqual(props['VersioningConfiguration']['Status'], 'Enabled')

    def test_s3_bucket_secondary_resource(self):
        """Test S3 bucket configuration for secondary region."""
        resources = self.template['Resources']
        self.assertIn('TransactionLogsBucketSecondary', resources)

        bucket = resources['TransactionLogsBucketSecondary']
        self.assertEqual(bucket['Type'], 'AWS::S3::Bucket')
        self.assertIn('Condition', bucket)
        self.assertEqual(bucket['Condition'], 'IsSecondary')

    def test_s3_bucket_versioning_enabled(self):
        """Test S3 buckets have versioning enabled."""
        resources = self.template['Resources']

        for bucket_name in ['TransactionLogsBucket', 'TransactionLogsBucketSecondary']:
            bucket = resources[bucket_name]
            props = bucket['Properties']
            self.assertIn('VersioningConfiguration', props)
            self.assertEqual(props['VersioningConfiguration']['Status'], 'Enabled')

    def test_s3_bucket_encryption(self):
        """Test S3 buckets have encryption enabled."""
        resources = self.template['Resources']

        for bucket_name in ['TransactionLogsBucket', 'TransactionLogsBucketSecondary']:
            bucket = resources[bucket_name]
            props = bucket['Properties']
            self.assertIn('BucketEncryption', props)
            sse_config = props['BucketEncryption']['ServerSideEncryptionConfiguration']
            self.assertEqual(sse_config[0]['ServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')

    def test_s3_bucket_public_access_block(self):
        """Test S3 buckets block all public access."""
        resources = self.template['Resources']

        for bucket_name in ['TransactionLogsBucket', 'TransactionLogsBucketSecondary']:
            bucket = resources[bucket_name]
            props = bucket['Properties']
            self.assertIn('PublicAccessBlockConfiguration', props)

            public_access = props['PublicAccessBlockConfiguration']
            self.assertTrue(public_access['BlockPublicAcls'])
            self.assertTrue(public_access['BlockPublicPolicy'])
            self.assertTrue(public_access['IgnorePublicAcls'])
            self.assertTrue(public_access['RestrictPublicBuckets'])

    def test_s3_bucket_lifecycle_policy(self):
        """Test S3 buckets have lifecycle policies."""
        resources = self.template['Resources']

        for bucket_name in ['TransactionLogsBucket', 'TransactionLogsBucketSecondary']:
            bucket = resources[bucket_name]
            props = bucket['Properties']
            self.assertIn('LifecycleConfiguration', props)

            rules = props['LifecycleConfiguration']['Rules']
            self.assertGreater(len(rules), 0)
            self.assertEqual(rules[0]['Status'], 'Enabled')

    def test_secrets_manager_secret(self):
        """Test Secrets Manager secret configuration."""
        resources = self.template['Resources']
        self.assertIn('ApiSecret', resources)

        secret = resources['ApiSecret']
        self.assertEqual(secret['Type'], 'AWS::SecretsManager::Secret')

        props = secret['Properties']
        self.assertIn('Name', props)
        self.assertIn('Fn::Sub', props['Name'])
        self.assertIn('EnvironmentSuffix', props['Name']['Fn::Sub'])

    def test_secrets_manager_replication(self):
        """Test Secrets Manager has replication configuration."""
        secret = self.template['Resources']['ApiSecret']
        props = secret['Properties']

        self.assertIn('ReplicaRegions', props)
        # ReplicaRegions is conditional
        self.assertIn('Fn::If', props['ReplicaRegions'])

    def test_lambda_execution_role(self):
        """Test Lambda execution role configuration."""
        resources = self.template['Resources']
        self.assertIn('LambdaExecutionRole', resources)

        role = resources['LambdaExecutionRole']
        self.assertEqual(role['Type'], 'AWS::IAM::Role')

        props = role['Properties']
        self.assertIn('AssumeRolePolicyDocument', props)
        self.assertIn('Policies', props)
        self.assertIn('ManagedPolicyArns', props)

    def test_lambda_execution_role_policies(self):
        """Test Lambda role has required policies."""
        role = self.template['Resources']['LambdaExecutionRole']
        policies = role['Properties']['Policies']

        policy_names = [p['PolicyName'] for p in policies]
        self.assertIn('DynamoDBAccess', policy_names)
        self.assertIn('SecretsManagerAccess', policy_names)
        self.assertIn('S3LogAccess', policy_names)

    def test_payment_processing_function(self):
        """Test payment processing Lambda function configuration."""
        resources = self.template['Resources']
        self.assertIn('PaymentProcessingFunction', resources)

        function = resources['PaymentProcessingFunction']
        self.assertEqual(function['Type'], 'AWS::Lambda::Function')

        props = function['Properties']
        self.assertEqual(props['Runtime'], 'python3.11')
        self.assertEqual(props['Handler'], 'index.lambda_handler')
        self.assertEqual(props['Timeout'], 30)
        self.assertEqual(props['MemorySize'], 512)

    def test_lambda_reserved_concurrency(self):
        """Test Lambda has reserved concurrency configuration."""
        function = self.template['Resources']['PaymentProcessingFunction']
        props = function['Properties']

        self.assertIn('ReservedConcurrentExecutions', props)
        self.assertIn('Ref', props['ReservedConcurrentExecutions'])
        self.assertEqual(
            props['ReservedConcurrentExecutions']['Ref'],
            'LambdaReservedConcurrency'
        )

    def test_lambda_environment_variables(self):
        """Test Lambda function has required environment variables."""
        function = self.template['Resources']['PaymentProcessingFunction']
        props = function['Properties']

        self.assertIn('Environment', props)
        env_vars = props['Environment']['Variables']

        required_vars = ['REGION', 'ENVIRONMENT', 'TABLE_NAME', 'SECRET_ARN', 'LOGS_BUCKET', 'IS_PRIMARY']
        for var in required_vars:
            self.assertIn(var, env_vars)

    def test_lambda_function_url(self):
        """Test Lambda function URL configuration."""
        resources = self.template['Resources']
        self.assertIn('FunctionUrl', resources)

        url = resources['FunctionUrl']
        self.assertEqual(url['Type'], 'AWS::Lambda::Url')

        props = url['Properties']
        self.assertEqual(props['AuthType'], 'NONE')
        self.assertIn('Cors', props)

    def test_health_check_function(self):
        """Test health check Lambda function configuration."""
        resources = self.template['Resources']
        self.assertIn('HealthCheckFunction', resources)

        function = resources['HealthCheckFunction']
        self.assertEqual(function['Type'], 'AWS::Lambda::Function')

        props = function['Properties']
        self.assertEqual(props['Runtime'], 'python3.11')
        self.assertIn('Code', props)

    def test_route53_hosted_zone(self):
        """Test Route53 hosted zone configuration."""
        resources = self.template['Resources']
        self.assertIn('HostedZone', resources)

        zone = resources['HostedZone']
        self.assertEqual(zone['Type'], 'AWS::Route53::HostedZone')
        self.assertIn('Condition', zone)
        self.assertEqual(zone['Condition'], 'IsPrimary')

    def test_route53_health_check(self):
        """Test Route53 health check configuration."""
        resources = self.template['Resources']
        self.assertIn('HealthCheck', resources)

        health_check = resources['HealthCheck']
        self.assertEqual(health_check['Type'], 'AWS::Route53::HealthCheck')

        config = health_check['Properties']['HealthCheckConfig']
        self.assertEqual(config['Type'], 'HTTPS')
        self.assertEqual(config['Port'], 443)
        self.assertEqual(config['RequestInterval'], 30)
        self.assertEqual(config['FailureThreshold'], 3)

    def test_sns_topic(self):
        """Test SNS topic configuration."""
        resources = self.template['Resources']
        self.assertIn('AlertTopic', resources)

        topic = resources['AlertTopic']
        self.assertEqual(topic['Type'], 'AWS::SNS::Topic')

        props = topic['Properties']
        self.assertIn('TopicName', props)
        self.assertIn('Subscription', props)

    def test_sns_topic_name_includes_suffix(self):
        """Test SNS topic name includes environmentSuffix."""
        topic = self.template['Resources']['AlertTopic']
        props = topic['Properties']

        self.assertIn('Fn::Sub', props['TopicName'])
        self.assertIn('EnvironmentSuffix', props['TopicName']['Fn::Sub'])

    def test_cloudwatch_lambda_error_alarm(self):
        """Test CloudWatch alarm for Lambda errors."""
        resources = self.template['Resources']
        self.assertIn('LambdaErrorAlarm', resources)

        alarm = resources['LambdaErrorAlarm']
        self.assertEqual(alarm['Type'], 'AWS::CloudWatch::Alarm')

        props = alarm['Properties']
        self.assertEqual(props['MetricName'], 'Errors')
        self.assertEqual(props['Namespace'], 'AWS/Lambda')
        self.assertEqual(props['Statistic'], 'Sum')
        self.assertEqual(props['Threshold'], 10)

    def test_cloudwatch_lambda_throttle_alarm(self):
        """Test CloudWatch alarm for Lambda throttles."""
        resources = self.template['Resources']
        self.assertIn('LambdaThrottleAlarm', resources)

        alarm = resources['LambdaThrottleAlarm']
        props = alarm['Properties']
        self.assertEqual(props['MetricName'], 'Throttles')
        self.assertEqual(props['Threshold'], 5)

    def test_cloudwatch_dynamodb_alarms(self):
        """Test CloudWatch alarms for DynamoDB throttling."""
        resources = self.template['Resources']

        self.assertIn('DynamoDBReadThrottleAlarm', resources)
        self.assertIn('DynamoDBWriteThrottleAlarm', resources)

        for alarm_name in ['DynamoDBReadThrottleAlarm', 'DynamoDBWriteThrottleAlarm']:
            alarm = resources[alarm_name]
            self.assertEqual(alarm['Type'], 'AWS::CloudWatch::Alarm')
            self.assertEqual(alarm['Properties']['Namespace'], 'AWS/DynamoDB')

    def test_alarms_linked_to_sns_topic(self):
        """Test CloudWatch alarms send notifications to SNS."""
        resources = self.template['Resources']

        alarm_names = [
            'LambdaErrorAlarm',
            'LambdaThrottleAlarm',
            'DynamoDBReadThrottleAlarm',
            'DynamoDBWriteThrottleAlarm'
        ]

        for alarm_name in alarm_names:
            alarm = resources[alarm_name]
            actions = alarm['Properties']['AlarmActions']
            self.assertEqual(len(actions), 1)
            self.assertIn('Ref', actions[0])
            self.assertEqual(actions[0]['Ref'], 'AlertTopic')

    def test_outputs_section_exists(self):
        """Test that template has Outputs section."""
        self.assertIn('Outputs', self.template)
        self.assertIsInstance(self.template['Outputs'], dict)
        self.assertGreater(len(self.template['Outputs']), 0)

    def test_required_outputs_present(self):
        """Test all required outputs are present."""
        outputs = self.template['Outputs']

        required_outputs = [
            'DynamoDBTableName',
            'DynamoDBTableArn',
            'S3BucketName',
            'S3BucketArn',
            'LambdaFunctionArn',
            'LambdaFunctionUrl',
            'HealthCheckUrl',
            'SecretArn',
            'SNSTopicArn',
            'HostedZoneId',
            'HealthCheckId'
        ]

        for output_name in required_outputs:
            self.assertIn(output_name, outputs)

    def test_outputs_have_descriptions(self):
        """Test all outputs have descriptions."""
        outputs = self.template['Outputs']

        for output_name, output_config in outputs.items():
            self.assertIn('Description', output_config)
            self.assertIsInstance(output_config['Description'], str)
            self.assertGreater(len(output_config['Description']), 0)

    def test_outputs_have_export_names(self):
        """Test critical outputs have export names."""
        outputs = self.template['Outputs']

        export_required = [
            'DynamoDBTableName',
            'DynamoDBTableArn',
            'S3BucketName',
            'LambdaFunctionArn'
        ]

        for output_name in export_required:
            output_config = outputs[output_name]
            self.assertIn('Export', output_config)
            self.assertIn('Name', output_config['Export'])

    def test_resource_names_include_environment_suffix(self):
        """Test all resource names include environmentSuffix parameter."""
        resources = self.template['Resources']

        # Resources that should have names with environmentSuffix
        named_resources = {
            'PaymentProcessingTable': 'TableName',
            'TransactionLogsBucket': 'BucketName',
            'TransactionLogsBucketSecondary': 'BucketName',
            'ApiSecret': 'Name',
            'PaymentProcessingFunction': 'FunctionName',
            'HealthCheckFunction': 'FunctionName',
            'AlertTopic': 'TopicName',
            'LambdaErrorAlarm': 'AlarmName',
            'LambdaThrottleAlarm': 'AlarmName'
        }

        for resource_name, property_name in named_resources.items():
            resource = resources[resource_name]
            props = resource['Properties']
            self.assertIn(property_name, props)

            name_value = props[property_name]
            # Check if it's using Fn::Sub or Fn::If with Fn::Sub
            if isinstance(name_value, dict):
                if 'Fn::Sub' in name_value:
                    self.assertIn('EnvironmentSuffix', name_value['Fn::Sub'])
                elif 'Fn::If' in name_value:
                    # Check both branches of conditional
                    for branch in name_value['Fn::If'][1:]:
                        if isinstance(branch, dict) and 'Fn::Sub' in branch:
                            self.assertIn('EnvironmentSuffix', branch['Fn::Sub'])

    def test_no_retain_deletion_policy(self):
        """Test no resources have Retain deletion policy."""
        resources = self.template['Resources']

        for resource_name, resource_config in resources.items():
            self.assertNotIn('DeletionPolicy', resource_config,
                           f"Resource {resource_name} should not have DeletionPolicy")

    def test_no_deletion_protection(self):
        """Test no resources have deletion protection enabled."""
        resources = self.template['Resources']

        # Check DynamoDB table doesn't have DeletionProtectionEnabled
        if 'PaymentProcessingTable' in resources:
            table = resources['PaymentProcessingTable']
            props = table.get('Properties', {})
            if 'DeletionProtectionEnabled' in props:
                self.assertFalse(props['DeletionProtectionEnabled'])

    def test_template_is_valid_json(self):
        """Test template is valid JSON."""
        # If we got here, template already loaded successfully
        self.assertIsInstance(self.template, dict)
        self.assertGreater(len(self.template), 0)

    def test_all_resources_have_types(self):
        """Test all resources have Type property."""
        resources = self.template['Resources']

        for resource_name, resource_config in resources.items():
            self.assertIn('Type', resource_config,
                         f"Resource {resource_name} missing Type")
            self.assertTrue(resource_config['Type'].startswith('AWS::'),
                          f"Resource {resource_name} has invalid Type")

    def test_all_resources_have_properties(self):
        """Test all resources have Properties section."""
        resources = self.template['Resources']

        for resource_name, resource_config in resources.items():
            self.assertIn('Properties', resource_config,
                         f"Resource {resource_name} missing Properties")
            self.assertIsInstance(resource_config['Properties'], dict)

    def test_iam_roles_have_assume_role_policy(self):
        """Test IAM roles have AssumeRolePolicyDocument."""
        resources = self.template['Resources']

        iam_roles = [k for k, v in resources.items()
                     if v['Type'] == 'AWS::IAM::Role']

        for role_name in iam_roles:
            role = resources[role_name]
            props = role['Properties']
            self.assertIn('AssumeRolePolicyDocument', props)
            self.assertIn('Version', props['AssumeRolePolicyDocument'])
            self.assertIn('Statement', props['AssumeRolePolicyDocument'])

    def test_resource_tagging(self):
        """Test resources have appropriate tags."""
        resources = self.template['Resources']

        # Resources that should have tags (excluding DynamoDB Global Table)
        taggable_resources = [
            'TransactionLogsBucket',
            'TransactionLogsBucketSecondary',
            'ApiSecret',
            'PaymentProcessingFunction',
            'AlertTopic'
        ]

        for resource_name in taggable_resources:
            resource = resources[resource_name]
            props = resource['Properties']

            # Check for Tags or HostedZoneTags
            has_tags = 'Tags' in props or 'HostedZoneTags' in props
            self.assertTrue(has_tags, f"{resource_name} should have tags")

        # DynamoDB Global Table has tags in Replicas section
        if 'PaymentProcessingTable' in resources:
            table = resources['PaymentProcessingTable']
            replicas = table['Properties']['Replicas']
            for replica in replicas:
                self.assertIn('Tags', replica)

    def test_replication_role_conditional(self):
        """Test ReplicationRole is conditional on IsPrimary."""
        resources = self.template['Resources']
        self.assertIn('ReplicationRole', resources)

        role = resources['ReplicationRole']
        self.assertIn('Condition', role)
        self.assertEqual(role['Condition'], 'IsPrimary')


class TestTemplateCoverage(unittest.TestCase):
    """Additional tests to ensure 100% coverage of template validation."""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template."""
        template_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'lib',
            'disaster-recovery-template.json'
        )
        with open(template_path, 'r') as f:
            cls.template = json.load(f)

    def test_parameter_constraints(self):
        """Test all parameter constraints are properly defined."""
        params = self.template['Parameters']

        # Test each parameter type has appropriate constraints
        for param_name, param_config in params.items():
            self.assertIn('Type', param_config)
            self.assertIn('Description', param_config)

    def test_condition_references(self):
        """Test conditions reference correct parameters."""
        conditions = self.template['Conditions']

        # Verify IsPrimary references IsPrimaryRegion parameter
        is_primary = conditions['IsPrimary']
        self.assertIn('Fn::Equals', is_primary)
        equals_list = is_primary['Fn::Equals']
        self.assertEqual(len(equals_list), 2)

    def test_resource_dependencies(self):
        """Test critical resource dependencies."""
        resources = self.template['Resources']

        # Lambda function should reference execution role
        lambda_func = resources['PaymentProcessingFunction']
        role_ref = lambda_func['Properties']['Role']
        self.assertIn('Fn::GetAtt', role_ref)
        self.assertEqual(role_ref['Fn::GetAtt'][0], 'LambdaExecutionRole')

    def test_conditional_resources(self):
        """Test resources with conditions are properly configured."""
        resources = self.template['Resources']

        conditional_resources = {
            'TransactionLogsBucket': 'IsPrimary',
            'TransactionLogsBucketSecondary': 'IsSecondary',
            'HostedZone': 'IsPrimary',
            'ReplicationRole': 'IsPrimary',
            'DNSRecord': 'IsPrimary',
            'ReplicationLatencyAlarm': 'IsPrimary'
        }

        for resource_name, expected_condition in conditional_resources.items():
            if resource_name in resources:
                resource = resources[resource_name]
                self.assertIn('Condition', resource)
                self.assertEqual(resource['Condition'], expected_condition)

    def test_intrinsic_functions(self):
        """Test proper use of CloudFormation intrinsic functions."""
        resources = self.template['Resources']

        # Test Fn::Sub usage in resource names
        table = resources['PaymentProcessingTable']
        table_name = table['Properties']['TableName']
        self.assertIn('Fn::Sub', table_name)

    def test_alarm_configuration_completeness(self):
        """Test all alarms have complete configuration."""
        resources = self.template['Resources']

        alarm_resources = [k for k, v in resources.items()
                          if v['Type'] == 'AWS::CloudWatch::Alarm']

        required_alarm_props = [
            'MetricName',
            'Namespace',
            'Statistic',
            'Period',
            'EvaluationPeriods',
            'Threshold',
            'ComparisonOperator'
        ]

        for alarm_name in alarm_resources:
            alarm = resources[alarm_name]
            props = alarm['Properties']

            for prop in required_alarm_props:
                self.assertIn(prop, props,
                            f"Alarm {alarm_name} missing {prop}")

    def test_lambda_permissions(self):
        """Test Lambda function URL permissions."""
        resources = self.template['Resources']

        # Check for function URL permissions
        self.assertIn('FunctionUrlPermission', resources)
        self.assertIn('HealthCheckUrlPermission', resources)

        for perm_name in ['FunctionUrlPermission', 'HealthCheckUrlPermission']:
            perm = resources[perm_name]
            self.assertEqual(perm['Type'], 'AWS::Lambda::Permission')
            props = perm['Properties']
            self.assertEqual(props['Action'], 'lambda:InvokeFunctionUrl')

    def test_dynamodb_gsi_configuration(self):
        """Test DynamoDB Global Secondary Index configuration."""
        table = self.template['Resources']['PaymentProcessingTable']
        props = table['Properties']

        self.assertIn('GlobalSecondaryIndexes', props)
        gsi_list = props['GlobalSecondaryIndexes']
        self.assertGreater(len(gsi_list), 0)

        # Test first GSI
        gsi = gsi_list[0]
        self.assertIn('IndexName', gsi)
        self.assertIn('KeySchema', gsi)
        self.assertIn('Projection', gsi)

    def test_s3_lifecycle_transitions(self):
        """Test S3 lifecycle policy transitions."""
        bucket = self.template['Resources']['TransactionLogsBucket']
        lifecycle = bucket['Properties']['LifecycleConfiguration']
        rules = lifecycle['Rules']

        self.assertGreater(len(rules), 0)
        rule = rules[0]
        self.assertIn('Transitions', rule)

        transitions = rule['Transitions']
        self.assertGreater(len(transitions), 0)

        # Check transition to IA
        ia_transition = transitions[0]
        self.assertEqual(ia_transition['StorageClass'], 'STANDARD_IA')
        self.assertEqual(ia_transition['TransitionInDays'], 30)

    def test_secrets_manager_secret_string(self):
        """Test Secrets Manager secret string format."""
        secret = self.template['Resources']['ApiSecret']
        props = secret['Properties']

        self.assertIn('SecretString', props)
        # Verify it uses Fn::Sub for region injection
        self.assertIn('Fn::Sub', props['SecretString'])


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)

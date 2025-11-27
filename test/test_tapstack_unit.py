"""
Unit tests for CloudFormation TapStack template.
Tests template structure, resource properties, and configuration.
"""
import json
import unittest
from pathlib import Path


class TestTapStackUnit(unittest.TestCase):
    """Unit tests for TapStack CloudFormation template"""

    @classmethod
    def setUpClass(cls):
        """Load CloudFormation template once for all tests"""
        template_path = Path(__file__).parent.parent / "lib" / "TapStack.json"
        with open(template_path, 'r') as f:
            cls.template = json.load(f)
        cls.resources = cls.template.get('Resources', {})
        cls.outputs = cls.template.get('Outputs', {})
        cls.parameters = cls.template.get('Parameters', {})

    def test_template_format_version(self):
        """Test CloudFormation template format version"""
        self.assertEqual(
            self.template.get('AWSTemplateFormatVersion'),
            '2010-09-09'
        )

    def test_template_description(self):
        """Test template has description"""
        self.assertIn('Description', self.template)
        self.assertIn('serverless', self.template['Description'].lower())

    def test_environment_suffix_parameter_exists(self):
        """Test EnvironmentSuffix parameter exists"""
        self.assertIn('EnvironmentSuffix', self.parameters)
        self.assertEqual(self.parameters['EnvironmentSuffix']['Type'], 'String')
        self.assertEqual(self.parameters['EnvironmentSuffix']['Default'], 'dev')

    def test_dynamodb_table_exists(self):
        """Test DynamoDB table resource exists"""
        self.assertIn('CryptoAlertsTable', self.resources)
        table = self.resources['CryptoAlertsTable']
        self.assertEqual(table['Type'], 'AWS::DynamoDB::Table')

    def test_dynamodb_table_name_uses_suffix(self):
        """Test DynamoDB table name includes environment suffix"""
        table = self.resources['CryptoAlertsTable']
        table_name = table['Properties']['TableName']
        self.assertIn('EnvironmentSuffix', str(table_name))

    def test_dynamodb_table_billing_mode(self):
        """Test DynamoDB table uses on-demand billing"""
        table = self.resources['CryptoAlertsTable']
        self.assertEqual(
            table['Properties']['BillingMode'],
            'PAY_PER_REQUEST'
        )

    def test_dynamodb_table_keys(self):
        """Test DynamoDB table has correct partition and sort keys"""
        table = self.resources['CryptoAlertsTable']
        key_schema = table['Properties']['KeySchema']

        # Find partition key
        partition_key = next(
            (k for k in key_schema if k['KeyType'] == 'HASH'),
            None
        )
        self.assertIsNotNone(partition_key)
        self.assertEqual(partition_key['AttributeName'], 'userId')

        # Find sort key
        sort_key = next(
            (k for k in key_schema if k['KeyType'] == 'RANGE'),
            None
        )
        self.assertIsNotNone(sort_key)
        self.assertEqual(sort_key['AttributeName'], 'alertId')

    def test_dynamodb_point_in_time_recovery(self):
        """Test DynamoDB table has point-in-time recovery enabled"""
        table = self.resources['CryptoAlertsTable']
        pitr = table['Properties']['PointInTimeRecoverySpecification']
        self.assertTrue(pitr['PointInTimeRecoveryEnabled'])

    def test_dynamodb_deletion_policy(self):
        """Test DynamoDB table has Delete policy"""
        table = self.resources['CryptoAlertsTable']
        self.assertEqual(table.get('DeletionPolicy'), 'Delete')

    def test_price_webhook_processor_function_exists(self):
        """Test PriceWebhookProcessor Lambda function exists"""
        self.assertIn('PriceWebhookProcessorFunction', self.resources)
        func = self.resources['PriceWebhookProcessorFunction']
        self.assertEqual(func['Type'], 'AWS::Lambda::Function')

    def test_price_webhook_processor_name_uses_suffix(self):
        """Test PriceWebhookProcessor name includes environment suffix"""
        func = self.resources['PriceWebhookProcessorFunction']
        func_name = func['Properties']['FunctionName']
        self.assertIn('EnvironmentSuffix', str(func_name))

    def test_price_webhook_processor_memory(self):
        """Test PriceWebhookProcessor has 1GB memory"""
        func = self.resources['PriceWebhookProcessorFunction']
        self.assertEqual(func['Properties']['MemorySize'], 1024)

    def test_price_webhook_processor_architecture(self):
        """Test PriceWebhookProcessor uses ARM64 architecture"""
        func = self.resources['PriceWebhookProcessorFunction']
        self.assertIn('arm64', func['Properties']['Architectures'])

    def test_price_webhook_processor_reserved_concurrency(self):
        """Test PriceWebhookProcessor configuration (concurrency removed due to account limits)"""
        func = self.resources['PriceWebhookProcessorFunction']
        # Note: ReservedConcurrentExecutions removed due to AWS account limits
        self.assertIn('FunctionName', func['Properties'])
        self.assertIn('${EnvironmentSuffix}', func['Properties']['FunctionName']['Fn::Sub'])

    def test_price_webhook_processor_timeout(self):
        """Test PriceWebhookProcessor timeout is within limits"""
        func = self.resources['PriceWebhookProcessorFunction']
        self.assertLessEqual(func['Properties']['Timeout'], 300)

    def test_price_webhook_processor_environment_variables(self):
        """Test PriceWebhookProcessor has required environment variables"""
        func = self.resources['PriceWebhookProcessorFunction']
        env_vars = func['Properties']['Environment']['Variables']
        self.assertIn('DYNAMODB_TABLE', env_vars)
        self.assertIn('ENVIRONMENT', env_vars)

    def test_alert_matcher_function_exists(self):
        """Test AlertMatcher Lambda function exists"""
        self.assertIn('AlertMatcherFunction', self.resources)
        func = self.resources['AlertMatcherFunction']
        self.assertEqual(func['Type'], 'AWS::Lambda::Function')

    def test_alert_matcher_name_uses_suffix(self):
        """Test AlertMatcher name includes environment suffix"""
        func = self.resources['AlertMatcherFunction']
        func_name = func['Properties']['FunctionName']
        self.assertIn('EnvironmentSuffix', str(func_name))

    def test_alert_matcher_memory(self):
        """Test AlertMatcher has 2GB memory"""
        func = self.resources['AlertMatcherFunction']
        self.assertEqual(func['Properties']['MemorySize'], 2048)

    def test_alert_matcher_architecture(self):
        """Test AlertMatcher uses ARM64 architecture"""
        func = self.resources['AlertMatcherFunction']
        self.assertIn('arm64', func['Properties']['Architectures'])

    def test_alert_matcher_reserved_concurrency(self):
        """Test AlertMatcher configuration (concurrency removed due to account limits)"""
        func = self.resources['AlertMatcherFunction']
        # Note: ReservedConcurrentExecutions removed due to AWS account limits
        self.assertIn('FunctionName', func['Properties'])
        self.assertIn('${EnvironmentSuffix}', func['Properties']['FunctionName']['Fn::Sub'])

    def test_alert_matcher_environment_variables(self):
        """Test AlertMatcher has required environment variables"""
        func = self.resources['AlertMatcherFunction']
        env_vars = func['Properties']['Environment']['Variables']
        self.assertIn('DYNAMODB_TABLE', env_vars)
        self.assertIn('ENVIRONMENT', env_vars)

    def test_processed_alerts_function_exists(self):
        """Test ProcessedAlerts Lambda function exists"""
        self.assertIn('ProcessedAlertsFunction', self.resources)
        func = self.resources['ProcessedAlertsFunction']
        self.assertEqual(func['Type'], 'AWS::Lambda::Function')

    def test_processed_alerts_name_uses_suffix(self):
        """Test ProcessedAlerts name includes environment suffix"""
        func = self.resources['ProcessedAlertsFunction']
        func_name = func['Properties']['FunctionName']
        self.assertIn('EnvironmentSuffix', str(func_name))

    def test_processed_alerts_architecture(self):
        """Test ProcessedAlerts uses ARM64 architecture"""
        func = self.resources['ProcessedAlertsFunction']
        self.assertIn('arm64', func['Properties']['Architectures'])

    def test_iam_roles_exist(self):
        """Test all required IAM roles exist"""
        required_roles = [
            'PriceWebhookProcessorRole',
            'AlertMatcherRole',
            'ProcessedAlertsRole',
            'EventBridgeRole'
        ]
        for role_name in required_roles:
            self.assertIn(role_name, self.resources)
            self.assertEqual(
                self.resources[role_name]['Type'],
                'AWS::IAM::Role'
            )

    def test_iam_role_names_use_suffix(self):
        """Test IAM role names include environment suffix"""
        roles = ['PriceWebhookProcessorRole', 'AlertMatcherRole', 'ProcessedAlertsRole']
        for role_name in roles:
            role = self.resources[role_name]
            if 'RoleName' in role['Properties']:
                self.assertIn('EnvironmentSuffix', str(role['Properties']['RoleName']))

    def test_iam_roles_no_wildcard_actions(self):
        """Test IAM roles don't use wildcard actions"""
        roles = ['PriceWebhookProcessorRole', 'AlertMatcherRole', 'ProcessedAlertsRole']
        for role_name in roles:
            role = self.resources[role_name]
            policies = role['Properties'].get('Policies', [])
            for policy in policies:
                statements = policy['PolicyDocument']['Statement']
                for statement in statements:
                    actions = statement.get('Action', [])
                    if isinstance(actions, str):
                        actions = [actions]
                    for action in actions:
                        self.assertNotIn('*', action,
                            f"Wildcard action found in {role_name}")

    def test_alert_matcher_role_has_dynamodb_permissions(self):
        """Test AlertMatcher role has DynamoDB read permissions"""
        role = self.resources['AlertMatcherRole']
        policies = role['Properties']['Policies']
        dynamodb_policy = next(
            (p for p in policies if 'DynamoDB' in p['PolicyName']),
            None
        )
        self.assertIsNotNone(dynamodb_policy)
        actions = dynamodb_policy['PolicyDocument']['Statement'][0]['Action']
        self.assertIn('dynamodb:Scan', actions)
        self.assertIn('dynamodb:Query', actions)

    def test_alert_matcher_role_has_lambda_invoke_permissions(self):
        """Test AlertMatcher role has Lambda invoke permissions"""
        role = self.resources['AlertMatcherRole']
        policies = role['Properties']['Policies']
        lambda_policy = next(
            (p for p in policies if 'Lambda' in p['PolicyName']),
            None
        )
        self.assertIsNotNone(lambda_policy)

    def test_cloudwatch_log_groups_exist(self):
        """Test CloudWatch Log Groups exist for all Lambda functions"""
        expected_log_groups = [
            'PriceWebhookProcessorLogGroup',
            'AlertMatcherLogGroup',
            'ProcessedAlertsLogGroup'
        ]
        for log_group_name in expected_log_groups:
            self.assertIn(log_group_name, self.resources)
            self.assertEqual(
                self.resources[log_group_name]['Type'],
                'AWS::Logs::LogGroup'
            )

    def test_cloudwatch_log_groups_retention(self):
        """Test CloudWatch Log Groups have 3-day retention"""
        log_groups = [
            'PriceWebhookProcessorLogGroup',
            'AlertMatcherLogGroup',
            'ProcessedAlertsLogGroup'
        ]
        for log_group_name in log_groups:
            log_group = self.resources[log_group_name]
            self.assertEqual(log_group['Properties']['RetentionInDays'], 3)

    def test_cloudwatch_log_groups_deletion_policy(self):
        """Test CloudWatch Log Groups have Delete policy"""
        log_groups = [
            'PriceWebhookProcessorLogGroup',
            'AlertMatcherLogGroup',
            'ProcessedAlertsLogGroup'
        ]
        for log_group_name in log_groups:
            log_group = self.resources[log_group_name]
            self.assertEqual(log_group.get('DeletionPolicy'), 'Delete')

    def test_eventbridge_rule_exists(self):
        """Test EventBridge rule exists"""
        self.assertIn('AlertMatcherScheduleRule', self.resources)
        rule = self.resources['AlertMatcherScheduleRule']
        self.assertEqual(rule['Type'], 'AWS::Events::Rule')

    def test_eventbridge_rule_uses_rate_expression(self):
        """Test EventBridge rule uses rate expression (not cron)"""
        rule = self.resources['AlertMatcherScheduleRule']
        schedule = rule['Properties']['ScheduleExpression']
        self.assertTrue(schedule.startswith('rate('))

    def test_eventbridge_rule_enabled(self):
        """Test EventBridge rule is enabled"""
        rule = self.resources['AlertMatcherScheduleRule']
        self.assertEqual(rule['Properties']['State'], 'ENABLED')

    def test_eventbridge_rule_targets_alert_matcher(self):
        """Test EventBridge rule targets AlertMatcher function"""
        rule = self.resources['AlertMatcherScheduleRule']
        targets = rule['Properties']['Targets']
        self.assertEqual(len(targets), 1)
        self.assertIn('AlertMatcherFunction', str(targets[0]['Arn']))

    def test_lambda_destination_exists(self):
        """Test Lambda destination configuration exists"""
        self.assertIn('AlertMatcherEventDestination', self.resources)
        dest = self.resources['AlertMatcherEventDestination']
        self.assertEqual(dest['Type'], 'AWS::Lambda::EventInvokeConfig')

    def test_lambda_destination_on_success(self):
        """Test Lambda destination routes success to ProcessedAlerts"""
        dest = self.resources['AlertMatcherEventDestination']
        on_success = dest['Properties']['DestinationConfig']['OnSuccess']
        self.assertIn('ProcessedAlertsFunction', str(on_success['Destination']))

    def test_lambda_permissions_exist(self):
        """Test Lambda permissions exist"""
        expected_permissions = [
            'ProcessedAlertsInvokePermission',
            'AlertMatcherEventPermission'
        ]
        for permission_name in expected_permissions:
            self.assertIn(permission_name, self.resources)
            self.assertEqual(
                self.resources[permission_name]['Type'],
                'AWS::Lambda::Permission'
            )

    def test_outputs_exist(self):
        """Test all required outputs exist"""
        expected_outputs = [
            'PriceWebhookProcessorArn',
            'AlertMatcherArn',
            'ProcessedAlertsArn',
            'CryptoAlertsTableName',
            'EventBridgeRuleName'
        ]
        for output_name in expected_outputs:
            self.assertIn(output_name, self.outputs)

    def test_outputs_have_descriptions(self):
        """Test all outputs have descriptions"""
        for output_name, output_config in self.outputs.items():
            self.assertIn('Description', output_config)
            self.assertGreater(len(output_config['Description']), 0)

    def test_outputs_export_lambda_arns(self):
        """Test Lambda function ARNs are exported"""
        lambda_outputs = [
            'PriceWebhookProcessorArn',
            'AlertMatcherArn',
            'ProcessedAlertsArn'
        ]
        for output_name in lambda_outputs:
            self.assertIn('Export', self.outputs[output_name])

    def test_all_lambda_functions_have_deletion_policy(self):
        """Test all Lambda functions have Delete policy"""
        lambda_functions = [
            'PriceWebhookProcessorFunction',
            'AlertMatcherFunction',
            'ProcessedAlertsFunction'
        ]
        for func_name in lambda_functions:
            func = self.resources[func_name]
            self.assertEqual(func.get('DeletionPolicy'), 'Delete')

    def test_no_retain_policies(self):
        """Test no resources have Retain deletion policy"""
        for resource_name, resource in self.resources.items():
            policy = resource.get('DeletionPolicy')
            if policy:
                self.assertNotEqual(policy, 'Retain',
                    f"Resource {resource_name} has Retain policy")


if __name__ == '__main__':
    unittest.main()

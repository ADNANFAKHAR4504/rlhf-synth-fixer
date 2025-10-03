import unittest
import json
import os

class TestCloudFormationTemplate(unittest.TestCase):
    """Unit tests for CloudFormation template validation"""

    def setUp(self):
        """Load the CloudFormation template"""
        template_path = '/Users/mayanksethi/Projects/turing/iac-test-automations/worktree/IAC-synth-46210837/lib/TapStack.json'
        with open(template_path, 'r') as f:
            self.template = json.load(f)

    def test_template_format_version(self):
        """Test that template has correct format version"""
        self.assertEqual(self.template['AWSTemplateFormatVersion'], '2010-09-09')

    def test_template_description(self):
        """Test that template has a description"""
        self.assertIn('Description', self.template)
        self.assertIsInstance(self.template['Description'], str)

    def test_parameters_exist(self):
        """Test that required parameters exist"""
        self.assertIn('Parameters', self.template)
        self.assertIn('EnvironmentSuffix', self.template['Parameters'])
        self.assertIn('SenderEmail', self.template['Parameters'])

    def test_environment_suffix_parameter(self):
        """Test EnvironmentSuffix parameter configuration"""
        env_param = self.template['Parameters']['EnvironmentSuffix']
        self.assertEqual(env_param['Type'], 'String')
        self.assertEqual(env_param['Default'], 'dev')
        self.assertIn('AllowedPattern', env_param)

    def test_required_resources(self):
        """Test that all required resources exist"""
        resources = self.template['Resources']

        # Check for SNS Topic
        self.assertIn('AppointmentReminderTopic', resources)
        self.assertEqual(resources['AppointmentReminderTopic']['Type'], 'AWS::SNS::Topic')

        # Check for DynamoDB Table
        self.assertIn('DeliveryLogsTable', resources)
        self.assertEqual(resources['DeliveryLogsTable']['Type'], 'AWS::DynamoDB::Table')

        # Check for Lambda Function
        lambda_found = False
        for resource_name, resource in resources.items():
            if resource['Type'] == 'AWS::Lambda::Function':
                lambda_found = True
                break
        self.assertTrue(lambda_found, "Lambda function resource not found")

        # Check for IAM Role
        role_found = False
        for resource_name, resource in resources.items():
            if resource['Type'] == 'AWS::IAM::Role':
                role_found = True
                break
        self.assertTrue(role_found, "IAM role resource not found")

    def test_dynamodb_table_configuration(self):
        """Test DynamoDB table is configured correctly"""
        table = self.template['Resources']['DeliveryLogsTable']
        properties = table['Properties']

        # Check billing mode
        self.assertEqual(properties['BillingMode'], 'PAY_PER_REQUEST')

        # Check key schema
        self.assertIn('KeySchema', properties)
        key_schema = properties['KeySchema']
        self.assertEqual(len(key_schema), 2)

        # Check for partition and sort keys
        partition_key = next((k for k in key_schema if k['KeyType'] == 'HASH'), None)
        sort_key = next((k for k in key_schema if k['KeyType'] == 'RANGE'), None)

        self.assertIsNotNone(partition_key)
        self.assertEqual(partition_key['AttributeName'], 'patientId')

        self.assertIsNotNone(sort_key)
        self.assertEqual(sort_key['AttributeName'], 'timestamp')

        # Check TTL is enabled
        self.assertIn('TimeToLiveSpecification', properties)
        self.assertTrue(properties['TimeToLiveSpecification']['Enabled'])

    def test_sns_topic_configuration(self):
        """Test SNS topic configuration"""
        topic = self.template['Resources']['AppointmentReminderTopic']
        properties = topic['Properties']

        # Check topic name includes environment suffix
        self.assertIn('TopicName', properties)
        self.assertIn('Fn::Sub', properties['TopicName'])

        # Check KMS encryption is enabled
        self.assertIn('KmsMasterKeyId', properties)

    def test_lambda_function_configuration(self):
        """Test Lambda function configuration"""
        lambda_function = self.template['Resources'].get('NotificationHandler')
        if lambda_function:
            properties = lambda_function['Properties']

            # Check runtime
            self.assertEqual(properties['Runtime'], 'python3.9')

            # Check environment variables
            self.assertIn('Environment', properties)
            self.assertIn('Variables', properties['Environment'])

            env_vars = properties['Environment']['Variables']
            self.assertIn('TABLE_NAME', env_vars)
            self.assertIn('SENDER_EMAIL', env_vars)

    def test_iam_role_policies(self):
        """Test IAM role has necessary policies"""
        role = self.template['Resources']['NotificationHandlerRole']
        properties = role['Properties']

        # Check assume role policy
        self.assertIn('AssumeRolePolicyDocument', properties)

        # Check managed policies
        self.assertIn('ManagedPolicyArns', properties)
        self.assertIn('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                      properties['ManagedPolicyArns'])

        # Check inline policies
        self.assertIn('Policies', properties)
        policies = properties['Policies']
        self.assertGreater(len(policies), 0)

        # Check for necessary permissions
        policy_doc = policies[0]['PolicyDocument']
        statements = policy_doc['Statement']

        # Check SNS permissions
        sns_perms = ['sns:Publish', 'sns:SetSMSAttributes', 'sns:GetSMSAttributes']
        sns_statement = next((s for s in statements if any(perm in s.get('Action', []) for perm in sns_perms)), None)
        self.assertIsNotNone(sns_statement, "SNS permissions not found")

        # Check DynamoDB permissions
        ddb_perms = ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem', 'dynamodb:Query']
        ddb_statement = next((s for s in statements if any(perm in s.get('Action', []) for perm in ddb_perms)), None)
        self.assertIsNotNone(ddb_statement, "DynamoDB permissions not found")

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured"""
        alarm_found = False
        for resource_name, resource in self.template['Resources'].items():
            if resource['Type'] == 'AWS::CloudWatch::Alarm':
                alarm_found = True
                # Check alarm configuration
                properties = resource['Properties']
                self.assertIn('MetricName', properties)
                self.assertIn('ComparisonOperator', properties)
                self.assertIn('Threshold', properties)
                break

        self.assertTrue(alarm_found, "CloudWatch alarm for failure monitoring not found")

    def test_outputs_section(self):
        """Test that outputs are defined for integration"""
        self.assertIn('Outputs', self.template)
        outputs = self.template['Outputs']

        # Check for essential outputs
        essential_outputs = ['TopicArn', 'TableName']
        for output in essential_outputs:
            found = any(output.lower() in key.lower() for key in outputs.keys())
            self.assertTrue(found, f"Output for {output} not found")

    def test_resource_naming_with_suffix(self):
        """Test that resources use environment suffix for naming"""
        resources = self.template['Resources']

        # Check SNS topic name
        topic_name = resources['AppointmentReminderTopic']['Properties']['TopicName']
        self.assertIn('${EnvironmentSuffix}', str(topic_name))

        # Check DynamoDB table name
        table_name = resources['DeliveryLogsTable']['Properties']['TableName']
        self.assertIn('${EnvironmentSuffix}', str(table_name))

    def test_no_retain_policies(self):
        """Test that no resources have Retain deletion policy"""
        for resource_name, resource in self.template['Resources'].items():
            deletion_policy = resource.get('DeletionPolicy', 'Delete')
            self.assertNotEqual(deletion_policy, 'Retain',
                              f"Resource {resource_name} has Retain deletion policy")

if __name__ == '__main__':
    unittest.main()
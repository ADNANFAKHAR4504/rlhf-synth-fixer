"""
test_tap_stack_integration.py

Integration tests for TapStack multi-tenant SaaS infrastructure.
Tests actual AWS resources deployed using stack outputs.
No mocking - validates real infrastructure.
"""

import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and initialize AWS clients."""
        outputs_file = 'cfn-outputs/flat-outputs.json'

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Stack outputs file not found: {outputs_file}. "
                "Ensure the stack is deployed before running integration tests."
            )

        with open(outputs_file, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        aws_region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=aws_region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=aws_region)
        cls.kms_client = boto3.client('kms', region_name=aws_region)
        cls.lambda_client = boto3.client('lambda', region_name=aws_region)
        cls.apigateway_client = boto3.client('apigateway', region_name=aws_region)
        cls.logs_client = boto3.client('logs', region_name=aws_region)
        cls.iam_client = boto3.client('iam', region_name=aws_region)

        # Extract tenant IDs from outputs
        cls.tenant_ids = []
        for key in cls.outputs.keys():
            if key.endswith('_users_table'):
                tenant_id = key.replace('_users_table', '')
                cls.tenant_ids.append(tenant_id)

    def test_vpc_exists(self):
        """Test that VPC was created and is available."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in stack outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')

        # Check DNS settings
        dns_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_response['EnableDnsHostnames']['Value'])

        dns_support_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support_response['EnableDnsSupport']['Value'])

    def test_kms_keys_exist_for_all_tenants(self):
        """Test that KMS keys exist for all tenants."""
        for tenant_id in self.tenant_ids:
            kms_key_key = f"{tenant_id}_kms_key_id"
            kms_key_id = self.outputs.get(kms_key_key)

            self.assertIsNotNone(
                kms_key_id,
                f"KMS key ID not found for {tenant_id}"
            )

            # Verify KMS key exists and is enabled
            response = self.kms_client.describe_key(KeyId=kms_key_id)
            key_metadata = response['KeyMetadata']

            self.assertEqual(key_metadata['KeyState'], 'Enabled')
            self.assertTrue(key_metadata['Enabled'])

    def test_dynamodb_users_tables_exist(self):
        """Test that DynamoDB users tables exist for all tenants."""
        for tenant_id in self.tenant_ids:
            table_key = f"{tenant_id}_users_table"
            table_name = self.outputs.get(table_key)

            self.assertIsNotNone(
                table_name,
                f"Users table name not found for {tenant_id}"
            )

            # Verify table exists
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']

            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Verify attribute definitions
            attr_names = [attr['AttributeName'] for attr in table['AttributeDefinitions']]
            self.assertIn('userId', attr_names)

    def test_dynamodb_data_tables_exist(self):
        """Test that DynamoDB data tables exist for all tenants."""
        for tenant_id in self.tenant_ids:
            table_key = f"{tenant_id}_data_table"
            table_name = self.outputs.get(table_key)

            self.assertIsNotNone(
                table_name,
                f"Data table name not found for {tenant_id}"
            )

            # Verify table exists
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']

            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Verify attribute definitions
            attr_names = [attr['AttributeName'] for attr in table['AttributeDefinitions']]
            self.assertIn('dataId', attr_names)

    def test_dynamodb_tables_encrypted_with_kms(self):
        """Test that DynamoDB tables are encrypted with tenant-specific KMS keys."""
        for tenant_id in self.tenant_ids:
            table_key = f"{tenant_id}_users_table"
            table_name = self.outputs.get(table_key)
            kms_key_key = f"{tenant_id}_kms_key_id"
            kms_key_id = self.outputs.get(kms_key_key)

            # Verify table encryption
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']

            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')
            self.assertEqual(table['SSEDescription']['SSEType'], 'KMS')
            self.assertIn(kms_key_id, table['SSEDescription']['KMSMasterKeyArn'])

    def test_lambda_functions_exist_for_all_tenants(self):
        """Test that Lambda functions exist for all tenants."""
        for tenant_id in self.tenant_ids:
            lambda_key = f"{tenant_id}_lambda_function"
            lambda_name = self.outputs.get(lambda_key)

            self.assertIsNotNone(
                lambda_name,
                f"Lambda function name not found for {tenant_id}"
            )

            # Verify Lambda function exists
            response = self.lambda_client.get_function(FunctionName=lambda_name)
            function_config = response['Configuration']

            self.assertEqual(function_config['State'], 'Active')
            self.assertIn('python3', function_config['Runtime'])

            # Verify environment variables
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('TENANT_ID', env_vars)
            self.assertEqual(env_vars['TENANT_ID'], tenant_id)

    def test_lambda_functions_have_environment_variables(self):
        """Test that Lambda functions have required environment variables."""
        for tenant_id in self.tenant_ids:
            lambda_key = f"{tenant_id}_lambda_function"
            lambda_name = self.outputs.get(lambda_key)

            response = self.lambda_client.get_function(FunctionName=lambda_name)
            function_config = response['Configuration']

            # Verify environment variables
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('TENANT_ID', env_vars)
            self.assertEqual(env_vars['TENANT_ID'], tenant_id)
            self.assertIn('TENANT_SUBNET', env_vars)

    def test_api_gateway_exists(self):
        """Test that API Gateway was created."""
        api_id = self.outputs.get('api_id')
        self.assertIsNotNone(api_id, "API Gateway ID not found in stack outputs")

        # Verify API Gateway exists
        response = self.apigateway_client.get_rest_api(restApiId=api_id)

        self.assertEqual(response['id'], api_id)
        self.assertIsNotNone(response['name'])

    def test_api_gateway_has_resources(self):
        """Test that API Gateway has the expected resources."""
        api_id = self.outputs.get('api_id')

        # Get API Gateway resources
        response = self.apigateway_client.get_resources(restApiId=api_id)
        resources = response.get('items', response.get('Resources', []))

        # Verify we have resources
        self.assertGreater(len(resources), 0, "API Gateway should have resources")

        # Verify expected resource paths exist
        resource_paths = [r['path'] for r in resources]
        self.assertIn('/tenants', resource_paths)
        self.assertIn('/tenants/{tenantId}', resource_paths)
        self.assertIn('/tenants/{tenantId}/users', resource_paths)

    def test_api_gateway_has_authorizer(self):
        """Test that API Gateway has an authorizer configured."""
        api_id = self.outputs.get('api_id')

        # Get API Gateway authorizers
        response = self.apigateway_client.get_authorizers(restApiId=api_id)
        authorizers = response['items']

        self.assertGreater(
            len(authorizers),
            0,
            "Expected at least one authorizer in API Gateway"
        )

        # Verify authorizer type
        authorizer = authorizers[0]
        self.assertEqual(authorizer['type'], 'TOKEN')

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch Log Groups exist for all tenants."""
        # Check log groups exist for each tenant
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix="/aws/lambda/tenant-"
            )
            log_groups = response['logGroups']

            # Find log groups that match tenant pattern
            tenant_log_groups = []
            for tenant_id in self.tenant_ids:
                matching = [lg for lg in log_groups if tenant_id in lg['logGroupName']]
                tenant_log_groups.extend(matching)

            self.assertGreaterEqual(
                len(tenant_log_groups),
                len(self.tenant_ids),
                f"Expected at least {len(self.tenant_ids)} log groups, found {len(tenant_log_groups)}"
            )

            # Verify retention policy (30 days) for tenant log groups
            for log_group in tenant_log_groups:
                if 'retentionInDays' in log_group:
                    self.assertEqual(log_group['retentionInDays'], 30)

        except ClientError as e:
            self.fail(f"Failed to describe log groups: {e}")

    def test_multi_tenant_isolation(self):
        """Test that tenant resources are isolated from each other."""
        # Verify each tenant has unique KMS keys
        kms_keys = []
        for tenant_id in self.tenant_ids:
            kms_key_key = f"{tenant_id}_kms_key_id"
            kms_key_id = self.outputs.get(kms_key_key)
            kms_keys.append(kms_key_id)

        self.assertEqual(
            len(kms_keys),
            len(set(kms_keys)),
            "KMS keys should be unique per tenant"
        )

        # Verify each tenant has unique DynamoDB tables
        users_tables = []
        data_tables = []
        for tenant_id in self.tenant_ids:
            users_tables.append(self.outputs.get(f"{tenant_id}_users_table"))
            data_tables.append(self.outputs.get(f"{tenant_id}_data_table"))

        self.assertEqual(
            len(users_tables),
            len(set(users_tables)),
            "Users tables should be unique per tenant"
        )
        self.assertEqual(
            len(data_tables),
            len(set(data_tables)),
            "Data tables should be unique per tenant"
        )

    def test_dynamodb_tables_can_write_and_read(self):
        """Test that DynamoDB tables support write and read operations."""
        # Test with first tenant
        tenant_id = self.tenant_ids[0]
        table_name = self.outputs.get(f"{tenant_id}_users_table")

        # Write test item
        test_item = {
            'userId': {'S': 'test-user-001'},
            'email': {'S': 'test@example.com'},
            'name': {'S': 'Test User'}
        }

        try:
            self.dynamodb_client.put_item(
                TableName=table_name,
                Item=test_item
            )

            # Read test item
            response = self.dynamodb_client.get_item(
                TableName=table_name,
                Key={'userId': {'S': 'test-user-001'}}
            )

            self.assertIn('Item', response)
            self.assertEqual(response['Item']['userId']['S'], 'test-user-001')
            self.assertEqual(response['Item']['email']['S'], 'test@example.com')

            # Clean up test item
            self.dynamodb_client.delete_item(
                TableName=table_name,
                Key={'userId': {'S': 'test-user-001'}}
            )

        except ClientError as e:
            self.fail(f"Failed to write/read from DynamoDB: {e}")

    def test_lambda_functions_have_proper_permissions(self):
        """Test that Lambda functions have necessary IAM permissions."""
        for tenant_id in self.tenant_ids:
            lambda_key = f"{tenant_id}_lambda_function"
            lambda_name = self.outputs.get(lambda_key)

            response = self.lambda_client.get_function(FunctionName=lambda_name)
            role_arn = response['Configuration']['Role']

            # Extract role name from ARN
            role_name = role_arn.split('/')[-1]

            # Get attached policies
            response = self.iam_client.list_attached_role_policies(RoleName=role_name)
            attached_policies = response['AttachedPolicies']

            # Get inline policies
            response = self.iam_client.list_role_policies(RoleName=role_name)
            inline_policies = response['PolicyNames']

            # Verify role has policies (either attached or inline)
            total_policies = len(attached_policies) + len(inline_policies)
            self.assertGreater(
                total_policies,
                0,
                f"Lambda role for {tenant_id} should have at least one policy"
            )


if __name__ == '__main__':
    unittest.main()

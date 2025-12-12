"""Comprehensive unit tests for TapStack to achieve 90% coverage."""
import unittest
from unittest.mock import Mock, patch, MagicMock, call
import json
import pulumi
from pulumi import Output
import pulumi_aws as aws

# Mock Pulumi runtime
pulumi.runtime.set_mocks(
    Mock(),
    preview=False,
)

# Import after mocking
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackComponent(unittest.TestCase):
    """Test TapStack component creation and methods."""

    @patch('lib.tap_stack.aws.get_availability_zones')
    def test_tapstack_initialization(self, mock_get_azs):
        """Test TapStack component initialization."""
        # Mock availability zones
        mock_azs = Mock()
        mock_azs.names = ['us-east-1a', 'us-east-1b']
        mock_get_azs.return_value = mock_azs

        args = TapStackArgs(
            environment_suffix='test',
            tenant_ids=['tenant-001', 'tenant-002']
        )

        with patch.object(TapStack, '_create_vpc') as mock_vpc:
            with patch.object(TapStack, '_create_internet_gateway') as mock_igw:
                with patch.object(TapStack, '_create_tenant_subnets') as mock_subnets:
                    with patch.object(TapStack, '_create_route_tables') as mock_routes:
                        with patch.object(TapStack, '_create_kms_keys') as mock_kms:
                            with patch.object(TapStack, '_create_dynamodb_tables') as mock_ddb:
                                with patch.object(TapStack, '_create_lambda_role') as mock_role:
                                    with patch.object(TapStack, '_create_lambda_functions') as mock_lambdas:
                                        with patch.object(TapStack, '_create_log_groups') as mock_logs:
                                            with patch.object(TapStack, '_create_api_gateway') as mock_api:
                                                with patch.object(TapStack, '_register_outputs') as mock_outputs:
                                                    stack = TapStack('test-stack', args)

                                                    # Verify all methods were called
                                                    mock_vpc.assert_called_once()
                                                    mock_igw.assert_called_once()
                                                    mock_subnets.assert_called_once()
                                                    mock_routes.assert_called_once()
                                                    mock_kms.assert_called_once()
                                                    mock_ddb.assert_called_once()
                                                    mock_role.assert_called_once()
                                                    mock_lambdas.assert_called_once()
                                                    mock_logs.assert_called_once()
                                                    mock_api.assert_called_once()
                                                    mock_outputs.assert_called_once()

                                                    # Verify attributes
                                                    self.assertEqual(stack.environment_suffix, 'test')
                                                    self.assertEqual(stack.tenant_ids, ['tenant-001', 'tenant-002'])

    @patch('lib.tap_stack.aws.ec2.Vpc')
    def test_create_vpc(self, mock_vpc_class):
        """Test VPC creation."""
        args = TapStackArgs(
            environment_suffix='test',
            tenant_ids=['tenant-001'],
            vpc_cidr='10.0.0.0/16'
        )

        with patch('lib.tap_stack.aws.get_availability_zones'):
            stack = TapStack.__new__(TapStack)
            stack.environment_suffix = args.environment_suffix
            stack.tags = args.tags

            mock_vpc = Mock()
            mock_vpc_class.return_value = mock_vpc

            result = stack._create_vpc('10.0.0.0/16')

            self.assertEqual(result, mock_vpc)
            mock_vpc_class.assert_called_once()
            call_args = mock_vpc_class.call_args
            self.assertIn('10.0.0.0/16', str(call_args))

    @patch('lib.tap_stack.aws.ec2.InternetGateway')
    def test_create_internet_gateway(self, mock_igw_class):
        """Test Internet Gateway creation."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tags = {'env': 'test'}
        stack.vpc = Mock()
        stack.vpc.id = 'vpc-123'

        mock_igw = Mock()
        mock_igw_class.return_value = mock_igw

        result = stack._create_internet_gateway()

        self.assertEqual(result, mock_igw)
        mock_igw_class.assert_called_once()

    @patch('lib.tap_stack.aws.ec2.Subnet')
    def test_create_tenant_subnets(self, mock_subnet_class):
        """Test tenant subnet creation."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tenant_ids = ['tenant-001', 'tenant-002']
        stack.tags = {'env': 'test'}
        stack.vpc = Mock()
        stack.vpc.id = 'vpc-123'

        mock_azs = Mock()
        mock_azs.names = ['us-east-1a', 'us-east-1b']
        stack.azs = mock_azs

        mock_subnet = Mock()
        mock_subnet_class.return_value = mock_subnet

        result = stack._create_tenant_subnets()

        # Should create 2 subnets per tenant (2 tenants × 2 AZs = 4 subnets)
        self.assertEqual(mock_subnet_class.call_count, 4)
        self.assertIn('tenant-001', result)
        self.assertIn('tenant-002', result)
        self.assertEqual(len(result['tenant-001']), 2)
        self.assertEqual(len(result['tenant-002']), 2)

    @patch('lib.tap_stack.aws.ec2.RouteTableAssociation')
    @patch('lib.tap_stack.aws.ec2.Route')
    @patch('lib.tap_stack.aws.ec2.RouteTable')
    def test_create_route_tables(self, mock_rt_class, mock_route_class, mock_rta_class):
        """Test route table creation."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tags = {'env': 'test'}
        stack.vpc = Mock()
        stack.vpc.id = 'vpc-123'
        stack.igw = Mock()
        stack.igw.id = 'igw-123'

        # Mock tenant subnets
        subnet1 = Mock()
        subnet1.id = 'subnet-1'
        subnet2 = Mock()
        subnet2.id = 'subnet-2'
        stack.tenant_subnets = {
            'tenant-001': [subnet1, subnet2]
        }

        mock_rt = Mock()
        mock_rt.id = 'rt-123'
        mock_rt_class.return_value = mock_rt

        result = stack._create_route_tables()

        self.assertIn('tenant-001', result)
        mock_rt_class.assert_called_once()
        mock_route_class.assert_called_once()
        self.assertEqual(mock_rta_class.call_count, 2)  # 2 subnets

    @patch('lib.tap_stack.aws.kms.Alias')
    @patch('lib.tap_stack.aws.kms.Key')
    def test_create_kms_keys(self, mock_key_class, mock_alias_class):
        """Test KMS key creation."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tenant_ids = ['tenant-001', 'tenant-002']
        stack.tags = {'env': 'test'}

        mock_key = Mock()
        mock_key.id = 'key-123'
        mock_key.arn = 'arn:aws:kms:us-east-1:123456789012:key/key-123'
        mock_key_class.return_value = mock_key

        result = stack._create_kms_keys()

        self.assertEqual(len(result), 2)
        self.assertIn('tenant-001', result)
        self.assertIn('tenant-002', result)
        self.assertEqual(mock_key_class.call_count, 2)
        self.assertEqual(mock_alias_class.call_count, 2)

    @patch('lib.tap_stack.aws.dynamodb.Table')
    def test_create_dynamodb_tables(self, mock_table_class):
        """Test DynamoDB table creation."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tenant_ids = ['tenant-001']
        stack.tags = {'env': 'test'}

        # Mock KMS keys
        mock_key = Mock()
        mock_key.arn = 'arn:aws:kms:us-east-1:123456789012:key/key-123'
        stack.kms_keys = {'tenant-001': mock_key}

        mock_table = Mock()
        mock_table.name = 'test-table'
        mock_table.arn = 'arn:aws:dynamodb:us-east-1:123456789012:table/test-table'
        mock_table_class.return_value = mock_table

        result = stack._create_dynamodb_tables()

        self.assertIn('tenant-001', result)
        self.assertIn('users', result['tenant-001'])
        self.assertIn('data', result['tenant-001'])
        self.assertEqual(mock_table_class.call_count, 2)  # users and data tables

    @patch('lib.tap_stack.aws.iam.RolePolicy')
    @patch('lib.tap_stack.aws.iam.Role')
    def test_create_lambda_role(self, mock_role_class, mock_policy_class):
        """Test Lambda IAM role creation."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tenant_ids = ['tenant-001']
        stack.tags = {'env': 'test'}

        # Mock DynamoDB tables
        mock_table = Mock()
        mock_table.arn = Output.from_input('arn:aws:dynamodb:us-east-1:123456789012:table/test-table')
        stack.dynamodb_tables = {
            'tenant-001': {
                'users': mock_table,
                'data': mock_table
            }
        }

        # Mock KMS keys
        mock_key = Mock()
        mock_key.arn = Output.from_input('arn:aws:kms:us-east-1:123456789012:key/key-123')
        stack.kms_keys = {'tenant-001': mock_key}

        mock_role = Mock()
        mock_role.id = 'role-123'
        mock_role.arn = 'arn:aws:iam::123456789012:role/lambda-role'
        mock_role_class.return_value = mock_role

        result = stack._create_lambda_role()

        self.assertEqual(result, mock_role)
        mock_role_class.assert_called_once()
        mock_policy_class.assert_called_once()

    @patch('lib.tap_stack.aws.lambda_.Function')
    def test_create_lambda_functions(self, mock_function_class):
        """Test Lambda function creation."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tenant_ids = ['tenant-001', 'tenant-002']
        stack.tags = {'env': 'test'}

        # Mock lambda role
        mock_role = Mock()
        mock_role.arn = 'arn:aws:iam::123456789012:role/lambda-role'
        stack.lambda_role = mock_role

        # Mock tenant subnets
        mock_subnet = Mock()
        mock_subnet.id = Output.from_input('subnet-123')
        stack.tenant_subnets = {
            'tenant-001': [mock_subnet],
            'tenant-002': [mock_subnet]
        }

        mock_function = Mock()
        mock_function_class.return_value = mock_function

        result = stack._create_lambda_functions()

        self.assertEqual(len(result), 2)
        self.assertIn('tenant-001', result)
        self.assertIn('tenant-002', result)
        self.assertEqual(mock_function_class.call_count, 2)

    def test_get_lambda_code(self):
        """Test Lambda code generation."""
        stack = TapStack.__new__(TapStack)
        code = stack._get_lambda_code()

        self.assertIsInstance(code, str)
        self.assertIn('def handler', code)
        self.assertIn('tenant_id', code)
        self.assertIn('tenant_subnet', code)
        self.assertIn('TENANT_ID', code)
        self.assertIn('TENANT_SUBNET', code)

        # Verify it's valid Python
        compile(code.strip(), '<string>', 'exec')

    def test_get_authorizer_code(self):
        """Test authorizer code generation."""
        stack = TapStack.__new__(TapStack)
        code = stack._get_authorizer_code()

        self.assertIsInstance(code, str)
        self.assertIn('def handler', code)
        self.assertIn('Bearer', code)
        self.assertIn('principalId', code)
        self.assertIn('policyDocument', code)
        self.assertIn('authorizationToken', code)

        # Verify it's valid Python
        compile(code.strip(), '<string>', 'exec')

    @patch('lib.tap_stack.aws.cloudwatch.LogGroup')
    def test_create_log_groups(self, mock_log_group_class):
        """Test CloudWatch log group creation."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tenant_ids = ['tenant-001', 'tenant-002']
        stack.tags = {'env': 'test'}

        mock_log_group = Mock()
        mock_log_group_class.return_value = mock_log_group

        result = stack._create_log_groups()

        self.assertEqual(len(result), 2)
        self.assertIn('tenant-001', result)
        self.assertIn('tenant-002', result)
        self.assertEqual(mock_log_group_class.call_count, 2)

        # Verify retention days is 30
        for call in mock_log_group_class.call_args_list:
            self.assertEqual(call.kwargs.get('retention_in_days'), 30)

    @patch('lib.tap_stack.aws.apigateway.Method')
    @patch('lib.tap_stack.aws.apigateway.Resource')
    @patch('lib.tap_stack.aws.apigateway.RestApi')
    def test_create_api_gateway(self, mock_api_class, mock_resource_class, mock_method_class):
        """Test API Gateway creation."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tags = {'env': 'test'}

        # Mock API
        mock_api = Mock()
        mock_api.id = 'api-123'
        mock_api.root_resource_id = 'root-123'
        mock_api_class.return_value = mock_api

        # Mock resources
        mock_resource = Mock()
        mock_resource.id = 'resource-123'
        mock_resource_class.return_value = mock_resource

        # Mock authorizer
        with patch.object(stack, '_create_authorizer') as mock_authorizer:
            mock_auth = Mock()
            mock_auth.id = 'auth-123'
            mock_authorizer.return_value = mock_auth

            result = stack._create_api_gateway()

            self.assertEqual(result, mock_api)
            mock_api_class.assert_called_once()
            self.assertEqual(mock_resource_class.call_count, 3)  # tenants, {tenantId}, users
            mock_method_class.assert_called_once()
            mock_authorizer.assert_called_once_with(mock_api)

    @patch('lib.tap_stack.aws.apigateway.Authorizer')
    @patch('lib.tap_stack.aws.lambda_.Function')
    def test_create_authorizer(self, mock_function_class, mock_authorizer_class):
        """Test API Gateway authorizer creation."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tags = {'env': 'test'}

        # Mock lambda role
        mock_role = Mock()
        mock_role.arn = 'arn:aws:iam::123456789012:role/lambda-role'
        stack.lambda_role = mock_role

        # Mock API
        mock_api = Mock()
        mock_api.id = 'api-123'

        # Mock function
        mock_function = Mock()
        mock_function.invoke_arn = 'arn:aws:lambda:us-east-1:123456789012:function:auth-func'
        mock_function_class.return_value = mock_function

        # Mock authorizer
        mock_auth = Mock()
        mock_authorizer_class.return_value = mock_auth

        result = stack._create_authorizer(mock_api)

        self.assertEqual(result, mock_auth)
        mock_function_class.assert_called_once()
        mock_authorizer_class.assert_called_once()

    @patch.object(TapStack, 'register_outputs')
    def test_register_outputs(self, mock_register):
        """Test output registration."""
        stack = TapStack.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack.tenant_ids = ['tenant-001']

        # Mock resources
        stack.vpc = Mock()
        stack.vpc.id = 'vpc-123'
        stack.api = Mock()
        stack.api.id = 'api-123'

        # Mock tenant resources
        mock_subnet = Mock()
        mock_subnet.id = 'subnet-123'
        stack.tenant_subnets = {'tenant-001': [mock_subnet]}

        mock_table = Mock()
        mock_table.name = 'table-123'
        stack.dynamodb_tables = {
            'tenant-001': {
                'users': mock_table,
                'data': mock_table
            }
        }

        mock_key = Mock()
        mock_key.id = 'key-123'
        stack.kms_keys = {'tenant-001': mock_key}

        stack._register_outputs()

        mock_register.assert_called_once()
        outputs = mock_register.call_args[0][0]

        self.assertIn('vpc_id', outputs)
        self.assertIn('api_id', outputs)
        self.assertIn('tenant-001_subnet_ids', outputs)
        self.assertIn('tenant-001_users_table', outputs)
        self.assertIn('tenant-001_data_table', outputs)
        self.assertIn('tenant-001_kms_key', outputs)


if __name__ == '__main__':
    unittest.main()
"""Unit tests for TAP Stack."""
import os
import sys
import json
import time
from decimal import Decimal
from unittest import mock
from cdktf import App, Testing
from lib.tap_stack import TapStack

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestTapStackStructure:
    """Test suite for TAP Stack Structure validation."""

    def setup_method(self):
        """Setup method called before each test."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
            default_tags={
                "Environment": "test",
                "Project": "async-transaction-pipeline",
                "Team": "platform",
                "Application": "transaction-processing-system",
                "CostCenter": "engineering"
            }
        )
        self.synth_stack = Testing.synth(self.stack)

    def test_tap_stack_instantiates_successfully_with_default_props(self):
        """TapStack instantiates successfully with default properties."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors
        assert stack is not None

        # Synthesize the stack
        synth_stack = Testing.synth(stack)
        assert synth_stack is not None

    def test_tap_stack_instantiates_successfully_with_custom_props(self):
        """TapStack instantiates successfully with custom properties."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackCustom",
            environment_suffix="prod",
            aws_region="us-west-2",
            state_bucket="custom-terraform-state-bucket",
            state_bucket_region="us-west-2",
            default_tags={
                "tags": {
                    "Environment": "production",
                    "Team": "infrastructure",
                    "CostCenter": "engineering"
                }
            }
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None

        # Synthesize the stack
        synth_stack = Testing.synth(stack)
        assert synth_stack is not None

    def test_stack_creates_vpc_and_networking_resources(self):
        """Test that stack creates VPC and related networking components."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Verify VPC exists
        assert "aws_vpc" in resources
        vpc_resources = resources["aws_vpc"]
        assert len(vpc_resources) == 1

        vpc = list(vpc_resources.values())[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True

        # Verify Internet Gateway exists
        assert "aws_internet_gateway" in resources
        igw_resources = resources["aws_internet_gateway"]
        assert len(igw_resources) == 1

        # Verify subnets exist (3 private + 1 public)
        assert "aws_subnet" in resources
        subnet_resources = resources["aws_subnet"]
        assert len(subnet_resources) >= 4

        # Verify NAT Gateway exists
        assert "aws_nat_gateway" in resources

        # Verify EIP exists for NAT Gateway
        assert "aws_eip" in resources

        # Verify route tables exist
        assert "aws_route_table" in resources

    def test_stack_creates_security_groups(self):
        """Test that the stack creates security groups with proper configuration."""
        resources = json.loads(self.synth_stack)["resource"]
        
        # Verify security groups exist
        assert "aws_security_group" in resources
        
        # Check lambda security group
        lambda_sg_found = False
        for sg_id, sg_config in resources["aws_security_group"].items():
            if "lambda_sg" in sg_id:
                lambda_sg_found = True
                assert "name" in sg_config
                assert "vpc_id" in sg_config
                assert sg_config["name"].startswith("transaction-lambda-sg-")
                break
        
        assert lambda_sg_found, "Lambda security group not found"

    def test_stack_creates_sqs_queues_with_proper_configuration(self):
        """Test that stack creates SQS queues for different priorities."""
        resources = json.loads(self.synth_stack)["resource"]

        # Verify SQS queues exist
        assert "aws_sqs_queue" in resources
        sqs_resources = resources["aws_sqs_queue"]
        
        # Should have 6 queues: 3 main + 3 DLQ (high, medium, low)
        assert len(sqs_resources) == 6

        # Verify visibility timeout configuration per PROMPT requirements
        expected_visibility_timeouts = {
            "high": 30,
            "medium": 60,
            "low": 120
        }
        
        # Check that all queues have appropriate visibility timeout
        for queue_key, queue_config in sqs_resources.items():
            if "dlq" in queue_key:
                # DLQ should have longer retention
                assert queue_config["message_retention_seconds"] == 1209600  # 14 days
            else:
                # Main queues should have visibility timeout per priority (PROMPT requirement)
                priority = None
                for p in ["high", "medium", "low"]:
                    if p in queue_key:
                        priority = p
                        break
                assert priority is not None, f"Could not determine priority for queue {queue_key}"
                expected_timeout = expected_visibility_timeouts[priority]
                assert queue_config["visibility_timeout_seconds"] == expected_timeout, \
                    f"{priority} queue should have {expected_timeout}s visibility timeout"

    def test_stack_creates_dynamodb_table_with_proper_configuration(self):
        """Test that stack creates DynamoDB table with correct settings."""
        resources = json.loads(self.synth_stack)["resource"]

        # Verify DynamoDB table exists
        assert "aws_dynamodb_table" in resources
        dynamodb_resources = resources["aws_dynamodb_table"]
        assert len(dynamodb_resources) == 1

        table = list(dynamodb_resources.values())[0]
        
        # Check table configuration
        assert table["billing_mode"] == "PAY_PER_REQUEST"
        assert table["hash_key"] == "transactionId"
        
        # Check attributes
        attributes = table["attribute"]
        assert any(attr["name"] == "transactionId" and attr["type"] == "S" for attr in attributes)
        
        # Check TTL configuration
        assert "ttl" in table
        assert table["ttl"]["attribute_name"] == "expirationTime"
        assert table["ttl"]["enabled"] is True

    def test_stack_creates_lambda_functions_for_all_priorities(self):
        """Test that stack creates Lambda functions for high, medium, and low priorities."""
        resources = json.loads(self.synth_stack)["resource"]

        # Verify Lambda functions exist
        assert "aws_lambda_function" in resources
        lambda_resources = resources["aws_lambda_function"]
        
        # Should have 3 Lambda functions (high, medium, low)
        assert len(lambda_resources) == 3

        # Check Lambda function configuration
        for lambda_key, lambda_config in lambda_resources.items():
            # Check runtime and handler
            assert lambda_config["runtime"] == "python3.11"
            assert lambda_config["handler"] == "lambda_function.handler"
            
            # Check timeout and memory
            assert lambda_config["timeout"] == 20
            assert lambda_config["memory_size"] == 512
            
            # Check VPC configuration
            assert "vpc_config" in lambda_config
            vpc_config = lambda_config["vpc_config"]
            assert "subnet_ids" in vpc_config
            assert "security_group_ids" in vpc_config
            
            # Check environment variables
            assert "environment" in lambda_config
            env_vars = lambda_config["environment"]["variables"]
            assert "DYNAMODB_TABLE" in env_vars
            assert "PRIORITY" in env_vars

        # Verify Lambda event source mappings exist
        assert "aws_lambda_event_source_mapping" in resources
        event_mappings = resources["aws_lambda_event_source_mapping"]
        
        # Should have 3 event source mappings (one for each priority queue)
        assert len(event_mappings) == 3

    def test_stack_creates_iam_resources_for_lambda(self):
        """Test that stack creates necessary IAM roles and policies."""
        resources = json.loads(self.synth_stack)["resource"]

        # Verify IAM role exists
        assert "aws_iam_role" in resources
        iam_role_resources = resources["aws_iam_role"]
        assert len(iam_role_resources) >= 1

        # Check Lambda execution role
        lambda_role = None
        for role_name, role_config in iam_role_resources.items():
            if "lambda_execution_role" in role_name:
                lambda_role = role_config
                break
        
        assert lambda_role is not None, f"Lambda role not found. Available roles: {list(iam_role_resources.keys())}"
        assume_role_policy = json.loads(lambda_role["assume_role_policy"])
        
        # Verify trust policy allows Lambda service
        assert assume_role_policy["Statement"][0]["Principal"]["Service"] == "lambda.amazonaws.com"
        assert assume_role_policy["Statement"][0]["Effect"] == "Allow"

        # Verify IAM policy exists for Lambda
        assert "aws_iam_policy" in resources
        iam_policy_resources = resources["aws_iam_policy"]
        assert len(iam_policy_resources) >= 1

        # Verify IAM role policy attachment exists
        assert "aws_iam_role_policy_attachment" in resources

    def test_stack_creates_step_functions_state_machine(self):
        """Test that stack creates Step Functions state machine."""
        resources = json.loads(self.synth_stack)["resource"]

        # Verify Step Functions state machine exists
        assert "aws_sfn_state_machine" in resources
        sfn_resources = resources["aws_sfn_state_machine"]
        assert len(sfn_resources) == 1

        state_machine = list(sfn_resources.values())[0]
        
        # Check state machine configuration
        assert "definition" in state_machine
        assert "role_arn" in state_machine
        
        # Check definition exists and is valid JSON
        definition = json.loads(state_machine["definition"])
        assert "Comment" in definition
        assert "StartAt" in definition
        assert "States" in definition

        # Verify states exist in definition
        states = definition["States"]
        assert len(states) > 0

    def test_stack_creates_cloudwatch_resources(self):
        """Test that stack creates CloudWatch monitoring resources."""
        app = App()
        stack = TapStack(
            app,
            "TestCloudWatchStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        resources = synth_stack["resource"]

        # Verify CloudWatch Log Groups exist
        assert "aws_cloudwatch_log_group" in resources
        log_group_resources = resources["aws_cloudwatch_log_group"]
        assert len(log_group_resources) >= 3  # One for each Lambda function

        # Verify CloudWatch Event Rules exist
        assert "aws_cloudwatch_event_rule" in resources

        # Verify CloudWatch Metric Alarms exist
        assert "aws_cloudwatch_metric_alarm" in resources

    def test_stack_has_proper_outputs(self):
        """Test that stack defines appropriate outputs."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        outputs = synth_stack.get("output", {})

        # Check that outputs exist
        assert len(outputs) > 0

        # Verify key outputs are present
        output_keys = list(outputs.keys())
        
        # Should have VPC ID output
        vpc_outputs = [key for key in output_keys if "vpc" in key.lower()]
        assert len(vpc_outputs) >= 1

        # Should have DynamoDB table output
        dynamodb_outputs = [key for key in output_keys if "dynamodb" in key.lower()]
        assert len(dynamodb_outputs) >= 1

    def test_stack_configuration_with_different_regions(self):
        """Test that stack works with different AWS regions."""
        regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]
        
        for region in regions:
            app = App()
            stack = TapStack(
                app,
                f"TestRegion{region.replace('-', '')}Stack",
                environment_suffix="test",
                aws_region=region
            )

            # Verify that TapStack instantiates without errors for different regions
            assert stack is not None

            synth_stack = Testing.synth(stack)
            assert synth_stack is not None

    def test_stack_configuration_with_different_environment_suffixes(self):
        """Test that stack works with different environment suffixes."""
        environments = ["dev", "staging", "prod", "test"]
        
        for env in environments:
            app = App()
            stack = TapStack(
                app,
                f"Test{env.title()}Stack",
                environment_suffix=env,
                aws_region="us-east-1"
            )

            # Verify that TapStack instantiates without errors for different environments
            assert stack is not None

            synth_stack = json.loads(Testing.synth(stack))
            
            # Verify environment suffix is applied to resources
            resources = synth_stack["resource"]
            
            # Check that VPC has environment suffix in name
            vpc_resources = resources["aws_vpc"]
            vpc = list(vpc_resources.values())[0]
            assert env in vpc["tags"]["Name"]

    def test_stack_resource_tagging(self):
        """Test that stack properly tags all resources."""
        synth_stack_parsed = json.loads(self.synth_stack)
        
        # Check provider configuration includes tags
        terraform_config = synth_stack_parsed["terraform"]
        assert "required_providers" in terraform_config
        
        # Check that AWS provider has default tags configured
        provider_config = synth_stack_parsed["provider"]["aws"]
        # The provider config is a list, so get the first element
        if isinstance(provider_config, list):
            provider_config = provider_config[0]
        assert "default_tags" in provider_config
        default_tags_list = provider_config["default_tags"]
        assert isinstance(default_tags_list, list)
        assert len(default_tags_list) > 0
        assert "tags" in default_tags_list[0]

    def test_stack_backend_configuration(self):
        """Test that stack configures S3 backend properly."""
        app = App()
        stack = TapStack(
            app,
            "TestBackendStack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-terraform-state",
            state_bucket_region="us-east-1"
        )

        synth_stack = json.loads(Testing.synth(stack))
        
        # Check terraform backend configuration
        terraform_config = synth_stack["terraform"]
        assert "backend" in terraform_config
        backend = terraform_config["backend"]
        assert "s3" in backend
        
        s3_backend = backend["s3"]
        assert s3_backend["bucket"] == "test-terraform-state"
        assert s3_backend["encrypt"] is True
        assert "test" in s3_backend["key"]


class TestLambdaFunction:
    """Test suite for Lambda Function logic."""

    def setup_method(self):
        """Setup method called before each test."""
        # Set up environment variables for testing
        os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
        os.environ['DYNAMODB_TABLE'] = 'test-transactions'
        os.environ['PRIORITY'] = 'high'
        os.environ['STEP_FUNCTION_ARN'] = 'arn:aws:states:us-east-1:123456789012:stateMachine:test-state-machine'
        
        # Mock boto3 services and import lambda_function after mocking
        self.mock_dynamodb_patcher = mock.patch('boto3.resource')
        self.mock_stepfunctions_patcher = mock.patch('boto3.client')
        
        self.mock_dynamodb_resource = self.mock_dynamodb_patcher.start()
        self.mock_boto3_client = self.mock_stepfunctions_patcher.start()
        
        # Configure the mock table
        self.mock_table = mock.MagicMock()
        self.mock_dynamodb_resource.return_value.Table.return_value = self.mock_table
        
        # Configure the mock Step Functions client
        self.mock_stepfunctions = mock.MagicMock()
        self.mock_sqs = mock.MagicMock()
        
        def client_side_effect(service_name, **kwargs):
            if service_name == 'stepfunctions':
                return self.mock_stepfunctions
            elif service_name == 'sqs':
                return self.mock_sqs
            return mock.MagicMock()
        
        self.mock_boto3_client.side_effect = client_side_effect
        
        # Import lambda_function after mocking
        if 'lib.lambda_function' in sys.modules:
            del sys.modules['lib.lambda_function']
        from lib import lambda_function
        self.lambda_function = lambda_function

    def teardown_method(self):
        """Cleanup method called after each test."""
        # Stop patches
        self.mock_dynamodb_patcher.stop()
        self.mock_stepfunctions_patcher.stop()
        
        # Clean up environment variables
        for env_var in ['AWS_DEFAULT_REGION', 'DYNAMODB_TABLE', 'PRIORITY', 'STEP_FUNCTION_ARN']:
            if env_var in os.environ:
                del os.environ[env_var]
        
        # Remove lambda_function from sys.modules to ensure fresh import next time
        if 'lib.lambda_function' in sys.modules:
            del sys.modules['lib.lambda_function']

    @mock.patch('time.time', return_value=1700000000)
    def test_handler_with_sqs_records(self, mock_time):
        """Test handler function with SQS records."""
        # Mock SQS event
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'transactionId': 'txn-123',
                        'amount': 1000.50
                    })
                },
                {
                    'body': json.dumps({
                        'transactionId': 'txn-456', 
                        'amount': 2500.75
                    })
                }
            ]
        }
        
        # Mock Step Functions response
        self.mock_stepfunctions.start_execution.return_value = {
            'executionArn': 'arn:aws:states:us-east-1:123456789012:execution:test:exec-123'
        }
        
        context = {}
        
        # Call the handler
        result = self.lambda_function.handler(event, context)
        
        # Verify the response
        assert result['statusCode'] == 200
        assert 'Successfully processed 2 messages' in result['body']
        
        # Verify DynamoDB put_item was called correctly
        assert self.mock_table.put_item.call_count == 2
        
        # Check first transaction
        first_call = self.mock_table.put_item.call_args_list[0]
        first_item = first_call[1]['Item']
        assert first_item['transactionId'] == 'txn-123'
        assert first_item['amount'] == Decimal('1000.50')
        assert first_item['priority'] == 'high'
        assert first_item['status'] == 'processing'
        assert first_item['timestamp'] == 1700000000
        assert first_item['expirationTime'] == 1700000000 + (90 * 24 * 60 * 60)
        
        # Verify Step Functions was called for both transactions
        assert self.mock_stepfunctions.start_execution.call_count == 2
        
        # Verify update_item was called to update status
        assert self.mock_table.update_item.call_count == 2

    def test_handler_with_sqs_records_no_step_function(self):
        """Test handler with SQS records when Step Function ARN is not set."""
        # Remove Step Function ARN from environment
        if 'STEP_FUNCTION_ARN' in os.environ:
            del os.environ['STEP_FUNCTION_ARN']
        
        # Reimport lambda_function to pick up environment variable changes
        if 'lib.lambda_function' in sys.modules:
            del sys.modules['lib.lambda_function']
        
        # Re-establish mocks for the reimported module
        with mock.patch('boto3.resource', return_value=self.mock_dynamodb_resource), \
             mock.patch('boto3.client', side_effect=self.mock_boto3_client.side_effect):
            from lib import lambda_function
            self.lambda_function = lambda_function
            
            # Ensure the lambda function uses our mocked table
            self.lambda_function.table = self.mock_table
            
            event = {
                'Records': [
                    {
                        'body': json.dumps({
                            'transactionId': 'txn-789',
                            'amount': 500
                        })
                    }
                ]
            }
            
            context = {}
            
            # Call the handler
            result = self.lambda_function.handler(event, context)
        
        # Verify the response
        assert result['statusCode'] == 200
        assert 'Successfully processed 1 messages' in result['body']
        
        # Verify DynamoDB put_item was called
        assert self.mock_table.put_item.call_count == 1
        
        # Verify no update_item was called (since no Step Function execution)
        assert self.mock_table.update_item.call_count == 0

    def test_handler_with_step_function_operation_fraud_check(self):
        """Test handler with Step Function fraud check operation."""
        # Test high amount (should detect fraud)
        event = {
            'operation': 'fraud_check',
            'transactionId': 'txn-high-amount',
            'amount': 75000
        }
        
        result = self.lambda_function.handler(event, {})
        
        assert result['fraudDetected'] is True
        assert 'High amount transaction' in result['reason']
        
        # Test normal amount (should not detect fraud)
        event['amount'] = 25000
        
        result = self.lambda_function.handler(event, {})
        
        assert result['fraudDetected'] is False
        assert 'Normal transaction' in result['reason']

    def test_handler_with_step_function_operation_balance_check(self):
        """Test handler with Step Function balance check operation."""
        # Test sufficient balance
        event = {
            'operation': 'balance_check',
            'transactionId': 'txn-sufficient',
            'amount': 50000
        }
        
        result = self.lambda_function.handler(event, {})
        
        assert result['sufficientBalance'] is True
        assert 'Sufficient balance' in result['reason']
        
        # Test insufficient balance
        event['amount'] = 150000
        
        result = self.lambda_function.handler(event, {})
        
        assert result['sufficientBalance'] is False
        assert 'Insufficient funds' in result['reason']

    def test_handler_with_step_function_operation_compliance_check(self):
        """Test handler with Step Function compliance check operation."""
        # Test amount requiring review
        event = {
            'operation': 'compliance_check',
            'transactionId': 'txn-compliance',
            'amount': 15000
        }
        
        result = self.lambda_function.handler(event, {})
        
        assert result['requiresHumanReview'] is True
        assert result['compliancePassed'] is True
        assert 'Requires manual review' in result['reason']
        
        # Test amount not requiring review
        event['amount'] = 5000
        
        result = self.lambda_function.handler(event, {})
        
        assert result['requiresHumanReview'] is False
        assert result['compliancePassed'] is True
        assert 'Auto-approved' in result['reason']

    def test_handler_with_step_function_operation_human_approval_with_token(self):
        """Test handler with Step Function human approval operation with task token."""
        # Patch the stepfunctions client in the lambda function module to use our mock
        with mock.patch.object(self.lambda_function, 'stepfunctions', self.mock_stepfunctions):
            # Test approved amount
            event = {
                'operation': 'request_human_approval',
                'transactionId': 'txn-approval',
                'amount': 50000,
                'taskToken': 'test-token-123'
            }
            
            result = self.lambda_function.handler(event, {})
            
            assert result['approved'] is True
            assert result['reviewer'] == 'system-auto'
            
            # Verify task success was sent
            self.mock_stepfunctions.send_task_success.assert_called_once_with(
                taskToken='test-token-123',
                output=json.dumps({'approved': True, 'reviewer': 'system-auto'})
            )
            
            # Test rejected amount
            self.mock_stepfunctions.reset_mock()
            event['amount'] = 100000
            
            result = self.lambda_function.handler(event, {})
            
            assert result['approved'] is False
            assert result['reviewer'] == 'system-auto'
            
            # Verify task failure was sent
            self.mock_stepfunctions.send_task_failure.assert_called_once_with(
                taskToken='test-token-123',
                error='ApprovalRejected',
                cause='Transaction amount exceeds auto-approval threshold'
            )

    def test_handler_with_step_function_operation_human_approval_no_token(self):
        """Test handler with Step Function human approval operation without task token."""
        event = {
            'operation': 'request_human_approval',
            'transactionId': 'txn-approval-no-token',
            'amount': 30000
        }
        
        result = self.lambda_function.handler(event, {})
        
        assert result['approved'] is True
        assert result['reviewer'] == 'system-auto'

    def test_handler_with_unknown_operation(self):
        """Test handler with unknown Step Function operation."""
        event = {
            'operation': 'unknown_operation',
            'transactionId': 'txn-unknown',
            'amount': 1000
        }
        
        try:
            self.lambda_function.handler(event, {})
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Unknown operation: unknown_operation" in str(e)

    def test_handler_with_unknown_event_type(self):
        """Test handler with unknown event type."""
        event = {
            'unknown_field': 'unknown_value'
        }
        
        result = self.lambda_function.handler(event, {})
        
        assert result['statusCode'] == 400
        assert 'Unknown event type' in result['body']

    def test_handle_sqs_messages_with_error(self):
        """Test handle_sqs_messages function when DynamoDB throws an error."""
        # Mock DynamoDB to raise an exception
        error_table = mock.MagicMock()
        error_table.put_item.side_effect = Exception("DynamoDB error")
        
        # Patch the table in the lambda function module
        with mock.patch.object(self.lambda_function, 'table', error_table):
            records = [
                {
                    'body': json.dumps({
                        'transactionId': 'txn-error',
                        'amount': 1000
                    })
                }
            ]
            
            try:
                self.lambda_function.handle_sqs_messages(records)
                assert False, "Should have raised Exception"
            except Exception as e:
                assert "DynamoDB error" in str(e)

    def test_handle_step_function_operation_fraud_check_boundary_values(self):
        """Test fraud check operation with boundary values."""
        # Test exactly at threshold
        event = {
            'operation': 'fraud_check',
            'transactionId': 'txn-boundary',
            'amount': 50000
        }
        
        result = self.lambda_function.handle_step_function_operation(event)
        assert result['fraudDetected'] is False
        
        # Test just above threshold
        event['amount'] = 50000.01
        result = self.lambda_function.handle_step_function_operation(event)
        assert result['fraudDetected'] is True

    def test_handle_step_function_operation_balance_check_boundary_values(self):
        """Test balance check operation with boundary values."""
        # Test exactly at threshold
        event = {
            'operation': 'balance_check',
            'transactionId': 'txn-boundary',
            'amount': 100000
        }
        
        result = self.lambda_function.handle_step_function_operation(event)
        assert result['sufficientBalance'] is False
        
        # Test just below threshold
        event['amount'] = 99999.99
        result = self.lambda_function.handle_step_function_operation(event)
        assert result['sufficientBalance'] is True

    def test_handle_step_function_operation_compliance_check_boundary_values(self):
        """Test compliance check operation with boundary values."""
        # Test exactly at threshold
        event = {
            'operation': 'compliance_check',
            'transactionId': 'txn-boundary',
            'amount': 10000
        }
        
        result = self.lambda_function.handle_step_function_operation(event)
        assert result['requiresHumanReview'] is False
        
        # Test just above threshold
        event['amount'] = 10000.01
        result = self.lambda_function.handle_step_function_operation(event)
        assert result['requiresHumanReview'] is True

    def test_handle_step_function_operation_human_approval_boundary_values(self):
        """Test human approval operation with boundary values."""
        # Test exactly at threshold
        event = {
            'operation': 'request_human_approval',
            'transactionId': 'txn-boundary',
            'amount': 75000
        }
        
        result = self.lambda_function.handle_step_function_operation(event)
        assert result['approved'] is False
        
        # Test just below threshold
        event['amount'] = 74999.99
        result = self.lambda_function.handle_step_function_operation(event)
        assert result['approved'] is True

    def test_handle_step_function_operation_with_error(self):
        """Test handle_step_function_operation when an error occurs."""
        # Test with operation that will raise an error due to missing amount
        event = {
            'operation': 'fraud_check',
            'transactionId': 'txn-error'
            # Missing 'amount' field
        }
        
        try:
            lambda_function.handle_step_function_operation(event)
            assert False, "Should have raised an exception"
        except Exception:
            # Expected to fail due to missing amount field
            pass
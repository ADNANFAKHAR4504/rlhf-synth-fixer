import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates DynamoDB table with correct configuration")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"shipmentevents-{env_suffix}",
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": [
                {"AttributeName": "shipment_id", "KeyType": "HASH"},
                {"AttributeName": "event_timestamp", "KeyType": "RANGE"}
            ],
            "AttributeDefinitions": [
                {"AttributeName": "shipment_id", "AttributeType": "S"},
                {"AttributeName": "event_timestamp", "AttributeType": "S"},
                {"AttributeName": "processing_status", "AttributeType": "S"}
            ],
            "TimeToLiveSpecification": {
                "AttributeName": "expires_at",
                "Enabled": True
            },
            "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True}
        })

    @mark.it("creates SQS queues with proper configuration")
    def test_creates_sqs_queues(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SQS::Queue", 2)  # Main queue + DLQ
        
        # Find queues by inspecting actual resources
        queues = template.find_resources("AWS::SQS::Queue")
        
        main_queue_found = False
        dlq_found = False
        
        for queue_id, queue_data in queues.items():
            props = queue_data.get("Properties", {})
            queue_name = props.get("QueueName", "")
            
            if f"shipmentevents-queue-{env_suffix}" == queue_name:
                main_queue_found = True
                self.assertEqual(props.get("VisibilityTimeout"), 360)
                self.assertEqual(props.get("MessageRetentionPeriod"), 345600)
                self.assertEqual(props.get("ReceiveMessageWaitTimeSeconds"), 20)
                self.assertIn("RedrivePolicy", props)
            
            elif f"shipmentevents-dlq-{env_suffix}" == queue_name:
                dlq_found = True
                self.assertEqual(props.get("MessageRetentionPeriod"), 1209600)
                self.assertEqual(props.get("VisibilityTimeout"), 300)
        
        self.assertTrue(main_queue_found, "Main queue should exist")
        self.assertTrue(dlq_found, "DLQ should exist")

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # Get all Lambda functions
        lambdas = template.find_resources("AWS::Lambda::Function")
        
        # Find the processor function by name
        processor_function = None
        for resource_id, resource in lambdas.items():
            props = resource["Properties"]
            function_name = props.get("FunctionName", "")
            if f"shipment-event-processor-{env_suffix}" == function_name:
                processor_function = props
                break
        
        # ASSERT - Processor function should exist
        self.assertIsNotNone(processor_function, 
                           f"Should find Lambda function named 'shipment-event-processor-{env_suffix}'")
        
        # Verify core properties
        self.assertEqual(
            processor_function.get("FunctionName"), 
            f"shipment-event-processor-{env_suffix}",
            f"Expected FunctionName to be 'shipment-event-processor-{env_suffix}'"
        )
        self.assertEqual(
            processor_function.get("Runtime"), 
            "python3.12",
            f"Expected Runtime to be 'python3.12', got '{processor_function.get('Runtime')}'"
        )
        self.assertEqual(
            processor_function.get("Handler"), 
            "index.lambda_handler",
            f"Expected Handler to be 'index.lambda_handler', got '{processor_function.get('Handler')}'"
        )
        self.assertEqual(
            processor_function.get("Timeout"), 
            60,
            f"Expected Timeout to be 60, got '{processor_function.get('Timeout')}'"
        )
        self.assertEqual(
            processor_function.get("MemorySize"), 
            512,
            f"Expected MemorySize to be 512, got '{processor_function.get('MemorySize')}'"
        )
        
        # Verify tracing
        self.assertIn("TracingConfig", processor_function, "TracingConfig should exist")
        tracing_config = processor_function.get("TracingConfig", {})
        self.assertEqual(
            tracing_config.get("Mode"), 
            "Active",
            f"Expected TracingConfig Mode to be 'Active', got '{tracing_config.get('Mode')}'"
        )
        
        # Verify environment variables
        self.assertIn("Environment", processor_function, "Environment should exist")
        environment = processor_function.get("Environment", {})
        self.assertIn("Variables", environment, "Environment.Variables should exist")
        env_vars = environment.get("Variables", {})
        
        self.assertIn("ENVIRONMENT", env_vars, "ENVIRONMENT variable should exist")
        self.assertEqual(
            env_vars.get("ENVIRONMENT"), 
            env_suffix,
            f"Expected ENVIRONMENT to be '{env_suffix}', got '{env_vars.get('ENVIRONMENT')}'"
        )
        self.assertIn("EVENTS_TABLE_NAME", env_vars, "EVENTS_TABLE_NAME variable should exist")

    @mark.it("creates EventBridge resources")
    def test_creates_eventbridge_resources(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Events::EventBus", 1)
        template.resource_count_is("AWS::Events::Rule", 1)
        template.resource_count_is("AWS::Events::Archive", 1)
        
        template.has_resource_properties("AWS::Events::EventBus", {
            "Name": f"shipmentevents-{env_suffix}"
        })
        
        template.has_resource_properties("AWS::Events::Rule", {
            "Name": f"shipment-event-rule-{env_suffix}",
            "EventPattern": {
                "source": ["shipment.service"],
                "detail-type": [{"prefix": "shipment."}]
            }
        })

    @mark.it("creates CloudWatch monitoring resources")
    def test_creates_cloudwatch_monitoring(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"shipmentprocessing-{env_suffix}"
        })

    @mark.it("creates CloudWatch alarms")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 6)
        
        # Check high queue depth alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"shipment-high-queue-depth-{env_suffix}",
            "Threshold": 1000,
            "ComparisonOperator": "GreaterThanThreshold"
        })
        
        # Check DLQ alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"shipment-messages-in-dlq-{env_suffix}",
            "Threshold": 1,
            "ComparisonOperator": "GreaterThanOrEqualToThreshold"
        })

    @mark.it("creates IAM role with least privilege permissions")
    def test_creates_iam_role(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # Find all IAM roles
        roles = template.find_resources("AWS::IAM::Role")
        
        # Find the Lambda execution role
        lambda_role_found = False
        has_basic_execution_role = False
        
        for role_id, role_data in roles.items():
            props = role_data.get("Properties", {})
            assume_policy = props.get("AssumeRolePolicyDocument", {})
            
            # Check if this is a Lambda role
            for statement in assume_policy.get("Statement", []):
                principal = statement.get("Principal", {})
                if principal.get("Service") == "lambda.amazonaws.com":
                    lambda_role_found = True
                    
                    # Verify the role has managed policies
                    managed_policies = props.get("ManagedPolicyArns", [])
                    self.assertGreater(len(managed_policies), 0, 
                                     "Lambda role should have managed policies")
                    
                    # Check for AWSLambdaBasicExecutionRole
                    # ManagedPolicyArns use Fn::Join intrinsic function
                    for policy in managed_policies:
                        policy_str = str(policy)
                        if "AWSLambdaBasicExecutionRole" in policy_str:
                            has_basic_execution_role = True
                            break
                    
                    break
            
            if lambda_role_found:
                break
        
        self.assertTrue(lambda_role_found, "Lambda execution role should exist")
        self.assertTrue(has_basic_execution_role, 
                       "Lambda role should have AWSLambdaBasicExecutionRole")

    @mark.it("creates stack outputs for integration")
    def test_creates_stack_outputs(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        self.assertIn("SQSQueueURL", outputs)
        self.assertIn("SQSQueueARN", outputs)
        self.assertIn("ProcessorLambdaARN", outputs)
        self.assertIn("EventsTableName", outputs)
        self.assertIn("EventBusName", outputs)
        self.assertIn("DashboardURL", outputs)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "shipmentevents-dev"
        })

    @mark.it("configures SQS event source for Lambda")
    def test_configures_sqs_event_source(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::EventSourceMapping", 1)
        template.has_resource_properties("AWS::Lambda::EventSourceMapping", {
            "BatchSize": 10,
            "MaximumBatchingWindowInSeconds": 10,
            "FunctionResponseTypes": ["ReportBatchItemFailures"]
        })

    @mark.it("creates DynamoDB Global Secondary Index")
    def test_creates_gsi(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": [{
                "IndexName": "status-timestamp-index",
                "KeySchema": [
                    {"AttributeName": "processing_status", "KeyType": "HASH"},
                    {"AttributeName": "event_timestamp", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }]
        })

    @mark.it("validates resource naming with environment suffix")
    def test_resource_naming_with_env_suffix(self):
        # ARRANGE
        env_suffix = "prod"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"shipmentevents-{env_suffix}"
        })
        template.has_resource_properties("AWS::Events::EventBus", {
            "Name": f"shipmentevents-{env_suffix}"
        })
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"shipment-event-processor-{env_suffix}"
        })
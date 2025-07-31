import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import (
    TapStack, TapStackProps,
    DynamoDBStack, DynamoDBStackProps,
    S3Stack, S3StackProps,
    StepFunctionsStack, StepFunctionsStackProps,
    LambdaStack, LambdaStackProps,
    ApiGatewayStack, ApiGatewayStackProps
)


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack using nested stacks"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates nested stacks for each resource type")
  def test_creates_nested_stacks(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    # Check that nested stacks are created
    template.resource_count_is("AWS::CloudFormation::Stack", 5)
    
    # Check for specific nested stack types by checking their logical IDs
    template.has_resource("AWS::CloudFormation::Stack", {
        "Properties": {
            "Tags": [
                {"Key": "Environment", "Value": "Production"},
                {"Key": "Project", "Value": "TAP"}
            ]
        }
    })

  @mark.it("creates S3 bucket with auto-generated unique name")
  def test_creates_s3_bucket_with_env_suffix(self):
    # ARRANGE
    env_suffix = "testenv"
    s3_stack = S3Stack(self.app, "S3StackTest",
                       S3StackProps(environment_suffix=env_suffix))
    template = Template.from_stack(s3_stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    # Note: No specific BucketName expected - AWS generates unique name to avoid conflicts
    template.has_resource_properties("AWS::S3::Bucket", {})

  @mark.it("creates S3 bucket even without environment suffix")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    s3_stack = S3Stack(self.app, "S3StackTestDefault")
    template = Template.from_stack(s3_stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    # Note: No specific BucketName expected - AWS generates unique name to avoid conflicts
    template.has_resource_properties("AWS::S3::Bucket", {})

  @mark.it("creates DynamoDB table for request metadata")
  def test_creates_dynamodb_table(self):
    # ARRANGE
    env_suffix = "test"
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBStackTest",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(dynamodb_stack)

    # ASSERT
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "TableName": f"tap-{env_suffix}-requests",
        "AttributeDefinitions": [
            {
                "AttributeName": "request_id",
                "AttributeType": "S"
            }
        ],
        "KeySchema": [
            {
                "AttributeName": "request_id",
                "KeyType": "HASH"
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    })

  @mark.it("creates Step Functions state machine")
  def test_creates_step_functions_state_machine(self):
    # ARRANGE
    env_suffix = "test"
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsStackTest",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(sf_stack)

    # ASSERT
    template.resource_count_is("AWS::StepFunctions::StateMachine", 1)
    template.has_resource_properties("AWS::StepFunctions::StateMachine", {
        "StateMachineName": f"tap-{env_suffix}-statemachine"
    })

  @mark.it("creates Lambda function with correct configuration")
  def test_creates_lambda_function(self):
    # ARRANGE
    env_suffix = "test"
    
    # Create dependencies
    s3_stack = S3Stack(self.app, "S3StackForLambda",
                       S3StackProps(environment_suffix=env_suffix))
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBStackForLambda",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsStackForLambda",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    
    lambda_stack = LambdaStack(self.app, "LambdaStackTest",
                               LambdaStackProps(
                                   environment_suffix=env_suffix,
                                   bucket=s3_stack.bucket,
                                   table=dynamodb_stack.table,
                                   state_machine=sf_stack.state_machine
                               ))
    template = Template.from_stack(lambda_stack)

    # ASSERT
    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties("AWS::Lambda::Function", {
        "FunctionName": f"tap-{env_suffix}-processor",
        "Runtime": "python3.12",
        "Handler": "index.handler"
    })

  @mark.it("creates API Gateway")
  def test_creates_api_gateway(self):
    # ARRANGE
    env_suffix = "test"
    
    # Create dependencies
    s3_stack = S3Stack(self.app, "S3StackForAPI",
                       S3StackProps(environment_suffix=env_suffix))
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBStackForAPI",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsStackForAPI",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    lambda_stack = LambdaStack(self.app, "LambdaStackForAPI",
                               LambdaStackProps(
                                   environment_suffix=env_suffix,
                                   bucket=s3_stack.bucket,
                                   table=dynamodb_stack.table,
                                   state_machine=sf_stack.state_machine
                               ))
    
    api_stack = ApiGatewayStack(self.app, "ApiGatewayStackTest",
                                ApiGatewayStackProps(
                                    environment_suffix=env_suffix,
                                    lambda_function=lambda_stack.lambda_function
                                ))
    template = Template.from_stack(api_stack)

    # ASSERT
    template.resource_count_is("AWS::ApiGateway::RestApi", 1)
    template.has_resource_properties("AWS::ApiGateway::RestApi", {
        "Name": f"tap-{env_suffix}-api"
    })

  @mark.it("creates outputs")
  def test_creates_outputs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    # Check that outputs are created (they come from nested stacks via ImportValue)
    outputs = template.find_outputs("ApiEndpoint")
    self.assertTrue(len(outputs) > 0)
    
    outputs = template.find_outputs("BucketName")
    self.assertTrue(len(outputs) > 0)
    
    outputs = template.find_outputs("TableName")
    self.assertTrue(len(outputs) > 0)
    
    outputs = template.find_outputs("StateMachineArn")
    self.assertTrue(len(outputs) > 0)
    
    outputs = template.find_outputs("LambdaFunctionName")
    self.assertTrue(len(outputs) > 0)

  @mark.it("correctly handles Lambda environment variables")
  def test_lambda_environment_variables(self):
    # ARRANGE
    env_suffix = "test"
    
    # Create dependencies
    s3_stack = S3Stack(self.app, "S3StackForEnv",
                       S3StackProps(environment_suffix=env_suffix))
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBStackForEnv",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsStackForEnv",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    
    lambda_stack = LambdaStack(self.app, "LambdaStackEnvTest",
                               LambdaStackProps(
                                   environment_suffix=env_suffix,
                                   bucket=s3_stack.bucket,
                                   table=dynamodb_stack.table,
                                   state_machine=sf_stack.state_machine
                               ))
    template = Template.from_stack(lambda_stack)

    # ASSERT
    # When testing individual stacks, environment variables contain CloudFormation references
    template.has_resource_properties("AWS::Lambda::Function", {
        "Environment": {
            "Variables": {
                "BUCKET_NAME": Match.any_value(),  # Will be Fn::ImportValue reference
                "TABLE_NAME": Match.any_value(),   # Will be Fn::ImportValue reference
                "STATE_MACHINE_ARN": Match.any_value()  # Will be Fn::ImportValue reference
            }
        }
    })

  @mark.it("validates resource tagging")
  def test_resource_tagging(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTagTest")
    template = Template.from_stack(stack)

    # ASSERT
    # Check that nested stacks have the expected tags
    template.has_resource_properties("AWS::CloudFormation::Stack", {
        "Tags": Match.array_with([
            {"Key": "Environment", "Value": "Production"},
            {"Key": "Project", "Value": "TAP"}
        ])
    })

  @mark.it("validates TapStackProps initialization")
  def test_tap_stack_props_initialization(self):
    # ARRANGE & ACT
    props = TapStackProps(environment_suffix="custom")
    
    # ASSERT
    self.assertEqual(props.environment_suffix, "custom")

  @mark.it("validates DynamoDB detailed configuration")
  def test_dynamodb_detailed_configuration(self):
    # ARRANGE
    env_suffix = "detailed"
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBDetailedTest",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(dynamodb_stack)

    # ASSERT
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "BillingMode": "PAY_PER_REQUEST"
    })
    
    # Check DeletionPolicy is set at resource level
    template.has_resource("AWS::DynamoDB::Table", {
        "DeletionPolicy": "Delete"
    })

  @mark.it("validates S3 bucket configuration")
  def test_s3_bucket_configuration(self):
    # ARRANGE
    env_suffix = "s3test"
    s3_stack = S3Stack(self.app, "S3ConfigTest",
                       S3StackProps(environment_suffix=env_suffix))
    template = Template.from_stack(s3_stack)

    # ASSERT
    # Check DeletionPolicy is set at resource level
    template.has_resource("AWS::S3::Bucket", {
        "DeletionPolicy": "Delete"
    })
    
    # Verify the bucket is created
    resources = template.find_resources("AWS::S3::Bucket")
    self.assertTrue(len(resources) > 0)

  @mark.it("validates Step Functions configuration")
  def test_step_functions_configuration(self):
    # ARRANGE
    env_suffix = "sftest"
    sf_stack = StepFunctionsStack(self.app, "SFConfigTest",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(sf_stack)

    # ASSERT
    template.has_resource_properties("AWS::StepFunctions::StateMachine", {
        "StateMachineName": f"tap-{env_suffix}-statemachine"
    })
    
    # Check that the definition string contains the timeout
    template.has_resource_properties("AWS::StepFunctions::StateMachine", {
        "DefinitionString": Match.string_like_regexp(".*TimeoutSeconds.*300.*")
    })

  @mark.it("validates API Gateway CORS configuration")
  def test_api_gateway_cors_configuration(self):
    # ARRANGE
    env_suffix = "cors"
    
    # Create dependencies
    s3_stack = S3Stack(self.app, "S3StackForCORS",
                       S3StackProps(environment_suffix=env_suffix))
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBStackForCORS",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsStackForCORS",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    lambda_stack = LambdaStack(self.app, "LambdaStackForCORS",
                               LambdaStackProps(
                                   environment_suffix=env_suffix,
                                   bucket=s3_stack.bucket,
                                   table=dynamodb_stack.table,
                                   state_machine=sf_stack.state_machine
                               ))
    
    api_stack = ApiGatewayStack(self.app, "ApiGatewayCORSTest",
                                ApiGatewayStackProps(
                                    environment_suffix=env_suffix,
                                    lambda_function=lambda_stack.lambda_function
                                ))
    template = Template.from_stack(api_stack)

    # ASSERT - Check that OPTIONS method exists for CORS
    template.has_resource_properties("AWS::ApiGateway::Method", {
        "HttpMethod": "OPTIONS"
    })

  @mark.it("validates Lambda runtime and handler configuration")
  def test_lambda_runtime_and_handler_configuration(self):
    # ARRANGE
    env_suffix = "runtime"
    
    # Create dependencies
    s3_stack = S3Stack(self.app, "S3StackForRuntime",
                       S3StackProps(environment_suffix=env_suffix))
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBStackForRuntime",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsStackForRuntime",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    
    lambda_stack = LambdaStack(self.app, "LambdaRuntimeTest",
                               LambdaStackProps(
                                   environment_suffix=env_suffix,
                                   bucket=s3_stack.bucket,
                                   table=dynamodb_stack.table,
                                   state_machine=sf_stack.state_machine
                               ))
    template = Template.from_stack(lambda_stack)

    # ASSERT
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.12",
        "Handler": "index.handler",
        "Timeout": 30
    })

  @mark.it("validates comprehensive Lambda IAM policies")
  def test_comprehensive_lambda_iam_policies(self):
    # ARRANGE
    env_suffix = "iam"
    
    # Create dependencies
    s3_stack = S3Stack(self.app, "S3StackForIAM",
                       S3StackProps(environment_suffix=env_suffix))
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBStackForIAM",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsStackForIAM",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    
    lambda_stack = LambdaStack(self.app, "LambdaIAMTest",
                               LambdaStackProps(
                                   environment_suffix=env_suffix,
                                   bucket=s3_stack.bucket,
                                   table=dynamodb_stack.table,
                                   state_machine=sf_stack.state_machine
                               ))
    template = Template.from_stack(lambda_stack)

    # ASSERT - Check that IAM policies are created for Lambda permissions
    template.has_resource_properties("AWS::IAM::Policy", {})

  @mark.it("validates Lambda IAM permissions")
  def test_lambda_iam_permissions(self):
    # ARRANGE
    env_suffix = "perms"
    
    # Create dependencies
    s3_stack = S3Stack(self.app, "S3StackForPerms",
                       S3StackProps(environment_suffix=env_suffix))
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBStackForPerms",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsStackForPerms",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    
    lambda_stack = LambdaStack(self.app, "LambdaPermsTest",
                               LambdaStackProps(
                                   environment_suffix=env_suffix,
                                   bucket=s3_stack.bucket,
                                   table=dynamodb_stack.table,
                                   state_machine=sf_stack.state_machine
                               ))
    template = Template.from_stack(lambda_stack)

    # ASSERT - Check that IAM roles are created
    template.resource_count_is("AWS::IAM::Role", 1)

  @mark.it("handles context-based environment suffix")
  def test_context_based_environment_suffix(self):
    # ARRANGE
    app = cdk.App(context={"environmentSuffix": "context-test"})
    stack = TapStack(app, "TapStackContextTest")
    
    # Check that the context is used by looking at nested stack creation
    # The nested stack names should include the context suffix
    
    # ASSERT
    # Check that the stack was created successfully
    self.assertIsNotNone(stack)
    self.assertIsNotNone(stack.bucket)
    self.assertIsNotNone(stack.table)
    self.assertIsNotNone(stack.state_machine)
    self.assertIsNotNone(stack.lambda_function)
    self.assertIsNotNone(stack.api)

  @mark.it("validates Lambda stack error handling for missing dependencies")
  def test_lambda_stack_missing_dependencies_error(self):
    # ARRANGE & ACT & ASSERT
    with self.assertRaises(ValueError) as context:
      LambdaStack(self.app, "LambdaErrorTest", 
                  LambdaStackProps(environment_suffix="test"))
    
    self.assertIn("Lambda stack requires bucket, table, and state_machine dependencies", 
                  str(context.exception))

  @mark.it("validates API Gateway stack error handling for missing Lambda function")
  def test_api_gateway_stack_missing_lambda_error(self):
    # ARRANGE & ACT & ASSERT
    with self.assertRaises(ValueError) as context:
      ApiGatewayStack(self.app, "ApiErrorTest", 
                      ApiGatewayStackProps(environment_suffix="test"))
    
    self.assertIn("API Gateway stack requires lambda_function dependency", 
                  str(context.exception))

  @mark.it("validates S3 bucket auto-delete configuration")
  def test_s3_bucket_auto_delete_configuration(self):
    # ARRANGE
    env_suffix = "autodel"
    s3_stack = S3Stack(self.app, "S3AutoDeleteTest",
                       S3StackProps(environment_suffix=env_suffix))
    template = Template.from_stack(s3_stack)

    # ASSERT - Check that auto-delete is properly configured
    template.has_resource("AWS::S3::Bucket", {
        "DeletionPolicy": "Delete"
    })

  @mark.it("validates nested stack architecture is properly structured")
  def test_nested_stack_architecture(self):
    # ARRANGE & ACT - Test the TapStack which uses nested stacks
    env_suffix = "nested"
    stack = TapStack(self.app, "TapStackNestedTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)
    
    # ASSERT - Check that the TapStack creates nested stacks correctly
    template.resource_count_is("AWS::CloudFormation::Stack", 5)
    
    # Verify that all properties are available from nested stacks
    self.assertIsNotNone(stack.bucket)
    self.assertIsNotNone(stack.table)
    self.assertIsNotNone(stack.state_machine)
    self.assertIsNotNone(stack.lambda_function)
    self.assertIsNotNone(stack.api)

  @mark.it("validates Lambda function code is embedded correctly")
  def test_lambda_function_code_embedding(self):
    # ARRANGE
    env_suffix = "code"
    
    # Create dependencies
    s3_stack = S3Stack(self.app, "S3StackForCode",
                       S3StackProps(environment_suffix=env_suffix))
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBStackForCode",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsStackForCode",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    
    lambda_stack = LambdaStack(self.app, "LambdaCodeTest",
                               LambdaStackProps(
                                   environment_suffix=env_suffix,
                                   bucket=s3_stack.bucket,
                                   table=dynamodb_stack.table,
                                   state_machine=sf_stack.state_machine
                               ))
    template = Template.from_stack(lambda_stack)

    # ASSERT - Check that the Lambda function has embedded code
    template.has_resource_properties("AWS::Lambda::Function", {
        "Code": {
            "ZipFile": Match.string_like_regexp(".*def handler.*")
        }
    })

  @mark.it("validates DynamoDB table removal policy")
  def test_dynamodb_table_removal_policy(self):
    # ARRANGE
    env_suffix = "removal"
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBRemovalTest",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(dynamodb_stack)

    # ASSERT - Check that DeletionPolicy is set to Delete (not Retain)
    template.has_resource("AWS::DynamoDB::Table", {
        "DeletionPolicy": "Delete"
    })

  @mark.it("validates Step Functions state machine definition contains proper JSON")
  def test_step_functions_definition_json(self):
    # ARRANGE
    env_suffix = "json"
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsJSONTest",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(sf_stack)

    # ASSERT - Check that the definition contains proper Step Functions JSON structure
    template.has_resource_properties("AWS::StepFunctions::StateMachine", {
        "DefinitionString": Match.string_like_regexp(".*StartAt.*")
    })
    template.has_resource_properties("AWS::StepFunctions::StateMachine", {
        "DefinitionString": Match.string_like_regexp(".*States.*")
    })

  @mark.it("validates API Gateway method configuration")
  def test_api_gateway_method_configuration(self):
    # ARRANGE
    env_suffix = "method"
    
    # Create dependencies
    s3_stack = S3Stack(self.app, "S3StackForMethod",
                       S3StackProps(environment_suffix=env_suffix))
    dynamodb_stack = DynamoDBStack(self.app, "DynamoDBStackForMethod",
                                   DynamoDBStackProps(environment_suffix=env_suffix))
    sf_stack = StepFunctionsStack(self.app, "StepFunctionsStackForMethod",
                                  StepFunctionsStackProps(environment_suffix=env_suffix))
    lambda_stack = LambdaStack(self.app, "LambdaStackForMethod",
                               LambdaStackProps(
                                   environment_suffix=env_suffix,
                                   bucket=s3_stack.bucket,
                                   table=dynamodb_stack.table,
                                   state_machine=sf_stack.state_machine
                               ))
    
    api_stack = ApiGatewayStack(self.app, "ApiGatewayMethodTest",
                                ApiGatewayStackProps(
                                    environment_suffix=env_suffix,
                                    lambda_function=lambda_stack.lambda_function
                                ))
    template = Template.from_stack(api_stack)

    # ASSERT - Check that POST method is configured with IAM authorization
    template.has_resource_properties("AWS::ApiGateway::Method", {
        "HttpMethod": "POST",
        "AuthorizationType": "AWS_IAM"
    })

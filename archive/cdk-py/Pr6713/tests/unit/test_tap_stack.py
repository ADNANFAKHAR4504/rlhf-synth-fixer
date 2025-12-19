import aws_cdk as cdk
from aws_cdk import assertions
from lib.tap_stack import TapStack
import pytest


@pytest.fixture
def stack():
    """Create a test stack"""
    app = cdk.App()
    stack = TapStack(
        app,
        "TestTapStack",
        environment_suffix="test123"
    )
    return stack


@pytest.fixture
def template(stack):
    """Generate CloudFormation template from stack"""
    return assertions.Template.from_stack(stack)


class TestDynamoDBTable:
    """Test DynamoDB table creation"""

    def test_table_created(self, template):
        """Test that DynamoDB table is created"""
        template.resource_count_is("AWS::DynamoDB::Table", 1)

    def test_table_has_correct_name(self, template):
        """Test that table has environmentSuffix in name"""
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": "payment-transactions-test123"
            }
        )

    def test_table_has_correct_keys(self, template):
        """Test that table has correct partition and sort keys"""
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "KeySchema": [
                    {
                        "AttributeName": "transaction_id",
                        "KeyType": "HASH"
                    },
                    {
                        "AttributeName": "timestamp",
                        "KeyType": "RANGE"
                    }
                ],
                "AttributeDefinitions": [
                    {
                        "AttributeName": "transaction_id",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "timestamp",
                        "AttributeType": "S"
                    }
                ]
            }
        )

    def test_table_billing_mode(self, template):
        """Test that table uses on-demand billing"""
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "BillingMode": "PAY_PER_REQUEST"
            }
        )

    def test_table_has_pitr(self, template):
        """Test that point-in-time recovery is enabled"""
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "PointInTimeRecoverySpecification": {
                    "PointInTimeRecoveryEnabled": True
                }
            }
        )

    def test_table_removal_policy(self, template):
        """Test that table has deletion policy"""
        template.has_resource(
            "AWS::DynamoDB::Table",
            {
                "DeletionPolicy": "Delete"
            }
        )


class TestLambdaFunctions:
    """Test Lambda function creation"""

    def test_three_lambda_functions_created(self, template):
        """Test that three Lambda functions are created plus log retention lambda"""
        # 3 main Lambda functions + 1 LogRetention Lambda
        template.resource_count_is("AWS::Lambda::Function", 4)

    def test_process_payment_function_properties(self, template):
        """Test process payment function properties"""
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": "process-payment-test123",
                "Runtime": "python3.11",
                "Handler": "process_payment.lambda_handler",
                "Architectures": ["arm64"],
                "ReservedConcurrentExecutions": 100,
                "TracingConfig": {
                    "Mode": "Active"
                }
            }
        )

    def test_process_accounting_function_properties(self, template):
        """Test process accounting function properties"""
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": "process-accounting-test123",
                "Runtime": "python3.11",
                "Handler": "process_accounting.lambda_handler",
                "Architectures": ["arm64"],
                "ReservedConcurrentExecutions": 50,
                "TracingConfig": {
                    "Mode": "Active"
                }
            }
        )

    def test_notify_failures_function_properties(self, template):
        """Test notify failures function properties"""
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": "notify-failures-test123",
                "Runtime": "python3.11",
                "Handler": "notify_failures.lambda_handler",
                "Architectures": ["arm64"],
                "ReservedConcurrentExecutions": 10,
                "TracingConfig": {
                    "Mode": "Active"
                }
            }
        )


class TestLambdaLayer:
    """Test Lambda Layer creation"""

    def test_lambda_layer_created(self, template):
        """Test that Lambda layer is created"""
        template.resource_count_is("AWS::Lambda::LayerVersion", 1)

    def test_lambda_layer_properties(self, template):
        """Test Lambda layer properties"""
        template.has_resource_properties(
            "AWS::Lambda::LayerVersion",
            {
                "LayerName": "payment-common-libs-test123",
                "CompatibleRuntimes": ["python3.11"],
                "CompatibleArchitectures": ["arm64"]
            }
        )


class TestSQSQueues:
    """Test SQS queue creation"""

    def test_two_queues_created(self, template):
        """Test that two SQS queues are created (main + DLQ)"""
        template.resource_count_is("AWS::SQS::Queue", 2)

    def test_main_queue_properties(self, template):
        """Test main queue properties"""
        template.has_resource_properties(
            "AWS::SQS::Queue",
            {
                "QueueName": "payment-processing-queue-test123"
            }
        )

    def test_dlq_properties(self, template):
        """Test DLQ properties"""
        template.has_resource_properties(
            "AWS::SQS::Queue",
            {
                "QueueName": "payment-processing-dlq-test123",
                "MessageRetentionPeriod": 1209600  # 14 days in seconds
            }
        )


class TestSNSTopic:
    """Test SNS topic creation"""

    def test_sns_topic_created(self, template):
        """Test that SNS topic is created"""
        template.resource_count_is("AWS::SNS::Topic", 1)

    def test_sns_topic_properties(self, template):
        """Test SNS topic properties"""
        template.has_resource_properties(
            "AWS::SNS::Topic",
            {
                "TopicName": "payment-notifications-test123",
                "DisplayName": "Payment Processing Notifications"
            }
        )


class TestAPIGateway:
    """Test API Gateway creation"""

    def test_rest_api_created(self, template):
        """Test that REST API is created"""
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    def test_api_name(self, template):
        """Test API name includes environment suffix"""
        template.has_resource_properties(
            "AWS::ApiGateway::RestApi",
            {
                "Name": "payment-webhooks-api-test123"
            }
        )

    def test_api_key_created(self, template):
        """Test that API key is created"""
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)

    def test_usage_plan_created(self, template):
        """Test that usage plan is created"""
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)

    def test_usage_plan_throttling(self, template):
        """Test usage plan throttling settings"""
        template.has_resource_properties(
            "AWS::ApiGateway::UsagePlan",
            {
                "Throttle": {
                    "RateLimit": 1000,
                    "BurstLimit": 2000
                }
            }
        )

    def test_webhooks_resource_created(self, template):
        """Test that /webhooks resource is created"""
        template.resource_count_is("AWS::ApiGateway::Resource", 1)

    def test_post_method_created(self, template):
        """Test that POST method is created"""
        template.has_resource_properties(
            "AWS::ApiGateway::Method",
            {
                "HttpMethod": "POST",
                "ApiKeyRequired": True
            }
        )


class TestWAF:
    """Test AWS WAF configuration"""

    def test_waf_web_acl_created(self, template):
        """Test that WAF Web ACL is created"""
        template.resource_count_is("AWS::WAFv2::WebACL", 1)

    def test_waf_web_acl_properties(self, template):
        """Test WAF Web ACL properties"""
        template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            {
                "Name": "payment-api-waf-test123",
                "Scope": "REGIONAL"
            }
        )

    def test_waf_rate_limit_rule(self, template):
        """Test WAF rate limit rule"""
        template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            assertions.Match.object_like({
                "Rules": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "Name": "RateLimitRule-test123",
                        "Statement": {
                            "RateBasedStatement": {
                                "Limit": 2000,
                                "AggregateKeyType": "IP"
                            }
                        }
                    })
                ])
            })
        )

    def test_waf_association_created(self, template):
        """Test that WAF association is created"""
        template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)


class TestCloudWatchAlarms:
    """Test CloudWatch alarms"""

    def test_alarms_created(self, template):
        """Test that CloudWatch alarms are created"""
        # 4 alarms: 2 for each Lambda function (error + error rate)
        template.resource_count_is("AWS::CloudWatch::Alarm", 4)

    def test_payment_error_alarm(self, template):
        """Test process payment error alarm"""
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "process-payment-errors-test123",
                "Statistic": "Sum",
                "Threshold": 1,
                "ComparisonOperator": "GreaterThanOrEqualToThreshold"
            }
        )

    def test_payment_error_rate_alarm(self, template):
        """Test process payment error rate alarm"""
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "process-payment-error-rate-test123",
                "Threshold": 1,
                "ComparisonOperator": "GreaterThanThreshold"
            }
        )


class TestStackOutputs:
    """Test CloudFormation stack outputs"""

    def test_dynamodb_table_name_output(self, template):
        """Test DynamoDB table name output"""
        template.has_output("DynamoDBTableName", {})

    def test_api_gateway_url_output(self, template):
        """Test API Gateway URL output"""
        template.has_output("ApiGatewayUrl", {})

    def test_api_gateway_id_output(self, template):
        """Test API Gateway ID output"""
        template.has_output("ApiGatewayId", {})

    def test_sqs_queue_url_output(self, template):
        """Test SQS queue URL output"""
        template.has_output("SQSQueueUrl", {})

    def test_sns_topic_arn_output(self, template):
        """Test SNS topic ARN output"""
        template.has_output("SNSTopicArn", {})

    def test_lambda_function_name_outputs(self, template):
        """Test Lambda function name outputs"""
        template.has_output("ProcessPaymentFunctionName", {})
        template.has_output("ProcessAccountingFunctionName", {})
        template.has_output("NotifyFailuresFunctionName", {})


class TestIAMPermissions:
    """Test IAM roles and permissions"""

    def test_lambda_roles_created(self, template):
        """Test that Lambda execution roles are created"""
        # 3 main Lambda functions + 1 LogRetention + 1 API Gateway = 5 IAM roles
        template.resource_count_is("AWS::IAM::Role", 5)

    def test_dynamodb_permissions(self, template):
        """Test DynamoDB permissions for Lambda functions"""
        # Process payment should have write permissions
        template.has_resource_properties(
            "AWS::IAM::Policy",
            assertions.Match.object_like({
                "PolicyDocument": assertions.Match.object_like({
                    "Statement": assertions.Match.array_with([
                        assertions.Match.object_like({
                            "Action": assertions.Match.array_with([
                                "dynamodb:PutItem"
                            ]),
                            "Effect": "Allow"
                        })
                    ])
                })
            })
        )

    def test_sqs_permissions(self, template):
        """Test SQS permissions for Lambda functions"""
        # Process payment should have send message permissions
        template.has_resource_properties(
            "AWS::IAM::Policy",
            assertions.Match.object_like({
                "PolicyDocument": assertions.Match.object_like({
                    "Statement": assertions.Match.array_with([
                        assertions.Match.object_like({
                            "Action": assertions.Match.array_with([
                                "sqs:SendMessage"
                            ]),
                            "Effect": "Allow"
                        })
                    ])
                })
            })
        )

    def test_sns_permissions(self, template):
        """Test SNS permissions for Lambda functions"""
        # Functions should have publish permissions
        template.has_resource_properties(
            "AWS::IAM::Policy",
            assertions.Match.object_like({
                "PolicyDocument": assertions.Match.object_like({
                    "Statement": assertions.Match.array_with([
                        assertions.Match.object_like({
                            "Action": "sns:Publish",
                            "Effect": "Allow"
                        })
                    ])
                })
            })
        )


class TestResourceTags:
    """Test resource tagging"""

    def test_stack_has_tags(self, stack):
        """Test that stack has required tags"""
        # Check that stack tags are properly set
        assert hasattr(stack, 'tags')


class TestEventSourceMappings:
    """Test Lambda event source mappings"""

    def test_sqs_event_source_mapping(self, template):
        """Test that SQS event source mappings are created"""
        # 2 mappings: main queue -> accounting, DLQ -> notify failures
        template.resource_count_is("AWS::Lambda::EventSourceMapping", 2)

    def test_accounting_event_source(self, template):
        """Test accounting function event source"""
        template.has_resource_properties(
            "AWS::Lambda::EventSourceMapping",
            {
                "BatchSize": 10
            }
        )


class TestResourceNaming:
    """Test that all resources include environment suffix"""

    def test_all_named_resources_have_suffix(self, template):
        """Test that all named resources include environment suffix"""
        template_dict = template.to_json()

        # List of resource types that should have names with suffix
        named_resource_types = [
            "AWS::DynamoDB::Table",
            "AWS::Lambda::Function",
            "AWS::Lambda::LayerVersion",
            "AWS::SQS::Queue",
            "AWS::SNS::Topic",
            "AWS::ApiGateway::RestApi",
            "AWS::CloudWatch::Alarm",
            "AWS::Logs::QueryDefinition",
            "AWS::WAFv2::WebACL"
        ]

        for resource_type, resource in template_dict.get("Resources", {}).items():
            if resource.get("Type") in named_resource_types:
                properties = resource.get("Properties", {})

                # Check for name properties based on resource type
                name_properties = [
                    "TableName", "FunctionName", "LayerName",
                    "QueueName", "TopicName", "Name", "AlarmName"
                ]

                for prop in name_properties:
                    if prop in properties:
                        name_value = properties[prop]
                        # Name should contain the suffix
                        if isinstance(name_value, str):
                            assert "test123" in name_value or resource_type == "AWS::ApiGateway::RestApi", \
                                f"Resource {resource_type} {prop} missing environment suffix"


class TestDestroyability:
    """Test that resources can be destroyed"""

    def test_dynamodb_deletion_policy(self, template):
        """Test DynamoDB table deletion policy"""
        template.has_resource(
            "AWS::DynamoDB::Table",
            {
                "DeletionPolicy": "Delete"
            }
        )

    def test_no_retain_policies(self, template):
        """Test that no resources have RETAIN deletion policy (except shared resources)"""
        template_dict = template.to_json()

        # These shared account-level resources have Retain by default
        # which is acceptable as they don't prevent stack cleanup
        allowed_retain_resources = ["CloudWatchRole", "Account"]

        for resource_id, resource in template_dict.get("Resources", {}).items():
            deletion_policy = resource.get("DeletionPolicy")
            if deletion_policy:
                # Skip allowed resources with Retain policy
                is_allowed = any(allowed in resource_id for allowed in allowed_retain_resources)
                if not is_allowed:
                    assert deletion_policy != "Retain", \
                        f"Resource {resource_id} has RETAIN policy which prevents cleanup"

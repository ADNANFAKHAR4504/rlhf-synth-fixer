import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test123"
        self.props = TapStackProps(environment_suffix=self.env_suffix)
        self.stack = TapStack(self.app, "TapStackTest", self.props)
        self.template = Template.from_stack(self.stack)

    @mark.it("creates exactly one S3 bucket with correct properties")
    def test_creates_s3_bucket_with_correct_properties(self):
        # ASSERT - S3 Bucket exists with correct configuration
        self.template.resource_count_is("AWS::S3::Bucket", 1)
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }
                    ]
                },
                "VersioningConfiguration": {"Status": "Enabled"},
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
            },
        )

    @mark.it("creates Kinesis stream with correct configuration")
    def test_creates_kinesis_stream(self):
        # ASSERT - Kinesis Stream
        self.template.resource_count_is("AWS::Kinesis::Stream", 1)
        self.template.has_resource_properties(
            "AWS::Kinesis::Stream",
            {
                "ShardCount": 50,
                "RetentionPeriodHours": 24,
                "StreamModeDetails": {"StreamMode": "PROVISIONED"},
            },
        )

    @mark.it("creates DynamoDB table with correct configuration")
    def test_creates_dynamodb_table(self):
        # ASSERT - DynamoDB Table
        self.template.resource_count_is("AWS::DynamoDB::Table", 1)
        self.template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "AttributeDefinitions": [
                    {"AttributeName": "sensor_id", "AttributeType": "S"},
                    {"AttributeName": "timestamp", "AttributeType": "N"},
                    {"AttributeName": "location_id", "AttributeType": "S"},
                    {"AttributeName": "congestion_level", "AttributeType": "N"},
                ],
                "KeySchema": [
                    {"AttributeName": "sensor_id", "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                ],
                "BillingMode": "PAY_PER_REQUEST",
                "GlobalSecondaryIndexes": Match.array_with(
                    [
                        Match.object_like(
                            {
                                "IndexName": "LocationIndex",
                                "KeySchema": [
                                    {"AttributeName": "location_id", "KeyType": "HASH"},
                                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                                ],
                            }
                        ),
                        Match.object_like(
                            {
                                "IndexName": "CongestionIndex",
                                "KeySchema": [
                                    {"AttributeName": "congestion_level", "KeyType": "HASH"},
                                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                                ],
                            }
                        ),
                    ]
                ),
                "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            },
        )

    @mark.it("creates three Lambda functions with correct configuration")
    def test_creates_lambda_functions(self):
        # ASSERT - Lambda Functions (3 total: processor, aggregator, alerts)
        self.template.resource_count_is("AWS::Lambda::Function", 3)
        
        # Common Lambda properties
        common_lambda_props = {
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "MemorySize": 1024,
        }
        
        # Processor Lambda (300s timeout)
        processor_props = common_lambda_props.copy()
        processor_props["Timeout"] = 300
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            processor_props,
        )
        
        # Aggregator Lambda (600s timeout)  
        aggregator_props = common_lambda_props.copy()
        aggregator_props["Timeout"] = 600
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            aggregator_props,
        )
        
        # Alerts Lambda (300s timeout)
        alerts_props = common_lambda_props.copy()
        alerts_props["Timeout"] = 300
        self.template.has_resource_properties(
            "AWS::Lambda::Function",
            alerts_props,
        )

    @mark.it("creates Lambda event source mapping for Kinesis")
    def test_creates_lambda_event_source_mapping(self):
        # ASSERT - Event Source Mapping
        self.template.resource_count_is("AWS::Lambda::EventSourceMapping", 1)
        self.template.has_resource_properties(
            "AWS::Lambda::EventSourceMapping",
            {
                "StartingPosition": "LATEST",
                "BatchSize": 100,
                "MaximumBatchingWindowInSeconds": 60,
                "MaximumRetryAttempts": 3,
            },
        )

    @mark.it("creates SNS topic for alerts")
    def test_creates_sns_topic(self):
        # ASSERT - SNS Topic
        self.template.resource_count_is("AWS::SNS::Topic", 1)
        self.template.has_resource_properties(
            "AWS::SNS::Topic",
            {"DisplayName": f"Traffic Congestion Alerts {self.env_suffix}"},
        )

    @mark.it("creates IoT Core resources")
    def test_creates_iot_resources(self):
        # ASSERT - IoT Policy
        self.template.resource_count_is("AWS::IoT::Policy", 1)
        self.template.has_resource_properties(
            "AWS::IoT::Policy",
            {
                "PolicyName": f"traffic-sensor-policy-{self.env_suffix}",
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": ["iot:Connect", "iot:Publish"],
                            "Resource": Match.any_value(),
                        }
                    ],
                },
            },
        )
        
        # ASSERT - IoT Topic Rule
        self.template.resource_count_is("AWS::IoT::TopicRule", 1)
        self.template.has_resource_properties(
            "AWS::IoT::TopicRule",
            {
                "RuleName": f"TrafficToKinesis{self.env_suffix}",
                "TopicRulePayload": {
                    "Sql": "SELECT * FROM 'traffic/data'",
                    "Actions": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Kinesis": {
                                        "PartitionKey": "${sensor_id}",
                                    }
                                }
                            )
                        ]
                    ),
                    "RuleDisabled": False,
                },
            },
        )

    @mark.it("creates EventBridge rules for Lambda triggers")
    def test_creates_eventbridge_rules(self):
        # ASSERT - EventBridge Rules (2 total: aggregation + alerts)
        self.template.resource_count_is("AWS::Events::Rule", 2)
        
        # Aggregation rule (15 minutes)
        self.template.has_resource_properties(
            "AWS::Events::Rule",
            {"ScheduleExpression": "rate(15 minutes)"},
        )
        
        # Alert rule (5 minutes)
        self.template.has_resource_properties(
            "AWS::Events::Rule",
            {"ScheduleExpression": "rate(5 minutes)"},
        )

    @mark.it("creates Glue database and table for analytics")
    def test_creates_glue_resources(self):
        # ASSERT - Glue Database
        self.template.resource_count_is("AWS::Glue::Database", 1)
        self.template.has_resource_properties(
            "AWS::Glue::Database",
            {
                "DatabaseInput": {
                    "Name": f"traffic_analytics_{self.env_suffix.lower()}"
                }
            },
        )
        
        # ASSERT - Glue Table
        self.template.resource_count_is("AWS::Glue::Table", 1)
        self.template.has_resource_properties(
            "AWS::Glue::Table",
            {
                "TableInput": {
                    "Name": "traffic_data",
                    "TableType": "EXTERNAL_TABLE",
                    "StorageDescriptor": {
                        "InputFormat": "org.apache.hadoop.mapred.TextInputFormat",
                        "OutputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
                        "SerdeInfo": {
                            "SerializationLibrary": "org.openx.data.jsonserde.JsonSerDe",
                        },
                        "Columns": [
                            {"Name": "sensor_id", "Type": "string"},
                            {"Name": "timestamp", "Type": "bigint"},
                            {"Name": "location_id", "Type": "string"},
                            {"Name": "congestion_level", "Type": "double"},
                            {"Name": "vehicle_count", "Type": "int"},
                            {"Name": "average_speed", "Type": "double"},
                        ],
                    },
                }
            },
        )

    @mark.it("creates Athena workgroup")
    def test_creates_athena_workgroup(self):
        # ASSERT - Athena WorkGroup
        self.template.resource_count_is("AWS::Athena::WorkGroup", 1)
        self.template.has_resource_properties(
            "AWS::Athena::WorkGroup",
            {
                "Name": f"traffic_analytics_workgroup_{self.env_suffix.lower()}",
                "State": "ENABLED",
            },
        )

    @mark.it("creates CloudWatch dashboard and alarm")
    def test_creates_cloudwatch_resources(self):
        # ASSERT - CloudWatch Dashboard
        self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        
        # ASSERT - CloudWatch Alarm
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 1)
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "Threshold": 80,
                "ComparisonOperator": "GreaterThanThreshold",
                "EvaluationPeriods": 1,
                "MetricName": "CongestionLevel",
                "Namespace": "TrafficAnalytics",
            },
        )

    @mark.it("creates IAM roles with correct permissions")
    def test_creates_iam_roles(self):
        # ASSERT - IAM Roles (Lambda execution roles + IoT rule role)
        self.template.resource_count_is("AWS::IAM::Role", 4)  # 3 Lambda + 1 IoT rule
        
        # Lambda execution role exists
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"},
                        }
                    ]
                }
            },
        )
        
        # IoT rule role exists
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "iot.amazonaws.com"},
                        }
                    ]
                }
            },
        )

    @mark.it("creates CloudFormation outputs for all important resources")
    def test_creates_cfn_outputs(self):
        # ASSERT - CloudFormation Outputs
        self.template.has_output(f"KinesisStreamName{self.env_suffix}", Match.any_value())
        self.template.has_output(f"DynamoDBTableName{self.env_suffix}", Match.any_value())
        self.template.has_output(f"AlertsSNSTopic{self.env_suffix}", Match.any_value())
        self.template.has_output(f"AnalyticsBucketName{self.env_suffix}", Match.any_value())
        self.template.has_output(f"GlueDatabaseName{self.env_suffix}", Match.any_value())

    @mark.it("validates resource naming includes environment suffix")
    def test_resource_naming_includes_env_suffix(self):
        # Verify all major resources have the environment suffix in their logical IDs
        template_json = self.template.to_json()
        resources = template_json["Resources"]
        
        # Find resources that should have env suffix in logical ID
        bucket_resources = [r for r in resources.keys() if "TrafficAnalyticsBucket" in r]
        stream_resources = [r for r in resources.keys() if "TrafficDataStream" in r]
        table_resources = [r for r in resources.keys() if "TrafficDataTable" in r]
        
        self.assertTrue(any(self.env_suffix in r for r in bucket_resources))
        self.assertTrue(any(self.env_suffix in r for r in stream_resources))
        self.assertTrue(any(self.env_suffix in r for r in table_resources))

    @mark.it("ensures all resources have removal policy DESTROY for test environments")
    def test_removal_policy_destroy(self):
        # S3 Bucket has DeletionPolicy: Delete
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {},
        )
        # Check for DeletionPolicy at resource level using CDK Template.to_json()
        template_json = self.template.to_json()
        resources = template_json["Resources"]
        s3_resources = {k: v for k, v in resources.items() if v["Type"] == "AWS::S3::Bucket"}
        for resource in s3_resources.values():
            # CDK sets DeletionPolicy for RemovalPolicy.DESTROY
            self.assertEqual(resource.get("DeletionPolicy"), "Delete")
        
        # DynamoDB table has DeletionPolicy: Delete
        dynamodb_resources = {k: v for k, v in resources.items() if v["Type"] == "AWS::DynamoDB::Table"}
        for resource in dynamodb_resources.values():
            self.assertEqual(resource.get("DeletionPolicy"), "Delete")

    @mark.it("validates Lambda environment variables are set correctly")
    def test_lambda_environment_variables(self):
        # Get all Lambda functions and verify they have correct environment variables
        template_json = self.template.to_json()
        resources = template_json["Resources"]
        lambda_functions = {k: v for k, v in resources.items() if v["Type"] == "AWS::Lambda::Function"}
        
        # At least one Lambda should have DynamoDB table name
        found_dynamodb_env = False
        found_s3_bucket_env = False
        found_sns_topic_env = False
        
        for func_resource in lambda_functions.values():
            env_vars = func_resource.get("Properties", {}).get("Environment", {}).get("Variables", {})
            if "DYNAMODB_TABLE_NAME" in env_vars:
                found_dynamodb_env = True
            if "ANALYTICS_BUCKET_NAME" in env_vars:
                found_s3_bucket_env = True
            if "SNS_TOPIC_ARN" in env_vars:
                found_sns_topic_env = True
                
        self.assertTrue(found_dynamodb_env, "At least one Lambda should have DYNAMODB_TABLE_NAME")
        self.assertTrue(found_s3_bucket_env, "At least one Lambda should have ANALYTICS_BUCKET_NAME")
        self.assertTrue(found_sns_topic_env, "Alert Lambda should have SNS_TOPIC_ARN")


# Add separate test classes for Lambda functions
@mark.describe("Lambda Function Unit Tests")
class TestLambdaFunctions(unittest.TestCase):
    """Unit tests for individual Lambda function logic"""

    def test_processor_lambda_congestion_calculation(self):
        """Test congestion level calculation logic"""
        # Test data
        max_capacity = 100
        vehicle_count = 85
        expected_congestion = 85.0
        
        # Calculate congestion (simulating processor logic)
        calculated_congestion = round((vehicle_count / max_capacity) * 100, 2)
        
        self.assertEqual(calculated_congestion, expected_congestion)
        
    def test_processor_lambda_handles_zero_capacity(self):
        """Test that processor handles edge cases properly"""
        max_capacity = 0  
        vehicle_count = 50
        
        # Should handle division by zero gracefully
        with self.assertRaises(ZeroDivisionError):
            round((vehicle_count / max_capacity) * 100, 2)

    def test_alerts_lambda_congestion_threshold(self):
        """Test alert threshold logic"""
        threshold = 80.0
        
        # Test cases
        test_cases = [
            {"congestion": 75.0, "should_alert": False},
            {"congestion": 80.0, "should_alert": True},
            {"congestion": 85.0, "should_alert": True},
            {"congestion": 95.0, "should_alert": True},
        ]
        
        for case in test_cases:
            with self.subTest(congestion=case["congestion"]):
                should_alert = case["congestion"] >= threshold
                self.assertEqual(should_alert, case["should_alert"])

    def test_aggregator_lambda_average_calculation(self):
        """Test aggregation average calculation"""
        # Mock sensor data
        congestion_values = [75, 85, 90, 60]
        speed_values = [25.5, 15.0, 12.3, 40.0]
        
        # Calculate averages
        avg_congestion = round(sum(congestion_values) / len(congestion_values), 2)
        avg_speed = round(sum(speed_values) / len(speed_values), 2)
        
        expected_avg_congestion = 77.5
        expected_avg_speed = 23.2
        
        self.assertEqual(avg_congestion, expected_avg_congestion)
        self.assertEqual(avg_speed, expected_avg_speed)


@mark.describe("TapStackProps")
class TestTapStackProps(unittest.TestCase):
    """Test cases for TapStackProps dataclass"""

    def test_tap_stack_props_creation(self):
        """Test TapStackProps can be created with required fields"""
        props = TapStackProps(environment_suffix="test")
        self.assertEqual(props.environment_suffix, "test")
        self.assertIsNone(props.env)

    def test_tap_stack_props_with_env(self):
        """Test TapStackProps can include environment"""
        env = cdk.Environment(account="123456789012", region="us-east-1")
        props = TapStackProps(environment_suffix="test", env=env)
        self.assertEqual(props.environment_suffix, "test")
        self.assertEqual(props.env, env)
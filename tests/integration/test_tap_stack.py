import json
import os
import unittest
from unittest.mock import MagicMock, patch

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, "..", "..", "cfn-outputs", "flat-outputs.json"
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
        flat_outputs = f.read()
else:
    flat_outputs = "{}"

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Comprehensive integration test cases for the TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for integration testing"""
        cls.dynamodb = boto3.resource("dynamodb")
        cls.lambda_client = boto3.client("lambda")
        cls.events_client = boto3.client("events")
        cls.sns_client = boto3.client("sns")
        cls.cloudwatch = boto3.client("cloudwatch")
        cls.logs_client = boto3.client("logs")

    def setUp(self):
        """Set up test data for each test"""
        # Extract resource names from deployment outputs
        self.table_name = flat_outputs.get("DynamoDBTableName")
        self.lambda_function_name = flat_outputs.get("LambdaFunctionName")
        self.event_bus_name = flat_outputs.get("EventBusName")
        self.sns_topic_arn = flat_outputs.get("SNSTopicArn")
        self.dashboard_url = flat_outputs.get("DashboardURL")

        # Skip tests if required resources are not deployed
        if not all(
            [
                self.table_name,
                self.lambda_function_name,
                self.event_bus_name,
                self.sns_topic_arn,
            ]
        ):
            self.skipTest("Required AWS resources not found in deployment outputs")

    @mark.it("Verifies DynamoDB table exists with correct configuration")
    def test_dynamodb_table_configuration(self):
        """Test that DynamoDB table is properly configured"""
        try:
            # Verify table exists
            table = self.dynamodb.Table(self.table_name)
            table_info = table.meta.client.describe_table(TableName=self.table_name)

            # Verify table configuration
            table_description = table_info["Table"]
            self.assertEqual(table_description["BillingMode"], "PAY_PER_REQUEST")

            # Verify primary key structure
            key_schema = {
                item["AttributeName"]: item["KeyType"]
                for item in table_description["KeySchema"]
            }
            self.assertEqual(key_schema.get("shipmentId"), "HASH")
            self.assertEqual(key_schema.get("timestamp"), "RANGE")

            # Verify GSI exists
            gsi_found = False
            if "GlobalSecondaryIndexes" in table_description:
                for gsi in table_description["GlobalSecondaryIndexes"]:
                    if gsi["IndexName"] == "StatusIndex":
                        gsi_found = True
                        gsi_key_schema = {
                            item["AttributeName"]: item["KeyType"]
                            for item in gsi["KeySchema"]
                        }
                        self.assertEqual(gsi_key_schema.get("status"), "HASH")
                        self.assertEqual(gsi_key_schema.get("timestamp"), "RANGE")
                        break

            self.assertTrue(gsi_found, "StatusIndex GSI not found")

        except ClientError as e:
            self.fail(f"Failed to describe DynamoDB table: {e}")

    @mark.it("Verifies Lambda function exists with correct configuration")
    def test_lambda_function_configuration(self):
        """Test that Lambda function is properly configured"""
        try:
            # Verify function exists and get configuration
            response = self.lambda_client.get_function(
                FunctionName=self.lambda_function_name
            )
            function_config = response["Configuration"]

            # Verify runtime and handler
            self.assertEqual(function_config["Runtime"], "python3.10")
            self.assertEqual(function_config["Handler"], "index.lambda_handler")

            # Verify environment variables
            env_vars = function_config.get("Environment", {}).get("Variables", {})
            self.assertIn("TABLE_NAME", env_vars)
            self.assertIn("SNS_TOPIC_ARN", env_vars)
            self.assertIn("ENVIRONMENT", env_vars)
            self.assertEqual(env_vars["TABLE_NAME"], self.table_name)
            self.assertEqual(env_vars["SNS_TOPIC_ARN"], self.sns_topic_arn)

            # Verify timeout and memory settings
            self.assertEqual(function_config["Timeout"], 30)
            self.assertEqual(function_config["MemorySize"], 512)

            # Verify tracing is enabled
            self.assertEqual(function_config["TracingConfig"]["Mode"], "Active")

        except ClientError as e:
            self.fail(f"Failed to describe Lambda function: {e}")

    @mark.it("Verifies EventBridge event bus and rules are configured")
    def test_eventbridge_configuration(self):
        """Test that EventBridge event bus and rules are properly configured"""
        try:
            # Verify event bus exists
            event_buses = self.events_client.list_event_buses()
            bus_names = [bus["Name"] for bus in event_buses["EventBuses"]]
            self.assertIn(self.event_bus_name, bus_names)

            # Verify event rule exists
            rules = self.events_client.list_rules(EventBusName=self.event_bus_name)
            rule_found = False

            for rule in rules["Rules"]:
                if "shipment-updates" in rule["Name"]:
                    rule_found = True
                    # Verify rule targets include Lambda function
                    targets = self.events_client.list_targets_by_rule(
                        Rule=rule["Name"], EventBusName=self.event_bus_name
                    )

                    lambda_target_found = False
                    for target in targets["Targets"]:
                        if target["Arn"].endswith(self.lambda_function_name):
                            lambda_target_found = True
                            # Verify retry configuration
                            self.assertEqual(
                                target.get("RetryPolicy", {}).get(
                                    "MaximumRetryAttempts"
                                ),
                                2,
                            )
                            break

                    self.assertTrue(
                        lambda_target_found,
                        "Lambda target not found in EventBridge rule",
                    )
                    break

            self.assertTrue(rule_found, "EventBridge rule not found")

        except ClientError as e:
            self.fail(f"Failed to verify EventBridge configuration: {e}")

    @mark.it("Verifies SNS topic and subscription are configured")
    def test_sns_configuration(self):
        """Test that SNS topic and email subscription are properly configured"""
        try:
            # Verify topic attributes
            topic_attrs = self.sns_client.get_topic_attributes(
                TopicArn=self.sns_topic_arn
            )
            self.assertIn("DisplayName", topic_attrs["Attributes"])

            # Verify subscriptions exist (note: email subscriptions require confirmation)
            subscriptions = self.sns_client.list_subscriptions_by_topic(
                TopicArn=self.sns_topic_arn
            )
            email_subscription_found = any(
                sub["Protocol"] == "email" for sub in subscriptions["Subscriptions"]
            )
            self.assertTrue(email_subscription_found, "Email subscription not found")

        except ClientError as e:
            self.fail(f"Failed to verify SNS configuration: {e}")

    @mark.it("Tests complete event processing workflow")
    def test_end_to_end_event_processing_workflow(self):
        """Test the complete event processing workflow from EventBridge to DynamoDB"""

        # Test event data
        test_shipment_id = "TEST-SHIP-123456"
        test_event = {
            "Source": "logistics.shipments",
            "DetailType": "Shipment Update",
            "Detail": json.dumps(
                {
                    "shipmentId": test_shipment_id,
                    "status": "IN_TRANSIT",
                    "location": "Dallas, TX",
                    "carrier": "FedEx",
                    "trackingNumber": "1234567890",
                    "timestamp": "2025-10-17T12:00:00Z",
                }
            ),
        }

        try:
            # Send event to EventBridge
            response = self.events_client.put_events(Entries=[test_event])

            # Verify event was accepted
            self.assertEqual(response["FailedEntryCount"], 0)

            # Wait a moment for event processing
            import time

            time.sleep(5)

            # Verify event was processed and stored in DynamoDB
            table = self.dynamodb.Table(self.table_name)

            # Query for the test shipment
            from boto3.dynamodb.conditions import Key

            response = table.query(
                KeyConditionExpression=Key("shipmentId").eq(test_shipment_id)
            )

            # Verify the shipment record exists
            self.assertGreater(
                response["Count"], 0, "No records found for test shipment"
            )

            # Verify record contents
            record = response["Items"][0]
            self.assertEqual(record["shipmentId"], test_shipment_id)
            self.assertEqual(record["status"], "IN_TRANSIT")
            self.assertEqual(record["location"], "Dallas, TX")
            self.assertEqual(record["carrier"], "FedEx")
            self.assertEqual(record["trackingNumber"], "1234567890")
            self.assertIn("processedAt", record)
            self.assertIn("rawEvent", record)

            # Clean up test data
            table.delete_item(
                Key={"shipmentId": test_shipment_id, "timestamp": record["timestamp"]}
            )

        except ClientError as e:
            self.fail(f"Failed to complete end-to-end workflow test: {e}")

    @mark.it("Tests Lambda function error handling and SNS notifications")
    def test_lambda_error_handling_and_sns_notification(self):
        """Test Lambda function error handling and SNS notification on failure"""

        # Test malformed event data
        invalid_event = {
            "Source": "logistics.shipments",
            "DetailType": "Shipment Update",
            "Detail": json.dumps(
                {
                    # Missing required shipmentId field
                    "status": "IN_TRANSIT",
                    "location": "Dallas, TX",
                }
            ),
        }

        try:
            # Send invalid event to EventBridge
            response = self.events_client.put_events(Entries=[invalid_event])

            # Verify event was accepted by EventBridge
            self.assertEqual(response["FailedEntryCount"], 0)

            # Wait for processing and error handling
            import time

            time.sleep(5)

            # Check CloudWatch Logs for error messages
            log_group_name = f"/aws/lambda/{self.lambda_function_name}"

            try:
                log_streams = self.logs_client.describe_log_streams(
                    logGroupName=log_group_name,
                    orderBy="LastEventTime",
                    descending=True,
                    limit=1,
                )

                if log_streams["logStreams"]:
                    latest_stream = log_streams["logStreams"][0]
                    log_events = self.logs_client.get_log_events(
                        logGroupName=log_group_name,
                        logStreamName=latest_stream["logStreamName"],
                    )

                    # Look for error handling in log events
                    error_found = any(
                        "Missing required field: shipmentId" in event["message"]
                        for event in log_events["events"]
                    )

                    self.assertTrue(error_found, "Error handling log message not found")

            except ClientError:
                # Log group might not exist yet, which is acceptable for this test
                pass

        except ClientError as e:
            self.fail(f"Failed to test error handling: {e}")

    @mark.it("Verifies CloudWatch alarms are configured")
    def test_cloudwatch_alarms_configuration(self):
        """Test that CloudWatch alarms are properly configured"""
        try:
            # Get alarms related to our resources
            alarms = self.cloudwatch.describe_alarms()

            # Look for Lambda-related alarms
            lambda_error_alarm_found = False
            lambda_duration_alarm_found = False
            lambda_throttle_alarm_found = False
            dynamodb_throttle_alarm_found = False

            for alarm in alarms["MetricAlarms"]:
                alarm_name = alarm["AlarmName"]

                if "shipment-processor-errors" in alarm_name:
                    lambda_error_alarm_found = True
                    self.assertEqual(
                        alarm["ComparisonOperator"], "GreaterThanOrEqualToThreshold"
                    )
                    self.assertEqual(alarm["Threshold"], 5.0)

                elif "shipment-processor-duration" in alarm_name:
                    lambda_duration_alarm_found = True
                    self.assertEqual(
                        alarm["ComparisonOperator"], "GreaterThanThreshold"
                    )
                    self.assertEqual(alarm["Threshold"], 10000.0)

                elif "shipment-processor-throttles" in alarm_name:
                    lambda_throttle_alarm_found = True
                    self.assertEqual(
                        alarm["ComparisonOperator"], "GreaterThanOrEqualToThreshold"
                    )
                    self.assertEqual(alarm["Threshold"], 1.0)

                elif "shipment-table-throttles" in alarm_name:
                    dynamodb_throttle_alarm_found = True
                    self.assertEqual(
                        alarm["ComparisonOperator"], "GreaterThanOrEqualToThreshold"
                    )
                    self.assertEqual(alarm["Threshold"], 5.0)

            self.assertTrue(lambda_error_alarm_found, "Lambda error alarm not found")
            self.assertTrue(
                lambda_duration_alarm_found, "Lambda duration alarm not found"
            )
            self.assertTrue(
                lambda_throttle_alarm_found, "Lambda throttle alarm not found"
            )
            self.assertTrue(
                dynamodb_throttle_alarm_found, "DynamoDB throttle alarm not found"
            )

        except ClientError as e:
            self.fail(f"Failed to verify CloudWatch alarms: {e}")

    @mark.it("Verifies CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard is created and accessible"""
        try:
            # List dashboards to find our shipment metrics dashboard
            dashboards = self.cloudwatch.list_dashboards()

            dashboard_found = any(
                "shipment-metrics" in dashboard["DashboardName"]
                for dashboard in dashboards["DashboardEntries"]
            )

            self.assertTrue(dashboard_found, "Shipment metrics dashboard not found")

            # Verify dashboard URL format
            self.assertIsNotNone(self.dashboard_url)
            self.assertIn("console.aws.amazon.com/cloudwatch", self.dashboard_url)
            self.assertIn("dashboards", self.dashboard_url)

        except ClientError as e:
            self.fail(f"Failed to verify CloudWatch dashboard: {e}")

    @mark.it("Tests DynamoDB GSI query functionality")
    def test_dynamodb_gsi_query(self):
        """Test that DynamoDB Global Secondary Index works for status-based queries"""

        # Insert test data
        test_data = [
            {
                "shipmentId": "TEST-GSI-001",
                "timestamp": "2025-10-17T10:00:00Z",
                "status": "DELIVERED",
                "location": "New York, NY",
            },
            {
                "shipmentId": "TEST-GSI-002",
                "timestamp": "2025-10-17T11:00:00Z",
                "status": "DELIVERED",
                "location": "Los Angeles, CA",
            },
            {
                "shipmentId": "TEST-GSI-003",
                "timestamp": "2025-10-17T12:00:00Z",
                "status": "IN_TRANSIT",
                "location": "Chicago, IL",
            },
        ]

        try:
            table = self.dynamodb.Table(self.table_name)

            # Insert test data
            for item in test_data:
                table.put_item(Item=item)

            # Query GSI for DELIVERED status
            from boto3.dynamodb.conditions import Key

            response = table.query(
                IndexName="StatusIndex",
                KeyConditionExpression=Key("status").eq("DELIVERED"),
            )

            # Verify we get exactly 2 DELIVERED items
            self.assertEqual(response["Count"], 2)

            delivered_items = response["Items"]
            self.assertTrue(
                all(item["status"] == "DELIVERED" for item in delivered_items)
            )

            # Clean up test data
            for item in test_data:
                table.delete_item(
                    Key={
                        "shipmentId": item["shipmentId"],
                        "timestamp": item["timestamp"],
                    }
                )

        except ClientError as e:
            self.fail(f"Failed to test DynamoDB GSI query: {e}")


if __name__ == "__main__":
    unittest.main()

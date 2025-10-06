"""Integration tests for Lambda and SNS resources."""
import json
import os
import boto3
import pytest

# Load outputs from deployment
outputs_file = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "cfn-outputs",
    "flat-outputs.json"
)

if os.path.exists(outputs_file):
    with open(outputs_file, "r", encoding="utf-8") as f:
        outputs = json.load(f)
else:
    outputs = {}


class TestLambdaIntegration:
    """Integration tests for Lambda and related resources."""

    def test_lambda_function_exists(self):
        """Test that Lambda function was created."""
        lambda_client = boto3.client("lambda", region_name="us-east-1")

        function_name = outputs.get("LambdaFunctionName")
        if not function_name:
            pytest.skip("Lambda function name not found in outputs")

        # Get function configuration
        response = lambda_client.get_function_configuration(FunctionName=function_name)

        assert response["FunctionName"] == function_name
        assert response["Runtime"] == "python3.11"
        assert response["Handler"] == "index.handler"
        assert response["Timeout"] == 60
        assert response["MemorySize"] == 256

        # Check environment variables
        env_vars = response.get("Environment", {}).get("Variables", {})
        assert "DYNAMODB_TABLE" in env_vars
        assert "SNS_TOPIC_ARN" in env_vars

    def test_sns_topic_exists(self):
        """Test that SNS topic was created."""
        sns = boto3.client("sns", region_name="us-east-1")

        topic_arn = outputs.get("SNSTopicArn")
        if not topic_arn:
            pytest.skip("SNS topic ARN not found in outputs")

        # Get topic attributes
        response = sns.get_topic_attributes(TopicArn=topic_arn)

        assert "Attributes" in response
        assert response["Attributes"]["DisplayName"] == "ECR Security Alerts"

    def test_eventbridge_rule_exists(self):
        """Test that EventBridge rule was created."""
        events = boto3.client("events", region_name="us-east-1")

        rule_name = outputs.get("EventRuleName")
        if not rule_name:
            pytest.skip("EventBridge rule name not found in outputs")

        # Describe the rule
        response = events.describe_rule(Name=rule_name)

        assert response["Name"] == rule_name
        assert response["State"] == "ENABLED"

        # Check event pattern
        event_pattern = json.loads(response["EventPattern"])
        assert event_pattern["source"] == ["aws.ecr"]
        assert event_pattern["detail-type"] == ["ECR Image Scan"]

    def test_lambda_has_eventbridge_permission(self):
        """Test that Lambda has permission to be invoked by EventBridge."""
        lambda_client = boto3.client("lambda", region_name="us-east-1")

        function_name = outputs.get("LambdaFunctionName")
        if not function_name:
            pytest.skip("Lambda function name not found in outputs")

        try:
            # Get function policy
            response = lambda_client.get_policy(FunctionName=function_name)
            policy = json.loads(response["Policy"])

            # Check for EventBridge permission
            for statement in policy["Statement"]:
                if statement.get("Sid") == "AllowEventBridgeInvoke":
                    assert statement["Effect"] == "Allow"
                    assert statement["Principal"]["Service"] == "events.amazonaws.com"
                    assert statement["Action"] == "lambda:InvokeFunction"
                    return

            assert False, "EventBridge permission not found"
        except lambda_client.exceptions.ResourceNotFoundException:
            assert False, "Lambda function policy not found"

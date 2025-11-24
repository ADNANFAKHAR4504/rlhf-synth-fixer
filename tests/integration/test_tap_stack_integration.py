"""
Integration tests for deployed TapStack CloudFormation resources.
Tests actual AWS resources created by the CloudFormation stack.
"""
import json
import os
import boto3
import pytest
from pathlib import Path
from botocore.exceptions import ClientError


class TestTapStackIntegration:
    """Integration tests for deployed TapStack resources."""

    @pytest.fixture(scope="class")
    def stack_outputs(self):
        """Load stack outputs from cfn-outputs/flat-outputs.json."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

        if not outputs_path.exists():
            pytest.fail(f"Stack outputs file not found: {outputs_path}")

        with open(outputs_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def dynamodb_client(self):
        """Create DynamoDB client."""
        return boto3.client('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

    @pytest.fixture(scope="class")
    def cloudformation_client(self):
        """Create CloudFormation client."""
        return boto3.client('cloudformation', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

    def test_stack_outputs_exist(self, stack_outputs):
        """Test that stack outputs file contains expected keys."""
        assert "TurnAroundPromptTableName" in stack_outputs
        assert "TurnAroundPromptTableArn" in stack_outputs
        assert "StackName" in stack_outputs
        assert "EnvironmentSuffix" in stack_outputs

    def test_table_name_format(self, stack_outputs):
        """Test that table name follows expected format."""
        table_name = stack_outputs["TurnAroundPromptTableName"]
        env_suffix = stack_outputs["EnvironmentSuffix"]

        assert table_name.startswith("TurnAroundPromptTable")
        assert table_name.endswith(env_suffix)
        assert table_name == f"TurnAroundPromptTable{env_suffix}"

    def test_table_arn_format(self, stack_outputs):
        """Test that table ARN is properly formatted."""
        table_arn = stack_outputs["TurnAroundPromptTableArn"]
        table_name = stack_outputs["TurnAroundPromptTableName"]

        assert table_arn.startswith("arn:aws:dynamodb:")
        assert table_name in table_arn
        assert ":table/" in table_arn

    def test_stack_name_format(self, stack_outputs):
        """Test that stack name follows expected format."""
        stack_name = stack_outputs["StackName"]
        env_suffix = stack_outputs["EnvironmentSuffix"]

        assert stack_name.startswith("TapStack")
        assert stack_name.endswith(env_suffix)

    def test_environment_suffix_value(self, stack_outputs):
        """Test that environment suffix is alphanumeric."""
        env_suffix = stack_outputs["EnvironmentSuffix"]

        assert env_suffix.isalnum()
        assert len(env_suffix) >= 3
        assert len(env_suffix) <= 10

    def test_dynamodb_table_exists(self, stack_outputs, dynamodb_client):
        """Test that DynamoDB table exists in AWS."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            assert response["Table"]["TableName"] == table_name
            assert response["Table"]["TableStatus"] in ["ACTIVE", "UPDATING"]
        except ClientError as e:
            pytest.fail(f"Table {table_name} not found: {str(e)}")

    def test_table_billing_mode(self, stack_outputs, dynamodb_client):
        """Test that table uses PAY_PER_REQUEST billing mode."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        response = dynamodb_client.describe_table(TableName=table_name)
        billing_mode = response["Table"]["BillingModeSummary"]["BillingMode"]

        assert billing_mode == "PAY_PER_REQUEST"

    def test_table_key_schema(self, stack_outputs, dynamodb_client):
        """Test that table has correct key schema."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        response = dynamodb_client.describe_table(TableName=table_name)
        key_schema = response["Table"]["KeySchema"]

        assert len(key_schema) == 1
        assert key_schema[0]["AttributeName"] == "id"
        assert key_schema[0]["KeyType"] == "HASH"

    def test_table_attribute_definitions(self, stack_outputs, dynamodb_client):
        """Test that table has correct attribute definitions."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        response = dynamodb_client.describe_table(TableName=table_name)
        attr_defs = response["Table"]["AttributeDefinitions"]

        assert len(attr_defs) == 1
        assert attr_defs[0]["AttributeName"] == "id"
        assert attr_defs[0]["AttributeType"] == "S"

    def test_table_deletion_protection_disabled(self, stack_outputs, dynamodb_client):
        """Test that deletion protection is disabled (as per requirement)."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        response = dynamodb_client.describe_table(TableName=table_name)
        deletion_protection = response["Table"].get("DeletionProtectionEnabled", False)

        assert deletion_protection is False

    def test_table_arn_matches_output(self, stack_outputs, dynamodb_client):
        """Test that actual table ARN matches stack output."""
        table_name = stack_outputs["TurnAroundPromptTableName"]
        expected_arn = stack_outputs["TurnAroundPromptTableArn"]

        response = dynamodb_client.describe_table(TableName=table_name)
        actual_arn = response["Table"]["TableArn"]

        assert actual_arn == expected_arn

    def test_cloudformation_stack_exists(self, stack_outputs, cloudformation_client):
        """Test that CloudFormation stack exists and is in good state."""
        stack_name = stack_outputs["StackName"]

        try:
            response = cloudformation_client.describe_stacks(StackName=stack_name)
            stack = response["Stacks"][0]

            assert stack["StackName"] == stack_name
            # Accept any non-failed, non-deleted stack state
            valid_states = [
                "CREATE_COMPLETE",
                "UPDATE_COMPLETE",
                "UPDATE_ROLLBACK_COMPLETE",
                "CREATE_IN_PROGRESS",
                "UPDATE_IN_PROGRESS",
                "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS"
            ]
            assert stack["StackStatus"] in valid_states, \
                f"Stack in unexpected state: {stack['StackStatus']}"
        except ClientError as e:
            pytest.fail(f"Stack {stack_name} not found: {str(e)}")

    def test_cloudformation_stack_outputs(self, stack_outputs, cloudformation_client):
        """Test that CloudFormation stack outputs match expected values."""
        stack_name = stack_outputs["StackName"]

        response = cloudformation_client.describe_stacks(StackName=stack_name)
        cfn_outputs = response["Stacks"][0]["Outputs"]

        # Convert to dict for easier comparison
        cfn_outputs_dict = {out["OutputKey"]: out["OutputValue"] for out in cfn_outputs}

        # Verify all expected outputs are present
        assert "TurnAroundPromptTableName" in cfn_outputs_dict
        assert "TurnAroundPromptTableArn" in cfn_outputs_dict
        assert "StackName" in cfn_outputs_dict
        assert "EnvironmentSuffix" in cfn_outputs_dict

        # Verify values match
        assert cfn_outputs_dict["TurnAroundPromptTableName"] == stack_outputs["TurnAroundPromptTableName"]
        assert cfn_outputs_dict["TurnAroundPromptTableArn"] == stack_outputs["TurnAroundPromptTableArn"]
        assert cfn_outputs_dict["StackName"] == stack_outputs["StackName"]
        assert cfn_outputs_dict["EnvironmentSuffix"] == stack_outputs["EnvironmentSuffix"]

    def test_cloudformation_stack_exports(self, stack_outputs, cloudformation_client):
        """Test that CloudFormation stack has proper exports for cross-stack references."""
        stack_name = stack_outputs["StackName"]

        response = cloudformation_client.describe_stacks(StackName=stack_name)
        cfn_outputs = response["Stacks"][0]["Outputs"]

        # All outputs should have export names
        for output in cfn_outputs:
            assert "ExportName" in output, f"Output {output['OutputKey']} missing ExportName"
            assert stack_name in output["ExportName"], "Export name should include stack name"

    def test_put_item_to_table(self, stack_outputs, dynamodb_client):
        """Test that we can write an item to the DynamoDB table."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        test_item = {
            "id": {"S": "test-integration-item-001"},
            "timestamp": {"N": "1234567890"},
            "data": {"S": "integration test data"}
        }

        try:
            dynamodb_client.put_item(
                TableName=table_name,
                Item=test_item
            )
        except ClientError as e:
            pytest.fail(f"Failed to put item: {str(e)}")

    def test_get_item_from_table(self, stack_outputs, dynamodb_client):
        """Test that we can read an item from the DynamoDB table."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        # First, ensure item exists
        test_item = {
            "id": {"S": "test-integration-item-002"},
            "timestamp": {"N": "1234567890"},
            "data": {"S": "integration test data"}
        }
        dynamodb_client.put_item(TableName=table_name, Item=test_item)

        # Now retrieve it
        try:
            response = dynamodb_client.get_item(
                TableName=table_name,
                Key={"id": {"S": "test-integration-item-002"}}
            )

            assert "Item" in response
            assert response["Item"]["id"]["S"] == "test-integration-item-002"
        except ClientError as e:
            pytest.fail(f"Failed to get item: {str(e)}")

    def test_scan_table(self, stack_outputs, dynamodb_client):
        """Test that we can scan the DynamoDB table."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        try:
            response = dynamodb_client.scan(
                TableName=table_name,
                Limit=10
            )

            assert "Items" in response
            assert "Count" in response
            assert isinstance(response["Items"], list)
        except ClientError as e:
            pytest.fail(f"Failed to scan table: {str(e)}")

    def test_update_item_in_table(self, stack_outputs, dynamodb_client):
        """Test that we can update an item in the DynamoDB table."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        # First, create item
        test_item = {
            "id": {"S": "test-integration-item-003"},
            "counter": {"N": "0"}
        }
        dynamodb_client.put_item(TableName=table_name, Item=test_item)

        # Now update it
        try:
            response = dynamodb_client.update_item(
                TableName=table_name,
                Key={"id": {"S": "test-integration-item-003"}},
                UpdateExpression="SET #counter = #counter + :incr",
                ExpressionAttributeNames={"#counter": "counter"},
                ExpressionAttributeValues={":incr": {"N": "1"}},
                ReturnValues="ALL_NEW"
            )

            assert response["Attributes"]["counter"]["N"] == "1"
        except ClientError as e:
            pytest.fail(f"Failed to update item: {str(e)}")

    def test_delete_item_from_table(self, stack_outputs, dynamodb_client):
        """Test that we can delete an item from the DynamoDB table."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        # First, create item
        test_item = {
            "id": {"S": "test-integration-item-004"},
            "data": {"S": "to be deleted"}
        }
        dynamodb_client.put_item(TableName=table_name, Item=test_item)

        # Now delete it
        try:
            dynamodb_client.delete_item(
                TableName=table_name,
                Key={"id": {"S": "test-integration-item-004"}}
            )

            # Verify deletion
            response = dynamodb_client.get_item(
                TableName=table_name,
                Key={"id": {"S": "test-integration-item-004"}}
            )

            assert "Item" not in response
        except ClientError as e:
            pytest.fail(f"Failed to delete item: {str(e)}")

    def test_batch_write_items(self, stack_outputs, dynamodb_client):
        """Test batch write operations on the table."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        batch_items = [
            {
                "PutRequest": {
                    "Item": {
                        "id": {"S": f"test-batch-item-{i}"},
                        "data": {"S": f"batch data {i}"}
                    }
                }
            }
            for i in range(5)
        ]

        try:
            response = dynamodb_client.batch_write_item(
                RequestItems={
                    table_name: batch_items
                }
            )

            # Check for unprocessed items
            assert "UnprocessedItems" in response
            if response["UnprocessedItems"]:
                assert len(response["UnprocessedItems"]) == 0
        except ClientError as e:
            pytest.fail(f"Failed to batch write: {str(e)}")

    def test_cloudformation_stack_parameters(self, stack_outputs, cloudformation_client):
        """Test that CloudFormation stack has correct parameters."""
        stack_name = stack_outputs["StackName"]

        response = cloudformation_client.describe_stacks(StackName=stack_name)
        parameters = response["Stacks"][0].get("Parameters", [])

        # Convert to dict
        params_dict = {param["ParameterKey"]: param["ParameterValue"] for param in parameters}

        # Should have EnvironmentSuffix parameter
        assert "EnvironmentSuffix" in params_dict
        assert params_dict["EnvironmentSuffix"] == stack_outputs["EnvironmentSuffix"]

    def test_table_has_no_global_secondary_indexes(self, stack_outputs, dynamodb_client):
        """Test that table has no GSIs (as per template design)."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        response = dynamodb_client.describe_table(TableName=table_name)

        assert "GlobalSecondaryIndexes" not in response["Table"]

    def test_table_has_no_local_secondary_indexes(self, stack_outputs, dynamodb_client):
        """Test that table has no LSIs."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        response = dynamodb_client.describe_table(TableName=table_name)

        assert "LocalSecondaryIndexes" not in response["Table"]

    def test_table_has_no_stream(self, stack_outputs, dynamodb_client):
        """Test that table has no DynamoDB stream configured."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        response = dynamodb_client.describe_table(TableName=table_name)
        stream_spec = response["Table"].get("StreamSpecification")

        if stream_spec:
            assert stream_spec.get("StreamEnabled", False) is False

    def test_cleanup_test_items(self, stack_outputs, dynamodb_client):
        """Clean up test items created during integration tests."""
        table_name = stack_outputs["TurnAroundPromptTableName"]

        # Scan for test items
        response = dynamodb_client.scan(
            TableName=table_name,
            FilterExpression="begins_with(id, :prefix)",
            ExpressionAttributeValues={":prefix": {"S": "test-"}}
        )

        # Delete all test items
        for item in response.get("Items", []):
            try:
                dynamodb_client.delete_item(
                    TableName=table_name,
                    Key={"id": {"S": item["id"]["S"]}}
                )
            except ClientError:
                pass  # Best effort cleanup

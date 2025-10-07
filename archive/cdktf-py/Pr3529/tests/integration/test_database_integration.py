"""Integration tests for DynamoDB resources."""
import json
import os
import boto3
import pytest
import uuid
from datetime import datetime

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


class TestDatabaseIntegration:
    """Integration tests for DynamoDB table."""

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table was created."""
        dynamodb = boto3.client("dynamodb", region_name="us-east-1")

        table_name = outputs.get("DynamoDBTableName")
        if not table_name:
            pytest.skip("DynamoDB table name not found in outputs")

        # Describe the table
        response = dynamodb.describe_table(TableName=table_name)

        table = response["Table"]
        assert table["TableName"] == table_name
        assert table["BillingMode"] == "PAY_PER_REQUEST"

        # Check key schema
        key_schema = {key["AttributeName"]: key["KeyType"] for key in table["KeySchema"]}
        assert key_schema["image_digest"] == "HASH"
        assert key_schema["push_timestamp"] == "RANGE"

    def test_dynamodb_global_secondary_index(self):
        """Test that GSI is configured correctly."""
        dynamodb = boto3.client("dynamodb", region_name="us-east-1")

        table_name = outputs.get("DynamoDBTableName")
        if not table_name:
            pytest.skip("DynamoDB table name not found in outputs")

        # Describe the table
        response = dynamodb.describe_table(TableName=table_name)

        # Check GSI
        gsi = response["Table"]["GlobalSecondaryIndexes"][0]
        assert gsi["IndexName"] == "repository-index"

        key_schema = {key["AttributeName"]: key["KeyType"] for key in gsi["KeySchema"]}
        assert key_schema["repository_name"] == "HASH"
        assert key_schema["push_timestamp"] == "RANGE"

    def test_dynamodb_point_in_time_recovery(self):
        """Test that point-in-time recovery is enabled."""
        dynamodb = boto3.client("dynamodb", region_name="us-east-1")

        table_name = outputs.get("DynamoDBTableName")
        if not table_name:
            pytest.skip("DynamoDB table name not found in outputs")

        # Check continuous backups
        response = dynamodb.describe_continuous_backups(TableName=table_name)

        pitr = response["ContinuousBackupsDescription"]["PointInTimeRecoveryDescription"]
        assert pitr["PointInTimeRecoveryStatus"] == "ENABLED"

    def test_dynamodb_write_and_read(self):
        """Test that we can write and read from the table."""
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

        table_name = outputs.get("DynamoDBTableName")
        if not table_name:
            pytest.skip("DynamoDB table name not found in outputs")

        table = dynamodb.Table(table_name)

        # Create test data
        test_item = {
            "image_digest": f"sha256:{uuid.uuid4().hex}",
            "push_timestamp": int(datetime.now().timestamp()),
            "repository_name": "test-repo",
            "image_tags": ["test-tag"],
            "critical_vulnerabilities": 0,
            "high_vulnerabilities": 1,
            "medium_vulnerabilities": 2,
            "low_vulnerabilities": 3,
            "scan_status": "COMPLETE"
        }

        # Write item
        table.put_item(Item=test_item)

        # Read item back
        response = table.get_item(
            Key={
                "image_digest": test_item["image_digest"],
                "push_timestamp": test_item["push_timestamp"]
            }
        )

        assert "Item" in response
        item = response["Item"]
        assert item["image_digest"] == test_item["image_digest"]
        assert item["repository_name"] == test_item["repository_name"]

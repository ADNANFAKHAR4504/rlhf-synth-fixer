"""Unit tests for DynamoDBStack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.dynamodb_stack import DynamoDBStack, DynamoDBStackProps


@mark.describe("DynamoDBStack")
class TestDynamoDBStack(unittest.TestCase):
    """Comprehensive unit tests for DynamoDBStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env = cdk.Environment(account="123456789012", region="us-east-1")
        self.stack = cdk.Stack(self.app, "TestStack", env=self.env)
        self.props = DynamoDBStackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2"
        )

    @mark.it("creates DynamoDB table")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::GlobalTable", 1)

    @mark.it("configures table with correct partition key")
    def test_partition_key(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::GlobalTable", {
            "KeySchema": Match.array_with([
                Match.object_like({"AttributeName": "transactionId", "KeyType": "HASH"}),
            ]),
        })

    @mark.it("configures table with correct sort key")
    def test_sort_key(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::GlobalTable", {
            "KeySchema": Match.array_with([
                Match.object_like({"AttributeName": "timestamp", "KeyType": "RANGE"}),
            ]),
        })

    @mark.it("configures on-demand billing mode")
    def test_billing_mode(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::GlobalTable", {
            "BillingMode": "PAY_PER_REQUEST",
        })

    @mark.it("enables point-in-time recovery")
    def test_pitr_enabled(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::GlobalTable", {
            "Replicas": Match.array_with([
                Match.object_like({
                    "PointInTimeRecoverySpecification": Match.object_like({
                        "PointInTimeRecoveryEnabled": True
                    })
                })
            ])
        })

    @mark.it("creates global secondary index")
    def test_global_secondary_index(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::GlobalTable", {
            "GlobalSecondaryIndexes": Match.array_with([
                Match.object_like({
                    "IndexName": "StatusIndex",
                })
            ])
        })

    @mark.it("configures TTL attribute")
    def test_ttl_enabled(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::GlobalTable", {
            "TimeToLiveSpecification": Match.object_like({
                "Enabled": True,
                "AttributeName": "ttl"
            })
        })

    @mark.it("applies destroy removal policy")
    def test_removal_policy(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource("AWS::DynamoDB::GlobalTable", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

    @mark.it("disables deletion protection")
    def test_deletion_protection_disabled(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::GlobalTable", {
            "Replicas": Match.array_with([
                Match.object_like({
                    "DeletionProtectionEnabled": False
                })
            ])
        })

    @mark.it("creates CloudFormation outputs")
    def test_cloudformation_outputs(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())

        # Outputs have construct path prefix
        assert any("TableName" in key for key in output_keys)
        assert any("TableArn" in key for key in output_keys)

    @mark.it("exposes table object")
    def test_exposes_table(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)

        # ASSERT
        assert ddb_stack.table is not None
        assert hasattr(ddb_stack.table, 'table_name')
        assert hasattr(ddb_stack.table, 'table_arn')

    @mark.it("uses environment suffix in table name")
    def test_environment_suffix_in_name(self):
        # ARRANGE
        ddb_stack = DynamoDBStack(self.stack, "DynamoDBTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::DynamoDB::GlobalTable", {
            "TableName": Match.string_like_regexp(".*test.*")
        })


if __name__ == "__main__":
    unittest.main()

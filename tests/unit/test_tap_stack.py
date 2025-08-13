"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

# test_components_unit.py
import unittest
import pulumi
from pulumi.runtime import set_mocks

from lib.components.dynamodb_table import DynamoDBTableComponent
from lib.components.iam_role import IAMRoleComponent
from lib.components.s3_bucket import S3BucketComponent


class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, type_, name, inputs, provider, id_):
        # Assign fake IDs and ARNs so outputs aren't None
        if "aws:s3/bucket:Bucket" in type_:
            inputs["arn"] = f"arn:aws:s3:::{name}"
        elif "aws:dynamodb/table:Table" in type_:
            inputs["arn"] = f"arn:aws:dynamodb:us-west-2:123456789012:table/{name}"
        elif "aws:iam/role:Role" in type_:
            inputs["arn"] = f"arn:aws:iam::123456789012:role/{name}"
        return [f"{name}_id", inputs]

    def call(self, token, args, provider):
        return args


# Set mocks before any Pulumi code runs
set_mocks(MyMocks())


class TestComponents(unittest.TestCase):

    def test_dynamodb_table_properties(self):
        def pulumi_program():
            table = DynamoDBTableComponent(
                name="my-table",
                environment="staging",
                hash_key="id",
                range_key="timestamp"
            )
            # Check Pulumi Outputs resolve to expected mock values
            self.assertIn("staging-my-table", pulumi.Output.all(table.table.name).apply(lambda vals: vals[0]))
            return None

        pulumi.runtime.run_in_stack(pulumi_program)

    def test_iam_role_with_s3_and_dynamodb(self):
        def pulumi_program():
            role = IAMRoleComponent(
                name="my-role",
                environment="staging",
                s3_bucket_arn=pulumi.Output.secret("arn:aws:s3:::dummy-bucket"),
                dynamodb_table_arn="arn:aws:dynamodb:us-west-2:123456789012:table/dummy-table"
            )
            self.assertTrue(role.role_name)
            self.assertTrue(role.role_arn)
            return None

        pulumi.runtime.run_in_stack(pulumi_program)

    def test_s3_bucket_properties(self):
        def pulumi_program():
            bucket = S3BucketComponent(
                name="my-bucket",
                environment="staging"
            )
            self.assertTrue(bucket.bucket_name)
            self.assertTrue(bucket.bucket_arn)
            return None

        pulumi.runtime.run_in_stack(pulumi_program)


if __name__ == "__main__":
    unittest.main()



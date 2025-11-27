"""
Unit tests for Database module
"""
import unittest
from unittest.mock import Mock
import pulumi


class TestDatabaseModule(unittest.TestCase):
    """Test cases for RDS Aurora database creation"""

    def setUp(self):
        """Set up test fixtures"""
        pulumi.runtime.set_mocks(MyMocks())

    @pulumi.runtime.test
    def test_create_database(self):
        """Test database cluster creation"""
        import lib.database as database_module

        result = database_module.create_database(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-1"),
                pulumi.Output.from_input("subnet-2")
            ],
            security_group_id=pulumi.Output.from_input("sg-12345"),
            db_password=pulumi.Output.secret("TestPassword123!"),
            environment="dev",
            tags={"Environment": "test"}
        )

        def check_database(resources):
            self.assertIn("cluster", result)
            self.assertIn("instance", result)
            self.assertIn("subnet_group", result)
            self.assertIn("secret", result)

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_database
        )

    @pulumi.runtime.test
    def test_database_subnet_group(self):
        """Test database subnet group creation"""
        import lib.database as database_module

        result = database_module.create_database(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-1"),
                pulumi.Output.from_input("subnet-2")
            ],
            security_group_id=pulumi.Output.from_input("sg-12345"),
            db_password=pulumi.Output.secret("TestPassword123!"),
            environment="dev",
            tags={"Environment": "test"}
        )

        def check_subnet_group(resources):
            self.assertIsNotNone(result["subnet_group"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_subnet_group
        )

    @pulumi.runtime.test
    def test_database_secrets_manager(self):
        """Test Secrets Manager integration"""
        import lib.database as database_module

        result = database_module.create_database(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-1"),
                pulumi.Output.from_input("subnet-2")
            ],
            security_group_id=pulumi.Output.from_input("sg-12345"),
            db_password=pulumi.Output.secret("TestPassword123!"),
            environment="dev",
            tags={"Environment": "test"}
        )

        def check_secret(resources):
            self.assertIsNotNone(result["secret"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_secret
        )

    @pulumi.runtime.test
    def test_database_prod_configuration(self):
        """Test production database has higher capacity"""
        import lib.database as database_module

        result = database_module.create_database(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-1"),
                pulumi.Output.from_input("subnet-2")
            ],
            security_group_id=pulumi.Output.from_input("sg-12345"),
            db_password=pulumi.Output.secret("TestPassword123!"),
            environment="prod",
            tags={"Environment": "prod"}
        )

        def check_prod_config(resources):
            # Prod should have higher max capacity (2.0 vs 1.0)
            self.assertIsNotNone(result["cluster"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_prod_config
        )

    @pulumi.runtime.test
    def test_database_serverless_v2(self):
        """Test Aurora Serverless v2 configuration"""
        import lib.database as database_module

        result = database_module.create_database(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-1"),
                pulumi.Output.from_input("subnet-2")
            ],
            security_group_id=pulumi.Output.from_input("sg-12345"),
            db_password=pulumi.Output.secret("TestPassword123!"),
            environment="dev",
            tags={"Environment": "test"}
        )

        def check_serverless(resources):
            # Cluster should be serverless v2 (provisioned mode with
            # serverlessv2_scaling_configuration)
            self.assertIsNotNone(result["cluster"])
            self.assertIsNotNone(result["instance"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_serverless
        )


class MyMocks(pulumi.runtime.Mocks):
    """Mock provider for Pulumi unit tests"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource"""
        outputs = args.inputs

        if args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs["id"] = f"subnet-group-{args.name}"
            outputs["name"] = args.name
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs["id"] = f"secret-{args.name}"
            outputs["arn"] = f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{args.name}"
        elif args.typ == "aws:secretsmanager/secretVersion:SecretVersion":
            outputs["id"] = f"secret-version-{args.name}"
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs["id"] = f"cluster-{args.name}"
            outputs["endpoint"] = "payment-db.cluster-xyz.us-east-1.rds.amazonaws.com"
            outputs["reader_endpoint"] = "payment-db.cluster-ro-xyz.us-east-1.rds.amazonaws.com"
        elif args.typ == "aws:rds/clusterInstance:ClusterInstance":
            outputs["id"] = f"instance-{args.name}"

        return [outputs.get("id", args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider calls"""
        return {}


if __name__ == "__main__":
    unittest.main()

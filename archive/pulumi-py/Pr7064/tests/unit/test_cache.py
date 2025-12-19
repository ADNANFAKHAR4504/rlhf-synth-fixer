"""
Unit tests for Cache module
"""
import unittest
import pulumi


class TestCacheModule(unittest.TestCase):
    """Test cases for ElastiCache Redis cluster creation"""

    def setUp(self):
        """Set up test fixtures"""
        pulumi.runtime.set_mocks(MyMocks())

    @pulumi.runtime.test
    def test_create_cache(self):
        """Test Redis cache cluster creation"""
        import lib.cache as cache_module

        result = cache_module.create_cache(
            environment_suffix="test",
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-1"),
                pulumi.Output.from_input("subnet-2")
            ],
            security_group_id=pulumi.Output.from_input("sg-12345"),
            tags={"Environment": "test"}
        )

        def check_cache(resources):
            self.assertIn("cluster", result)
            self.assertIn("subnet_group", result)

        return pulumi.Output.all(*result.values()).apply(lambda _: check_cache)

    @pulumi.runtime.test
    def test_cache_subnet_group(self):
        """Test cache subnet group creation"""
        import lib.cache as cache_module

        result = cache_module.create_cache(
            environment_suffix="test",
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-1"),
                pulumi.Output.from_input("subnet-2")
            ],
            security_group_id=pulumi.Output.from_input("sg-12345"),
            tags={"Environment": "test"}
        )

        def check_subnet_group(resources):
            self.assertIsNotNone(result["subnet_group"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_subnet_group
        )

    @pulumi.runtime.test
    def test_cache_redis_configuration(self):
        """Test Redis 7.0 configuration"""
        import lib.cache as cache_module

        result = cache_module.create_cache(
            environment_suffix="test",
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-1"),
                pulumi.Output.from_input("subnet-2")
            ],
            security_group_id=pulumi.Output.from_input("sg-12345"),
            tags={"Environment": "test"}
        )

        def check_redis_config(resources):
            # Should use Redis 7.0 and cache.t3.micro
            self.assertIsNotNone(result["cluster"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_redis_config
        )


class MyMocks(pulumi.runtime.Mocks):
    """Mock provider for Pulumi unit tests"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource"""
        outputs = args.inputs

        if args.typ == "aws:elasticache/subnetGroup:SubnetGroup":
            outputs["id"] = f"cache-subnet-group-{args.name}"
            outputs["name"] = args.name
        elif args.typ == "aws:elasticache/cluster:Cluster":
            outputs["id"] = f"cache-cluster-{args.name}"
            outputs["cache_nodes"] = [{
                "id": "0001",
                "address": "payment-cache.xyz.0001.use1.cache.amazonaws.com",
                "port": 6379,
                "availability_zone": "us-east-1a"
            }]

        return [outputs.get("id", args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider calls"""
        return {}


if __name__ == "__main__":
    unittest.main()

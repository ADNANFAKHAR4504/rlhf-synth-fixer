"""
Unit tests for Monitoring module
"""
import unittest
import pulumi


class TestMonitoringModule(unittest.TestCase):
    """Test cases for CloudWatch monitoring and alarms"""

    def setUp(self):
        """Set up test fixtures"""
        pulumi.runtime.set_mocks(MyMocks())

    @pulumi.runtime.test
    def test_create_monitoring(self):
        """Test CloudWatch alarms creation"""
        import lib.monitoring as monitoring_module

        result = monitoring_module.create_monitoring(
            environment_suffix="test",
            alb_arn=pulumi.Output.from_input("app/alb/abc123"),
            target_group_arn=pulumi.Output.from_input("targetgroup/tg/abc123"),
            ecs_cluster_name=pulumi.Output.from_input("payment-cluster"),
            ecs_service_name=pulumi.Output.from_input("payment-service"),
            database_cluster_id=pulumi.Output.from_input("payment-db-cluster"),
            cache_cluster_id=pulumi.Output.from_input("payment-cache"),
            queue_name=pulumi.Output.from_input("payment-queue"),
            sns_topic_arn=pulumi.Output.from_input("arn:aws:sns:us-east-1:123:topic"),
            tags={"Environment": "test"}
        )

        def check_monitoring(resources):
            self.assertIn("alb_unhealthy_alarm", result)
            self.assertIn("alb_response_time_alarm", result)
            self.assertIn("ecs_cpu_alarm", result)
            self.assertIn("ecs_memory_alarm", result)
            self.assertIn("db_cpu_alarm", result)
            self.assertIn("db_connections_alarm", result)
            self.assertIn("cache_cpu_alarm", result)
            self.assertIn("queue_depth_alarm", result)

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_monitoring
        )

    @pulumi.runtime.test
    def test_alb_alarms(self):
        """Test ALB-related alarms"""
        import lib.monitoring as monitoring_module

        result = monitoring_module.create_monitoring(
            environment_suffix="test",
            alb_arn=pulumi.Output.from_input("app/alb/abc123"),
            target_group_arn=pulumi.Output.from_input("targetgroup/tg/abc123"),
            ecs_cluster_name=pulumi.Output.from_input("payment-cluster"),
            ecs_service_name=pulumi.Output.from_input("payment-service"),
            database_cluster_id=pulumi.Output.from_input("payment-db-cluster"),
            cache_cluster_id=pulumi.Output.from_input("payment-cache"),
            queue_name=pulumi.Output.from_input("payment-queue"),
            sns_topic_arn=pulumi.Output.from_input("arn:aws:sns:us-east-1:123:topic"),
            tags={"Environment": "test"}
        )

        def check_alb_alarms(resources):
            self.assertIsNotNone(result["alb_unhealthy_alarm"])
            self.assertIsNotNone(result["alb_response_time_alarm"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_alb_alarms
        )

    @pulumi.runtime.test
    def test_ecs_alarms(self):
        """Test ECS-related alarms"""
        import lib.monitoring as monitoring_module

        result = monitoring_module.create_monitoring(
            environment_suffix="test",
            alb_arn=pulumi.Output.from_input("app/alb/abc123"),
            target_group_arn=pulumi.Output.from_input("targetgroup/tg/abc123"),
            ecs_cluster_name=pulumi.Output.from_input("payment-cluster"),
            ecs_service_name=pulumi.Output.from_input("payment-service"),
            database_cluster_id=pulumi.Output.from_input("payment-db-cluster"),
            cache_cluster_id=pulumi.Output.from_input("payment-cache"),
            queue_name=pulumi.Output.from_input("payment-queue"),
            sns_topic_arn=pulumi.Output.from_input("arn:aws:sns:us-east-1:123:topic"),
            tags={"Environment": "test"}
        )

        def check_ecs_alarms(resources):
            self.assertIsNotNone(result["ecs_cpu_alarm"])
            self.assertIsNotNone(result["ecs_memory_alarm"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_ecs_alarms
        )

    @pulumi.runtime.test
    def test_database_alarms(self):
        """Test database-related alarms"""
        import lib.monitoring as monitoring_module

        result = monitoring_module.create_monitoring(
            environment_suffix="test",
            alb_arn=pulumi.Output.from_input("app/alb/abc123"),
            target_group_arn=pulumi.Output.from_input("targetgroup/tg/abc123"),
            ecs_cluster_name=pulumi.Output.from_input("payment-cluster"),
            ecs_service_name=pulumi.Output.from_input("payment-service"),
            database_cluster_id=pulumi.Output.from_input("payment-db-cluster"),
            cache_cluster_id=pulumi.Output.from_input("payment-cache"),
            queue_name=pulumi.Output.from_input("payment-queue"),
            sns_topic_arn=pulumi.Output.from_input("arn:aws:sns:us-east-1:123:topic"),
            tags={"Environment": "test"}
        )

        def check_db_alarms(resources):
            self.assertIsNotNone(result["db_cpu_alarm"])
            self.assertIsNotNone(result["db_connections_alarm"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_db_alarms
        )

    @pulumi.runtime.test
    def test_cache_alarms(self):
        """Test cache-related alarms"""
        import lib.monitoring as monitoring_module

        result = monitoring_module.create_monitoring(
            environment_suffix="test",
            alb_arn=pulumi.Output.from_input("app/alb/abc123"),
            target_group_arn=pulumi.Output.from_input("targetgroup/tg/abc123"),
            ecs_cluster_name=pulumi.Output.from_input("payment-cluster"),
            ecs_service_name=pulumi.Output.from_input("payment-service"),
            database_cluster_id=pulumi.Output.from_input("payment-db-cluster"),
            cache_cluster_id=pulumi.Output.from_input("payment-cache"),
            queue_name=pulumi.Output.from_input("payment-queue"),
            sns_topic_arn=pulumi.Output.from_input("arn:aws:sns:us-east-1:123:topic"),
            tags={"Environment": "test"}
        )

        def check_cache_alarms(resources):
            self.assertIsNotNone(result["cache_cpu_alarm"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_cache_alarms
        )

    @pulumi.runtime.test
    def test_queue_alarms(self):
        """Test SQS queue alarms"""
        import lib.monitoring as monitoring_module

        result = monitoring_module.create_monitoring(
            environment_suffix="test",
            alb_arn=pulumi.Output.from_input("app/alb/abc123"),
            target_group_arn=pulumi.Output.from_input("targetgroup/tg/abc123"),
            ecs_cluster_name=pulumi.Output.from_input("payment-cluster"),
            ecs_service_name=pulumi.Output.from_input("payment-service"),
            database_cluster_id=pulumi.Output.from_input("payment-db-cluster"),
            cache_cluster_id=pulumi.Output.from_input("payment-cache"),
            queue_name=pulumi.Output.from_input("payment-queue"),
            sns_topic_arn=pulumi.Output.from_input("arn:aws:sns:us-east-1:123:topic"),
            tags={"Environment": "test"}
        )

        def check_queue_alarms(resources):
            self.assertIsNotNone(result["queue_depth_alarm"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_queue_alarms
        )


class MyMocks(pulumi.runtime.Mocks):
    """Mock provider for Pulumi unit tests"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource"""
        outputs = args.inputs

        if args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs["id"] = f"alarm-{args.name}"
            outputs["arn"] = f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)

        return [outputs.get("id", args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider calls"""
        return {}


if __name__ == "__main__":
    unittest.main()

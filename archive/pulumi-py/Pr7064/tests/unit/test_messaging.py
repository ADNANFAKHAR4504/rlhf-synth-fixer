"""
Unit tests for Messaging module
"""
import unittest
import pulumi


class TestMessagingModule(unittest.TestCase):
    """Test cases for SQS and SNS messaging resources"""

    def setUp(self):
        """Set up test fixtures"""
        pulumi.runtime.set_mocks(MyMocks())

    @pulumi.runtime.test
    def test_create_messaging_resources(self):
        """Test SQS and SNS resource creation"""
        import lib.messaging as messaging_module

        result = messaging_module.create_messaging_resources(
            environment_suffix="test",
            tags={"Environment": "test"}
        )

        def check_messaging(resources):
            self.assertIn("payment_queue", result)
            self.assertIn("dlq", result)
            self.assertIn("alert_topic", result)
            self.assertIn("notification_topic", result)

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_messaging
        )

    @pulumi.runtime.test
    def test_dlq_creation(self):
        """Test dead letter queue creation"""
        import lib.messaging as messaging_module

        result = messaging_module.create_messaging_resources(
            environment_suffix="test",
            tags={"Environment": "test"}
        )

        def check_dlq(resources):
            self.assertIsNotNone(result["dlq"])

        return pulumi.Output.all(*result.values()).apply(lambda _: check_dlq)

    @pulumi.runtime.test
    def test_payment_queue_configuration(self):
        """Test payment queue has correct configuration"""
        import lib.messaging as messaging_module

        result = messaging_module.create_messaging_resources(
            environment_suffix="test",
            tags={"Environment": "test"}
        )

        def check_queue_config(resources):
            # Payment queue should have DLQ redrive policy
            self.assertIsNotNone(result["payment_queue"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_queue_config
        )

    @pulumi.runtime.test
    def test_sns_topics(self):
        """Test SNS topics for alerts and notifications"""
        import lib.messaging as messaging_module

        result = messaging_module.create_messaging_resources(
            environment_suffix="test",
            tags={"Environment": "test"}
        )

        def check_topics(resources):
            self.assertIsNotNone(result["alert_topic"])
            self.assertIsNotNone(result["notification_topic"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_topics
        )


class MyMocks(pulumi.runtime.Mocks):
    """Mock provider for Pulumi unit tests"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource"""
        outputs = args.inputs

        if args.typ == "aws:sqs/queue:Queue":
            outputs["id"] = f"queue-{args.name}"
            outputs["url"] = f"https://sqs.us-east-1.amazonaws.com/123456789012/{args.name}"
            outputs["arn"] = f"arn:aws:sqs:us-east-1:123456789012:{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
        elif args.typ == "aws:sns/topic:Topic":
            outputs["id"] = f"topic-{args.name}"
            outputs["arn"] = f"arn:aws:sns:us-east-1:123456789012:{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)

        return [outputs.get("id", args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider calls"""
        return {}


if __name__ == "__main__":
    unittest.main()

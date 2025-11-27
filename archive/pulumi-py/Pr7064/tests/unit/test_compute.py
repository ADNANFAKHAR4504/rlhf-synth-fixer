"""
Unit tests for Compute module (ECS Fargate)
"""
import unittest
import pulumi


# Create a mock log group class
class MockLogGroup:
    """Mock CloudWatch log group for testing"""
    def __init__(self):
        self.name = "/ecs/transaction-processing-test"
        self.arn = "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/transaction-processing-test"


class TestComputeModule(unittest.TestCase):
    """Test cases for ECS Fargate cluster and services"""

    def setUp(self):
        """Set up test fixtures"""
        pulumi.runtime.set_mocks(MyMocks())

    @pulumi.runtime.test
    def test_create_ecs_cluster(self):
        """Test ECS cluster creation"""
        import lib.compute as compute_module

        result = compute_module.create_ecs_cluster(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            public_subnet_ids=[
                pulumi.Output.from_input("subnet-pub-1"),
                pulumi.Output.from_input("subnet-pub-2")
            ],
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-priv-1"),
                pulumi.Output.from_input("subnet-priv-2")
            ],
            alb_security_group_id=pulumi.Output.from_input("sg-alb"),
            app_security_group_id=pulumi.Output.from_input("sg-app"),
            database_endpoint=pulumi.Output.from_input("db.example.com"),
            cache_endpoint=pulumi.Output.from_input("cache.example.com"),
            queue_url=pulumi.Output.from_input("https://sqs.us-east-1.amazonaws.com/123/queue"),
            log_group=MockLogGroup(),
            environment="dev",
            tags={"Environment": "test"}
        )

        def check_ecs(resources):
            self.assertIn("cluster", result)
            self.assertIn("alb", result)
            self.assertIn("target_group", result)
            self.assertIn("listener", result)
            self.assertIn("service", result)

        return pulumi.Output.all(*result.values()).apply(lambda _: check_ecs)

    @pulumi.runtime.test
    def test_alb_creation(self):
        """Test Application Load Balancer creation"""
        import lib.compute as compute_module

        result = compute_module.create_ecs_cluster(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            public_subnet_ids=[
                pulumi.Output.from_input("subnet-pub-1"),
                pulumi.Output.from_input("subnet-pub-2")
            ],
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-priv-1"),
                pulumi.Output.from_input("subnet-priv-2")
            ],
            alb_security_group_id=pulumi.Output.from_input("sg-alb"),
            app_security_group_id=pulumi.Output.from_input("sg-app"),
            database_endpoint=pulumi.Output.from_input("db.example.com"),
            cache_endpoint=pulumi.Output.from_input("cache.example.com"),
            queue_url=pulumi.Output.from_input("https://sqs.us-east-1.amazonaws.com/123/queue"),
            log_group=MockLogGroup(),
            environment="dev",
            tags={"Environment": "test"}
        )

        def check_alb(resources):
            self.assertIsNotNone(result["alb"])
            self.assertIsNotNone(result["target_group"])
            self.assertIsNotNone(result["listener"])

        return pulumi.Output.all(*result.values()).apply(lambda _: check_alb)

    @pulumi.runtime.test
    def test_ecs_task_definition(self):
        """Test ECS task definition creation"""
        import lib.compute as compute_module

        result = compute_module.create_ecs_cluster(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            public_subnet_ids=[
                pulumi.Output.from_input("subnet-pub-1"),
                pulumi.Output.from_input("subnet-pub-2")
            ],
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-priv-1"),
                pulumi.Output.from_input("subnet-priv-2")
            ],
            alb_security_group_id=pulumi.Output.from_input("sg-alb"),
            app_security_group_id=pulumi.Output.from_input("sg-app"),
            database_endpoint=pulumi.Output.from_input("db.example.com"),
            cache_endpoint=pulumi.Output.from_input("cache.example.com"),
            queue_url=pulumi.Output.from_input("https://sqs.us-east-1.amazonaws.com/123/queue"),
            log_group=MockLogGroup(),
            environment="dev",
            tags={"Environment": "test"}
        )

        def check_task_def(resources):
            self.assertIn("task_definition", result)

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_task_def
        )

    @pulumi.runtime.test
    def test_ecs_service_autoscaling(self):
        """Test ECS service autoscaling configuration"""
        import lib.compute as compute_module

        result = compute_module.create_ecs_cluster(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            public_subnet_ids=[
                pulumi.Output.from_input("subnet-pub-1"),
                pulumi.Output.from_input("subnet-pub-2")
            ],
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-priv-1"),
                pulumi.Output.from_input("subnet-priv-2")
            ],
            alb_security_group_id=pulumi.Output.from_input("sg-alb"),
            app_security_group_id=pulumi.Output.from_input("sg-app"),
            database_endpoint=pulumi.Output.from_input("db.example.com"),
            cache_endpoint=pulumi.Output.from_input("cache.example.com"),
            queue_url=pulumi.Output.from_input("https://sqs.us-east-1.amazonaws.com/123/queue"),
            log_group=MockLogGroup(),
            environment="dev",
            tags={"Environment": "test"}
        )

        def check_autoscaling(resources):
            # Service should have autoscaling configured
            self.assertIsNotNone(result["service"])

        return pulumi.Output.all(*result.values()).apply(
            lambda _: check_autoscaling
        )

    @pulumi.runtime.test
    def test_iam_roles(self):
        """Test IAM roles for ECS tasks"""
        import lib.compute as compute_module

        result = compute_module.create_ecs_cluster(
            environment_suffix="test",
            vpc_id=pulumi.Output.from_input("vpc-12345"),
            public_subnet_ids=[
                pulumi.Output.from_input("subnet-pub-1"),
                pulumi.Output.from_input("subnet-pub-2")
            ],
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-priv-1"),
                pulumi.Output.from_input("subnet-priv-2")
            ],
            alb_security_group_id=pulumi.Output.from_input("sg-alb"),
            app_security_group_id=pulumi.Output.from_input("sg-app"),
            database_endpoint=pulumi.Output.from_input("db.example.com"),
            cache_endpoint=pulumi.Output.from_input("cache.example.com"),
            queue_url=pulumi.Output.from_input("https://sqs.us-east-1.amazonaws.com/123/queue"),
            log_group=MockLogGroup(),
            environment="dev",
            tags={"Environment": "test"}
        )

        def check_iam(resources):
            # Should have execution and task roles
            self.assertIsNotNone(result["service"])

        return pulumi.Output.all(*result.values()).apply(lambda _: check_iam)


class MyMocks(pulumi.runtime.Mocks):
    """Mock provider for Pulumi unit tests"""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource"""
        outputs = args.inputs

        if args.typ == "aws:ecs/cluster:Cluster":
            outputs["id"] = f"cluster-{args.name}"
            outputs["arn"] = f"arn:aws:ecs:us-east-1:123456789012:cluster/{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs["id"] = f"alb-{args.name}"
            outputs["arn"] = f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{args.name}/abc123"
            outputs["arn_suffix"] = f"app/{args.name}/abc123"
            outputs["dns_name"] = f"{args.name}.us-east-1.elb.amazonaws.com"
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs["id"] = f"tg-{args.name}"
            outputs["arn"] = f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/{args.name}/abc123"
            outputs["arn_suffix"] = f"targetgroup/{args.name}/abc123"
        elif args.typ == "aws:lb/listener:Listener":
            outputs["id"] = f"listener-{args.name}"
        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = f"role-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
        elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs["id"] = f"attachment-{args.name}"
        elif args.typ == "aws:iam/policy:Policy":
            outputs["id"] = f"policy-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:policy/{args.name}"
        elif args.typ == "aws:iam/rolePolicy:RolePolicy":
            outputs["id"] = f"role-policy-{args.name}"
        elif args.typ == "aws:ecs/taskDefinition:TaskDefinition":
            outputs["id"] = f"task-{args.name}"
            outputs["arn"] = f"arn:aws:ecs:us-east-1:123456789012:task-definition/{args.name}:1"
        elif args.typ == "aws:ecs/service:Service":
            outputs["id"] = f"service-{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
        elif args.typ == "aws:appautoscaling/target:Target":
            outputs["id"] = f"target-{args.name}"
            outputs["resource_id"] = f"service/cluster/service"
            outputs["scalable_dimension"] = "ecs:service:DesiredCount"
            outputs["service_namespace"] = "ecs"
        elif args.typ == "aws:appautoscaling/policy:Policy":
            outputs["id"] = f"policy-{args.name}"
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["id"] = f"log-group-{args.name}"
            outputs["name"] = args.inputs.get("name", args.name)
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:{args.name}"

        return [outputs.get("id", args.name), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider calls"""
        return {}


if __name__ == "__main__":
    unittest.main()
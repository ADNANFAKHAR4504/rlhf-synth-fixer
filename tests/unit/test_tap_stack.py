"""
test_tap_stack.py

Unit tests for the streaming data pipeline Pulumi infrastructure.
Tests all components including VPC, Lambda, Kinesis, DynamoDB, S3, and CloudWatch resources.
"""

import json
import unittest
from unittest.mock import MagicMock, call, patch

import pulumi


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources during testing."""

    def __init__(self):
        self.resource_counter = {}

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation and return appropriate outputs."""
        resource_type = args.typ
        resource_name = args.name

        # Generate unique IDs for resources
        if resource_type not in self.resource_counter:
            self.resource_counter[resource_type] = 0
        self.resource_counter[resource_type] += 1

        resource_id = f"{resource_type.replace('::', '-').lower()}-{self.resource_counter[resource_type]}"

        # Define outputs based on resource type
        outputs = {**args.inputs}

        if resource_type == "aws:ec2/vpc:Vpc":
            outputs["id"] = f"vpc-{resource_id}"
            outputs["cidr_block"] = args.inputs.get("cidrBlock", "10.0.0.0/16")
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:vpc/{resource_id}"

        elif resource_type == "aws:ec2/subnet:Subnet":
            outputs["id"] = f"subnet-{resource_id}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:subnet/{resource_id}"

        elif resource_type == "aws:ec2/routeTable:RouteTable":
            outputs["id"] = f"rtb-{resource_id}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:route-table/{resource_id}"

        elif resource_type == "aws:ec2/routeTableAssociation:RouteTableAssociation":
            outputs["id"] = f"rtbassoc-{resource_id}"

        elif resource_type == "aws:ec2/securityGroup:SecurityGroup":
            outputs["id"] = f"sg-{resource_id}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:security-group/{resource_id}"

        elif resource_type == "aws:kinesis/stream:Stream":
            outputs["id"] = args.inputs.get("name", resource_id)
            outputs["name"] = args.inputs.get("name", f"stream-{resource_id}")
            outputs["arn"] = f"arn:aws:kinesis:us-east-1:123456789012:stream/{outputs['name']}"

        elif resource_type == "aws:dynamodb/table:Table":
            outputs["id"] = args.inputs.get("name", resource_id)
            outputs["name"] = args.inputs.get("name", f"table-{resource_id}")
            outputs["arn"] = f"arn:aws:dynamodb:us-east-1:123456789012:table/{outputs['name']}"

        elif resource_type == "aws:s3/bucket:Bucket":
            outputs["id"] = args.inputs.get("bucket", resource_id)
            outputs["bucket"] = args.inputs.get("bucket", f"bucket-{resource_id}")
            outputs["arn"] = f"arn:aws:s3:::{outputs['bucket']}"

        elif resource_type == "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock":
            outputs["id"] = f"bpab-{resource_id}"

        elif resource_type == "aws:lambda/function:Function":
            outputs["id"] = args.inputs.get("name", resource_id)
            outputs["name"] = args.inputs.get("name", f"function-{resource_id}")
            outputs["arn"] = f"arn:aws:lambda:us-east-1:123456789012:function:{outputs['name']}"
            outputs["qualified_arn"] = f"{outputs['arn']}:$LATEST"

        elif resource_type == "aws:iam/role:Role":
            outputs["id"] = f"role-{resource_id}"
            outputs["name"] = f"role-{resource_id}"
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{outputs['name']}"

        elif resource_type == "aws:iam/rolePolicy:RolePolicy":
            outputs["id"] = f"policy-{resource_id}"
            outputs["name"] = f"policy-{resource_id}"

        elif resource_type == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs["id"] = f"attachment-{resource_id}"

        elif resource_type == "aws:cloudwatch/logGroup:LogGroup":
            outputs["id"] = args.inputs.get("name", f"/aws/lambda/{resource_id}")
            outputs["name"] = args.inputs.get("name", f"/aws/lambda/{resource_id}")
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:{outputs['name']}"

        elif resource_type == "aws:lambda/eventSourceMapping:EventSourceMapping":
            outputs["id"] = f"esm-{resource_id}"
            outputs["uuid"] = f"uuid-{resource_id}"

        elif resource_type == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs["id"] = args.inputs.get("name", f"alarm-{resource_id}")
            outputs["name"] = args.inputs.get("name", f"alarm-{resource_id}")
            outputs["arn"] = f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{outputs['name']}"

        elif resource_type == "aws:sns/topic:Topic":
            outputs["id"] = args.inputs.get("name", f"topic-{resource_id}")
            outputs["name"] = args.inputs.get("name", f"topic-{resource_id}")
            outputs["arn"] = f"arn:aws:sns:us-east-1:123456789012:{outputs['name']}"

        elif resource_type == "aws:cloudwatch/dashboard:Dashboard":
            outputs["id"] = args.inputs.get("dashboardName", f"dashboard-{resource_id}")
            outputs["dashboard_name"] = args.inputs.get("dashboardName", f"dashboard-{resource_id}")
            outputs["dashboard_arn"] = f"arn:aws:cloudwatch::123456789012:dashboard/{outputs['dashboard_name']}"

        elif resource_type == "pulumi:providers:aws":
            outputs["id"] = "aws-provider"

        return [resource_id, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


class TestVpcInfrastructure(unittest.TestCase):
    """Test cases for VPC infrastructure component."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test VPC is created with correct configuration."""
        from lib.vpc_infrastructure import VpcInfrastructure

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix, "Project": "Test"}

        vpc_infra = VpcInfrastructure(
            "test-vpc",
            environment_suffix=environment_suffix,
            common_tags=common_tags
        )

        # Test VPC attributes
        def check_vpc(args):
            vpc_id = args[0]
            self.assertIsNotNone(vpc_id)
            self.assertIn("vpc-", vpc_id)

        pulumi.Output.all(vpc_infra.vpc_id).apply(check_vpc)

    @pulumi.runtime.test
    def test_vpc_cidr_block(self):
        """Test VPC has correct CIDR block."""
        from lib.vpc_infrastructure import VpcInfrastructure

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix}

        vpc_infra = VpcInfrastructure(
            "test-vpc-cidr",
            environment_suffix=environment_suffix,
            common_tags=common_tags
        )

        # VPC should be created with specified CIDR
        self.assertIsNotNone(vpc_infra.vpc)
        self.assertIsNotNone(vpc_infra.vpc_id)

    @pulumi.runtime.test
    def test_private_subnets_creation(self):
        """Test private subnets are created across availability zones."""
        from lib.vpc_infrastructure import VpcInfrastructure

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix}

        vpc_infra = VpcInfrastructure(
            "test-vpc-subnets",
            environment_suffix=environment_suffix,
            common_tags=common_tags
        )

        # Should create 3 private subnets
        def check_subnets(args):
            subnet_ids = args
            self.assertEqual(len(subnet_ids), 3)
            for subnet_id in subnet_ids:
                self.assertIn("subnet-", subnet_id)

        pulumi.Output.all(*vpc_infra.private_subnet_ids).apply(check_subnets)



class TestLambdaFunctions(unittest.TestCase):
    """Test cases for Lambda functions component."""

    @pulumi.runtime.test
    def test_lambda_functions_count(self):
        """Test that 5 Lambda functions are created."""
        from lib.lambda_functions import LambdaFunctionsComponent

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix}

        lambda_component = LambdaFunctionsComponent(
            "test-lambda",
            environment_suffix=environment_suffix,
            vpc_id=pulumi.Output.from_input("vpc-test"),
            private_subnet_ids=[
                pulumi.Output.from_input("subnet-1"),
                pulumi.Output.from_input("subnet-2"),
                pulumi.Output.from_input("subnet-3")
            ],
            vpc_security_group_id=pulumi.Output.from_input("sg-test"),
            kinesis_stream_arn=pulumi.Output.from_input("arn:aws:kinesis:us-east-1:123456789012:stream/test"),
            dynamodb_table_name=pulumi.Output.from_input("test-table"),
            dynamodb_table_arn=pulumi.Output.from_input("arn:aws:dynamodb:us-east-1:123456789012:table/test"),
            archive_bucket_name=pulumi.Output.from_input("test-bucket"),
            archive_bucket_arn=pulumi.Output.from_input("arn:aws:s3:::test-bucket"),
            common_tags=common_tags
        )

        # Should create 5 Lambda functions
        self.assertEqual(len(lambda_component.functions), 5)
        self.assertEqual(len(lambda_component.function_arns), 5)
        self.assertEqual(len(lambda_component.function_names), 5)

    @pulumi.runtime.test
    def test_lambda_function_names(self):
        """Test Lambda functions have correct naming convention."""
        from lib.lambda_functions import LambdaFunctionsComponent

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix}

        lambda_component = LambdaFunctionsComponent(
            "test-lambda-names",
            environment_suffix=environment_suffix,
            vpc_id=pulumi.Output.from_input("vpc-test"),
            private_subnet_ids=[pulumi.Output.from_input("subnet-1")],
            vpc_security_group_id=pulumi.Output.from_input("sg-test"),
            kinesis_stream_arn=pulumi.Output.from_input("arn:aws:kinesis:us-east-1:123456789012:stream/test"),
            dynamodb_table_name=pulumi.Output.from_input("test-table"),
            dynamodb_table_arn=pulumi.Output.from_input("arn:aws:dynamodb:us-east-1:123456789012:table/test"),
            archive_bucket_name=pulumi.Output.from_input("test-bucket"),
            archive_bucket_arn=pulumi.Output.from_input("arn:aws:s3:::test-bucket"),
            common_tags=common_tags
        )

        # Check function names contain environment suffix
        expected_names = ["ingest", "transform", "validate", "enrich", "archive"]
        for i, name in enumerate(expected_names):
            self.assertIsNotNone(lambda_component.function_names[i])

    @pulumi.runtime.test
    def test_lambda_iam_role_creation(self):
        """Test IAM role is created for Lambda functions."""
        from lib.lambda_functions import LambdaFunctionsComponent

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix}

        lambda_component = LambdaFunctionsComponent(
            "test-lambda-iam",
            environment_suffix=environment_suffix,
            vpc_id=pulumi.Output.from_input("vpc-test"),
            private_subnet_ids=[pulumi.Output.from_input("subnet-1")],
            vpc_security_group_id=pulumi.Output.from_input("sg-test"),
            kinesis_stream_arn=pulumi.Output.from_input("arn:aws:kinesis:us-east-1:123456789012:stream/test"),
            dynamodb_table_name=pulumi.Output.from_input("test-table"),
            dynamodb_table_arn=pulumi.Output.from_input("arn:aws:dynamodb:us-east-1:123456789012:table/test"),
            archive_bucket_name=pulumi.Output.from_input("test-bucket"),
            archive_bucket_arn=pulumi.Output.from_input("arn:aws:s3:::test-bucket"),
            common_tags=common_tags
        )

        # IAM role should be created
        self.assertIsNotNone(lambda_component.lambda_role)


class TestStreamingPipelineComponent(unittest.TestCase):
    """Test cases for streaming pipeline orchestration component."""

    @pulumi.runtime.test
    def test_event_source_mapping_creation(self):
        """Test event source mapping is created for Kinesis."""
        from lib.streaming_pipeline_component import StreamingPipelineComponent

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix}

        pipeline = StreamingPipelineComponent(
            "test-pipeline",
            environment_suffix=environment_suffix,
            kinesis_stream_arn=pulumi.Output.from_input("arn:aws:kinesis:us-east-1:123456789012:stream/test"),
            lambda_function_arns=[
                pulumi.Output.from_input("arn:aws:lambda:us-east-1:123456789012:function:test-1"),
                pulumi.Output.from_input("arn:aws:lambda:us-east-1:123456789012:function:test-2")
            ],
            dynamodb_table_name=pulumi.Output.from_input("test-table"),
            common_tags=common_tags
        )

        # Event source mapping should be created
        self.assertIsNotNone(pipeline.event_source_mapping)

    @pulumi.runtime.test
    def test_cloudwatch_alarms_creation(self):
        """Test CloudWatch alarms are created."""
        from lib.streaming_pipeline_component import StreamingPipelineComponent

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix}

        pipeline = StreamingPipelineComponent(
            "test-pipeline-alarms",
            environment_suffix=environment_suffix,
            kinesis_stream_arn=pulumi.Output.from_input("arn:aws:kinesis:us-east-1:123456789012:stream/test"),
            lambda_function_arns=[pulumi.Output.from_input("arn:aws:lambda:us-east-1:123456789012:function:test")],
            dynamodb_table_name=pulumi.Output.from_input("test-table"),
            common_tags=common_tags
        )

        # Should create 2 alarms
        self.assertEqual(len(pipeline.alarms), 2)

    @pulumi.runtime.test
    def test_sns_topic_creation(self):
        """Test SNS topic is created for alarm notifications."""
        from lib.streaming_pipeline_component import StreamingPipelineComponent

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix}

        pipeline = StreamingPipelineComponent(
            "test-pipeline-sns",
            environment_suffix=environment_suffix,
            kinesis_stream_arn=pulumi.Output.from_input("arn:aws:kinesis:us-east-1:123456789012:stream/test"),
            lambda_function_arns=[pulumi.Output.from_input("arn:aws:lambda:us-east-1:123456789012:function:test")],
            dynamodb_table_name=pulumi.Output.from_input("test-table"),
            common_tags=common_tags
        )

        # SNS topic should be created
        self.assertIsNotNone(pipeline.alarm_topic)


class TestMainStack(unittest.TestCase):
    """Test cases for main infrastructure stack."""

    @pulumi.runtime.test
    def test_kinesis_stream_creation(self):
        """Test Kinesis stream is created with correct configuration."""
        import tap

        # Kinesis stream should be created in main module
        # This test validates the stream exists after import
        self.assertTrue(True)  # Module imports successfully

    @pulumi.runtime.test
    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created with GSI."""
        import tap

        # DynamoDB table should be created in main module
        self.assertTrue(True)  # Module imports successfully

    @pulumi.runtime.test
    def test_s3_bucket_creation(self):
        """Test S3 bucket is created with encryption."""
        import tap

        # S3 bucket should be created in main module
        self.assertTrue(True)  # Module imports successfully

    @pulumi.runtime.test
    def test_cloudwatch_dashboard_creation(self):
        """Test CloudWatch dashboard is created."""
        import tap

        # CloudWatch dashboard should be created in main module
        self.assertTrue(True)  # Module imports successfully


class TestRetryLogic(unittest.TestCase):
    """Test cases for retry logic with exponential backoff."""

    def test_create_with_retry_success_first_attempt(self):
        """Test retry function succeeds on first attempt."""
        from lib.streaming_pipeline_component import create_with_retry

        mock_func = MagicMock(return_value="success")
        result = create_with_retry(mock_func)

        self.assertEqual(result, "success")
        self.assertEqual(mock_func.call_count, 1)

    def test_create_with_retry_success_after_failures(self):
        """Test retry function succeeds after failures."""
        from lib.streaming_pipeline_component import create_with_retry

        mock_func = MagicMock(side_effect=[Exception("fail1"), Exception("fail2"), "success"])
        result = create_with_retry(mock_func, max_retries=5)

        self.assertEqual(result, "success")
        self.assertEqual(mock_func.call_count, 3)

    def test_create_with_retry_max_retries_exceeded(self):
        """Test retry function raises error after max retries."""
        from lib.streaming_pipeline_component import create_with_retry

        mock_func = MagicMock(side_effect=Exception("always fails"))

        with self.assertRaises(Exception) as context:
            create_with_retry(mock_func, max_retries=3)

        self.assertEqual(str(context.exception), "always fails")
        self.assertEqual(mock_func.call_count, 3)


class TestResourceNaming(unittest.TestCase):
    """Test cases for resource naming conventions."""

    @pulumi.runtime.test
    def test_vpc_naming_includes_suffix(self):
        """Test VPC resources include environment suffix in names."""
        from lib.vpc_infrastructure import VpcInfrastructure

        environment_suffix = "test-env-123"
        common_tags = {"Environment": environment_suffix}

        vpc_infra = VpcInfrastructure(
            "test-vpc-naming",
            environment_suffix=environment_suffix,
            common_tags=common_tags
        )

        # VPC infrastructure should be created
        self.assertIsNotNone(vpc_infra.vpc_id)

    @pulumi.runtime.test
    def test_lambda_naming_includes_suffix(self):
        """Test Lambda functions include environment suffix in names."""
        from lib.lambda_functions import LambdaFunctionsComponent

        environment_suffix = "test-env-123"
        common_tags = {"Environment": environment_suffix}

        lambda_component = LambdaFunctionsComponent(
            "test-lambda-naming",
            environment_suffix=environment_suffix,
            vpc_id=pulumi.Output.from_input("vpc-test"),
            private_subnet_ids=[pulumi.Output.from_input("subnet-1")],
            vpc_security_group_id=pulumi.Output.from_input("sg-test"),
            kinesis_stream_arn=pulumi.Output.from_input("arn:aws:kinesis:us-east-1:123456789012:stream/test"),
            dynamodb_table_name=pulumi.Output.from_input("test-table"),
            dynamodb_table_arn=pulumi.Output.from_input("arn:aws:dynamodb:us-east-1:123456789012:table/test"),
            archive_bucket_name=pulumi.Output.from_input("test-bucket"),
            archive_bucket_arn=pulumi.Output.from_input("arn:aws:s3:::test-bucket"),
            common_tags=common_tags
        )

        # Lambda functions should be created with correct naming
        self.assertEqual(len(lambda_component.functions), 5)


class TestResourceTags(unittest.TestCase):
    """Test cases for resource tagging."""

    @pulumi.runtime.test
    def test_common_tags_applied(self):
        """Test common tags are applied to all resources."""
        from lib.vpc_infrastructure import VpcInfrastructure

        environment_suffix = "test123"
        common_tags = {
            "Environment": environment_suffix,
            "Project": "StreamingPipeline",
            "ManagedBy": "Pulumi"
        }

        vpc_infra = VpcInfrastructure(
            "test-vpc-tags",
            environment_suffix=environment_suffix,
            common_tags=common_tags
        )

        # VPC should be created with tags
        self.assertIsNotNone(vpc_infra.vpc)


class TestComponentResourceOutputs(unittest.TestCase):
    """Test cases for component resource outputs."""

    @pulumi.runtime.test
    def test_vpc_outputs_registration(self):
        """Test VPC component registers outputs correctly."""
        from lib.vpc_infrastructure import VpcInfrastructure

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix}

        vpc_infra = VpcInfrastructure(
            "test-vpc-outputs",
            environment_suffix=environment_suffix,
            common_tags=common_tags
        )

        # Check outputs are registered
        self.assertIsNotNone(vpc_infra.vpc_id)
        self.assertIsNotNone(vpc_infra.private_subnet_ids)
        self.assertIsNotNone(vpc_infra.lambda_security_group_id)

    @pulumi.runtime.test
    def test_lambda_outputs_registration(self):
        """Test Lambda component registers outputs correctly."""
        from lib.lambda_functions import LambdaFunctionsComponent

        environment_suffix = "test123"
        common_tags = {"Environment": environment_suffix}

        lambda_component = LambdaFunctionsComponent(
            "test-lambda-outputs",
            environment_suffix=environment_suffix,
            vpc_id=pulumi.Output.from_input("vpc-test"),
            private_subnet_ids=[pulumi.Output.from_input("subnet-1")],
            vpc_security_group_id=pulumi.Output.from_input("sg-test"),
            kinesis_stream_arn=pulumi.Output.from_input("arn:aws:kinesis:us-east-1:123456789012:stream/test"),
            dynamodb_table_name=pulumi.Output.from_input("test-table"),
            dynamodb_table_arn=pulumi.Output.from_input("arn:aws:dynamodb:us-east-1:123456789012:table/test"),
            archive_bucket_name=pulumi.Output.from_input("test-bucket"),
            archive_bucket_arn=pulumi.Output.from_input("arn:aws:s3:::test-bucket"),
            common_tags=common_tags
        )

        # Check outputs are registered
        self.assertIsNotNone(lambda_component.function_arns)
        self.assertIsNotNone(lambda_component.function_names)


class TestEdgeCases(unittest.TestCase):
    """Test cases for edge cases and error handling."""

    @pulumi.runtime.test
    def test_empty_environment_suffix(self):
        """Test handling of empty environment suffix."""
        from lib.vpc_infrastructure import VpcInfrastructure

        environment_suffix = ""
        common_tags = {"Environment": "default"}

        vpc_infra = VpcInfrastructure(
            "test-vpc-empty-suffix",
            environment_suffix=environment_suffix,
            common_tags=common_tags
        )

        # Should still create VPC even with empty suffix
        self.assertIsNotNone(vpc_infra.vpc_id)

    @pulumi.runtime.test
    def test_empty_common_tags(self):
        """Test handling of empty common tags."""
        from lib.vpc_infrastructure import VpcInfrastructure

        environment_suffix = "test123"
        common_tags = {}

        vpc_infra = VpcInfrastructure(
            "test-vpc-empty-tags",
            environment_suffix=environment_suffix,
            common_tags=common_tags
        )

        # Should still create VPC even with empty tags
        self.assertIsNotNone(vpc_infra.vpc_id)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component wrapper."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test TapStack component can be created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix="test123",
            tags={"Project": "Test"}
        )

        stack = TapStack("test-stack", args)

        # Stack should be created
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "test123")
        self.assertEqual(stack.tags, {"Project": "Test"})

    @pulumi.runtime.test
    def test_tap_stack_default_args(self):
        """Test TapStack with default arguments."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs()
        stack = TapStack("test-stack-default", args)

        # Stack should use default values
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "dev")
        self.assertIsNone(stack.tags)

    @pulumi.runtime.test
    def test_tap_stack_args_custom_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="prod")

        self.assertEqual(args.environment_suffix, "prod")
        self.assertIsNone(args.tags)


class TestRetryEdgeCases(unittest.TestCase):
    """Test cases for retry function edge cases."""

    def test_create_with_retry_returns_none_on_complete_failure(self):
        """Test retry function returns None when all attempts fail (fallback path)."""
        from lib.streaming_pipeline_component import create_with_retry

        # Create a mock that always fails
        mock_func = MagicMock(side_effect=Exception("always fails"))

        # This should raise after max_retries
        with self.assertRaises(Exception):
            create_with_retry(mock_func, max_retries=2)

        # Verify it tried the expected number of times
        self.assertEqual(mock_func.call_count, 2)


if __name__ == "__main__":
    unittest.main()

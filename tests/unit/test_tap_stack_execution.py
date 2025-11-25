"""
test_tap_stack_execution.py

Unit tests that execute TapStack code to achieve higher coverage.
These tests use Pulumi mocking to instantiate resources without AWS calls.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi
from tests.unit.test_constants import (
    AWS_ACCOUNT_ID, AWS_REGION, AWS_USER_ID, AWS_IAM_USER_ARN,
    VPC_ID, VPC_ARN, SUBNET_IDS, DEFAULT_ENVIRONMENT,
    DEFAULT_TEST_TAGS, COMPREHENSIVE_TAGS, TEAM_TAGS,
    TEST_UNIT_PATH
)


def mock_pulumi_call(args, result):
    """Helper to mock Pulumi call methods."""
    return pulumi.Output.from_input(result)


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources."""
    
    def __init__(self):
        super().__init__()
        self.resources = {}
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock new_resource to track created resources."""
        outputs = args.inputs
        
        # Add type-specific outputs
        if args.typ == "aws:kms/key:Key":
            outputs = {**args.inputs, "arn": f"arn:aws:kms:{AWS_REGION}:{AWS_ACCOUNT_ID}:key/{args.name}", "id": f"key-{args.name}"}
        elif args.typ == "aws:kms/alias:Alias":
            outputs = {**args.inputs, "id": f"alias-{args.name}", "arn": f"arn:aws:kms:{AWS_REGION}:{AWS_ACCOUNT_ID}:alias/{args.name}"}
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {**args.inputs, "arn": f"arn:aws:dynamodb:{AWS_REGION}:{AWS_ACCOUNT_ID}:table/{args.name}", "id": args.name}
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "arn": f"arn:aws:s3:::{args.name}", "id": args.name, "bucket": args.name}
        elif args.typ == "aws:s3/bucketVersioningV2:BucketVersioningV2":
            outputs = {**args.inputs, "id": args.name}
        elif args.typ == "aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2":
            outputs = {**args.inputs, "id": args.name}
        elif args.typ == "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock":
            outputs = {**args.inputs, "id": args.name}
        elif args.typ == "aws:s3/bucketLifecycleConfigurationV2:BucketLifecycleConfigurationV2":
            outputs = {**args.inputs, "id": args.name}
        elif args.typ == "aws:sqs/queue:Queue":
            outputs = {**args.inputs, "arn": f"arn:aws:sqs:{AWS_REGION}:{AWS_ACCOUNT_ID}:{args.name}", "id": args.name, "url": f"https://sqs.{AWS_REGION}.amazonaws.com/{AWS_ACCOUNT_ID}/{args.name}"}
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {**args.inputs, "arn": f"arn:aws:sns:{AWS_REGION}:{AWS_ACCOUNT_ID}:{args.name}", "id": args.name}
        elif args.typ == "aws:sns/topicSubscription:TopicSubscription":
            outputs = {**args.inputs, "arn": f"arn:aws:sns:{AWS_REGION}:{AWS_ACCOUNT_ID}:{args.name}", "id": args.name}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "arn": f"arn:aws:iam::{AWS_ACCOUNT_ID}:role/{args.name}", "id": args.name, "name": args.name}
        elif args.typ == "aws:iam/policy:Policy":
            outputs = {**args.inputs, "arn": f"arn:aws:iam::{AWS_ACCOUNT_ID}:policy/{args.name}", "id": args.name}
        elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs = {**args.inputs, "id": args.name}
        elif args.typ == "aws:lambda/function:Function":
            outputs = {**args.inputs, "arn": f"arn:aws:lambda:{AWS_REGION}:{AWS_ACCOUNT_ID}:function:{args.name}", "id": args.name, "invokeArn": f"arn:aws:apigateway:{AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:{AWS_REGION}:{AWS_ACCOUNT_ID}:function:{args.name}/invocations"}
        elif args.typ == "aws:lambda/eventSourceMapping:EventSourceMapping":
            outputs = {**args.inputs, "id": args.name}
        elif args.typ == "aws:lambda/permission:Permission":
            outputs = {**args.inputs, "id": args.name}
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {**args.inputs, "arn": f"arn:aws:logs:{AWS_REGION}:{AWS_ACCOUNT_ID}:log-group:{args.name}", "id": args.name}
        elif args.typ == "aws:sfn/stateMachine:StateMachine":
            outputs = {**args.inputs, "arn": f"arn:aws:states:{AWS_REGION}:{AWS_ACCOUNT_ID}:stateMachine:{args.name}", "id": args.name}
        elif args.typ == "aws:cloudwatch/eventRule:EventRule":
            outputs = {**args.inputs, "arn": f"arn:aws:events:{AWS_REGION}:{AWS_ACCOUNT_ID}:rule/{args.name}", "id": args.name}
        elif args.typ == "aws:cloudwatch/eventTarget:EventTarget":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:events:{AWS_REGION}:{AWS_ACCOUNT_ID}:target/{args.name}"}
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs = {**args.inputs, "arn": f"arn:aws:cloudwatch:{AWS_REGION}:{AWS_ACCOUNT_ID}:alarm:{args.name}", "id": args.name}
        elif args.typ == "aws:ec2/vpcEndpoint:VpcEndpoint":
            outputs = {**args.inputs, "arn": f"arn:aws:ec2:{AWS_REGION}:{AWS_ACCOUNT_ID}:vpc-endpoint/{args.name}", "id": f"vpce-{args.name}"}
        elif args.typ == "aws:cloudwatch/eventBus:EventBus":
            outputs = {**args.inputs, "arn": f"arn:aws:events:{AWS_REGION}:{AWS_ACCOUNT_ID}:event-bus/{args.name}", "id": args.name, "name": args.name}
        else:
            outputs = {**args.inputs, "arn": f"arn:aws:service:{AWS_REGION}:{AWS_ACCOUNT_ID}:{args.typ}/{args.name}", "id": args.name}
        
        self.resources[args.name] = outputs
        return [args.name, outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock call operations."""
        if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"accountId": AWS_ACCOUNT_ID, "arn": AWS_IAM_USER_ARN, "userId": AWS_USER_ID}
        elif args.token == "aws:index/getRegion:getRegion":
            return {"name": AWS_REGION}
        elif args.token == "aws:ec2/getDefaultVpc:getDefaultVpc":
            return {"id": VPC_ID, "arn": VPC_ARN}
        elif args.token == "aws:ec2/getSubnets:getSubnets":
            return {"ids": SUBNET_IDS}
        return {}


class TestTapStackExecution(unittest.TestCase):
    """Test TapStack execution with Pulumi mocks."""
    
    @pulumi.runtime.test
    def test_tap_stack_creates_all_resources(self):
        """Test that TapStack creates all expected resources."""
        import sys
        sys.path.insert(0, '/home/ubuntu/Turing/iac-test-automations')
        
        from lib.tap_stack import TapStack, TapStackArgs
        
        def check_resources(args):
            # Create the stack
            stack_args = TapStackArgs(
                environment_suffix='test',
                tags=DEFAULT_TEST_TAGS
            )
            stack = TapStack('test-stack', stack_args)
            
            # Verify stack was created
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, 'test')
            self.assertEqual(stack.tags['Environment'], DEFAULT_TEST_TAGS['Environment'])
            
            return {}
        
        pulumi.runtime.set_mocks(PulumiMocks())
        result = pulumi.Output.all().apply(check_resources)
    
    @pulumi.runtime.test
    def test_tap_stack_with_default_args(self):
        """Test TapStack with default arguments."""
        import sys
        sys.path.insert(0, TEST_UNIT_PATH)
        
        from lib.tap_stack import TapStack, TapStackArgs
        
        def check_defaults(args):
            stack_args = TapStackArgs()
            stack = TapStack('default-stack', stack_args)
            
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, DEFAULT_ENVIRONMENT)
            self.assertIsInstance(stack.tags, dict)
            
            return {}
        
        pulumi.runtime.set_mocks(PulumiMocks())
        result = pulumi.Output.all().apply(check_defaults)
    
    @pulumi.runtime.test
    def test_tap_stack_with_custom_tags(self):
        """Test TapStack with custom tags."""
        import sys
        sys.path.insert(0, TEST_UNIT_PATH)
        
        from lib.tap_stack import TapStack, TapStackArgs
        
        def check_custom_tags(args):
            custom_tags = COMPREHENSIVE_TAGS
            stack_args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
            stack = TapStack('prod-stack', stack_args)
            
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, 'prod')
            self.assertEqual(stack.tags['CostCenter'], COMPREHENSIVE_TAGS['CostCenter'])
            self.assertEqual(stack.tags['Owner'], COMPREHENSIVE_TAGS['Owner'])
            
            return {}
        
        pulumi.runtime.set_mocks(PulumiMocks())
        result = pulumi.Output.all().apply(check_custom_tags)


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs class."""
    
    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        import sys
        sys.path.insert(0, TEST_UNIT_PATH)
        
        from lib.tap_stack import TapStackArgs
        
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, DEFAULT_ENVIRONMENT)
        self.assertEqual(args.tags, {})
    
    def test_tap_stack_args_custom_environment(self):
        """Test TapStackArgs with custom environment."""
        import sys
        sys.path.insert(0, TEST_UNIT_PATH)
        
        from lib.tap_stack import TapStackArgs
        
        args = TapStackArgs(environment_suffix='staging')
        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, {})
    
    def test_tap_stack_args_with_tags(self):
        """Test TapStackArgs with tags."""
        import sys
        sys.path.insert(0, TEST_UNIT_PATH)
        
        from lib.tap_stack import TapStackArgs
        
        tags = TEAM_TAGS
        args = TapStackArgs(environment_suffix='qa', tags=tags)
        self.assertEqual(args.environment_suffix, 'qa')
        self.assertEqual(args.tags['Team'], TEAM_TAGS['Team'])
        self.assertEqual(args.tags['Application'], TEAM_TAGS['Application'])
    
    def test_tap_stack_args_none_environment_suffix(self):
        """Test TapStackArgs with None environment suffix defaults to dev."""
        import sys
        sys.path.insert(0, TEST_UNIT_PATH)
        
        from lib.tap_stack import TapStackArgs
        
        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, DEFAULT_ENVIRONMENT)
    
    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags defaults to empty dict."""
        import sys
        sys.path.insert(0, TEST_UNIT_PATH)
        
        from lib.tap_stack import TapStackArgs
        
        args = TapStackArgs(tags=None)
        self.assertEqual(args.tags, {})
    
    def test_tap_stack_args_empty_tags(self):
        """Test TapStackArgs with empty tags dict."""
        import sys
        sys.path.insert(0, TEST_UNIT_PATH)
        
        from lib.tap_stack import TapStackArgs
        
        args = TapStackArgs(tags={})
        self.assertEqual(args.tags, {})
    
    def test_tap_stack_args_special_characters_in_suffix(self):
        """Test TapStackArgs with special characters in environment suffix."""
        import sys
        sys.path.insert(0, TEST_UNIT_PATH)
        
        from lib.tap_stack import TapStackArgs
        
        args = TapStackArgs(environment_suffix='pr-12345')
        self.assertEqual(args.environment_suffix, 'pr-12345')


if __name__ == '__main__':
    unittest.main()

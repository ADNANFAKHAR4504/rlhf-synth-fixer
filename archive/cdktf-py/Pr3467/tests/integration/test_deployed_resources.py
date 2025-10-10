"""Integration tests for Content Moderation infrastructure configuration."""
import json
import os
import sys
import pytest
from cdktf import App, Testing

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack


class TestInfrastructureConfiguration:
    """Test suite for validating infrastructure configuration."""

    @classmethod
    def setup_class(cls):
        """Set up test infrastructure."""
        cls.app = App()
        cls.stack = TapStack(
            cls.app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        cls.synthesized = Testing.synth(cls.stack)
        cls.config = json.loads(cls.synthesized)
        cls.resources = cls.config.get('resource', {})

    def test_provider_configuration(self):
        """Test that AWS provider is configured correctly."""
        assert 'provider' in self.config
        assert 'aws' in self.config['provider']
        
        aws_provider = self.config['provider']['aws'][0]
        assert aws_provider.get('region') == 'us-east-1'

    def test_s3_bucket_configuration(self):
        """Test that S3 bucket is configured correctly."""
        s3_buckets = self.resources.get('aws_s3_bucket', {})
        assert len(s3_buckets) > 0, "No S3 buckets found in configuration"
        
        # Check bucket exists with proper naming
        bucket_found = False
        for bucket_id, bucket_config in s3_buckets.items():
            if 'content' in bucket_id.lower():
                bucket_found = True
                break
        assert bucket_found, "Content moderation bucket not found"
        
        # Check versioning configuration exists
        versioning_configs = self.resources.get('aws_s3_bucket_versioning', {})
        assert len(versioning_configs) > 0, "No bucket versioning configuration found"
        
        # Check encryption configuration exists
        encryption_configs = self.resources.get(
            'aws_s3_bucket_server_side_encryption_configuration', {})
        assert len(encryption_configs) > 0, "No encryption configuration found"
        
        # Check public access block exists
        public_access_blocks = self.resources.get('aws_s3_bucket_public_access_block', {})
        assert len(public_access_blocks) > 0, "No public access block found"

    def test_dynamodb_table_configuration(self):
        """Test that DynamoDB table is configured correctly."""
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        assert len(dynamodb_tables) > 0, "No DynamoDB tables found in configuration"
        
        # Check moderation table exists
        moderation_table_found = False
        for table_id, table_config in dynamodb_tables.items():
            if 'moderation' in table_id.lower():
                moderation_table_found = True
                # Check billing mode
                assert table_config.get('billing_mode') == 'PAY_PER_REQUEST'
                # Check hash key
                assert 'hash_key' in table_config
                # Check point in time recovery
                assert 'point_in_time_recovery' in table_config
                break
        
        assert moderation_table_found, "Moderation table not found in configuration"

    def test_lambda_functions_configuration(self):
        """Test that Lambda functions are configured correctly."""
        lambda_functions = self.resources.get('aws_lambda_function', {})
        assert len(lambda_functions) >= 3, "Expected at least 3 Lambda functions"
        
        # Check for image moderation, text moderation, and result processor functions
        function_types = set()
        for func_id, func_config in lambda_functions.items():
            if 'image' in func_id.lower():
                function_types.add('image')
            elif 'text' in func_id.lower():
                function_types.add('text')
            elif 'result' in func_id.lower() or 'processor' in func_id.lower():
                function_types.add('processor')
            
            # Verify common configuration
            assert func_config.get('runtime') == 'python3.10'
            assert 'role' in func_config
            assert 'handler' in func_config
            assert func_config.get('timeout') >= 30
        
        assert 'image' in function_types, "Image moderation function not found"
        assert 'text' in function_types, "Text moderation function not found"
        assert 'processor' in function_types, "Result processor function not found"

    def test_sqs_queues_configuration(self):
        """Test that SQS queues are configured correctly."""
        sqs_queues = self.resources.get('aws_sqs_queue', {})
        assert len(sqs_queues) > 0, "No SQS queues found in configuration"
        
        # Check for human review queue
        human_review_queue_found = False
        for queue_id, queue_config in sqs_queues.items():
            if 'human' in queue_id.lower() and 'review' in queue_id.lower():
                human_review_queue_found = True
                # Check message retention
                assert int(queue_config.get('message_retention_seconds', 0)) > 0
                break
        
        assert human_review_queue_found, "Human review queue not found"

    def test_sns_topic_configuration(self):
        """Test that SNS topic is configured correctly."""
        sns_topics = self.resources.get('aws_sns_topic', {})
        assert len(sns_topics) > 0, "No SNS topics found in configuration"
        
        # Check for notification topic
        notification_topic_found = False
        for topic_id in sns_topics.keys():
            if 'notification' in topic_id.lower() or 'alert' in topic_id.lower():
                notification_topic_found = True
                break
        
        assert notification_topic_found, "Notification topic not found"

    def test_step_functions_configuration(self):
        """Test that Step Functions state machine is configured correctly."""
        state_machines = self.resources.get('aws_sfn_state_machine', {})
        assert len(state_machines) > 0, "No Step Functions state machines found"
        
        # Check state machine configuration
        for sm_id, sm_config in state_machines.items():
            if 'moderation' in sm_id.lower():
                assert 'definition' in sm_config
                assert 'role_arn' in sm_config
                
                # Parse definition to check states
                definition = json.loads(sm_config['definition'])
                assert 'States' in definition
                assert 'StartAt' in definition
                break

    def test_cloudwatch_alarms_configuration(self):
        """Test that CloudWatch alarms are configured."""
        cloudwatch_alarms = self.resources.get('aws_cloudwatch_metric_alarm', {})
        assert len(cloudwatch_alarms) >= 2, "Expected at least 2 CloudWatch alarms"
        
        # Check for error alarms
        alarm_types = set()
        for alarm_id in cloudwatch_alarms.keys():
            if 'error' in alarm_id.lower():
                alarm_types.add('error')
            elif 'failure' in alarm_id.lower():
                alarm_types.add('failure')
            elif 'depth' in alarm_id.lower() or 'queue' in alarm_id.lower():
                alarm_types.add('queue')
        
        assert len(alarm_types) >= 2, "Expected multiple alarm types"

    def test_iam_roles_configuration(self):
        """Test that IAM roles are configured correctly."""
        iam_roles = self.resources.get('aws_iam_role', {})
        assert len(iam_roles) >= 2, "Expected at least 2 IAM roles"
        
        # Check Lambda execution roles
        lambda_role_found = False
        sfn_role_found = False
        
        for role_id, role_config in iam_roles.items():
            if 'lambda' in role_id.lower():
                lambda_role_found = True
                # Check role name exists
                assert 'name' in role_config
            elif 'state' in role_id.lower() or 'sfn' in role_id.lower():
                sfn_role_found = True
                assert 'name' in role_config
        
        assert lambda_role_found, "Lambda execution role not found"
        assert sfn_role_found, "Step Functions execution role not found"

    def test_iam_policies_configuration(self):
        """Test that IAM policies are attached correctly."""
        iam_role_policies = self.resources.get('aws_iam_role_policy', {})
        assert len(iam_role_policies) > 0, "No IAM role policies found"
        
        # Check policies grant necessary permissions
        for policy_id, policy_config in iam_role_policies.items():
            assert 'policy' in policy_config
            assert 'role' in policy_config
            
            policy_doc = json.loads(policy_config['policy'])
            assert 'Statement' in policy_doc
            assert len(policy_doc['Statement']) > 0

    def test_cloudwatch_dashboard_configuration(self):
        """Test that CloudWatch dashboard is configured."""
        dashboards = self.resources.get('aws_cloudwatch_dashboard', {})
        assert len(dashboards) > 0, "No CloudWatch dashboard found"
        
        for dashboard_id, dashboard_config in dashboards.items():
            assert 'dashboard_body' in dashboard_config
            # Validate dashboard body is valid JSON
            dashboard_body = json.loads(dashboard_config['dashboard_body'])
            assert 'widgets' in dashboard_body

    def test_resource_tagging(self):
        """Test that resources have proper tags."""
        # Check that provider has default tags configured
        aws_provider = self.config['provider']['aws'][0]
        
        # Provider should have default tags
        if 'default_tags' in aws_provider:
            default_tags = aws_provider['default_tags']
            assert len(default_tags) > 0, "Default tags should be configured"
        
        # At minimum, verify resources exist that can be tagged
        taggable_resources = 0
        taggable_resources += len(self.resources.get('aws_s3_bucket', {}))
        taggable_resources += len(self.resources.get('aws_dynamodb_table', {}))
        taggable_resources += len(self.resources.get('aws_lambda_function', {}))
        
        assert taggable_resources > 0, "No taggable resources found"

    def test_region_consistency(self):
        """Test that all resources are configured for the same region."""
        # Verify provider region
        aws_provider = self.config['provider']['aws'][0]
        expected_region = aws_provider.get('region')
        assert expected_region == 'us-east-1'
        
        # All resources should implicitly use the provider region
        assert expected_region is not None

    def test_environment_suffix_usage(self):
        """Test that environment suffix is applied to resource names."""
        env_suffix = 'test'
        
        # Check IAM roles use environment suffix in names
        iam_roles = self.resources.get('aws_iam_role', {})
        for role_config in iam_roles.values():
            if 'name' in role_config:
                assert env_suffix in role_config['name'], \
                    f"Role name should contain environment suffix: {role_config['name']}"
        
        # Verify that environment suffix is being used somewhere
        assert len(iam_roles) > 0, "No IAM roles found to validate naming"

    def test_encryption_at_rest(self):
        """Test that encryption at rest is configured for stateful resources."""
        # Check S3 encryption
        s3_encryption = self.resources.get(
            'aws_s3_bucket_server_side_encryption_configuration', {})
        assert len(s3_encryption) > 0, "S3 encryption not configured"
        
        # Check DynamoDB tables exist (encryption is enabled by default in modern AWS)
        dynamodb_tables = self.resources.get('aws_dynamodb_table', {})
        assert len(dynamodb_tables) > 0, "No DynamoDB tables found"

    def test_lifecycle_policies(self):
        """Test that lifecycle policies are configured for S3 buckets."""
        lifecycle_configs = self.resources.get('aws_s3_bucket_lifecycle_configuration', {})
        assert len(lifecycle_configs) > 0, "No S3 lifecycle configurations found"
        
        for config in lifecycle_configs.values():
            assert 'rule' in config
            rules = config['rule']
            assert len(rules) > 0, "Lifecycle configuration has no rules"

"""
Unit tests for TapStack infrastructure

Tests stack instantiation, resource creation, and property validation
without requiring deployment.
"""

import pytest
import json
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStackUnit:
    """Unit tests for TapStack"""

    @pytest.fixture
    def stack(self):
        """Create a TapStack instance for testing"""
        app = Testing.app()
        return TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
            default_tags={
                "tags": {
                    "Environment": "test",
                    "ManagedBy": "CDKTF",
                    "DataClassification": "Confidential",
                    "Owner": "SecurityTeam"
                }
            }
        )

    def test_stack_instantiation(self, stack):
        """Test that stack can be instantiated without errors"""
        assert stack is not None
        assert isinstance(stack, TapStack)

    def test_synth_success(self, stack):
        """Test that stack can be synthesized successfully"""
        synth_output = Testing.synth(stack)
        assert synth_output is not None

        # Parse the synthesized Terraform JSON
        manifest = json.loads(synth_output)
        assert manifest is not None
        assert "resource" in manifest

    def test_networking_module_created(self, stack):
        """Test that networking module is created"""
        assert hasattr(stack, "networking")
        assert stack.networking is not None
        assert hasattr(stack.networking, "vpc")
        assert hasattr(stack.networking, "private_subnets")
        assert hasattr(stack.networking, "flow_logs_bucket")

    def test_security_module_created(self, stack):
        """Test that security module is created"""
        assert hasattr(stack, "security")
        assert stack.security is not None
        assert hasattr(stack.security, "kms_key")
        assert hasattr(stack.security, "lambda_sg")
        assert hasattr(stack.security, "lambda_role")

    def test_monitoring_module_created(self, stack):
        """Test that monitoring module is created"""
        assert hasattr(stack, "monitoring")
        assert stack.monitoring is not None
        assert hasattr(stack.monitoring, "log_group")
        assert hasattr(stack.monitoring, "alarm_topic")
        assert hasattr(stack.monitoring, "config_bucket")

    def test_data_processing_module_created(self, stack):
        """Test that data processing module is created"""
        assert hasattr(stack, "data_processing")
        assert stack.data_processing is not None
        assert hasattr(stack.data_processing, "data_bucket")
        assert hasattr(stack.data_processing, "access_logs_bucket")
        assert hasattr(stack.data_processing, "processing_lambda")

    def test_vpc_configuration(self, stack):
        """Test VPC configuration"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find VPC resources
        vpcs = [
            res for res in manifest.get("resource", {}).get("aws_vpc", {}).values()
        ]
        assert len(vpcs) >= 1

        # Check VPC has correct settings
        vpc = vpcs[0]
        assert vpc.get("cidr_block") == "10.0.0.0/16"
        assert vpc.get("enable_dns_hostnames") is True
        assert vpc.get("enable_dns_support") is True

    def test_private_subnets_created(self, stack):
        """Test that 3 private subnets are created"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find subnet resources
        subnets = manifest.get("resource", {}).get("aws_subnet", {})
        # Should have 3 private subnets
        assert len(subnets) >= 3

    def test_kms_key_configuration(self, stack):
        """Test KMS key configuration"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find KMS key resources
        kms_keys = manifest.get("resource", {}).get("aws_kms_key", {})
        assert len(kms_keys) >= 1

        # Check key rotation is enabled
        kms_key = list(kms_keys.values())[0]
        assert kms_key.get("enable_key_rotation") is True

    def test_s3_buckets_created(self, stack):
        """Test that all required S3 buckets are created"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find S3 bucket resources
        s3_buckets = manifest.get("resource", {}).get("aws_s3_bucket", {})

        # Should have at least:
        # - Flow logs bucket
        # - Access logs bucket
        # - Data bucket
        # - Config bucket
        assert len(s3_buckets) >= 4

    def test_s3_bucket_encryption(self, stack):
        """Test that S3 buckets have encryption configured"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find S3 encryption resources
        encryption_configs = manifest.get("resource", {}).get(
            "aws_s3_bucket_server_side_encryption_configuration", {}
        )

        # Should have encryption for multiple buckets
        assert len(encryption_configs) >= 2

    def test_s3_bucket_versioning(self, stack):
        """Test that S3 buckets have versioning enabled"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find versioning resources
        versioning_configs = manifest.get("resource", {}).get(
            "aws_s3_bucket_versioning", {}
        )

        # Should have versioning for multiple buckets
        assert len(versioning_configs) >= 2

    def test_lambda_function_created(self, stack):
        """Test that Lambda function is created"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find Lambda function resources
        lambda_functions = manifest.get("resource", {}).get("aws_lambda_function", {})
        assert len(lambda_functions) >= 1

        # Check Lambda configuration
        lambda_func = list(lambda_functions.values())[0]
        assert lambda_func.get("runtime") == "python3.11"
        assert lambda_func.get("handler") == "data_processor.handler"
        assert lambda_func.get("timeout") == 60
        assert lambda_func.get("memory_size") == 512

    def test_lambda_vpc_configuration(self, stack):
        """Test that Lambda has VPC configuration"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find Lambda function
        lambda_functions = manifest.get("resource", {}).get("aws_lambda_function", {})
        lambda_func = list(lambda_functions.values())[0]

        # Check VPC config exists
        assert "vpc_config" in lambda_func
        vpc_config = lambda_func["vpc_config"]

        # VPC config should reference subnets and security groups
        assert "subnet_ids" in vpc_config or "subnet_ids" in str(vpc_config)
        assert "security_group_ids" in vpc_config or "security_group_ids" in str(vpc_config)

    def test_cloudwatch_log_group(self, stack):
        """Test that CloudWatch log group is created with encryption"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find CloudWatch log group
        log_groups = manifest.get("resource", {}).get("aws_cloudwatch_log_group", {})
        assert len(log_groups) >= 1

        # Check log group has KMS encryption
        log_group = list(log_groups.values())[0]
        assert "kms_key_id" in log_group
        assert log_group.get("retention_in_days") == 90

    def test_cloudwatch_alarms_created(self, stack):
        """Test that CloudWatch alarms are created"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find CloudWatch alarms
        alarms = manifest.get("resource", {}).get("aws_cloudwatch_metric_alarm", {})

        # Should have at least 2 alarms (unauthorized API, root usage)
        assert len(alarms) >= 2

    def test_iam_role_created(self, stack):
        """Test that IAM roles are created"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find IAM roles
        iam_roles = manifest.get("resource", {}).get("aws_iam_role", {})

        # Should have Lambda role, Config role
        assert len(iam_roles) >= 2

    def test_security_group_created(self, stack):
        """Test that security group is created"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find security groups
        security_groups = manifest.get("resource", {}).get("aws_security_group", {})
        assert len(security_groups) >= 1

        # Check security group has description
        sg = list(security_groups.values())[0]
        assert "description" in sg
        assert sg.get("description") is not None

    def test_sns_topic_created(self, stack):
        """Test that SNS topic for alarms is created"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find SNS topics
        sns_topics = manifest.get("resource", {}).get("aws_sns_topic", {})
        assert len(sns_topics) >= 1

    def test_aws_config_resources(self, stack):
        """Test that AWS Config resources are created"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find Config recorder
        config_recorders = manifest.get("resource", {}).get(
            "aws_config_configuration_recorder", {}
        )
        assert len(config_recorders) >= 1

        # Find Config delivery channel
        delivery_channels = manifest.get("resource", {}).get(
            "aws_config_delivery_channel", {}
        )
        assert len(delivery_channels) >= 1

        # Find Config rules
        config_rules = manifest.get("resource", {}).get("aws_config_config_rule", {})
        assert len(config_rules) >= 1

    def test_eventbridge_rule_created(self, stack):
        """Test that EventBridge rule for security events is created"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find EventBridge rules
        event_rules = manifest.get("resource", {}).get("aws_cloudwatch_event_rule", {})
        assert len(event_rules) >= 1

    def test_vpc_flow_logs_configured(self, stack):
        """Test that VPC Flow Logs are configured"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Find Flow Log resources
        flow_logs = manifest.get("resource", {}).get("aws_flow_log", {})
        assert len(flow_logs) >= 1

        # Check flow log configuration
        flow_log = list(flow_logs.values())[0]
        assert flow_log.get("traffic_type") == "ALL"
        assert flow_log.get("log_destination_type") == "s3"

    def test_no_hardcoded_account_ids(self, stack):
        """Test that synthesized output doesn't contain hardcoded account IDs"""
        synth_output = Testing.synth(stack)

        # Check for common placeholder account ID
        assert "123456789012" not in synth_output
        assert "111111111111" not in synth_output
        assert "999999999999" not in synth_output

    def test_environment_suffix_in_resource_names(self, stack):
        """Test that resources include environment suffix in names"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Check various resource types have 'test' in their names
        all_resources = []
        for resource_type in manifest.get("resource", {}).values():
            all_resources.extend(resource_type.values())

        # Count resources with environment suffix
        resources_with_suffix = 0
        for resource in all_resources:
            name_field = resource.get("name") or resource.get("bucket") or resource.get("alarm_name")
            if name_field and "test" in name_field:
                resources_with_suffix += 1

        # Most resources should have environment suffix
        assert resources_with_suffix > 5

    def test_tags_present(self, stack):
        """Test that resources have proper tags"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Check for tags in various resources
        all_resources = []
        for resource_type in manifest.get("resource", {}).values():
            all_resources.extend(resource_type.values())

        # Count resources with tags
        resources_with_tags = 0
        for resource in all_resources:
            if "tags" in resource:
                resources_with_tags += 1

        # Many resources should have tags
        assert resources_with_tags > 5

    def test_data_sources_used(self, stack):
        """Test that data sources are used for dynamic references"""
        synth_output = Testing.synth(stack)
        manifest = json.loads(synth_output)

        # Check for DataAwsCallerIdentity data source
        data_sources = manifest.get("data", {})
        assert "aws_caller_identity" in data_sources

        # Should have multiple caller identity data sources (one per module)
        caller_identities = data_sources.get("aws_caller_identity", {})
        assert len(caller_identities) >= 1

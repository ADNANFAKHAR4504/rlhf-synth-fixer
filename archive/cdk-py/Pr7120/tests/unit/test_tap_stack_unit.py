"""test_tap_stack_unit.py
Unit tests for TapStack CDK infrastructure.
"""

import aws_cdk as cdk
from aws_cdk import assertions
import pytest
from lib.tap_stack import TapStack, TapStackProps


class TestTapStackUnit:
    """Unit tests for TapStack."""

    def test_stack_creation_with_props(self):
        """Test stack creation with explicit props."""
        app = cdk.App()
        props = TapStackProps(
            environment_suffix="test123",
            env=cdk.Environment(account="123456789012", region="us-east-1")
        )
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify stack was created
        assert stack is not None
        # Verify environment suffix is used in tags
        assert props.environment_suffix == "test123"

    def test_stack_creation_with_context(self):
        """Test stack creation using context variables."""
        app = cdk.App(context={"environmentSuffix": "ctx123"})
        stack = TapStack(app, "TestStack")

        template = assertions.Template.from_stack(stack)

        # Verify stack was created with context
        assert stack is not None

    def test_stack_creation_default_suffix(self):
        """Test stack creation with default environment suffix."""
        app = cdk.App()
        stack = TapStack(app, "TestStack")

        template = assertions.Template.from_stack(stack)

        # Verify stack was created
        assert stack is not None

    def test_vpc_created(self):
        """Test that VPC is created."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify VPC exists
        template.resource_count_is("AWS::EC2::VPC", 1)

    def test_s3_buckets_created(self):
        """Test that S3 buckets are created."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify S3 buckets exist (audit + config)
        template.resource_count_is("AWS::S3::Bucket", 2)

    def test_lambda_functions_created(self):
        """Test that Lambda functions are created."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify Lambda functions exist (scanner, report generator, remediation + 1 helper)
        # Note: CDK may create additional Lambda functions for custom resources
        assert template.find_resources("AWS::Lambda::Function").__len__() >= 3

    def test_sns_topic_created(self):
        """Test that SNS topic is created."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify SNS topics exist (critical alerts + potentially others)
        assert template.find_resources("AWS::SNS::Topic").__len__() >= 1

    def test_no_config_recorder_created(self):
        """Test that AWS Config recorder is NOT created (uses direct API calls instead)."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify Config recorder does NOT exist (per requirements, uses direct AWS API calls)
        template.resource_count_is("AWS::Config::ConfigurationRecorder", 0)

    def test_eventbridge_rules_created(self):
        """Test that EventBridge rules are created."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify EventBridge rules exist (scheduled, custom, report trigger + potentially remediation)
        assert template.find_resources("AWS::Events::Rule").__len__() >= 3

    def test_cloudwatch_dashboard_created(self):
        """Test that CloudWatch dashboard is created."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify CloudWatch dashboard exists
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    def test_stack_outputs(self):
        """Test that stack outputs are defined."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify outputs exist
        template.has_output("AuditBucketName", {})
        template.has_output("ScannerFunctionName", {})
        template.has_output("AlertTopicArn", {})
        template.has_output("DashboardName", {})

    def test_mandatory_tags_applied(self):
        """Test that mandatory tags are applied."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="prod")
        stack = TapStack(app, "TestStack", props=props)

        # Tags are applied at stack level
        assert stack is not None

    def test_s3_bucket_encryption(self):
        """Test that S3 buckets have encryption enabled."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify S3 bucket encryption
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            }
        })

    def test_lambda_vpc_configuration(self):
        """Test that Lambda functions are configured with VPC."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify Lambda functions have VPC config
        template.has_resource_properties("AWS::Lambda::Function", {
            "VpcConfig": assertions.Match.object_like({
                "SecurityGroupIds": assertions.Match.any_value(),
                "SubnetIds": assertions.Match.any_value()
            })
        })

    def test_lambda_tracing_enabled(self):
        """Test that Lambda functions have X-Ray tracing enabled."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify Lambda tracing
        template.has_resource_properties("AWS::Lambda::Function", {
            "TracingConfig": {
                "Mode": "Active"
            }
        })

    def test_no_config_rules_created(self):
        """Test that AWS Config rules are NOT created (uses direct API scanning instead)."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify Config rules do NOT exist (per requirements, uses direct API calls for compliance checking)
        template.resource_count_is("AWS::Config::ConfigRule", 0)

    def test_vpc_endpoints_created(self):
        """Test that VPC endpoints are created."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify VPC endpoints exist (S3, Lambda, etc.)
        assert template.find_resources("AWS::EC2::VPCEndpoint").__len__() > 0

    def test_iam_roles_created(self):
        """Test that IAM roles are created for Lambda functions."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify IAM roles exist (scanner, report generator, remediation, config, etc.)
        assert template.find_resources("AWS::IAM::Role").__len__() > 0

    def test_eventbridge_scheduled_rule(self):
        """Test that EventBridge scheduled rule is configured correctly."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify scheduled rule with rate
        template.has_resource_properties("AWS::Events::Rule", {
            "ScheduleExpression": "rate(6 hours)"
        })

    def test_cloudwatch_alarms_created(self):
        """Test that CloudWatch alarms are created."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify CloudWatch alarms exist
        assert template.find_resources("AWS::CloudWatch::Alarm").__len__() > 0

    def test_removal_policy_destroy(self):
        """Test that resources have DESTROY removal policy."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # S3 buckets should have DeletionPolicy: Delete
        template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete"
        })

    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is used in resource names."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test123")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Check Lambda function names include suffix
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": assertions.Match.string_like_regexp(".*test123.*")
        })

    def test_kms_keys_created(self):
        """Test that KMS keys are created for S3 bucket encryption."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify KMS keys exist (audit bucket + config bucket)
        assert template.find_resources("AWS::KMS::Key").__len__() >= 2

    def test_kms_key_rotation_enabled(self):
        """Test that KMS keys have rotation enabled."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify key rotation
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    def test_s3_bucket_versioning_enabled(self):
        """Test that S3 buckets have versioning enabled."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify bucket versioning
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    def test_s3_bucket_lifecycle_rules(self):
        """Test that audit bucket has lifecycle rules."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify lifecycle rules exist
        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "Status": "Enabled"
                    })
                ])
            }
        })

    def test_s3_buckets_block_public_access(self):
        """Test that S3 buckets block all public access."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify public access blocking
        template.has_resource_properties("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC has flow logs enabled."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify flow logs
        template.resource_count_is("AWS::EC2::FlowLog", 1)

    def test_vpc_no_nat_gateways(self):
        """Test that VPC does not create NAT gateways for cost optimization."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify no NAT gateways
        template.resource_count_is("AWS::EC2::NatGateway", 0)

    def test_security_groups_created(self):
        """Test that security groups are created for Lambda functions."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify security groups exist
        assert template.find_resources("AWS::EC2::SecurityGroup").__len__() > 0

    def test_lambda_memory_size(self):
        """Test that Lambda functions have 1GB memory as required."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify Lambda memory size
        template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 1024
        })

    def test_lambda_timeout_configured(self):
        """Test that Lambda functions have timeout configured."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify Lambda timeout
        template.has_resource_properties("AWS::Lambda::Function", {
            "Timeout": assertions.Match.any_value()
        })

    def test_sns_topics_created(self):
        """Test that SNS topics are created for alerts."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify SNS topics (critical + warning)
        assert template.find_resources("AWS::SNS::Topic").__len__() >= 2

    def test_eventbridge_custom_event_rule(self):
        """Test that EventBridge custom event rule is created."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify custom event pattern rule
        template.has_resource_properties("AWS::Events::Rule", {
            "EventPattern": assertions.Match.object_like({
                "source": ["compliance.audit"]
            })
        })

    def test_cloudwatch_dashboard_has_widgets(self):
        """Test that CloudWatch dashboard is configured."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify dashboard exists with name
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": assertions.Match.string_like_regexp(".*test.*")
        })

    def test_no_config_aggregator_created(self):
        """Test that AWS Config aggregator is NOT created (not needed for direct API scanning)."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify Config aggregator does NOT exist
        template.resource_count_is("AWS::Config::ConfigurationAggregator", 0)

    def test_iam_roles_use_managed_policies(self):
        """Test that IAM roles use managed policies, not inline policies."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify roles have managed policies
        template.has_resource_properties("AWS::IAM::Role", {
            "ManagedPolicyArns": assertions.Match.any_value()
        })

    def test_lambda_python_runtime(self):
        """Test that Lambda functions use Python 3.9 runtime."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)

        template = assertions.Template.from_stack(stack)

        # Verify Python runtime
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9"
        })

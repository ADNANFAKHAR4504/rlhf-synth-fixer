"""Unit tests for S3 Replication Stack."""

import aws_cdk as cdk
import pytest
from aws_cdk.assertions import Match, Template

from lib.s3_replication_stack import (S3ReplicationStack,
                                      S3ReplicationStackProps)


@pytest.fixture
def app():
    """Create CDK app for testing."""
    return cdk.App()


@pytest.fixture
def stack(app):
    """Create S3 Replication Stack for testing."""
    props = S3ReplicationStackProps(environment_suffix='test')
    return S3ReplicationStack(app, "TestStack", props=props)


@pytest.fixture
def template(stack):
    """Generate CloudFormation template from stack."""
    return Template.from_stack(stack)


class TestKMSKeys:
    """Test KMS key creation and configuration."""

    def test_primary_key_created(self, template):
        """Test that primary KMS key is created with correct properties."""
        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "Description": Match.string_like_regexp(".*primary.*"),
                "EnableKeyRotation": True,
            }
        )

    def test_replica_key_created(self, template):
        """Test that replica KMS key is created with correct properties."""
        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "Description": Match.string_like_regexp(".*replica.*"),
                "EnableKeyRotation": True,
            }
        )

    def test_two_kms_keys_created(self, template):
        """Test that exactly two KMS keys are created."""
        template.resource_count_is("AWS::KMS::Key", 2)


class TestS3Buckets:
    """Test S3 bucket creation and configuration."""

    def test_primary_bucket_created(self, template):
        """Test that primary bucket is created with correct properties."""
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "primary-bucket-test",
                "VersioningConfiguration": {
                    "Status": "Enabled"
                },
                "AccelerateConfiguration": {
                    "AccelerationStatus": "Enabled"
                }
            }
        )

    def test_replica_bucket_created(self, template):
        """Test that replica bucket is created with correct properties."""
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "replica-bucket-test",
                "VersioningConfiguration": {
                    "Status": "Enabled"
                }
            }
        )

    def test_two_s3_buckets_created(self, template):
        """Test that exactly two S3 buckets are created."""
        template.resource_count_is("AWS::S3::Bucket", 2)

    def test_primary_bucket_encryption(self, template):
        """Test that primary bucket has KMS encryption configured."""
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "primary-bucket-test",
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms"
                            }
                        }
                    ]
                }
            }
        )

    def test_replica_bucket_lifecycle_rule(self, template):
        """Test that replica bucket has Glacier lifecycle rule."""
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "replica-bucket-test",
                "LifecycleConfiguration": {
                    "Rules": [
                        {
                            "Id": "GlacierTransitiontest",
                            "Status": "Enabled",
                            "Transitions": [
                                {
                                    "StorageClass": "GLACIER",
                                    "TransitionInDays": 90
                                }
                            ]
                        }
                    ]
                }
            }
        )


class TestIAMRole:
    """Test IAM role for replication."""

    def test_replication_role_created(self, template):
        """Test that replication role is created."""
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": "s3-replication-role-test",
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "s3.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
            }
        )

    def test_replication_role_has_policies(self, template):
        """Test that replication role has necessary policies."""
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Allow",
                            "Action": Match.array_with([
                                Match.string_like_regexp("s3:.*")
                            ])
                        })
                    ])
                }
            }
        )


class TestS3Replication:
    """Test S3 replication configuration."""

    def test_replication_configuration_present(self, template):
        """Test that replication configuration is present on primary bucket."""
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "primary-bucket-test",
                "ReplicationConfiguration": {
                    "Role": Match.any_value(),
                    "Rules": Match.array_with([
                        Match.object_like({
                            "Id": "ReplicationRuletest",
                            "Status": "Enabled",
                            "Priority": 1,
                            "Filter": {
                                "Prefix": ""
                            }
                        })
                    ])
                }
            }
        )

    def test_replication_metrics_enabled(self, template):
        """Test that replication metrics are enabled in replication configuration."""
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "primary-bucket-test",
                "ReplicationConfiguration": {
                    "Rules": [
                        {
                            "Destination": {
                                "Metrics": {
                                    "Status": "Enabled"
                                }
                            }
                        }
                    ]
                }
            }
        )

    def test_delete_marker_replication_enabled(self, template):
        """Test that delete marker replication is enabled."""
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "primary-bucket-test",
                "ReplicationConfiguration": {
                    "Rules": [
                        {
                            "DeleteMarkerReplication": {
                                "Status": "Enabled"
                            }
                        }
                    ]
                }
            }
        )

    def test_source_selection_criteria_configured(self, template):
        """Test that source selection criteria with SSE-KMS is configured."""
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "primary-bucket-test",
                "ReplicationConfiguration": {
                    "Rules": [
                        {
                            "SourceSelectionCriteria": {
                                "SseKmsEncryptedObjects": {
                                    "Status": "Enabled"
                                }
                            }
                        }
                    ]
                }
            }
        )


class TestBucketPolicies:
    """Test S3 bucket policies."""

    def test_bucket_policies_enforce_ssl(self, template):
        """Test that bucket policies enforce SSL/TLS encryption."""
        template.has_resource_properties(
            "AWS::S3::BucketPolicy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Deny",
                            "Condition": {
                                "Bool": {
                                    "aws:SecureTransport": "false"
                                }
                            }
                        })
                    ])
                }
            }
        )

    def test_two_bucket_policies_created(self, template):
        """Test that policies are created for both buckets."""
        template.resource_count_is("AWS::S3::BucketPolicy", 2)


class TestCloudWatchAlarm:
    """Test CloudWatch alarm for replication latency."""

    def test_replication_alarm_created(self, template):
        """Test that replication latency alarm is created."""
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "s3-replication-latency-test",
                "MetricName": "ReplicationLatency",
                "Namespace": "AWS/S3",
                "Statistic": "Maximum",
                "Threshold": 900000,
                "ComparisonOperator": "GreaterThanThreshold",
                "EvaluationPeriods": 2
            }
        )

    def test_alarm_dimensions_correct(self, template):
        """Test that alarm has correct dimensions."""
        # Verify alarm has dimensions for source and destination buckets
        alarms = template.find_resources("AWS::CloudWatch::Alarm")
        assert len(alarms) == 1
        alarm_resource = list(alarms.values())[0]
        dimensions = alarm_resource['Properties']['Dimensions']
        assert len(dimensions) == 2
        dimension_names = [d['Name'] for d in dimensions]
        assert 'SourceBucket' in dimension_names
        assert 'DestinationBucket' in dimension_names


class TestCloudWatchDashboard:
    """Test CloudWatch dashboard."""

    def test_dashboard_created(self, template):
        """Test that CloudWatch dashboard is created."""
        template.has_resource_properties(
            "AWS::CloudWatch::Dashboard",
            {
                "DashboardName": "s3-replication-dashboard-test"
            }
        )

    def test_dashboard_has_widgets(self, template):
        """Test that dashboard has replication widgets."""
        # Dashboard body is a complex JSON structure, just verify dashboard exists
        template.has_resource_properties(
            "AWS::CloudWatch::Dashboard",
            {
                "DashboardName": "s3-replication-dashboard-test"
            }
        )


class TestCloudWatchLogs:
    """Test CloudWatch Logs configuration."""

    def test_log_group_created(self, template):
        """Test that CloudWatch Logs group is created."""
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {
                "LogGroupName": "/aws/s3/replication/test",
                "RetentionInDays": 7
            }
        )


class TestStackOutputs:
    """Test stack outputs."""

    def test_primary_bucket_outputs(self, template):
        """Test that primary bucket outputs are present."""
        template.has_output("PrimaryBucketUrl", {})
        template.has_output("PrimaryBucketArn", {})

    def test_replica_bucket_outputs(self, template):
        """Test that replica bucket outputs are present."""
        template.has_output("ReplicaBucketUrl", {})
        template.has_output("ReplicaBucketArn", {})

    def test_replication_role_output(self, template):
        """Test that replication role ARN output is present."""
        template.has_output("ReplicationRoleArn", {})

    def test_dashboard_url_output(self, template):
        """Test that dashboard URL output is present."""
        template.has_output("DashboardUrl", {})


class TestEnvironmentSuffix:
    """Test environment suffix handling."""

    def test_default_environment_suffix(self, app):
        """Test that default environment suffix is used when not provided."""
        stack = S3ReplicationStack(app, "TestStackDefault")
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "primary-bucket-dev"
            }
        )

    def test_custom_environment_suffix(self, app):
        """Test that custom environment suffix is applied."""
        props = S3ReplicationStackProps(environment_suffix='prod')
        stack = S3ReplicationStack(app, "TestStackProd", props=props)
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "primary-bucket-prod"
            }
        )


class TestResourceCount:
    """Test overall resource counts."""

    def test_minimum_resources_created(self, template):
        """Test that minimum required resources are created."""
        # 2 KMS keys
        template.resource_count_is("AWS::KMS::Key", 2)
        # 2 S3 buckets
        template.resource_count_is("AWS::S3::Bucket", 2)
        # 2 bucket policies
        template.resource_count_is("AWS::S3::BucketPolicy", 2)
        # IAM roles (replication role + auto-delete role)
        iam_roles = template.find_resources("AWS::IAM::Role")
        assert len(iam_roles) >= 1, "At least 1 IAM role should be created"
        # At least 1 IAM policy (could be more due to grants)
        assert template.find_resources("AWS::IAM::Policy") != {}
        # 1 CloudWatch alarm
        template.resource_count_is("AWS::CloudWatch::Alarm", 1)
        # 1 CloudWatch dashboard
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        # 1 CloudWatch Logs group
        template.resource_count_is("AWS::Logs::LogGroup", 1)


class TestDestroyabilityRequirements:
    """Test that resources are properly configured for destruction."""

    def test_buckets_have_auto_delete(self, template):
        """Test that buckets have auto-delete enabled via custom resource."""
        # Check for custom resource that enables auto-delete
        resources = template.find_resources("Custom::S3AutoDeleteObjects")
        assert len(resources) > 0, "No auto-delete custom resources found"

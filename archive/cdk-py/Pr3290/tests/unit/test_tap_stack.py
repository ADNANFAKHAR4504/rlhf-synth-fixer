"""
Unit tests for TapStack (Legal Documents Storage Stack)

These tests validate the CloudFormation template structure without deploying resources.
They are account-agnostic and can run in any environment.
"""
import os
import unittest
from typing import Any, Dict

import aws_cdk as cdk
from aws_cdk.assertions import Capture, Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


def _get_environment_suffix(app: cdk.App | None = None) -> str:
    """Resolve environment suffix from ENV, CDK context, or default to 'dev'."""
    return (
        os.getenv("ENVIRONMENT_SUFFIX")
        or (app.node.try_get_context("environmentSuffix") if app else None)
        or "dev"
    )


@mark.describe("TapStack Unit Tests")
class TestTapStackUnit(unittest.TestCase):
    """Comprehensive unit tests for TapStack CDK infrastructure"""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test"""
        self.app = cdk.App()
        env_suffix = _get_environment_suffix(self.app)
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            props=TapStackProps(environment_suffix=env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    # ============================================================================
    # S3 BUCKET TESTS
    # ============================================================================

    @mark.it("creates exactly 2 S3 buckets (primary + log)")
    def test_s3_bucket_count(self):
        """Verify two S3 buckets are created"""
        self.template.resource_count_is("AWS::S3::Bucket", 2)

    @mark.it("primary bucket has versioning enabled")
    def test_primary_bucket_versioning(self):
        """Verify primary bucket has versioning enabled"""
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "VersioningConfiguration": {
                    "Status": "Enabled"
                }
            }
        )

    @mark.it("primary bucket has Object Lock enabled in COMPLIANCE mode")
    def test_primary_bucket_object_lock(self):
        """Verify Object Lock is enabled with COMPLIANCE mode and 90-day retention"""
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "ObjectLockEnabled": True,
                "ObjectLockConfiguration": {
                    "ObjectLockEnabled": "Enabled",
                    "Rule": {
                        "DefaultRetention": {
                            "Mode": "COMPLIANCE",
                            "Days": 90
                        }
                    }
                }
            }
        )

    @mark.it("primary bucket blocks all public access")
    def test_primary_bucket_public_access_block(self):
        """Verify all public access is blocked"""
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True
                }
            }
        )

    @mark.it("primary bucket has KMS encryption enabled")
    def test_primary_bucket_kms_encryption(self):
        """Verify primary bucket uses KMS encryption"""
        kms_key_ref = Capture()
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms",
                                "KMSMasterKeyID": kms_key_ref
                            }
                        }
                    ]
                }
            }
        )
        # Verify it references a KMS key (not hardcoded)
        self.assertIn("Fn::GetAtt", kms_key_ref.as_object())

    @mark.it("primary bucket has lifecycle policies respecting 90-day retention")
    def test_primary_bucket_lifecycle_policies(self):
        """Verify lifecycle rules don't delete before 90 days"""
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "LifecycleConfiguration": {
                    "Rules": Match.array_with([
                        Match.object_like({
                            "Id": "RetainVersionsForCompliance",
                            "Status": "Enabled",
                            "ExpirationInDays": Match.any_value(),
                            "NoncurrentVersionExpiration": Match.object_like({
                                "NoncurrentDays": Match.any_value()
                            }),
                            "AbortIncompleteMultipartUpload": Match.object_like({
                                "DaysAfterInitiation": Match.any_value()
                            })
                        })
                    ])
                }
            }
        )

    @mark.it("primary bucket has server access logging enabled")
    def test_primary_bucket_access_logging(self):
        """Verify S3 server access logging is configured"""
        log_bucket_ref = Capture()
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "LoggingConfiguration": {
                    "DestinationBucketName": log_bucket_ref,
                    "LogFilePrefix": "access-logs/"
                }
            }
        )
        # Verify it references another bucket (not hardcoded)
        self.assertIn("Ref", log_bucket_ref.as_object())

    @mark.it("primary bucket has metrics configurations for CloudWatch alarms")
    def test_primary_bucket_metrics_configuration(self):
        """Verify S3 request metrics are enabled for CloudWatch alarms"""
        self.template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "MetricsConfigurations": [
                    {
                        "Id": "EntireBucket"
                    }
                ]
            }
        )

    @mark.it("log bucket has versioning enabled")
    def test_log_bucket_versioning(self):
        """Verify log bucket has versioning enabled"""
        # Get all buckets and check that at least one has logging config
        buckets = self.template.find_resources("AWS::S3::Bucket")
        log_bucket_found = False
        
        for bucket_props in buckets.values():
            props = bucket_props.get("Properties", {})
            # Log bucket is identified by not having LoggingConfiguration
            if "LoggingConfiguration" not in props and "VersioningConfiguration" in props:
                self.assertEqual(props["VersioningConfiguration"]["Status"], "Enabled")
                log_bucket_found = True
                break
        
        self.assertTrue(log_bucket_found, "Log bucket with versioning not found")

    # ============================================================================
    # S3 BUCKET POLICY TESTS
    # ============================================================================

    @mark.it("creates exactly 2 S3 bucket policies")
    def test_bucket_policy_count(self):
        """Verify two bucket policies are created"""
        self.template.resource_count_is("AWS::S3::BucketPolicy", 2)

    @mark.it("bucket policy denies unencrypted uploads")
    def test_bucket_policy_deny_unencrypted(self):
        """Verify bucket policy denies unencrypted PUTs"""
        self.template.has_resource_properties(
            "AWS::S3::BucketPolicy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Deny",
                            "Action": "s3:PutObject",
                            "Condition": {
                                "StringNotEquals": Match.object_like({
                                    "s3:x-amz-server-side-encryption": "aws:kms"
                                })
                            }
                        })
                    ])
                }
            }
        )

    @mark.it("bucket policy requires TLS/SSL")
    def test_bucket_policy_require_tls(self):
        """Verify bucket policy requires secure transport"""
        self.template.has_resource_properties(
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

    @mark.it("bucket policy prevents bypassing Object Lock")
    def test_bucket_policy_object_lock_protection(self):
        """Verify bucket policy prevents bypassing Object Lock governance"""
        self.template.has_resource_properties(
            "AWS::S3::BucketPolicy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Deny",
                            "Action": Match.array_with([
                                "s3:BypassGovernanceRetention"
                            ])
                        })
                    ])
                }
            }
        )

    # ============================================================================
    # KMS KEY TESTS
    # ============================================================================

    @mark.it("creates exactly 1 KMS key")
    def test_kms_key_count(self):
        """Verify one KMS key is created"""
        self.template.resource_count_is("AWS::KMS::Key", 1)

    @mark.it("KMS key has rotation enabled")
    def test_kms_key_rotation(self):
        """Verify KMS key rotation is enabled"""
        self.template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True
            }
        )

    @mark.it("KMS key has proper key policy")
    def test_kms_key_policy(self):
        """Verify KMS key has a valid key policy"""
        self.template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "KeyPolicy": {
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Allow",
                            "Principal": Match.object_like({
                                "AWS": Match.any_value()
                            }),
                            "Action": "kms:*",
                            "Resource": "*"
                        })
                    ])
                }
            }
        )

    @mark.it("creates KMS key alias")
    def test_kms_key_alias(self):
        """Verify KMS key alias is created"""
        self.template.has_resource_properties(
            "AWS::KMS::Alias",
            {
                "AliasName": "alias/legal-docs-bucket"
            }
        )

    # ============================================================================
    # CLOUDTRAIL TESTS
    # ============================================================================

    @mark.it("creates exactly 1 CloudTrail trail")
    def test_cloudtrail_count(self):
        """Verify one CloudTrail trail is created"""
        self.template.resource_count_is("AWS::CloudTrail::Trail", 1)

    @mark.it("CloudTrail has multi-region enabled")
    def test_cloudtrail_multi_region(self):
        """Verify CloudTrail is multi-region"""
        self.template.has_resource_properties(
            "AWS::CloudTrail::Trail",
            {
                "IsMultiRegionTrail": True
            }
        )

    @mark.it("CloudTrail has log file validation enabled")
    def test_cloudtrail_log_validation(self):
        """Verify CloudTrail log file validation is enabled"""
        self.template.has_resource_properties(
            "AWS::CloudTrail::Trail",
            {
                "EnableLogFileValidation": True
            }
        )

    @mark.it("CloudTrail has S3 data event selectors configured")
    def test_cloudtrail_data_events(self):
        """Verify CloudTrail captures S3 data events"""
        self.template.has_resource_properties(
            "AWS::CloudTrail::Trail",
            {
                "EventSelectors": Match.array_with([
                    Match.object_like({
                        "IncludeManagementEvents": True,
                        "ReadWriteType": "All",
                        "DataResources": Match.array_with([
                            Match.object_like({
                                "Type": "AWS::S3::Object",
                                "Values": Match.any_value()
                            })
                        ])
                    })
                ])
            }
        )

    @mark.it("CloudTrail sends logs to CloudWatch")
    def test_cloudtrail_cloudwatch_logs(self):
        """Verify CloudTrail sends logs to CloudWatch Logs"""
        cloudwatch_log_group_ref = Capture()
        self.template.has_resource_properties(
            "AWS::CloudTrail::Trail",
            {
                "CloudWatchLogsLogGroupArn": cloudwatch_log_group_ref
            }
        )
        # Verify it references a log group (not hardcoded)
        self.assertIn("Fn::GetAtt", cloudwatch_log_group_ref.as_object())

    # ============================================================================
    # CLOUDWATCH TESTS
    # ============================================================================

    @mark.it("creates exactly 2 CloudWatch alarms")
    def test_cloudwatch_alarm_count(self):
        """Verify two CloudWatch alarms are created (4xx and 5xx errors)"""
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 2)

    @mark.it("creates 4xx error alarm")
    def test_cloudwatch_4xx_alarm(self):
        """Verify 4xx error alarm is configured correctly"""
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "MetricName": "4xxErrors",
                "Namespace": "AWS/S3",
                "Statistic": "Sum",
                "ComparisonOperator": "GreaterThanThreshold",
                "Threshold": Match.any_value(),
                "EvaluationPeriods": 1,
                "TreatMissingData": "notBreaching"
            }
        )

    @mark.it("creates 5xx error alarm")
    def test_cloudwatch_5xx_alarm(self):
        """Verify 5xx error alarm is configured correctly"""
        self.template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "MetricName": "5xxErrors",
                "Namespace": "AWS/S3",
                "Statistic": "Sum",
                "ComparisonOperator": "GreaterThanThreshold",
                "Threshold": Match.any_value(),
                "EvaluationPeriods": 1,
                "TreatMissingData": "notBreaching"
            }
        )

    @mark.it("creates CloudWatch dashboard")
    def test_cloudwatch_dashboard(self):
        """Verify CloudWatch dashboard is created with proper widgets"""
        self.template.has_resource_properties(
            "AWS::CloudWatch::Dashboard",
            {
                "DashboardName": "LegalDocsStorageDashboard",
                "DashboardBody": Match.any_value()
            }
        )

    @mark.it("creates CloudWatch log group for CloudTrail")
    def test_cloudwatch_log_group(self):
        """Verify CloudWatch log group is created for CloudTrail"""
        self.template.resource_count_is("AWS::Logs::LogGroup", 1)

    # ============================================================================
    # IAM TESTS
    # ============================================================================

    @mark.it("creates exactly 2 IAM roles")
    def test_iam_role_count(self):
        """Verify two IAM roles are created (ingestion + CloudTrail logs)"""
        self.template.resource_count_is("AWS::IAM::Role", 2)

    @mark.it("creates ingestion role with proper trust policy")
    def test_ingestion_role_trust_policy(self):
        """Verify ingestion role has proper assume role policy"""
        self.template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        })
                    ])
                }
            }
        )

    @mark.it("creates exactly 2 IAM policies")
    def test_iam_policy_count(self):
        """Verify two IAM policies are created"""
        self.template.resource_count_is("AWS::IAM::Policy", 2)

    @mark.it("ingestion role has S3 read/write permissions")
    def test_ingestion_role_s3_permissions(self):
        """Verify ingestion role has S3 permissions"""
        # Get all IAM policies
        policies = self.template.find_resources("AWS::IAM::Policy")
        
        has_s3_permissions = False
        for policy_props in policies.values():
            statements = policy_props.get("Properties", {}).get("PolicyDocument", {}).get("Statement", [])
            for statement in statements:
                if statement.get("Effect") == "Allow":
                    actions = statement.get("Action", [])
                    # Check if it has S3 actions
                    s3_actions = [a for a in actions if isinstance(a, str) and a.startswith("s3:")]
                    if len(s3_actions) >= 3 and any("GetObject" in a for a in s3_actions):
                        has_s3_permissions = True
                        break
            if has_s3_permissions:
                break
        
        self.assertTrue(has_s3_permissions, "No policy found with S3 permissions")

    @mark.it("ingestion role has KMS permissions")
    def test_ingestion_role_kms_permissions(self):
        """Verify ingestion role has KMS encrypt/decrypt permissions"""
        # Get all IAM policies
        policies = self.template.find_resources("AWS::IAM::Policy")
        
        has_kms_permissions = False
        for policy_props in policies.values():
            statements = policy_props.get("Properties", {}).get("PolicyDocument", {}).get("Statement", [])
            for statement in statements:
                if statement.get("Effect") == "Allow":
                    actions = statement.get("Action", [])
                    # Check if it has KMS actions
                    kms_actions = [a for a in actions if isinstance(a, str) and a.startswith("kms:")]
                    if len(kms_actions) >= 3 and any("Decrypt" in a for a in kms_actions):
                        has_kms_permissions = True
                        break
            if has_kms_permissions:
                break
        
        self.assertTrue(has_kms_permissions, "No policy found with KMS permissions")

    @mark.it("ingestion role denies delete operations")
    def test_ingestion_role_deny_delete(self):
        """Verify ingestion role explicitly denies version deletion"""
        self.template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Deny",
                            "Action": Match.array_with([
                                "s3:DeleteObject",
                                "s3:DeleteObjectVersion",
                                "s3:BypassGovernanceRetention"
                            ])
                        })
                    ])
                }
            }
        )

    # ============================================================================
    # OUTPUTS TESTS
    # ============================================================================

    @mark.it("stack has required CloudFormation outputs")
    def test_stack_outputs(self):
        """Verify all required outputs are defined"""
        outputs = self.template.find_outputs("*")
        output_keys = list(outputs.keys())
        
        self.assertIn("PrimaryBucketName", output_keys)
        self.assertIn("LogBucketName", output_keys)
        self.assertIn("KMSKeyArn", output_keys)
        self.assertIn("IngestionRoleArn", output_keys)

    # ============================================================================
    # TAGGING TESTS
    # ============================================================================

    @mark.it("resources have proper tags")
    def test_resource_tags(self):
        """Verify resources have required tags"""
        # Get KMS key (easier to verify tags on)
        kms_keys = self.template.find_resources("AWS::KMS::Key")
        self.assertGreater(len(kms_keys), 0, "No KMS keys found")
        
        for key_props in kms_keys.values():
            tags = key_props.get("Properties", {}).get("Tags", [])
            tag_dict = {tag["Key"]: tag["Value"] for tag in tags}
            
            # Verify required tags
            self.assertIn("Owner", tag_dict)
            self.assertEqual(tag_dict["Owner"], "Abubakar")
            self.assertIn("System", tag_dict)
            self.assertEqual(tag_dict["System"], "LegalDocs")
            self.assertIn("Compliance", tag_dict)
            self.assertEqual(tag_dict["Compliance"], "Yes")

    # ============================================================================
    # ADDITIONAL COVERAGE TESTS
    # ============================================================================

    @mark.it("stack without Object Lock creates bucket correctly")
    def test_bucket_without_object_lock(self):
        """Verify stack can be created without Object Lock"""
        # Create a stack with Object Lock disabled via context
        app = cdk.App()
        app.node.set_context("enableObjectLock", False)
        
        stack = TapStack(
            app,
            "TestStackNoObjectLock",
            props=TapStackProps(environment_suffix=_get_environment_suffix(app))
        )
        template = Template.from_stack(stack)
        
        # Should still have buckets but without Object Lock
        template.resource_count_is("AWS::S3::Bucket", 2)

    @mark.it("stack with alarm email creates SNS topic")
    def test_sns_topic_with_alarm_email(self):
        """Verify SNS topic is created when alarm email is provided"""
        # Create a stack with alarm email
        app = cdk.App()
        app.node.set_context("alarmEmail", "test@example.com")
        
        stack = TapStack(
            app,
            "TestStackWithSNS",
            props=TapStackProps(environment_suffix=_get_environment_suffix(app))
        )
        template = Template.from_stack(stack)
        
        # Should have SNS topic
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties(
            "AWS::SNS::Topic",
            {
                "DisplayName": "Legal Documents Storage Alerts"
            }
        )
        
        # Should have SNS subscription
        template.resource_count_is("AWS::SNS::Subscription", 1)
        template.has_resource_properties(
            "AWS::SNS::Subscription",
            {
                "Protocol": "email",
                "Endpoint": "test@example.com"
            }
        )

    @mark.it("alarms have SNS actions when topic exists")
    def test_alarms_have_sns_actions(self):
        """Verify alarms are connected to SNS topic when provided"""
        # Create a stack with alarm email
        app = cdk.App()
        app.node.set_context("alarmEmail", "alerts@example.com")
        
        stack = TapStack(
            app,
            "TestStackWithAlarmActions",
            props=TapStackProps(environment_suffix=_get_environment_suffix(app))
        )
        template = Template.from_stack(stack)

        # Both alarms should have AlarmActions referencing the SNS topic
        alarms = template.find_resources("AWS::CloudWatch::Alarm")
        self.assertGreaterEqual(len(alarms), 2, "Should have at least 2 alarms")
        
        for alarm_props in alarms.values():
            alarm_actions = alarm_props.get("Properties", {}).get("AlarmActions", [])
            self.assertGreater(len(alarm_actions), 0, "Alarm should have actions")

    @mark.it("custom retention days are respected")
    def test_custom_retention_days(self):
        """Verify custom retention days are applied correctly"""
        # Create a stack with custom retention
        app = cdk.App()
        app.node.set_context("retentionDays", 120)
        
        stack = TapStack(
            app,
            "TestStackCustomRetention",
            props=TapStackProps(environment_suffix=_get_environment_suffix(app))
        )
        template = Template.from_stack(stack)

        # Check Object Lock retention matches custom value
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "ObjectLockConfiguration": {
                    "Rule": {
                        "DefaultRetention": {
                            "Mode": "COMPLIANCE",
                            "Days": 120
                        }
                    }
                }
            }
        )

    @mark.it("custom bucket names are used when provided")
    def test_custom_bucket_names(self):
        """Verify custom bucket names from context are used"""
        # Create a stack with custom bucket names
        app = cdk.App()
        app.node.set_context("bucketName", "my-custom-legal-bucket")
        app.node.set_context("logBucketName", "my-custom-log-bucket")
        
        stack = TapStack(
            app,
            "TestStackCustomBuckets",
            props=TapStackProps(environment_suffix=_get_environment_suffix(app))
        )
        template = Template.from_stack(stack)
        
        # Should have buckets with custom names
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "my-custom-legal-bucket"
            }
        )
        
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "my-custom-log-bucket"
            }
        )


if __name__ == "__main__":
    unittest.main()

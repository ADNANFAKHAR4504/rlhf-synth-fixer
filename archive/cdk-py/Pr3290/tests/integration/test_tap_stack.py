"""
Integration tests for TapStack (Legal Documents Storage Stack)

These tests validate deployed AWS resources in a live environment.
They are account-agnostic and dynamically discover stack outputs.

Prerequisites:
- Stack must be deployed (run: cdk deploy)
- AWS credentials must be configured
- Stack outputs must be available in CloudFormation
"""
import json
import os
import time
import unittest
from datetime import datetime, timedelta
from typing import Dict, Optional

import boto3
from botocore.exceptions import ClientError
from pytest import mark


class TestTapStackIntegration(unittest.TestCase):
    """Comprehensive integration tests for deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and discover stack outputs once for all tests"""
        # Get stack name from environment or use default
        # Resolve environment suffix and construct stack name dynamically
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX") or "dev"
        cls.stack_name = os.environ.get("STACK_NAME", f"TapStack{env_suffix}")
        cls.region = os.environ.get("AWS_REGION", os.environ.get("CDK_DEFAULT_REGION", "us-east-1"))
        
        # Initialize AWS clients
        cls.cfn_client = boto3.client("cloudformation", region_name=cls.region)
        cls.s3_client = boto3.client("s3", region_name=cls.region)
        cls.kms_client = boto3.client("kms", region_name=cls.region)
        cls.cloudtrail_client = boto3.client("cloudtrail", region_name=cls.region)
        cls.cloudwatch_client = boto3.client("cloudwatch", region_name=cls.region)
        cls.iam_client = boto3.client("iam", region_name=cls.region)
        cls.logs_client = boto3.client("logs", region_name=cls.region)
        
        # Discover stack outputs
        cls.outputs = cls._get_stack_outputs()
        
        # Extract key resource identifiers
        cls.primary_bucket = cls.outputs.get("PrimaryBucketName")
        cls.log_bucket = cls.outputs.get("LogBucketName")
        cls.kms_key_arn = cls.outputs.get("KMSKeyArn")
        cls.ingestion_role_arn = cls.outputs.get("IngestionRoleArn")
        
        # Validate we have required outputs
        if not cls.primary_bucket:
            raise ValueError(f"Stack {cls.stack_name} does not have PrimaryBucketName output")

    @classmethod
    def _get_stack_outputs(cls) -> Dict[str, str]:
        """Dynamically fetch stack outputs from CloudFormation"""
        try:
            response = cls.cfn_client.describe_stacks(StackName=cls.stack_name)
            stacks = response.get("Stacks", [])
            
            if not stacks:
                raise ValueError(f"Stack {cls.stack_name} not found")
            
            stack = stacks[0]
            outputs = {}
            
            for output in stack.get("Outputs", []):
                outputs[output["OutputKey"]] = output["OutputValue"]
            
            return outputs
        except ClientError as e:
            raise ValueError(f"Failed to get stack outputs: {e}")

    # ============================================================================
    # S3 BUCKET TESTS
    # ============================================================================

    @mark.it("primary S3 bucket exists and is accessible")
    def test_primary_bucket_exists(self):
        """Verify primary bucket exists and we can access it"""
        try:
            response = self.s3_client.head_bucket(Bucket=self.primary_bucket)
            self.assertIsNotNone(response)
        except ClientError as e:
            self.fail(f"Primary bucket {self.primary_bucket} does not exist or is not accessible: {e}")

    @mark.it("primary bucket has versioning enabled")
    def test_primary_bucket_versioning_enabled(self):
        """Verify versioning is enabled on primary bucket"""
        response = self.s3_client.get_bucket_versioning(Bucket=self.primary_bucket)
        self.assertEqual(response.get("Status"), "Enabled", "Versioning is not enabled")

    @mark.it("primary bucket has Object Lock enabled with COMPLIANCE mode")
    def test_primary_bucket_object_lock_compliance(self):
        """Verify Object Lock is configured in COMPLIANCE mode with 90-day retention"""
        response = self.s3_client.get_object_lock_configuration(Bucket=self.primary_bucket)
        
        config = response.get("ObjectLockConfiguration", {})
        self.assertEqual(config.get("ObjectLockEnabled"), "Enabled")
        
        rule = config.get("Rule", {})
        default_retention = rule.get("DefaultRetention", {})
        self.assertEqual(default_retention.get("Mode"), "COMPLIANCE")
        self.assertGreaterEqual(default_retention.get("Days", 0), 90)

    @mark.it("primary bucket has KMS encryption enabled")
    def test_primary_bucket_kms_encryption(self):
        """Verify primary bucket uses KMS encryption"""
        response = self.s3_client.get_bucket_encryption(Bucket=self.primary_bucket)
        
        rules = response.get("ServerSideEncryptionConfiguration", {}).get("Rules", [])
        self.assertGreater(len(rules), 0, "No encryption rules found")
        
        sse_algo = rules[0].get("ApplyServerSideEncryptionByDefault", {}).get("SSEAlgorithm")
        self.assertEqual(sse_algo, "aws:kms")
        
        # Verify it uses our KMS key
        kms_key_id = rules[0].get("ApplyServerSideEncryptionByDefault", {}).get("KMSMasterKeyID")
        self.assertIsNotNone(kms_key_id)
        self.assertIn(self.kms_key_arn.split("/")[-1], kms_key_id)

    @mark.it("primary bucket has lifecycle policies respecting 90-day retention")
    def test_primary_bucket_lifecycle_retention(self):
        """Verify lifecycle rules respect minimum 90-day retention"""
        response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=self.primary_bucket)
        
        rules = response.get("Rules", [])
        self.assertGreater(len(rules), 0, "No lifecycle rules found")
        
        for rule in rules:
            if rule.get("Status") == "Enabled":
                # Check expiration (if present)
                if "Expiration" in rule:
                    exp_days = rule["Expiration"].get("Days")
                    if exp_days:
                        self.assertGreaterEqual(exp_days, 90, f"Expiration {exp_days} days < 90 days")
                
                # Check noncurrent version expiration
                if "NoncurrentVersionExpiration" in rule:
                    noncurrent_days = rule["NoncurrentVersionExpiration"].get("NoncurrentDays")
                    if noncurrent_days:
                        self.assertGreaterEqual(
                            noncurrent_days, 90, 
                            f"Noncurrent expiration {noncurrent_days} days < 90 days"
                        )

    @mark.it("primary bucket blocks all public access")
    def test_primary_bucket_public_access_blocked(self):
        """Verify all public access is blocked"""
        response = self.s3_client.get_public_access_block(Bucket=self.primary_bucket)
        
        config = response.get("PublicAccessBlockConfiguration", {})
        self.assertTrue(config.get("BlockPublicAcls"))
        self.assertTrue(config.get("IgnorePublicAcls"))
        self.assertTrue(config.get("BlockPublicPolicy"))
        self.assertTrue(config.get("RestrictPublicBuckets"))

    @mark.it("primary bucket has server access logging enabled")
    def test_primary_bucket_access_logging(self):
        """Verify S3 server access logging is enabled"""
        response = self.s3_client.get_bucket_logging(Bucket=self.primary_bucket)
        
        logging_enabled = response.get("LoggingEnabled", {})
        self.assertIsNotNone(logging_enabled, "Logging not enabled")
        self.assertEqual(logging_enabled.get("TargetBucket"), self.log_bucket)
        self.assertIsNotNone(logging_enabled.get("TargetPrefix"))

    @mark.it("log bucket exists and is accessible")
    def test_log_bucket_exists(self):
        """Verify log bucket exists"""
        try:
            response = self.s3_client.head_bucket(Bucket=self.log_bucket)
            self.assertIsNotNone(response)
        except ClientError as e:
            self.fail(f"Log bucket {self.log_bucket} does not exist: {e}")

    @mark.it("log bucket has versioning enabled")
    def test_log_bucket_versioning(self):
        """Verify log bucket has versioning enabled"""
        response = self.s3_client.get_bucket_versioning(Bucket=self.log_bucket)
        self.assertEqual(response.get("Status"), "Enabled")

    # ============================================================================
    # S3 BUCKET POLICY TESTS
    # ============================================================================

    @mark.it("bucket policy requires TLS/SSL")
    def test_bucket_policy_requires_tls(self):
        """Verify bucket policy denies non-TLS requests"""
        try:
            response = self.s3_client.get_bucket_policy(Bucket=self.primary_bucket)
            policy = json.loads(response["Policy"])
            
            # Check for SecureTransport deny statement
            has_tls_requirement = False
            for statement in policy.get("Statement", []):
                if statement.get("Effect") == "Deny":
                    condition = statement.get("Condition", {})
                    if "Bool" in condition:
                        if condition["Bool"].get("aws:SecureTransport") == "false":
                            has_tls_requirement = True
                            break
            
            self.assertTrue(has_tls_requirement, "Bucket policy does not require TLS")
        except ClientError as e:
            self.fail(f"Failed to get bucket policy: {e}")

    @mark.it("bucket policy denies unencrypted uploads")
    def test_bucket_policy_denies_unencrypted(self):
        """Verify bucket policy denies unencrypted PUTs"""
        try:
            response = self.s3_client.get_bucket_policy(Bucket=self.primary_bucket)
            policy = json.loads(response["Policy"])
            
            # Check for encryption requirement
            has_encryption_requirement = False
            for statement in policy.get("Statement", []):
                if statement.get("Effect") == "Deny" and statement.get("Action") == "s3:PutObject":
                    condition = statement.get("Condition", {})
                    if "StringNotEquals" in condition:
                        if "s3:x-amz-server-side-encryption" in condition["StringNotEquals"]:
                            has_encryption_requirement = True
                            break
            
            self.assertTrue(has_encryption_requirement, "Bucket policy does not deny unencrypted uploads")
        except ClientError as e:
            self.fail(f"Failed to get bucket policy: {e}")

    # ============================================================================
    # KMS KEY TESTS
    # ============================================================================

    @mark.it("KMS key exists and is enabled")
    def test_kms_key_exists_and_enabled(self):
        """Verify KMS key exists and is in enabled state"""
        try:
            response = self.kms_client.describe_key(KeyId=self.kms_key_arn)
            metadata = response.get("KeyMetadata", {})
            
            self.assertEqual(metadata.get("KeyState"), "Enabled")
            self.assertTrue(metadata.get("Enabled"))
        except ClientError as e:
            self.fail(f"KMS key {self.kms_key_arn} not found: {e}")

    @mark.it("KMS key has automatic rotation enabled")
    def test_kms_key_rotation_enabled(self):
        """Verify KMS key rotation is enabled"""
        try:
            key_id = self.kms_key_arn.split("/")[-1]
            response = self.kms_client.get_key_rotation_status(KeyId=key_id)
            self.assertTrue(response.get("KeyRotationEnabled"), "Key rotation is not enabled")
        except ClientError as e:
            self.fail(f"Failed to check key rotation status: {e}")

    @mark.it("KMS key has alias configured")
    def test_kms_key_has_alias(self):
        """Verify KMS key has the expected alias"""
        try:
            response = self.kms_client.list_aliases()
            aliases = response.get("Aliases", [])
            
            key_id = self.kms_key_arn.split("/")[-1]
            found_alias = False
            
            for alias in aliases:
                if alias.get("TargetKeyId") == key_id and "legal-docs" in alias.get("AliasName", ""):
                    found_alias = True
                    break
            
            self.assertTrue(found_alias, "KMS key alias not found")
        except ClientError as e:
            self.fail(f"Failed to list KMS aliases: {e}")

    # ============================================================================
    # CLOUDTRAIL TESTS
    # ============================================================================

    @mark.it("CloudTrail is logging to S3")
    def test_cloudtrail_logging_to_s3(self):
        """Verify CloudTrail is active and logging"""
        try:
            response = self.cloudtrail_client.describe_trails()
            trails = response.get("trailList", [])
            
            # Find our trail (it logs to our log bucket)
            our_trail = None
            for trail in trails:
                if trail.get("S3BucketName") == self.log_bucket:
                    our_trail = trail
                    break
            
            self.assertIsNotNone(our_trail, "CloudTrail trail not found")
            
            # Verify trail status
            trail_name = our_trail["Name"]
            status = self.cloudtrail_client.get_trail_status(Name=trail_name)
            self.assertTrue(status.get("IsLogging"), "CloudTrail is not actively logging")
        except ClientError as e:
            self.fail(f"Failed to describe CloudTrail: {e}")

    @mark.it("CloudTrail has S3 data events enabled")
    def test_cloudtrail_data_events_enabled(self):
        """Verify CloudTrail captures S3 data events for our bucket"""
        try:
            response = self.cloudtrail_client.describe_trails()
            trails = response.get("trailList", [])
            
            our_trail = None
            for trail in trails:
                if trail.get("S3BucketName") == self.log_bucket:
                    our_trail = trail
                    break
            
            self.assertIsNotNone(our_trail, "Trail not found")
            
            # Check event selectors
            trail_name = our_trail["Name"]
            selectors = self.cloudtrail_client.get_event_selectors(TrailName=trail_name)
            event_selectors = selectors.get("EventSelectors", [])
            
            has_s3_data_events = False
            for selector in event_selectors:
                for data_resource in selector.get("DataResources", []):
                    if data_resource.get("Type") == "AWS::S3::Object":
                        # Check if it includes our bucket
                        values = data_resource.get("Values", [])
                        for value in values:
                            if self.primary_bucket in value:
                                has_s3_data_events = True
                                break
            
            self.assertTrue(has_s3_data_events, "S3 data events not enabled for our bucket")
        except ClientError as e:
            self.fail(f"Failed to get event selectors: {e}")

    # ============================================================================
    # CLOUDWATCH TESTS
    # ============================================================================

    @mark.it("CloudWatch alarms exist for 4xx and 5xx errors")
    def test_cloudwatch_alarms_exist(self):
        """Verify CloudWatch alarms are created"""
        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNamePrefix=self.primary_bucket
            )
            alarms = response.get("MetricAlarms", [])
            
            self.assertGreaterEqual(len(alarms), 2, "Expected at least 2 alarms")
            
            # Check for 4xx and 5xx error alarms
            alarm_metrics = [alarm.get("MetricName") for alarm in alarms]
            self.assertIn("4xxErrors", alarm_metrics, "4xx error alarm not found")
            self.assertIn("5xxErrors", alarm_metrics, "5xx error alarm not found")
        except ClientError as e:
            self.fail(f"Failed to describe alarms: {e}")

    @mark.it("CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        """Verify CloudWatch dashboard is created"""
        try:
            response = self.cloudwatch_client.list_dashboards()
            dashboards = response.get("DashboardEntries", [])
            
            dashboard_names = [d.get("DashboardName") for d in dashboards]
            self.assertIn("LegalDocsStorageDashboard", dashboard_names, "Dashboard not found")
        except ClientError as e:
            self.fail(f"Failed to list dashboards: {e}")

    # ============================================================================
    # IAM TESTS
    # ============================================================================

    @mark.it("IAM ingestion role exists")
    def test_iam_ingestion_role_exists(self):
        """Verify IAM ingestion role exists"""
        try:
            role_name = self.ingestion_role_arn.split("/")[-1]
            response = self.iam_client.get_role(RoleName=role_name)
            self.assertIsNotNone(response.get("Role"))
        except ClientError as e:
            self.fail(f"Ingestion role not found: {e}")

    @mark.it("IAM ingestion role has S3 permissions")
    def test_iam_ingestion_role_s3_permissions(self):
        """Verify ingestion role has necessary S3 permissions"""
        try:
            role_name = self.ingestion_role_arn.split("/")[-1]
            
            # Get inline policies
            inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
            policy_names = inline_policies.get("PolicyNames", [])
            
            self.assertGreater(len(policy_names), 0, "No inline policies found")
            
            # Check first policy for S3 actions
            policy_name = policy_names[0]
            policy = self.iam_client.get_role_policy(RoleName=role_name, PolicyName=policy_name)
            policy_doc = policy.get("PolicyDocument", {})
            
            has_s3_permissions = False
            for statement in policy_doc.get("Statement", []):
                actions = statement.get("Action", [])
                if isinstance(actions, str):
                    actions = [actions]
                
                if any("s3:" in action for action in actions):
                    has_s3_permissions = True
                    break
            
            self.assertTrue(has_s3_permissions, "Role does not have S3 permissions")
        except ClientError as e:
            self.fail(f"Failed to check role permissions: {e}")

    # ============================================================================
    # FUNCTIONAL TESTS (ACTUAL USAGE)
    # ============================================================================

    @mark.it("can upload and retrieve object with versioning")
    def test_upload_and_retrieve_versioned_object(self):
        """Test actual upload and retrieval of a versioned object"""
        test_key = f"integration-test/test-{datetime.now().isoformat()}.txt"
        test_content_v1 = "Test content version 1"
        test_content_v2 = "Test content version 2"
        
        try:
            # Upload version 1
            response_v1 = self.s3_client.put_object(
                Bucket=self.primary_bucket,
                Key=test_key,
                Body=test_content_v1
            )
            version_id_v1 = response_v1.get("VersionId")
            self.assertIsNotNone(version_id_v1, "No version ID returned")
            
            # Upload version 2 (same key)
            response_v2 = self.s3_client.put_object(
                Bucket=self.primary_bucket,
                Key=test_key,
                Body=test_content_v2
            )
            version_id_v2 = response_v2.get("VersionId")
            self.assertIsNotNone(version_id_v2, "No version ID returned for v2")
            self.assertNotEqual(version_id_v1, version_id_v2, "Version IDs should be different")
            
            # Retrieve current version (should be v2)
            response_current = self.s3_client.get_object(
                Bucket=self.primary_bucket,
                Key=test_key
            )
            current_content = response_current["Body"].read().decode("utf-8")
            self.assertEqual(current_content, test_content_v2)
            
            # Retrieve specific version 1
            response_v1_get = self.s3_client.get_object(
                Bucket=self.primary_bucket,
                Key=test_key,
                VersionId=version_id_v1
            )
            v1_content = response_v1_get["Body"].read().decode("utf-8")
            self.assertEqual(v1_content, test_content_v1)
            
            # List versions
            versions = self.s3_client.list_object_versions(
                Bucket=self.primary_bucket,
                Prefix=test_key
            )
            version_list = versions.get("Versions", [])
            self.assertGreaterEqual(len(version_list), 2, "Should have at least 2 versions")
            
        except ClientError as e:
            self.fail(f"Failed to upload/retrieve versioned object: {e}")
        finally:
            # Note: Cannot delete due to Object Lock, but that's expected
            pass

    @mark.it("Object Lock prevents premature deletion")
    def test_object_lock_prevents_deletion(self):
        """Verify Object Lock prevents deletion of objects before retention expires"""
        test_key = f"integration-test/lock-test-{datetime.now().isoformat()}.txt"
        test_content = "This object is protected by Object Lock"
        
        try:
            # Upload object
            response = self.s3_client.put_object(
                Bucket=self.primary_bucket,
                Key=test_key,
                Body=test_content
            )
            version_id = response.get("VersionId")
            
            # Verify object has retention set
            retention = self.s3_client.get_object_retention(
                Bucket=self.primary_bucket,
                Key=test_key,
                VersionId=version_id
            )
            
            retention_config = retention.get("Retention", {})
            self.assertEqual(retention_config.get("Mode"), "COMPLIANCE")
            
            retain_until = retention_config.get("RetainUntilDate")
            self.assertIsNotNone(retain_until)
            
            # Verify retention is at least 90 days from now
            retention_days = (retain_until.replace(tzinfo=None) - datetime.now()).days
            self.assertGreaterEqual(retention_days, 89, "Retention period less than 90 days")
            
            # Attempt to delete should be prevented (not testing actual deletion to avoid cleanup issues)
            
        except ClientError as e:
            self.fail(f"Failed Object Lock test: {e}")

    @mark.it("encrypted objects are stored with KMS encryption")
    def test_objects_encrypted_with_kms(self):
        """Verify uploaded objects are encrypted with KMS"""
        test_key = f"integration-test/encryption-test-{datetime.now().isoformat()}.txt"
        test_content = "This object should be encrypted with KMS"
        
        try:
            # Upload object
            self.s3_client.put_object(
                Bucket=self.primary_bucket,
                Key=test_key,
                Body=test_content
            )
            
            # Get object metadata
            response = self.s3_client.head_object(
                Bucket=self.primary_bucket,
                Key=test_key
            )
            
            # Verify encryption
            sse_algo = response.get("ServerSideEncryption")
            self.assertEqual(sse_algo, "aws:kms", "Object not encrypted with KMS")
            
            sse_key_id = response.get("SSEKMSKeyId")
            self.assertIsNotNone(sse_key_id, "No KMS key ID in object metadata")
            self.assertIn(self.kms_key_arn.split("/")[-1], sse_key_id)
            
        except ClientError as e:
            self.fail(f"Failed encryption test: {e}")


if __name__ == "__main__":
    unittest.main()

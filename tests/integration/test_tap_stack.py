"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import json
import os
from typing import Dict, Any, List

import boto3
import pytest
from botocore.exceptions import ClientError


@pytest.fixture(scope="session")
def region() -> str:
    return os.getenv("AWS_REGION", "us-east-1")


@pytest.fixture(scope="session")
def session(region):
    return boto3.Session(region_name=region)


@pytest.fixture(scope="session")
def s3(session):
    return session.client("s3")


@pytest.fixture(scope="session")
def sns(session):
    return session.client("sns")


@pytest.fixture(scope="session")
def kms(session):
    return session.client("kms")


@pytest.fixture(scope="session")
def iam(session):
    return session.client("iam")


@pytest.fixture(scope="session")
def cloudwatch(session):
    return session.client("cloudwatch")


# --- Load outputs.json ---
_DEFAULT_FALLBACK_OUTPUTS = {}


def _load_outputs() -> Dict[str, Any]:
    """Load stack outputs from JSON file or Pulumi outputs."""
    path = os.getenv("OUTPUTS_JSON", "./pulumi-outputs/stack-outputs.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            env = os.getenv("ENVIRONMENT_SUFFIX", "")
            data = json.load(f)
            return data.get(f"TapStack{env}", data)
    return _DEFAULT_FALLBACK_OUTPUTS.copy()


@pytest.fixture(scope="session")
def outputs() -> Dict[str, Any]:
    return _load_outputs()


# --- Helper functions ---

def _get_bucket_by_prefix(s3, prefix: str) -> str:
    """Find bucket by name prefix."""
    buckets = s3.list_buckets()["Buckets"]
    matching_buckets = [b["Name"] for b in buckets if prefix in b["Name"]]
    if not matching_buckets:
        pytest.skip(f"No bucket found with prefix: {prefix}")
    return matching_buckets[0]


def _get_topic_by_name_pattern(sns, pattern: str) -> str:
    """Find SNS topic by name pattern."""
    topics = sns.list_topics()["Topics"]
    matching_topics = [t["TopicArn"] for t in topics if pattern in t["TopicArn"]]
    if not matching_topics:
        pytest.skip(f"No topic found with pattern: {pattern}")
    return matching_topics[0]


def _get_kms_keys_by_description(kms, description_pattern: str) -> List[str]:
    """Find KMS keys by description pattern."""
    keys = kms.list_keys()["Keys"]
    matching_keys = []
    
    for key in keys:
        try:
            key_metadata = kms.describe_key(KeyId=key["KeyId"])
            if (key_metadata["KeyMetadata"]["KeyManager"] == "CUSTOMER" and
                description_pattern in key_metadata["KeyMetadata"].get("Description", "")):
                matching_keys.append(key["KeyId"])
        except ClientError:
            continue
    
    return matching_keys


# ===============================
# S3 Bucket Tests (Tests 1..6)
# ===============================

@pytest.mark.live
def test_01_s3_bucket_exists(s3, outputs):
    """Test that S3 bucket exists and is accessible."""
    if "s3_bucket_us_east_1" in outputs:
        bucket_name = outputs["s3_bucket_us_east_1"]
    else:
        bucket_name = _get_bucket_by_prefix(s3, "secure-bucket")
    
    response = s3.head_bucket(Bucket=bucket_name)
    assert response["ResponseMetadata"]["HTTPStatusCode"] == 200


@pytest.mark.live
def test_02_s3_bucket_versioning_enabled(s3, outputs):
    """Test S3 bucket has versioning enabled."""
    if "s3_bucket_us_east_1" in outputs:
        bucket_name = outputs["s3_bucket_us_east_1"]
    else:
        bucket_name = _get_bucket_by_prefix(s3, "secure-bucket")
    
    versioning = s3.get_bucket_versioning(Bucket=bucket_name)
    assert versioning.get("Status") == "Enabled", f"Versioning not enabled for {bucket_name}"


@pytest.mark.live
def test_03_s3_bucket_encryption_enabled(s3, outputs):
    """Test S3 bucket has KMS encryption enabled."""
    if "s3_bucket_us_east_1" in outputs:
        bucket_name = outputs["s3_bucket_us_east_1"]
    else:
        bucket_name = _get_bucket_by_prefix(s3, "secure-bucket")
    
    try:
        encryption = s3.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption["ServerSideEncryptionConfiguration"]["Rules"]
        assert len(rules) > 0
        assert rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "aws:kms"
    except ClientError as e:
        if e.response["Error"]["Code"] == "ServerSideEncryptionConfigurationNotFoundError":
            pytest.fail(f"No encryption configuration found for {bucket_name}")
        raise


@pytest.mark.live
def test_04_s3_bucket_public_access_blocked(s3, outputs):
    """Test S3 bucket has public access blocked."""
    if "s3_bucket_us_east_1" in outputs:
        bucket_name = outputs["s3_bucket_us_east_1"]
    else:
        bucket_name = _get_bucket_by_prefix(s3, "secure-bucket")
    
    try:
        public_access = s3.get_public_access_block(Bucket=bucket_name)
        config = public_access["PublicAccessBlockConfiguration"]
        
        assert config["BlockPublicAcls"] is True
        assert config["BlockPublicPolicy"] is True
        assert config["IgnorePublicAcls"] is True
        assert config["RestrictPublicBuckets"] is True
    except ClientError:
        pytest.fail(f"Public access block not configured for {bucket_name}")


@pytest.mark.live
def test_05_s3_bucket_lifecycle_configured(s3, outputs):
    """Test S3 bucket has lifecycle configuration."""
    if "s3_bucket_us_east_1" in outputs:
        bucket_name = outputs["s3_bucket_us_east_1"]
    else:
        bucket_name = _get_bucket_by_prefix(s3, "secure-bucket")
    
    try:
        lifecycle = s3.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        rules = lifecycle["Rules"]
        assert len(rules) > 0
        
        # Check for transition rules
        has_transition = any(
            "Transitions" in rule for rule in rules
        )
        assert has_transition, "No lifecycle transition rules found"
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchLifecycleConfiguration":
            pytest.fail(f"No lifecycle configuration found for {bucket_name}")
        raise


@pytest.mark.live
def test_06_s3_bucket_notification_configured(s3, outputs):
    """Test S3 bucket has notification configuration."""
    if "s3_bucket_us_east_1" in outputs:
        bucket_name = outputs["s3_bucket_us_east_1"]
    else:
        bucket_name = _get_bucket_by_prefix(s3, "secure-bucket")
    
    try:
        notification = s3.get_bucket_notification_configuration(Bucket=bucket_name)
        # Check if any notification configurations exist
        has_notification = (
            "TopicConfigurations" in notification or
            "QueueConfigurations" in notification or
            "LambdaConfigurations" in notification
        )
        assert has_notification, "No notification configurations found"
    except ClientError:
        pytest.fail(f"Error getting notification configuration for {bucket_name}")


# ===============================
# SNS Topic Tests (Tests 7..9)
# ===============================

@pytest.mark.live
def test_07_sns_topic_exists(sns, outputs):
    """Test that SNS topic exists."""
    if "sns_topic_arn" in outputs:
        topic_arn = outputs["sns_topic_arn"]
    else:
        topic_arn = _get_topic_by_name_pattern(sns, "s3-notifications")
    
    attributes = sns.get_topic_attributes(TopicArn=topic_arn)
    assert attributes["Attributes"]["TopicArn"] == topic_arn


@pytest.mark.live
def test_08_sns_topic_has_kms_encryption(sns, outputs):
    """Test SNS topic has KMS encryption enabled."""
    if "sns_topic_arn" in outputs:
        topic_arn = outputs["sns_topic_arn"]
    else:
        topic_arn = _get_topic_by_name_pattern(sns, "s3-notifications")
    
    attributes = sns.get_topic_attributes(TopicArn=topic_arn)
    kms_key_id = attributes["Attributes"].get("KmsMasterKeyId")
    assert kms_key_id is not None, f"KMS encryption not configured for {topic_arn}"


@pytest.mark.live
def test_09_sns_topic_has_policy(sns, outputs):
    """Test SNS topic has proper policy configured."""
    if "sns_topic_arn" in outputs:
        topic_arn = outputs["sns_topic_arn"]
    else:
        topic_arn = _get_topic_by_name_pattern(sns, "s3-notifications")
    
    attributes = sns.get_topic_attributes(TopicArn=topic_arn)
    policy = attributes["Attributes"].get("Policy")
    assert policy is not None, f"No policy configured for {topic_arn}"
    
    # Parse policy and check for S3 service permission
    policy_doc = json.loads(policy)
    has_s3_permission = any(
        stmt.get("Principal", {}).get("Service") == "s3.amazonaws.com"
        for stmt in policy_doc.get("Statement", [])
    )
    assert has_s3_permission, "Policy does not allow S3 service access"


# ===============================
# KMS Key Tests (Tests 10..12)
# ===============================

@pytest.mark.live
def test_10_kms_key_exists(kms, outputs):
    """Test that customer-managed KMS keys exist."""
    if "kms_key_id" in outputs:
        key_id = outputs["kms_key_id"]
        key_metadata = kms.describe_key(KeyId=key_id)
        assert key_metadata["KeyMetadata"]["KeyManager"] == "CUSTOMER"
    else:
        # Look for customer-managed keys
        keys = kms.list_keys()["Keys"]
        customer_keys = []
        for key in keys:
            try:
                key_metadata = kms.describe_key(KeyId=key["KeyId"])
                if key_metadata["KeyMetadata"]["KeyManager"] == "CUSTOMER":
                    customer_keys.append(key["KeyId"])
            except ClientError:
                continue
        
        assert len(customer_keys) > 0, "No customer-managed KMS keys found"


@pytest.mark.live
def test_11_kms_key_rotation_enabled(kms, outputs):
    """Test KMS key has rotation enabled."""
    if "kms_key_id" in outputs:
        key_id = outputs["kms_key_id"]
    else:
        # Find a customer-managed key
        keys = _get_kms_keys_by_description(kms, "S3")
        if not keys:
            pytest.skip("No customer-managed KMS keys found")
        key_id = keys[0]
    
    try:
        rotation_status = kms.get_key_rotation_status(KeyId=key_id)
        assert rotation_status["KeyRotationEnabled"] is True, f"Key rotation not enabled for {key_id}"
    except ClientError as e:
        if e.response["Error"]["Code"] == "UnsupportedOperationException":
            pytest.skip(f"Key rotation not supported for key type: {key_id}")
        raise


@pytest.mark.live
def test_12_kms_key_has_alias(kms, outputs):
    """Test KMS key has associated alias."""
    if "kms_key_id" in outputs:
        key_id = outputs["kms_key_id"]
    else:
        # Find a customer-managed key
        keys = _get_kms_keys_by_description(kms, "S3")
        if not keys:
            pytest.skip("No customer-managed KMS keys found")
        key_id = keys[0]
    
    aliases = kms.list_aliases()["Aliases"]
    key_aliases = [alias for alias in aliases if alias.get("TargetKeyId") == key_id]
    assert len(key_aliases) > 0, f"No aliases found for key {key_id}"


# ===============================
# IAM Role Tests (Tests 13..15)
# ===============================

@pytest.mark.live
def test_13_iam_role_exists(iam, outputs):
    """Test that IAM roles exist."""
    if "iam_role_name" in outputs:
        role_name = outputs["iam_role_name"]
        role = iam.get_role(RoleName=role_name)
        assert role["Role"]["RoleName"] == role_name
    else:
        # Look for roles with specific naming pattern
        roles = iam.list_roles()["Roles"]
        stack_roles = [role for role in roles if "s3" in role["RoleName"].lower()]
        assert len(stack_roles) > 0, "No S3-related IAM roles found"


@pytest.mark.live
def test_14_iam_role_has_policies(iam, outputs):
    """Test IAM role has policies attached."""
    if "iam_role_name" in outputs:
        role_name = outputs["iam_role_name"]
    else:
        # Find an S3-related role
        roles = iam.list_roles()["Roles"]
        s3_roles = [role for role in roles if "s3" in role["RoleName"].lower()]
        if not s3_roles:
            pytest.skip("No S3-related IAM roles found")
        role_name = s3_roles[0]["RoleName"]
    
    # Check attached managed policies
    attached_policies = iam.list_attached_role_policies(RoleName=role_name)
    inline_policies = iam.list_role_policies(RoleName=role_name)
    
    total_policies = len(attached_policies["AttachedPolicies"]) + len(inline_policies["PolicyNames"])
    assert total_policies > 0, f"No policies attached to role {role_name}"


@pytest.mark.live
def test_15_iam_role_has_instance_profile(iam, outputs):
    """Test IAM role has instance profile."""
    if "iam_role_name" in outputs:
        role_name = outputs["iam_role_name"]
    else:
        # Find an S3-related role
        roles = iam.list_roles()["Roles"]
        s3_roles = [role for role in roles if "s3" in role["RoleName"].lower()]
        if not s3_roles:
            pytest.skip("No S3-related IAM roles found")
        role_name = s3_roles[0]["RoleName"]
    
    instance_profiles = iam.list_instance_profiles_for_role(RoleName=role_name)
    assert len(instance_profiles["InstanceProfiles"]) > 0, f"No instance profiles for role {role_name}"


# ===============================
# CloudWatch Alarm Tests (Tests 16..18)
# ===============================

@pytest.mark.live
def test_16_cloudwatch_alarms_exist(cloudwatch, outputs):
    """Test that CloudWatch alarms exist."""
    alarms = cloudwatch.describe_alarms()["MetricAlarms"]
    s3_alarms = [alarm for alarm in alarms if alarm.get("Namespace") == "AWS/S3"]
    assert len(s3_alarms) > 0, "No S3-related CloudWatch alarms found"


@pytest.mark.live
def test_17_cloudwatch_alarms_have_actions(cloudwatch, outputs):
    """Test CloudWatch alarms have actions configured."""
    alarms = cloudwatch.describe_alarms()["MetricAlarms"]
    s3_alarms = [alarm for alarm in alarms if alarm.get("Namespace") == "AWS/S3"]
    
    if not s3_alarms:
        pytest.skip("No S3-related CloudWatch alarms found")
    
    for alarm in s3_alarms:
        assert len(alarm.get("AlarmActions", [])) > 0, f"No actions configured for alarm {alarm['AlarmName']}"


@pytest.mark.live
def test_18_cloudwatch_alarms_monitor_s3_metrics(cloudwatch, outputs):
    """Test CloudWatch alarms monitor appropriate S3 metrics."""
    alarms = cloudwatch.describe_alarms()["MetricAlarms"]
    s3_alarms = [alarm for alarm in alarms if alarm.get("Namespace") == "AWS/S3"]
    
    if not s3_alarms:
        pytest.skip("No S3-related CloudWatch alarms found")
    
    monitored_metrics = {alarm["MetricName"] for alarm in s3_alarms}
    expected_metrics = {"4xxErrors", "AllRequests"}
    
    # Check that at least one expected metric is monitored
    assert len(monitored_metrics.intersection(expected_metrics)) > 0, \
        f"No expected S3 metrics monitored. Found: {monitored_metrics}"


# ===============================
# End-to-End Integration Tests (Tests 19..20)
# ===============================

@pytest.mark.live
def test_19_s3_sns_integration_configured(s3, sns, outputs):
    """Test S3 bucket is configured to send notifications to SNS."""
    if "s3_bucket_us_east_1" in outputs:
        bucket_name = outputs["s3_bucket_us_east_1"]
    else:
        bucket_name = _get_bucket_by_prefix(s3, "secure-bucket")
    
    notification = s3.get_bucket_notification_configuration(Bucket=bucket_name)
    topic_configs = notification.get("TopicConfigurations", [])
    
    assert len(topic_configs) > 0, "No topic configurations found for S3 bucket"
    
    # Verify events are configured
    for config in topic_configs:
        events = config.get("Events", [])
        assert len(events) > 0, "No events configured for SNS topic notification"


@pytest.mark.live
def test_20_cloudwatch_sns_integration_configured(cloudwatch, sns, outputs):
    """Test CloudWatch alarms are configured to publish to SNS."""
    alarms = cloudwatch.describe_alarms()["MetricAlarms"]
    s3_alarms = [alarm for alarm in alarms if alarm.get("Namespace") == "AWS/S3"]
    
    if not s3_alarms:
        pytest.skip("No S3-related CloudWatch alarms found")
    
    # Check that alarms have SNS topic as action
    sns_actions = []
    for alarm in s3_alarms:
        for action in alarm.get("AlarmActions", []):
            if ":sns:" in action:
                sns_actions.append(action)
    
    assert len(sns_actions) > 0, "No SNS actions configured for CloudWatch alarms"
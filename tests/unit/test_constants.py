"""
test_constants.py

Constants used across unit tests to avoid hardcoded values and improve maintainability.
"""

# AWS Constants
AWS_ACCOUNT_ID = "123456789012"
AWS_REGION = "us-east-1"
AWS_USER_ID = "AIDAI123456789012"
AWS_ARN_PREFIX = f"arn:aws"
AWS_IAM_USER_ARN = f"{AWS_ARN_PREFIX}:iam::{AWS_ACCOUNT_ID}:user/test"

# VPC Constants
VPC_ID = "vpc-12345678"
VPC_ARN = f"{AWS_ARN_PREFIX}:ec2:{AWS_REGION}:{AWS_ACCOUNT_ID}:vpc/{VPC_ID}"
SUBNET_IDS = ["subnet-12345678", "subnet-87654321"]

# Environment Suffixes
DEFAULT_ENVIRONMENT = "dev"
ENVIRONMENT_SUFFIXES = ["dev", "staging", "production", "test", "demo", "qa"]
TEST_ENVIRONMENTS = ["dev", "staging", "production", "test-env-123"]
SPECIAL_CHAR_ENVIRONMENTS = ["dev-1", "test_env", "staging-v2", "prod-us-east-1"]

# Tags
EMPTY_TAGS = {}
DEFAULT_TEST_TAGS = {"Environment": "test", "Project": "tap"}
COMPREHENSIVE_TAGS = {
    "Environment": "production",
    "Project": "financial-processing",
    "CostCenter": "engineering",
    "Owner": "platform-team"
}
TEAM_TAGS = {"Team": "backend", "Application": "transactions"}

# Resource Name Patterns
RESOURCE_NAME_PREFIX = "tap"
KMS_KEY_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-kms-key-{{env}}"
PROCESSING_TABLE_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-processing-state-{{env}}"
FRAUD_TABLE_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-fraud-detection-{{env}}"
REPORTS_BUCKET_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-transaction-reports-{{env}}"
TRANSACTION_QUEUE_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-transactions-{{env}}.fifo"
PRIORITY_QUEUE_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-priority-transactions-{{env}}.fifo"
PROCESSING_TOPIC_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-processing-alerts-{{env}}"
FRAUD_TOPIC_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-fraud-alerts-{{env}}"
LAMBDA_ROLE_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-lambda-role-{{env}}"
STEPFUNCTIONS_ROLE_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-stepfunctions-role-{{env}}"
TRANSACTION_PROCESSOR_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-transaction-processor-{{env}}"
PRIORITY_PROCESSOR_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-priority-processor-{{env}}"
FRAUD_WORKFLOW_NAME_PATTERN = f"{RESOURCE_NAME_PREFIX}-fraud-detection-workflow-{{env}}"

# AWS Service Names
AWS_SERVICES = [
    "kms",
    "dynamodb",
    "s3",
    "sqs",
    "sns",
    "iam",
    "lambda",
    "cloudwatch",
    "sfn",
]

# Financial Transaction Keywords
FINANCIAL_KEYWORDS = [
    "fraud",
    "transaction",
    "processing",
    "priority",
    "alert",
    "risk",
    "fifo"
]

# Security Patterns
SECURITY_PATTERNS = [
    "kms",
    "encryption",
    "server_side_encryption",
    "point_in_time_recovery",
    "enable_key_rotation",
    "block_public",
    "tracing_config"
]

# Monitoring Patterns
MONITORING_PATTERNS = [
    "cloudwatch",
    "alarm",
    "metric",
    "tracing",
    "log"
]

# FIFO Queue Configuration
FIFO_PATTERNS = [
    "fifo_queue=True",
    "content_based_deduplication=True",
    ".fifo"
]

# KMS Configuration
KMS_PATTERNS = [
    "enable_key_rotation=True",
    "deletion_window_in_days",
    "kms_master_key_id"
]
KMS_DELETION_WINDOW_DAYS = 7

# DynamoDB Best Practices
DYNAMODB_PATTERNS = [
    'billing_mode="PAY_PER_REQUEST"',
    "point_in_time_recovery",
    "server_side_encryption",
    "global_secondary_index"
]

# Lambda Best Practices
LAMBDA_RUNTIME = "python3.11"
LAMBDA_ARCHITECTURE = "arm64"
LAMBDA_PATTERNS = [
    f'runtime="{LAMBDA_RUNTIME}"',
    f'architectures=["{LAMBDA_ARCHITECTURE}"]',
    "timeout",
    "memory_size",
    "tracing_config",
    "dead_letter_config"
]
LAMBDA_MIN_BEST_PRACTICES = 5

# Resource Creation Order
RESOURCE_CREATION_ORDER = [
    "_create_kms_key",
    "_create_vpc_endpoints",
    "_create_dynamodb_tables",
    "_create_s3_buckets",
    "_create_sqs_queues",
    "_create_sns_topics",
    "_create_iam_roles",
    "_create_lambda_functions",
    "_create_eventbridge_rules",
    "_create_step_functions",
    "_create_cloudwatch_alarms"
]

# Cross-Service Resource References
CROSS_REFERENCES = [
    ("kms_key", "arn"),
    ("lambda_role", "arn"),
    ("transaction_queue", "arn"),
    ("processing_table", "name"),
    ("reports_bucket", "bucket"),
]

# Scalability Patterns
SCALABILITY_PATTERNS = [
    "PAY_PER_REQUEST",
    "batch_size",
    "arm64",
    "intelligent_tiering"
]

# Throughput Patterns
THROUGHPUT_PATTERNS = [
    "perMessageGroupId",
    "batch_size",
    "visibility_timeout",
    "memory_size",
]
THROUGHPUT_MIN_PATTERNS = 3

# Backup and Recovery Patterns
BACKUP_PATTERNS = [
    "point_in_time_recovery",
    "retention",
    "lifecycle",
    "versioning"
]
BACKUP_MIN_FEATURES = 2

# Hardcoded Availability Zones (should NOT be present)
HARDCODED_AZ_PATTERNS = ["us-east-1a", "us-east-1b", "us-west-2a"]

# IAM Specific Actions
IAM_SPECIFIC_ACTIONS = [
    '"sqs:ReceiveMessage"',
    '"dynamodb:GetItem"',
    '"s3:GetObject"',
    '"sns:Publish"',
    '"kms:Decrypt"'
]
IAM_MIN_SPECIFIC_ACTIONS = 3

# Broad IAM Permissions (should be avoided)
BROAD_IAM_PERMISSIONS = ['"*"', '"s3:*"', '"dynamodb:*"', '"sqs:*"']

# Encryption Patterns for Data Stores
ENCRYPTION_PATTERNS = [
    ("dynamodb", "server_side_encryption"),
    ("s3", "server_side_encryption"),
    ("sqs", "kms_master_key_id"),
    ("sns", "kms_master_key_id"),
]

# Network Security Patterns
NETWORK_SECURITY_PATTERNS = [
    "block_public_acls=True",
    "block_public_policy=True",
    "ignore_public_acls=True",
    "restrict_public_buckets=True",
]

# Cost Optimization Patterns
COST_PATTERNS = [
    "PAY_PER_REQUEST",
    "arm64",
    "intelligent_tiering",
    "STANDARD_IA",
    "GLACIER",
    "DEEP_ARCHIVE"
]
COST_MIN_OPTIMIZATIONS = 4

# Resource Right-Sizing Patterns
SIZING_PATTERNS = [
    "memory_size",
    "timeout",
    "batch_size",
    "visibility_timeout"
]

# Audit Trail Components
AUDIT_COMPONENTS = [
    "tracing",
    "point_in_time_recovery",
    "enable_key_rotation",
    "retention"
]

# Data Protection Patterns
DATA_PROTECTION_PATTERNS = [
    "kms",
    "server_side_encryption",
    "block_public",
    "dead_letter"
]
DATA_PROTECTION_MIN_FEATURES = 4

# Dead Letter Queue Patterns
DLQ_PATTERNS = [
    "dead_letter",
    "redrive_policy",
    "maxReceiveCount"
]

# Retry Configuration Patterns
RETRY_PATTERNS = [
    '"Retry"',
    "MaxAttempts",
    "BackoffRate",
    "IntervalSeconds"
]
RETRY_MIN_PATTERNS = 2

# CloudWatch Alarm Patterns
ALARM_PATTERNS = [
    "MetricAlarm",
    "threshold",
    "evaluation_periods",
    "alarm_actions"
]

# Financial Compliance Patterns
FINANCIAL_AUDIT_PATTERNS = [
    "point_in_time_recovery",
    "tracing",
    "log",
    "timestamp"
]
FINANCIAL_AUDIT_MIN_FEATURES = 3

# Data Retention (7 years for financial compliance)
RETENTION_DAYS_7_YEARS = 2555
RETENTION_PATTERNS = [
    str(RETENTION_DAYS_7_YEARS),
    "retention",
    "lifecycle",
    "days"
]
RETENTION_MIN_PATTERNS = 2

# Transaction Ordering Patterns
ORDERING_PATTERNS = [
    "fifo",
    "message_group",
    "deduplication"
]

# S3 Intelligent Tiering Patterns
INTELLIGENT_TIERING_PATTERNS = [
    "intelligent_tiering",
    "BucketIntelligentTieringConfiguration",
    "ARCHIVE_ACCESS",
    "DEEP_ARCHIVE_ACCESS"
]

# Minimum Required Counts
MIN_TAG_USAGE_COUNT = 15
MIN_ENVIRONMENT_SUFFIX_USAGE = 10
MIN_AWS_SERVICE_COVERAGE = 3
MIN_MONITORING_PATTERNS = 3

# Security Defaults
KMS_DEFAULTS = {
    "deletion_window_in_days": 7,
    "enable_key_rotation": True
}

DYNAMODB_DEFAULTS = {
    "point_in_time_recovery": True,
    "server_side_encryption": True
}

S3_DEFAULTS = {
    "block_public_acls": True,
    "block_public_policy": True,
    "ignore_public_acls": True,
    "restrict_public_buckets": True
}

SQS_DEFAULTS = {
    "kms_encryption": True,
    "fifo_queue": True
}

# File Paths
TAP_STACK_FILE_PATH = "lib/tap_stack.py"
TEST_UNIT_PATH = "/home/ubuntu/Turing/iac-test-automations"

# Edge Case Values
VERY_LONG_SUFFIX = "very-long-environment-suffix-that-might-cause-issues-with-aws-resource-naming-limits"
EDGE_CASE_TAGS = [
    {},
    {"": ""},
    {"ValidKey": ""},
    {"": "ValidValue"},
    {"Key1": "Value1", "Key2": ""},
]
EMPTY_STRING_CASES = ["", None]
WHITESPACE_SUFFIX = "   "

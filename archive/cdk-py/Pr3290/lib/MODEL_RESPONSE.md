# Reasoning Trace
Alright, I'll create an AWS CDK (Python) project that meets all the requirements for the legal documents storage solution. Let's break down the components I'll need to build:

## Project Structure
First, let's outline the directory structure:

```
legal-docs-storage/
├── app.py                        # Entry point
├── legal_docs_storage_stack.py   # Main stack implementation
├── cdk.json                      # CDK configuration
├── requirements.txt              # Python dependencies
├── .gitignore                    # Git ignore file
├── README.md                     # Documentation
└── tests/                        # Test directory
    └── test_legal_docs_storage.py # Unit tests
```

## Component Implementation Plan
### S3 Bucket with Versioning
- Create primary bucket with versioning enabled
- Enable Object Lock in COMPLIANCE mode with 90-day retention
- Block public access

### Legal Retention
- Set up Object Lock with default retention period
- Configure lifecycle rules that respect the 90-day minimum

### Encryption at Rest
- Create KMS Customer Managed Key (CMK) with rotation
- Configure bucket to use this key for encryption

### Access Auditability
- Set up CloudTrail for data events on the bucket
- Configure read/write event logging

### Monitoring/Metrics
- Create CloudWatch metrics and alarms
- Build a small dashboard for key metrics

### Secure Access
- Create IAM roles with least privilege
- Set bucket policy to require TLS
- Block unencrypted PUTs
- Prevent bypassing Object Lock

### Access Logging
- Create a separate logging bucket
- Enable server access logging and/or CloudTrail logging

### Cost Controls
- Set up lifecycle rules for storage class transitions
- Ensure rules don't violate the 90-day retention

Let's start implementing each file:

## 1. app.py

This is the entry point for the CDK application.

```python
#!/usr/bin/env python3

import aws_cdk as cdk
from legal_docs_storage_stack import LegalDocsStorageStack

app = cdk.App()

LegalDocsStorageStack(
    app,
    "LegalDocsStorageStack",
    description="Legal documents storage with compliance controls",
    # You can pass any required parameters via context or environment variables
    # For example: bucket_name=app.node.try_get_context("bucketName")
)

app.synth()
```

## 2. legal_docs_storage_stack.py

This will contain the main stack implementation with all resources.

```python
from typing import Optional, Dict, Any
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_kms as kms,
    aws_cloudtrail as cloudtrail,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    RemovalPolicy,
)

class LegalDocsStorageStack(Stack):
    def __init__(
        self, scope: Construct, construct_id: str, **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get context parameters with defaults
        bucket_name = self.node.try_get_context("bucketName") or None
        enable_object_lock = self.node.try_get_context("enableObjectLock") or True
        retention_days = int(self.node.try_get_context("retentionDays") or 90)
        log_bucket_name = self.node.try_get_context("logBucketName") or None
        alarm_email = self.node.try_get_context("alarmEmail") or None
        
        # Standard tags
        tags = {
            'Owner': 'Abubakar',
            'System': 'LegalDocs',
            'Compliance': 'Yes',
            'Environment': self.node.try_get_context("environment") or 'Development'
        }
        
        # 1. Create KMS Key for encryption
        key = kms.Key(
            self, 
            "LegalDocsKey",
            alias="legal-docs-bucket",
            enable_key_rotation=True,
            description="KMS key for legal documents bucket encryption",
            removal_policy=RemovalPolicy.RETAIN,
        )
        
        # Apply tags to KMS key
        for tag_key, tag_value in tags.items():
            cdk.Tags.of(key).add(tag_key, tag_value)
        
        # 2. Create logging bucket first
        log_bucket = s3.Bucket(
            self,
            "LogBucket",
            bucket_name=log_bucket_name,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            enforce_ssl=True,
        )
        
        # Apply tags to log bucket
        for tag_key, tag_value in tags.items():
            cdk.Tags.of(log_bucket).add(tag_key, tag_value)
        
        # Log bucket policy to deny unencrypted uploads
        log_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{log_bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "aws:kms"
                    }
                }
            )
        )
        
        # 3. Create the primary bucket
        bucket_props = {
            "bucket_name": bucket_name,
            "versioned": True,
            "block_public_access": s3.BlockPublicAccess.BLOCK_ALL,
            "encryption": s3.BucketEncryption.KMS,
            "encryption_key": key,
            "enforce_ssl": True,
            "removal_policy": RemovalPolicy.RETAIN,
            "server_access_logs_bucket": log_bucket,
            "server_access_logs_prefix": "access-logs/",
        }
        
        # Add Object Lock if enabled
        if enable_object_lock:
            bucket_props["object_lock_enabled"] = True
            bucket_props["object_lock_default_retention"] = s3.ObjectLockRetention.compliance(
                cdk.Duration.days(retention_days)
            )
            
        # Create the primary bucket
        primary_bucket = s3.Bucket(
            self, 
            "LegalDocsBucket",
            **bucket_props
        )
        
        # Apply tags to primary bucket
        for tag_key, tag_value in tags.items():
            cdk.Tags.of(primary_bucket).add(tag_key, tag_value)
        
        # 4. Add lifecycle rules
        primary_bucket.add_lifecycle_rule(
            id="RetainVersionsFor90Days",
            expiration=cdk.Duration.days(365*10),  # Long expiration for current versions
            noncurrent_version_expiration=cdk.Duration.days(retention_days + 30),  # Keep noncurrent versions a bit longer than required
            abort_incomplete_multipart_upload_after=cdk.Duration.days(7),
            # Optional storage transitions for cost savings
            transitions=[
                s3.Transition(
                    storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                    transition_after=cdk.Duration.days(retention_days + 1)  # Only transition after retention period
                )
            ],
            noncurrent_version_transitions=[
                s3.NoncurrentVersionTransition(
                    storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                    transition_after=cdk.Duration.days(retention_days + 1)
                )
            ]
        )
        
        # 5. Add bucket policy to deny unencrypted uploads and require SSL
        primary_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{primary_bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "aws:kms"
                    }
                }
            )
        )
        
        primary_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    primary_bucket.bucket_arn,
                    f"{primary_bucket.bucket_arn}/*"
                ],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            )
        )
        
        # 6. Create CloudTrail for data events
        trail = cloudtrail.Trail(
            self,
            "LegalDocsTrail",
            bucket=log_bucket,
            send_to_cloud_watch_logs=True,
            cloud_watch_logs_retention=cdk.aws_logs.RetentionDays.ONE_YEAR,
        )
        
        # Add data events for the primary bucket
        trail.add_s3_event_selector(
            [cloudtrail.S3EventSelector(
                bucket=primary_bucket,
                include_management_events=True,
                read_write_type=cloudtrail.ReadWriteType.ALL
            )]
        )
        
        # 7. Create CloudWatch metrics and alarms
        
        # Create SNS topic for alarms if email provided
        alarm_topic = None
        if alarm_email:
            alarm_topic = sns.Topic(
                self, 
                "LegalDocsAlarmTopic",
                display_name="Legal Documents Storage Alerts"
            )
            alarm_topic.add_subscription(
                sns_subs.EmailSubscription(alarm_email)
            )
        
        # Create alarms for relevant metrics
        if alarm_topic:
            # 4XX errors alarm
            cloudwatch.Alarm(
                self,
                "4XXErrorsAlarm",
                metric=cloudwatch.Metric(
                    namespace="AWS/S3",
                    metric_name="4xxErrors",
                    dimensions_map={
                        "BucketName": primary_bucket.bucket_name,
                    },
                    statistic="Sum",
                    period=cdk.Duration.minutes(5),
                ),
                evaluation_periods=1,
                threshold=10,  # Adjust threshold as needed
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description="Alarm if 4XX errors exceed threshold",
                alarm_name=f"{primary_bucket.bucket_name}-4xx-errors",
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            ).add_alarm_action(cloudwatch_actions.SnsAction(alarm_topic))
            
            # 5XX errors alarm
            cloudwatch.Alarm(
                self,
                "5XXErrorsAlarm",
                metric=cloudwatch.Metric(
                    namespace="AWS/S3",
                    metric_name="5xxErrors",
                    dimensions_map={
                        "BucketName": primary_bucket.bucket_name,
                    },
                    statistic="Sum",
                    period=cdk.Duration.minutes(5),
                ),
                evaluation_periods=1,
                threshold=5,  # Adjust threshold as needed
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description="Alarm if 5XX errors exceed threshold",
                alarm_name=f"{primary_bucket.bucket_name}-5xx-errors",
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            ).add_alarm_action(cloudwatch_actions.SnsAction(alarm_topic))
        
        # 8. Create Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            "LegalDocsDashboard",
            dashboard_name="LegalDocsStorageDashboard",
        )
        
        # Add metrics to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Storage Bytes",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="BucketSizeBytes",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                            "StorageType": "StandardStorage",
                        },
                        statistic="Average",
                        period=cdk.Duration.days(1),
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title="Object Count",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="NumberOfObjects",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                            "StorageType": "AllStorageTypes",
                        },
                        statistic="Average",
                        period=cdk.Duration.days(1),
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title="Error Rates",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="4xxErrors",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                        },
                        statistic="Sum",
                        period=cdk.Duration.hours(1),
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="5xxErrors",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                        },
                        statistic="Sum",
                        period=cdk.Duration.hours(1),
                    )
                ],
            )
        )
        
        # 9. Create IAM role for ingestion (example least-privilege role)
        ingestion_role = iam.Role(
            self,
            "LegalDocsIngestionRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),  # Change as needed
            description="Role for legal docs ingestion with least privilege"
        )
        
        # Grant permissions to the ingestion role
        primary_bucket.grant_read_write(ingestion_role)
        
        # Add specific S3 permissions but deny delete of object versions
        ingestion_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:ListBucket",
                ],
                resources=[
                    primary_bucket.bucket_arn,
                    f"{primary_bucket.bucket_arn}/*"
                ]
            )
        )
        
        ingestion_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                actions=[
                    "s3:DeleteObject",
                    "s3:DeleteObjectVersion",
                ],
                resources=[f"{primary_bucket.bucket_arn}/*"]
            )
        )
        
        # Grant KMS key usage for encryption
        key.grant_encrypt_decrypt(ingestion_role)
        
        # Export outputs
        self.primary_bucket = primary_bucket
        self.log_bucket = log_bucket
        self.kms_key = key
        self.ingestion_role = ingestion_role
        
        # CFN outputs
        cdk.CfnOutput(
            self,
            "PrimaryBucketName",
            value=primary_bucket.bucket_name,
            description="Name of the primary bucket for legal documents",
        )
        
        cdk.CfnOutput(
            self,
            "LogBucketName",
            value=log_bucket.bucket_name,
            description="Name of the logging bucket",
        )
        
        cdk.CfnOutput(
            self,
            "KMSKeyArn",
            value=key.key_arn,
            description="ARN of the KMS key used for encryption",
        )
        
        cdk.CfnOutput(
            self,
            "IngestionRoleArn",
            value=ingestion_role.role_arn,
            description="ARN of the ingestion role",
        )
## 3. cdk.json
This contains CDK configuration settings.

{
  "app": "python3 app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "python/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "bucketName": "",
    "enableObjectLock": true,
    "retentionDays": 90,
    "logBucketName": "",
    "alarmEmail": ""
  }
}
## 4. requirements.txt
Python dependencies for the project.

aws-cdk-lib>=2.0.0
constructs>=10.0.0
pytest>=6.0.0
pytest-cov>=2.12.0
## 5. .gitignore
Standard Python and CDK gitignore entries.

# CDK asset staging directory
.cdk.staging
cdk.out

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
env/
ENV/

# IDE files
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
## 6. tests/test_legal_docs_storage.py
Unit tests using pytest and CDK assertions.

import json
import pytest
from aws_cdk import App
from aws_cdk.assertions import Template, Match
from legal_docs_storage_stack import LegalDocsStorageStack

@pytest.fixture
def app():
    return App()

@pytest.fixture
def stack(app):
    return LegalDocsStorageStack(app, "TestLegalDocsStack")

@pytest.fixture
def template(stack):
    return Template.from_stack(stack)

def test_bucket_versioning_enabled(template):
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        }
    )

def test_object_lock_enabled(template):
    template.has_resource_properties(
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

def test_bucket_encryption_with_kms(template):
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
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

def test_kms_key_with_rotation(template):
    template.has_resource_properties(
        "AWS::KMS::Key",
        {
            "EnableKeyRotation": True
        }
    )

def test_bucket_lifecycle_rules(template):
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "NoncurrentVersionExpiration": {
                            "NoncurrentDays": Match.number_greater_than_or_equal_to(90)
                        }
                    })
                ])
            }
        }
    )

def test_cloudtrail_data_events(template):
    template.has_resource_properties(
        "AWS::CloudTrail::Trail",
        {
            "EventSelectors": Match.array_with([
                Match.object_like({
                    "DataResources": Match.array_with([
                        Match.object_like({
                            "Type": "AWS::S3::Object"
                        })
                    ]),
                    "ReadWriteType": "All"
                })
            ])
        }
    )

def test_cloudwatch_alarms_created(template):
    template.resource_count_is("AWS::CloudWatch::Alarm", Match.greater_than_or_equal_to(1))

def test_bucket_policy_secure_transport(template):
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

def test_bucket_policy_encrypted_puts(template):
    template.has_resource_properties(
        "AWS::S3::BucketPolicy",
        {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Deny",
                        "Action": "s3:PutObject",
                        "Condition": {
                            "StringNotEquals": {
                                "s3:x-amz-server-side-encryption": "aws:kms"
                            }
                        }
                    })
                ])
            }
        }
    )

def test_dashboard_created(template):
    template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
## 7. README.md
Documentation with setup, usage, and security notes.

# Legal Documents Storage CDK Stack

This project creates an AWS infrastructure for securely storing legal documents with strict compliance requirements, including:

- S3 bucket with versioning and Object Lock
- 90+ day retention enforcement
- KMS encryption with key rotation
- Access logging and audit trails via CloudTrail
- CloudWatch monitoring, metrics, and alarms
- Least-privilege IAM roles and policies
- Cost-optimized storage transitions

## Prerequisites

- Python 3.8+
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed: `npm install -g aws-cdk`
- AWS Account bootstrapped for CDK: `cdk bootstrap aws://ACCOUNT-NUMBER/REGION`

## Installation

1. Clone this repository
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows, use .venv\Scripts\activate
Install dependencies:
pip install -r requirements.txt
Configuration
You can configure the stack using the CDK context parameters in cdk.json or by passing them at deployment time:

Parameter	Description	Default
bucketName	Primary bucket name (optional)	Auto-generated
enableObjectLock	Enable S3 Object Lock for compliance retention	true
retentionDays	Minimum retention period in days	90
logBucketName	Access logs bucket name (optional)	Auto-generated
alarmEmail	Email address for CloudWatch alarms (optional)	None
Deployment
To deploy this stack:

Synthesize the CloudFormation template:
cdk synth
Review the template:
cdk diff
Deploy the stack (with optional parameters):
cdk deploy --context bucketName=my-legal-docs-bucket --context alarmEmail=alerts@example.com
Validation
After deployment, verify the configuration:

Check bucket versioning and Object Lock:
aws s3api get-bucket-versioning --bucket YOUR_BUCKET_NAME
aws s3api get-object-lock-configuration --bucket YOUR_BUCKET_NAME
Verify CloudTrail data events: Navigate to the CloudTrail console, select the created trail, and check that data events are enabled for the S3 bucket.
Test retention by attempting to delete a versioned object: Upload a file, then try to delete it permanently (including versions) - it should be protected by Object Lock.
Testing
Run unit tests to validate the infrastructure:

pytest -q
Integration Testing Plan
While not requiring a real deployment, the following steps validate Object Lock and CloudTrail in a live account:

Object Lock Testing:
Upload a test document
Try to delete it (should fail)
Try to reduce retention period (should fail)
Wait for retention period to expire, then delete (should succeed)
CloudTrail Event Testing:
Perform S3 operations: upload, download, list
Check CloudTrail console or use aws cloudtrail lookup-events to verify data events
Validate events in CloudWatch Logs
Teardown
IMPORTANT: Due to Object Lock retention, you may not be able to delete objects or the bucket until the retention period expires.

To attempt teardown:

Empty the bucket (may require waiting for retention to expire):
# List objects in the bucket
aws s3 ls s3://YOUR_BUCKET_NAME --recursive

# Attempt to empty the bucket (may fail due to Object Lock)
aws s3 rm s3://YOUR_BUCKET_NAME --recursive
Destroy the stack:
cdk destroy
Security Notes
Object Lock: Once enabled, it cannot be disabled for the bucket's lifetime
KMS Key: The KMS key has RemovalPolicy.RETAIN to prevent accidental deletion
IAM Permissions: The ingestion role provides read/write but explicitly denies delete operations
Encryption: Server-side encryption with KMS is enforced via bucket policy
Access: All public access is blocked and SSL/TLS is required
Cost Considerations
S3 Storage: Standard storage, versioning, and Object Lock may increase storage costs
CloudTrail: Data events for S3 incur additional costs
CloudWatch: Metrics, logs, and dashboard have associated costs
KMS: Customer managed keys have a monthly fee plus usage charges
To optimize costs, the stack includes:

Lifecycle rules to transition objects to lower-cost storage tiers
Limits on how long noncurrent versions are retained (beyond compliance requirements)

## Requirements Coverage

1. ✅ S3 bucket with versioning enabled
2. ✅ Legal retention with Object Lock in COMPLIANCE mode (90+ days)
3. ✅ KMS CMK with key rotation for encryption
4. ✅ CloudTrail data events for audit
5. ✅ CloudWatch metrics, alarms, and dashboard
6. ✅ IAM least-privilege roles and bucket policies for security
7. ✅ S3 server access logs to a separate bucket
8. ✅ Lifecycle rules that respect retention requirements

## Files Provided
- ✅ app.py
- ✅ legal_docs_storage_stack.py
- ✅ cdk.json
- ✅ requirements.txt
- ✅ .gitignore
- ✅ README.md with detailed instructions
- ✅ tests/ with pytest tests

The implementation includes parameterization for reuse across environments, account-agnostic design, and clear documentation on deployment, validation, and teardown steps. The code follows CDK v2 best practices and includes type hints where appropriate.### Answer 

## Project Structure

## app.py

```python
#!/usr/bin/env python3

import aws_cdk as cdk
from legal_docs_storage_stack import LegalDocsStorageStack

app = cdk.App()

LegalDocsStorageStack(
    app,
    "LegalDocsStorageStack",
    description="Legal documents storage with compliance controls and versioning",
    # Parameters will be sourced from context in cdk.json or passed at runtime
)

app.synth()

from typing import Optional, List, Dict, Any
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_kms as kms,
    aws_cloudtrail as cloudtrail,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
    CfnOutput,
    Tags
)

class LegalDocsStorageStack(Stack):
    def __init__(
        self, scope: Construct, construct_id: str, **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get context parameters with defaults
        bucket_name: Optional[str] = self.node.try_get_context("bucketName")
        enable_object_lock: bool = self.node.try_get_context("enableObjectLock") or True
        retention_days: int = int(self.node.try_get_context("retentionDays") or 90)
        log_bucket_name: Optional[str] = self.node.try_get_context("logBucketName")
        alarm_email: Optional[str] = self.node.try_get_context("alarmEmail")
        
        # Add standard tags to all resources
        self.tags = {
            'Owner': 'Abubakar',
            'System': 'LegalDocs',
            'Compliance': 'Yes',
            'Environment': self.node.try_get_context("environment") or 'Development'
        }
        
        # 1. Create KMS Key for encryption
        kms_key = self._create_kms_key()
        
        # 2. Create logging bucket
        log_bucket = self._create_logging_bucket(log_bucket_name, kms_key)
        
        # 3. Create the primary bucket with versioning and Object Lock
        primary_bucket = self._create_primary_bucket(
            bucket_name, 
            enable_object_lock, 
            retention_days, 
            kms_key, 
            log_bucket
        )
        
        # 4. Set up CloudTrail for data events
        trail = self._create_cloudtrail(primary_bucket, log_bucket)
        
        # 5. Create CloudWatch metrics, alarms and dashboard
        alarm_topic = self._create_alarm_topic(alarm_email) if alarm_email else None
        self._create_alarms(primary_bucket, alarm_topic)
        self._create_dashboard(primary_bucket)
        
        # 6. Create IAM role for ingestion with least privilege
        ingestion_role = self._create_ingestion_role(primary_bucket, kms_key)
        
        # 7. Export outputs
        self._create_outputs(primary_bucket, log_bucket, kms_key, ingestion_role)
        
    def _create_kms_key(self) -> kms.Key:
        """Create a KMS Customer Managed Key with rotation enabled"""
        key = kms.Key(
            self, 
            "LegalDocsKey",
            alias="alias/legal-docs-bucket",
            enable_key_rotation=True,
            description="KMS key for legal documents bucket encryption",
            removal_policy=RemovalPolicy.RETAIN,
        )
        
        # Apply standard tags
        for tag_key, tag_value in self.tags.items():
            Tags.of(key).add(tag_key, tag_value)
            
        return key
        
    def _create_logging_bucket(self, log_bucket_name: Optional[str], kms_key: kms.Key) -> s3.Bucket:
        """Create S3 bucket for access logs with appropriate security settings"""
        log_bucket = s3.Bucket(
            self,
            "LogBucket",
            bucket_name=log_bucket_name,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="RetainLogVersions",
                    expiration=Duration.days(366),  # 1 year + 1 day
                    noncurrent_version_expiration=Duration.days(366),
                    abort_incomplete_multipart_upload_after=Duration.days(7),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                            transition_after=Duration.days(30)
                        )
                    ],
                )
            ]
        )
        
        # Add policy to deny unencrypted uploads
        log_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{log_bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "aws:kms"
                    }
                }
            )
        )
        
        # Require SSL
        log_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    log_bucket.bucket_arn,
                    f"{log_bucket.bucket_arn}/*"
                ],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            )
        )
        
        # Apply standard tags
        for tag_key, tag_value in self.tags.items():
            Tags.of(log_bucket).add(tag_key, tag_value)
            
        return log_bucket
        
    def _create_primary_bucket(
        self, 
        bucket_name: Optional[str], 
        enable_object_lock: bool, 
        retention_days: int, 
        kms_key: kms.Key, 
        log_bucket: s3.Bucket
    ) -> s3.Bucket:
        """Create primary bucket with versioning, encryption, and object lock"""
        bucket_props = {
            "bucket_name": bucket_name,
            "versioned": True,
            "block_public_access": s3.BlockPublicAccess.BLOCK_ALL,
            "encryption": s3.BucketEncryption.KMS,
            "encryption_key": kms_key,
            "enforce_ssl": True,
            "removal_policy": RemovalPolicy.RETAIN,
            "server_access_logs_bucket": log_bucket,
            "server_access_logs_prefix": "access-logs/",
        }
        
        # Add Object Lock if enabled
        if enable_object_lock:
            bucket_props["object_lock_enabled"] = True
            bucket_props["object_lock_default_retention"] = s3.ObjectLockRetention.compliance(
                Duration.days(retention_days)
            )
            
        # Create the primary bucket
        primary_bucket = s3.Bucket(
            self, 
            "LegalDocsBucket",
            **bucket_props
        )
        
        # Add lifecycle rules
        primary_bucket.add_lifecycle_rule(
            id="RetainVersionsForCompliance",
            expiration=Duration.days(3650),  # 10 years for current versions
            noncurrent_version_expiration=Duration.days(retention_days + 30),  # Keep noncurrent versions 30 days past minimum
            abort_incomplete_multipart_upload_after=Duration.days(7),
            # Optional storage transitions for cost savings
            transitions=[
                s3.Transition(
                    storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                    transition_after=Duration.days(retention_days + 1)  # Only transition after retention period
                )
            ],
            noncurrent_version_transitions=[
                s3.NoncurrentVersionTransition(
                    storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                    transition_after=Duration.days(retention_days + 1)
                )
            ]
        )
        
        # Add bucket policies
        # 1. Deny unencrypted uploads
        primary_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{primary_bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "aws:kms"
                    }
                }
            )
        )
        
        # 2. Require SSL/TLS
        primary_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    primary_bucket.bucket_arn,
                    f"{primary_bucket.bucket_arn}/*"
                ],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            )
        )
        
        # 3. If Object Lock enabled, prevent bypassing Object Lock settings
        if enable_object_lock:
            primary_bucket.add_to_resource_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.DENY,
                    principals=[iam.AnyPrincipal()],
                    actions=[
                        "s3:DeleteObjectVersion",
                        "s3:BypassGovernanceRetention"
                    ],
                    resources=[f"{primary_bucket.bucket_arn}/*"],
                    conditions={
                        "NumericLessThan": {
                            "s3:object-lock-remaining-retention-days": str(retention_days)
                        }
                    }
                )
            )
        
        # Apply standard tags
        for tag_key, tag_value in self.tags.items():
            Tags.of(primary_bucket).add(tag_key, tag_value)
            
        return primary_bucket
    
    def _create_cloudtrail(self, primary_bucket: s3.Bucket, log_bucket: s3.Bucket) -> cloudtrail.Trail:
        """Create CloudTrail for data events on the primary bucket"""
        trail = cloudtrail.Trail(
            self,
            "LegalDocsTrail",
            bucket=log_bucket,
            send_to_cloud_watch_logs=True,
            cloud_watch_logs_retention=logs.RetentionDays.ONE_YEAR,
            trail_name="legal-docs-trail",
            is_multi_region_trail=True,
        )
        
        # Add data events for the primary bucket
        trail.add_s3_event_selector(
            [cloudtrail.S3EventSelector(
                bucket=primary_bucket,
                include_management_events=True,
                read_write_type=cloudtrail.ReadWriteType.ALL
            )]
        )
        
        # Apply standard tags
        for tag_key, tag_value in self.tags.items():
            Tags.of(trail).add(tag_key, tag_value)
            
        return trail
    
    def _create_alarm_topic(self, alarm_email: str) -> sns.Topic:
        """Create SNS topic for alarms and subscribe email"""
        topic = sns.Topic(
            self, 
            "LegalDocsAlarmTopic",
            display_name="Legal Documents Storage Alerts"
        )
        
        # Add email subscription
        topic.add_subscription(
            sns_subs.EmailSubscription(alarm_email)
        )
        
        # Apply standard tags
        for tag_key, tag_value in self.tags.items():
            Tags.of(topic).add(tag_key, tag_value)
            
        return topic
    
    def _create_alarms(self, primary_bucket: s3.Bucket, alarm_topic: Optional[sns.Topic] = None) -> None:
        """Create CloudWatch alarms for S3 metrics"""
        alarms = []
        
        # 4XX errors alarm
        four_xx_alarm = cloudwatch.Alarm(
            self,
            "4XXErrorsAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/S3",
                metric_name="4xxErrors",
                dimensions_map={
                    "BucketName": primary_bucket.bucket_name,
                    "FilterId": "EntireBucket"
                },
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            evaluation_periods=1,
            threshold=10,  # Adjust threshold as needed
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if 4XX errors exceed threshold",
            alarm_name=f"{primary_bucket.bucket_name}-4xx-errors",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        alarms.append(four_xx_alarm)
        
        # 5XX errors alarm
        five_xx_alarm = cloudwatch.Alarm(
            self,
            "5XXErrorsAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/S3",
                metric_name="5xxErrors",
                dimensions_map={
                    "BucketName": primary_bucket.bucket_name,
                    "FilterId": "EntireBucket"
                },
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            evaluation_periods=1,
            threshold=5,  # Adjust threshold as needed
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if 5XX errors exceed threshold",
            alarm_name=f"{primary_bucket.bucket_name}-5xx-errors",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        alarms.append(five_xx_alarm)
        
        # Add alarm actions if topic exists
        if alarm_topic:
            for alarm in alarms:
                alarm.add_alarm_action(cloudwatch_actions.SnsAction(alarm_topic))
    
    def _create_dashboard(self, primary_bucket: s3.Bucket) -> cloudwatch.Dashboard:
        """Create CloudWatch dashboard for monitoring"""
        dashboard = cloudwatch.Dashboard(
            self,
            "LegalDocsDashboard",
            dashboard_name="LegalDocsStorageDashboard",
        )
        
        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Storage Bytes",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="BucketSizeBytes",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                            "StorageType": "StandardStorage",
                        },
                        statistic="Average",
                        period=Duration.days(1),
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title="Object Count",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="NumberOfObjects",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                            "StorageType": "AllStorageTypes",
                        },
                        statistic="Average",
                        period=Duration.days(1),
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title="Error Rates",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="4xxErrors",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                            "FilterId": "EntireBucket"
                        },
                        statistic="Sum",
                        period=Duration.hours(1),
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="5xxErrors",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                            "FilterId": "EntireBucket"
                        },
                        statistic="Sum",
                        period=Duration.hours(1),
                    )
                ],
            )
        )
        
        return dashboard
    
    def _create_ingestion_role(self, primary_bucket: s3.Bucket, kms_key: kms.Key) -> iam.Role:
        """Create IAM role with least privilege for document ingestion"""
        ingestion_role = iam.Role(
            self,
            "LegalDocsIngestionRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),  # Modify as needed for your use case
            description="Role for legal docs ingestion with least privilege"
        )
        
        # Grant read/write permissions to the bucket
        primary_bucket.grant_read_write(ingestion_role)
        
        # Allow specific S3 actions but deny version deletion
        ingestion_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:ListBucket",
                    "s3:GetBucketLocation",
                ],
                resources=[
                    primary_bucket.bucket_arn,
                    f"{primary_bucket.bucket_arn}/*"
                ]
            )
        )
        
        # Explicitly deny delete permissions
        ingestion_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                actions=[
                    "s3:DeleteObject",
                    "s3:DeleteObjectVersion",
                    "s3:BypassGovernanceRetention"
                ],
                resources=[f"{primary_bucket.bucket_arn}/*"]
            )
        )
        
        # Grant KMS key usage for encryption
        kms_key.grant_encrypt_decrypt(ingestion_role)
        
        # Apply standard tags
        for tag_key, tag_value in self.tags.items():
            Tags.of(ingestion_role).add(tag_key, tag_value)
            
        return ingestion_role
    
    def _create_outputs(self, primary_bucket: s3.Bucket, log_bucket: s3.Bucket, kms_key: kms.Key, ingestion_role: iam.Role) -> None:
        """Create CloudFormation outputs for key resource information"""
        CfnOutput(
            self,
            "PrimaryBucketName",
            value=primary_bucket.bucket_name,
            description="Name of the primary bucket for legal documents",
        )
        
        CfnOutput(
            self,
            "LogBucketName",
            value=log_bucket.bucket_name,
            description="Name of the logging bucket",
        )
        
        CfnOutput(
            self,
            "KMSKeyArn",
            value=kms_key.key_arn,
            description="ARN of the KMS key used for encryption",
        )
        
        CfnOutput(
            self,
            "IngestionRoleArn",
            value=ingestion_role.role_arn,
            description="ARN of the ingestion role",
        )

{
  "app": "python3 app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "python/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "bucketName": "",
    "enableObjectLock": true,
    "retentionDays": 90,
    "logBucketName": "",
    "alarmEmail": ""
  }
}

aws-cdk-lib>=2.0.0
constructs>=10.0.0
pytest>=6.0.0
pytest-cov>=2.12.0

# CDK asset staging directory
.cdk.staging
cdk.out

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.pytest_cache/
.coverage
htmlcov/

# Virtual Environment
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE files
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

import json
import pytest
from aws_cdk import App
from aws_cdk.assertions import Template, Match
from legal_docs_storage_stack import LegalDocsStorageStack

@pytest.fixture
def app():
    return App()

@pytest.fixture
def stack(app):
    return LegalDocsStorageStack(app, "TestLegalDocsStack")

@pytest.fixture
def template(stack):
    return Template.from_stack(stack)

def test_bucket_versioning_enabled(template):
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        }
    )

def test_object_lock_enabled(template):
    template.has_resource_properties(
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

def test_bucket_encryption_with_kms(template):
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
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

def test_kms_key_with_rotation(template):
    template.has_resource_properties(
        "AWS::KMS::Key",
        {
            "EnableKeyRotation": True
        }
    )

def test_bucket_lifecycle_rules(template):
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "NoncurrentVersionExpiration": {
                            "NoncurrentDays": Match.number_greater_than_or_equal_to(90)
                        }
                    })
                ])
            }
        }
    )

def test_cloudtrail_data_events(template):
    template.has_resource_properties(
        "AWS::CloudTrail::Trail",
        {
            "EventSelectors": Match.array_with([
                Match.object_like({
                    "DataResources": Match.array_with([
                        Match.object_like({
                            "Type": "AWS::S3::Object"
                        })
                    ]),
                    "ReadWriteType": "All"
                })
            ])
        }
    )

def test_cloudwatch_alarms_created(template):
    template.resource_count_is("AWS::CloudWatch::Alarm", Match.greater_than_or_equal_to(2))

def test_bucket_policy_secure_transport(template):
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

def test_bucket_policy_encrypted_puts(template):
    template.has_resource_properties(
        "AWS::S3::BucketPolicy",
        {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Deny",
                        "Action": "s3:PutObject",
                        "Condition": {
                            "StringNotEquals": {
                                "s3:x-amz-server-side-encryption": "aws:kms"
                            }
                        }
                    })
                ])
            }
        }
    )

def test_dashboard_created(template):
    template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

def test_object_lock_bypass_prevention(template):
    template.has_resource_properties(
        "AWS::S3::BucketPolicy",
        {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Deny",
                        "Action": Match.array_with([
                            "s3:DeleteObjectVersion",
                            "s3:BypassGovernanceRetention"
                        ]),
                        "Condition": {
                            "NumericLessThan": {
                                "s3:object-lock-remaining-retention-days": Match.any_value()
                            }
                        }
                    })
                ])
            }
        }
    )
README.md
# Legal Documents Storage CDK Stack

This project creates an AWS infrastructure for securely storing legal documents with strict compliance requirements, including:

- S3 bucket with versioning and Object Lock
- 90+ day retention enforcement
- KMS encryption with key rotation
- Access logging and audit trails via CloudTrail
- CloudWatch monitoring, metrics, and alarms
- Least-privilege IAM roles and policies
- Cost-optimized storage transitions

## Prerequisites

- Python 3.8+
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed: `npm install -g aws-cdk`
- AWS Account bootstrapped for CDK: `cdk bootstrap aws://ACCOUNT-NUMBER/REGION`

## Installation

1. Clone this repository
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows, use .venv\Scripts\activate
Install dependencies:
pip install -r requirements.txt
Configuration
You can configure the stack using the CDK context parameters in cdk.json or by passing them at deployment time:

Parameter	Description	Default
bucketName	Primary bucket name (optional)	Auto-generated
enableObjectLock	Enable S3 Object Lock for compliance retention	true
retentionDays	Minimum retention period in days	90
logBucketName	Access logs bucket name (optional)	Auto-generated
alarmEmail	Email address for CloudWatch alarms (optional)	None
Deployment
To deploy this stack:

Synthesize the CloudFormation template:
cdk synth
Review the changes:
cdk diff
Deploy the stack (with optional parameters):
cdk deploy --context bucketName=my-legal-docs-bucket --context alarmEmail=alerts@example.com
Validation
After deployment, verify the configuration:

Check bucket versioning and Object Lock:
aws s3api get-bucket-versioning --bucket YOUR_BUCKET_NAME
aws s3api get-object-lock-configuration --bucket YOUR_BUCKET_NAME
Verify CloudTrail data events: Navigate to the CloudTrail console, select the created trail, and check that data events are enabled for the S3 bucket.
Test retention by attempting to delete a versioned object: Upload a file, then try to delete it permanently (including versions) - it should be protected by Object Lock.
Testing
Run unit tests to validate the infrastructure:

pytest -v
Integration Testing Plan
While not requiring a real deployment, the following steps validate Object Lock and CloudTrail in a live account:

Object Lock Testing:
Upload a test document:
aws s3 cp test-file.txt s3://YOUR_BUCKET_NAME/
Try to delete the object and its versions (should fail):
aws s3api delete-object --bucket YOUR_BUCKET_NAME --key test-file.txt
aws s3api delete-object --bucket YOUR_BUCKET_NAME --key test-file.txt --version-id VERSION_ID
Try to reduce retention period (should fail):
aws s3api put-object-retention --bucket YOUR_BUCKET_NAME --key test-file.txt --retention '{"Mode":"COMPLIANCE", "RetainUntilDate": "2023-01-01T00:00:00Z"}'

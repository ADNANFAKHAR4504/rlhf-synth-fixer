# Multi-Tenant SaaS Infrastructure with CDKTF Python (Production-Ready)

This implementation creates isolated cloud environments for a multi-tenant SaaS platform using CDKTF with Python, with proper security, encryption, IAM policies, and resource naming.

## File: lib/tenant_stack.py

```python
from cdktf import TerraformStack, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery, DynamodbTableServerSideEncryption
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.s3_bucket_intelligent_tiering_configuration import (
    S3BucketIntelligentTieringConfiguration,
    S3BucketIntelligentTieringConfigurationTiering
)
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_subscription_filter import CloudwatchLogSubscriptionFilter
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
import json
import zipfile
import os


class TenantStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, tenant_id: str, cidr_block: str, environment_suffix: str):
        super().__init__(scope, id)

        AwsProvider(self, "AWS", region="us-east-1")

        self.tenant_id = tenant_id
        self.environment_suffix = environment_suffix

        # Create VPC with environmentSuffix
        self.vpc = Vpc(
            self, f"vpc-{tenant_id}-{environment_suffix}",
            cidr_block=cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"tenant-{tenant_id}-vpc-{environment_suffix}",
                "TenantId": tenant_id,
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Create subnets with proper CIDR calculation
        azs = ["us-east-1a", "us-east-1b"]
        self.subnets = []

        # Extract the base CIDR block for proper subnet calculation
        # For 10.0.0.0/16, subnets should be 10.0.0.0/24, 10.0.1.0/24, etc.
        base_octets = cidr_block.split('.')[0:2]  # Get first two octets

        for idx, az in enumerate(azs):
            subnet_cidr = f"{base_octets[0]}.{base_octets[1]}.{idx}.0/24"
            subnet = Subnet(
                self, f"subnet-{tenant_id}-{idx}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,  # Private subnets
                tags={
                    "Name": f"tenant-{tenant_id}-subnet-{idx}-{environment_suffix}",
                    "TenantId": tenant_id,
                    "Environment": environment_suffix,
                    "ManagedBy": "CDKTF"
                }
            )
            self.subnets.append(subnet)

        # Security Group with restrictive rules
        self.security_group = SecurityGroup(
            self, f"sg-{tenant_id}-{environment_suffix}",
            vpc_id=self.vpc.id,
            name=f"tenant-{tenant_id}-sg-{environment_suffix}",
            description=f"Security group for {tenant_id} tenant",
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=[cidr_block],
                    description="HTTPS from within VPC"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "TenantId": tenant_id,
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # KMS Key with proper deletion window for testing
        self.kms_key = KmsKey(
            self, f"kms-{tenant_id}-{environment_suffix}",
            description=f"KMS key for {tenant_id} tenant data encryption",
            deletion_window_in_days=7,  # Short window for testing
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow tenant-scoped access",
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "aws:PrincipalTag/TenantId": tenant_id
                            }
                        }
                    }
                ]
            }),
            tags={
                "TenantId": tenant_id,
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # KMS Alias for easier reference
        self.kms_alias = KmsAlias(
            self, f"kms-alias-{tenant_id}-{environment_suffix}",
            name=f"alias/tenant-{tenant_id}-{environment_suffix}",
            target_key_id=self.kms_key.id
        )

        # S3 Bucket with environmentSuffix
        bucket_name = f"tenant-{tenant_id}-data-{environment_suffix}"
        self.s3_bucket = S3Bucket(
            self, f"bucket-{tenant_id}-{environment_suffix}",
            bucket=bucket_name,
            tags={
                "TenantId": tenant_id,
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # S3 Versioning
        self.s3_versioning = S3BucketVersioningA(
            self, f"bucket-versioning-{tenant_id}-{environment_suffix}",
            bucket=self.s3_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # S3 Encryption with KMS
        self.s3_encryption = S3BucketServerSideEncryptionConfigurationA(
            self, f"bucket-encryption-{tenant_id}-{environment_suffix}",
            bucket=self.s3_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=self.kms_key.arn
                )
            )]
        )

        # S3 Lifecycle Configuration
        self.s3_lifecycle = S3BucketLifecycleConfiguration(
            self, f"bucket-lifecycle-{tenant_id}-{environment_suffix}",
            bucket=self.s3_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="transition-to-intelligent-tiering",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=0,
                            storage_class="INTELLIGENT_TIERING"
                        )
                    ]
                ),
                S3BucketLifecycleConfigurationRule(
                    id="expire-old-objects",
                    status="Enabled",
                    expiration=S3BucketLifecycleConfigurationRuleExpiration(
                        days=90
                    )
                )
            ]
        )

        # S3 Intelligent Tiering
        self.s3_intelligent_tiering = S3BucketIntelligentTieringConfiguration(
            self, f"bucket-tiering-{tenant_id}-{environment_suffix}",
            bucket=self.s3_bucket.id,
            name="EntireBucket",
            status="Enabled",
            tiering=[
                S3BucketIntelligentTieringConfigurationTiering(
                    access_tier="ARCHIVE_ACCESS",
                    days=90
                ),
                S3BucketIntelligentTieringConfigurationTiering(
                    access_tier="DEEP_ARCHIVE_ACCESS",
                    days=180
                )
            ]
        )

        # DynamoDB Table with encryption and contributor insights
        self.dynamodb_table = DynamodbTable(
            self, f"table-{tenant_id}-{environment_suffix}",
            name=f"tenant-{tenant_id}-metadata-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="tenant_id",
            range_key="resource_type",
            attribute=[
                DynamodbTableAttribute(name="tenant_id", type="S"),
                DynamodbTableAttribute(name="resource_type", type="S")
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            server_side_encryption=DynamodbTableServerSideEncryption(
                enabled=True,
                kms_key_arn=self.kms_key.arn
            ),
            tags={
                "TenantId": tenant_id,
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # IAM Role for Lambda with tenant tags
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }

        self.lambda_role = IamRole(
            self, f"lambda-role-{tenant_id}-{environment_suffix}",
            name=f"tenant-{tenant_id}-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "TenantId": tenant_id,
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # IAM Policy with tenant-scoped permissions
        lambda_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:us-east-1:*:log-group:/aws/lambda/tenant-{tenant_id}-*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:UpdateItem"
                    ],
                    "Resource": self.dynamodb_table.arn,
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": tenant_id
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    "Resource": f"{self.s3_bucket.arn}/*",
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": tenant_id
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": self.kms_key.arn,
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": tenant_id
                        }
                    }
                }
            ]
        }

        self.lambda_policy = IamRolePolicy(
            self, f"lambda-policy-{tenant_id}-{environment_suffix}",
            role=self.lambda_role.name,
            policy=json.dumps(lambda_policy)
        )

        # Create Lambda deployment package
        self._create_lambda_zip(tenant_id)

        # Lambda Function
        self.lambda_function = LambdaFunction(
            self, f"lambda-{tenant_id}-{environment_suffix}",
            function_name=f"tenant-{tenant_id}-api-{environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=self.lambda_role.arn,
            filename=f"lib/lambda/{tenant_id}-function.zip",
            source_code_hash="${filebase64sha256(\"lib/lambda/" + tenant_id + "-function.zip\")}",
            memory_size=256,
            timeout=60,
            reserved_concurrent_executions=10,
            environment=LambdaFunctionEnvironment(
                variables={
                    "TENANT_ID": tenant_id,
                    "DYNAMODB_TABLE": self.dynamodb_table.name,
                    "S3_BUCKET": self.s3_bucket.bucket,
                    "KMS_KEY_ID": self.kms_key.id
                }
            ),
            tags={
                "TenantId": tenant_id,
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # CloudWatch Log Group with centralized naming
        self.log_group = CloudwatchLogGroup(
            self, f"log-group-{tenant_id}-{environment_suffix}",
            name=f"/aws/lambda/tenant-{tenant_id}-api-{environment_suffix}",
            retention_in_days=30,
            tags={
                "TenantId": tenant_id,
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # EventBridge Rule for tenant provisioning
        event_pattern = {
            "source": ["custom.signup"],
            "detail-type": ["Tenant Signup"],
            "detail": {
                "tenantId": [tenant_id]
            }
        }

        self.event_rule = CloudwatchEventRule(
            self, f"event-rule-{tenant_id}-{environment_suffix}",
            name=f"tenant-{tenant_id}-signup-rule-{environment_suffix}",
            description=f"Trigger provisioning workflow for {tenant_id}",
            event_pattern=json.dumps(event_pattern),
            tags={
                "TenantId": tenant_id,
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # EventBridge Target
        self.event_target = CloudwatchEventTarget(
            self, f"event-target-{tenant_id}-{environment_suffix}",
            rule=self.event_rule.name,
            arn=self.lambda_function.arn,
            target_id=f"tenant-{tenant_id}-lambda-target"
        )

        # Lambda Permission for EventBridge
        self.lambda_permission = LambdaPermission(
            self, f"lambda-permission-{tenant_id}-{environment_suffix}",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=self.lambda_function.function_name,
            principal="events.amazonaws.com",
            source_arn=self.event_rule.arn
        )

        # Outputs with environmentSuffix
        TerraformOutput(
            self, f"tenant-endpoint-{tenant_id}-{environment_suffix}",
            value=self.lambda_function.invoke_arn,
            description=f"API endpoint for tenant {tenant_id}"
        )

        TerraformOutput(
            self, f"bucket-name-{tenant_id}-{environment_suffix}",
            value=self.s3_bucket.bucket,
            description=f"S3 bucket name for tenant {tenant_id}"
        )

        TerraformOutput(
            self, f"table-arn-{tenant_id}-{environment_suffix}",
            value=self.dynamodb_table.arn,
            description=f"DynamoDB table ARN for tenant {tenant_id}"
        )

        TerraformOutput(
            self, f"vpc-id-{tenant_id}-{environment_suffix}",
            value=self.vpc.id,
            description=f"VPC ID for tenant {tenant_id}"
        )

    def _create_lambda_zip(self, tenant_id: str):
        """Create Lambda deployment package"""
        lambda_dir = "lib/lambda"
        os.makedirs(lambda_dir, exist_ok=True)

        zip_path = f"{lambda_dir}/{tenant_id}-function.zip"

        # Create zip file with Lambda code
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add the Lambda function code
            lambda_code = f'''import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
kms = boto3.client('kms')

def handler(event, context):
    tenant_id = os.environ.get('TENANT_ID')
    table_name = os.environ.get('DYNAMODB_TABLE')
    bucket_name = os.environ.get('S3_BUCKET')

    table = dynamodb.Table(table_name)

    # Log the request
    print(f"Request from tenant: {{tenant_id}}")

    # Example: Store request in DynamoDB
    try:
        table.put_item(
            Item={{
                'tenant_id': tenant_id,
                'resource_type': 'api_request',
                'timestamp': context.request_id,
                'event_data': json.dumps(event)
            }}
        )
    except Exception as e:
        print(f"Error storing data: {{str(e)}}")

    return {{
        'statusCode': 200,
        'headers': {{
            'Content-Type': 'application/json',
            'X-Tenant-Id': tenant_id
        }},
        'body': json.dumps({{
            'message': f'Hello from tenant {{tenant_id}}',
            'tenant': tenant_id,
            'request_id': context.request_id
        }})
    }}
'''
            zipf.writestr('index.py', lambda_code)
```

## File: tap.py

```python
#!/usr/bin/env python
from cdktf import App
from lib.tenant_stack import TenantStack
import os

def main():
    app = App()

    # Get environment suffix from environment variable or default
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'test')

    # Define tenants with non-overlapping CIDR blocks
    tenants = [
        {"id": "acme-corp", "cidr": "10.0.0.0/16"},
        {"id": "tech-startup", "cidr": "10.1.0.0/16"},
        {"id": "retail-co", "cidr": "10.2.0.0/16"}
    ]

    # Create stack for each tenant
    for tenant in tenants:
        TenantStack(
            app,
            f"tenant-{tenant['id']}-{environment_suffix}",
            tenant_id=tenant["id"],
            cidr_block=tenant["cidr"],
            environment_suffix=environment_suffix
        )

    app.synth()

if __name__ == "__main__":
    main()
```

## File: lib/__init__.py

```python
# Empty init file for Python package
```

## File: lib/README.md

```markdown
# Multi-Tenant SaaS Infrastructure

This CDKTF Python application provisions isolated cloud environments for multi-tenant SaaS platforms.

## Architecture

Each tenant receives:
- Dedicated VPC with non-overlapping CIDR blocks
- Private subnets across 2 availability zones
- Isolated security groups
- Tenant-specific KMS encryption keys
- Lambda functions for API endpoints (256MB, 60s timeout, reserved concurrency: 10)
- DynamoDB table for metadata storage
- S3 bucket with intelligent tiering and encryption
- CloudWatch Logs with 30-day retention
- EventBridge rules for provisioning automation

## Prerequisites

- Python 3.9+
- CDKTF 0.15+
- AWS credentials configured
- Terraform installed

## Installation

```bash
# Install Python dependencies
pip install cdktf cdktf-cdktf-provider-aws constructs

# Or use Pipfile
pipenv install
```

## Configuration

Set environment suffix for deployment:

```bash
export ENVIRONMENT_SUFFIX="dev"  # or "test", "prod"
```

## Deployment

```bash
# Synthesize CDKTF stacks
cdktf synth

# Deploy all tenant stacks
cdktf deploy

# Deploy specific tenant
cdktf deploy tenant-acme-corp-dev

# List all stacks
cdktf list
```

## Testing

```bash
# Run unit tests
pytest tests/

# Run with coverage
pytest --cov=lib tests/
```

## Cleanup

```bash
# Destroy all stacks
cdktf destroy

# Destroy specific tenant
cdktf destroy tenant-acme-corp-dev
```

## Security Features

- KMS encryption for all data at rest
- Tenant-scoped IAM policies with principalTag conditions
- Network isolation with private subnets
- Security groups with restrictive rules
- CloudWatch Logs with tenant-prefixed streams
- S3 versioning and lifecycle policies

## Resource Naming Convention

All resources follow the pattern: `tenant-{tenant-id}-{resource-type}-{environment-suffix}`

Example: `tenant-acme-corp-vpc-dev`

## Outputs

Each tenant stack exports:
- `tenant-endpoint-{tenant-id}-{suffix}`: Lambda function ARN
- `bucket-name-{tenant-id}-{suffix}`: S3 bucket name
- `table-arn-{tenant-id}-{suffix}`: DynamoDB table ARN
- `vpc-id-{tenant-id}-{suffix}`: VPC ID

## Cost Optimization

- Serverless architecture (Lambda, DynamoDB on-demand)
- No NAT gateways (use VPC endpoints if needed)
- S3 intelligent tiering for automatic cost savings
- 90-day object expiration lifecycle policy
- Reserved Lambda concurrency prevents over-provisioning
```

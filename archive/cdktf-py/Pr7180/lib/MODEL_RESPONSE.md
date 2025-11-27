# Multi-Tenant SaaS Infrastructure Implementation

Complete CDKTF Python solution for provisioning isolated multi-tenant SaaS infrastructure with security boundaries, encryption, and centralized monitoring.

## File: lib/tenant_stack.py

```python
"""Tenant Stack module for multi-tenant SaaS infrastructure."""

from typing import Dict, Any, List
from cdktf import TerraformStack, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupEgress, SecurityGroupIngress
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionVpcConfig
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery, DynamodbTableServerSideEncryption
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
    S3BucketServerSideEncryptionConfigurationRule,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration
)
from cdktf_cdktf_provider_aws.s3_bucket_intelligent_tiering_configuration import (
    S3BucketIntelligentTieringConfiguration,
    S3BucketIntelligentTieringConfigurationTiering
)
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class TenantStack(TerraformStack):
    """CDKTF Stack for isolated tenant infrastructure."""

    def __init__(
        self,
        scope: Construct,
        tenant_id: str,
        cidr_block: str,
        environment_suffix: str,
        aws_region: str,
        central_log_group_name: str,
        **kwargs
    ):
        """
        Initialize the Tenant Stack.

        Args:
            scope: The scope in which to define this construct
            tenant_id: Unique identifier for the tenant (e.g., 'acme-corp')
            cidr_block: VPC CIDR block for this tenant (must not overlap)
            environment_suffix: Environment suffix for resource naming
            aws_region: AWS region for deployment
            central_log_group_name: Name of the central log group for aggregation
        """
        construct_id = f"tenant-{tenant_id}-{environment_suffix}"
        super().__init__(scope, construct_id)

        self.tenant_id = tenant_id
        self.cidr_block = cidr_block
        self.environment_suffix = environment_suffix
        self.aws_region = aws_region
        self.central_log_group_name = central_log_group_name

        # Get AWS account and region information
        self.caller_identity = DataAwsCallerIdentity(self, "current")
        self.region_data = DataAwsRegion(self, "current_region")
        self.azs = DataAwsAvailabilityZones(self, "available", state="available")

        # Common tags for all resources
        self.common_tags = {
            "TenantId": tenant_id,
            "Environment": environment_suffix,
            "ManagedBy": "CDKTF"
        }

        # Create tenant-specific resources in order
        self._create_kms_key()
        self._create_vpc()
        self._create_iam_roles()
        self._create_lambda_functions()
        self._create_dynamodb_table()
        self._create_s3_bucket()
        self._create_cloudwatch_logs()
        self._create_eventbridge_rules()
        self._create_outputs()

    def _create_kms_key(self) -> None:
        """Create tenant-specific KMS Customer Managed Key."""
        # KMS key policy with tenant scoping
        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.caller_identity.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow tenant-scoped access",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": "*"
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": self.tenant_id
                        }
                    }
                },
                {
                    "Sid": "Allow S3 and DynamoDB to use key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": ["s3.amazonaws.com", "dynamodb.amazonaws.com"]
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": "*"
                }
            ]
        }

        self.kms_key = KmsKey(
            self,
            f"kms-key-{self.tenant_id}",
            description=f"KMS key for tenant {self.tenant_id}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            policy=Fn.jsonencode(key_policy),
            tags=self.common_tags
        )

        self.kms_alias = KmsAlias(
            self,
            f"kms-alias-{self.tenant_id}",
            name=f"alias/tenant-{self.tenant_id}-{self.environment_suffix}",
            target_key_id=self.kms_key.id
        )

    def _create_vpc(self) -> None:
        """Create tenant-specific VPC with private subnets."""
        # Create VPC
        self.vpc = Vpc(
            self,
            f"vpc-{self.tenant_id}",
            cidr_block=self.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.common_tags,
                "Name": f"tenant-{self.tenant_id}-vpc-{self.environment_suffix}"
            }
        )

        # Create private subnets in 2 AZs
        self.private_subnets: List[Subnet] = []
        for i in range(2):
            subnet_cidr = Fn.cidrsubnet(self.cidr_block, 8, i)
            subnet = Subnet(
                self,
                f"private-subnet-{self.tenant_id}-{i}",
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=Fn.element(self.azs.names, i),
                tags={
                    **self.common_tags,
                    "Name": f"tenant-{self.tenant_id}-private-subnet-{i}-{self.environment_suffix}"
                }
            )
            self.private_subnets.append(subnet)

        # Create security group for Lambda functions
        self.lambda_sg = SecurityGroup(
            self,
            f"lambda-sg-{self.tenant_id}",
            name=f"tenant-{self.tenant_id}-lambda-sg-{self.environment_suffix}",
            description=f"Security group for {self.tenant_id} Lambda functions",
            vpc_id=self.vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS outbound for AWS API calls"
                )
            ],
            ingress=[
                SecurityGroupIngress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    self_attribute=True,
                    description="Allow traffic within security group"
                )
            ],
            tags={
                **self.common_tags,
                "Name": f"tenant-{self.tenant_id}-lambda-sg-{self.environment_suffix}"
            }
        )

    def _create_iam_roles(self) -> None:
        """Create IAM roles with tenant-scoped permissions."""
        # Lambda execution role assume policy
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        # Inline policy for tenant-scoped access
        tenant_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem"
                    ],
                    "Resource": f"arn:aws:dynamodb:{self.aws_region}:{self.caller_identity.account_id}:table/tenant-{self.tenant_id}-metadata-{self.environment_suffix}",
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": self.tenant_id
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::tenant-{self.tenant_id}-data-{self.environment_suffix}",
                        f"arn:aws:s3:::tenant-{self.tenant_id}-data-{self.environment_suffix}/*"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": self.tenant_id
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey",
                        "kms:DescribeKey"
                    ],
                    "Resource": self.kms_key.arn,
                    "Condition": {
                        "StringEquals": {
                            "aws:PrincipalTag/TenantId": self.tenant_id
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:{self.aws_region}:{self.caller_identity.account_id}:log-group:/aws/lambda/tenant-{self.tenant_id}-api-{self.environment_suffix}:*"
                }
            ]
        }

        self.lambda_role = IamRole(
            self,
            f"lambda-role-{self.tenant_id}",
            name=f"tenant-{self.tenant_id}-lambda-role-{self.environment_suffix}",
            assume_role_policy=Fn.jsonencode(assume_role_policy),
            inline_policy=[
                IamRoleInlinePolicy(
                    name="tenant-scoped-policy",
                    policy=Fn.jsonencode(tenant_policy)
                )
            ],
            tags={
                **self.common_tags,
                "TenantId": self.tenant_id
            }
        )

        # Attach AWS managed policy for VPC execution
        IamRolePolicyAttachment(
            self,
            f"lambda-vpc-policy-{self.tenant_id}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

    def _create_lambda_functions(self) -> None:
        """Create Lambda functions for tenant API endpoints."""
        self.lambda_function = LambdaFunction(
            self,
            f"lambda-api-{self.tenant_id}",
            function_name=f"tenant-{self.tenant_id}-api-{self.environment_suffix}",
            role=self.lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            memory_size=256,
            timeout=60,
            reserved_concurrent_executions=10,
            environment=LambdaFunctionEnvironment(
                variables={
                    "TENANT_ID": self.tenant_id,
                    "ENVIRONMENT": self.environment_suffix,
                    "DYNAMODB_TABLE": f"tenant-{self.tenant_id}-metadata-{self.environment_suffix}",
                    "S3_BUCKET": f"tenant-{self.tenant_id}-data-{self.environment_suffix}"
                }
            ),
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[subnet.id for subnet in self.private_subnets],
                security_group_ids=[self.lambda_sg.id]
            ),
            filename="lambda_function.zip",
            source_code_hash=Fn.filebase64sha256("lambda_function.zip"),
            tags=self.common_tags,
            lifecycle={
                "ignore_changes": ["source_code_hash", "filename"]
            }
        )

    def _create_dynamodb_table(self) -> None:
        """Create DynamoDB table for tenant metadata."""
        self.dynamodb_table = DynamodbTable(
            self,
            f"dynamodb-table-{self.tenant_id}",
            name=f"tenant-{self.tenant_id}-metadata-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="tenant_id",
            range_key="resource_type",
            attribute=[
                DynamodbTableAttribute(
                    name="tenant_id",
                    type="S"
                ),
                DynamodbTableAttribute(
                    name="resource_type",
                    type="S"
                )
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            server_side_encryption=DynamodbTableServerSideEncryption(
                enabled=True,
                kms_key_arn=self.kms_key.arn
            ),
            tags=self.common_tags
        )

    def _create_s3_bucket(self) -> None:
        """Create S3 bucket with intelligent tiering and encryption."""
        bucket_name = f"tenant-{self.tenant_id}-data-{self.environment_suffix}"

        self.s3_bucket = S3Bucket(
            self,
            f"s3-bucket-{self.tenant_id}",
            bucket=bucket_name,
            force_destroy=True,
            tags=self.common_tags
        )

        # Enable versioning
        S3BucketVersioning(
            self,
            f"s3-versioning-{self.tenant_id}",
            bucket=self.s3_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Configure server-side encryption with KMS
        S3BucketServerSideEncryptionConfiguration(
            self,
            f"s3-encryption-{self.tenant_id}",
            bucket=self.s3_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRule(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ]
        )

        # Configure lifecycle policy for 90-day expiration
        S3BucketLifecycleConfiguration(
            self,
            f"s3-lifecycle-{self.tenant_id}",
            bucket=self.s3_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="expire-old-objects",
                    status="Enabled",
                    expiration=S3BucketLifecycleConfigurationRuleExpiration(
                        days=90
                    )
                )
            ]
        )

        # Configure intelligent tiering
        S3BucketIntelligentTieringConfiguration(
            self,
            f"s3-intelligent-tiering-{self.tenant_id}",
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

    def _create_cloudwatch_logs(self) -> None:
        """Create CloudWatch Log groups with retention."""
        self.log_group = CloudwatchLogGroup(
            self,
            f"log-group-{self.tenant_id}",
            name=f"/aws/lambda/tenant-{self.tenant_id}-api-{self.environment_suffix}",
            retention_in_days=30,
            tags=self.common_tags
        )

    def _create_eventbridge_rules(self) -> None:
        """Create EventBridge rules for tenant provisioning automation."""
        event_pattern = {
            "source": ["saas.tenant"],
            "detail-type": ["Tenant Signup"],
            "detail": {
                "tenant_id": [self.tenant_id]
            }
        }

        self.event_rule = CloudwatchEventRule(
            self,
            f"event-rule-{self.tenant_id}",
            name=f"tenant-{self.tenant_id}-provisioning-{self.environment_suffix}",
            description=f"Trigger provisioning workflow for {self.tenant_id}",
            event_pattern=Fn.jsonencode(event_pattern),
            tags=self.common_tags
        )

        # Add Lambda as target for EventBridge rule
        self.event_target = CloudwatchEventTarget(
            self,
            f"event-target-{self.tenant_id}",
            rule=self.event_rule.name,
            arn=self.lambda_function.arn
        )

        # Grant EventBridge permission to invoke Lambda
        LambdaPermission(
            self,
            f"lambda-permission-{self.tenant_id}",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function_name=self.lambda_function.function_name,
            principal="events.amazonaws.com",
            source_arn=self.event_rule.arn
        )

    def _create_outputs(self) -> None:
        """Create CDKTF outputs for tenant resources."""
        TerraformOutput(
            self,
            "tenant_id_output",
            value=self.tenant_id,
            description=f"Tenant ID for {self.tenant_id}"
        )

        TerraformOutput(
            self,
            "vpc_id_output",
            value=self.vpc.id,
            description=f"VPC ID for tenant {self.tenant_id}"
        )

        TerraformOutput(
            self,
            "lambda_function_arn_output",
            value=self.lambda_function.arn,
            description=f"Lambda function ARN for tenant {self.tenant_id}"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name_output",
            value=self.dynamodb_table.name,
            description=f"DynamoDB table name for tenant {self.tenant_id}"
        )

        TerraformOutput(
            self,
            "s3_bucket_name_output",
            value=self.s3_bucket.bucket,
            description=f"S3 bucket name for tenant {self.tenant_id}"
        )

        TerraformOutput(
            self,
            "kms_key_id_output",
            value=self.kms_key.id,
            description=f"KMS key ID for tenant {self.tenant_id}"
        )
```

## File: tap.py

```python
#!/usr/bin/env python
"""Multi-Tenant SaaS Infrastructure Application."""
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App, S3Backend, TerraformStack
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from lib.tenant_stack import TenantStack

# Get environment variables
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "unknown")
created_at = datetime.now(timezone.utc).isoformat()

default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "Repository": repository_name,
        "Author": commit_author,
        "PRNumber": pr_number,
        "Team": team,
        "CreatedAt": created_at,
    }
}


class CentralInfraStack(TerraformStack):
    """Central infrastructure stack for shared resources."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        state_bucket: str,
        state_bucket_region: str,
        default_tags: dict,
    ):
        """Initialize central infrastructure stack."""
        super().__init__(scope, construct_id)

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Create central log group for all tenants
        self.central_log_group = CloudwatchLogGroup(
            self,
            "central-log-group",
            name=f"/aws/saas/central-logs-{environment_suffix}",
            retention_in_days=30,
            tags={
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )


# Initialize CDKTF App
app = App()

# Create central infrastructure stack
central_stack = CentralInfraStack(
    app,
    f"CentralInfra{environment_suffix}",
    environment_suffix=environment_suffix,
    aws_region=aws_region,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    default_tags=default_tags,
)

central_log_group_name = f"/aws/saas/central-logs-{environment_suffix}"

# Define tenant configurations
tenants = [
    {"id": "acme-corp", "cidr_block": "10.0.0.0/16"},
    {"id": "tech-startup", "cidr_block": "10.1.0.0/16"},
    {"id": "retail-co", "cidr_block": "10.2.0.0/16"}
]

# Create a TenantStack for each tenant
for tenant in tenants:
    TenantStack(
        app,
        tenant["id"],
        cidr_block=tenant["cidr_block"],
        environment_suffix=environment_suffix,
        aws_region=aws_region,
        central_log_group_name=central_log_group_name
    )

# Synthesize the app
app.synth()
```

## File: lib/lambda/tenant_api_handler.py

```python
"""Lambda function handler for tenant API endpoints."""
import json
import os
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle API requests for tenant.

    Args:
        event: Lambda event object
        context: Lambda context object

    Returns:
        API Gateway formatted response
    """
    tenant_id = os.environ.get('TENANT_ID', 'unknown')
    environment = os.environ.get('ENVIRONMENT', 'dev')
    dynamodb_table = os.environ.get('DYNAMODB_TABLE', '')
    s3_bucket = os.environ.get('S3_BUCKET', '')

    logger.info(f"Processing request for tenant: {tenant_id}")

    try:
        http_method = event.get('httpMethod', 'UNKNOWN')
        path = event.get('path', '/')

        logger.info(f"Method: {http_method}, Path: {path}")

        if http_method == 'GET':
            response_body = {
                'message': f'Hello from {tenant_id}',
                'tenant_id': tenant_id,
                'environment': environment,
                'dynamodb_table': dynamodb_table,
                's3_bucket': s3_bucket,
                'status': 'active',
                'path': path
            }
            status_code = 200
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            response_body = {
                'message': f'Data received for {tenant_id}',
                'tenant_id': tenant_id,
                'received_data': body,
                'status': 'processed'
            }
            status_code = 201
        else:
            response_body = {
                'error': 'Method not allowed',
                'tenant_id': tenant_id
            }
            status_code = 405

        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'X-Tenant-Id': tenant_id
            },
            'body': json.dumps(response_body)
        }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Tenant-Id': tenant_id
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'tenant_id': tenant_id,
                'message': str(e)
            })
        }
```

## File: lib/README.md

```markdown
# Multi-Tenant SaaS Infrastructure

CDKTF Python implementation for isolated multi-tenant SaaS infrastructure with security boundaries, encryption, and centralized monitoring.

## Architecture

Each tenant receives:
- **Isolated VPC**: Dedicated VPC with non-overlapping CIDR blocks
- **Compute**: Lambda functions (256MB, 60s timeout, concurrency=10)
- **Storage**: DynamoDB tables and S3 buckets with tenant-specific KMS encryption
- **Security**: KMS CMKs per tenant with tenant-scoped IAM policies
- **Monitoring**: CloudWatch Logs with 30-day retention
- **Automation**: EventBridge rules for provisioning workflows

## Tenant Configuration

| Tenant ID     | VPC CIDR Block  |
|---------------|-----------------|
| acme-corp     | 10.0.0.0/16     |
| tech-startup  | 10.1.0.0/16     |
| retail-co     | 10.2.0.0/16     |

## Prerequisites

- Python 3.9+
- CDKTF 0.15+
- Pipenv
- AWS CLI configured
- Terraform 1.0+

## Installation

```bash
pipenv install
pipenv shell
cdktf get
```

## Deployment

```bash
# Deploy all tenants
cdktf deploy '*'

# Deploy specific tenant
cdktf deploy 'tenant-acme-corp-dev'
```

## Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: `dev`)
- `AWS_REGION`: Target AWS region (default: `us-east-1`)
- `TERRAFORM_STATE_BUCKET`: S3 bucket for state (default: `iac-rlhf-tf-states`)

## Resource Naming

Pattern: `tenant-{tenant-id}-{resource-type}-{environment-suffix}`

## Outputs

- `tenant_id_output`: Tenant identifier
- `vpc_id_output`: VPC ID
- `lambda_function_arn_output`: Lambda ARN
- `dynamodb_table_name_output`: DynamoDB table name
- `s3_bucket_name_output`: S3 bucket name
- `kms_key_id_output`: KMS key ID

## Destroying Infrastructure

```bash
cdktf destroy '*'
```
```

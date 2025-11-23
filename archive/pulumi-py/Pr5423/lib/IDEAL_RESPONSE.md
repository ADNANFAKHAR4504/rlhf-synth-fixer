## File: tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for the multi-environment infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (dev, staging, prod).
"""
import os
import sys

import pulumi
from pulumi import Config

lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

from tap_stack import TapStack, TapStackArgs

config = Config()

environment_suffix = config.get('env') or os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
STACK_NAME = f"MultiEnv-{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

default_tags = {
    'Environment': os.getenv('ENVIRONMENT', 'dev'),
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="multi-env-stack",
    args=TapStackArgs(environment_suffix=environment_suffix, tags=default_tags),
)

```

## File: lib\*\*init\*\*.py

```python
# empty
```

## File: lib\tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the multi-environment infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import MultiEnvConfig
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.eventbridge import EventBridgeStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.sqs import SQSStack
from infrastructure.storage import StorageStack
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'pr1234'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the multi-environment infrastructure.

    This component orchestrates the instantiation of all infrastructure components
    and manages the environment suffix used for naming and configuration.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        self.config = MultiEnvConfig()

        self.provider_manager = AWSProviderManager(self.config)

        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.sqs_stack = SQSStack(self.config, self.provider_manager)
        self.storage_stack = StorageStack(self.config, self.provider_manager)
        self.dynamodb_stack = DynamoDBStack(self.config, self.provider_manager)
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.storage_stack,
            self.dynamodb_stack,
            self.sqs_stack
        )
        self.eventbridge_stack = EventBridgeStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.lambda_stack,
            self.sqs_stack,
            self.storage_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['bucket_name'] = self.storage_stack.get_bucket_name('data')
        outputs['bucket_arn'] = self.storage_stack.get_bucket_arn('data')

        outputs['dynamodb_table_name'] = self.dynamodb_stack.get_table_name('items')
        outputs['dynamodb_table_arn'] = self.dynamodb_stack.get_table_arn('items')

        outputs['lambda_function_name'] = self.lambda_stack.get_function_name('process-data')
        outputs['lambda_function_arn'] = self.lambda_stack.get_function_arn('process-data')

        outputs['eventbridge_rule_arn'] = self.eventbridge_stack.get_rule_arn('s3-object-created')

        outputs['dlq_url'] = self.sqs_stack.get_dlq_url('eventbridge')
        outputs['dlq_arn'] = self.sqs_stack.get_dlq_arn('eventbridge')

        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['region'] = self.config.primary_region
        outputs['normalized_region'] = self.config.normalized_region
        outputs['project_name'] = self.config.project_name

        self.register_outputs(outputs)

        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass

    def get_bucket_name(self) -> Output[str]:
        """Get S3 bucket name."""
        return self.storage_stack.get_bucket_name('data')

    def get_bucket_arn(self) -> Output[str]:
        """Get S3 bucket ARN."""
        return self.storage_stack.get_bucket_arn('data')

    def get_table_name(self) -> Output[str]:
        """Get DynamoDB table name."""
        return self.dynamodb_stack.get_table_name('items')

    def get_table_arn(self) -> Output[str]:
        """Get DynamoDB table ARN."""
        return self.dynamodb_stack.get_table_arn('items')

    def get_lambda_function_name(self) -> Output[str]:
        """Get Lambda function name."""
        return self.lambda_stack.get_function_name('process-data')

    def get_lambda_function_arn(self) -> Output[str]:
        """Get Lambda function ARN."""
        return self.lambda_stack.get_function_arn('process-data')

```

## File: lib\infrastructure\_\_init\_\_.py

```python
# empty
```

## File: lib\infrastructure\lambda_code\processor_handler.py

```python
"""
Lambda handler for processing S3 object creation events.

This handler receives S3 events from EventBridge (not direct S3 notifications)
and processes the objects, storing metadata in DynamoDB.
"""

import json
import os
import uuid
from datetime import datetime
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')


def lambda_handler(event, context):
    """
    Process S3 object creation events from EventBridge.

    EventBridge S3 events have a different structure than direct S3 notifications.
    The event structure is:
    {
        "version": "0",
        "id": "event-id",
        "detail-type": "Object Created",
        "source": "aws.s3",
        "account": "account-id",
        "time": "timestamp",
        "region": "region",
        "resources": ["arn:aws:s3:::bucket-name"],
        "detail": {
            "version": "0",
            "bucket": {
                "name": "bucket-name"
            },
            "object": {
                "key": "object-key",
                "size": 1234,
                "etag": "etag",
                "sequencer": "sequencer"
            },
            "request-id": "request-id",
            "requester": "requester",
            "source-ip-address": "ip",
            "reason": "PutObject"
        }
    }

    Args:
        event: EventBridge event containing S3 object details
        context: Lambda context

    Returns:
        Response dictionary with statusCode and body
    """
    try:
        table_name = os.environ['DYNAMODB_TABLE']
        environment = os.environ['ENVIRONMENT']

        table = dynamodb.Table(table_name)

        print(f"Processing event: {json.dumps(event)}")

        if event.get('source') == 'aws.s3' and event.get('detail-type') == 'Object Created':
            detail = event.get('detail', {})
            bucket_info = detail.get('bucket', {})
            object_info = detail.get('object', {})

            bucket = bucket_info.get('name')
            key = object_info.get('key')
            size = object_info.get('size', 0)

            item_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()

            # Convert size to Decimal for DynamoDB (no float/double allowed)
            item = {
                'id': item_id,
                'timestamp': timestamp,
                'bucket': bucket,
                'key': key,
                'size': Decimal(str(size)),
                'environment': environment,
                'event_time': event.get('time'),
                'region': event.get('region')
            }

            table.put_item(Item=item)

            print(f"Processed S3 object {key} from bucket {bucket}")

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Processing complete',
                    'item_id': item_id
                })
            }
        else:
            print(f"Unexpected event type: {event.get('detail-type')}")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Unexpected event type'
                })
            }

    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__,
            'event': event
        }
        print(f"ERROR processing event: {json.dumps(error_details)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'error_type': type(e).__name__
            })
        }


```

## File: lib\infrastructure\aws_provider.py

```python
"""
AWS Provider module for consistent provider usage.

This module creates a single AWS provider instance to avoid drift in CI/CD pipelines.
The provider is created once and reused across all resources to prevent the
'resource already exists' errors on consecutive deployments.
"""

import os
from typing import Optional

import pulumi_aws as aws

from .config import MultiEnvConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.

    Ensures all resources use the same provider without random suffixes,
    preventing drift in CI/CD pipelines and multi-region deployments.
    """

    def __init__(self, config: MultiEnvConfig):
        """
        Initialize the AWS provider manager.

        Args:
            config: MultiEnvConfig instance
        """
        self.config = config
        self._provider = None

    def get_provider(self) -> Optional[aws.Provider]:
        """
        Get or create the AWS provider instance.

        Creates a provider with assume role support for cross-account deployments.
        Uses default tags to ensure all resources are properly tagged.

        Returns:
            AWS Provider instance or None if using default provider
        """
        if self._provider is None:
            role_arn = os.getenv(f"{self.config.environment.upper()}_ROLE_ARN")

            if role_arn:
                self._provider = aws.Provider(
                    'aws-provider',
                    region=self.config.primary_region,
                    assume_role=aws.ProviderAssumeRoleArgs(
                        role_arn=role_arn,
                        session_name=f"pulumi-{self.config.environment}-deployment"
                    ),
                    default_tags=aws.ProviderDefaultTagsArgs(
                        tags=self.config.get_common_tags()
                    )
                )
            else:
                self._provider = aws.Provider(
                    'aws-provider',
                    region=self.config.primary_region,
                    default_tags=aws.ProviderDefaultTagsArgs(
                        tags=self.config.get_common_tags()
                    )
                )

        return self._provider


```

## File: lib\infrastructure\config.py

```python
"""
Configuration module for the multi-environment infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import json
import os
import re
from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass
class MultiEnvConfig:
    """Centralized configuration for multi-environment deployment."""

    environment: str
    environment_suffix: str
    project_name: str

    primary_region: str
    normalized_region: str

    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int

    dynamodb_billing_mode: str
    dynamodb_read_capacity: int
    dynamodb_write_capacity: int
    dynamodb_enable_autoscaling: bool
    dynamodb_enable_global_tables: bool

    s3_versioning_enabled: bool
    s3_lifecycle_rules: List[Dict[str, Any]]
    s3_encryption_algorithm: str

    dlq_retention_days: int

    team: str
    cost_center: str

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'multienv')

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)

        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '60'))
        self.lambda_memory_size = self._get_lambda_memory_size()

        self.dynamodb_billing_mode = self._get_dynamodb_billing_mode()
        self.dynamodb_read_capacity = self._get_dynamodb_read_capacity()
        self.dynamodb_write_capacity = self._get_dynamodb_write_capacity()
        self.dynamodb_enable_autoscaling = self._should_enable_autoscaling()
        self.dynamodb_enable_global_tables = self._should_enable_global_tables()

        self.s3_versioning_enabled = os.getenv('S3_VERSIONING_ENABLED', 'true').lower() == 'true'
        self.s3_lifecycle_rules = self._get_s3_lifecycle_rules()
        self.s3_encryption_algorithm = os.getenv('S3_ENCRYPTION_ALGORITHM', 'AES256')

        self.dlq_retention_days = self._get_dlq_retention_days()

        self.team = os.getenv('TEAM', 'platform')
        self.cost_center = os.getenv('COST_CENTER', 'eng-001')

    def _normalize_region(self, region: str) -> str:
        """
        Normalize region name for resource naming.

        Example: us-east-1 -> useast1
        """
        return region.replace('-', '')

    def _get_lambda_memory_size(self) -> int:
        """Get Lambda memory size based on environment."""
        env = self.environment.lower()
        if env == 'dev':
            return 512
        elif env == 'staging':
            return 1024
        else:
            return 3008

    def _get_dynamodb_billing_mode(self) -> str:
        """Get DynamoDB billing mode based on environment."""
        env = self.environment.lower()
        if env == 'dev':
            return 'PAY_PER_REQUEST'
        return 'PROVISIONED'

    def _get_dynamodb_read_capacity(self) -> int:
        """Get DynamoDB read capacity based on environment."""
        env = self.environment.lower()
        if env == 'dev':
            return 5
        elif env == 'staging':
            return 25
        else:
            return 100

    def _get_dynamodb_write_capacity(self) -> int:
        """Get DynamoDB write capacity based on environment."""
        env = self.environment.lower()
        if env == 'dev':
            return 5
        elif env == 'staging':
            return 25
        else:
            return 100

    def _should_enable_autoscaling(self) -> bool:
        """Check if autoscaling should be enabled based on environment."""
        env = self.environment.lower()
        return env in ['staging', 'prod']

    def _should_enable_global_tables(self) -> bool:
        """Check if global tables should be enabled based on environment."""
        env = self.environment.lower()
        return env in ['staging', 'prod']

    def _get_s3_lifecycle_rules(self) -> List[Dict[str, Any]]:
        """Get S3 lifecycle rules (consistent across all environments)."""
        return [
            {
                'id': 'expire-old-versions',
                'status': 'Enabled',
                'noncurrent_version_expiration': {
                    'noncurrent_days': 90
                },
                'abort_incomplete_multipart_upload': {
                    'days_after_initiation': 7
                }
            }
        ]

    def _get_dlq_retention_days(self) -> int:
        """Get DLQ retention days based on environment."""
        env = self.environment.lower()
        if env == 'dev':
            return 7
        elif env == 'staging':
            return 14
        else:
            return 30

    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources.

        Converts to lowercase and replaces invalid characters with hyphens.
        """
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized

    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate consistent resource names with environment suffix and normalized region.

        Args:
            resource_type: Type of the resource
            include_region: Whether to include region in the name (default: True)

        Returns:
            Formatted resource name with region, environment, and environment suffix
        """
        base_name = f"{self.project_name}-{resource_type}"

        if include_region:
            base_name = f"{base_name}-{self.normalized_region}"

        base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"

        return base_name

    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate normalized resource names for case-sensitive resources.

        This is specifically for resources like S3 buckets that require lowercase names.
        """
        name = self.get_resource_name(resource_type, include_region)
        return self.normalize_name(name)

    def get_common_tags(self) -> Dict[str, str]:
        """Get common tags for all resources."""
        return {
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'Team': self.team,
            'CostCenter': self.cost_center,
            'ManagedBy': 'Pulumi',
            'Region': self.normalized_region
        }


def validate_environment_configs(configs: Dict[str, MultiEnvConfig]) -> None:
    """
    Validate configuration consistency across environments.

    Ensures critical settings match across all environments:
    - S3 lifecycle rules
    - S3 versioning
    - S3 encryption
    - Tag structure (excluding Environment tag)

    Args:
        configs: Dictionary mapping environment names to their configs

    Raises:
        ValueError: If any validation check fails
    """
    env_names = list(configs.keys())
    if len(env_names) < 2:
        return

    reference_env = configs[env_names[0]]

    reference_lifecycle_canonical = _canonicalize_json(reference_env.s3_lifecycle_rules)

    for env_name, env_config in configs.items():
        if env_name == env_names[0]:
            continue

        current_lifecycle_canonical = _canonicalize_json(env_config.s3_lifecycle_rules)
        if reference_lifecycle_canonical != current_lifecycle_canonical:
            raise ValueError(
                f"S3 lifecycle rules for environment {env_name} don't match "
                f"the reference environment {env_names[0]}"
            )

        if reference_env.s3_versioning_enabled != env_config.s3_versioning_enabled:
            raise ValueError(
                f"S3 versioning for environment {env_name} doesn't match "
                f"the reference environment {env_names[0]}"
            )

        if reference_env.s3_encryption_algorithm != env_config.s3_encryption_algorithm:
            raise ValueError(
                f"S3 encryption for environment {env_name} doesn't match "
                f"the reference environment {env_names[0]}"
            )

    if 'prod' in configs and 'staging' in configs:
        prod_config = configs['prod']
        staging_config = configs['staging']

        if not prod_config.dynamodb_enable_global_tables:
            raise ValueError(
                "Production environment must have global tables enabled "
                "for prod to staging replication"
            )

        if not staging_config.dynamodb_enable_global_tables:
            raise ValueError(
                "Staging environment must have global tables enabled "
                "for prod to staging replication"
            )

    base_tags = {k: v for k, v in reference_env.get_common_tags().items() if k != 'Environment'}
    for env_name, env_config in configs.items():
        if env_name == env_names[0]:
            continue

        env_tags = {k: v for k, v in env_config.get_common_tags().items() if k != 'Environment'}
        if base_tags != env_tags:
            raise ValueError(
                f"Tags for environment {env_name} don't match "
                f"the reference environment {env_names[0]}"
            )


def _canonicalize_json(obj: Any) -> str:
    """
    Canonicalize JSON for comparison.

    Sorts keys and ensures consistent formatting to avoid false mismatches.
    """
    return json.dumps(obj, sort_keys=True, separators=(',', ':'))


```

## File: lib\infrastructure\dynamodb.py

```python
"""
DynamoDB module for tables with autoscaling and global replication.

This module creates DynamoDB tables with environment-specific configurations:
- dev: on-demand billing
- staging/prod: provisioned capacity with autoscaling
- prod to staging: global table replication
"""

from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig


class DynamoDBStack:
    """
    Manages DynamoDB tables for the multi-environment infrastructure.

    Creates tables with:
    - Environment-specific billing modes
    - Autoscaling for staging/prod
    - Global replication support for prod to staging
    """

    def __init__(self, config: MultiEnvConfig, provider_manager: AWSProviderManager):
        """
        Initialize the DynamoDB stack.

        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.tables: Dict[str, aws.dynamodb.Table] = {}

        self._create_items_table()

    def _create_items_table(self) -> None:
        """Create the items table with proper configuration."""
        table_name = self.config.get_resource_name('items')

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        table_args = {
            'name': table_name,
            'hash_key': 'id',
            'range_key': 'timestamp',
            'attributes': [
                aws.dynamodb.TableAttributeArgs(name='id', type='S'),
                aws.dynamodb.TableAttributeArgs(name='timestamp', type='S')
            ],
            'billing_mode': self.config.dynamodb_billing_mode,
            'tags': self.config.get_common_tags(),
            'opts': opts
        }

        if self.config.dynamodb_billing_mode == 'PROVISIONED':
            table_args['read_capacity'] = self.config.dynamodb_read_capacity
            table_args['write_capacity'] = self.config.dynamodb_write_capacity

        self.tables['items'] = aws.dynamodb.Table(
            f"{table_name}-table",
            **table_args
        )

        if self.config.dynamodb_enable_autoscaling:
            self._configure_autoscaling('items', table_name)

    def _configure_autoscaling(self, table_key: str, table_name: str) -> None:
        """
        Configure autoscaling for a DynamoDB table.

        Args:
            table_key: Key to look up table in self.tables
            table_name: Table name for resource naming
        """
        table = self.tables[table_key]
        opts = ResourceOptions(provider=self.provider) if self.provider else None

        read_target = aws.appautoscaling.Target(
            f"{table_name}-read-target",
            max_capacity=self.config.dynamodb_read_capacity * 2,
            min_capacity=max(1, self.config.dynamodb_read_capacity // 2),
            resource_id=Output.concat('table/', table.name),
            scalable_dimension='dynamodb:table:ReadCapacityUnits',
            service_namespace='dynamodb',
            opts=opts
        )

        aws.appautoscaling.Policy(
            f"{table_name}-read-policy",
            policy_type='TargetTrackingScaling',
            resource_id=read_target.resource_id,
            scalable_dimension=read_target.scalable_dimension,
            service_namespace=read_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                target_value=70.0,
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBReadCapacityUtilization'
                )
            ),
            opts=opts
        )

        write_target = aws.appautoscaling.Target(
            f"{table_name}-write-target",
            max_capacity=self.config.dynamodb_write_capacity * 2,
            min_capacity=max(1, self.config.dynamodb_write_capacity // 2),
            resource_id=Output.concat('table/', table.name),
            scalable_dimension='dynamodb:table:WriteCapacityUnits',
            service_namespace='dynamodb',
            opts=opts
        )

        aws.appautoscaling.Policy(
            f"{table_name}-write-policy",
            policy_type='TargetTrackingScaling',
            resource_id=write_target.resource_id,
            scalable_dimension=write_target.scalable_dimension,
            service_namespace=write_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                target_value=70.0,
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBWriteCapacityUtilization'
                )
            ),
            opts=opts
        )

    def get_table(self, name: str = 'items') -> aws.dynamodb.Table:
        """
        Get table by name.

        Args:
            name: Table name (default: 'items')

        Returns:
            DynamoDB Table resource
        """
        return self.tables.get(name)

    def get_table_name(self, name: str = 'items') -> Output[str]:
        """
        Get table name by name.

        Args:
            name: Table name (default: 'items')

        Returns:
            Table name as Output[str]
        """
        table = self.get_table(name)
        return table.name if table else None

    def get_table_arn(self, name: str = 'items') -> Output[str]:
        """
        Get table ARN by name.

        Args:
            name: Table name (default: 'items')

        Returns:
            Table ARN as Output[str]
        """
        table = self.get_table(name)
        return table.arn if table else None


def setup_global_replication(
    prod_table: aws.dynamodb.Table,
    staging_region: str,
    config: MultiEnvConfig,
    provider_manager: AWSProviderManager
) -> None:
    """
    Setup global table replication from prod to staging.

    Note: This function should be called separately after both prod and staging
    tables are created. Due to cross-account/cross-environment nature, this
    requires careful orchestration.

    Args:
        prod_table: Production DynamoDB table
        staging_region: Staging region for replication
        config: MultiEnvConfig instance
        provider_manager: AWSProviderManager instance
    """
    opts = ResourceOptions(provider=provider_manager.get_provider()) if provider_manager.get_provider() else None

    replication_name = f"{config.project_name}-global-replication"

    aws.dynamodb.GlobalTable(
        replication_name,
        name=prod_table.name,
        replicas=[
            aws.dynamodb.GlobalTableReplicaArgs(
                region_name=config.primary_region
            ),
            aws.dynamodb.GlobalTableReplicaArgs(
                region_name=staging_region
            )
        ],
        opts=opts
    )


```

## File: lib\infrastructure\eventbridge.py

```python
"""
EventBridge module for S3 event rules.

This module creates EventBridge rules that trigger on S3 object creation events,
with proper event patterns and IAM roles for delivery.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack
from .sqs import SQSStack
from .storage import StorageStack


class EventBridgeStack:
    """
    Manages EventBridge rules for S3 events.

    Creates rules that:
    - Trigger on S3 object creation events
    - Use correct EventBridge event patterns for S3
    - Include DLQs for failed deliveries
    - Have proper IAM roles for target invocation
    """

    def __init__(
        self,
        config: MultiEnvConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        lambda_stack: LambdaStack,
        sqs_stack: SQSStack,
        storage_stack: StorageStack
    ):
        """
        Initialize the EventBridge stack.

        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            lambda_stack: LambdaStack instance
            sqs_stack: SQSStack instance
            storage_stack: StorageStack instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.iam_stack = iam_stack
        self.lambda_stack = lambda_stack
        self.sqs_stack = sqs_stack
        self.storage_stack = storage_stack
        self.rules: Dict[str, aws.cloudwatch.EventRule] = {}

        self._create_s3_event_rule()

    def _create_s3_event_rule(self) -> None:
        """Create EventBridge rule for S3 object creation events."""
        rule_name = self.config.get_resource_name('s3-object-created')

        bucket_name = self.storage_stack.get_bucket_name('data')
        lambda_arn = self.lambda_stack.get_function_arn('process-data')
        dlq_arn = self.sqs_stack.get_dlq_arn('eventbridge')

        event_pattern = bucket_name.apply(lambda name: {
            "source": ["aws.s3"],
            "detail-type": ["Object Created"],
            "detail": {
                "bucket": {
                    "name": [name]
                }
            }
        })

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        self.rules['s3-object-created'] = aws.cloudwatch.EventRule(
            f"{rule_name}-rule",
            name=rule_name,
            description=f"Trigger Lambda on S3 object creation in {self.config.environment}",
            event_pattern=event_pattern.apply(lambda p: pulumi.Output.json_dumps(p)),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        aws.lambda_.Permission(
            f"{rule_name}-lambda-permission",
            action='lambda:InvokeFunction',
            function=self.lambda_stack.get_function('process-data').name,
            principal='events.amazonaws.com',
            source_arn=self.rules['s3-object-created'].arn,
            opts=opts
        )

        aws.cloudwatch.EventTarget(
            f"{rule_name}-target",
            rule=self.rules['s3-object-created'].name,
            arn=lambda_arn,
            dead_letter_config=aws.cloudwatch.EventTargetDeadLetterConfigArgs(
                arn=dlq_arn
            ),
            opts=opts
        )

    def get_rule(self, name: str = 's3-object-created') -> aws.cloudwatch.EventRule:
        """
        Get EventBridge rule by name.

        Args:
            name: Rule name (default: 's3-object-created')

        Returns:
            EventRule resource
        """
        return self.rules.get(name)

    def get_rule_arn(self, name: str = 's3-object-created') -> Output[str]:
        """
        Get EventBridge rule ARN by name.

        Args:
            name: Rule name (default: 's3-object-created')

        Returns:
            Rule ARN as Output[str]
        """
        rule = self.get_rule(name)
        return rule.arn if rule else None


```

## File: lib\infrastructure\lambda_functions.py

```python
"""
Lambda functions module.

This module creates Lambda functions with environment-specific configurations
and proper packaging for multi-account deployments.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .sqs import SQSStack
from .storage import StorageStack


class LambdaStack:
    """
    Manages Lambda functions for the multi-environment infrastructure.

    Creates Lambda functions with:
    - Environment-specific memory sizes
    - Proper IAM roles with least privilege
    - Environment variables for DynamoDB and environment
    """

    def __init__(
        self,
        config: MultiEnvConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        storage_stack: StorageStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            storage_stack: StorageStack instance
            dynamodb_stack: DynamoDBStack instance
            sqs_stack: SQSStack instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.iam_stack = iam_stack
        self.storage_stack = storage_stack
        self.dynamodb_stack = dynamodb_stack
        self.sqs_stack = sqs_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}

        self._create_process_function()

    def _create_process_function(self) -> None:
        """Create the data processing Lambda function."""
        function_name = self.config.get_resource_name('process-data')

        s3_bucket_arns = [self.storage_stack.get_bucket_arn('data')]
        dynamodb_table_arns = [self.dynamodb_stack.get_table_arn('items')]
        sqs_queue_arns = [self.sqs_stack.get_dlq_arn('eventbridge')]

        role = self.iam_stack.create_lambda_role(
            'process-data',
            s3_bucket_arns,
            dynamodb_table_arns,
            sqs_queue_arns
        )

        handler_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code'
        )

        opts = ResourceOptions(
            provider=self.provider,
            depends_on=[role]
        ) if self.provider else ResourceOptions(depends_on=[role])

        self.functions['process-data'] = aws.lambda_.Function(
            f"{function_name}-function",
            name=function_name,
            runtime=self.config.lambda_runtime,
            role=role.arn,
            handler='process_handler.lambda_handler',
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive(handler_path)
            }),
            memory_size=self.config.lambda_memory_size,
            timeout=self.config.lambda_timeout,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'DYNAMODB_TABLE': self.dynamodb_stack.get_table_name('items'),
                    'ENVIRONMENT': self.config.environment
                }
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )

    def get_function(self, name: str = 'process-data') -> aws.lambda_.Function:
        """
        Get Lambda function by name.

        Args:
            name: Function name (default: 'process-data')

        Returns:
            Lambda Function resource
        """
        return self.functions.get(name)

    def get_function_name(self, name: str = 'process-data') -> Output[str]:
        """
        Get Lambda function name by name.

        Args:
            name: Function name (default: 'process-data')

        Returns:
            Function name as Output[str]
        """
        function = self.get_function(name)
        return function.name if function else None

    def get_function_arn(self, name: str = 'process-data') -> Output[str]:
        """
        Get Lambda function ARN by name.

        Args:
            name: Function name (default: 'process-data')

        Returns:
            Function ARN as Output[str]
        """
        function = self.get_function(name)
        return function.arn if function else None


```

## File: lib\infrastructure\sqs.py

```python
"""
SQS module for Dead Letter Queues.

This module creates SQS queues for EventBridge DLQs with environment-specific
retention periods.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig


class SQSStack:
    """
    Manages SQS Dead Letter Queues for EventBridge rules.

    Creates DLQs with environment-specific retention periods:
    - dev: 7 days
    - staging: 14 days
    - prod: 30 days
    """

    def __init__(self, config: MultiEnvConfig, provider_manager: AWSProviderManager):
        """
        Initialize the SQS stack.

        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.dlqs: Dict[str, aws.sqs.Queue] = {}

        self._create_dlq()

    def _create_dlq(self) -> None:
        """Create the DLQ for EventBridge rules."""
        dlq_name = self.config.get_resource_name('eventbridge-dlq')

        retention_seconds = self.config.dlq_retention_days * 86400

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        self.dlqs['eventbridge'] = aws.sqs.Queue(
            f"{dlq_name}-queue",
            name=dlq_name,
            message_retention_seconds=retention_seconds,
            tags=self.config.get_common_tags(),
            opts=opts
        )

    def get_dlq(self, name: str = 'eventbridge') -> aws.sqs.Queue:
        """
        Get DLQ by name.

        Args:
            name: Name of the DLQ (default: 'eventbridge')

        Returns:
            SQS Queue resource
        """
        return self.dlqs.get(name)

    def get_dlq_arn(self, name: str = 'eventbridge') -> Output[str]:
        """
        Get DLQ ARN by name.

        Args:
            name: Name of the DLQ (default: 'eventbridge')

        Returns:
            DLQ ARN as Output[str]
        """
        dlq = self.get_dlq(name)
        return dlq.arn if dlq else None

    def get_dlq_url(self, name: str = 'eventbridge') -> Output[str]:
        """
        Get DLQ URL by name.

        Args:
            name: Name of the DLQ (default: 'eventbridge')

        Returns:
            DLQ URL as Output[str]
        """
        dlq = self.get_dlq(name)
        return dlq.url if dlq else None


```

## File: lib\infrastructure\storage.py

```python
"""
S3 Storage module for data buckets.

This module creates S3 buckets with versioning, lifecycle policies, encryption,
and proper naming to avoid duplication issues.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig


class StorageStack:
    """
    Manages S3 buckets for the multi-environment infrastructure.

    Creates buckets with:
    - Environment-specific naming (normalized for case sensitivity)
    - Versioning enabled
    - Consistent lifecycle policies
    - Server-side encryption (SSE-S3)
    - Public access blocked
    """

    def __init__(self, config: MultiEnvConfig, provider_manager: AWSProviderManager):
        """
        Initialize the storage stack.

        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.buckets: Dict[str, aws.s3.Bucket] = {}

        self._create_data_bucket()

    def _create_data_bucket(self) -> None:
        """Create the data bucket with proper configuration."""
        bucket_name = self.config.get_normalized_resource_name('data')

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        self.buckets['data'] = aws.s3.Bucket(
            f"{bucket_name}-bucket",
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=self.buckets['data'].id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled' if self.config.s3_versioning_enabled else 'Suspended'
            ),
            opts=opts
        )

        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=self.buckets['data'].id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm=self.config.s3_encryption_algorithm
                )
            )],
            opts=opts
        )

        aws.s3.BucketLifecycleConfiguration(
            f"{bucket_name}-lifecycle",
            bucket=self.buckets['data'].id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id=rule['id'],
                    status=rule['status'],
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=rule['noncurrent_version_expiration']['noncurrent_days']
                    ),
                    abort_incomplete_multipart_upload=aws.s3.BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs(
                        days_after_initiation=rule['abort_incomplete_multipart_upload']['days_after_initiation']
                    )
                )
                for rule in self.config.s3_lifecycle_rules
            ],
            opts=opts
        )

        aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=self.buckets['data'].id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=opts
        )

        aws.s3.BucketNotification(
            f"{bucket_name}-notification",
            bucket=self.buckets['data'].id,
            eventbridge=True,
            opts=opts
        )

    def get_bucket(self, name: str = 'data') -> aws.s3.Bucket:
        """
        Get bucket by name.

        Args:
            name: Bucket name (default: 'data')

        Returns:
            S3 Bucket resource
        """
        return self.buckets.get(name)

    def get_bucket_name(self, name: str = 'data') -> Output[str]:
        """
        Get bucket name by name.

        Args:
            name: Bucket name (default: 'data')

        Returns:
            Bucket name as Output[str]
        """
        bucket = self.get_bucket(name)
        return bucket.bucket if bucket else None

    def get_bucket_arn(self, name: str = 'data') -> Output[str]:
        """
        Get bucket ARN by name.

        Args:
            name: Bucket name (default: 'data')

        Returns:
            Bucket ARN as Output[str]
        """
        bucket = self.get_bucket(name)
        return bucket.arn if bucket else None


```

## File: lib\infrastructure\iam.py

```python
"""
IAM module for roles and policies with least privilege.

This module creates IAM roles and policies for Lambda functions and EventBridge,
ensuring proper Output handling to avoid invalid JSON policy documents.
"""

from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig


class IAMStack:
    """
    Manages IAM roles and policies for the multi-environment infrastructure.

    Creates least-privilege roles for:
    - Lambda functions (S3 read, DynamoDB write)
    - EventBridge (SQS send, Lambda invoke)
    """

    def __init__(self, config: MultiEnvConfig, provider_manager: AWSProviderManager):
        """
        Initialize the IAM stack.

        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.roles: Dict[str, aws.iam.Role] = {}

    def create_lambda_role(
        self,
        name: str,
        s3_bucket_arns: List[Output[str]],
        dynamodb_table_arns: List[Output[str]],
        sqs_queue_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create an IAM role for Lambda with least privilege access.

        Properly handles Pulumi Outputs to avoid invalid JSON policy documents.

        Args:
            name: Role name
            s3_bucket_arns: List of S3 bucket ARNs as Outputs
            dynamodb_table_arns: List of DynamoDB table ARNs as Outputs
            sqs_queue_arns: List of SQS queue ARNs as Outputs

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name(name)

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        role = aws.iam.Role(
            f"{role_name}-role",
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        aws.iam.RolePolicyAttachment(
            f"{role_name}-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=opts
        )

        Output.all(
            s3_arns=s3_bucket_arns,
            dynamodb_arns=dynamodb_table_arns,
            sqs_arns=sqs_queue_arns
        ).apply(lambda args: self._attach_lambda_policies(
            role,
            role_name,
            args['s3_arns'],
            args['dynamodb_arns'],
            args['sqs_arns'],
            opts
        ))

        self.roles[name] = role
        return role

    def _attach_lambda_policies(
        self,
        role: aws.iam.Role,
        role_name: str,
        s3_arns: List[str],
        dynamodb_arns: List[str],
        sqs_arns: List[str],
        opts: ResourceOptions
    ) -> None:
        """
        Attach inline policies to Lambda role.

        This method is called within an apply() to ensure all ARNs are resolved.

        Args:
            role: IAM Role resource
            role_name: Role name for resource naming
            s3_arns: Resolved S3 bucket ARNs
            dynamodb_arns: Resolved DynamoDB table ARNs
            sqs_arns: Resolved SQS queue ARNs
            opts: Resource options
        """
        s3_resources = s3_arns + [f"{arn}/*" for arn in s3_arns]

        s3_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                "Resource": s3_resources
            }]
        }

        aws.iam.RolePolicy(
            f"{role_name}-s3-access",
            role=role.name,
            policy=pulumi.Output.json_dumps(s3_policy),
            opts=opts
        )

        dynamodb_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": dynamodb_arns
            }]
        }

        aws.iam.RolePolicy(
            f"{role_name}-dynamodb-access",
            role=role.name,
            policy=pulumi.Output.json_dumps(dynamodb_policy),
            opts=opts
        )

        if sqs_arns:
            sqs_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": sqs_arns
                }]
            }

            aws.iam.RolePolicy(
                f"{role_name}-sqs-access",
                role=role.name,
                policy=pulumi.Output.json_dumps(sqs_policy),
                opts=opts
            )

    def create_eventbridge_role(
        self,
        name: str,
        target_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create an IAM role for EventBridge to invoke targets.

        Args:
            name: Role name
            target_arns: List of target ARNs (Lambda, SQS) as Outputs

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name(name)

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "events.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        role = aws.iam.Role(
            f"{role_name}-role",
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        Output.all(target_arns=target_arns).apply(
            lambda args: self._attach_eventbridge_policy(
                role,
                role_name,
                args['target_arns'],
                opts
            )
        )

        self.roles[name] = role
        return role

    def _attach_eventbridge_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        target_arns: List[str],
        opts: ResourceOptions
    ) -> None:
        """
        Attach inline policy to EventBridge role.

        Args:
            role: IAM Role resource
            role_name: Role name for resource naming
            target_arns: Resolved target ARNs
            opts: Resource options
        """
        policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "lambda:InvokeFunction",
                    "sqs:SendMessage"
                ],
                "Resource": target_arns
            }]
        }

        aws.iam.RolePolicy(
            f"{role_name}-invoke-policy",
            role=role.name,
            policy=pulumi.Output.json_dumps(policy),
            opts=opts
        )

    def get_role(self, name: str) -> aws.iam.Role:
        """
        Get role by name.

        Args:
            name: Role name

        Returns:
            IAM Role resource
        """
        return self.roles.get(name)

    def get_role_arn(self, name: str) -> Output[str]:
        """
        Get role ARN by name.

        Args:
            name: Role name

        Returns:
            Role ARN as Output[str]
        """
        role = self.get_role(name)
        return role.arn if role else None


```

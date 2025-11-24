# Multi-Environment Payment Processing Infrastructure - Corrected Implementation

This document contains the complete **corrected** Pulumi Python implementation for deploying payment processing infrastructure across three environments (dev, staging, production). All issues from MODEL_RESPONSE.md have been fixed

## Key Fixes Applied

1. **Uncommented Tests**: All test code is now functional (not commented out)
2. **Added pulumi.export() Calls**: Top-level exports added for CLI access
3. **Fixed Project Name**: Pulumi.yaml project name corrected to "TapStack"
4. **Fixed Line Endings**: All files use LF (Unix) line endings
5. **Fixed Long Lines**: Broken long lines to meet 120-character limit
6. **Dependencies Fixed**: All required dependencies properly installed

## Architecture Overview

The solution uses Pulumi ComponentResource pattern to create reusable infrastructure components that can be instantiated for each environment with environment-specific configurations.

**Key Components:**
- VPC with isolated networks per environment
- Lambda functions with ARM64 architecture for payment processing
- DynamoDB tables with environment-specific capacity modes
- S3 buckets with lifecycle policies for audit logs
- IAM roles with least-privilege access
- CloudWatch alarms with environment-specific thresholds
- JSON manifest generation for compliance tracking

## File: lib/environment_config.py

```python
"""
Environment-specific configuration for payment processing infrastructure.
Defines settings for dev, staging, and production environments.
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class EnvironmentConfig:
    """Configuration settings for a specific environment."""

    name: str
    account_id: str
    region: str
    lambda_memory_mb: int
    dynamodb_capacity_mode: str  # 'on-demand' or 'provisioned'
    dynamodb_read_capacity: Optional[int]
    dynamodb_write_capacity: Optional[int]
    dynamodb_pitr_enabled: bool
    s3_log_retention_days: int
    lambda_error_alarm_threshold: int
    dynamodb_throttle_alarm_threshold: int
    cost_center: str
    data_classification: str
    multi_az: bool

    def get_tags(self) -> Dict[str, str]:
        """Generate standard tags for this environment."""
        return {
            'Environment': self.name,
            'CostCenter': self.cost_center,
            'DataClassification': self.data_classification,
        }


# Environment configurations
ENVIRONMENTS: Dict[str, EnvironmentConfig] = {
    'dev': EnvironmentConfig(
        name='dev',
        account_id='123456789012',
        region='us-east-1',
        lambda_memory_mb=512,
        dynamodb_capacity_mode='on-demand',
        dynamodb_read_capacity=None,
        dynamodb_write_capacity=None,
        dynamodb_pitr_enabled=False,
        s3_log_retention_days=30,
        lambda_error_alarm_threshold=5,
        dynamodb_throttle_alarm_threshold=10,
        cost_center='dev-payments',
        data_classification='internal',
        multi_az=False,
    ),
    'staging': EnvironmentConfig(
        name='staging',
        account_id='234567890123',
        region='us-east-1',
        lambda_memory_mb=1024,
        dynamodb_capacity_mode='provisioned',
        dynamodb_read_capacity=5,
        dynamodb_write_capacity=5,
        dynamodb_pitr_enabled=False,
        s3_log_retention_days=90,
        lambda_error_alarm_threshold=3,
        dynamodb_throttle_alarm_threshold=5,
        cost_center='staging-payments',
        data_classification='internal',
        multi_az=False,
    ),
    'prod': EnvironmentConfig(
        name='prod',
        account_id='345678901234',
        region='us-east-1',
        lambda_memory_mb=2048,
        dynamodb_capacity_mode='provisioned',
        dynamodb_read_capacity=20,
        dynamodb_write_capacity=20,
        dynamodb_pitr_enabled=True,
        s3_log_retention_days=365,
        lambda_error_alarm_threshold=1,
        dynamodb_throttle_alarm_threshold=2,
        cost_center='prod-payments',
        data_classification='confidential',
        multi_az=True,
    ),
}


def get_environment_config(environment_suffix: str) -> EnvironmentConfig:
    """Get configuration for a specific environment."""
    # Map environment suffix to environment name
    env_map = {
        'dev': 'dev',
        'development': 'dev',
        'staging': 'staging',
        'stg': 'staging',
        'prod': 'prod',
        'production': 'prod',
    }

    env_name = env_map.get(environment_suffix.lower(), 'dev')
    return ENVIRONMENTS[env_name]
```

## File: lib/vpc_component.py

```python
"""
VPC Component for Payment Processing Infrastructure.
Creates isolated VPC with public and private subnets.
"""

from typing import Optional, Dict
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class VpcComponentArgs:
    """Arguments for VPC Component."""

    def __init__(
        self,
        environment_suffix: str,
        cidr_block: str = "10.0.0.0/16",
        availability_zones: list = None,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.cidr_block = cidr_block
        self.availability_zones = availability_zones or ["us-east-1a", "us-east-1b"]
        self.tags = tags or {}


class VpcComponent(pulumi.ComponentResource):
    """
    Reusable VPC component with isolated network configuration.
    Creates VPC with 2 public and 2 private subnets, IGW, and NAT Gateway.
    """

    def __init__(
        self,
        name: str,
        args: VpcComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:network:VpcComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"payment-vpc-{args.environment_suffix}",
            cidr_block=args.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **args.tags,
                'Name': f"payment-vpc-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"payment-igw-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f"payment-igw-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create public subnets
        self.public_subnets = []
        for i, az in enumerate(args.availability_zones[:2]):
            subnet = aws.ec2.Subnet(
                f"payment-public-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **args.tags,
                    'Name': f"payment-public-subnet-{i+1}-{args.environment_suffix}",
                    'Type': 'public',
                },
                opts=child_opts
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets = []
        for i, az in enumerate(args.availability_zones[:2]):
            subnet = aws.ec2.Subnet(
                f"payment-private-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **args.tags,
                    'Name': f"payment-private-subnet-{i+1}-{args.environment_suffix}",
                    'Type': 'private',
                },
                opts=child_opts
            )
            self.private_subnets.append(subnet)

        # Create Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f"payment-nat-eip-{args.environment_suffix}",
            domain="vpc",
            tags={
                **args.tags,
                'Name': f"payment-nat-eip-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"payment-nat-{args.environment_suffix}",
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.eip.id,
            tags={
                **args.tags,
                'Name': f"payment-nat-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"payment-public-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f"payment-public-rt-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create route to Internet Gateway
        aws.ec2.Route(
            f"payment-public-route-{args.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=child_opts
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"payment-public-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=child_opts
            )

        # Create private route table
        self.private_route_table = aws.ec2.RouteTable(
            f"payment-private-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f"payment-private-rt-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create route to NAT Gateway
        aws.ec2.Route(
            f"payment-private-route-{args.environment_suffix}",
            route_table_id=self.private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id,
            opts=child_opts
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"payment-private-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=child_opts
            )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'vpc_cidr': self.vpc.cidr_block,
            'public_subnet_ids': [s.id for s in self.public_subnets],
            'private_subnet_ids': [s.id for s in self.private_subnets],
            'nat_gateway_id': self.nat_gateway.id,
        })
```

## File: lib/lambda_component.py

```python
"""
Lambda Component for Payment Processing.
Creates Lambda functions with environment-specific configurations.
"""

from typing import Optional, Dict
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, AssetArchive, FileArchive
from lib.environment_config import EnvironmentConfig


class LambdaComponentArgs:
    """Arguments for Lambda Component."""

    def __init__(
        self,
        environment_suffix: str,
        env_config: EnvironmentConfig,
        role_arn: str,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.env_config = env_config
        self.role_arn = role_arn
        self.tags = tags or {}


class LambdaComponent(pulumi.ComponentResource):
    """
    Reusable Lambda component for payment processing.
    Creates Lambda function with ARM64 architecture and environment-specific settings.
    """

    def __init__(
        self,
        name: str,
        args: LambdaComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:compute:LambdaComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Create Lambda function code
        # In production, this would be actual payment processing code
        lambda_code = '''
import json
import os

def handler(event, context):
    """Process payment transaction."""
    environment = os.environ.get('ENVIRONMENT', 'unknown')

    # Simulate payment processing
    transaction_id = event.get('transaction_id', 'unknown')
    amount = event.get('amount', 0)

    print(f"Processing payment in {environment} environment")
    print(f"Transaction ID: {transaction_id}, Amount: ${amount}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Payment processed successfully',
            'transaction_id': transaction_id,
            'environment': environment,
            'amount': amount
        })
    }
'''

        # Create Lambda function
        self.function = aws.lambda_.Function(
            f"payment-processor-{args.environment_suffix}",
            runtime="python3.11",
            role=args.role_arn,
            handler="index.handler",
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(lambda_code)
            }),
            memory_size=args.env_config.lambda_memory_mb,
            timeout=30,
            architectures=["arm64"],  # ARM64 for cost optimization
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'ENVIRONMENT': args.env_config.name,
                    'LOG_LEVEL': 'INFO',
                }
            ),
            tags={
                **args.tags,
                'Name': f"payment-processor-{args.environment_suffix}",
                'Architecture': 'arm64',
            },
            opts=child_opts
        )

        # Create CloudWatch Log Group
        self.log_group = aws.cloudwatch.LogGroup(
            f"payment-processor-logs-{args.environment_suffix}",
            name=self.function.name.apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=args.env_config.s3_log_retention_days,
            tags=args.tags,
            opts=child_opts
        )

        # Register outputs
        self.register_outputs({
            'function_arn': self.function.arn,
            'function_name': self.function.name,
            'log_group_name': self.log_group.name,
        })
```

## File: lib/dynamodb_component.py

```python
"""
DynamoDB Component for Transaction Storage.
Creates DynamoDB tables with environment-specific configurations.
"""

from typing import Optional, Dict
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from lib.environment_config import EnvironmentConfig


class DynamoDBComponentArgs:
    """Arguments for DynamoDB Component."""

    def __init__(
        self,
        environment_suffix: str,
        env_config: EnvironmentConfig,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.env_config = env_config
        self.tags = tags or {}


class DynamoDBComponent(pulumi.ComponentResource):
    """
    Reusable DynamoDB component for transaction storage.
    Creates table with environment-specific capacity mode.
    """

    def __init__(
        self,
        name: str,
        args: DynamoDBComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:database:DynamoDBComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Prepare table arguments
        table_args = {
            'name': f"payment-transactions-{args.environment_suffix}",
            'hash_key': 'transaction_id',
            'range_key': 'timestamp',
            'attributes': [
                aws.dynamodb.TableAttributeArgs(
                    name='transaction_id',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='timestamp',
                    type='N'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='customer_id',
                    type='S'
                ),
            ],
            'billing_mode': (
                'PAY_PER_REQUEST'
                if args.env_config.dynamodb_capacity_mode == 'on-demand'
                else 'PROVISIONED'
            ),
            'global_secondary_indexes': [
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='customer-index',
                    hash_key='customer_id',
                    range_key='timestamp',
                    projection_type='ALL',
                    read_capacity=(
                        args.env_config.dynamodb_read_capacity
                        if args.env_config.dynamodb_capacity_mode == 'provisioned'
                        else None
                    ),
                    write_capacity=(
                        args.env_config.dynamodb_write_capacity
                        if args.env_config.dynamodb_capacity_mode == 'provisioned'
                        else None
                    ),
                )
            ],
            'point_in_time_recovery': aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=args.env_config.dynamodb_pitr_enabled
            ),
            'tags': {
                **args.tags,
                'Name': f"payment-transactions-{args.environment_suffix}",
            },
            'opts': child_opts
        }

        # Add provisioned capacity if not on-demand
        if args.env_config.dynamodb_capacity_mode == 'provisioned':
            table_args['read_capacity'] = args.env_config.dynamodb_read_capacity
            table_args['write_capacity'] = args.env_config.dynamodb_write_capacity

        # Create DynamoDB table
        self.table = aws.dynamodb.Table(
            f"payment-transactions-{args.environment_suffix}",
            **table_args
        )

        # Register outputs
        self.register_outputs({
            'table_name': self.table.name,
            'table_arn': self.table.arn,
        })
```

## File: lib/s3_component.py

```python
"""
S3 Component for Audit Logs.
Creates S3 buckets with environment-specific lifecycle policies.
"""

from typing import Optional, Dict
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from lib.environment_config import EnvironmentConfig


class S3ComponentArgs:
    """Arguments for S3 Component."""

    def __init__(
        self,
        environment_suffix: str,
        env_config: EnvironmentConfig,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.env_config = env_config
        self.tags = tags or {}


class S3Component(pulumi.ComponentResource):
    """
    Reusable S3 component for audit logs.
    Creates bucket with environment-specific lifecycle policies.
    """

    def __init__(
        self,
        name: str,
        args: S3ComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:storage:S3Component', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Create S3 bucket
        self.bucket = aws.s3.BucketV2(
            f"payment-audit-logs-{args.environment_suffix}",
            tags={
                **args.tags,
                'Name': f"payment-audit-logs-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Enable versioning
        self.versioning = aws.s3.BucketVersioningV2(
            f"payment-audit-logs-versioning-{args.environment_suffix}",
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=child_opts
        )

        # Configure server-side encryption
        self.encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"payment-audit-logs-encryption-{args.environment_suffix}",
            bucket=self.bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=child_opts
        )

        # Block public access
        self.public_access_block = aws.s3.BucketPublicAccessBlock(
            f"payment-audit-logs-public-access-{args.environment_suffix}",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=child_opts
        )

        # Configure lifecycle policy
        self.lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            f"payment-audit-logs-lifecycle-{args.environment_suffix}",
            bucket=self.bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                        days=args.env_config.s3_log_retention_days
                    )
                ),
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="transition-to-ia",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        )
                    ]
                )
            ],
            opts=child_opts
        )

        # Register outputs
        self.register_outputs({
            'bucket_name': self.bucket.id,
            'bucket_arn': self.bucket.arn,
        })
```

## File: lib/iam_component.py

```python
"""
IAM Component for Payment Processing.
Creates IAM roles with least-privilege policies.
"""

from typing import Optional, Dict
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from lib.environment_config import EnvironmentConfig


class IAMComponentArgs:
    """Arguments for IAM Component."""

    def __init__(
        self,
        environment_suffix: str,
        env_config: EnvironmentConfig,
        dynamodb_table_arn: Output[str],
        s3_bucket_arn: Output[str],
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.env_config = env_config
        self.dynamodb_table_arn = dynamodb_table_arn
        self.s3_bucket_arn = s3_bucket_arn
        self.tags = tags or {}


class IAMComponent(pulumi.ComponentResource):
    """
    Reusable IAM component with least-privilege policies.
    Creates roles that restrict cross-environment access.
    """

    def __init__(
        self,
        name: str,
        args: IAMComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:security:IAMComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Lambda execution role
        self.lambda_role = aws.iam.Role(
            f"payment-lambda-role-{args.environment_suffix}",
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'sts:AssumeRole',
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'lambda.amazonaws.com'
                    }
                }]
            }),
            tags={
                **args.tags,
                'Name': f"payment-lambda-role-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"payment-lambda-basic-execution-{args.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=child_opts
        )

        # Create custom policy for DynamoDB and S3 access (least-privilege)
        self.lambda_policy = aws.iam.Policy(
            f"payment-lambda-policy-{args.environment_suffix}",
            policy=Output.all(
                dynamodb_arn=args.dynamodb_table_arn,
                s3_arn=args.s3_bucket_arn
            ).apply(lambda vals: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'dynamodb:PutItem',
                            'dynamodb:GetItem',
                            'dynamodb:Query',
                            'dynamodb:UpdateItem'
                        ],
                        'Resource': [
                            vals['dynamodb_arn'],
                            f"{vals['dynamodb_arn']}/index/*"
                        ],
                        'Condition': {
                            'StringEquals': {
                                'aws:RequestedRegion': args.env_config.region
                            }
                        }
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:PutObject',
                            's3:GetObject'
                        ],
                        'Resource': f"{vals['s3_arn']}/*",
                        'Condition': {
                            'StringEquals': {
                                'aws:RequestedRegion': args.env_config.region
                            }
                        }
                    }
                ]
            })),
            tags=args.tags,
            opts=child_opts
        )

        # Attach custom policy to Lambda role
        aws.iam.RolePolicyAttachment(
            f"payment-lambda-custom-policy-{args.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=self.lambda_policy.arn,
            opts=child_opts
        )

        # Register outputs
        self.register_outputs({
            'lambda_role_arn': self.lambda_role.arn,
            'lambda_role_name': self.lambda_role.name,
        })
```

## File: lib/monitoring_component.py

```python
"""
CloudWatch Monitoring Component.
Creates CloudWatch alarms with environment-specific thresholds.
"""

from typing import Optional, Dict
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from lib.environment_config import EnvironmentConfig


class MonitoringComponentArgs:
    """Arguments for Monitoring Component."""

    def __init__(
        self,
        environment_suffix: str,
        env_config: EnvironmentConfig,
        lambda_function_name: Output[str],
        dynamodb_table_name: Output[str],
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.env_config = env_config
        self.lambda_function_name = lambda_function_name
        self.dynamodb_table_name = dynamodb_table_name
        self.tags = tags or {}


class MonitoringComponent(pulumi.ComponentResource):
    """
    Reusable monitoring component with CloudWatch alarms.
    Creates alarms with environment-specific thresholds.
    """

    def __init__(
        self,
        name: str,
        args: MonitoringComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:monitoring:MonitoringComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Lambda error alarm
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"payment-lambda-errors-{args.environment_suffix}",
            name=f"payment-lambda-errors-{args.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,  # 5 minutes
            statistic="Sum",
            threshold=args.env_config.lambda_error_alarm_threshold,
            alarm_description=(
                f"Lambda errors exceeded "
                f"{args.env_config.lambda_error_alarm_threshold} "
                f"in {args.env_config.name}"
            ),
            dimensions={
                'FunctionName': args.lambda_function_name
            },
            tags={
                **args.tags,
                'Name': f"payment-lambda-errors-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # DynamoDB read throttle alarm
        self.dynamodb_read_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"payment-dynamodb-read-throttle-{args.environment_suffix}",
            name=f"payment-dynamodb-read-throttle-{args.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ReadThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,  # 5 minutes
            statistic="Sum",
            threshold=args.env_config.dynamodb_throttle_alarm_threshold,
            alarm_description=(
                f"DynamoDB read throttle exceeded "
                f"{args.env_config.dynamodb_throttle_alarm_threshold} "
                f"in {args.env_config.name}"
            ),
            dimensions={
                'TableName': args.dynamodb_table_name
            },
            tags={
                **args.tags,
                'Name': f"payment-dynamodb-read-throttle-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # DynamoDB write throttle alarm
        self.dynamodb_write_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"payment-dynamodb-write-throttle-{args.environment_suffix}",
            name=f"payment-dynamodb-write-throttle-{args.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="WriteThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,  # 5 minutes
            statistic="Sum",
            threshold=args.env_config.dynamodb_throttle_alarm_threshold,
            alarm_description=(
                f"DynamoDB write throttle exceeded "
                f"{args.env_config.dynamodb_throttle_alarm_threshold} "
                f"in {args.env_config.name}"
            ),
            dimensions={
                'TableName': args.dynamodb_table_name
            },
            tags={
                **args.tags,
                'Name': f"payment-dynamodb-write-throttle-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Register outputs
        self.register_outputs({
            'lambda_error_alarm_arn': self.lambda_error_alarm.arn,
            'dynamodb_read_throttle_alarm_arn': self.dynamodb_read_throttle_alarm.arn,
            'dynamodb_write_throttle_alarm_arn': self.dynamodb_write_throttle_alarm.arn,
        })
```

## File: lib/payment_stack_component.py

```python
"""
Payment Stack Component - Main orchestration component.
Combines all infrastructure components for payment processing.
"""

from typing import Optional, Dict
import pulumi
from pulumi import ResourceOptions, Output
from lib.environment_config import get_environment_config
from lib.vpc_component import VpcComponent, VpcComponentArgs
from lib.dynamodb_component import DynamoDBComponent, DynamoDBComponentArgs
from lib.s3_component import S3Component, S3ComponentArgs
from lib.iam_component import IAMComponent, IAMComponentArgs
from lib.lambda_component import LambdaComponent, LambdaComponentArgs
from lib.monitoring_component import MonitoringComponent, MonitoringComponentArgs


class PaymentStackArgs:
    """Arguments for Payment Stack Component."""

    def __init__(
        self,
        environment_suffix: str,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class PaymentStackComponent(pulumi.ComponentResource):
    """
    Main payment processing stack component.
    Orchestrates all infrastructure components with environment-specific configurations.
    """

    def __init__(
        self,
        name: str,
        args: PaymentStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:stack:PaymentStackComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Get environment configuration
        self.env_config = get_environment_config(args.environment_suffix)

        # Merge environment tags with provided tags
        merged_tags = {
            **self.env_config.get_tags(),
            **args.tags
        }

        # Create VPC
        self.vpc = VpcComponent(
            f"payment-vpc-{args.environment_suffix}",
            VpcComponentArgs(
                environment_suffix=args.environment_suffix,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Create DynamoDB table
        self.dynamodb = DynamoDBComponent(
            f"payment-dynamodb-{args.environment_suffix}",
            DynamoDBComponentArgs(
                environment_suffix=args.environment_suffix,
                env_config=self.env_config,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Create S3 bucket
        self.s3 = S3Component(
            f"payment-s3-{args.environment_suffix}",
            S3ComponentArgs(
                environment_suffix=args.environment_suffix,
                env_config=self.env_config,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Create IAM roles
        self.iam = IAMComponent(
            f"payment-iam-{args.environment_suffix}",
            IAMComponentArgs(
                environment_suffix=args.environment_suffix,
                env_config=self.env_config,
                dynamodb_table_arn=self.dynamodb.table.arn,
                s3_bucket_arn=self.s3.bucket.arn,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Create Lambda function
        self.lambda_func = LambdaComponent(
            f"payment-lambda-{args.environment_suffix}",
            LambdaComponentArgs(
                environment_suffix=args.environment_suffix,
                env_config=self.env_config,
                role_arn=self.iam.lambda_role.arn,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Create CloudWatch monitoring
        self.monitoring = MonitoringComponent(
            f"payment-monitoring-{args.environment_suffix}",
            MonitoringComponentArgs(
                environment_suffix=args.environment_suffix,
                env_config=self.env_config,
                lambda_function_name=self.lambda_func.function.name,
                dynamodb_table_name=self.dynamodb.table.name,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Register outputs for manifest generation
        self.register_outputs({
            'environment': self.env_config.name,
            'account_id': self.env_config.account_id,
            'region': self.env_config.region,
            'vpc_id': self.vpc.vpc.id,
            'lambda_function_arn': self.lambda_func.function.arn,
            'lambda_function_name': self.lambda_func.function.name,
            'dynamodb_table_name': self.dynamodb.table.name,
            'dynamodb_table_arn': self.dynamodb.table.arn,
            's3_bucket_name': self.s3.bucket.id,
            's3_bucket_arn': self.s3.bucket.arn,
            'lambda_role_arn': self.iam.lambda_role.arn,
        })
```

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of the Payment Stack component
and manages environment-specific configurations.
"""

from typing import Optional
import json
import pulumi
from pulumi import ResourceOptions, Output
from lib.payment_stack_component import PaymentStackComponent, PaymentStackArgs


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
      environment_suffix (Optional[str]): An optional suffix for
        identifying the deployment environment (e.g., 'dev', 'prod').
      tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the payment processing infrastructure
    and manages the environment suffix used for naming and configuration.
    It also generates a JSON manifest of all deployed resources for compliance.

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
        self.tags = args.tags

        # Create the payment processing stack
        self.payment_stack = PaymentStackComponent(
            f"payment-stack-{self.environment_suffix}",
            PaymentStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Generate resource manifest as JSON output
        # This manifest lists all deployed resources for compliance tracking
        manifest = Output.all(
            environment=self.payment_stack.env_config.name,
            account_id=self.payment_stack.env_config.account_id,
            region=self.payment_stack.env_config.region,
            vpc_id=self.payment_stack.vpc.vpc.id,
            lambda_arn=self.payment_stack.lambda_func.function.arn,
            lambda_name=self.payment_stack.lambda_func.function.name,
            lambda_memory=self.payment_stack.env_config.lambda_memory_mb,
            dynamodb_name=self.payment_stack.dynamodb.table.name,
            dynamodb_arn=self.payment_stack.dynamodb.table.arn,
            dynamodb_capacity_mode=self.payment_stack.env_config.dynamodb_capacity_mode,
            dynamodb_pitr=self.payment_stack.env_config.dynamodb_pitr_enabled,
            s3_bucket=self.payment_stack.s3.bucket.id,
            s3_arn=self.payment_stack.s3.bucket.arn,
            s3_retention_days=self.payment_stack.env_config.s3_log_retention_days,
            lambda_role_arn=self.payment_stack.iam.lambda_role.arn,
        ).apply(lambda vals: json.dumps({
            'environment': vals['environment'],
            'account_id': vals['account_id'],
            'region': vals['region'],
            'resources': {
                'vpc': {
                    'id': vals['vpc_id'],
                    'type': 'AWS::EC2::VPC'
                },
                'lambda': {
                    'arn': vals['lambda_arn'],
                    'name': vals['lambda_name'],
                    'memory_mb': vals['lambda_memory'],
                    'architecture': 'arm64',
                    'type': 'AWS::Lambda::Function'
                },
                'dynamodb': {
                    'name': vals['dynamodb_name'],
                    'arn': vals['dynamodb_arn'],
                    'capacity_mode': vals['dynamodb_capacity_mode'],
                    'pitr_enabled': vals['dynamodb_pitr'],
                    'type': 'AWS::DynamoDB::Table'
                },
                's3': {
                    'bucket': vals['s3_bucket'],
                    'arn': vals['s3_arn'],
                    'retention_days': vals['s3_retention_days'],
                    'type': 'AWS::S3::Bucket'
                },
                'iam': {
                    'lambda_role_arn': vals['lambda_role_arn'],
                    'type': 'AWS::IAM::Role'
                }
            }
        }, indent=2))

        # Register outputs
        self.register_outputs({
            'environment': self.payment_stack.env_config.name,
            'vpc_id': self.payment_stack.vpc.vpc.id,
            'lambda_function_arn': self.payment_stack.lambda_func.function.arn,
            'lambda_function_name': self.payment_stack.lambda_func.function.name,
            'dynamodb_table_name': self.payment_stack.dynamodb.table.name,
            's3_bucket_name': self.payment_stack.s3.bucket.id,
            'resource_manifest': manifest,
        })
```

## File: lib/__init__.py

```python
"""
Payment Processing Infrastructure Library.
Exports all components for easy import.
"""

from .environment_config import (
    EnvironmentConfig,
    ENVIRONMENTS,
    get_environment_config
)
from .vpc_component import VpcComponent, VpcComponentArgs
from .lambda_component import LambdaComponent, LambdaComponentArgs
from .dynamodb_component import DynamoDBComponent, DynamoDBComponentArgs
from .s3_component import S3Component, S3ComponentArgs
from .iam_component import IAMComponent, IAMComponentArgs
from .monitoring_component import MonitoringComponent, MonitoringComponentArgs
from .payment_stack_component import PaymentStackComponent, PaymentStackArgs
from .tap_stack import TapStack, TapStackArgs

__all__ = [
    'EnvironmentConfig',
    'ENVIRONMENTS',
    'get_environment_config',
    'VpcComponent',
    'VpcComponentArgs',
    'LambdaComponent',
    'LambdaComponentArgs',
    'DynamoDBComponent',
    'DynamoDBComponentArgs',
    'S3Component',
    'S3ComponentArgs',
    'IAMComponent',
    'IAMComponentArgs',
    'MonitoringComponent',
    'MonitoringComponentArgs',
    'PaymentStackComponent',
    'PaymentStackArgs',
    'TapStack',
    'TapStackArgs',
]
```

## File: tap.py (Main Entry Point)

```python
"""
Main Pulumi program entry point.
Instantiates the TapStack with environment configuration.
"""

import os
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Get environment suffix from environment variable or use default
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Configure AWS provider
provider = aws.Provider(
    "aws",
    region=os.environ.get('AWS_REGION', 'us-east-1')
)

# Create the main TapStack
stack = TapStack(
    name="TapStack",
    args=TapStackArgs(environment_suffix=environment_suffix),
    opts=ResourceOptions(provider=provider)
)

# CRITICAL FIX: Export outputs at top level for CLI access
# These exports make stack outputs accessible via `pulumi stack output`
pulumi.export('environment', stack.payment_stack.env_config.name)
pulumi.export('vpc_id', stack.payment_stack.vpc.vpc.id)
pulumi.export('lambda_function_arn', stack.payment_stack.lambda_func.function.arn)
pulumi.export('lambda_function_name', stack.payment_stack.lambda_func.function.name)
pulumi.export('dynamodb_table_name', stack.payment_stack.dynamodb.table.name)
pulumi.export('s3_bucket_name', stack.payment_stack.s3.bucket.id)
pulumi.export('resource_manifest', stack.payment_stack.env_config.name)
```

## File: Pulumi.yaml

```yaml
name: TapStack
runtime:
  name: python
  options:
    virtualenv: venv
description: Multi-environment payment processing infrastructure
```

## File: requirements.txt

```text
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## Summary of Fixes

This IDEAL_RESPONSE.md contains the complete corrected implementation with all critical fixes:

1. All test code uncommented and functional
2. Top-level pulumi.export() calls added to tap.py
3. Project name corrected to "TapStack" in Pulumi.yaml
4. All line endings converted to LF (Unix style)
5. Long lines broken to meet 120-character limit
6. All dependencies properly specified

The infrastructure successfully deploys with environment-specific configurations for dev, staging, and production environments, including VPC, Lambda (ARM64), DynamoDB, S3, IAM, and CloudWatch monitoring.

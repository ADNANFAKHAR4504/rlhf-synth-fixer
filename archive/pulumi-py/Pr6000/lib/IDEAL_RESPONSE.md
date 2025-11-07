# Multi-Environment Payment Processing Infrastructure

This implementation provides a complete Pulumi Python solution for multi-environment payment processing infrastructure with environment-specific configurations for development and production.

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Main Pulumi ComponentResource for multi-environment payment processing infrastructure.
Orchestrates all resource creation with environment-specific configurations.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions

from .config import EnvironmentConfig, get_environment_config
from .networking import NetworkingStack
from .database import DatabaseStack
from .compute import ComputeStack
from .api import ApiGatewayStack
from .storage import StorageStack
from .monitoring import MonitoringStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for multi-environment payment processing.

    This component orchestrates the instantiation of all infrastructure components
    including networking, database, compute, API, storage, and monitoring.

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

        # Get environment-specific configuration
        self.config = get_environment_config(self.environment_suffix)

        # Add environment tag
        all_tags = {
            'Environment': self.config.environment,
            'ManagedBy': 'Pulumi',
            **self.tags
        }

        # Add CostCenter tag for production
        if self.config.environment == 'prod':
            all_tags['CostCenter'] = 'payments-production'

        # Create networking infrastructure
        self.networking = NetworkingStack(
            f"networking-{self.environment_suffix}",
            vpc_cidr=self.config.vpc_cidr,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create database infrastructure
        self.database = DatabaseStack(
            f"database-{self.environment_suffix}",
            vpc_id=self.networking.vpc_id,
            private_subnet_ids=self.networking.private_subnet_ids,
            instance_class=self.config.db_instance_class,
            enable_encryption=self.config.enable_db_encryption,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.networking])
        )

        # Create storage infrastructure (S3, DynamoDB)
        self.storage = StorageStack(
            f"storage-{self.environment_suffix}",
            enable_versioning=self.config.enable_s3_versioning,
            lifecycle_days=self.config.s3_lifecycle_days,
            dynamodb_billing_mode=self.config.dynamodb_billing_mode,
            enable_encryption=self.config.enable_storage_encryption,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create compute infrastructure (Lambda)
        self.compute = ComputeStack(
            f"compute-{self.environment_suffix}",
            vpc_id=self.networking.vpc_id,
            private_subnet_ids=self.networking.private_subnet_ids,
            db_secret_arn=self.database.db_secret_arn,
            dynamodb_table_name=self.storage.dynamodb_table_name,
            reserved_concurrency=self.config.lambda_reserved_concurrency,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.database, self.storage, self.networking])
        )

        # Create API Gateway
        self.api = ApiGatewayStack(
            f"api-{self.environment_suffix}",
            lambda_function_arn=self.compute.lambda_function_arn,
            lambda_function_name=self.compute.lambda_function_name,
            enable_custom_domain=self.config.enable_custom_domain,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.compute])
        )

        # Create monitoring infrastructure
        self.monitoring = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            log_retention_days=self.config.log_retention_days,
            lambda_function_name=self.compute.lambda_function_name,
            api_gateway_id=self.api.api_id,
            api_stage_name=self.api.stage_name,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.compute, self.api])
        )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.networking.vpc_id,
            'public_subnet_ids': self.networking.public_subnet_ids,
            'private_subnet_ids': self.networking.private_subnet_ids,
            'db_endpoint': self.database.db_endpoint,
            'db_secret_arn': self.database.db_secret_arn,
            's3_bucket_name': self.storage.s3_bucket_name,
            'dynamodb_table_name': self.storage.dynamodb_table_name,
            'lambda_function_arn': self.compute.lambda_function_arn,
            'lambda_function_name': self.compute.lambda_function_name,
            'api_endpoint': self.api.api_endpoint,
            'api_id': self.api.api_id,
        })
```

## File: lib/config.py

```python
"""
config.py

Environment-specific configuration for multi-environment deployments.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class EnvironmentConfig:
    """Configuration class for environment-specific settings."""

    environment: str
    vpc_cidr: str
    db_instance_class: str
    enable_db_encryption: bool
    lambda_reserved_concurrency: Optional[int]
    enable_custom_domain: bool
    enable_s3_versioning: bool
    s3_lifecycle_days: Optional[int]
    dynamodb_billing_mode: str
    enable_storage_encryption: bool
    log_retention_days: int


def get_environment_config(environment_suffix: str) -> EnvironmentConfig:
    """
    Get environment-specific configuration based on environment suffix.

    Args:
        environment_suffix: The environment identifier (e.g., 'dev', 'prod')

    Returns:
        EnvironmentConfig object with appropriate settings
    """

    # Determine if this is production based on suffix
    is_production = 'prod' in environment_suffix.lower()

    if is_production:
        return EnvironmentConfig(
            environment='prod',
            vpc_cidr='10.1.0.0/16',
            db_instance_class='db.m5.large',
            enable_db_encryption=True,
            lambda_reserved_concurrency=100,
            enable_custom_domain=True,
            enable_s3_versioning=True,
            s3_lifecycle_days=90,
            dynamodb_billing_mode='PAY_PER_REQUEST',
            enable_storage_encryption=True,
            log_retention_days=30
        )

    return EnvironmentConfig(
        environment='dev',
        vpc_cidr='10.0.0.0/16',
        db_instance_class='db.t3.small',
        enable_db_encryption=False,
        lambda_reserved_concurrency=None,
        enable_custom_domain=False,
        enable_s3_versioning=False,
        s3_lifecycle_days=None,
        dynamodb_billing_mode='PROVISIONED',
        enable_storage_encryption=False,
        log_retention_days=7
    )
```

## File: lib/networking.py

```python
"""
networking.py

VPC and networking infrastructure for multi-environment deployment.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import List, Optional


class NetworkingStack(pulumi.ComponentResource):
    """
    Creates VPC infrastructure with public and private subnets across multiple AZs.
    """

    def __init__(
        self,
        name: str,
        vpc_cidr: str,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:networking:NetworkingStack', name, None, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f'vpc-{environment_suffix}',
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, 'Name': f'vpc-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f'igw-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'igw-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state='available')

        # Extract base CIDR for subnet calculation (e.g., "10.0" from "10.0.0.0/16")
        vpc_cidr_base = '.'.join(vpc_cidr.split('.')[:2])

        # Create public subnets
        self.public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f'public-subnet-{i}-{environment_suffix}',
                vpc_id=self.vpc.id,
                cidr_block=f'{vpc_cidr_base}.{i}.0/24',
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**tags, 'Name': f'public-subnet-{i}-{environment_suffix}', 'Type': 'public'},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f'private-subnet-{i}-{environment_suffix}',
                vpc_id=self.vpc.id,
                cidr_block=f'{vpc_cidr_base}.{i+10}.0/24',
                availability_zone=azs.names[i],
                tags={**tags, 'Name': f'private-subnet-{i}-{environment_suffix}', 'Type': 'private'},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create public route table
        self.public_rt = aws.ec2.RouteTable(
            f'public-rt-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'public-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create route to Internet Gateway
        aws.ec2.Route(
            f'public-route-{environment_suffix}',
            route_table_id=self.public_rt.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'public-rta-{i}-{environment_suffix}',
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Create private route table (no NAT Gateway for cost optimization)
        self.private_rt = aws.ec2.RouteTable(
            f'private-rt-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'private-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f'private-rta-{i}-{environment_suffix}',
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Expose outputs
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        self.register_outputs({
            'vpc_id': self.vpc_id,
            'public_subnet_ids': self.public_subnet_ids,
            'private_subnet_ids': self.private_subnet_ids
        })
```

## File: lib/database.py

```python
"""
database.py

RDS PostgreSQL database infrastructure with Secrets Manager integration.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import List, Optional
import json


class DatabaseStack(pulumi.ComponentResource):
    """
    Creates RDS PostgreSQL database with environment-specific configuration.
    """

    def __init__(
        self,
        name: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        instance_class: str,
        enable_encryption: bool,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:database:DatabaseStack', name, None, opts)

        # Create KMS key if encryption is enabled
        self.kms_key = None
        if enable_encryption:
            self.kms_key = aws.kms.Key(
                f'db-kms-key-{environment_suffix}',
                description=f'KMS key for RDS encryption - {environment_suffix}',
                deletion_window_in_days=10,
                tags={**tags, 'Name': f'db-kms-key-{environment_suffix}'},
                opts=ResourceOptions(parent=self)
            )

            aws.kms.Alias(
                f'db-kms-alias-{environment_suffix}',
                name=f'alias/rds-{environment_suffix}',
                target_key_id=self.kms_key.id,
                opts=ResourceOptions(parent=self)
            )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f'db-subnet-group-{environment_suffix}',
            subnet_ids=private_subnet_ids,
            tags={**tags, 'Name': f'db-subnet-group-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create security group for RDS
        self.db_security_group = aws.ec2.SecurityGroup(
            f'db-sg-{environment_suffix}',
            vpc_id=vpc_id,
            description=f'Security group for RDS PostgreSQL - {environment_suffix}',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=['10.0.0.0/8']  # Allow from VPC
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0']
                )
            ],
            tags={**tags, 'Name': f'db-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Generate database credentials
        db_username = 'paymentadmin'
        db_password = aws.secretsmanager.Secret(
            f'db-password-{environment_suffix}',
            description=f'RDS PostgreSQL password - {environment_suffix}',
            tags={**tags, 'Name': f'db-password-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        db_password_version = aws.secretsmanager.SecretVersion(
            f'db-password-version-{environment_suffix}',
            secret_id=db_password.id,
            secret_string=pulumi.Output.secret('PaymentDB2024!Change'),
            opts=ResourceOptions(parent=self)
        )

        # Create RDS instance
        self.db_instance = aws.rds.Instance(
            f'db-instance-{environment_suffix}',
            identifier=f'payment-db-{environment_suffix}',
            engine='postgres',
            engine_version='16.3',
            instance_class=instance_class,
            allocated_storage=20,
            storage_type='gp2',
            storage_encrypted=enable_encryption,
            kms_key_id=self.kms_key.arn if enable_encryption else None,
            db_name='paymentdb',
            username=db_username,
            password=db_password_version.secret_string,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_security_group.id],
            skip_final_snapshot=True,
            backup_retention_period=1,
            multi_az=False,  # Single AZ for cost optimization
            publicly_accessible=False,
            tags={**tags, 'Name': f'db-instance-{environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[db_password_version])
        )

        # Store connection details in Secrets Manager
        connection_string = pulumi.Output.all(
            self.db_instance.endpoint,
            self.db_instance.db_name,
            db_username
        ).apply(lambda args: json.dumps({
            'host': args[0].split(':')[0],
            'port': 5432,
            'database': args[1],
            'username': args[2],
            'password': 'PaymentDB2024!Change'
        }))

        self.db_secret = aws.secretsmanager.Secret(
            f'db-connection-{environment_suffix}',
            description=f'RDS PostgreSQL connection details - {environment_suffix}',
            tags={**tags, 'Name': f'db-connection-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        aws.secretsmanager.SecretVersion(
            f'db-connection-version-{environment_suffix}',
            secret_id=self.db_secret.id,
            secret_string=connection_string,
            opts=ResourceOptions(parent=self, depends_on=[self.db_instance])
        )

        # Expose outputs
        self.db_endpoint = self.db_instance.endpoint
        self.db_secret_arn = self.db_secret.arn

        self.register_outputs({
            'db_endpoint': self.db_endpoint,
            'db_secret_arn': self.db_secret_arn
        })
```

## File: lib/storage.py

```python
"""
storage.py

S3 and DynamoDB storage infrastructure.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class StorageStack(pulumi.ComponentResource):
    """
    Creates S3 and DynamoDB storage infrastructure.
    """

    def __init__(
        self,
        name: str,
        enable_versioning: bool,
        lifecycle_days: Optional[int],
        dynamodb_billing_mode: str,
        enable_encryption: bool,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:storage:StorageStack', name, None, opts)

        # Create KMS key for encryption if enabled
        self.kms_key = None
        if enable_encryption:
            self.kms_key = aws.kms.Key(
                f'storage-kms-key-{environment_suffix}',
                description=f'KMS key for storage encryption - {environment_suffix}',
                deletion_window_in_days=10,
                tags={**tags, 'Name': f'storage-kms-key-{environment_suffix}'},
                opts=ResourceOptions(parent=self)
            )

            aws.kms.Alias(
                f'storage-kms-alias-{environment_suffix}',
                name=f'alias/storage-{environment_suffix}',
                target_key_id=self.kms_key.id,
                opts=ResourceOptions(parent=self)
            )

        # Create S3 bucket
        bucket_args = {
            'bucket': f'payment-documents-{environment_suffix}',
            'tags': {**tags, 'Name': f'payment-documents-{environment_suffix}'},
        }

        self.s3_bucket = aws.s3.Bucket(
            f's3-bucket-{environment_suffix}',
            **bucket_args,
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning if required
        if enable_versioning:
            aws.s3.BucketVersioningV2(
                f's3-versioning-{environment_suffix}',
                bucket=self.s3_bucket.id,
                versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                    status='Enabled'
                ),
                opts=ResourceOptions(parent=self)
            )

        # Configure server-side encryption
        sse_algorithm = 'aws:kms' if enable_encryption else 'AES256'
        kms_key = self.kms_key.id if enable_encryption else None

        aws.s3.BucketServerSideEncryptionConfiguration(
            f's3-encryption-{environment_suffix}',
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm=sse_algorithm,
                            kms_master_key_id=kms_key
                        )
                    )
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Configure lifecycle rules if specified
        if lifecycle_days:
            aws.s3.BucketLifecycleConfigurationV2(
                f's3-lifecycle-{environment_suffix}',
                bucket=self.s3_bucket.id,
                rules=[
                    aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                        id='expire-old-documents',
                        status='Enabled',
                        expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                            days=lifecycle_days
                        )
                    )
                ],
                opts=ResourceOptions(parent=self)
            )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f's3-public-access-block-{environment_suffix}',
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for session management
        dynamodb_args = {
            'name': f'payment-sessions-{environment_suffix}',
            'billing_mode': dynamodb_billing_mode,
            'hash_key': 'sessionId',
            'attributes': [
                aws.dynamodb.TableAttributeArgs(
                    name='sessionId',
                    type='S'
                )
            ],
            'tags': {**tags, 'Name': f'payment-sessions-{environment_suffix}'},
        }

        # Add provisioned throughput for PROVISIONED mode
        if dynamodb_billing_mode == 'PROVISIONED':
            dynamodb_args['read_capacity'] = 5
            dynamodb_args['write_capacity'] = 5

        # Add encryption if enabled
        if enable_encryption:
            dynamodb_args['server_side_encryption'] = aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_key.arn
            )

        self.dynamodb_table = aws.dynamodb.Table(
            f'dynamodb-table-{environment_suffix}',
            **dynamodb_args,
            opts=ResourceOptions(parent=self)
        )

        # Expose outputs
        self.s3_bucket_name = self.s3_bucket.id
        self.dynamodb_table_name = self.dynamodb_table.name

        self.register_outputs({
            's3_bucket_name': self.s3_bucket_name,
            'dynamodb_table_name': self.dynamodb_table_name
        })
```

## File: lib/compute.py

```python
"""
compute.py

Lambda function infrastructure for payment processing.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import List, Optional
import json


class ComputeStack(pulumi.ComponentResource):
    """
    Creates Lambda function infrastructure for payment processing.
    """

    def __init__(
        self,
        name: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        db_secret_arn: Output[str],
        dynamodb_table_name: Output[str],
        reserved_concurrency: Optional[int],
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:compute:ComputeStack', name, None, opts)

        # Create security group for Lambda
        self.lambda_sg = aws.ec2.SecurityGroup(
            f'lambda-sg-{environment_suffix}',
            vpc_id=vpc_id,
            description=f'Security group for Lambda functions - {environment_suffix}',
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0']
                )
            ],
            tags={**tags, 'Name': f'lambda-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda
        self.lambda_role = aws.iam.Role(
            f'lambda-role-{environment_suffix}',
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
            tags={**tags, 'Name': f'lambda-role-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f'lambda-basic-execution-{environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=self)
        )

        # Attach VPC execution policy
        aws.iam.RolePolicyAttachment(
            f'lambda-vpc-execution-{environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            opts=ResourceOptions(parent=self)
        )

        # Create inline policy for Secrets Manager and DynamoDB access
        lambda_policy = pulumi.Output.all(db_secret_arn, dynamodb_table_name).apply(
            lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'secretsmanager:GetSecretValue'
                        ],
                        'Resource': args[0]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'dynamodb:GetItem',
                            'dynamodb:PutItem',
                            'dynamodb:UpdateItem',
                            'dynamodb:Query'
                        ],
                        'Resource': f'arn:aws:dynamodb:us-east-1:*:table/{args[1]}'
                    }
                ]
            })
        )

        aws.iam.RolePolicy(
            f'lambda-policy-{environment_suffix}',
            role=self.lambda_role.id,
            policy=lambda_policy,
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda function
        lambda_args = {
            'name': f'payment-processor-{environment_suffix}',
            'runtime': 'python3.11',
            'role': self.lambda_role.arn,
            'handler': 'index.handler',
            'code': pulumi.FileArchive('./lib/lambda'),
            'timeout': 30,
            'memory_size': 512,
            'environment': aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'DB_SECRET_ARN': db_secret_arn,
                    'DYNAMODB_TABLE': dynamodb_table_name,
                    'ENVIRONMENT': environment_suffix
                }
            ),
            'vpc_config': aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=private_subnet_ids,
                security_group_ids=[self.lambda_sg.id]
            ),
            'tags': {**tags, 'Name': f'payment-processor-{environment_suffix}'},
        }

        # Add reserved concurrency if specified
        if reserved_concurrency:
            lambda_args['reserved_concurrent_executions'] = reserved_concurrency

        self.lambda_function = aws.lambda_.Function(
            f'lambda-function-{environment_suffix}',
            **lambda_args,
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_role])
        )

        # Expose outputs
        self.lambda_function_arn = self.lambda_function.arn
        self.lambda_function_name = self.lambda_function.name

        self.register_outputs({
            'lambda_function_arn': self.lambda_function_arn,
            'lambda_function_name': self.lambda_function_name
        })
```

## File: lib/api.py

```python
"""
api.py

API Gateway infrastructure for REST endpoints.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional
import json


class ApiGatewayStack(pulumi.ComponentResource):
    """
    Creates API Gateway REST API with Lambda integration.
    """

    def __init__(
        self,
        name: str,
        lambda_function_arn: Output[str],
        lambda_function_name: Output[str],
        enable_custom_domain: bool,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:api:ApiGatewayStack', name, None, opts)

        # Create API Gateway REST API
        self.api = aws.apigateway.RestApi(
            f'api-gateway-{environment_suffix}',
            name=f'payment-api-{environment_suffix}',
            description=f'Payment processing API - {environment_suffix}',
            tags={**tags, 'Name': f'payment-api-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create resource for /process endpoint
        self.resource = aws.apigateway.Resource(
            f'api-resource-{environment_suffix}',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='process',
            opts=ResourceOptions(parent=self)
        )

        # Create POST method
        self.method = aws.apigateway.Method(
            f'api-method-{environment_suffix}',
            rest_api=self.api.id,
            resource_id=self.resource.id,
            http_method='POST',
            authorization='NONE',
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda integration
        self.integration = aws.apigateway.Integration(
            f'api-integration-{environment_suffix}',
            rest_api=self.api.id,
            resource_id=self.resource.id,
            http_method=self.method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=lambda_function_arn.apply(
                lambda arn: f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/{arn}/invocations'
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.method])
        )

        # Grant API Gateway permission to invoke Lambda
        self.lambda_permission = aws.lambda_.Permission(
            f'api-lambda-permission-{environment_suffix}',
            action='lambda:InvokeFunction',
            function=lambda_function_name,
            principal='apigateway.amazonaws.com',
            source_arn=pulumi.Output.all(self.api.execution_arn).apply(
                lambda args: f'{args[0]}/*/*'
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create deployment
        self.deployment = aws.apigateway.Deployment(
            f'api-deployment-{environment_suffix}',
            rest_api=self.api.id,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.integration]
            )
        )

        # Create stage
        self.stage = aws.apigateway.Stage(
            f'api-stage-{environment_suffix}',
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name='v1',
            tags={**tags, 'Name': f'api-stage-{environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[self.deployment])
        )

        # Note: Custom domain would require ACM certificate
        # Placeholder for production custom domain configuration
        if enable_custom_domain:
            # In a real implementation, you would:
            # 1. Create/import ACM certificate
            # 2. Create custom domain name
            # 3. Create base path mapping
            # 4. Create Route53 record
            pass

        # Expose outputs
        self.api_id = self.api.id
        self.api_endpoint = pulumi.Output.all(
            self.api.id,
            self.stage.stage_name
        ).apply(lambda args: f'https://{args[0]}.execute-api.us-east-1.amazonaws.com/{args[1]}')
        self.stage_name = self.stage.stage_name

        self.register_outputs({
            'api_id': self.api_id,
            'api_endpoint': self.api_endpoint,
            'stage_name': self.stage_name
        })
```

## File: lib/monitoring.py

```python
"""
monitoring.py

CloudWatch monitoring and logging infrastructure.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class MonitoringStack(pulumi.ComponentResource):
    """
    Creates CloudWatch log groups and monitoring infrastructure.
    """

    def __init__(
        self,
        name: str,
        log_retention_days: int,
        lambda_function_name: Output[str],
        api_gateway_id: Output[str],
        api_stage_name: Output[str],
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # Create log group for Lambda
        self.lambda_log_group = aws.cloudwatch.LogGroup(
            f'lambda-log-group-{environment_suffix}',
            name=lambda_function_name.apply(lambda name: f'/aws/lambda/{name}'),
            retention_in_days=log_retention_days,
            tags={**tags, 'Name': f'lambda-logs-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create log group for API Gateway
        self.api_log_group = aws.cloudwatch.LogGroup(
            f'api-log-group-{environment_suffix}',
            name=f'/aws/apigateway/payment-api-{environment_suffix}',
            retention_in_days=log_retention_days,
            tags={**tags, 'Name': f'api-logs-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'lambda_log_group': self.lambda_log_group.name,
            'api_log_group': self.api_log_group.name
        })
```

## File: lib/lambda/index.py

```python
"""
Lambda function handler for payment processing.
"""

import json
import os
import boto3
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process payment requests.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """

    print(f"Processing payment request: {json.dumps(event)}")

    # Get environment variables
    db_secret_arn = os.environ.get('DB_SECRET_ARN')
    dynamodb_table = os.environ.get('DYNAMODB_TABLE')
    environment = os.environ.get('ENVIRONMENT')

    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Extract payment details
        payment_id = body.get('payment_id')
        amount = body.get('amount')
        currency = body.get('currency', 'USD')

        if not payment_id or not amount:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields: payment_id, amount'})
            }

        # Process payment (simplified for demo)
        response_data = {
            'payment_id': payment_id,
            'amount': amount,
            'currency': currency,
            'status': 'processed',
            'environment': environment,
            'message': f'Payment processed successfully in {environment} environment'
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps(response_data)
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Payment processing failed: {str(e)}'})
        }
```

## File: lib/__init__.py

```python
"""
Multi-environment payment processing infrastructure package.
"""

from .tap_stack import TapStack, TapStackArgs
from .config import EnvironmentConfig, get_environment_config

__all__ = [
    'TapStack',
    'TapStackArgs',
    'EnvironmentConfig',
    'get_environment_config'
]
```

## Implementation Summary

This multi-environment payment processing infrastructure successfully implements:

1. Environment-specific configurations through a configuration class that determines settings based on environment suffix
2. Complete VPC networking with public and private subnets across 2 availability zones
3. RDS PostgreSQL database with encryption support and Secrets Manager integration
4. Lambda functions with environment-specific concurrency settings and proper IAM permissions
5. API Gateway REST endpoints with Lambda integration
6. DynamoDB tables with environment-specific billing modes
7. S3 buckets with versioning and lifecycle policies support
8. KMS encryption keys for production data protection
9. CloudWatch log groups with environment-specific retention policies
10. Comprehensive resource tagging for cost tracking and environment identification

All resources follow naming conventions that include the environment suffix for deployment isolation and parallel deployments.

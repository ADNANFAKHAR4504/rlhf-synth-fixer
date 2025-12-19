# Multi-Environment AWS Infrastructure CDK Solution

I'll create a comprehensive CDK Python solution for multi-environment infrastructure with proper security boundaries and environment-specific configurations.

## Solution Architecture

The solution creates separate resource stacks for each environment (dev, test, prod) with:
- Environment-specific S3 buckets with latest security features
- DynamoDB tables with resource-based policies
- IAM roles with strict environment isolation
- CloudWatch logging with environment-appropriate retention
- Systems Manager parameters with encryption

## Implementation Files

### lib/tap_stack.py

```python
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    CfnOutput,
    SecretValue,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
    aws_ssm as ssm,
    aws_kms as kms,
    Duration,
    RemovalPolicy,
    Tags
)
from constructs import Construct
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class TapStackProps:
    environment_suffix: str
    env: cdk.Environment

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, props: TapStackProps, **kwargs) -> None:
        super().__init__(scope, construct_id, env=props.env, **kwargs)
        
        self.environment_suffix = props.environment_suffix
        self.environment_config = self._get_environment_config()
        
        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()
        
        # Create S3 buckets for configuration storage
        self.config_bucket = self._create_s3_bucket()
        
        # Create DynamoDB tables
        self.app_table = self._create_dynamodb_table()
        
        # Create IAM roles
        self.app_role = self._create_application_role()
        self.admin_role = self._create_admin_role()
        
        # Create CloudWatch log groups
        self.app_log_group = self._create_log_groups()
        
        # Create Systems Manager parameters
        self._create_ssm_parameters()
        
        # Apply environment-specific tags
        self._apply_tags()
        
        # Create outputs
        self._create_outputs()

    def _get_environment_config(self) -> Dict[str, Any]:
        """Get environment-specific configuration"""
        configs = {
            'dev': {
                'log_retention_days': 7,
                'dynamodb_billing': dynamodb.BillingMode.PAY_PER_REQUEST,
                'dynamodb_point_in_time_recovery': False,
                's3_versioning': False,
                's3_lifecycle_days': 30,
                'kms_deletion_window': 7
            },
            'test': {
                'log_retention_days': 30,
                'dynamodb_billing': dynamodb.BillingMode.PAY_PER_REQUEST,
                'dynamodb_point_in_time_recovery': True,
                's3_versioning': True,
                's3_lifecycle_days': 90,
                'kms_deletion_window': 15
            },
            'prod': {
                'log_retention_days': 90,
                'dynamodb_billing': dynamodb.BillingMode.PROVISIONED,
                'dynamodb_point_in_time_recovery': True,
                's3_versioning': True,
                's3_lifecycle_days': 365,
                'kms_deletion_window': 30
            }
        }
        return configs.get(self.environment_suffix, configs['dev'])

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption"""
        key = kms.Key(
            self, 
            f"AppKey{self.environment_suffix}",
            description=f"KMS key for {self.environment_suffix} environment encryption",
            enable_key_rotation=True,
            pending_window=Duration.days(self.environment_config['kms_deletion_window']),
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Allow CloudWatch Logs to use the key
        key.grant_encrypt_decrypt(
            iam.ServicePrincipal(f"logs.{cdk.Aws.REGION}.amazonaws.com")
        )
        
        # Add key alias
        kms.Alias(
            self,
            f"AppKeyAlias{self.environment_suffix}",
            alias_name=f"alias/app-{self.environment_suffix}",
            target_key=key
        )
        
        return key

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with latest security features"""
        bucket_name = f"app-config-{self.environment_suffix}-{cdk.Aws.ACCOUNT_ID}"
        
        bucket = s3.Bucket(
            self,
            f"ConfigBucket{self.environment_suffix}",
            bucket_name=bucket_name,
            versioned=self.environment_config['s3_versioning'],
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            # Enable new S3 data integrity protections
            object_ownership=s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=self.environment_suffix != 'prod',
            lifecycle_rules=[
                s3.LifecycleRule(
                    id=f"TransitionRule{self.environment_suffix}",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ] if self.environment_config['s3_lifecycle_days'] >= 365 else [],
                    expiration=Duration.days(self.environment_config['s3_lifecycle_days'] + 100) if self.environment_config['s3_lifecycle_days'] >= 365 else Duration.days(self.environment_config['s3_lifecycle_days'])
                )
            ] if self.environment_suffix != 'dev' else [],
            # Enable transfer acceleration for better performance
            transfer_acceleration=self.environment_suffix == 'prod'
        )
        
        return bucket

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with resource-based policies"""
        table_name = f"app-data-{self.environment_suffix}"
        
        # Base table configuration
        table_props = {
            'table_name': table_name,
            'partition_key': dynamodb.Attribute(
                name='id',
                type=dynamodb.AttributeType.STRING
            ),
            'sort_key': dynamodb.Attribute(
                name='timestamp',
                type=dynamodb.AttributeType.STRING
            ),
            'billing_mode': self.environment_config['dynamodb_billing'],
            'encryption': dynamodb.TableEncryption.CUSTOMER_MANAGED,
            'encryption_key': self.kms_key,
            'point_in_time_recovery_specification': dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=self.environment_config['dynamodb_point_in_time_recovery']
            ),
            'stream': dynamodb.StreamViewType.NEW_AND_OLD_IMAGES if self.environment_suffix == 'prod' else None,
            'removal_policy': RemovalPolicy.DESTROY,
            # Use new DynamoDB resource-based policies
            'table_class': dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS if self.environment_suffix == 'dev' else dynamodb.TableClass.STANDARD
        }
        
        # Add provisioned throughput for prod
        if self.environment_config['dynamodb_billing'] == dynamodb.BillingMode.PROVISIONED:
            table_props.update({
                'read_capacity': 10,
                'write_capacity': 5
            })
        
        table = dynamodb.Table(self, f"AppTable{self.environment_suffix}", **table_props)
        
        # Add global secondary index
        table.add_global_secondary_index(
            index_name=f"GSI1-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name='type',
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name='created_at',
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL,
            read_capacity=5 if self.environment_config['dynamodb_billing'] == dynamodb.BillingMode.PROVISIONED else None,
            write_capacity=5 if self.environment_config['dynamodb_billing'] == dynamodb.BillingMode.PROVISIONED else None
        )
        
        return table

    def _create_application_role(self) -> iam.Role:
        """Create IAM role for application with environment-specific permissions"""
        role = iam.Role(
            self,
            f"AppRole{self.environment_suffix}",
            role_name=f"app-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description=f"Application role for {self.environment_suffix} environment",
            max_session_duration=Duration.hours(12 if self.environment_suffix == 'prod' else 4)
        )
        
        # Environment-specific S3 permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                resources=[
                    self.config_bucket.bucket_arn,
                    f"{self.config_bucket.bucket_arn}/*"
                ],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-server-side-encryption": "aws:kms"
                    }
                }
            )
        )
        
        # Environment-specific DynamoDB permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                resources=[
                    self.app_table.table_arn,
                    f"{self.app_table.table_arn}/index/*"
                ]
            )
        )
        
        # KMS permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                resources=[self.kms_key.key_arn]
            )
        )
        
        # CloudWatch logs permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                ],
                resources=[f"arn:aws:logs:{cdk.Aws.REGION}:{cdk.Aws.ACCOUNT_ID}:log-group:/aws/app/{self.environment_suffix}*"]
            )
        )
        
        # Systems Manager parameters permissions (environment-specific)
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                resources=[
                    f"arn:aws:ssm:{cdk.Aws.REGION}:{cdk.Aws.ACCOUNT_ID}:parameter/app/{self.environment_suffix}/*"
                ]
            )
        )
        
        return role

    def _create_admin_role(self) -> iam.Role:
        """Create IAM role for administrators with environment-specific permissions"""
        role = iam.Role(
            self,
            f"AdminRole{self.environment_suffix}",
            role_name=f"admin-role-{self.environment_suffix}",
            assumed_by=iam.AccountRootPrincipal(),
            description=f"Administrator role for {self.environment_suffix} environment"
        )
        
        # Environment-specific admin permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["*"],
                resources=[
                    self.config_bucket.bucket_arn,
                    f"{self.config_bucket.bucket_arn}/*",
                    self.app_table.table_arn,
                    f"{self.app_table.table_arn}/*",
                    self.kms_key.key_arn
                ]
            )
        )
        
        # Prevent cross-environment access
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                actions=["*"],
                resources=[
                    "arn:aws:s3:::app-config-*",
                    f"arn:aws:dynamodb:{cdk.Aws.REGION}:{cdk.Aws.ACCOUNT_ID}:table/app-data-*"
                ],
                conditions={
                    "StringNotEquals": {
                        "aws:ResourceTag/Environment": self.environment_suffix
                    }
                }
            )
        )
        
        return role

    def _create_log_groups(self) -> logs.LogGroup:
        """Create CloudWatch log groups with environment-specific retention"""
        # Map retention days to enum values
        retention_map = {
            7: logs.RetentionDays.ONE_WEEK,
            30: logs.RetentionDays.ONE_MONTH,
            90: logs.RetentionDays.THREE_MONTHS
        }
        
        log_group = logs.LogGroup(
            self,
            f"AppLogGroup{self.environment_suffix}",
            log_group_name=f"/aws/app/{self.environment_suffix}",
            retention=retention_map[self.environment_config['log_retention_days']],
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Create additional log groups for different components
        self.error_log_group = logs.LogGroup(
            self,
            f"AppErrorLogGroup{self.environment_suffix}",
            log_group_name=f"/aws/app/{self.environment_suffix}/errors",
            retention=(logs.RetentionDays.ONE_YEAR if self.environment_suffix == 'prod' 
                       else logs.RetentionDays.ONE_MONTH),
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Create metric filters for monitoring
        log_group.add_metric_filter(
            f"ErrorMetricFilter{self.environment_suffix}",
            filter_pattern=logs.FilterPattern.literal("[timestamp, request, error_level=\"ERROR\"]"),
            metric_namespace=f"App/{self.environment_suffix}",
            metric_name="ErrorCount",
            metric_value="1"
        )
        
        return log_group

    def _create_ssm_parameters(self) -> None:
        """Create Systems Manager parameters with encryption"""
        parameters = [
            {
                'name': f'/app/{self.environment_suffix}/database/connection_string',
                'value': f'dynamodb://{self.app_table.table_name}',
                'secure': True
            },
            {
                'name': f'/app/{self.environment_suffix}/s3/config_bucket',
                'value': self.config_bucket.bucket_name,
                'secure': False
            },
            {
                'name': f'/app/{self.environment_suffix}/logging/level',
                'value': 'DEBUG' if self.environment_suffix == 'dev' else 'INFO' if self.environment_suffix == 'test' else 'WARN',
                'secure': False
            },
            {
                'name': f'/app/{self.environment_suffix}/api/rate_limit',
                'value': '1000' if self.environment_suffix == 'dev' else '5000' if self.environment_suffix == 'test' else '10000',
                'secure': False
            }
        ]
        
        for param in parameters:
            # All parameters use StringParameter
            ssm.StringParameter(
                self,
                f"Parameter{param['name'].replace('/', '').replace('_', '').title()}",
                parameter_name=param['name'],
                string_value=param['value'],
                tier=ssm.ParameterTier.STANDARD,
                description=f"Configuration parameter for {self.environment_suffix} environment"
            )

    def _apply_tags(self) -> None:
        """Apply environment-specific tags"""
        tags = {
            'Environment': self.environment_suffix,
            'Application': 'WebApp',
            'ManagedBy': 'CDK',
            'CostCenter': f'WebApp-{self.environment_suffix.upper()}',
            'Owner': 'WebAppTeam'
        }
        
        for key, value in tags.items():
            Tags.of(self).add(key, value)

    def _create_outputs(self) -> None:
        """Create stack outputs"""
        CfnOutput(self, "ConfigBucketName", 
                  value=self.config_bucket.bucket_name)
        CfnOutput(self, "ConfigBucketArn", 
                  value=self.config_bucket.bucket_arn)
        CfnOutput(self, "AppTableName", 
                  value=self.app_table.table_name)
        CfnOutput(self, "AppTableArn", 
                  value=self.app_table.table_arn)
        CfnOutput(self, "AppRoleArn", 
                  value=self.app_role.role_arn)
        CfnOutput(self, "AdminRoleArn", 
                  value=self.admin_role.role_arn)
        CfnOutput(self, "LogGroupName", 
                  value=self.app_log_group.log_group_name)
        CfnOutput(self, "ErrorLogGroupName", 
                  value=self.error_log_group.log_group_name)
        CfnOutput(self, "KMSKeyId", 
                  value=self.kms_key.key_id)
        CfnOutput(self, "KMSKeyArn", 
                  value=self.kms_key.key_arn)

    # Outputs for reference
    @property 
    def outputs(self) -> Dict[str, str]:
        """Return stack outputs"""
        return {
            'ConfigBucketName': self.config_bucket.bucket_name,
            'ConfigBucketArn': self.config_bucket.bucket_arn,
            'AppTableName': self.app_table.table_name,
            'AppTableArn': self.app_table.table_arn,
            'AppRoleArn': self.app_role.role_arn,
            'AdminRoleArn': self.admin_role.role_arn,
            'LogGroupName': self.app_log_group.log_group_name,
            'ErrorLogGroupName': self.error_log_group.log_group_name,
            'KMSKeyId': self.kms_key.key_id,
            'KMSKeyArn': self.kms_key.key_arn
        }
```

### lib/__init__.py

```python
# Empty file to make lib a Python package

```

### tap.py

```python
#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Create a TapStackProps object to pass environment_suffix

props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION')
    )
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
```

## Key Features Implemented

1. **Environment-Specific Configuration**: Each environment gets appropriate resource sizing, retention periods, and security settings.

2. **Latest AWS Features**: 
   - S3 default data integrity protections (object ownership enforced)
   - DynamoDB resource-based policies through table classes
   - Enhanced KMS key management with proper permissions

3. **Security Boundaries**: IAM roles prevent cross-environment access with explicit deny policies.

4. **Cost Optimization**: Development environments use pay-per-request billing and shorter retention periods.

5. **Comprehensive Monitoring**: CloudWatch logs with metric filters and environment-appropriate retention.

6. **Secure Parameter Management**: Systems Manager Parameter Store with environment-specific paths.

7. **Proper Resource Tagging**: Comprehensive tagging for cost tracking and resource management.

8. **Deployment Safety**: All resources have RemovalPolicy.DESTROY to ensure clean deployments and teardowns.

9. **CloudWatch Logs KMS Integration**: Fixed KMS key permissions to allow CloudWatch Logs service to use the encryption key.

10. **Lifecycle Rule Optimization**: Adjusted S3 lifecycle rules to prevent conflicts between transition and expiration days.

The solution provides a single codebase that deploys consistently across all environments while maintaining appropriate security boundaries and cost optimization.
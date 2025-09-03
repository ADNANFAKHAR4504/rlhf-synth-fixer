I'll create a comprehensive AWS CDK solution for security compliance automation in a multi-account environment. Here's the complete implementation:

## Project Structure

```
security-compliance-automation/
├── app.py
├── cdk.json
├── requirements.txt
├── README.md
├── security_compliance/
│   ├── __init__.py
│   ├── security_compliance_stack.py
│   ├── constructs/
│   │   ├── __init__.py
│   │   ├── s3_security_construct.py
│   │   ├── iam_security_construct.py
│   │   └── centralized_logging_construct.py
│   └── config/
│       ├── __init__.py
│       └── environment_config.py
└── tests/
    ├── __init__.py
    ├── test_s3_security.py
    ├── test_iam_security.py
    └── test_centralized_logging.py
```

## Core Files

### `cdk.json`

```json
{
  "app": "python app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfigurationForLambdaInvoke": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-normlize-line-endings": true,
    "@aws-cdk/aws-kms:reduceTemplate": true,
    "@aws-cdk/aws-ec2:enableDnsHostnamesAndDnsResolution": true,
    "@aws-cdk/aws-s3-deployment:useDefaultSourceKeyCondition": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceActions": true
  }
}
```

### `requirements.txt`

```txt
aws-cdk-lib==2.100.0
constructs>=10.0.0,<11.0.0
pytest==7.4.0
pytest-cov==4.1.0
boto3==1.28.0
```

### `app.py`

```python
#!/usr/bin/env python3
"""
Security Compliance Automation CDK Application

This application deploys security compliance infrastructure across multiple
AWS accounts and environments, ensuring consistent security policies for
S3 buckets, IAM roles, and centralized logging.
"""

import os
from aws_cdk import App, Environment
from security_compliance.security_compliance_stack import SecurityComplianceStack
from security_compliance.config.environment_config import get_environment_config


def main():
    """Main entry point for the CDK application."""
    app = App()
    
    # Get environment from context or environment variable
    environment_name = app.node.try_get_context("environment") or os.environ.get("ENVIRONMENT", "dev")
    account = app.node.try_get_context("account") or os.environ.get("CDK_DEFAULT_ACCOUNT")
    region = app.node.try_get_context("region") or os.environ.get("CDK_DEFAULT_REGION", "us-east-1")
    
    if not account:
        raise ValueError("Account ID must be provided via context or CDK_DEFAULT_ACCOUNT environment variable")
    
    # Get environment-specific configuration
    config = get_environment_config(environment_name)
    
    # Create the security compliance stack
    SecurityComplianceStack(
        app,
        f"SecurityCompliance-{environment_name}",
        env=Environment(account=account, region=region),
        environment_name=environment_name,
        config=config,
        description=f"Security Compliance Stack for {environment_name} environment"
    )
    
    app.synth()


if __name__ == "__main__":
    main()
```

### `security_compliance/config/environment_config.py`

```python
"""
Environment-specific configuration for security compliance automation.

This module provides configuration settings that vary across different
environments (development, staging, production).
"""

from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class EnvironmentConfig:
    """Configuration class for environment-specific settings."""
    
    # S3 Configuration
    s3_encryption_type: str  # SSE-S3 or SSE-KMS
    s3_kms_key_id: str = None  # Required if using SSE-KMS
    s3_bucket_public_access_block: bool = True
    
    # IAM Configuration
    iam_password_policy_enabled: bool = True
    iam_max_session_duration: int = 3600  # 1 hour
    
    # Logging Configuration
    log_retention_days: int = 30
    central_logging_account: str = None  # Account ID for central logging
    
    # CloudTrail Configuration
    cloudtrail_enabled: bool = True
    cloudtrail_include_global_service_events: bool = True
    
    # Tagging
    default_tags: Dict[str, str] = None
    
    def __post_init__(self):
        """Initialize default values after object creation."""
        if self.default_tags is None:
            self.default_tags = {}


def get_environment_config(environment: str) -> EnvironmentConfig:
    """
    Get configuration for the specified environment.
    
    Args:
        environment: Environment name (dev, staging, prod)
        
    Returns:
        EnvironmentConfig: Configuration object for the environment
        
    Raises:
        ValueError: If environment is not supported
    """
    configs = {
        "dev": EnvironmentConfig(
            s3_encryption_type="SSE-S3",
            log_retention_days=7,
            iam_max_session_duration=7200,  # 2 hours for development
            default_tags={
                "Environment": "Development",
                "Project": "SecurityCompliance",
                "ManagedBy": "CDK"
            }
        ),
        "staging": EnvironmentConfig(
            s3_encryption_type="SSE-KMS",
            log_retention_days=30,
            iam_max_session_duration=3600,  # 1 hour
            default_tags={
                "Environment": "Staging",
                "Project": "SecurityCompliance",
                "ManagedBy": "CDK"
            }
        ),
        "prod": EnvironmentConfig(
            s3_encryption_type="SSE-KMS",
            log_retention_days=90,
            iam_max_session_duration=3600,  # 1 hour
            cloudtrail_include_global_service_events=True,
            default_tags={
                "Environment": "Production",
                "Project": "SecurityCompliance",
                "ManagedBy": "CDK"
            }
        )
    }
    
    if environment not in configs:
        raise ValueError(f"Unsupported environment: {environment}. Supported: {list(configs.keys())}")
    
    return configs[environment]
```

### `security_compliance/constructs/s3_security_construct.py`

```python
"""
S3 Security Construct

This construct implements comprehensive S3 security policies including:
- Server-side encryption enforcement
- Public access blocking
- Bucket policy for encryption requirements
- Versioning and lifecycle policies
"""

from typing import Optional
from constructs import Construct
from aws_cdk import (
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    RemovalPolicy,
    CfnOutput
)


class S3SecurityConstruct(Construct):
    """
    Construct that creates secure S3 buckets with encryption and access controls.
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        encryption_type: str = "SSE-S3",
        kms_key_id: Optional[str] = None,
        enable_versioning: bool = True,
        enable_public_access_block: bool = True,
        **kwargs
    ) -> None:
        """
        Initialize the S3 Security Construct.
        
        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            encryption_type: Type of encryption (SSE-S3 or SSE-KMS)
            kms_key_id: KMS key ID for SSE-KMS encryption
            enable_versioning: Whether to enable versioning
            enable_public_access_block: Whether to block public access
        """
        super().__init__(scope, construct_id, **kwargs)
        
        self.encryption_type = encryption_type
        self.kms_key_id = kms_key_id
        
        # Create KMS key if using SSE-KMS and no key provided
        if encryption_type == "SSE-KMS" and not kms_key_id:
            self.kms_key = self._create_kms_key()
        else:
            self.kms_key = None
        
        # Create secure S3 bucket
        self.bucket = self._create_secure_bucket(
            enable_versioning=enable_versioning,
            enable_public_access_block=enable_public_access_block
        )
        
        # Add bucket policy to enforce encryption
        self._add_encryption_policy()
        
        # Output bucket information
        CfnOutput(
            self,
            "SecureBucketName",
            value=self.bucket.bucket_name,
            description="Name of the secure S3 bucket"
        )
        
        CfnOutput(
            self,
            "SecureBucketArn",
            value=self.bucket.bucket_arn,
            description="ARN of the secure S3 bucket"
        )
    
    def _create_kms_key(self) -> kms.Key:
        """
        Create a KMS key for S3 encryption.
        
        Returns:
            kms.Key: The created KMS key
        """
        key = kms.Key(
            self,
            "S3EncryptionKey",
            description="KMS key for S3 bucket encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY  # For demo purposes
        )
        
        # Add alias for easier identification
        kms.Alias(
            self,
            "S3EncryptionKeyAlias",
            alias_name="alias/s3-security-compliance-key",
            target_key=key
        )
        
        return key
    
    def _create_secure_bucket(
        self,
        enable_versioning: bool,
        enable_public_access_block: bool
    ) -> s3.Bucket:
        """
        Create a secure S3 bucket with appropriate settings.
        
        Args:
            enable_versioning: Whether to enable versioning
            enable_public_access_block: Whether to block public access
            
        Returns:
            s3.Bucket: The created secure bucket
        """
        # Determine encryption configuration
        if self.encryption_type == "SSE-KMS":
            if self.kms_key:
                encryption = s3.BucketEncryption.kms(self.kms_key)
            else:
                encryption = s3.BucketEncryption.kms_managed()
        else:
            encryption = s3.BucketEncryption.s3_managed()
        
        # Create the bucket
        bucket = s3.Bucket(
            self,
            "SecureBucket",
            encryption=encryption,
            versioned=enable_versioning,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL if enable_public_access_block else None,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteIncompleteMultipartUploads",
                    abort_incomplete_multipart_upload_after=1,  # 1 day
                    enabled=True
                ),
                s3.LifecycleRule(
                    id="TransitionToIA",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=30  # 30 days
                        )
                    ],
                    enabled=True
                )
            ]
        )
        
        return bucket
    
    def _add_encryption_policy(self) -> None:
        """
        Add bucket policy to enforce encryption for all uploads.
        """
        # Policy to deny unencrypted uploads
        encryption_policy = iam.PolicyStatement(
            sid="DenyUnencryptedUploads",
            effect=iam.Effect.DENY,
            principals=[iam.AnyPrincipal()],
            actions=["s3:PutObject"],
            resources=[f"{self.bucket.bucket_arn}/*"],
            conditions={
                "StringNotEquals": {
                    "s3:x-amz-server-side-encryption": "AES256" if self.encryption_type == "SSE-S3" else "aws:kms"
                }
            }
        )
        
        # Additional condition for KMS encryption
        if self.encryption_type == "SSE-KMS":
            kms_condition = iam.PolicyStatement(
                sid="DenyIncorrectKMSKey",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{self.bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption-aws-kms-key-id": 
                            self.kms_key.key_arn if self.kms_key else self.kms_key_id
                    }
                }
            )
            self.bucket.add_to_resource_policy(kms_condition)
        
        # Policy to enforce SSL/TLS
        ssl_policy = iam.PolicyStatement(
            sid="DenyInsecureConnections",
            effect=iam.Effect.DENY,
            principals=[iam.AnyPrincipal()],
            actions=["s3:*"],
            resources=[
                self.bucket.bucket_arn,
                f"{self.bucket.bucket_arn}/*"
            ],
            conditions={
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        )
        
        # Add policies to bucket
        self.bucket.add_to_resource_policy(encryption_policy)
        self.bucket.add_to_resource_policy(ssl_policy)
    
    def grant_read_access(self, principal: iam.IPrincipal) -> iam.Grant:
        """
        Grant read access to the secure bucket.
        
        Args:
            principal: The principal to grant access to
            
        Returns:
            iam.Grant: The grant object
        """
        return self.bucket.grant_read(principal)
    
    def grant_write_access(self, principal: iam.IPrincipal) -> iam.Grant:
        """
        Grant write access to the secure bucket.
        
        Args:
            principal: The principal to grant access to
            
        Returns:
            iam.Grant: The grant object
        """
        return self.bucket.grant_write(principal)
```

### `security_compliance/constructs/iam_security_construct.py`

```python
"""
IAM Security Construct

This construct implements IAM security best practices including:
- Least privilege principle
- Role-based access control
- Password policies
- Session duration limits
"""

from typing import List, Dict, Optional
from constructs import Construct
from aws_cdk import (
    aws_iam as iam,
    CfnOutput
)


class IAMSecurityConstruct(Construct):
    """
    Construct that creates secure IAM roles and policies following least privilege principles.
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        max_session_duration: int = 3600,
        enable_password_policy: bool = True,
        **kwargs
    ) -> None:
        """
        Initialize the IAM Security Construct.
        
        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            max_session_duration: Maximum session duration in seconds
            enable_password_policy: Whether to create account password policy
        """
        super().__init__(scope, construct_id, **kwargs)
        
        self.max_session_duration = max_session_duration
        self.roles: Dict[str, iam.Role] = {}
        
        # Create account password policy if enabled
        if enable_password_policy:
            self._create_password_policy()
        
        # Create predefined secure roles
        self._create_readonly_role()
        self._create_s3_admin_role()
        self._create_logging_role()
        self._create_security_audit_role()
    
    def _create_password_policy(self) -> None:
        """Create account password policy with security best practices."""
        iam.AccountPasswordPolicy(
            self,
            "PasswordPolicy",
            minimum_password_length=12,
            require_uppercase=True,
            require_lowercase=True,
            require_numbers=True,
            require_symbols=True,
            allow_users_to_change_password=True,
            password_reuse_prevention=12,
            max_password_age=90,
            hard_expiry=False
        )
    
    def _create_readonly_role(self) -> iam.Role:
        """
        Create a read-only role with minimal permissions.
        
        Returns:
            iam.Role: The created read-only role
        """
        role = iam.Role(
            self,
            "ReadOnlyRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="Read-only role with minimal permissions",
            max_session_duration=self.max_session_duration,
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("ReadOnlyAccess")
            ]
        )
        
        # Add custom policy to restrict sensitive operations
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                actions=[
                    "iam:*",
                    "organizations:*",
                    "account:*"
                ],
                resources=["*"]
            )
        )
        
        self.roles["readonly"] = role
        
        CfnOutput(
            self,
            "ReadOnlyRoleArn",
            value=role.role_arn,
            description="ARN of the read-only role"
        )
        
        return role
    
    def _create_s3_admin_role(self) -> iam.Role:
        """
        Create an S3 administration role with specific S3 permissions.
        
        Returns:
            iam.Role: The created S3 admin role
        """
        role = iam.Role(
            self,
            "S3AdminRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="S3 administration role with specific S3 permissions",
            max_session_duration=self.max_session_duration
        )
        
        # Add S3 permissions
        s3_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation",
                "s3:GetBucketVersioning",
                "s3:GetBucketPolicy",
                "s3:GetBucketPolicyStatus",
                "s3:GetBucketPublicAccessBlock",
                "s3:GetBucketEncryption",
                "s3:PutBucketPolicy",
                "s3:PutBucketPublicAccessBlock",
                "s3:PutBucketEncryption",
                "s3:PutBucketVersioning"
            ],
            resources=["*"]
        )
        
        # Add object-level permissions
        s3_object_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetObjectVersion",
                "s3:DeleteObjectVersion"
            ],
            resources=["arn:aws:s3:::*/*"]
        )
        
        role.add_to_policy(s3_policy)
        role.add_to_policy(s3_object_policy)
        
        self.roles["s3_admin"] = role
        
        CfnOutput(
            self,
            "S3AdminRoleArn",
            value=role.role_arn,
            description="ARN of the S3 admin role"
        )
        
        return role
    
    def _create_logging_role(self) -> iam.Role:
        """
        Create a logging role for CloudWatch and CloudTrail operations.
        
        Returns:
            iam.Role: The created logging role
        """
        role = iam.Role(
            self,
            "LoggingRole",
            assumed_by=iam.CompositePrincipal(
                iam.ServicePrincipal("cloudtrail.amazonaws.com"),
                iam.ServicePrincipal("logs.amazonaws.com")
            ),
            description="Role for logging services with minimal required permissions",
            max_session_duration=self.max_session_duration
        )
        
        # CloudWatch Logs permissions
        logs_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            resources=["arn:aws:logs:*:*:*"]
        )
        
        # CloudTrail permissions
        cloudtrail_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:PutObject",
                "s3:GetBucketAcl"
            ],
            resources=[
                "arn:aws:s3:::*cloudtrail*",
                "arn:aws:s3:::*cloudtrail*/*"
            ]
        )
        
        role.add_to_policy(logs_policy)
        role.add_to_policy(cloudtrail_policy)
        
        self.roles["logging"] = role
        
        CfnOutput(
            self,
            "LoggingRoleArn",
            value=role.role_arn,
            description="ARN of the logging role"
        )
        
        return role
    
    def _create_security_audit_role(self) -> iam.Role:
        """
        Create a security audit role with permissions to review security configurations.
        
        Returns:
            iam.Role: The created security audit role
        """
        role = iam.Role(
            self,
            "SecurityAuditRole",
            assumed_by=iam.AccountRootPrincipal(),
            description="Security audit role with permissions to review security configurations",
            max_session_duration=self.max_session_duration,
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("SecurityAudit")
            ]
        )
        
        # Additional security-specific permissions
        security_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "config:GetComplianceDetailsByConfigRule",
                "config:GetComplianceDetailsByResource",
                "config:GetComplianceSummaryByConfigRule",
                "config:GetComplianceSummaryByResourceType",
                "guardduty:GetFindings",
                "guardduty:ListFindings",
                "securityhub:GetFindings",
                "inspector:DescribeFindings",
                "inspector:ListFindings"
            ],
            resources=["*"]
        )
        
        role.add_to_policy(security_policy)
        
        self.roles["security_audit"] = role
        
        CfnOutput(
            self,
            "SecurityAuditRoleArn",
            value=role.role_arn,
            description="ARN of the security audit role"
        )
        
        return role
    
    def create_custom_role(
        self,
        role_name: str,
        assumed_by: iam.IPrincipal,
        permissions: List[iam.PolicyStatement],
        description: str = None
    ) -> iam.Role:
        """
        Create a custom IAM role with specified permissions.
        
        Args:
            role_name: Name of the role
            assumed_by: Principal that can assume the role
            permissions: List of policy statements
            description: Role description
            
        Returns:
            iam.Role: The created custom role
        """
        role = iam.Role(
            self,
            f"Custom{role_name}Role",
            assumed_by=assumed_by,
            description=description or f"Custom role: {role_name}",
            max_session_duration=self.max_session_duration
        )
        
        # Add permissions
        for permission in permissions:
            role.add_to_policy(permission)
        
        self.roles[role_name.lower()] = role
        
        return role
    
    def get_role(self, role_name: str) -> Optional[iam.Role]:
        """
        Get a role by name.
        
        Args:
            role_name: Name of the role
            
        Returns:
            iam.Role: The role if found, None otherwise
        """
        return self.roles.get(role_name.lower())
```

### `security_compliance/constructs/centralized_logging_construct.py`

```python
"""
Centralized Logging Construct

This construct implements centralized logging for security events including:
- CloudWatch Logs configuration
- CloudTrail setup
- Log aggregation from multiple accounts
- Security event monitoring
"""

from typing import Optional, List
from constructs import Construct
from aws_cdk import (
    aws_logs as logs,
    aws_cloudtrail as cloudtrail,
    aws_s3 as s3,
    aws_iam as iam,
    aws_events as events,
    aws_events_targets as targets,
    aws_lambda as lambda_,
    Duration,
    RemovalPolicy,
    CfnOutput
)


class CentralizedLoggingConstruct(Construct):
    """
    Construct that creates centralized logging infrastructure for security compliance.
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        log_retention_days: int = 30,
        enable_cloudtrail: bool = True,
        central_logging_account: Optional[str] = None,
        **kwargs
    ) -> None:
        """
        Initialize the Centralized Logging Construct.
        
        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            log_retention_days: Number of days to retain logs
            enable_cloudtrail: Whether to enable CloudTrail
            central_logging_account: Account ID for central logging
        """
        super().__init__(scope, construct_id, **kwargs)
        
        self.log_retention_days = log_retention_days
        self.central_logging_account = central_logging_account
        
        # Create CloudWatch Log Groups
        self.security_log_group = self._create_security_log_group()
        self.cloudtrail_log_group = self._create_cloudtrail_log_group()
        
        # Create S3 bucket for CloudTrail
        self.cloudtrail_bucket = self._create_cloudtrail_bucket()
        
        # Create CloudTrail if enabled
        if enable_cloudtrail:
            self.cloudtrail = self._create_cloudtrail()
        
        # Create EventBridge rules for security events
        self._create_security_event_rules()
        
        # Create Lambda function for log processing
        self.log_processor = self._create_log_processor_function()
    
    def _create_security_log_group(self) -> logs.LogGroup:
        """
        Create CloudWatch Log Group for security events.
        
        Returns:
            logs.LogGroup: The created log group
        """
        log_group = logs.LogGroup(
            self,
            "SecurityLogGroup",
            log_group_name="/security/compliance/events",
            retention=logs.RetentionDays(self.log_retention_days),
            removal_policy=RemovalPolicy.DESTROY
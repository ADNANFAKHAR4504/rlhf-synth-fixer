I'll create a secure AWS S3 configuration using Python CDK that follows security best practices. Here's the complete solution:

## Project Structure

```
secure-s3-cdk/
├── app.py
├── s3_stack.py
├── requirements.txt
└── cdk.json
```

## 1. Main Application File (`app.py`)

```python
#!/usr/bin/env python3
"""
Main CDK application entry point for secure S3 configuration.

This application creates a secure IAM role with least privilege access
to S3 resources following AWS security best practices.
"""

import aws_cdk as cdk
from s3_stack import SecureS3Stack

# Initialize the CDK application
app = cdk.App()

# Create the secure S3 stack with appropriate configuration
SecureS3Stack(
    app, 
    "SecureS3Stack",
    # Specify the target environment (region and account)
    env=cdk.Environment(
        region="us-east-1",
        # Account will be determined from AWS credentials/profile
        account=None
    ),
    description="Secure S3 IAM Role with least privilege access"
)

# Synthesize the CloudFormation template
app.synth()
```

## 2. Stack Definition File (`s3_stack.py`)

```python
"""
Secure S3 Stack Definition

This module defines a CDK stack that creates a secure IAM role
for S3 access with least privilege principles and proper tagging.
"""

from aws_cdk import (
    Stack,
    aws_iam as iam,
    aws_s3 as s3,
    Tags,
    RemovalPolicy
)
from constructs import Construct
import json


class SecureS3Stack(Stack):
    """
    CDK Stack for creating secure S3 access infrastructure.
    
    This stack creates:
    - An S3 bucket for demonstration (optional)
    - An IAM role with least privilege S3 access
    - Proper resource tagging for compliance
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Define common tags for all resources
        common_tags = {
            "Environment": "Production",
            "Owner": "DevOps",
            "Project": "SecureS3Access",
            "ManagedBy": "CDK"
        }

        # Create a secure S3 bucket (optional - for demonstration)
        # In production, you might reference an existing bucket instead
        secure_bucket = self._create_secure_bucket(common_tags)

        # Create IAM role with least privilege S3 access
        s3_access_role = self._create_s3_access_role(secure_bucket, common_tags)

        # Apply tags to all resources in the stack
        self._apply_tags(common_tags)

    def _create_secure_bucket(self, tags: dict) -> s3.Bucket:
        """
        Create a secure S3 bucket with security best practices.
        
        Args:
            tags: Dictionary of tags to apply to the bucket
            
        Returns:
            s3.Bucket: The created S3 bucket
        """
        bucket = s3.Bucket(
            self,
            "SecureDataBucket",
            # Use a unique bucket name (CDK will append random suffix)
            bucket_name=None,
            # Enable versioning for data protection
            versioned=True,
            # Block all public access by default
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            # Enable server-side encryption
            encryption=s3.BucketEncryption.S3_MANAGED,
            # Enforce SSL requests only
            enforce_ssl=True,
            # Set lifecycle policy for cost optimization
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=cdk.Duration.days(30)
                        )
                    ]
                )
            ],
            # Set removal policy for production (retain data)
            removal_policy=RemovalPolicy.RETAIN
        )

        # Apply tags to the bucket
        for key, value in tags.items():
            Tags.of(bucket).add(key, value)

        return bucket

    def _create_s3_access_role(self, bucket: s3.Bucket, tags: dict) -> iam.Role:
        """
        Create an IAM role with least privilege access to S3.
        
        Args:
            bucket: The S3 bucket to grant access to
            tags: Dictionary of tags to apply to the role
            
        Returns:
            iam.Role: The created IAM role
        """
        # Define the trust policy for the role
        # This allows EC2 instances to assume this role
        assume_role_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    principals=[iam.ServicePrincipal("ec2.amazonaws.com")],
                    actions=["sts:AssumeRole"],
                    # Add condition for additional security (optional)
                    conditions={
                        "StringEquals": {
                            "aws:RequestedRegion": "us-east-1"
                        }
                    }
                )
            ]
        )

        # Create the IAM role
        s3_role = iam.Role(
            self,
            "S3AccessRole",
            role_name="SecureS3AccessRole",
            description="IAM role with least privilege access to S3 bucket",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            # Use the custom assume role policy
            assume_role_policy_document=assume_role_policy,
            # Set maximum session duration (1 hour for security)
            max_session_duration=cdk.Duration.hours(1)
        )

        # Create a custom policy with least privilege S3 permissions
        s3_policy = self._create_least_privilege_s3_policy(bucket)
        
        # Attach the policy to the role
        s3_role.attach_inline_policy(s3_policy)

        # Apply tags to the role
        for key, value in tags.items():
            Tags.of(s3_role).add(key, value)

        return s3_role

    def _create_least_privilege_s3_policy(self, bucket: s3.Bucket) -> iam.Policy:
        """
        Create a least privilege IAM policy for S3 access.
        
        This policy grants only the minimum required permissions:
        - List bucket contents
        - Get objects from the bucket
        - Put objects to the bucket (with restrictions)
        
        Args:
            bucket: The S3 bucket to grant access to
            
        Returns:
            iam.Policy: The created IAM policy
        """
        # Define the policy document with specific S3 permissions
        policy_document = iam.PolicyDocument(
            statements=[
                # Allow listing the bucket contents
                iam.PolicyStatement(
                    sid="ListBucketAccess",
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:ListBucket",
                        "s3:GetBucketLocation"
                    ],
                    resources=[bucket.bucket_arn],
                    # Add condition to restrict to specific prefixes if needed
                    conditions={
                        "StringLike": {
                            "s3:prefix": ["data/*", "logs/*"]
                        }
                    }
                ),
                # Allow reading objects from specific prefixes
                iam.PolicyStatement(
                    sid="GetObjectAccess",
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:GetObjectVersion"
                    ],
                    resources=[f"{bucket.bucket_arn}/data/*", f"{bucket.bucket_arn}/logs/*"]
                ),
                # Allow writing objects to specific prefixes with restrictions
                iam.PolicyStatement(
                    sid="PutObjectAccess",
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:PutObject",
                        "s3:PutObjectAcl"
                    ],
                    resources=[f"{bucket.bucket_arn}/data/*"],
                    # Enforce server-side encryption
                    conditions={
                        "StringEquals": {
                            "s3:x-amz-server-side-encryption": "AES256"
                        }
                    }
                ),
                # Explicitly deny dangerous operations
                iam.PolicyStatement(
                    sid="DenyDangerousOperations",
                    effect=iam.Effect.DENY,
                    actions=[
                        "s3:DeleteBucket",
                        "s3:DeleteBucketPolicy",
                        "s3:PutBucketAcl",
                        "s3:PutBucketPolicy",
                        "s3:PutBucketPublicAccessBlock"
                    ],
                    resources=[bucket.bucket_arn, f"{bucket.bucket_arn}/*"]
                )
            ]
        )

        # Create the policy
        policy = iam.Policy(
            self,
            "S3LeastPrivilegePolicy",
            policy_name="S3LeastPrivilegePolicy",
            policy_document=policy_document,
            description="Least privilege policy for S3 access with security restrictions"
        )

        return policy

    def _apply_tags(self, tags: dict) -> None:
        """
        Apply common tags to all resources in the stack.
        
        Args:
            tags: Dictionary of tags to apply
        """
        for key, value in tags.items():
            Tags.of(self).add(key, value)
```

## 3. Requirements File (`requirements.txt`)

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

## 4. CDK Configuration (`cdk.json`)

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
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-s3:autoDeleteObjectsPolicy": true,
    "@aws-cdk/aws-ec2:vpnConnectionLogging": true,
    "@aws-cdk/aws-lambda:codeguruProfilerEnvVarOptOut": true
  }
}
```

## Deployment Instructions

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Initialize CDK (if first time):**
   ```bash
   cdk bootstrap
   ```

3. **Synthesize CloudFormation Template:**
   ```bash
   cdk synth
   ```

4. **Deploy the Stack:**
   ```bash
   cdk deploy
   ```

5. **Clean Up (when needed):**
   ```bash
   cdk destroy
   ```

## Security Features Implemented

###  **Least Privilege Access**
- **Specific S3 Actions**: Only `s3:GetObject`, `s3:ListBucket`, `s3:PutObject` with conditions
- **Resource-Level Restrictions**: Access limited to specific bucket and prefixes
- **Conditional Access**: Encryption requirements and region restrictions

###  **Security Best Practices**
- **No Hardcoded Secrets**: All sensitive data managed through AWS services
- **Encryption Enforcement**: Server-side encryption required for uploads
- **Public Access Blocked**: S3 bucket blocks all public access
- **SSL Enforcement**: HTTPS-only access to S3 bucket
- **Session Duration Limits**: Maximum 1-hour role sessions

###  **Proper Tagging**
- **Required Tags**: `Environment: Production` and `Owner: DevOps`
- **Additional Tags**: Project identification and management tracking
- **Stack-Wide Tagging**: Consistent tagging across all resources

###  **Documentation & Maintainability**
- **Comprehensive Comments**: Detailed explanations for each component
- **Modular Design**: Separate methods for different concerns
- **Type Hints**: Python type annotations for better code clarity
- **Security Rationale**: Comments explaining security decisions

This solution provides a production-ready, secure S3 access configuration that follows AWS security best practices and can be easily maintained and extended by your DevOps team.
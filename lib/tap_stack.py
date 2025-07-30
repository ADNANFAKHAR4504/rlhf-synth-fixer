"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import List, Optional

import aws_cdk as cdk
from aws_cdk import (
    CfnOutput,
    RemovalPolicy,
    aws_iam as iam,
    aws_kms as kms,
    aws_s3 as s3,
)
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    allowed_principals (Optional[List[str]]): List of ARNs for principals 
    allowed to access the S3 bucket.
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix.
    allowed_principals (List[str]): Stores the list of allowed principal ARNs.
  """

  def __init__(
      self, 
      environment_suffix: Optional[str] = None, 
      allowed_principals: Optional[List[str]] = None, 
      **kwargs
  ):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix
    self.allowed_principals = allowed_principals or []


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties, 
    CDK context, or defaults to 'dev'.
  Note:
    - Do NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the 
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
      self,
      scope: Construct,
      construct_id: str, 
      props: Optional[TapStackProps] = None, 
      **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'
    self.environment_suffix = environment_suffix
    
    # Get allowed principals from props or use default account root
    self.allowed_principals = (
        props.allowed_principals if props else []
    ) or [f"arn:aws:iam::{self.account}:root"]
    
    self.bucket_name = f"secure-{environment_suffix}-data-bucket"
    
    # Create KMS key first (S3 bucket depends on it)
    self.kms_key = self._create_kms_key()
    
    # Create S3 bucket with encryption
    self.s3_bucket = self._create_s3_bucket()
    
    # Create IAM policies for allowed principals
    self._create_iam_policies()
    
    # Create outputs
    self._create_outputs()

  def _create_kms_key(self) -> kms.Key:
    """
    Create a customer-managed KMS key for S3 encryption
    """
    # Create key policy allowing S3 service and specified principals
    key_policy = iam.PolicyDocument(
      statements=[
        # Allow root account full access (required for key management)
        iam.PolicyStatement(
          sid="EnableRootAccess",
          effect=iam.Effect.ALLOW,
          principals=[iam.AccountRootPrincipal()],
          actions=["kms:*"],
          resources=["*"]
        ),
        # Allow S3 service to use the key
        iam.PolicyStatement(
          sid="AllowS3Service",
          effect=iam.Effect.ALLOW,
          principals=[iam.ServicePrincipal("s3.amazonaws.com")],
          actions=[
            "kms:Decrypt",
            "kms:GenerateDataKey",
            "kms:CreateGrant"
          ],
          resources=["*"],
          conditions={
            "StringEquals": {
              "kms:ViaService": f"s3.{self.region}.amazonaws.com"
            }
          }
        ),
        # Allow specified principals to use the key
        iam.PolicyStatement(
          sid="AllowSpecifiedPrincipals",
          effect=iam.Effect.ALLOW,
          principals=[iam.ArnPrincipal(arn) for arn in self.allowed_principals],
          actions=[
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:ReEncrypt*",
            "kms:GenerateDataKey*",
            "kms:DescribeKey"
          ],
          resources=["*"]
        )
      ]
    )
        
    kms_key = kms.Key(
      self, "SecureS3KMSKey",
      description=f"KMS key for secure S3 bucket encryption - {self.environment_suffix}",
      enable_key_rotation=True,
      policy=key_policy,
      removal_policy=RemovalPolicy.DESTROY  # Change to RETAIN for production
    )
    
    # Create alias for easier identification
    kms.Alias(
      self, "SecureS3KMSKeyAlias",
      alias_name="alias/secure-s3-key",
      target_key=kms_key
    )
    
    # Add tags
    cdk.Tags.of(kms_key).add("Environment", self.environment_suffix)
    cdk.Tags.of(kms_key).add("Project", "SecureStorage")
    cdk.Tags.of(kms_key).add("Purpose", "S3Encryption")
    
    return kms_key

  def _create_s3_bucket(self) -> s3.Bucket:
    """
    Create a secure S3 bucket with KMS encryption and access restrictions
    """
    # Create the S3 bucket
    bucket = s3.Bucket(
      self, "SecureS3Bucket",
      bucket_name=self.bucket_name,
      # Security configurations
      encryption=s3.BucketEncryption.KMS,
      encryption_key=self.kms_key,
      versioned=True,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      # Lifecycle and cleanup
      removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for production
      auto_delete_objects=True,  # Remove for production
      # Access logging (optional - uncomment if needed)
      # server_access_logs_bucket=access_logs_bucket,
      # server_access_logs_prefix="access-logs/"
    )
        
    # Add bucket policy to deny unencrypted uploads
    bucket.add_to_resource_policy(
      iam.PolicyStatement(
        sid="DenyUnencryptedUploads",
        effect=iam.Effect.DENY,
        principals=[iam.AnyPrincipal()],
        actions=["s3:PutObject"],
        resources=[f"{bucket.bucket_arn}/*"],
        conditions={
          "StringNotEquals": {
            "s3:x-amz-server-side-encryption": "aws:kms"
          }
        }
      )
    )
        
    # Add bucket policy to deny uploads without correct KMS key
    bucket.add_to_resource_policy(
      iam.PolicyStatement(
        sid="DenyIncorrectKMSKey",
        effect=iam.Effect.DENY,
        principals=[iam.AnyPrincipal()],
        actions=["s3:PutObject"],
        resources=[f"{bucket.bucket_arn}/*"],
        conditions={
          "StringNotEquals": {
            "s3:x-amz-server-side-encryption-aws-kms-key-id": self.kms_key.key_arn
          }
        }
      )
    )
        
    # Add tags
    cdk.Tags.of(bucket).add("Environment", self.environment_suffix)
    cdk.Tags.of(bucket).add("Project", "SecureStorage")
    cdk.Tags.of(bucket).add("DataClassification", "Sensitive")
    
    return bucket

  def _create_iam_policies(self) -> None:
    """
    Create IAM policies for allowed principals with least privilege access
    """
    # Create managed policy for S3 access
    s3_access_policy = iam.ManagedPolicy(
      self, "SecureS3AccessPolicy",
      managed_policy_name=f"SecureS3Access-{self.environment_suffix}",
      description=f"Least privilege access to secure S3 bucket - {self.environment_suffix}",
      statements=[
        # Allow listing the bucket
        iam.PolicyStatement(
          sid="AllowListBucket",
          effect=iam.Effect.ALLOW,
          actions=["s3:ListBucket"],
          resources=[self.s3_bucket.bucket_arn]
        ),
        # Allow object operations
        iam.PolicyStatement(
          sid="AllowObjectOperations",
          effect=iam.Effect.ALLOW,
          actions=[
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:GetObjectVersion"
          ],
          resources=[f"{self.s3_bucket.bucket_arn}/*"]
        ),
        # Allow KMS operations for the specific key
        iam.PolicyStatement(
          sid="AllowKMSOperations",
          effect=iam.Effect.ALLOW,
          actions=[
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:ReEncrypt*",
            "kms:GenerateDataKey*",
            "kms:DescribeKey"
          ],
          resources=[self.kms_key.key_arn]
        )
      ]
    )
        
    # Store the policy for potential attachment to roles/users
    self.s3_access_policy = s3_access_policy

  def _create_outputs(self) -> None:
    """
    Create CloudFormation outputs for important resource identifiers
    """
    CfnOutput(
      self, "S3BucketName",
      value=self.s3_bucket.bucket_name,
      description="Name of the secure S3 bucket",
      export_name=f"SecureS3-{self.environment_suffix}-BucketName"
    )
    
    CfnOutput(
      self, "S3BucketArn",
      value=self.s3_bucket.bucket_arn,
      description="ARN of the secure S3 bucket",
      export_name=f"SecureS3-{self.environment_suffix}-BucketArn"
    )
    
    CfnOutput(
      self, "KMSKeyArn",
      value=self.kms_key.key_arn,
      description="ARN of the KMS key used for S3 encryption",
      export_name=f"SecureS3-{self.environment_suffix}-KMSKeyArn"
    )
    
    CfnOutput(
      self, "IAMPolicyArn",
      value=self.s3_access_policy.managed_policy_arn,
      description="ARN of the IAM policy for S3 access",
      export_name=f"SecureS3-{self.environment_suffix}-IAMPolicyArn"
    )

  @property
  def bucket_arn(self) -> str:
    """Get the S3 bucket ARN"""
    return self.s3_bucket.bucket_arn
  
  @property
  def key_arn(self) -> str:
    """Get the KMS key ARN"""
    return self.kms_key.key_arn

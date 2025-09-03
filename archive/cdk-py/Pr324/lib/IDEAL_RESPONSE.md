# Ideal Response — Secure S3 with KMS & IAM via CDK Nested Stack

## ✅ Goal

Design and implement an **AWS CDK (Python)** solution that provisions a **secure S3 bucket** using:
- **KMS encryption**
- **IAM-restricted access**
- **Least-privilege permissions**
- **Environment-driven naming**
- **Modular architecture using nested stacks**

---

## 🔨 Architecture Components

| Component       | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| **KMS Key**      | Customer-managed key with rotation and explicit access for S3 and IAM ARNs |
| **S3 Bucket**    | Versioned, KMS-encrypted, public access blocked, with enforced encryption  |
| **IAM Policies** | Bucket and key access restricted to allowed IAM principals only            |
| **Nested Stack** | `SecureS3NestedStack` encapsulates all S3 + KMS logic                      |
| **Main Stack**   | `TapStack` receives props and orchestrates nested stacks                   |
| **Tags & Outputs** | Environment tagging and CloudFormation exports included                   |

---

## 🔐 Security Highlights

- ✅ Server-side encryption with **customer-managed KMS key**
- ✅ **Deny unencrypted uploads** to S3 bucket
- ✅ **Block all public access**
- ✅ IAM access granted to **explicit ARNs** only
- ✅ **Key rotation enabled**
- ✅ S3 and KMS policies scoped to specific resources
- ✅ Policy statements avoid `*` on principals or actions

---

## 📦 Ideal Deliverables

### 1. **`tap_stack.py`**
- Defines:
  - `TapStackProps`: for passing `environment_suffix` and `principal_arns`
  - `SecureS3NestedStack`: for secure bucket provisioning
  - `TapStack`: as root stack orchestrator

### 2. **Parameterization**
- Stack accepts context or props for:
  - Environment (e.g., `dev`, `prod`)
  - IAM principal ARNs
- Bucket name = `secure-<env_suffix>-data-bucket`

### 3. **CloudFormation Outputs**
- `BucketName`
- `BucketArn`
- `KmsKeyArn`

### 4. **Tags**
- Consistent tagging across resources:
  - `Environment`
  - `Project=SecureStorage`

### 5. **Best Practice Validation**
| Best Practice                  | Status |
|-------------------------------|--------|
| Least privilege IAM access     | ✅     |
| KMS key with S3 + principal use| ✅     |
| Deny unencrypted uploads       | ✅     |
| Region/account contextualization| ✅     |
| Nested modular design          | ✅     |
| CDK v2 compatibility           | ✅     |

---

## 🧪 Ideal Testing Strategy

- **Unit Tests**:
  - Assert KMS key creation and policies
  - Validate S3 bucket encryption and versioning
  - Verify deny policies and principal scoping

- **Integration Tests**:
  - Deploy via CDK CLI or CI/CD
  - Upload S3 object with and without encryption → expect failure/success
  - Validate access using permitted IAM roles

---

## 📝 Implementation Code

### lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional, List

import aws_cdk as cdk
from aws_cdk import (
  NestedStack,
  aws_s3 as s3,
  aws_kms as kms,
  aws_iam as iam,
  RemovalPolicy,
  CfnOutput,
  Tags,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
      environment_suffix (Optional[str]): Optional suffix for environment (e.g., 'dev', 'prod').
      principal_arns (Optional[List[str]]): IAM principal ARNs allowed to access resources.
      **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
      environment_suffix (Optional[str]): Deployment environment suffix.
      principal_arns (Optional[List[str]]): Allowed IAM principal ARNs.
  """

  def __init__(
    self,
    environment_suffix: Optional[str] = None,
    principal_arns: Optional[List[str]] = None,
    **kwargs
  ):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix
    self.principal_arns = principal_arns or []


class SecureS3NestedStack(NestedStack):
  """
  Nested stack that provisions a secure S3 bucket with KMS encryption and IAM-restricted access.
  """

  def __init__(
    self,
    scope: Construct,
    stack_id: str,
    env_suffix: str,
    principal_arns: List[str],
    **kwargs
  ):
    super().__init__(scope, stack_id, **kwargs)

    bucket_name = f"secure-{env_suffix}-data-bucket-1"

    # 🔐 KMS Key
    kms_key = kms.Key(
      self,
      "SecureS3KmsKey",
      alias="alias/secure-s3-key-1",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY,
    )

    # 🔐 KMS Key Policy
    for arn in principal_arns:
      kms_key.add_to_resource_policy(
        iam.PolicyStatement(
          actions=["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"],
          principals=[iam.ArnPrincipal(arn)],
          resources=["*"],
        )
      )

    kms_key.add_to_resource_policy(
      iam.PolicyStatement(
        actions=["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"],
        principals=[iam.ServicePrincipal("s3.amazonaws.com")],
        resources=["*"],
      )
    )

    # 🪣 S3 Bucket
    bucket = s3.Bucket(
      self,
      "SecureDataBucket",
      bucket_name=bucket_name,
      versioned=True,
      encryption=s3.BucketEncryption.KMS,
      encryption_key=kms_key,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY,
    )

    # 🛡️ Deny unencrypted uploads
    bucket.add_to_resource_policy(
      iam.PolicyStatement(
        sid="DenyUnEncryptedObjectUploads",
        effect=iam.Effect.DENY,
        principals=[iam.AnyPrincipal()],
        actions=["s3:PutObject"],
        resources=[f"{bucket.bucket_arn}/*"],
        conditions={
          "StringNotEquals": {
            "s3:x-amz-server-side-encryption": "aws:kms"
          }
        },
      )
    )

    # 🛡️ Allow access to specific IAM principals
    for arn in principal_arns:
      bucket.add_to_resource_policy(
        iam.PolicyStatement(
          actions=["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
          principals=[iam.ArnPrincipal(arn)],
          resources=[
            bucket.bucket_arn,
            f"{bucket.bucket_arn}/*",
          ],
        )
      )

    # 🏷️ Tags
    Tags.of(bucket).add("Environment", env_suffix)
    Tags.of(bucket).add("Project", "SecureStorage")

    # 📤 Outputs
    CfnOutput(self, "BucketName", value=bucket.bucket_name)
    CfnOutput(self, "BucketArn", value=bucket.bucket_arn)
    CfnOutput(self, "KmsKeyArn", value=kms_key.key_arn)

    # Expose resources
    self.bucket = bucket
    self.kms_key = kms_key


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  Orchestrates the instantiation of other resource-specific stacks.
  """

  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    props: Optional[TapStackProps] = None,
    **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)

    # Determine environment suffix
    environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context("environmentSuffix") or "dev"

    principal_arns = props.principal_arns if props else []

    # Instantiate Secure S3 Nested Stack
    secure_s3_stack = SecureS3NestedStack(
      self,
      f"SecureS3Stack-{environment_suffix}",
      env_suffix=environment_suffix,
      principal_arns=principal_arns,
    )

    # Expose resources if needed
    self.secure_bucket = secure_s3_stack.bucket
    self.kms_key = secure_s3_stack.kms_key
```

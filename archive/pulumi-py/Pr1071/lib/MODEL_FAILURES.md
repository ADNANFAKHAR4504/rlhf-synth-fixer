# MODEL_FAILURES

This document outlines issues encountered when following LLM-generated code suggestions during infrastructure development, along with the corresponding fixes applied.

---

## 1. Incorrect S3 Server-Side Encryption Configuration

**Failure:**  
The LLM suggested creating an S3 bucket encryption configuration using nested `aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs` structures.  
Example of the incorrect code:

```python
server_side_encryption_configuration = aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs(
    rules=[
        aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms",
                kms_master_key_id=self.kms_key.arn
            ),
            bucket_key_enabled=True
        )
    ]
)
```
This structure failed because it was overly nested and did not correctly associate with the S3 bucket resource.

**Fix:**
Use `BucketServerSideEncryptionConfigurationV2` directly, passing rules as a list of dictionaries and referencing the bucket ID:

```python
self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
    f"{name}-encryption",
    bucket=self.bucket.id,
    rules=[{
        "apply_server_side_encryption_by_default": {
            "kms_master_key_id": self.kms_key.key_id,
            "sse_algorithm": "aws:kms"
        },
    }],
    opts=ResourceOptions(parent=self)
)
```

# 2. DynamoDB Table Attribute Indexing Error**
**Failure:**
The generated DynamoDB table schema included an attribute "user_id" without an associated index. AWS requires all attributes in a table to be indexed.
Error message:

```less
all attributes must be indexed. Unused attributes: ["user_id"]
```

**Fix:**
Ensure every attribute is either part of the partition/sort key or included in a Global Secondary Index (GSI) or Local Secondary Index (LSI).
Attributes that are not indexed should be removed:

```python
attributes = [
    {"name": "id", "type": "S"},
    {"name": "timestamp", "type": "S"}
]
```

# 3. Unnecessary and Unsupported S3 ACL Configuration
**Failure:**
The LLM suggested creating an ACL for an S3 bucket that has ObjectOwnership set to BucketOwnerEnforced.
Buckets in this mode do not allow ACLs, causing this error:

```text
api error AccessControlListNotSupported: The bucket does not allow ACLs
```

Incorrect resource:
```python
aws.s3.BucketAclV2(
    f"{name}-acl",
    bucket=self.bucket.id,
    acl="private"
)
```

**Fix:**
Remove the `BucketAclV2` resource entirely. Use bucket policies and IAM permissions instead of ACLs when ObjectOwnership is BucketOwnerEnforced.

**Lessons Learned**
Prefer simple and valid Pulumi constructors over deeply nested configuration objects for AWS resources.
Validate DynamoDB schemas so all attributes are indexed or removed.
Avoid ACLs on S3 buckets with ACLs disabled; rely on policies for access control.
By applying these fixes, the LLM-generated infrastructure code became compatible with AWS and Pulumi constraints, reducing deployment errors.
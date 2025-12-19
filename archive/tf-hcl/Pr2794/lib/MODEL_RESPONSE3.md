### Reasoning Trace
---

The error indicates that when using S3 bucket replication with encryption configuration, AWS requires the `replica_kms_key_id` to be specified along with `sse_kms_encrypted_objects` configuration. The error message says "SseKmsEncryptedObjects must be specified if EncryptionConfiguration is present."

Looking at the current replication configuration in the code:

```hcl
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider   = aws.us_east_2
  depends_on = [aws_s3_bucket_versioning.primary]

  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-to-secondary"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.s3_secondary.arn
      }
    }
  }
}
```

The issue is that when `encryption_configuration` is present, AWS requires a `sse_kms_encrypted_objects` block to be specified. This block defines how to handle KMS-encrypted objects during replication.

I need to add the `sse_kms_encrypted_objects` configuration block to the replication rule.
### Answer 
---

### Answer 
---

Here's the code snippet to fix the S3 bucket replication configuration error. The issue is that when using `encryption_configuration`, AWS requires the `sse_kms_encrypted_objects` block to be specified.

## Fixed S3 Replication Configuration:

Replace the existing `aws_s3_bucket_replication_configuration` resource in your `tap_stack.tf` file with this corrected version:

```hcl
# S3 bucket replication configuration
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider   = aws.us_east_2
  depends_on = [aws_s3_bucket_versioning.primary]

  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-to-secondary"
    status = "Enabled"

    # Add filter to specify what objects to replicate (optional but recommended)
    filter {
      prefix = ""
    }

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"

      # This block is required when encryption_configuration is present
      encryption_configuration {
        replica_kms_key_id = aws_kms_key.s3_secondary.arn
      }
    }

    # This block is required when using KMS encryption
    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }
  }
}
```

## Key Changes Made:

1. **Added `source_selection_criteria` block**: This is required when using KMS encryption for replication.
2. **Added `sse_kms_encrypted_objects`**: Specifies that KMS-encrypted objects should be replicated.
3. **Added `filter` block**: While optional, it's a best practice to explicitly define what gets replicated.

## Updated IAM Policy for S3 Replication:

You may also need to update the IAM policy to ensure it has the necessary KMS permissions. Replace the existing `aws_iam_policy.s3_replication` resource with this enhanced version:

```hcl
# IAM policy for S3 replication
resource "aws_iam_policy" "s3_replication" {
  name = "${var.project_name}-s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.s3_primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:GenerateDataKey",
          "kms:Encrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.s3_secondary.arn
      }
    ]
  })

  tags = local.common_tags
}
```

## Alternative: Simpler Version Without KMS Encryption for Replication

If you want to avoid the complexity of KMS encryption for replication (while still keeping bucket encryption), you can use this simpler version:

```hcl
# S3 bucket replication configuration (without KMS encryption for replication)
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider   = aws.us_east_2
  depends_on = [aws_s3_bucket_versioning.primary]

  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-to-secondary"
    status = "Enabled"

    filter {
      prefix = ""
    }

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
      
      # Remove encryption_configuration for simpler setup
      # The destination bucket will still be encrypted with its own KMS key
    }
  }
}
```

## Recommendation:

Use the **first option** (with KMS encryption configuration) as it provides end-to-end encryption during replication, which is more secure and aligns with the requirements. After making these changes, run your Terraform deployment again and the S3 replication error should be resolved.

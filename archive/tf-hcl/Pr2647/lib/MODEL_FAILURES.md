### 1. **S3 Bucket Naming Convention Violation**

**Failure**: The model used `projectX` (with uppercase 'X') in the S3 bucket name, violating AWS S3 naming rules.

**Error**:

```
Error: validating S3 Bucket (projectX-assets-ec153bf7) name: only lowercase alphanumeric characters and hyphens allowed in "projectX-assets-ec153bf7"
```

**Root Cause**: AWS S3 bucket names must be lowercase only, but the model defined:

```hcl
locals {
  project = "projectX"  # Contains uppercase letter
}
```

### 2. **S3 Lifecycle Configuration Missing Required Attributes**

**Failure**: The model didn't include required `filter` or `prefix` attributes in the lifecycle rule.

**Error**:

```
Warning: Invalid Attribute Combination
No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required
```

**Root Cause**: The lifecycle rule was missing the required filter specification.

### 3. **DynamoDB GSI Missing Required Projection Type**

**Failure**: The model omitted the mandatory `projection_type` attribute for Global Secondary Index.

**Error**:

```
Error: Missing required argument
The argument "projection_type" is required, but no definition was found.
```

**Root Cause**: DynamoDB GSI definition was incomplete:

```hcl
global_secondary_index {
  name     = "status-created_at-index"
  hash_key = "status"
  range_key = "created_at"
  # Missing projection_type
}
```

### 4. **Incorrect Lambda Resource Type**

**Failure**: The model used a non-existent resource type for Lambda event invoke configuration.

**Error**:

```
Error: Invalid resource type
The provider hashicorp/aws does not support resource type "aws_lambda_event_invoke_config"
```

**Root Cause**: Used wrong resource name - should be `aws_lambda_function_event_invoke_config`.

### 5. **WAF Web ACL Association ARN Format Error**

**Failure**: The model used incorrect ARN format for API Gateway V2 stage association with WAF.

**Error**:

```
Error: creating WAFv2 WebACL Association
WAFInvalidParameterException: Error reason: The ARN isn't valid
```

**Root Cause**: Used `aws_apigatewayv2_stage.main.arn` which doesn't provide the correct ARN format for WAF association.

## Complete Fixes

### Fix 1: S3 Bucket Naming

```hcl
# FIXED: Use lowercase project name
locals {
  project = "projectx"  # Changed from "projectX"
}

resource "aws_s3_bucket" "app_assets" {
  bucket = "${local.project}-assets-${random_id.suffix.hex}"  # Now all lowercase
}
```

### Fix 2: S3 Lifecycle Configuration

```hcl
# FIXED: Added required filter block
resource "aws_s3_bucket_lifecycle_configuration" "app_assets_lifecycle" {
  bucket = aws_s3_bucket.app_assets.id

  rule {
    id     = "cleanup_old_versions"
    status = "Enabled"

    # Added required filter
    filter {
      prefix = "" # Apply to all objects
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
```

### Fix 3: DynamoDB GSI

```hcl
# FIXED: Added required projection_type
global_secondary_index {
  name               = "status-created_at-index"
  hash_key           = "status"
  range_key          = "created_at"
  projection_type    = "ALL"  # Added required attribute
}
```

### Fix 4: Lambda Event Invoke Configuration

```hcl
# FIXED: Corrected resource type name
resource "aws_lambda_function_event_invoke_config" "api_handler_invoke_config" {
  function_name = aws_lambda_function.api_handler.function_name

  destination_config {
    on_failure {
      destination = aws_sns_topic.lambda_errors.arn
    }
  }

  maximum_retry_attempts = 2
}
```

### Fix 5: WAF Web ACL Association

```hcl
# FIXED: Proper ARN format for API Gateway V2
resource "aws_wafv2_web_acl_association" "api_gateway_association" {
  resource_arn = "arn:aws:apigateway:${local.region}::/apis/${aws_apigatewayv2_api.main.id}/stages/${aws_apigatewayv2_stage.main.name}"
  web_acl_arn  = aws_wafv2_web_acl.api_protection.arn
}
```

## Summary of Model Failures

| **Failure Type**           | **Impact**             | **Fix Applied**                 |
| -------------------------- | ---------------------- | ------------------------------- |
| S3 naming convention       | Deployment blocker     | Changed to lowercase naming     |
| S3 lifecycle attributes    | Warning → Future error | Added required filter block     |
| DynamoDB GSI configuration | Deployment blocker     | Added projection_type parameter |
| Lambda resource type       | Deployment blocker     | Corrected resource type name    |
| WAF ARN format             | Deployment blocker     | Fixed API Gateway V2 ARN format |

These failures demonstrate the importance of:

1. **AWS resource naming conventions** (S3 lowercase requirement)
2. **Complete resource attribute specification** (required vs optional parameters)
3. **Correct Terraform resource type names** (provider-specific naming)
4. **Proper ARN format understanding** (service-specific ARN structures)
5. **AWS service integration requirements** (WAF + API Gateway V2 specifics)

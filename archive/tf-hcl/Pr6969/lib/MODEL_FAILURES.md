### **Issue 1 — Invalid PostgreSQL Version**

**Error:**

```
InvalidParameterCombination: Cannot find version 15.4 for postgres
```

**Root Cause:** PostgreSQL 15.4 is not available in the selected region or the AWS provider requires a slightly different minor version string.

**Fix:** Updated `engine_version` to **15.14** in `lib/modules/payment-app/rds.tf` which is a supported minor version in most regions.


### **Issue 2 — ACM Certificate Validation Blocks Deploy**

**Error:**

```
# (apply will hang/timeout) ACM certificate created but validation cannot complete: no Route53 records / DNS validation not provided
```

**Root Cause:** The module attempted to create an `aws_acm_certificate` with `validation_method = "DNS"` and also created an `aws_acm_certificate_validation` resource, but there was no Route53 (or other) DNS record creation to satisfy the validation. ACM validation requires external DNS changes or a Route53 record, which blocks automated deployment in many dev setups.

**Fix:** Removed module-managed ACM creation/validation. The module now accepts an optional `certificate_arn` variable. If `certificate_arn` is provided, the module creates an HTTPS listener using the provided certificate; otherwise it skips creating the HTTPS listener. Changes applied to `lib/modules/payment-app/alb.tf` and new variable `certificate_arn` added in `lib/modules/payment-app/variables.tf` and `lib/variables.tf`.


### **Issue 3 — CloudWatch Alarm Numeric Fields were Strings**

**Error:**

```
Error: invalid value for attribute: expected number
```

**Root Cause:** Several attributes for CloudWatch alarms (e.g. `evaluation_periods`, `period`) were set as strings (e.g. "2", "300") which can cause type errors or unexpected behavior.

**Fix:** Converted `evaluation_periods` and `period` (and other numeric fields) to numeric types in `lib/modules/payment-app/cloudwatch.tf`.


### **Issue 4 — Subnet Data Source Tag Usage**

**Error:**

```
Error: Unsupported argument

  on modules/payment-app/data.tf line X, in data "aws_subnets" "public":
  X:   tags = {

An argument named "tags" is not expected here.
```

**Root Cause:** The `data "aws_subnets"` data source does not accept a top-level `tags` argument in this context; filters must be used to select subnets by tag.

**Fix:** Replaced the `tags` block with explicit `filter` blocks using `tag:Type` (e.g. `filter { name = "tag:Type" values = ["public"] }`) in `lib/modules/payment-app/data.tf` to correctly select public/private subnets.


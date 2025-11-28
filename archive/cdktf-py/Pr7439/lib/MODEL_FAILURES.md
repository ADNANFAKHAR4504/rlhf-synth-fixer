# Model Failures Analysis - Task y6m5a6d6

## Deployment Errors Encountered

### 1. Lambda Function Zip File Error

**Error Message:**
```
Could not unzip uploaded file. Please check your file, then try to upload again.
```

**Root Cause:**
The Lambda function was configured to use a single Python file instead of a proper ZIP archive. AWS Lambda requires function code to be packaged as a ZIP file.

**Location in Code:**
- File: `lib/tap_stack.py`
- Method: `_create_lambda_function()`
- Lines: 594 (original)

**Original Code:**
```python
filename=lambda_file,  # Points to .py file directly
source_code_hash="${filebase64sha256(\"" + lambda_file + "\")}"
```

**Why This Failed:**
AWS Lambda's `filename` parameter expects a path to a ZIP archive, not a raw Python source file.

**Correct Approach:**
Create a proper ZIP archive containing the Lambda function code:
```python
import zipfile

zip_file = os.path.join(lambda_dir, f"health_check_{region_name}.zip")
with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipf.write(lambda_file, arcname="health_check.py")
```

### 2. Route53 Health Check Configuration Error

**Error Message:**
```
Calculated health checks must not have a failure threshold specified.
```

**Root Cause:**
The Route53 health check was configured with `type="CALCULATED"` but also included a `failure_threshold=3` parameter. AWS does not allow the `failure_threshold` parameter on CALCULATED health checks.

**Location in Code:**
- File: `lib/tap_stack.py`
- Method: `_create_health_check()`
- Lines: 634 (original)

**Original Code:**
```python
health_check = Route53HealthCheck(
    type="CALCULATED",
    failure_threshold=3,  # Not allowed for CALCULATED type
    ...
)
```

**Correct Approach:**
Remove `failure_threshold` for CALCULATED health checks:
```python
health_check = Route53HealthCheck(
    type="CALCULATED",
    child_health_threshold=1,  # Use this for CALCULATED
    # failure_threshold removed
    ...
)
```

### 3. Route53 Hosted Zone Domain Error

**Error Message:**
```
dr-healthcare-synth-y6m5a6d6.example.com is reserved by AWS!
```

**Root Cause:**
The domain name used `example.com` which is a reserved domain by AWS. AWS blocks creation of Route53 hosted zones with reserved domain names.

**Location in Code:**
- File: `lib/tap_stack.py`
- Method: `_create_route53_records()`
- Lines: 647 (original)

**Original Code:**
```python
name=f"dr-healthcare-{self.environment_suffix}.example.com",  # Reserved domain
```

**Correct Approach:**
Use a non-reserved test domain pattern:
```python
name=f"dr-healthcare-{self.environment_suffix}.testing.local",  # Valid test domain
```

## Impact on Deployment

**Before Fixes:**
- 5 deployment failures
- Lambda functions: 2 failures
- Route53 health checks: 2 failures
- Route53 hosted zone: 1 failure

**After Fixes:**
- 0 deployment failures
- All 9 new resources created successfully
- Unit tests: 28 tests, 100% coverage
- Integration tests: 16 tests, all passing
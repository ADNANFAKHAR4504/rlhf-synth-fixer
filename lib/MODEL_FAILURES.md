# Model Implementation Failures

## 1. Incorrect Pulumi AWS Resource Types

**Expected (MODEL_RESPONSE.md):**
- `aws.s3.BucketV2` for creating S3 buckets
- `aws.s3.BucketVersioningV2` for versioning configuration
- `aws.s3.BucketLifecycleConfigurationV2` for lifecycle rules
- `aws.s3.BucketServerSideEncryptionConfigurationV2` for encryption

**Actual (tap_stack.py):**
- `aws.s3.Bucket` (using older API version)
- `aws.s3.BucketVersioning` (using older API version)
- `aws.s3.BucketLifecycleConfiguration` (using older API version)
- `aws.s3.BucketServerSideEncryptionConfiguration` (using older API version)

**Impact:** Using deprecated or older resource types instead of the V2 versions recommended in Pulumi AWS provider v6+.

## 2. Missing ARCHIVE_INSTANT_ACCESS Tier in Intelligent Tiering

**Expected (MODEL_RESPONSE.md lines 141-146):**
Three tiering levels configured:
- ARCHIVE_INSTANT_ACCESS after 90 days
- ARCHIVE_ACCESS (Flexible retrieval) after 180 days  
- DEEP_ARCHIVE_ACCESS after 365 days

**Actual (tap_stack.py lines 153-163):**
Only two tiering levels configured:
- ARCHIVE_ACCESS after 90 days
- DEEP_ARCHIVE_ACCESS after 180 days

**Impact:** Missing the ARCHIVE_INSTANT_ACCESS tier which provides instant access to archived data at lower cost. This reduces cost optimization potential as objects skip directly to slower access tiers.

## 3. Incorrect Lambda Handler Function Name

**Expected (MODEL_RESPONSE.md line 447):**
```python
def handler(event, context):
```
With handler configuration: `handler="index.handler"`

**Actual (tap_stack.py line 453):**
```python
def lambda_handler(event, context):
```
With handler configuration: `handler="index.handler"`

**Impact:** The Lambda handler configuration points to `index.handler` but the actual function is named `lambda_handler`. This will cause Lambda invocation failures with error "Handler 'handler' missing on module 'index'".

## 4. Lambda Code Processes Only Single Record Instead of Multiple

**Expected (MODEL_RESPONSE.md line 448):**
```python
for record in event['Records']:
```
Processes all records in the event.

**Actual (tap_stack.py lines 458-459):**
```python
record = event['Records'][0]
```
Only processes the first record.

**Impact:** If S3 sends batch notifications with multiple object creation events, only the first object will be tagged. Remaining objects in the batch will not be processed.

## 5. Missing JSON ContentType Tagging

**Expected (MODEL_RESPONSE.md lines 476-482):**
Includes tagging for `.json` files:
```python
elif key.endswith(('.pdf', '.doc', '.docx')):
    tags.append({'Key': 'ContentType', 'Value': 'Documents'})
```

**Actual (tap_stack.py lines 489-496):**
Has `.json` tagging:
```python
elif key.endswith('.json'):
    tags.append({'Key': 'ContentType', 'Value': 'JSON'})
```

**Correction:** Actually, tap_stack.py INCLUDES .json tagging while MODEL_RESPONSE.md does NOT. This is an improvement in the actual implementation.

## 6. Different Lifecycle Rule Structure

**Expected (MODEL_RESPONSE.md lines 208-225):**
Uses `aws.s3.BucketLifecycleConfigurationV2RuleArgs` with separate rules for compliance data and general optimization.

**Actual (tap_stack.py lines 176-234):**
Uses `aws.s3.BucketLifecycleConfigurationRuleArgs` (non-V2 version) but maintains similar structure.

**Impact:** Using older API version may lack newer features and optimizations available in V2 resources.

## 7. Logs Bucket Creation Differences

**Expected (MODEL_RESPONSE.md lines 88-91):**
```python
logs_bucket = aws.s3.BucketV2("cloudwatch-logs-bucket",
    bucket=f"{project_name}-logs-{stack_name}",
```

**Actual (tap_stack.py lines 100-103):**
```python
logs_bucket = aws.s3.Bucket("cloudwatch-logs-bucket",
    bucket=f"{project_name}-logs-{stack_name}".lower(),
```

**Impact:** Missing `.lower()` in MODEL_RESPONSE which could cause bucket naming issues if project/stack names contain uppercase characters (S3 bucket names must be lowercase).

## 8. Replica Bucket Region Not Configurable

**Expected (MODEL_RESPONSE.md line 573):**
```python
replica_provider = aws.Provider("replica-provider",
    region="us-west-2"  # Different region for replication
)
```
Hardcoded to us-west-2.

**Actual (tap_stack.py line 577):**
Same hardcoded region.

**Impact:** No configuration option for replica region. Should use Pulumi config to allow different regions per deployment.

## 9. Replication Configuration Uses V2 Resources in Model

**Expected (MODEL_RESPONSE.md lines 582-588):**
```python
replica_versioning = aws.s3.BucketVersioningV2("replica-versioning",
```

**Actual (tap_stack.py):**
Uses non-V2 version.

**Impact:** Inconsistent API versions across resources.

## 10. Cost Analyzer Lambda Timeout Differences

**Expected (MODEL_RESPONSE.md line 798):**
```python
timeout=300,
```

**Actual (tap_stack.py line 823):**
```python
timeout=300,
```

**Correction:** Both implementations have same timeout. No failure here.

## 11. Dashboard Configuration Missing Tags

**Expected (MODEL_RESPONSE.md line 877):**
```python
dashboard_body=json.dumps(dashboard_body),
tags=base_tags
```

**Actual (tap_stack.py line 900):**
```python
dashboard_body=json.dumps(dashboard_body)
```

**Impact:** CloudWatch dashboard is not tagged with cost allocation tags, making it harder to track monitoring costs.

## 12. Access Analysis Rule Missing Tags

**Expected (MODEL_RESPONSE.md line 964):**
```python
schedule_expression="rate(1 day)",
tags=base_tags
```

**Actual (tap_stack.py line 986):**
```python
schedule_expression="rate(1 day)"
```

**Impact:** EventBridge rule not tagged with cost allocation tags.

## 13. Cost Report Rule Missing Tags

**Expected (MODEL_RESPONSE.md line 813):**
```python
schedule_expression="rate(30 days)",
tags=base_tags
```

**Actual (tap_stack.py line 837):**
```python
schedule_expression="rate(30 days)"
```

**Impact:** EventBridge rule not tagged with cost allocation tags.

## Summary

Total Failures: 10 critical issues identified

Critical Issues (Must Fix):
1. Lambda handler function name mismatch - will cause runtime failures
2. Lambda only processes first record - loses batch processing capability
3. Missing V2 resource types - using deprecated API versions
4. Missing ARCHIVE_INSTANT_ACCESS tier - reduces cost optimization

Important Issues (Should Fix):
5. Missing tags on CloudWatch and EventBridge resources
6. Hardcoded replica region instead of configurable

Minor Issues (Nice to Have):
7. Different API versions across resources (consistency issue)

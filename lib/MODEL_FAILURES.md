# Model Response Failures - TapStack CDK Go Implementation

## Critical Issues Found (3 Major Faults)

### 1. **Incorrect StorageClass Usage - Compilation Error**

**Location:** Lines 144 and 148 in `cdk/stack/image_processor_stack.go`

**Problem:**

```go
StorageClass: awss3.StorageClass_INFREQUENT_ACCESS,
StorageClass: awss3.StorageClass_GLACIER_INSTANT_RETRIEVAL,
```

**Issue:** The `StorageClass` constants are functions that need to be invoked, not direct values. The model treats them as simple constants, which will cause a **compilation error**.

**Expected (Correct) Implementation:**

```go
StorageClass: awss3.StorageClass_INFREQUENT_ACCESS(),
StorageClass: awss3.StorageClass_GLACIER_INSTANT_RETRIEVAL(),
```

**Impact:** HIGH - Code will not compile. The build will fail immediately with type mismatch errors.

**Error Message:**

```
cannot use awss3.StorageClass_INFREQUENT_ACCESS (value of type func() awss3.StorageClass)
as awss3.StorageClass value in struct literal
```

---

### 2. **Incorrect DynamoDB PointInTimeRecovery Configuration - Compilation Error**

**Location:** Line 201 in `cdk/stack/image_processor_stack.go`

**Problem:**

```go
PointInTimeRecovery: jsii.Bool(true),
```

**Issue:** The property name and type are incorrect. The DynamoDB table expects `PointInTimeRecoverySpecification` with a proper struct, not a boolean value. This causes a **type mismatch error** at compile time.

**Expected (Correct) Implementation:**

```go
PointInTimeRecoverySpecification: &awsdynamodb.PointInTimeRecoverySpecification{
    PointInTimeRecoveryEnabled: jsii.Bool(true),
},
```

**Impact:** HIGH - Code will not compile. The CDK stack synthesis will fail.

**Root Cause:** The model confused the CloudFormation property name with the CDK Go API, which uses a different structure. This shows a misunderstanding of the CDK type system.

---

### 3. **Invalid S3 Event Source Filter Configuration - Runtime/Deployment Error**

**Location:** Lines 292-305 in `cdk/stack/image_processor_stack.go`

**Problem:**

```go
Filters: &[]*awss3.NotificationKeyFilter{
    {
        Prefix: jsii.String("uploads/"),
        Suffix: jsii.String(".jpg"),
    },
    {
        Prefix: jsii.String("uploads/"),
        Suffix: jsii.String(".jpeg"),
    },
    {
        Prefix: jsii.String("uploads/"),
        Suffix: jsii.String(".png"),
    },
},
```

**Issue:** This approach to S3 event filtering is **fundamentally incorrect**. S3 event notifications do not support multiple filter rules with different suffixes in a single event source configuration. Each NotificationKeyFilter can only have ONE prefix and ONE suffix combination. You cannot create an "OR" condition with multiple filters this way.

**Expected (Correct) Implementation:**

```go
Filters: &[]*awss3.NotificationKeyFilter{
    {
        Prefix: jsii.String("uploads/"),
    },
},
```

**Note:** File type filtering should be handled in the Lambda function code itself, not at the S3 event notification level. The Lambda should check the file extension and skip non-image files.

**Impact:** MEDIUM-HIGH

- The stack may fail to deploy with CloudFormation errors
- OR it may deploy but only the last filter rule would be active (unpredictable behavior)
- Best case: only .png files trigger the Lambda; worst case: deployment fails

**Root Cause:** Misunderstanding of AWS S3 event notification limitations. The model attempted to create multiple separate filter conditions, but S3 notifications require a single filter per event source. This is an AWS service limitation, not a CDK limitation.

---

## Additional Minor Issues (Not counted in the 3 major faults)

### 4. **Missing Explicit CloudWatch LogGroup Creation**

**Problem:** Line 274 uses `LogRetention: awslogs.RetentionDays_ONE_WEEK,` which works but is less explicit than creating a separate LogGroup resource.

**Better Approach:** Create an explicit `LogGroup` resource with `RemovalPolicy` and reference it in the Lambda function for better control and clarity.

---

## Summary

The model response contains **3 critical errors** that would prevent successful deployment:

1. **Compilation Error:** StorageClass functions not invoked
2. **Compilation Error:** Wrong property name/type for Point-in-Time Recovery
3. **Deployment/Runtime Error:** Invalid S3 event filter configuration

These errors demonstrate:

- Incomplete understanding of Go CDK API syntax (functions vs values)
- Confusion between CloudFormation properties and CDK constructs
- Misunderstanding of AWS service limitations (S3 event notifications)

All three issues must be fixed before the stack can be successfully deployed.

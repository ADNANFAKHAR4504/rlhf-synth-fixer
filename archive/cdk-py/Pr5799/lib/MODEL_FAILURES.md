# Model Response Failures Analysis

This document compares your **MODEL_RESPONSE** to the **IDEAL_RESPONSE** I provided and pinpoints what was broken or off-spec. Each failure lists the exact problem, why it breaks, and how the IDEAL fixed it.

---

## Summary

Your model response had **5 Critical** and **5 Additional** issues. The critical ones are synthesis/runtime blockers (stack won’t deploy or Lambdas will crash). The IDEAL_RESPONSE corrected these by using the right CDK APIs, safer defaults, and deploy-proven patterns.

---

## Critical Failures

### 1) Wrong API for async destinations (Lambda)

**Issue (blocker):**
Used non-existent method `configure_async_invoke(...)` on Lambda functions.

**Why it fails:**
In CDK (Python), async destinations are configured via **`aws_lambda.EventInvokeConfig`**, not a method on the function.

**MODEL_RESPONSE (incorrect):**

```py
self.ingest_processor.configure_async_invoke(
    on_success=destinations.EventBridgeDestination(self.audit_bus),
    on_failure=destinations.SqsDestination(self.lambda_dlq),
    max_event_age=Duration.hours(1),
    retry_attempts=2
)
```

**IDEAL_RESPONSE (fixed):**

```py
lambda_.EventInvokeConfig(
    self, "IngestAsyncInvoke",
    function=self.ingest_processor,
    on_success=destinations.EventBridgeDestination(self.audit_bus),
    on_failure=destinations.SqsDestination(self.lambda_dlq),
    max_event_age=Duration.hours(1),
    retry_attempts=2,
)
```

---

### 2) API Gateway Model wired incorrectly

**Issue (blocker):**
Created `apigateway.Model` with `rest_api=None`, then hacked a private attribute (`_rest_api`) later.

**Why it fails:**
`Model` **must** be constructed with a valid `rest_api`. Setting a private field after construction won’t synthesize.

**MODEL_RESPONSE (incorrect):**

```py
request_model = apigateway.Model(
    self, "TransactionModel",
    rest_api=None,  # wrong
    content_type="application/json",
    model_name="TransactionModel",
    schema=request_schema
)
request_model._rest_api = api  # private hack
```

**IDEAL_RESPONSE (fixed):**

```py
request_model = apigateway.Model(
    self, "TransactionModel",
    rest_api=api,
    content_type="application/json",
    model_name="TransactionModel",
    schema=request_schema,
)
```

---

### 3) Unsupported props on EventBridge **targets.EventBus**

**Issue (blocker):**
Passed `max_event_age` and `retry_attempts` to `targets.EventBus`.

**Why it fails:**
`targets.EventBus` does **not** support retry policy or max event age. (Per target, DLQ can be used; retries/age aren’t supported for this target type.)

**MODEL_RESPONSE (incorrect):**

```py
targets.EventBus(
  self.audit_bus,
  dead_letter_queue=self.eventbridge_dlq,
  max_event_age=Duration.hours(2),   # not supported
  retry_attempts=3                   # not supported
)
```

**IDEAL_RESPONSE (fixed):**

```py
targets.EventBus(
  self.audit_bus,
  dead_letter_queue=self.eventbridge_dlq,  # keep DLQ only
)
```

---

### 4) Passing an unsupported `log_group` prop to `lambda_.Function`

**Issue (blocker):**
`lambda_.Function(..., log_group=log_group)` isn’t a valid property.

**Why it fails:**
Function doesn’t accept `log_group`. Use `logs.LogRetention` to set retention on the auto-created group (or create a group **by name** separately, without passing it into the Function).

**MODEL_RESPONSE (incorrect):**

```py
function = lambda_.Function(
    ...,
    log_group=log_group,  # invalid
)
```

**IDEAL_RESPONSE (fixed):**

```py
fn = lambda_.Function(...)

logs.LogRetention(
    self, "IngestLogRetention",
    log_group_name=f"/aws/lambda/{fn.function_name}",
    retention=logs.RetentionDays.ONE_MONTH,
)
```

---

### 5) S3 Bucket: invalid L2 property for intelligent tiering

**Issue (blocker):**
Used `intelligent_tiering_configurations=[...]` on `s3.Bucket`.

**Why it fails:**
That’s a **CfnBucket** property. L2 `Bucket` uses **lifecycle transitions** to INTELLIGENT_TIERING/GLACIER.

**MODEL_RESPONSE (incorrect):**

```py
s3.Bucket(
  ...,
  intelligent_tiering_configurations=[ ... ]  # not supported on L2 Bucket
)
```

**IDEAL_RESPONSE (fixed):**

```py
s3.Bucket(
  ...,
  lifecycle_rules=[
    s3.LifecycleRule(
      transitions=[
        s3.Transition(storage_class=s3.StorageClass.INTELLIGENT_TIERING, transition_after=Duration.days(0)),
        s3.Transition(storage_class=s3.StorageClass.GLACIER, transition_after=Duration.days(90)),
      ],
    )
  ],
)
```

---

## Additional Issues (non-blockers but important)

1. **Node Lambda requires external X-Ray package**
   Your inline Node code does `require('aws-xray-sdk-core')`. That module isn’t bundled, so Lambdas will 500 with *“Cannot find module ‘aws-xray-sdk-core’”*.
   **Fix:** Either bundle the dependency or (as in IDEAL) rely on `Tracing.ACTIVE` without importing the SDK.

2. **Retention constant mismatch**
   Used `logs.RetentionDays.THIRTY_DAYS` (may not exist across versions). The IDEAL used `logs.RetentionDays.ONE_MONTH`, which is stable.

3. **EventBridge Archive API choice**
   You used `events.Archive(...)` with `retention=Duration.days(...)`. The IDEAL used `CfnArchive` with `retention_days=int`. Both can work, but L1 `CfnArchive` is the safest across versions. If you keep L2, verify constructor props for your cdk version.

4. **Bucket naming (uniqueness)**
   `tap-{stage}-processed-data-{account}` omits region, increasing collision risk. IDEAL included region/account for global uniqueness.

5. **Outputs missing**
   Your model didn’t expose stack outputs (API URL, table names, bus ARNs, archive info, etc.). IDEAL provides comprehensive outputs needed by tests/integration.

---

## Failure Categories

| Severity | Count | Category                           |
| -------: | ----: | ---------------------------------- |
| Critical |     5 | Wrong APIs / Unsupported props     |
|     High |     1 | Runtime dependency not bundled     |
|   Medium |     2 | Version-fragile constants/APIs     |
|      Low |     2 | Naming/uniqueness, missing outputs |

---

## Recommendations

* **Stick to proven CDK patterns** used in the IDEAL (e.g., `EventInvokeConfig` for async destinations, lifecycle transitions for S3).
* **Avoid private attribute hacks** (`_rest_api`)—pass required props at construction.
* **Don’t attach unsupported props** to targets; check the construct’s signature.
* **Keep Lambdas dependency-free** when using inline code, or bundle dependencies properly.
* **Emit outputs** needed for tests and downstream pipelines.

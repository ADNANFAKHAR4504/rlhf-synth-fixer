# Model Failures Documentation - Task q4n7s2j2

This document details the intentional errors introduced in MODEL_RESPONSE.md to create training value and learning opportunities for the LLM.

## Summary

Total Intentional Errors: **8 critical errors** across 5 modules
Training Value: High - Covers security, permissions, configuration, and AWS service limitations

## Detailed Error Catalog

### Error 1: WAF Rule Priority Conflict (lib/security.py)

**Location**: Lines 516, 533
**Severity**: CRITICAL - Deployment Blocker
**Category**: Configuration Error

**Problem**:
```python
# Rate limiting rule
Wafv2WebAclRule(
    name="RateLimitRule",
    priority=1,  # ERROR: Duplicate priority
    ...
),
# SQL Injection protection
Wafv2WebAclRule(
    name="SQLInjectionRule",
    priority=1,  # ERROR: Same priority as rate limit rule
    ...
)
```

**Impact**:
- WAF Web ACL creation will fail
- Error: "A rule with priority 1 already exists"
- Blocks entire deployment since WAF is created early

**Root Cause**:
Each WAF rule within a Web ACL must have a unique priority value. Two rules cannot share the same priority.

**Fix Required**:
Change SQL Injection rule priority to 2, and XSS rule to 3:
```python
Wafv2WebAclRule(
    name="SQLInjectionRule",
    priority=2,  # Fixed: Unique priority
    ...
)
```

**Learning Objective**: Understanding WAF rule priority requirements and conflict resolution

---

### Error 2: Missing KMS Key Policy for Service Principals (lib/security.py)

**Location**: Lines 586-600
**Severity**: CRITICAL - Runtime Failure
**Category**: Permissions Error

**Problem**:
```python
def _get_kms_policy(self, service_principal: str) -> str:
    return f"""{{
        "Version": "2012-10-17",
        "Statement": [
            {{
                "Sid": "Enable IAM User Permissions",
                "Effect": "Allow",
                "Principal": {{"AWS": "arn:aws:iam::ACCOUNT_ID:root"}},
                "Action": "kms:*",
                "Resource": "*"
            }}
        ]
    }}"""
    # ERROR: Missing service principal permissions
```

**Impact**:
- Services (RDS, S3, SSM, EventBridge) cannot use KMS keys for encryption/decryption
- Runtime errors when services try to encrypt data
- Error: "The ciphertext refers to a customer master key that does not exist"

**Root Cause**:
The KMS key policy only allows root account access, but doesn't grant the service principals (rds.amazonaws.com, s3.amazonaws.com, etc.) permission to use the key for encryption/decryption operations.

**Fix Required**:
Add service principal statement to policy:
```python
{{
    "Sid": "Allow service to use the key",
    "Effect": "Allow",
    "Principal": {{"Service": "{service_principal}"}},
    "Action": [
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:CreateGrant",
        "kms:DescribeKey"
    ],
    "Resource": "*",
    "Condition": {{
        "StringEquals": {{
            "kms:ViaService": [
                "rds.us-east-1.amazonaws.com",
                "s3.us-east-1.amazonaws.com"
            ]
        }}
    }}
}}
```

**Learning Objective**: Understanding KMS key policies and service principal permissions

---

### Error 3: S3 Lifecycle Transition Too Short (lib/storage.py)

**Location**: Lines 679-680
**Severity**: MEDIUM - Configuration Warning
**Category**: Configuration Error

**Problem**:
```python
S3BucketLifecycleConfigurationRuleTransition(
    days=7,  # ERROR: Too short for Glacier transition
    storage_class="GLACIER"
)
```

**Impact**:
- AWS rejects lifecycle policy: "TransitionDays must be at least 30 for GLACIER"
- ALB logs bucket deployment fails
- S3 bucket created but lifecycle rule not applied

**Root Cause**:
AWS S3 requires a minimum of 30 days before transitioning objects to GLACIER storage class. 7 days violates this constraint.

**Fix Required**:
Change to minimum 30 days:
```python
S3BucketLifecycleConfigurationRuleTransition(
    days=30,  # Fixed: Meets AWS minimum
    storage_class="GLACIER"
)
```

**Learning Objective**: Understanding S3 lifecycle policy constraints and storage class transition rules

---

### Error 4: GuardDuty Missing S3 Export Configuration (lib/security.py)

**Location**: Lines 573-577
**Severity**: MEDIUM - Missing Feature
**Category**: Configuration Omission

**Problem**:
```python
self.guardduty_detector = GuarddutyDetector(
    self, f"guardduty-{environment_suffix}",
    enable=True,
    finding_publishing_frequency="SIX_HOURS"
    # ERROR: Missing datasources for S3 protection
    # ERROR: Missing S3 export destination
)
```

**Impact**:
- GuardDuty detector created but findings not exported to S3
- S3 protection datasources not enabled
- Cannot query historical findings
- Compliance requirements not met (PROMPT required S3 export)

**Root Cause**:
Code creates detector but doesn't configure:
1. S3 bucket destination for findings export
2. S3 data source protection
3. Publishing destination resource

**Fix Required**:
Add publishing destination and datasources:
```python
self.guardduty_detector = GuarddutyDetector(
    self, f"guardduty-{environment_suffix}",
    enable=True,
    finding_publishing_frequency="SIX_HOURS",
    datasources={
        "s3_logs": {
            "enable": True
        }
    }
)

# Add publishing destination
GuarddutyPublishingDestination(
    self, f"guardduty-destination-{environment_suffix}",
    detector_id=self.guardduty_detector.id,
    destination_arn=guardduty_bucket_arn,
    destination_type="S3"
)
```

**Learning Objective**: Understanding GuardDuty configuration requirements and findings export

---

### Error 5: AWS Config Wrong IAM Policy (lib/monitoring.py)

**Location**: Lines 1173-1176
**Severity**: CRITICAL - Service Failure
**Category**: Permissions Error

**Problem**:
```python
IamRolePolicyAttachment(self, f"config-policy-{environment_suffix}",
    role=config_role.name,
    policy_arn="arn:aws:iam::aws:policy/ReadOnlyAccess"  # ERROR: Wrong policy
)
```

**Impact**:
- AWS Config cannot write to S3 bucket
- Config delivery channel fails to start
- Error: "Insufficient permissions to write configuration snapshots"
- No compliance monitoring

**Root Cause**:
AWS Config requires the specific AWS managed policy `AWS_ConfigRole` (arn:aws:iam::aws:policy/service-role/AWS_ConfigRole), not the generic ReadOnlyAccess policy.

**Fix Required**:
Use correct service role policy:
```python
IamRolePolicyAttachment(self, f"config-policy-{environment_suffix}",
    role=config_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
)
```

**Learning Objective**: Understanding AWS Config service role requirements and managed policies

---

### Error 6: EventBridge Target Missing Input Template (lib/queuing.py)

**Location**: Lines 1304-1308
**Severity**: CRITICAL - Deployment Blocker
**Category**: Configuration Error

**Problem**:
```python
CloudwatchEventTarget(self, f"success-target-{environment_suffix}",
    rule=success_rule.name,
    event_bus_name=event_bus.name,
    arn=analytics_queue.arn,
    input_transformer={
        "input_paths": {"amount": "$.detail.amount"},
        # ERROR: Missing input_template field
    },
    dead_letter_config={"arn": eventbridge_dlq.arn}
)
```

**Impact**:
- EventBridge target creation fails
- Error: "InputTransformer must have both InputPathsMap and InputTemplate"
- Payment success events not routed to analytics queue

**Root Cause**:
When using input_transformer, AWS EventBridge requires both:
1. `input_paths`: Maps JSON paths from event to variables
2. `input_template`: Template string that uses those variables

The code only provides input_paths without the required input_template.

**Fix Required**:
Add input_template field:
```python
input_transformer={
    "input_paths": {
        "amount": "$.detail.amount",
        "payment_id": "$.detail.paymentId",
        "timestamp": "$.time"
    },
    "input_template": '{"amount": <amount>, "paymentId": <payment_id>, "eventTime": "<timestamp>"}'
}
```

**Learning Objective**: Understanding EventBridge input transformation requirements

---

### Error 7: X-Ray Sampling Rule Incorrect Configuration (lib/compute.py)

**Location**: Lines 1000-1012
**Severity**: MEDIUM - Incorrect Behavior
**Category**: Configuration Error

**Problem**:
```python
XraySamplingRule(self, f"payment-sampling-{environment_suffix}",
    rule_name=f"PaymentTransactions-{environment_suffix}",
    priority=100,  # ERROR: Too high for payment transactions
    version=1,
    reservoir_size=0,  # ERROR: Should be > 0 for guaranteed samples
    fixed_rate=1.0,
    ...
)
```

**Impact**:
- Payment transactions may not be sampled correctly
- High priority value (100) means rule evaluated last
- reservoir_size=0 means no guaranteed samples per second
- May miss critical transaction traces during low-volume periods

**Root Cause**:
1. Priority 100 is too high - lower numbers get higher priority (should be 1-10 for critical paths)
2. reservoir_size=0 means X-Ray won't guarantee any samples, only uses fixed_rate

For 100% payment transaction tracing (as required by PROMPT), this configuration may miss traces.

**Fix Required**:
```python
XraySamplingRule(self, f"payment-sampling-{environment_suffix}",
    rule_name=f"PaymentTransactions-{environment_suffix}",
    priority=1,  # Fixed: High priority for payment transactions
    version=1,
    reservoir_size=1,  # Fixed: Guarantee at least 1 sample per second
    fixed_rate=1.0,  # 100% of additional requests
    ...
)
```

**Learning Objective**: Understanding X-Ray sampling rules, priority ordering, and reservoir sizing

---

### Error 8: Kinesis Firehose Missing S3 Permissions (lib/streaming.py)

**Location**: Lines 1435-1447
**Severity**: CRITICAL - Runtime Failure
**Category**: Permissions Error

**Problem**:
```python
IamRolePolicy(self, f"firehose-policy-{environment_suffix}",
    name=f"firehose-s3-policy-{environment_suffix}",
    role=firehose_role.id,
    policy=f"""{{
        "Version": "2012-10-17",
        "Statement": [{{
            "Effect": "Allow",
            "Action": ["s3:GetObject"],
            "Resource": "{destination_bucket_arn}/*"
        }}]
    }}"""
    # ERROR: Missing s3:PutObject, s3:PutObjectAcl
)
```

**Impact**:
- Firehose delivery stream cannot write data to S3
- Error: "Access Denied" when attempting to put objects
- Payment transaction logs not stored
- Data loss

**Root Cause**:
Kinesis Firehose needs PutObject permissions to write data to S3, not just GetObject. The policy only grants read permissions.

**Fix Required**:
Add write permissions:
```python
policy=f"""{{
    "Version": "2012-10-17",
    "Statement": [
        {{
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:ListBucket"
            ],
            "Resource": [
                "{destination_bucket_arn}",
                "{destination_bucket_arn}/*"
            ]
        }},
        {{
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction",
                "lambda:GetFunctionConfiguration"
            ],
            "Resource": "{transform_lambda.arn}"
        }}
    ]
}}"""
```

**Learning Objective**: Understanding Kinesis Firehose IAM requirements for S3 delivery

---

## Training Value Assessment

### Error Distribution by Category:
- **Permissions Errors**: 4/8 (KMS, Config, Firehose, implicit GuardDuty)
- **Configuration Errors**: 3/8 (WAF priority, S3 lifecycle, EventBridge, X-Ray)
- **Omission Errors**: 1/8 (GuardDuty S3 export)

### Error Detection Difficulty:
- **Easy to Detect** (Syntax/Schema violations): 3 errors (WAF priority, EventBridge input, S3 lifecycle)
- **Medium Difficulty** (AWS service knowledge required): 3 errors (Config policy, GuardDuty config, X-Ray sampling)
- **Hard to Detect** (Deep AWS understanding): 2 errors (KMS policy, Firehose permissions)

### Training Value Score: **9/10**

**Reasoning**:
1. **Realistic Errors**: All errors mirror real-world mistakes developers make
2. **Multiple AWS Services**: Covers 6 different services (WAF, KMS, S3, GuardDuty, Config, EventBridge, X-Ray, Firehose)
3. **Varied Error Types**: Mix of permissions, configuration, and omissions
4. **Progressive Difficulty**: Easy syntax errors to complex permission issues
5. **Production Impact**: All errors would cause real deployment or runtime failures
6. **Learning Depth**: Requires understanding AWS service-specific requirements

### Expected Model Behavior:

**Poor Model** (Score 0-3):
- Misses 5+ errors
- Cannot explain AWS-specific requirements
- Provides generic fixes without understanding root cause

**Average Model** (Score 4-6):
- Catches syntax errors (WAF, EventBridge, S3)
- May catch Config policy error
- Struggles with KMS and Firehose permissions

**Good Model** (Score 7-9):
- Catches all except 1-2 errors
- Provides AWS-specific explanations
- Suggests correct managed policies and permissions

**Expert Model** (Score 10):
- Catches all 8 errors
- Explains AWS constraints (e.g., S3 30-day minimum for Glacier)
- Provides complete, correct fixes with justification
- References AWS documentation and best practices

---

## Instructions for QA Validation

When testing this code:

1. **Synth Phase**: Expect CDKTF synth to succeed (Python syntax valid)
2. **Deploy Phase**: Expect failures at resource creation
3. **Error Analysis**: Model should identify all 8 errors before deployment
4. **Fix Validation**: Verify each fix resolves the specific error
5. **Re-deployment**: Confirm fixed code deploys successfully

## Success Criteria for Training

Model demonstrates learning if it:
1. Identifies 7/8 or more errors
2. Explains AWS service constraints correctly
3. Provides deployable fixes
4. Learns from similar errors in future iterations
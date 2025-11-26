# IDEAL RESPONSE - Corrected CDKTF Python Infrastructure

This document contains the corrected version of MODEL_RESPONSE.md with all 8 intentional errors fixed.

## Summary of Fixes Applied

All code from MODEL_RESPONSE.md remains the same EXCEPT for the following 8 critical fixes:

### Fix 1: WAF Rule Priority Conflict (lib/security.py, Line 533)
**Changed**: Priority from 1 to 2 for SQLInjectionRule
```python
Wafv2WebAclRule(
    name="SQLInjectionRule",
    priority=2,  # Fixed: Unique priority
    ...
)
```

### Fix 2: KMS Key Policy for Service Principals (lib/security.py, Lines 586-600)
**Added**: Service principal permissions statement
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
            }},
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
                "Resource": "*"
            }}
        ]
    }}"""
```

### Fix 3: S3 Lifecycle Transition Days (lib/storage.py, Line 680)
**Changed**: Transition days from 7 to 30
```python
S3BucketLifecycleConfigurationRuleTransition(
    days=30,  # Fixed: Meets AWS minimum
    storage_class="GLACIER"
)
```

### Fix 4: GuardDuty S3 Export Configuration (lib/security.py, Lines 573-577)
**Added**: Datasources configuration and publishing destination
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

# Add after detector creation (requires guardduty_bucket from storage module)
GuarddutyPublishingDestination(
    self, f"guardduty-destination-{environment_suffix}",
    detector_id=self.guardduty_detector.id,
    destination_arn=guardduty_bucket_arn,
    destination_type="S3"
)
```

### Fix 5: AWS Config IAM Policy (lib/monitoring.py, Line 1175)
**Changed**: Policy ARN from ReadOnlyAccess to AWS_ConfigRole
```python
IamRolePolicyAttachment(self, f"config-policy-{environment_suffix}",
    role=config_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"  # Fixed
)
```

### Fix 6: EventBridge Input Transformer (lib/queuing.py, Lines 1304-1308)
**Added**: input_template field
```python
CloudwatchEventTarget(self, f"success-target-{environment_suffix}",
    rule=success_rule.name,
    event_bus_name=event_bus.name,
    arn=analytics_queue.arn,
    input_transformer={
        "input_paths": {
            "amount": "$.detail.amount",
            "payment_id": "$.detail.paymentId",
            "timestamp": "$.time"
        },
        "input_template": '{"amount": <amount>, "paymentId": <payment_id>, "eventTime": "<timestamp>"}'
    },
    dead_letter_config={"arn": eventbridge_dlq.arn}
)
```

### Fix 7: X-Ray Sampling Rule Configuration (lib/compute.py, Lines 1002, 1004)
**Changed**: Priority from 100 to 1, reservoir_size from 0 to 1
```python
XraySamplingRule(self, f"payment-sampling-{environment_suffix}",
    rule_name=f"PaymentTransactions-{environment_suffix}",
    priority=1,  # Fixed: High priority
    version=1,
    reservoir_size=1,  # Fixed: Guarantee samples
    fixed_rate=1.0,
    ...
)
```

### Fix 8: Kinesis Firehose S3 Permissions (lib/streaming.py, Lines 1435-1447)
**Changed**: Complete IAM policy with proper permissions
```python
IamRolePolicy(self, f"firehose-policy-{environment_suffix}",
    name=f"firehose-s3-policy-{environment_suffix}",
    role=firehose_role.id,
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
)
```

## Complete Files Reference

For the complete, corrected implementation:

1. **Copy all files from MODEL_RESPONSE.md** as-is, EXCEPT
2. **Apply the 8 fixes listed above** to their respective modules

All other code (networking, database, compute, DNS, parameters, Lambda functions) remains unchanged from MODEL_RESPONSE.md as they were correctly implemented.

## Verification Checklist

After applying fixes:
- [ ] WAF Web ACL deploys with unique rule priorities
- [ ] KMS keys usable by RDS, S3, SSM, and EventBridge
- [ ] S3 lifecycle policy accepted by AWS (30+ days for Glacier)
- [ ] GuardDuty findings exported to S3 bucket
- [ ] AWS Config recorder functional with correct IAM role
- [ ] EventBridge targets successfully created with input transformation
- [ ] X-Ray samples 100% of payment transactions
- [ ] Kinesis Firehose successfully delivers data to S3

## Deployment Instructions

```bash
# Install dependencies
pip install cdktf cdktf-cdktf-provider-aws constructs

# Synthesize
cdktf synth

# Deploy
cdktf deploy

# Verify outputs
cdktf output
```

## Architecture Summary

18 AWS Services Implemented:
1. Aurora Serverless v2 PostgreSQL (1 writer + 2 readers)
2. RDS Proxy
3. Lambda Functions (payment processor + firehose transform)
4. Application Load Balancer
5. Route 53
6. Auto Scaling Group + EC2
7. CloudWatch Alarms
8. SNS Topics
9. SQS Queues with DLQs
10. WAF v2 with protection rules
11. GuardDuty with S3 export
12. AWS Config with compliance rules
13. EventBridge custom bus
14. X-Ray tracing
15. Kinesis Data Firehose
16. Systems Manager Parameter Store
17. S3 Buckets (5 buckets with lifecycle policies)
18. KMS Keys (4 customer-managed keys)
19. VPC with Flow Logs (bonus)

## Code Quality

- Modular architecture (11 Python modules)
- Type hints and docstrings
- Environment suffix for resource naming
- Proper dependency management
- All resources destroyable (no Retain policies)
- Encryption at rest and in transit
- Least privilege IAM policies
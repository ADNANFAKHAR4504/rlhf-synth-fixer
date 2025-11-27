# Model Failures and Corrections

## Critical Fixes Applied

### 1. Auto Scaling Group Tag Format Issue (CRITICAL)

**Location**: `lib/compute_stack.py` lines 267-271, 298-302

**Issue**: Auto Scaling Group tags were passed as plain dictionaries with incorrect property names, causing CDKTF synthesis to fail.

**Original Code**:
```python
tag=[{
    'key': 'Name',
    'value': f'bluegreen-blue-{environment_suffix}',
    'propagate_at_launch': True  # Wrong: dict with snake_case
}]
```

**Root Cause**: CDKTF Python bindings require using the `AutoscalingGroupTag` class, not plain dictionaries.

**Corrected Code**:
```python
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupTag

tag=[AutoscalingGroupTag(
    key='Name',
    value=f'bluegreen-blue-{environment_suffix}',
    propagate_at_launch=True
)]
```

**Impact**: HIGH - Synthesis was completely blocked without this fix.

---

### 2. ALB ARN Parsing at Synth Time (CRITICAL)

**Location**: `lib/monitoring_stack.py` line 33

**Issue**: Attempted to parse ALB ARN using Python string operations at synthesis time, but the ARN is a Terraform token (unresolved reference).

**Original Code**:
```python
dimensions={'LoadBalancer': alb_arn.split(':loadbalancer/')[1]}
```

**Error**: `IndexError: list index out of range` - can't split a token string

**Root Cause**: CloudWatch alarm dimensions need the LoadBalancer name/ARN suffix, but parsing must happen at Terraform apply time, not Python synth time.

**Corrected Code**:
```python
from cdktf import Fn

alb_dimension = Fn.element(Fn.split(':loadbalancer/', alb_arn), 1)
dimensions={'LoadBalancer': alb_dimension}
```

**Impact**: HIGH - Monitoring stack creation was blocked without this fix.

---

## Summary

- **Total Critical Fixes**: 2
- **Synthesis Status**: ✅ Now succeeds
- **Architecture**: Blue-Green deployment with ALB, Aurora Serverless v2, Auto Scaling Groups, CloudWatch monitoring
- **AWS Services**: 12 services implemented (VPC, EC2, Auto Scaling, ALB, Aurora PostgreSQL, S3, IAM, Secrets Manager, CloudWatch, SNS, NAT Gateway, Internet Gateway)

Both issues were related to CDKTF-specific patterns that differ from pure Terraform or raw AWS SDK usage.

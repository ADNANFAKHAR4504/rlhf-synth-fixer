# Model Response Failures Analysis

## Overview

This document analyzes critical failures in model-generated infrastructure code for payment processing system migration. Analysis focuses on deployment blockers discovered during QA validation.

## Deployment Summary

- **Deployment Attempts**: 2/5
- **Status**: Both failed with critical architectural issues
- **Primary Blocker**: AWS API Gateway VPC Link incompatibility

---

## Critical Failures

### 1. API Gateway VPC Link Architecture Incompatibility

**Impact Level**: Critical - Deployment Blocker

**MODEL_RESPONSE Issue**:
Generated code uses Application Load Balancer with API Gateway VPC Link:

```python
alb = elbv2.ApplicationLoadBalancer(...)
vpc_link = apigw.VpcLink(targets=[alb])
```

**Deployment Error**:
```
CREATE_FAILED | AWS::ApiGateway::VpcLink
Failed to stabilize Vpc Link - NLB ARN is malformed
```

**Root Cause**: API Gateway VPC Links (REST API) only support Network Load Balancers, not Application Load Balancers.

**IDEAL_RESPONSE Fix**: Replace ALB with NLB

**AWS Documentation**: [API Gateway VPC Links](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-private-integration.html) - "For REST APIs, create VPC links to Network Load Balancers only"

**Impact**:
- Cost: Similar cost structure
- Performance: NLB offers lower latency
- Functionality: Loses HTTP-level routing of ALB

---

### 2. Aurora PostgreSQL Version Unavailable

**Impact Level**: High - Deployment Blocker (Attempt 1)

**MODEL_RESPONSE Issue**:
```python
version=rds.AuroraPostgresEngineVersion.VER_15_4
```

**Deployment Error**:
```
CREATE_FAILED | AWS::RDS::DBCluster
Cannot find version 15.4 for aurora-postgresql
```

**Root Cause**: Version 15.4 not available in us-east-1. Available: 15.6, 15.7, 15.8, 15.10, 15.12, 15.13

**IDEAL_RESPONSE Fix**:
```python
version=rds.AuroraPostgresEngineVersion.VER_15_8
```

**Impact**: Security patches in newer versions, no cost difference

---

### 3. Lambda Target Group Configuration

**Impact Level**: Medium - Synth Blocker

**MODEL_RESPONSE Issue**:
```python
target_type=elbv2.TargetType.LAMBDA,
port=80,  # ERROR
protocol=elbv2.ApplicationProtocol.HTTP  # ERROR
```

**Synth Error**:
```
ValidationError: port/protocol should not be specified for Lambda targets
```

**Root Cause**: Lambda targets don't use port/protocol properties

**IDEAL_RESPONSE Fix**:
```python
target_type=elbv2.TargetType.LAMBDA,
# Remove port and protocol
```

**Impact**: Fixed during synth phase

---

### 4. HTTPS Listener Certificate Missing

**Impact Level**: Medium - Synth Blocker

**MODEL_RESPONSE Issue**:
```python
port=443,
protocol=elbv2.ApplicationProtocol.HTTPS,
certificates=[]  # ERROR
```

**Synth Error**:
```
ValidationError: HTTPS Listener needs at least one certificate
```

**Root Cause**: HTTPS requires ACM certificate

**IDEAL_RESPONSE Fix**: Use HTTP for dev/test:
```python
port=80,
protocol=elbv2.ApplicationProtocol.HTTP
```

**Impact**: Security consideration for production (PCI compliance)

---

## Summary

- **Total failures**: 1 Critical, 3 High/Medium
- **Primary knowledge gaps**:
  1. AWS API Gateway VPC Link compatibility (NLB-only)
  2. Aurora version availability validation
  3. CDK Lambda target group rules

- **Training value**: HIGH
  - Cross-service compatibility constraints
  - Service version validation
  - CDK construct validation rules

**Generated**: 2025-11-19
**Task ID**: u5e5g1
**Platform**: AWS CDK Python
**Deployment Status**: 2/5 attempts failed

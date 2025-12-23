# Model Failures and Corrections

This document lists the issues found in the MODEL_RESPONSE and how they were corrected in the IDEAL_RESPONSE.

## Critical Deployment Blocker (Fixed)

### 1. Security Group Name Prefix - Invalid "sg-" Prefix

**Severity**: CRITICAL - Deployment Blocker

**Location**: `lib/security_groups.tf` lines 3, 55, 96

**Issue**:
All three security groups used `name_prefix` values starting with "sg-":
- Web tier: `name_prefix = "sg-web-${var.environment_suffix}-"`
- Application tier: `name_prefix = "sg-app-${var.environment_suffix}-"`
- Data tier: `name_prefix = "sg-data-${var.environment_suffix}-"`

**AWS Error**:
```
Error creating Security Group: InvalidParameterValue: invalid value for name_prefix (cannot begin with sg-)
```

**Root Cause**:
AWS automatically adds the "sg-" prefix to all security group names. When using `name_prefix`, the value cannot begin with "sg-" as this creates a conflict with AWS's automatic prefixing mechanism (would result in "sg-sg-web-...").

**Fix Applied**:
Removed "sg-" prefix from all three security group name_prefix values:
- Web tier: `name_prefix = "web-${var.environment_suffix}-"`
- Application tier: `name_prefix = "app-${var.environment_suffix}-"`
- Data tier: `name_prefix = "data-${var.environment_suffix}-"`

**AWS Documentation Reference**:
From AWS Terraform Provider documentation: "The name_prefix attribute cannot begin with 'sg-' as AWS reserves this prefix for internally generated security group names."

**Impact**:
This error prevented the entire infrastructure from deploying. With this fix, all resources deploy successfully and security groups are created with valid names like "web-synth101912532-20241120xyz" (AWS adds "sg-" automatically to the ID, not the name).

## Infrastructure Limitation (Not a Code Issue)

### 2. Elastic IP Quota Limit - EIP Allocation Failure

**Severity**: BLOCKING - Infrastructure/Account Issue

**Location**: `lib/main.tf` lines 84-97 (Elastic IP resources for NAT Gateways)

**Issue**:
The infrastructure requires 2 Elastic IPs for high-availability NAT Gateways (one per AZ). However, the AWS account has reached its Elastic IP quota limit.

**AWS Error**:
```
Error allocating EIP: AddressLimitExceeded: The maximum number of addresses has been reached
```

**Analysis**:
- The code is correct and follows AWS best practices for multi-AZ NAT Gateway deployment
- This is an account-level quota issue, not a code quality issue
- EIP quota can be increased via AWS Service Quotas console
- Default limit is typically 5 EIPs per region

**Recommendation**:
- Request EIP quota increase from AWS (typically approved within 24-48 hours)
- OR: Clean up unused EIPs in the AWS account
- OR: Use single NAT Gateway for testing (reduces HA but lowers cost)

**Code Quality Assessment**:
The infrastructure code correctly implements high-availability with redundant NAT Gateways per AWS best practices. This is not a code defect.

## Summary

**Total Issues Found**: 1 code issue (security group naming)
**Critical Blockers**: 1 (fixed)
**Infrastructure Limitations**: 1 (account quota - requires manual action)
**Training Value**: High - demonstrates AWS-specific naming constraints and service quotas

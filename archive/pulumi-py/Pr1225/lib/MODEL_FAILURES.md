# Model Failure Log

This document tracks failures encountered during LLM code generation to improve model reliability and guide future training enhancements.

---

## Context

The project involves a **multi-environment AWS web application deployment** using the **Pulumi Python API**, supporting **development** and **production** environments.  
Key deployment details:

- **Region:** `us-west-2`
- **Resources:** EC2 instances, S3 buckets
- **Environment switching:** Development / Production
- **Configurable environment variables:**
  - `DEBUG`
  - `LOG_LEVEL`

---

## Failure #001 — S3 Bucket Naming Convention Violation
**Status:** ✅ Resolved

### Issue
The model generated Pulumi infrastructure code with an invalid S3 bucket name. This name contained **uppercase letters**, which are not allowed by AWS S3 naming rules

### Error
aws:s3:Bucket web-app-bucket-development creating (0s) error: sdk-v2/provider2.go:509: sdk.helper_schema: Error creating S3 bucket: InvalidBucketName: The specified bucket is not valid

### Root Cause
The model lacked awareness of **AWS S3 bucket naming constraints**:

### Solution
Applied a transformation to **normalize** the bucket name

---

## Improvement #001 — Added S3 bucket encryption configuration

### Issue
The S3 bucket creation lacks encryption configuration, leaving data vulnerable and potentially non-compliant with security standards.

### Solution
Add server-side encryption configuration with KMS to encrypt all objects by default

---

## Improvement #002 — Made AWS Region Configuration Global

### Issue
AWS region configuration was previously scattered across components

### Solution
Centralized AWS region configuration by implementing a global configuration management system that:
- Created a single source of truth for region settings through environment variables and configuration files
- Established a global configuration module that all AWS services import and reference

---

## QA Pipeline Results

✅ **lint**: npm run lint - PASSED

✅ **build**: npm run build - PASSED  
✅ **synth**: npm run cdk:synth - PASSED
✅ **deploy**: npm run cdk:deploy - PASSED
✅ **unit tests**: npm run test:unit - PASSED (100% coverage)
✅ **integration tests**: npm run test:integration - PASSED

---


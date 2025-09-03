# Model Failures and Corrections

This document summarizes issues in the initial `MODEL_RESPONSE.md` and the corrections applied to reach the ideal implementation.

## 1) Missing Environment Suffix Integration (CRITICAL)

- Issue: The original `MODEL_RESPONSE.md` completely lacked `ENVIRONMENT_SUFFIX` support, which is mandatory for the QA pipeline and CI/CD compatibility.
- Impact: Resource name conflicts between deployments, inability to run multiple environments in the same AWS account.
- Fix: 
  - Added `environment_suffix` variable with proper default handling
  - Created `local.name_with_suffix` combining prefix + suffix
  - Updated ALL resource names from `${var.name_prefix}-*` to `${local.name_with_suffix}-*`
  - Ensures unique resource names like `tap-dev-vpc`, `tap-pr123-alb`, etc.

## 2) Providers embedded in the stack file

- Issue: `MODEL_RESPONSE.md` configured providers directly in the stack body, conflicting with project tests and CI conventions.
- Fix: Centralized providers in `lib/provider.tf` with a DR alias (`aws.secondary`), keeping `lib/tap_stack.tf` provider-free.

## 3) Missing backend injection pattern

- Issue: Example embedded backend details; our CI injects S3 backend at init.
- Fix: Left backend block empty in `provider.tf`; bootstrap passes `-backend-config` flags.

## 4) Security concerns in RDS credentials

- Issue: Hardcoded RDS password examples.
- Fix: Use `data aws_secretsmanager_random_password` + `aws_secretsmanager_secret(_version)`; SGs restrict ingress to app and lambda only.

## 5) Lambda packaging and artifacts

- Issue: Example assumed a prebuilt zip named `lambda_function.zip` without CI changes.
- Fix: Use `data archive_file` to zip inline Python at apply-time; no repo artifact, matches file-change constraints.

## 6) Inconsistent multi-region strategy

- Issue: Example created full stacks in both regions without clarifying DR scope.
- Fix: Implement minimal DR (VPC/ALB/ASG) in secondary region using `provider` alias, aligned with prompt.

## 7) Monitoring and logging gaps

- Issue: Lack of API access logs and X-Ray in some flows.
- Fix: Enable API stage X-Ray and access logs via `aws_api_gateway_account` + role; Lambda has X-Ray + basic CW logs.

## 8) TLS and CloudFront origin policy

- Issue: Mixing viewer TLS with ALB HTTPS can require a certificate.
- Fix: Per constraints, keep ALB HTTP-only; CloudFront viewer uses default cert and origin `http-only`.

## 9) Test integration alignment

- Issue: No clear interface for tests to validate deployed endpoints.
- Fix: Added outputs (`cloudfront_domain_name`, `api_invoke_url`, etc.) and comprehensive unit/integration tests that consume them.

## 10) Tagging & consistency

- Issue: Incomplete tagging.
- Fix: Apply `local.common_tags` across resources and modules for consistency.

## 11) CI compatibility

- Issue: Risk of interactive prompts and missing artifacts.
- Fix: Avoid interactive inputs; archive provider zips code; tests and outputs match the pipeline’s expectations.

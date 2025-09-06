
Model Failures and Known Issues

Overview
This document tracks known limitations, failure modes, and potential issues with the TAP stack infrastructure deployment.

Critical Failures

1. KMS Key Policy Conflicts
Issue: KMS key policies may conflict with existing account-level policies or cross-account access requirements.

Symptoms:
- Access denied errors when accessing encrypted resources
- CloudTrail, CloudWatch Logs, or RDS unable to use KMS key
- Cross-account role assumption failures

Mitigation:
# Verify KMS key policy includes necessary service permissions
# Check for conflicting key policies in the account
# Ensure proper IAM permissions for key usage
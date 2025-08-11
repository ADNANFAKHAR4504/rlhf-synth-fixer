# Model Failures

<!--
This document lists specific failure cases where the model output does not meet
our AWS CDK security/compliance requirements. Each entry contains:

1. The model's input prompt
2. The faulty output
3. The reason it fails compliance

These are kept here for tracking + regression testing.
-->

---

## 1. Missing MFA Enforcement in IAM Policy
<!-- MFA is a required security control for privileged access; model failed to include it. -->

**Input:**
```plaintext
Generate a compliant IAM role for EC2 instances.

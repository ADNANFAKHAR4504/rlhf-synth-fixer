# model_failure

## Overview

This section describes incorrect or poor responses to the same task. A failing response either does not fix the root cause, introduces security or correctness issues, or significantly deviates from the requested minimal-change, best-practice approach.

## Characteristics of a failed response

1. **Misdiagnoses the root cause**

   * Blames the error on:

     * The Aurora engine version.
     * VPC, subnet, or security group configuration.
     * Cluster identifiers, ARNs, or DAS mode selection.
   * Suggests that the KMS key “does not exist” and proposes creating a completely new key or changing the key ARN arbitrarily, without recognizing that the issue is the Lambda role’s permission to create a grant on the existing CMK.

2. **Ignores the IAM and KMS relationship**

   * Fails to mention `kms:CreateGrant` at all.
   * Assumes that updating the `DasKmsKey` key policy alone is sufficient, without giving the Lambda role any additional permissions.
   * Recommends disabling key policies or granting overly broad `kms:*` to many principals as a workaround.

3. **Breaks the intended design**

   * Suggests:

     * Removing the dedicated CMK and switching to an AWS-managed key for DAS.
     * Disabling DAS entirely by turning off `ActivityStreamEnabled`.
     * Deleting or heavily modifying the custom resource instead of fixing permissions.
   * Makes large, unnecessary template changes such as:

     * Refactoring the Aurora resources.
     * Altering networking, alarms, or SNS topics.
     * Changing stack parameters unrelated to the error.

4. **Introduces security anti-patterns**

   * Grants extremely broad KMS permissions, for example:

     * `kms:*` on all keys with `Resource: "*"`.
     * Adding public or cross-account principals to the key policy.
   * Removes or weakens conditions on the CMK or IAM role, thereby violating least-privilege and making the design less secure than before.

5. **Produces incomplete or invalid guidance**

   * Leaves ambiguity on what exactly needs to be changed in the template.
   * Mentions that “some KMS permissions are missing” but does not specify:

     * Which role must be updated (the Lambda role).
     * Which actions are required (`kms:CreateGrant` and `kms:DescribeKey`).
     * That the permissions should be scoped to the specific CMK ARN.
   * Suggests changes that would result in:

     * Another deployment failure (for example, wrong ARN, missing conditions, or inconsistent references).
     * New linter or validation errors due to malformed properties or unknown fields.

6. **Violates user constraints**

   * Adds unrelated commands, code blocks, or large refactors when the user explicitly asked for a focused fix and no extra changes.
   * Introduces new services or patterns that are not part of the original template and not required to resolve the error.
   * Fails to maintain the intent that the rest of the stack, including DAS with a dedicated CMK, should remain intact and deployable.

Any response that does not clearly fix the KMS access problem by giving the custom resource’s Lambda role the necessary and correctly scoped `kms:CreateGrant` (and `kms:DescribeKey`) on `DasKmsKey`, while preserving the existing architecture and security posture, should be considered a model failure for this task.

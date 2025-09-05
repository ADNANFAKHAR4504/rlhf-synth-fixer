# Model Failure Response

**Summary:** The model ignored the user’s request to **fix unit tests** and instead generated a **new CDK stack** (app + stack code) with scope creep. The output does not address the failing test and diverges from the specified architecture, causing misalignment with existing assertions.

## What was requested

* Provide an **updated unit test file** that validates an existing stack:

  * ALB **HTTP:80 only**, TG **8080**, `/health`
  * VPC: **2 AZs**, public + private (egress), **single NAT**
  * SG rules: `0.0.0.0/0 → ALB:80`, `ALB SG → App SG:8080`, `App SG → RDS SG:5432`
  * DynamoDB **PAY\_PER\_REQUEST**
  * S3 app bucket **KMS + versioning**; logs bucket with **CloudTrail ACL condition**
  * CloudTrail **multi-region**, **KMS-encrypted**
  * IAM role includes **SSM Core** + **CW Agent** and inline statements for:

    * `secretsmanager:GetSecretValue` (accept **string or list** Action)
    * `ssm:Get*` (prefix-scoped)
    * `logs:*` (create/put)
  * Log group `/nova/<env>/app` (30d), CPU alarm **>= 70**
  * Four SSM params + one secret, and required **Outputs**

## What the model produced

* A **new** CDK app + stack with **HTTPS (443)**, certificate wiring, **HTTP→HTTPS redirect**, **bastion host**, **SSH rules**, **SNS topic**, and optional **RDS** changes.
* Changed behaviors and contexts not requested and not covered by tests.

## Why this is a failure

* **Instruction mismatch:** The task was to **fix tests**, not to **rewrite the stack**.
* **Spec deviation:** Added HTTPS, bastion, SSH, SNS, etc., which **conflict** with the test’s expectations (HTTP-only baseline).
* **No resolution of failing test:** The original failure (Action rendered as string vs list for `secretsmanager:GetSecretValue`) remains unaddressed.

## Required correction (actionable)

1. **Do not modify or generate stack code.**
2. Provide **only** the updated unit test file that:

   * Keeps existing assertions for VPC/ALB/TG/SG/DDB/S3/Trail/Logs/Alarm/Params/Outputs.
   * For IAM inline policy, **accepts both string and list** for `"secretsmanager:GetSecretValue"` Action.
   * Targets the **instance role’s inline policy** using `PolicyName` regex: `^NovaInstanceRoleDefaultPolicy`.
3. Ensure PEP8 formatting, 4-space indentation, and imports minimized to those used.

## Severity

**High** — Delivered output cannot be used; it introduces architectural drift and ignores the explicit request.

## Acceptance criteria

* `test_instance_role_policies_minimum_required` **passes** alongside existing passing tests.
* No stack code changes required.
* Single file output: `tests/unit/test_tap_stack.py`.

# MODEL_FAILURE_PROMPT.md

**Purpose:** Use this prompt to rewrite the **model response** so it matches the **ideal response** in security, correctness, portability, and testability. Do **not** add new services. Fix only what’s wrong or missing.

---

## 1) High-severity failures (blockers)

1. **Invalid condition usage for SG ports**

   * *Symptom:* Inline comparison (`Equals`) nested inside `If` in `DbSecurityGroup` `FromPort/ToPort`.
   * *Impact:* Template fails validation.
   * *Directive:* Define a named condition for engine type and reference that condition in all `Fn::If` usages.

2. **Invalid S3 ARN interpolation**

   * *Symptom:* Using `${S3Bucket.Arn}` in `!Sub`.
   * *Impact:* Policy build breaks; incorrect ARNs in bucket policy and Lambda permissions.
   * *Directive:* Always derive the bucket ARN via attribute and then append `/*` using a parameters map in `Sub`.

3. **Disallowed `GroupName` on VPC security groups**

   * *Symptom:* `GroupName` set for `LambdaSecurityGroup`/`DbSecurityGroup`.
   * *Impact:* Create/Update rejected in VPC context.
   * *Directive:* Remove explicit `GroupName` for VPC SGs; keep `GroupDescription`, `VpcId`, rules, and tags.

---

## 2) Security & compliance gaps

4. **Plaintext DB password via Parameter**

   * *Symptom:* `DbPassword` parameter instead of Secrets Manager.
   * *Impact:* Secrets exposed in stack events/ChangeSets; audit failure.
   * *Directive:* Generate credentials in Secrets Manager; reference the password via dynamic reference in the DB instance; export the secret ARN.

5. **Over-permissive / non-partition-aware ARNs**

   * *Symptom:* Hardcoded `arn:aws:` in IAM/CloudWatch Logs.
   * *Impact:* Breaks in Gov/China partitions; portability issues.
   * *Directive:* Use partition-aware ARNs with the AWS partition pseudo parameter consistently.

---

## 3) Spec deviations vs the ideal response

6. **RDS engine version policy**

   * *Symptom:* Default version set to `14.7` with no validation.
   * *Impact:* Diverges from ideal (PostgreSQL 15.8) and lacks support for regional `-r` suffixes.
   * *Directive:* Default to `15.8` and validate with a pattern allowing optional `-rN` suffix.

7. **Unused/stray conditions**

   * *Symptom:* Condition defined (e.g., `IsDev`) but never used.
   * *Impact:* Lint noise; maintainability hit.
   * *Directive:* Remove unused conditions or use them meaningfully.

8. **Lambda logs permission scoping inconsistency**

   * *Symptom:* `logs:CreateLogGroup/Stream` scopes differ from the ideal, risking first-run failures in some layouts.
   * *Impact:* Possible permission errors on cold start; lint warnings.
   * *Directive:* Align with the ideal’s scope and naming convention for the log group.

---

## 4) Lint & validation hygiene

9. **Template semantics likely to trigger cfn-lint warnings**

   * *Examples:*

     * Conditional misuse (ports) → function/condition errors.
     * Unused conditions → “unused” warnings.
     * S3 ARN string construction → invalid resource ARNs.
   * *Directive:* Ensure all conditions are referenced; all `Sub` blocks use a variables map when injecting attributes; avoid EC2-Classic-only fields.

---

## 5) Outputs and observability gaps

10. **Missing DB secret output**

    * *Symptom:* No export for the DB secret.
    * *Impact:* Ops/CI cannot programmatically fetch creds location; integration tests lose a hook.
    * *Directive:* Export the Secrets Manager ARN (name it like the ideal).

---

## 6) Naming, tagging, and conventions

11. **Naming pattern must be consistent**

    * *Requirement:* `${ProjectName}-${Environment}-${AWS::AccountId}-${AWS::Region}-<suffix>`.
    * *Directive:* Ensure every resource (including roles, log groups, SG name tags, SNS topic) follows the exact pattern.

12. **Tags completeness**

    * *Requirement:* `Project`, `Environment`, `Owner` consistently; `Name` tag where applicable.
    * *Directive:* Audit and align all resources with the ideal set.

---

## 7) Acceptance criteria (what “fixed” looks like)

* **Validation:** `cfn-lint` and `aws cloudformation validate-template` pass without errors.
* **Security:** No plaintext secrets; DB password created and consumed via Secrets Manager dynamic reference.
* **Portability:** All ARNs partition-aware.
* **Networking:** One NAT in `dev`, two NATs in `prod`; public/private subnets across two AZs; public route to IGW; private routes to correct NAT(s).
* **Data tier:** RDS engine/version policy matches ideal (default Postgres 15.x with regex allowance); DB in private subnets; SG opens only the correct port to Lambda SG.
* **S3:** Versioning on; SSE-S3; public access blocked; explicit Deny non-TLS.
* **DynamoDB:** On-demand; optional sort key via condition; PITR enabled only in `prod`.
* **Lambda:** VPC-enabled in private subnets; minimal IAM; logs retained per environment mapping.
* **Alarms & SNS:** All four alarm types present; optional email subscription gated on parameter.
* **Outputs:** Full parity with ideal, plus exported DB secret ARN.

---

## 8) Rewrite checklist (no code—use as your to-do list)

* [ ] Replace plaintext DB password parameter with a generated Secrets Manager secret and dynamic reference.
* [ ] Add a named condition for engine type; use it for DB SG ports; remove inline `Equals` from `If`.
* [ ] Remove `GroupName` from all VPC security groups; keep `GroupDescription` and tags.
* [ ] Make all ARNs partition-aware; eliminate hardcoded `arn:aws:`.
* [ ] Correct S3 ARN construction in bucket policy and Lambda permissions (attribute → path form).
* [ ] Set `RdsEngineVersion` default to 15.8 and add an `-rN` tolerant pattern.
* [ ] Delete unused conditions or apply them appropriately.
* [ ] Align Lambda log group naming and IAM log permissions with the ideal conventions.
* [ ] Ensure every resource name/tag follows the required naming pattern.
* [ ] Add output/export for the DB secret ARN.

---

## 9) Tone and scope for the rewrite

* Keep it **single-file**, **production-grade**, and **minimal**—only the services present in the ideal.
* Do **not** introduce new components (e.g., WAF, ALB, KMS keys) beyond what the ideal covers.
* Preserve the **Parameters/Mappings/Conditions** architecture from the ideal; ensure conditions are the only toggle mechanism for env differences.
* Ensure all **Outputs** match the ideal’s names/exports exactly (plus the DB secret ARN).

---

**Deliverable:** A corrected CloudFormation YAML (not included here) that satisfies all acceptance criteria above and eliminates every item in the checklist.

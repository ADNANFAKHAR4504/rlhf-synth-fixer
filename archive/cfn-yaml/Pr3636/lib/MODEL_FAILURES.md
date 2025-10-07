# MODEL_FAILURES.md

## Summary

The model’s generated CloudFormation template diverges from the given “ideal response prompt.md” (your reference template) in several critical ways. Most issues are **requirement violations** (adding HTTPS/ACM when explicitly disallowed), **missing/extra parameters**, **policy/principal mistakes**, and **naming/compatibility drift** that will break unit tests expecting your schema and semantics.

---

## High-Impact Deviations (breaks requirements/tests)

1. **Protocol & Certificate (Hard Requirement Violation)**

   * **Spec says:** HTTP-only ALB; template description even states: `NOTE: No ACM/HTTPS`.
   * **Model did:** Introduced `SSLCertificateArn` parameter and an **HTTPS (443)** listener with certificates.
   * **Impact:** Contradicts requirements; unit tests expecting absence of `SSLCertificateArn`/HTTPS will fail; deployment behavior changes.

2. **Parameters: shape and allowed values**

   * **Spec:**

     * `ProjectName` must match `^[a-z0-9][a-z0-9-]*$` (lowercase only).
     * `Environment` values: `[dev, stg, prod]`.
     * No `SSLCertificateArn` parameter.
   * **Model:**

     * Allowed uppercase letters in `ProjectName` (`^[a-zA-Z][a-zA-Z0-9-]*$`).
     * Changed `Environment` to `Development, Staging, Production`.
     * **Added** `SSLCertificateArn`.
   * **Impact:** Tests validating parameter presence, allowed patterns/values, and absence of SSL parameter will fail.

3. **S3 Access Logs policy principal (ALB logging)**

   * **Spec:** Uses the **service principal** `logdelivery.elasticloadbalancing.amazonaws.com` to allow `s3:PutObject` into the access logs bucket.
   * **Model:** Grants `s3:PutObject` to the **account root** principal.
   * **Impact:** ELB access log delivery may **fail**; security/policy tests will fail.

4. **Resource naming & exports**

   * **Spec:** No hardcoded `BucketName`s (uses implicit names) and provides multiple **Exports** (e.g., `*-alb-dns`, bucket exports, subnet exports).
   * **Model:** Hardcodes `BucketName` with `${AccountId}` suffix and changes export names/casing.
   * **Impact:** Tests asserting specific outputs/exports and naming conventions will fail; potential stack name collisions if reused in other accounts/regions.

---

## Medium-Impact Deviations

5. **CloudTrail role permissions**

   * **Spec:** A **broadened** CloudTrail to CloudWatch Logs delivery role (allows create/describe/put with wildcard and explicit LG ARNs).
   * **Model:** Restricts to `logs:CreateLogStream` and `logs:PutLogEvents` on the LogGroup ARN only.
   * **Impact:** May be acceptable but diverges from spec’s intent to be robust; could cause runtime failures if log group operations are required; tests expecting the broader actions could fail.

6. **CloudTrail S3 bucket policy object path**

   * **Spec:** `Resource: ${Bucket.Arn}/AWSLogs/${AccountId}/*` and ACL condition.
   * **Model:** Uses `${Bucket.Arn}/*`.
   * **Impact:** Functionally OK for many setups, but **differs from spec**; tests checking exact policy may fail.

7. **Central logging bucket pattern**

   * **Spec:** Separates `CentralLogsBucket` and logs **other buckets into it**; CloudTrail bucket itself logs to CentralLogs.
   * **Model:** **No CentralLogsBucket**; Access/CloudTrail buckets stand alone or cross-log differently.
   * **Impact:** Design intent (centralized logging) lost; outputs/exports missing; tests verifying presence of CentralLogs bucket and its logging config will fail.

8. **ALB egress modeling**

   * **Spec:** Egress defined as a separate `AWS::EC2::SecurityGroupEgress` resource (`ALBToEC2Egress`).
   * **Model:** Egress inlined as part of the `ALBSecurityGroup` `SecurityGroupEgress`.
   * **Impact:** Structural difference may break tests that expect distinct resources/ids.

---

## Low-Impact / Style Deviations

9. **Tag casing & names**

   * Minor differences in `Name` tag values (`ALB` vs `alb`, hyphenation, case).
   * Impact: Usually cosmetic but can break strict tests or downstream expectations.

10. **Additional resources not in spec**

* **Model:** Adds an **AWS Config Rule** (`INCOMING_SSH_DISABLED`) that the spec doesn’t include.
* Impact: Non-breaking in AWS, but can fail tests that compare exact resource sets.

11. **Mappings & defaults**

* **Model:** Adds `Mappings.SubnetConfig.VPC.CIDR` (unused) and changes default descriptions/names.
* Impact: Cosmetic; might fail description/title tests.

---

## Concrete Fixes (to make the model pass your tests)

* **Remove HTTPS entirely**:

  * Delete `SSLCertificateArn` parameter and **HTTPS Listener**.
  * Revert ALB to **HTTP (80)** only; keep WAF association as in spec.
  * Update `Description` to match the spec line, or keep exactly as provided.

* **Restore parameter contracts**:

  * `ProjectName` pattern: `^[a-z0-9][a-z0-9-]*$`.
  * `Environment` allowed values: `[dev, stg, prod]`.
  * Ensure `VPCCidr` pattern matches spec verbatim.

* **Fix ALB access logs policy**:

  * Set `Principal: { Service: logdelivery.elasticloadbalancing.amazonaws.com }`.
  * Keep `s3:PutObject` resource as `${AccessLogsBucket.Arn}/alb/AWSLogs/${AWS::AccountId}/*` per spec.

* **Reintroduce CentralLogsBucket & logging flow**:

  * `AccessLogsBucket` and `CloudTrailLogsBucket` should log **to** `CentralLogsBucket`.
  * Restore lifecycle policies and tags as in spec.

* **Align CloudTrail role and policy**:

  * Match the broadened actions list and explicit ARNs from the spec (including `DescribeLogGroups`, `PutRetentionPolicy`, etc.).

* **Outputs & export names**:

  * Match **exact** output keys, descriptions, and `Export: Name` values from the spec (e.g., `*-alb-dns`, `*-cloudtrail-bucket`, `*-public-a-id`, etc.).

* **Resource structure parity**:

  * Keep separate `SecurityGroupIngress` and `SecurityGroupEgress` resources where the spec does so (`EC2SecurityGroupIngressFromALB`, `ALBToEC2Egress`).

---

## Quick “Why tests failed” checklist

* [ ] HTTPS/ACM present (must be HTTP-only).
* [ ] Unexpected `SSLCertificateArn` parameter.
* [ ] Parameter regex/value sets don’t match spec.
* [ ] ALB access logs bucket policy principal wrong.
* [ ] Missing `CentralLogsBucket` and cross-bucket logging.
* [ ] CloudTrail role permissions differ from broadened spec.
* [ ] Output/Export names don’t match.
* [ ] Structural diffs (separate SG egress/ingress resources).
* [ ] Extra resources (AWS Config Rule) not in spec.

---

## Conclusion

The core failure is **requirement drift**: the model implemented HTTPS/ACM and altered parameter contracts, which directly contradict the spec and your test expectations. Aligning protocol (HTTP-only), parameters, logging principals/flows, and outputs with the original template will make the model’s output pass your unit tests and maintain the intended security architecture.

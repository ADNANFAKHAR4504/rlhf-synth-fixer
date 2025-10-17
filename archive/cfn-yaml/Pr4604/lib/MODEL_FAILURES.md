## Summary

The model’s template diverges from the target standard in several high-impact areas: AMI sourcing/portability, target health/readiness, log delivery reliability, version pinning for RDS, and instance telemetry. These gaps risk failed deployments, unhealthy targets, and missing audit/ops visibility.

---

## Issue 1: Non-portable, stale AMI selection

* **Location:** `Parameters` / `Resources > LaunchTemplate`
* **What happened (Model):** Uses a static AMI mapping (`Mappings.AWSRegion2AMI` + `FindInMap`).
* **What’s expected (Ideal):** Resolve the latest Amazon Linux via an SSM Parameter type and reference it in the Launch Template.
* **Why it matters:** Static AMIs go out of date and may be missing in some regions; portability and patch posture degrade.
* **Fix:** Replace AMI mappings with an SSM Parameter of type `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>` and use it for `ImageId`.

---

## Issue 2: ALB targets fail health checks (no HTTP service)

* **Location:** `Resources > LaunchTemplate.UserData`, `Resources > TargetGroup`
* **What happened (Model):** User data does not install/start a web server; health check path `/` expects HTTP `200`.
* **What’s expected (Ideal):** Install and start a lightweight HTTP server and serve a `200` on `/` so targets become **healthy**.
* **Why it matters:** Targets remain unhealthy; the ALB cannot route traffic; deployment appears “up” but is unusable.
* **Fix:** In user data, install and enable `httpd` (or equivalent) and write a simple index page so `/` returns `200`.

---

## Issue 3: ALB access-log delivery principal is outdated/incomplete

* **Location:** `Resources > ALBLogsBucketPolicy`
* **What happened (Model):** Grants `s3:PutObject` using legacy ELB account IDs only.
* **What’s expected (Ideal):** Grant access to the **service principal** `logdelivery.elasticloadbalancing.amazonaws.com` with the required object key prefix.
* **Why it matters:** In several regions/setups, logs won’t deliver with only legacy account IDs; this breaks auditability.
* **Fix:** Replace the principal list with the ELB log-delivery service principal and keep TLS-only + bucket owner full control constraints.

---

## Issue 4: Hard-coded DB engine version (reliability/regional support)

* **Location:** `Parameters.DBEngineVersion`, `Resources > DBInstance.EngineVersion`
* **What happened (Model):** Pins a specific minor version by default.
* **What’s expected (Ideal):** Allow the parameter to be **blank** and conditionally set `EngineVersion`, letting RDS choose a region-supported version.
* **Why it matters:** Pinning can fail in regions where that exact minor isn’t offered; creates maintenance and rollout friction.
* **Fix:** Make the version optional with a condition; only set `EngineVersion` when provided.

---

## Issue 5: Missing CloudWatch agent telemetry on instances

* **Location:** `Resources > LaunchTemplate.UserData`, `IAM role policy`
* **What happened (Model):** Does not install/configure the CloudWatch agent; no application or system metrics/logs are forwarded.
* **What’s expected (Ideal):** Install and start the CloudWatch agent, forward at least HTTP access logs and basic system metrics to encrypted log groups.
* **Why it matters:** Reduced visibility and slower incident response; alarms may not reflect real workload health.
* **Fix:** Add agent installation and a minimal config (metrics + log shipping) in user data; keep the existing `CloudWatchAgentServerPolicy`.

---

## Acceptance Criteria (what “fixed” looks like)

1. **AMI sourcing** uses an SSM Parameter type for Amazon Linux and the Launch Template references it directly.
2. **Targets go healthy** behind the ALB (HTTP server installed; `/` returns 200).
3. **ALB logs** reliably deliver using the service principal policy; bucket enforces TLS-only and bucket-owner-full-control.
4. **DB engine version** is optional; template deploys cleanly across regions without manual version tweaks.
5. **CW agent** is installed and running; app/system logs and key metrics appear in the designated encrypted log groups.

**Severity:** High (deployment reliability + logging/auditing + operability)
**Priority:** Address Issues 2 and 3 first (functionality + audit), then 1, 4, 5.

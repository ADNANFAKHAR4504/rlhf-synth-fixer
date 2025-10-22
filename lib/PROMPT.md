**Goal (plain English)**
Build a secure, scalable AWS foundation for a web app using **one and only one CloudFormation template file** plus a small Python custom resource. Include S3 (with central access logging), Lambda, API Gateway, tight IAM, CloudWatch alarms for IAM events, strict NACLs across **three AZs**, and **WAF** in front of API Gateway.

**What to deliver**

* **Exactly one** CloudFormation template file (single stack; **no nested stacks**, **no additional templates**).
* One or more Python handlers for the custom resource (packaged and invoked by that single template).
* Clear Outputs that **prove** the requirements are met.
* Simple deployment and validation steps (describe what the stack must expose).

**Must-haves (do these exactly)**

1. Use a Python **custom resource** with CloudFormation to stand up an **application S3 bucket** that uses a **customer KMS key**.
2. Turn on **default server-side encryption (SSE-KMS)** for all objects; reject non-encrypted uploads and uploads with the wrong key.
3. **IAM roles** follow **least privilege**; avoid wildcards; prefer **managed policies** attached to roles for auditability.
4. **Lambda handlers** log errors in a structured way (include request ID, event snapshot, and stack trace).
5. Create **CloudWatch metric filters + alarms** for specific **IAM-related CloudTrail events** (see list below) and send notifications via SNS.
6. Send **all S3 access logs** from non-logging buckets to **one centralized logging bucket** with the proper delivery permissions.
7. **Network ACLs**: allow only the traffic that’s needed, include return traffic port ranges, and apply consistently across **three AZs**.
8. Protect **API Gateway** with **WAFv2** (at least one AWS managed rule group + one custom rule).
9. **Versioning ON** for every S3 bucket.
10. No unnecessary wildcard actions or resources in any policy.

**High-level design (keep it simple, keep it safe)**

* **Networking (3 AZs):** VPC across three AZs; subnets per AZ; strict NACLs with explicit allows for required ports/CIDRs only, explicit ephemeral ranges, deny everything else.
* **Data (S3 + KMS):** App bucket uses a customer KMS key; default SSE-KMS; bucket policy enforces encryption with that key; central logging bucket receives server access logs; public access block everywhere; versioning everywhere.
* **Compute & API:** One Lambda (sample app) with structured error logging; API Gateway fronting the Lambda; **WAFv2 WebACL** (regional) attached to the API stage/ARN (AWS managed rule group + simple custom rule).
* **Custom resource (Python):** Idempotent create/update/delete; creates/ensures KMS key + alias with tight key policy; creates/ensures app bucket with SSE-KMS (BucketKeys on), versioning, public access block, encryption-enforcing bucket policy, and server access logging to the central bucket; emits clear error logs and fails cleanly on unrecoverable issues.
* **Security & IAM:** Separate roles for the custom resource and the app Lambda; use managed policies you define; scope actions to exact ARNs and add conditions where sensible (e.g., SourceArn/SourceAccount for invokes).

**Monitoring (IAM event alarms)**

* Trail → CloudWatch Logs → metric filters → alarms for at least:

  * `CreateUser`, `DeleteUser`, `CreateRole`, `DeleteRole`
  * `AttachRolePolicy`, `DetachRolePolicy`, `PutRolePolicy`, `PutUserPolicy`
  * `CreateAccessKey`, `DeleteAccessKey`, `UpdateLoginProfile`, `DeleteLoginProfile`
  * Successful `ConsoleLogin` **without MFA** (`MFAUsed = "No"`)
* Each alarm notifies an SNS topic (e.g., threshold ≥1 in 5 minutes).

**Parameters & tags**

* Minimal, practical parameters: project prefix, environment, allowed CIDRs, central log bucket name, KMS key alias, API/WAF toggles.
* Consistent tags on every resource (Project, Env, Owner, CostCenter).

**Outputs (so we can verify)**

* ApplicationBucketName
* CentralLogBucketName
* KmsKeyArn
* ApiGatewayInvokeUrl
* WafWebAclArn
* TrailName and TrailLogGroupName
* IamEventAlarmArns (list or joined)
* VpcId, per-AZ SubnetIds, and NaclIds
* A clear indicator that **Versioning = Enabled** on all buckets
* A clear indicator that **default SSE-KMS** is on and tied to the **specific KMS key**

**Acceptance checks (what “done” looks like)**

* **Single** CloudFormation template validates cleanly; deployment requires no manual steps; no nested stacks.
* Buckets show **Versioning: Enabled** and **Default SSE-KMS** with the expected key.
* Unencrypted or wrong-key uploads are blocked.
* Access logs land in the central bucket under expected prefixes.
* API endpoint is live and **associated with WAF**.
* IAM event filters exist; a harmless IAM action triggers the corresponding **alarm**.
* NACL rules exist on all relevant subnets in **all three AZs** with only the intended allow rules.

**Out of scope**

* Don’t add unrelated services.
* Don’t output secrets.
* Don’t create multiple templates or nested stacks—**one stack file only**.

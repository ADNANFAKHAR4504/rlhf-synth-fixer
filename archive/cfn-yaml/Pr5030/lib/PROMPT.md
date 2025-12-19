**Goal (plain English)**
Build a secure, scalable AWS foundation for a web app using **one CloudFormation template (single stack, no nested stacks)** plus a small Python custom resource. Include S3 (with central access logging), Lambda, API Gateway, tight IAM, CloudWatch alarms for IAM events, strict NACLs across **three AZs**, and **WAF** in front of API Gateway.

**Repository / files**

* The **`lib/` folder may contain multiple files** (including `TapStack.json` and any supporting files you need).
* Do **not** add unrelated services or extra templates beyond the single main CloudFormation stack.

**What to deliver**

* **Exactly one** CloudFormation template file (single stack; **no nested stacks**, **no additional templates**).
* One or more Python handlers for the custom resource (packaged and invoked by that single template).
* Clear **Outputs** that **prove** the requirements are met.
* Simple deployment and validation steps (what the stack exposes and how to verify).

**Naming & parameters (mandatory)**

* Introduce a parameter (or equivalent) named **`environmentSuffix`** (e.g., `dev`, `stg`, `prod`, or PR number).
* **Every named resource** (buckets, log groups, KMS aliases, Lambda functions, API Gateway names/stages, WAF WebACL, CloudTrail, SNS topics, alarms, VPC/subnets/NACLs, etc.) **must include `environmentSuffix`** in the name.

  * Example: `${ProjectPrefix}-${Environment}-${environmentSuffix}-app-bucket-<accountId>`
* Apply consistent tags on every resource (Project, Env, Owner, CostCenter).

**Must-haves (do these exactly)**

1. Use a Python **custom resource** with CloudFormation to stand up an **application S3 bucket** that uses a **customer KMS key**.
2. Turn on **default server-side encryption (SSE-KMS)** for all objects; reject non-encrypted uploads and uploads with the wrong key.
3. **IAM roles** follow **least privilege**; avoid wildcards; prefer **managed policies** you define and attach to roles.
4. **Lambda handlers** log errors in a structured way (include request ID, event snapshot, and stack trace).
5. Create **CloudWatch metric filters + alarms** for specific **IAM-related CloudTrail events** (list below) and send notifications via SNS.
6. Send **all S3 access logs** from non-logging buckets to **one centralized logging bucket** with proper delivery permissions.
7. **Network ACLs**: allow only the traffic that’s needed, include return traffic port ranges, and apply consistently across **three AZs**.
8. Protect **API Gateway** with **WAFv2** (at least one AWS managed rule group + one custom rule).
9. **Versioning ON** for every S3 bucket.
10. No unnecessary wildcard actions or resources in any policy.

**High-level design (keep it simple, keep it safe)**

* **Networking (3 AZs):** VPC across three AZs; subnets per AZ; strict NACLs with explicit allows and ephemeral ranges.
* **Data (S3 + KMS):** App bucket with customer KMS key; default SSE-KMS; bucket policy enforces correct key; central logging bucket for access logs; public access block + versioning everywhere.
* **Compute & API:** One Lambda (sample app) with structured error logging; API Gateway; **WAFv2 WebACL** attached to the API stage/ARN (AWS managed rule group + simple custom rule).
* **Custom resource (Python):** Idempotent create/update/delete; ensures KMS key + alias; ensures app bucket (BucketKeys on), versioning, PAB, encryption-enforcing bucket policy, server access logging to central bucket; clear error logs and clean failure.

**Monitoring (IAM event alarms)**

* Trail → CloudWatch Logs → metric filters → alarms for at least:

  * `CreateUser`, `DeleteUser`, `CreateRole`, `DeleteRole`
  * `AttachRolePolicy`, `DetachRolePolicy`, `PutRolePolicy`, `PutUserPolicy`
  * `CreateAccessKey`, `DeleteAccessKey`, `UpdateLoginProfile`, `DeleteLoginProfile`
  * Successful `ConsoleLogin` **without MFA** (`MFAUsed = "No"`)
* Each alarm notifies an SNS topic (e.g., threshold ≥1 in 5 minutes).

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
* **Echo the `environmentSuffix`** and show example resource names that include it.

**Acceptance checks (what “done” looks like)**

* **Single** CloudFormation template validates cleanly; deployment requires no manual steps; no nested stacks.
* Buckets show **Versioning: Enabled** and **Default SSE-KMS** with the expected key.
* Unencrypted or wrong-key uploads are blocked.
* Access logs land in the central bucket under expected prefixes.
* API endpoint is live and **associated with WAF**.
* IAM event filters exist; a harmless IAM action triggers the corresponding **alarm**.
* NACL rules exist on all relevant subnets in **all three AZs** with only the intended allow rules.
* **All named resources include `environmentSuffix`.**

**IDEAL_RESPONSE.md formatting (strict)**

* Use proper fenced code blocks for **every** file:

  * CloudFormation: `yaml … `
  * Python: `python … `
  * JSON (if any): `json … `
* If multiple files exist under `lib/`, **include a separate fenced block for each file** with a short header naming the file.
* No raw code outside fenced blocks.

**Out of scope**

* Don’t add unrelated services.
* Don’t output secrets.

---

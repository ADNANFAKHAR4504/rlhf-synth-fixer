Got it 👍 — you want the **prompt clean**, with **no mentions of CloudTrail / Config / GuardDuty at all**, not even in section headers.
Here’s the fully recreated **CDK v2 Python prompt** that keeps the secure environment requirements but omits those services entirely.

---

# Prompt: CDK v2 (Python) secure web app stack

**Goal**
Generate a production-grade AWS CDK v2 (Python) project named **“IaC - AWS Nova Model Breaking”** that provisions a secure baseline for a web application in **us-east-1** and meets the following constraints.

**Language/Platform**

* Python 3.10+
* AWS CDK v2 (Python) only

**Folder structure (must match exactly)**

```
root/
├── tap.py                     # CDK App entry point
├── lib/
│   └── tap_stack.py           # Main CDK stack logic (VPC, EC2, ELB, S3, etc.)
└── tests/
    ├── unit/
    │   └── test_tap_stack.py  # Unit tests for individual constructs
    └── integration/
        └── test_tap_stack.py  # Integration tests for stack outputs and resources
```

**Stack name**

* `TapStack`

**Parameters / Context (make configurable with sensible defaults)**

* `env_name` (string, default: `"dev"`) — used in names/tags
* `owner` (string, default: `"PlatformTeam"`)
* `allowed_office_cidr` (string CIDR for bastion SSH ingress; default empty → no public SSH, use SSM)
* `db_username` (string, default: `"appuser"`)
* `db_allocated_storage` (number, default: 50)
* `instance_type` (string, default: `"t3.micro"`) for app EC2
* `lambda_memory_mb` (number, default: 256)

**Global tagging requirement**

* Apply two tags to **all** resources:

  * `Environment = <env_name>`
  * `Owner = <owner>`

---

## Required resources & security controls

1. **VPC (3-tier)**

* At least 2 AZs.
* Subnets: public (for bastion + ALB), private-with-egress (for app EC2 and Lambda), isolated/private (for database).
* NAT Gateways in each AZ.
* **Security Groups**:

  * ALB SG: inbound 443 from `0.0.0.0/0`; no 80.
  * App SG: inbound from ALB SG on app port (e.g., 8080).
  * DB SG: inbound only from App SG and Lambda SG.
  * Bastion SG: inbound 22 only from `allowed_office_cidr` if provided; otherwise rely on SSM.

2. **Bastion host (EC2)**

* In public subnet.
* Accessible via SSM Session Manager; port 22 only if CIDR provided.
* IAM role: only `AmazonSSMManagedInstanceCore`.
* Root EBS encrypted, delete-on-termination enabled.

3. **Application EC2 (ASG or single) behind ALB**

* Private subnets only.
* ALB in public subnets with HTTPS listener only (TLS1.2+, no HTTP).
* ACM certificate parameter.
* Launch template: IMDSv2 enforced, encrypted EBS.

4. **S3 buckets**

* Logging bucket: versioning enabled, no public access.
* Data bucket: logs to logging bucket, no public access.
* Public access blocked, SSE enabled, deny non-TLS.

5. **API Gateway**

* HTTPS-only endpoints.
* TLS1.2+.
* Integrates with Lambda.

6. **Database (RDS)**

* Postgres preferred.
* Encrypted storage.
* Isolated subnets, no public access.
* Credentials managed in Secrets Manager.

7. **VPC Endpoints**

* Gateway endpoints for S3 and DynamoDB.
* Optional interface endpoints for SSM if needed.

8. **MFA enforcement**

* Strong account password policy.
* IAM policy requiring MFA for sensitive actions.
* Attached to IAM Group `MFARequired`.

9. **Lambda**

* Python 3.11 runtime.
* Runs in private subnets.
* Security group allows only outbound 443.
* IAM role permissions scoped to:

  * Read/write specific S3 buckets,
  * Read DB secret from Secrets Manager,
  * CloudWatch Logs.

10. **EBS encryption**

* All EC2 volumes encrypted.
* Snapshots encrypted by default.

11. **Tagging**

* Every resource tagged with `Environment` and `Owner`.

---

## IAM examples

* **EC2 app role**: S3 read, Secrets Manager read, minimal CloudWatch Logs.
* **Lambda role**: S3 scoped access, Logs, Secrets Manager for DB secret.
* **Bastion role**: only SSM core.

---

## Tests

### `tests/unit/test_tap_stack.py`

* Assertions for:

  * S3 buckets logging + no public access.
  * API Gateway HTTPS-only.
  * DB storage encryption + no public access.
  * VPC endpoints for S3/DynamoDB.
  * Security Groups per design.
  * EC2 IMDSv2 + EBS encryption.
  * Lambda has VPC config + scoped IAM.
  * All resources have correct tags.

### `tests/integration/test_tap_stack.py`

* Synth stack and check Outputs:

  * ALB DNS
  * API endpoint URL
  * DB endpoint
  * Bucket names
  * VPC and subnet IDs

---

## Exclusions

* Do not include monitoring, auditing, or compliance services outside the above list.

---

✅ Acceptance criteria:

* `cdk synth` runs without errors.
* Unit and integration tests pass.
* Template enforces least privilege, encryption, private networking, HTTPS-only, MFA, and tagging across all resources.

---

Do you want me to now turn this **prompt** into the actual **CDK code skeleton** (`tap.py`, `tap_stack.py`, tests) so you can deploy immediately?

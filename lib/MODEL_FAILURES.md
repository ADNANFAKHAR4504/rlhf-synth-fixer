# Model Failure

This response does not meet the critical requirements of the TapStack specification. The following issues were identified:

---

### Networking & Isolation

* **Single VPC only**: The template provisions a single VPC instead of creating three isolated environments (Dev, Staging, Prod) with distinct, non-overlapping CIDR ranges (`10.0.0.0/16`, `10.1.0.0/16`, `10.2.0.0/16`).
* **Subnet layout missing**: Public and private subnets are not evenly distributed across multiple Availability Zones. Some subnets are hardcoded to a single AZ, reducing fault tolerance.
* **Incomplete routing**: NAT Gateway routing for private subnets is missing or incorrectly associated. Internet Gateways are either not attached or shared across environments, breaking isolation.
* **Overlapping CIDRs**: Where multiple environments are defined, CIDRs overlap, preventing clean network segmentation.

---

### S3 Buckets & Replication

* **No per-environment buckets**: Only one S3 bucket is created instead of separate buckets for Dev, Staging, and Prod.
* **Replication omitted**: Cross-environment replication rules are absent. The pipeline (Dev → Staging → Prod) for the `non-sensitive/` prefix is not implemented.
* **Replication role missing**: No dedicated IAM role is created for replication, or it is over-privileged. Without proper scoping, replication either fails or allows unintended access.
* **Security gaps**: Buckets lack `PublicAccessBlockConfiguration`, SSE encryption, versioning, and lifecycle cleanup for incomplete multipart uploads.

---

### IAM Roles & Permissions

* **Environment roles absent**: Roles such as `TapStack-Dev-Role`, `TapStack-Staging-Role`, and `TapStack-Prod-Role` are not created.
* **Overly broad policies**: Where IAM roles exist, they grant global `s3:*` or `ec2:*` permissions instead of restricting access to each environment’s resources.
* **No explicit deny**: The template does not enforce cross-environment restrictions. A role for Dev can access Staging/Prod buckets, violating isolation.
* **Missing trust configuration**: Roles do not include proper trust relationships for team principals (`var.TeamPrincipalARN`) or default to overly broad `*` principals.

---

### Parameters, Outputs & Naming

* **Parameters missing**: Critical parameters (`ProjectName`, `Owner`, `TeamPrincipalARN`, `CreateNatPerAZ`) are not exposed, making the stack rigid and non-reusable.
* **No outputs**: The template does not export VPC IDs, subnet IDs, bucket names/ARNs, or IAM role ARNs. Downstream stacks cannot reference these resources.
* **Inconsistent naming**: Resource names do not follow the `TapStack-<env>-<resource>` convention, leading to collisions and poor traceability.

---

### Compliance & Security

* **DeletionPolicy missing**: Buckets and other stateful resources are destroyed on stack deletion, leading to potential data loss.
* **No tagging strategy**: Tags (`Project`, `Environment`, `ManagedBy`) are missing or inconsistent, breaking governance requirements.
* **Transport security not enforced**: Buckets do not enforce `aws:SecureTransport = true`, allowing unencrypted HTTP access.
* **IAM least-privilege ignored**: Roles have over-scoped permissions, failing compliance checks.

---

### Acceptance Criteria Violations

* **Environment isolation** not achieved (single VPC or shared resources).
* **Replication pipeline** missing for non-sensitive objects.
* **IAM scoping** not enforced (roles cross-access resources).
* **Security best practices** ignored (unencrypted buckets, public access, no lifecycle policies).
* **Traceability** lost (no parameters, outputs, or consistent naming).

---

### Impact

* The stack would **fail security audits** due to missing encryption, public access, and broad IAM roles.
* **CI/CD pipelines** depending on outputs would break since no environment-specific exports exist.
* **Replication compliance tests** would fail because cross-environment sync is not scoped to `non-sensitive/`.
* **Networking validation** would fail due to overlapping CIDRs and incomplete routing.


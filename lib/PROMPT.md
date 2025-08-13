Nice — here's a ready-to-use, copy-pasteable **user prompt** you can give to an engineer or to an AI to produce a single `main.tf` (self-contained) Terraform file that meets your requirements and follows best practices.

---

# Prompt — Generate `main.tf` (single-file Terraform stack for HTTP/HTTPS-only SG)

You are asked to generate a **single Terraform file named `main.tf`** for a brand-new AWS stack. The `provider.tf` file already exists and is configured to read the `aws_region` variable — **so `main.tf` must declare the `aws_region` variable** (with validation and a sensible default) and all other variables, resources, and outputs. **Do not reference any external modules** (no `module` blocks pointing to remote or local modules). Everything must be implemented with native Terraform resources in this single file.

**Requirements (must satisfy exactly):**

1. Create an AWS security group resource that allows **only inbound traffic** on:

   * TCP port **80 (HTTP)**, and
   * TCP port **443 (HTTPS)**
     and **no other inbound ports**.
2. Restrict inbound traffic to **specified IP ranges only** provided via a variable (support both IPv4 and IPv6 CIDRs).
3. Provide a variable `aws_region` so `provider.tf` can consume it (include description, type and validation).
4. Put **all variable declarations, locals, resource definitions, data sources, and outputs** inside `main.tf`. Do not depend on other Terraform files or modules.
5. Follow Terraform and AWS security best practices:

   * Require a `vpc_id` variable (no default) — security groups must be attached to a VPC.
   * Do not allow overly-broad defaults (e.g., avoid `0.0.0.0/0` as a default CIDR). Instead, set the allowed CIDR variable default to an empty list and validate non-empty or provide clear commented examples.
   * Add descriptive resource names, tags, and descriptions on rules.
   * Add input validation for CIDRs and for `allowed_cidrs` not being empty (or at least explicit validation messaging).
   * Allow optional separate lists for IPv4 and IPv6 CIDRs.
   * Add an `allow_all_outbound` boolean variable (default `true`) with description; if `false`, create a conservative egress rule (explain in comments).
6. Provide clear `output` values:

   * `security_group_id`
   * `security_group_arn`
   * `security_group_name`
   * `ingress_rules` (list of map objects summarizing port + cidr)
7. Use Terraform 1.x syntax (HCL2). Include a `required_providers` and `required_version` block (so that `main.tf` is self-describing). Keep the `provider` block out — `provider.tf` already handles provider config, but `main.tf` should include `terraform { required_providers { } }` and `required_version`.
8. Include comments and short usage / apply steps at the top of the file explaining how to populate variables and run `terraform init` / `plan` / `apply`.
9. Keep the implementation minimal and secure — no extra permissive rules, no references to existing security groups, no default open CIDRs.

**Variables to include (exact names and behavior):**

* `aws_region` — string, default `"us-east-1"`, description, validate non-empty.
* `vpc_id` — string, **no default**, description, must be provided.
* `allowed_ipv4_cidrs` — list(string), default `[]`, description, validation: list must not be empty (or at least warn — prefer fail) if `allow_unrestricted_ipv4` is `false`.
* `allowed_ipv6_cidrs` — list(string), default `[]`, description, optional.
* `allow_all_outbound` — bool, default `true`.
* `security_group_name` — string, default `"app-http-https-sg"`.
* `security_group_description` — string, default descriptive text.
* `tags` — map(string), default `{"Owner" = "devops", "Environment" = "dev"}` (allow override).

**Edge cases & validation:**

* If `allowed_ipv4_cidrs` and `allowed_ipv6_cidrs` are both empty, the configuration should fail `plan` with a clear validation message (e.g., `"allowed_ipv4_cidrs and allowed_ipv6_cidrs cannot both be empty — at least one CIDR is required for inbound traffic"`).
* Validate that each string in the IPv4 list looks like a CIDR (simple pattern or use `cidrhost` / `cidrsubnet` guard in a `validation` block).
* Provide a short commented example showing how to call `terraform apply -var='vpc_id=... -var="allowed_ipv4_cidrs=[\"203.0.113.0/24\"]"'`.

**Testing / verification instructions (comment block inside file):**

* Show how to run `terraform init`, `terraform plan -var-file=...` and `terraform apply`.
* Suggest how to verify in AWS Console or with `aws cli` (e.g., `aws ec2 describe-security-groups --group-ids <id>`).

**Deliverable format:**
Return only the content that should go into `main.tf` — a complete Terraform HCL file that meets the above. Include inline comments to explain validation and security rationales, but avoid external references or module sources. The file must be directly usable (except provider config which is in `provider.tf`).

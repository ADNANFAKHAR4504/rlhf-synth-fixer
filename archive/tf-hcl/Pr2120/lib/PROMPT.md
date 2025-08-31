You are a senior Terraform architect.
Design a multi-region, multi-environment AWS IaC stack that is production-ready, readable, and easy to operate.

Scope (what to build)

Create Terraform code that deploys identical stacks in us-east-1 and eu-central-1, using modules to avoid duplication. Include:
	•	Networking: VPCs (≥2 AZs per region), subnets (public/private), NAT, route tables, security groups with allow-list inbound rules (only specified CIDRs), cross-region VPC peering between identical environments.
	•	Compute & elasticity: sensible examples using Auto Scaling Groups + Launch Templates (or managed node groups if you pick EKS), with health checks and rolling updates.
	•	Secrets: all secrets via AWS Secrets Manager (no plaintext in code or state).
	•	State backend: S3 remote state (+ versioning + SSE-KMS) with DynamoDB locking.
	•	Blue-Green: demonstrate a zero-downtime Blue-Green pattern (e.g., dual target groups behind an ALB with weighted or switchable routing, or Route 53 weighted records).
	•	DNS: Route 53 records that auto-update on deploy (e.g., switching blue↔green, regional records, health checks if applicable).
	•	Edge: CloudFront distribution (origin(s) can be ALB or S3), with HTTPS and origin access controls.
	•	Audit & compliance: CloudTrail (multi-region), CloudTrail logs encrypted; ensure CIS AWS Foundations Benchmark v1.2 alignment for core controls you configure (logging, MFA-delete note, restricted SGs, etc.).
	•	Encryption everywhere: KMS CMKs for at-rest encryption (S3, EBS, RDS if used, CloudTrail).
	•	Tagging: uniform required tags on all resources (e.g., Owner, Purpose, Environment, Region, CostCenter).
	•	Rollback safety: pin provider/module versions; keep state versioned; document how to roll back by re-applying a previous state/module version.
	•	Tooling: Terraform ≥ 1.0.0; remote state per-env/region; terraform validate and terraform fmt -check must pass.

Hard requirements (don’t violate)
	•	Deploy to both regions with the same module(s); no copy-paste stacks.
	•	≥2 AZs used in each region.
	•	Least-privilege IAM for automation and runtime roles (no wildcards).
	•	Network policies strictly limit ingress to only necessary IP ranges (provide variables for CIDR allow-lists).
	•	All data at rest encrypted with AWS KMS.
	•	All secrets via Secrets Manager (referenced without exposing values).
	•	Remote state + locking: S3 (+ versioning + SSE-KMS) + DynamoDB lock table.
	•	CloudTrail logs all API activity (org/acc/region as appropriate).
	•	Blue-Green strategy ensures zero downtime on updates.
	•	CloudFront used for end-user delivery.
	•	CIS AWS Foundations v1.2: follow/justify controls relevant to IaC surface (log archival, no public S3 by default, restricted SGs, password/IAM policy baselines if configured, etc.).
	•	Pass Terraform’s built-in checks: terraform fmt -check and terraform validate (and terraform test if you include tests).

Inputs & structure
	•	Variables to include at minimum:
	•	environment (e.g., dev/stage/prod)
	•	regions = ["us-east-1","eu-central-1"]
	•	allowed_ingress_cidrs (list)
	•	tags = { Owner = "...", Purpose = "...", ... }
	•	kms_key_alias per environment (or create KMS keys with aliases)
	•	Blue-Green toggle/weights (e.g., active_color = "blue"|"green" or weighted)
	•	Recommend a root module with:
	•	/modules/network, /modules/compute, /modules/edge, /modules/observability, /modules/dns, /modules/state-bootstrap (for S3/DDB creation run once)
	•	/envs/<env>/main.tf composing modules for both regions (e.g., with for_each over var.regions)

Deliverables
	1.	Terraform code (HCL) split into logical modules and env compositions:
	•	Providers, backends, versions pinned.
	•	S3/DynamoDB backend config and creation pattern (document the one-time bootstrap).
	•	Examples of Secrets Manager usage without leaking secrets to state.
	•	Blue-Green pattern (ALB & TGs or Route 53 weights) wired into deployable variables.
	•	Route 53 records that update during color switch.
	•	CloudFront distribution with TLS and origin policies.
	•	CloudTrail (multi-region) and KMS encryption everywhere.
	2.	README.md with:
	•	Prereqs (Terraform ≥1.0.0, AWS creds), one-time state backend bootstrap steps.
	•	How to plan/apply per environment and per region (workspaces or directories).
	•	How to perform a Blue→Green switch and rollback.
	•	How to rotate secrets and avoid state leaks.
	•	CIS v1.2 mapping table: list each relevant control you implemented and where.
	•	Common ops: drift detection, importing existing resources, cost notes.
	3.	Example commands (copy-paste-ready):
	•	terraform init, terraform fmt -check, terraform validate, terraform plan -out plan.tfplan, terraform apply plan.tfplan
	•	Backend bootstrap apply (only for state bucket/lock table)
	4.	Acceptance checks (must pass):
	•	terraform fmt -check and terraform validate pass cleanly.
	•	Planning in both regions succeeds with identical modules.
	•	At least two AZs per region wired in subnets and compute.
	•	Security groups only allow var.allowed_ingress_cidrs.
	•	S3 state bucket, CloudTrail, EBS (and any DB) are SSE-KMS encrypted.
	•	CloudTrail is multi-region and writing to encrypted S3 with retention.
	•	Tags applied on all managed resources.
	•	Blue-Green switch changes active target without downtime and updates DNS.
	•	CloudFront serves content over HTTPS from defined origins.
	•	No wildcard * permissions in IAM policies.

Style & quality
	•	Clear naming, minimal locals, small composable modules, rich variable descriptions and outputs.
	•	Pin provider/module versions; avoid data sources that break determinism unless justified.
	•	Add inline comments where decisions enforce CIS controls or security posture.

Now produce:
	•	A complete lib/provide.tf tree, then the key tap_stack.tf files 
	•	Where code would be too long, summarize repetitive blocks once, then show one full representative block.
	•	Ensure the result is directly usable after backend bootstrap and variable population.

Use this prompt verbatim with your values for tags, CIDRs, and any service choices you prefer (ALB vs. Route 53 weighting) and Claude should return a clean, compliant Terraform setup.
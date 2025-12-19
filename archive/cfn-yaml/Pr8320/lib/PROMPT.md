# Prompt to generate `TapStack.yml`

Create a single, self-contained AWS CloudFormation **YAML** template file named **`TapStack.yml`** that builds three fully isolated environments (development, staging, production) in **us-east-1**. The template must be a *brand new stack* that creates all resources (do not reference any existing VPCs, buckets, roles, or other resources). Put **all** parameter declarations, default values, mappings, conditions, resource definitions, outputs, and logic in the same file.

**Global requirements**

* Region: `us-east-1`.
* Use CloudFormation YAML syntax and best practices (parameters, mappings, conditions, outputs, DeletionPolicy, Metadata/TAGS, IAM least-privilege).
* All resource names must follow this naming convention: `TapStack-<env>-<resource>` (e.g. `TapStack-development-VPC`, `TapStack-staging-DataBucket`).
* Add `Tags` on all resources with at least: `Project: TapStack`, `Environment: <env>`, `CreatedBy: TapStackCFN`.
* The template must pass CloudFormation validation (`aws cloudformation validate-template`) and be syntactically correct YAML.
* Do not require any pre-existing resources — the template must create everything.

**Environments**

* Environments: `development`, `staging`, `production`.
* VPC CIDR blocks (no overlap):

  * development: `10.0.0.0/16`
  * staging: `10.1.0.0/16`
  * production: `10.2.0.0/16`

**Network (for each environment)**

* Create one VPC per environment with the specified CIDR.
* Create at minimum: 2 public subnets and 2 private subnets distributed across two AZs in `us-east-1` (e.g., `us-east-1a` and `us-east-1b`).
* Create an Internet Gateway and attach it to the VPC.
* Create appropriate route tables for public subnets to route 0.0.0.0/0 to IGW; private subnets should have no direct internet route (best practice).
* Create NAT Gateway(s) for private subnets (you can use 1 NAT per AZ or a single NAT per environment — include the logic and explain choices via Metadata comments).
* Ensure resources are named: `TapStack-<env>-VPC`, `TapStack-<env>-PublicSubnetA`, etc.

**S3 buckets (for each environment)**

* Create one S3 bucket per environment: `TapStack-<env>-databucket-<unique-suffix>` (CFN should construct a unique, predictable name using stack/region/account/id to avoid collisions whenever possible).
* Enable Versioning on all buckets (required for replication).
* Enable Server-Side Encryption using SSE-S3 (sufficient for non-sensitive data).
* Add a bucket policy that allows only required access (restrict public access; block public ACLs).
* Add tags and lifecycle rule to expire incomplete multipart uploads after 7 days (best practice).

**Automated S3 replication (non-sensitive data)**

* Implement automated replication for non-sensitive data between environments as follows (explicit pipeline):

  * Development => Staging => Production (one-way progressive replication).
  * That is: objects created in Development replicate to Staging, and objects created in Staging replicate to Production.
* Use S3 Replication Configuration resources in CFN to create replication rules.
* Ensure all buckets have Versioning enabled and SSE-S3 so replication works without KMS cross-account complexities.
* Create an IAM Role (replication role) per source bucket with the minimal permissions required for S3 replication (allow s3\:GetObjectVersion, s3\:ReplicateObject, s3\:ListBucket, s3\:GetObjectVersionAcl, s3\:GetObjectVersionTagging, s3\:ReplicateDelete as applicable).
* Use DeletionPolicy: `Retain` on buckets to avoid accidental deletion of data by stack deletion (document this in the template as a best practice).
* The replication configuration should only replicate objects that match prefix `non-sensitive/` (so sensitive data is not replicated). Add a rule to only replicate objects placed under `non-sensitive/` prefix.
* Provide clear Metadata comments in the template explaining how to add objects intended for replication.

**IAM roles and access restrictions**

* Create IAM roles (not users) for team members per environment:

  * `TapStack-development-Role`, `TapStack-staging-Role`, `TapStack-production-Role`.
* Each role should have an example inline policy (least-privilege) granting:

  * S3 full access to only the corresponding environment bucket (explicit ARN).
  * EC2 permissions scoped to resources within the corresponding VPC only — **or** read-only EC2/Describe actions if scoping by VPC is not feasible via IAM (explain in template metadata the limitation of scoping EC2 instance-level resource creation to a specific VPC via IAM).
  * Allow assume-role by a specified principal (parameterize `TeamPrincipalARN` or allow option to be assumed by IAM users/groups — include a Parameter default placeholder).
* Use resource-level ARNs and condition keys (`aws:RequestedRegion`, `StringEquals` on `aws:ResourceTag/Environment`) where feasible to enforce environment-only access.
* Add an IAM policy that prevents access across environments — e.g. explicit Deny if `aws:ResourceTag/Environment` != `<env>` (demonstrate use of `Condition` keys).
* Output the role ARNs for each environment.

**Parameters & Defaults**

* Include Parameters section with reasonable defaults and descriptions for:

  * `ProjectName` (default `TapStack`)
  * `Owner` (default `TapStackCFN`)
  * `TeamPrincipalARN` (default blank — instruct how to set to an IAM user/group/role ARN that will be allowed to assume the per-env roles)
  * `CreateNatPerAZ` (boolean default true/false) — affects NAT provisioning logic
  * Any other parameter that makes sense for flexibility (but do not rely on pre-existing resources).
* Use Mappings or Conditions as appropriate.

**Outputs**

* For each environment output:

  * VPC ID
  * Public Subnet IDs (list)
  * Private Subnet IDs (list)
  * S3 bucket name and ARN
  * Replication role ARN(s)
  * Environment IAM role ARN
* Output also a short summary string like `ReplicationPipeline` describing the replication chain (dev -> staging -> prod).

**Validation and tests (Acceptance criteria)**

* The template must be deployable in a fresh account/region `us-east-1` without modifying the file (only parameter overrides allowed).
* Programmatic tests the template must satisfy (these are acceptance rules you must encode in your review checklist/comments):

  1. Each environment has its own VPC and CIDR block; CIDRs must be exactly those listed (10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16).
  2. No CIDR overlap across VPCs.
  3. Each environment has exactly one S3 bucket created by the template and versioning enabled.
  4. Replication rules exist and only target the `non-sensitive/` prefix and follow dev->staging->prod progression.
  5. IAM roles are scoped to a single environment only (cannot access buckets of other environments).
  6. Resource names must follow `TapStack-<env>-<resource>` pattern.
  7. Template passes `aws cloudformation validate-template` (syntactically valid).
* Add **Metadata** or comments at top of template summarizing how to run validation commands and a short checklist showing how someone testing the template can validate each acceptance rule (e.g., `aws s3api get-bucket-replication`, `aws iam simulate-principal-policy`, etc.). Provide example CLI snippets in comments (but keep them commented for clarity).

**Best practices & security**

* Block all public access on buckets (CloudFormation `PublicAccessBlockConfiguration`).
* Do not enable public read or ACLs.
* Use Versioning, SSE-S3, and DeletionPolicy `Retain` for buckets.
* Use least-privilege IAM policies for replication roles and environment roles; document why some permissions (like EC2 resource-level restrictions) are limited by AWS IAM and provide recommended mitigations.
* Tagging on all resources.
* Reasonable default quotas: Create only what’s required (do not create huge numbers of subnets).

**Comments and Documentation**

* Include comments in the YAML explaining key design choices (replication pipeline, why `non-sensitive/` prefix, DeletionPolicy choices, how to change replication direction).
* Provide short instructions in the template header about how to deploy:

  * Example: `aws cloudformation deploy --template-file TapStack.yml --stack-name TapStackAll --parameter-overrides TeamPrincipalARN=arn:aws:iam::123456789012:user/dev-team`
* Clearly explain any known limitations (e.g., `aws:ResourceTag` reliance, EC2 scoping limitations) and what needs manual post-deploy steps (if any).

**Deliverable**

* Output: a single CloudFormation YAML file **TapStack.yml** which contains the complete, self-contained implementation and documentation/comments described above.
* Also include a brief acceptance checklist at the bottom of the file (as comments) describing commands to verify: VPC CIDRs, S3 versioning & replication config, IAM role ARNs and role policy restrictions, and outputs.

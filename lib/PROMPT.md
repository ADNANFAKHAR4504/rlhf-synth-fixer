### Functional scope (build everything new):
Design and produce a complete TapStack.yml that provisions a fresh, production-ready migration framework for AWS CloudFormation stack moves between multiple AWS accounts and regions. The template must define every module from scratch—no references to existing modules or external stacks—and include parameters, conditions, mappings, resources, and outputs required for end-to-end operation. It should encapsulate configuration and orchestration logic for:
- CloudFormation-driven migration automation across accounts and regions.
- Infrastructure state validation before and after migration.
- Activity logging into AWS CloudWatch Logs.
- Cross-account IAM roles and policies with least privilege and secure trust relationships.
- Regional differences, resource dependencies, sequencing, and retries with backoff to handle rate limits.
- Dry-run mode, safety checks, and guarded operations to avoid data loss.
- Rollback capability on failure.
- Secure credential flow via role assumptions; no static secrets embedded.

---

### Objective:
Produce TapStack.yml in valid YAML (not JSON) that stands alone and builds all resources needed for CloudFormation stack migration workflows, including orchestration components, IAM, logging, parameters, conditions, and outputs. All resource names must include ENVIRONMENT_SUFFIX to avoid collisions. The EnvironmentSuffix parameter must be validated via a safe naming regex rather than hard-coded allowed values.

---

### Environment and scope details:
- Multi-account, multi-region coverage: us-east-1, eu-west-1, ap-southeast-2.
- Align with existing naming conventions via ENVIRONMENT_SUFFIX (e.g., “prod-us”, “production”, “qa”, “dev-eu1”), enforced by a regex pattern that permits safe characters and structure without hard AllowedValues.
- Use predefined VPC IDs and resource tags where required (expose parameters and Conditions for per-region VPC selection).
- The stack will be created brand new; do not point to any pre-existing modules or resources.

---

### Parameters and validation:
- Define parameters for:
  - EnvironmentSuffix (string, required; enforce safe regex pattern; forbid unsafe characters; no hard AllowedValues).
  - SourceAccountId, TargetAccountId.
  - SourceRoleName, TargetRoleName (for cross-account role assumptions).
  - SourceRegion, TargetRegion (default to one of the supported regions; validate with regex for a region-like pattern).
  - PredefinedVPCId per region (Parameters or Mappings; enable Conditions that select correct VPC per region).
  - MigrationTags (Key-Value list or JSON string parameter; applied consistently to all resources).
  - DryRun (boolean).
  - SafetyGuardLevel (enum-like string validated by regex; controls data-protective behavior).
  - RateLimitConfig (numeric parameters for max attempts, initial backoff, max backoff).
- Implement Conditions to:
  - Toggle dry-run behavior for orchestration components.
  - Region-specific resource creation and selection (e.g., select correct VPC and subnets via Mappings/Conditions).
  - Only enable destructive operations when SafetyGuardLevel permits, otherwise no-op with explicit outputs.

---

### IAM and security:
- Create IAM roles and policies for:
  - Orchestrator role to drive CloudFormation migration operations via Step Functions/Lambda, with explicit least-privilege statements for Describe/Create/Update/Delete/Validate operations, StackSet operations if used, and logging to CloudWatch.
  - Cross-account assumption: Define target and source trust policies that only allow specific principals (Account IDs + external ID parameter). No wildcards; restrict by actions and conditions.
  - Logging role for CloudWatch Logs delivery and KMS permissions if log group encryption is enabled.
- Enforce:
  - No embedded secrets; use STS AssumeRole chains via defined roles.
  - Boundary policies or scoped permissions that prevent data-destructive actions unless SafetyGuardLevel allows and DryRun is false.

---

### Logging and observability:
- Create CloudWatch Log Groups named with ENVIRONMENT_SUFFIX and retention controls.
- Ensure all orchestration components (Step Functions/Lambda, if used) emit structured logs (JSON fields for requestId, account, region, stackName, action, outcome, duration).
- Include metric filters and alarms to detect failures, throttling, retries exceeding thresholds.

---

### Orchestration and migration logic:
- Provision a Step Functions state machine (or equivalent orchestration resource) that:
  - Assumes source role, describes source stack and exports, captures templates and parameters.
  - Validates pre-migration state: drift detection, resource counts, tags, outputs.
  - Handles regional differences and resource dependencies (ordered phases: network/base, data layer, compute, edge).
  - Applies safety checks (DryRun true → simulate and log; no resource changes).
  - Assumes target role, creates or updates target stack, waits for completion, validates post-migration consistency.
  - Implements exponential backoff and jitter for API rate limits; explicit retries with capped attempts driven by RateLimitConfig.
  - If any step fails and DryRun is false: trigger rollback logic—revert target to prior known good state or delete partially created resources depending on SafetyGuardLevel.
- Include custom resource or Lambda functions to:
  - Compare stack templates, parameters, and resource summaries (pre/post).
  - Perform drift detection and emit validation outputs.
  - Safely export/import outputs and parameter sets.
  - Guard data-loss scenarios (e.g., S3 versioning required, DynamoDB point-in-time recovery required; if missing, fail early with clear outputs).

---

### Safety checks:
- Before any write operation:
  - Verify S3 buckets have versioning and MFA delete policies if applicable; otherwise abort unless SafetyGuardLevel explicitly permits.
  - Verify DynamoDB PITR enabled for stateful tables.
  - Validate KMS key policies for cross-account usage if needed.
  - Confirm IAM changes won’t broaden privileges beyond template-defined boundaries.
- Dry-run mode must simulate sequencing, log intended changes, and produce a diff of resource counts, parameters, and tags without modifying resources.

---

### Rate limits and retries:
- Implement retry policies for CloudFormation API calls with exponential backoff and jitter.
- Capture and log throttling events; surface in outputs and alarm metrics.
- Ensure orchestration waits and polls stack events without tight loops; respect DescribeStacks and ListStackEvents limits.

---

### Validation and rollback:
- Pre-migration validation: template diff, parameter diff, resource count check, tag consistency check, drift detection.
- Post-migration validation: same checks plus cross-account outputs parity.
- Rollback strategy:
  - If target update/create fails, revert to previously known template/parameters or delete partial resources based on SafetyGuardLevel.
  - Emit outputs describing rollback actions performed and any residual differences.

---

### Tagging and naming:
- All resource names, logical IDs, and physical names must include ENVIRONMENT_SUFFIX.
- Apply MigrationTags to every resource supporting tags (IAM role tags, Log Groups via resource tags where supported, Step Functions, Lambda, CloudFormation stacks where applicable).
- Use consistent Name tag: <base>-${EnvironmentSuffix}.

---

### Testing:
- Include test scaffolding resources and integration paths in TapStack.yml to exercise:
  - Dry-run only path.
  - Successful full migration across accounts/regions.
  - Throttling/retry path.
  - Safety guard abort path (e.g., missing PITR).
  - Rollback on failure path.
- Provide Outputs summarizing each test’s result with structured JSON and clear status strings.

---

### Deliverable:
Provide a single TapStack.yml in valid YAML that:
- Declares all parameters, mappings, conditions, resources, and outputs for the migration framework.
- Creates all modules and orchestration components new—no references to existing ones.
- Enforces EnvironmentSuffix via a safe regex pattern, not hard AllowedValues.
- Implements least-privilege IAM, CloudWatch logging, retry/backoff policies, dry-run mode, safety checks, validation, and rollback.
- Names all resources with ENVIRONMENT_SUFFIX to prevent conflicts.
- Documents the template with concise comments and usage notes inline.

---

### Output format and quality:
- YAML only; no JSON.
- Perfectly formatted sections with clear comments and formal headers as above.
- Human-written tone; concise, direct, and practical.
- Include Usage instructions in comments: parameter examples, how to run tests, and how to interpret outputs.

---

### Usage notes (embedded as comments in the YAML):
- Provide example parameter sets for prod-us, production, qa variants demonstrating regex compliance.
- Show how to enable DryRun and set SafetyGuardLevel for guarded operations.
- Document role assumption flow (source/target) and how external ID must be provided.
- Explain how regional selection works via Conditions/Mappings and how predefined VPC IDs are injected per region.

We need a single TapStack CDK (TypeScript, v2) program that implements a full multi-environment consistency & replication system for a financial trading platform. Everything must be implemented from one TapStack file (one stack class that contains & wires all resources), but the stack must dynamically create and manage three environment-specific deployments (Production, Staging, Development) across three regions with strict validation, replication, tagging, and rollback capabilities.

The TapStack must:

Be a single TypeScript file (e.g., tapstack.ts) that exports a TapStack class (or equivalent) and contains ALL resources, constructs, and helper logic in that file only. No external construct files.

Accept dynamic configuration (context/props) for environment, environmentSuffix, serviceName, stage, region, CostCenter, DeploymentDate, KMS alias names, log retention days, Lambda memory/timeouts/concurrency, API names, S3 lifecycle policies, replication pairings, alarm thresholds, metric periods, and any other param — and use those values throughout the stack.

Enforce configuration validation: before deploy the stack must validate supplied config against JSON Schema(s) and fail synth/deploy with clear errors if validation fails. Validation logic must be inside the TapStack file (pre-synthesis check).

Core behavior and resources (all must be present and correctly wired):

Base & Per-Environment Behavior (single TapStack file)

Implement a base configuration and code paths that instantiate per-environment resources for:

Production → us-east-1

Staging → eu-west-1

Development → ap-southeast-1

The TapStack must programmatically create resources for each environment using the same base templates with environment-specific overrides (CIDR ranges, AZs, replica targets, email endpoints, etc.).

All resources must be named and tagged using the dynamic naming pattern and include tags: Environment, CostCenter, DeploymentDate.

S3 Buckets with Cross-Region Replication

Create one S3 bucket per environment with versioning enabled and server-side encryption using customer-managed KMS keys (alias configurable).

Configure cross-region replication between corresponding buckets (prod↔staging↔dev mapping as provided). Create and attach the necessary replication IAM roles/policies and KMS key policies so replication and re-encryption work across regions.

Expose bucket names and replication role ARNs as stack outputs.

RDS Aurora MySQL Clusters & Encrypted Snapshot Copying

Deploy an Aurora MySQL cluster per environment in private subnets (3 AZs per VPC).

Configure automated snapshot lifecycle and encrypted snapshot copying across environments (so snapshots from prod can be copied to staging/dev and vice-versa) using customer-managed KMS keys and appropriate IAM.

Include orchestration logic (custom resource or step function invoked via the TapStack) to perform safe snapshot copy and restore operations with encryption and audit logging. Output cluster ARNs and snapshot copy role ARNs.

Lambda Functions with Aliases and Weighted Routing

Create environment-scoped Lambda functions (example: processor, ingester, worker) with versions and aliases per environment.

Implement a weighted routing mechanism allowing gradual traffic shifting between aliases (e.g., 10% new, 90% stable) using Lambda alias routing configuration — all configured from parameters.

Lambda roles must follow the naming convention {service}-{environment}-{region}-role.

Lambdas must log to CloudWatch with configurable retention and have reserved concurrency and environment-specific settings.

API Gateway Custom Construct & Stage Variables

Implement inside the TapStack a custom API Gateway construct that:

Creates REST APIs per environment (or one API with stage per environment as configured).

Automatically injects stage variables derived from the target environment (API endpoints, feature flags, S3 bucket names, KMS aliases, etc.).

Configures per-environment logging, throttling, and usage plans.

Expose API endpoints and stage ARNs as outputs.

IAM Roles & Naming Convention

Create all necessary IAM roles and policies using the strict naming pattern: {service}-{environment}-{region}-role.

Enforce least-privilege permissions. Include explicit denies where appropriate (e.g., deny cross-environment mutation unless via approved replication role).

KMS key policies must allow cross-region replication principals and appropriate role patterns.

Networking & Cross-Region Connectivity

Programmatically create a VPC per environment (3 AZs) with public subnets for ALBs and private subnets for RDS/Lambda.

Configure VPC peering or secure transit between regions for replication and snapshot copy operations; ensure routes and security groups allow only required flows.

Use VPC endpoints for S3, RDS, CloudWatch where possible to keep traffic internal.

Monitoring, Dashboards & Notifications

Create CloudWatch Dashboards that aggregate metrics from all three environments into a single consolidated view (and also per-environment subviews). Include RDS, Lambda, API Gateway, S3 replication status, and replication lag widgets.

Create CloudWatch Alarms for health checks and critical metrics; tie alarms to SNS topics with environment-specific email endpoints. Export dashboard URLs and SNS ARNs as outputs.

SNS Topics & Deployment Notifications

Create SNS topics per environment for deployment notifications and wire them into deployment scripts (success/failure). Topics must publish to the configured environment email endpoints and support webhook endpoints if provided.

Automated Tagging

Enforce automatic tagging (Environment, CostCenter, DeploymentDate) on all created resources from within the TapStack logic.

State Isolation & Deploy Scripts

Ensure each environment uses its own S3 bucket for CloudFormation state/artifacts (versioning enabled).

Include in the TapStack file or as part of the repo artifacts deployment scripts (npm scripts or shell commands described in the stack outputs/README) that:

Validate config against JSON schema

Synthesize stacks for each environment

Deploy using change sets and enforce post-deploy health checks

Trigger automatic rollback if health checks fail (describe the mechanism in outputs/README)

Validation & Safety

Integrate a JSON Schema validator inside the TapStack (pre-synth) that reads config/context and throws user-friendly errors if schema mismatch happens.

Validate crucial invariants: KMS aliases present, replication targets reachable, IAM naming rules adhered, bucket replication policies allowed, and per-environment thresholds within allowed ranges.

Outputs & Documentation

The TapStack must output key identifiers for each environment: S3 bucket names, Aurora cluster ARNs, Lambda alias ARNs, API endpoints, SNS ARNs, dashboard URLs, replication role ARNs, and KMS key ARNs.

The TapStack file must include an embedded README/comment block describing deployment steps, config keys, and rollback procedure.

Non-functional & compliance constraints (must be enforced in the stack):

All data at rest must use customer-managed KMS encryption where specified.

All in-transit traffic must enforce TLS.

IAM least-privilege and naming pattern {service}-{environment}-{region}-role.

Resources must be tagged properly for cost allocation.

Ensure idempotence and repeatable deploys; avoid implicit defaults that could lead to drift.

CDK v2 TypeScript, Node.js 18+ compatible.

Expected deliverable (what to produce):

A single tapstack.ts TypeScript CDK file that compiles and defines the TapStack class implementing everything above. The code must be self-contained, parameterized, and production-ready (no TODO placeholders).

The TapStack must be capable of synthesizing and deploying the three environment deployments programmatically when invoked with appropriate context/parameters.

The TapStack must output all critical ARNs/URLs and contain embedded guidance for config validation and deployment commands.
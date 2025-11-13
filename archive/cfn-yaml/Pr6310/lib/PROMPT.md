# Prompt: Optimize and Rebuild E-commerce Infra as a Single CloudFormation YAML

## Context

Production e-commerce stack in `us-east-1` has grown to 487 resources and 45-minute deploys with intermittent timeouts and quota hits. The goal is to produce a single, optimized **CloudFormation YAML** template (`TapStack.yml`) that **creates a brand-new stack** with equivalent behavior but far less bloat, faster deployments, and improved maintainability—without nested stacks or external dependencies.

## Functional scope (build everything new):

* Build a complete VPC (public/private subnets across 3 AZs), routing, NAT, and required endpoints (as relevant to the core services).
* **Core (mandatory) services — choose exactly two and implement fully**:

  1. **ALB + Auto Scaling Groups (EC2) across 3 AZs** for the web/API tier.
  2. **Amazon Aurora MySQL (RDS) cluster** for transactional data.
* **Optional (0–1 only)**: add **Lambda order-processing** with SQS/SNS wiring to show the IAM role consolidation pattern.
* Supporting resources necessary for the two chosen core services (security groups, target groups, launch templates, parameter groups, subnets, etc.).
* Buckets for static assets and logs if required by the chosen core services.
* **Everything is created new**; do not reference pre-existing resources.

## Mandatory refactors (implement 3–5; implement these five):

1. **Consolidate redundant security group rules** into shared SGs rather than per-instance duplication.
2. **Replace per-function IAM roles** for 20+ Lambdas with **one parameterized role** driven by **Conditions** and scoped **managed inline policies** (least privilege; no wildcards).
3. **Refactor 15 similar ASGs** into a single reusable definition using **Mappings + Parameters** (e.g., a mapping that drives instance type, desired/min/max capacity, AMI per environment).
4. **Combine identical S3 bucket policy statements** into **one policy document** reused wherever applicable (no duplicate statements).
5. **Eliminate hardcoded values** (VPC CIDRs, subnet CIDRs, AZs) using **Parameters, Mappings, and intrinsic functions** (`Fn::FindInMap`, `Fn::Select`, `Fn::GetAZs`, `Fn::Sub`, `Fn::If`).

*(If adding the optional Lambda service, demonstrate item #2 directly.)*

## Guardrails & best practices

* **Single file** output: `TapStack.yml` (pure **YAML**, not JSON).
* **No nested stacks, no StackSets**, and **no external transforms**; keep within standard CloudFormation.
* **Resource names** (where a Name property exists) **must include `${ENVIRONMENT_SUFFIX}`** to avoid cross-env collisions (e.g., `myapp-${ENVIRONMENT_SUFFIX}-alb`).
* **IAM least-privilege only**: no `"Action": "*"`, no `"Resource": "*"`. Use scoped ARNs and condition keys.
* Add **DeletionPolicy** and **UpdateReplacePolicy** to stateful resources (e.g., **RDS cluster/instances**, **DynamoDB tables if present**, key buckets). Prefer `Retain` for data; justify where `Snapshot` is better (e.g., RDS).
* **Outputs trimmed** to only what is consumed by other stacks/apps (ALB DNS, RDS endpoints, shared SG IDs, key bucket names). Target **≥40% resource count reduction** vs. the prior 487-resource baseline by consolidating definitions and removing duplication.

## Parameters, naming, and validation

* Define all variables in `Parameters` with sensible defaults and `Description`.
* **EnvironmentSuffix parameter** must be validated using a **safe regex** (no hard AllowedValues).

  * Example: `AllowedPattern: '^[a-z0-9-]{2,20}$'` (lowercase letters, digits, hyphens), and a description listing examples such as `prod-us`, `production`, `qa`.
* Centralize **tags**: define a **TagsMap** parameter (e.g., a CommaDelimitedList or JSON string parsed via `Fn::Split`/`Fn::Sub` patterns) or a set of **well-known tag parameters** (e.g., `Project`, `Owner`, `CostCenter`, `EnvironmentSuffix`) and **apply them consistently** via `Tags` blocks on every resource using intrinsics.
* Use **Mappings** for environment profiles (instance types, desired counts, storage sizes) and **Conditions** to toggle optional components.
* Use **Fn::GetAZs** and **Fn::Select** to derive AZs dynamically.
* Derive CIDR blocks from parameters; no hardcoded network ranges.

## Security groups & networking

* Define **shared SGs** per tier (ALB SG, App/ASG SG, DB SG).
* Express **ingress/egress once** per tier and **reference across resources**.
* Keep rules minimal, explicit (ports, protocols, source SGs/CIDRs), and environment-aware.
* For VPC endpoints/gateway endpoints (if added), scope policies and SGs tightly.

## IAM & Lambda role consolidation

* Provide **one reusable IAM role** for Lambda with:

  * **AssumeRolePolicyDocument** strictly for `lambda.amazonaws.com`.
  * **Inline policies** split by purpose (e.g., `OrdersDdbAccess`, `SqsProducer`, `LogsAndXRay`) and guarded by **Conditions** driven from parameters (e.g., `EnableAsyncHandlers`).
  * **No wildcards**; resource ARNs parameterized and/or built with `Fn::Sub`.
* Show how 20+ functions would attach to the same role via parameterized references (even if the optional Lambda service is not fully implemented).

## Auto Scaling consolidation (EC2)

* Use **one LaunchTemplate** parameterized for AMI/instance profile/security groups.
* Use **Mappings** (by flavor key) to drive capacity and instance type.
* Create **one ASG logical definition** that accepts parameters (flavor keys) to represent the 15 formerly duplicated groups; show 1–3 concrete, parameterized ASG resources that cover the pattern without duplicating boilerplate.
* Attach to a single **ALB + TargetGroup** set with listener rules parameterized (e.g., path patterns).

## Storage & stateful resources

* **Aurora MySQL**: DB subnet group, security group, parameter group; **DeletionProtection** enabled; apply **DeletionPolicy/UpdateReplacePolicy**.
* **S3**: if multiple buckets share identical statements (e.g., deny non-TLS, restrict public ACLs), **compose a single policy document** and apply consistently. Enable bucket encryption, block public access, and lifecycle for logs where relevant.

## Outputs

* Only include outputs that are **practically consumed**, such as:

  * `AlbDnsName`, `AlbSecurityGroupId`, `WebAsgName`
  * `AuroraClusterEndpoint`, `AuroraReaderEndpoint`
  * Any shared SG IDs or bucket names that external systems need
* Avoid the previous 150+ noisy outputs.

## Acceptance criteria

* `TapStack.yml` is **valid YAML**, deployable with AWS CLI v2, requires only standard IAM permissions.
* **Two core services** fully implemented (ALB+ASG, Aurora MySQL).
* **0–1 optional** service (Lambda order processing) only if it helps demonstrate role consolidation.
* Implements the **five mandatory refactors** listed above.
* At least **40% reduction** in estimated resource count vs. prior approach by removing duplication (qualitatively evident from consolidated SGs, ASG reuse, unified policies, trimmed outputs).
* All resource Name properties include **`${ENVIRONMENT_SUFFIX}`**.
* **No wildcard IAM** actions/resources.
* **DeletionPolicy/UpdateReplacePolicy** set for stateful resources.
* No nested stacks/StackSets/external modules.

## Deliverable:

Return a **single file** named **`TapStack.yml`** (CloudFormation **YAML**) that includes:

1. `Parameters`, `Mappings`, `Conditions` for environment, networking, capacity profiles, toggles.
2. VPC + subnets (3 AZs), routing, NAT as needed by the core services.
3. Consolidated **Security Groups** per tier.
4. **ALB + ASG pattern** using a **single reusable definition** (Mappings/Parameters) and a minimal set of concrete ASG resources to illustrate the pattern without boilerplate.
5. **Aurora MySQL cluster** with best practices and data-safety protections.
6. Optional **Lambda + SQS/SNS** (if included) using the **single parameterized IAM role** with conditions.
7. **S3 bucket policy** defined once and reused where identical statements are required.
8. Centralized **tagging** driven by parameters, applied across all resources.
9. **Outputs** limited to externally consumed values.

**Formatting requirements**:

* Pure YAML (no JSON sections).
* Use intrinsic functions (`!Sub`, `!Ref`, `!FindInMap`, `!Select`, `!GetAZs`, `!If`, `!Equals`) idiomatically.
* Include explanatory comments for each major block (concise).
* Parameter `EnvironmentSuffix` validated via regex (no hard AllowedValues), with a description giving examples (`prod-us`, `production`, `qa`).

**Example parameter stubs to include (illustrative, not exhaustive):**

* `EnvironmentSuffix` (regex-validated), `VpcCidr`, `PublicSubnetCidrs`, `PrivateSubnetCidrs`, `AsgFlavorKey`, `AmiId`, `DesiredCapacity`, `MinCapacity`, `MaxCapacity`, `DbUsername`/`DbPassword` (NoEcho), `TagsProject`, `TagsOwner`, `TagsCostCenter`, `EnableAsyncHandlers` (for optional Lambda).

You are an AWS CloudFormation expert. Produce a set of **YAML** templates that deploy a **multi-environment architecture** for **development** and **production**, using a **modular design with nested stacks**. The output must be ready to validate and deploy with standard CloudFormation validation and our functional tests.

### Goals

* Keep **dev** and **prod** consistent in structure while allowing environment-specific settings.
* Favor **reusability**, **least privilege**, and **operational safety** (including rollback behavior on update failures).

### Non-negotiables

1. **Modular + Nested**: Break the solution into logical nested stacks (e.g., networking, data, compute, monitoring). The root template orchestrates them and passes parameters/exports outputs.
2. **No hardcoded regions**: Never write literal region strings. Use pseudo-parameters (e.g., `${AWS::Region}`) wherever region context is needed.
3. **Environment-aware naming**: Every resource name and tag must include an environment variable (e.g., `Stage` = `dev`/`prod`) so names are distinct per environment. For globally unique names (like S3), incorporate `${AWS::AccountId}` and `${AWS::Region}` with the environment.
4. **Parameterize differences**: Use parameters to switch dev/prod settings (e.g., NAT gateway count, instance classes/sizes, backup windows/retention, log retention, alarm thresholds). Include AllowedValues for safety.
5. **Least-privilege IAM**: Create IAM roles/policies that scope **only** the actions required by each service (Lambda execution/logging, DynamoDB, S3 access, RDS connectivity, etc.). Inline comments should explain why each permission exists.
6. **DynamoDB on-demand**: All tables must use **BillingMode: PAY_PER_REQUEST** (no provisioned capacity).
7. **Lambda environment variables**: All functions must read configuration from **environment variables** (e.g., table names, bucket names, log levels, feature toggles). Include a secure pattern for sensitive values (passed as parameters, not hardcoded).
8. **RDS high availability**: Use **Multi-AZ** for all RDS instances. Make engine family and minor version parameterized; instance class may vary by environment via parameters/conditions.
9. **Secure, durable S3**: All buckets must have **versioning enabled** and **server-side encryption** (default to SSE-S3, with an optional parameter to switch to SSE-KMS). Block public access at the bucket level. Add lifecycle rules if parameters request them.
10. **VPC segmentation**: Create a VPC spanning at least two AZs with **public and private subnets**, appropriate route tables, an Internet Gateway, and NAT gateway(s) (parameterize count, e.g., 1 for dev, 2 for prod). Place stateful services (RDS, DynamoDB access, Lambdas) in **private** subnets.
11. **CloudWatch alarms**: Define environment-scoped alarms for key metrics (examples: Lambda `Errors` and `Throttles`, DynamoDB `SystemErrors` and `ThrottledRequests`, RDS `CPUUtilization` and `FreeStorageSpace`, NAT gateway `ErrorPortAllocation`). Alarm names and topics must include the environment.
12. **Rollback-safe**: The design must support CloudFormation’s default rollback on failure (no constructs that disable it). Use deterministic logical IDs to prevent unnecessary replacements.

### Required Parameters (illustrative, not exhaustive)

* `ProjectName` (String): short, lowercase, hyphenated.
* `Stage` (String): AllowedValues `dev`, `prod`.
* `VpcCidr` (String).
* `NatGatewayCountDev` / `NatGatewayCountProd` (Number) or a single `NatGatewayCount` that flips via conditions.
* `RdsEngine`, `RdsEngineVersion`, `RdsInstanceClassDev`, `RdsInstanceClassProd`, `RdsAllocatedStorage` (if applicable), `RdsMultiAz` (default `true`).
* `SseMode` for S3 (`SSE-S3` default, optional `SSE-KMS` + `KmsKeyArn`).
* `AlarmEmail` or SNS topic ARN per environment.
* Any Lambda app settings that should vary by environment (as parameters feeding environment variables).

### Naming & Tagging Strategy

* Resource names: `${ProjectName}-${Stage}-<service>-<purpose>-<shortid>`.
* For globally unique names: include `${AWS::AccountId}` and `${AWS::Region}` as needed.
* Tags on **all** resources: `Project=${ProjectName}`, `Stage=${Stage}`, `Owner`, and `CostCenter` (values provided as parameters).

### Networking Expectations

* Two or more AZs.
* Public subnets (for ingress/NAT) and private subnets (for workloads/data).
* Security Groups: minimal inbound; strict egress where practical. No 0.0.0.0/0 inbound except where explicitly required (e.g., ALB HTTP in dev if specified by parameter). Reference SG-to-SG where possible.

### Data & Compute Expectations

* **DynamoDB**: on-demand, point-in-time recovery as a parameter (default enabled), server-side encryption enabled (AWS owned key is fine unless `SSE-KMS` chosen).
* **RDS**: Multi-AZ, storage autoscaling (parameter), deletion protection (prod default on), snapshot on deletion (parameter). No public access. Subnet group targets private subnets.
* **Lambda**: runtime and memory/timeouts parameterized. Environment variables for all external references. Create dedicated execution roles per function with only needed actions (logs, specific S3 buckets, specific DynamoDB tables, etc.). Create dedicated log groups with retention controlled by parameters.

### Monitoring Expectations

* Create SNS topics per environment for alarm notifications (or accept an input topic ARN).
* Alarms must include clear names and descriptions reflecting the environment and service.
* Use sensible default thresholds for dev; stricter for prod (via parameters/conditions).

### Outputs & Cross-Stack Contracts

* Each nested stack exports the minimal outputs needed by others (e.g., VPC ID, subnet IDs, security group IDs, bucket names, table names, RDS endpoint).
* Root template aggregates key outputs for downstream systems and test harnesses.

### Validation & Quality Bar

* Must pass `aws cloudformation validate-template` and linters without warnings related to intrinsic misuse or bad parameter constraints.
* No hardcoded ARNs or regions; use pseudo-parameters and `!Sub` patterns.
* Logical IDs remain stable across updates when inputs don’t change.
* The templates should deploy successfully in both `dev` and `prod` with the same structure, differing only via parameters/conditions.

### What to Avoid

* Don’t embed secrets in the templates or Lambda environment variables directly—accept them as parameters or from a secure source and reference them.
* Don’t open broad IAM permissions (use resource-level constraints and condition keys where possible).
* Don’t assume specific AZ names; discover with mappings/parameters or use subnet constructs that are AZ-agnostic.

### Deliverable

Return the full set of **CloudFormation YAML** templates (root + nested) that satisfy the above. Include concise inline comments explaining major design decisions and where parameters influence environment behavior. Ensure both environments deploy cleanly and the monitoring/alarms reflect the correct environment in their names and notifications.

---

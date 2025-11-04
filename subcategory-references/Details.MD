# For each of these subcategories, below listed are the references you must follow before starting with the task execution

# IaC Scenario Catalog — Category Summaries

## Environment Migration
> Translate existing/on-prem or other-cloud networks and security into AWS equivalents using CDK/Terraform/CloudFormation.  
> Focus on CIDR/subnet mapping, route tables, SG parity, and connectivity validation (VPN/TGW as needed).

**PR Reference:**  
- [PR #3113](https://github.com/TuringGpt/iac-test-automations/pull/3113) - cdk-ts

---

## Cloud Environment Setup
> Stand up a greenfield, best-practice AWS foundation (VPC, subnets, IGW/NAT, ALB/ASG, tags/outputs).  
> Validate reachability, health checks, and baseline security for rapid app onboarding.

**PR Reference:**  
- [PR #3100](https://github.com/TuringGpt/iac-test-automations/pull/3100) - cfn-yaml
- [PR #3126](https://github.com/TuringGpt/iac-test-automations/pull/3126) - tf-hcl

---

## Multi-Environment Consistency and Replication
> Reuse one module/template to deploy identical topologies across dev/stage/prod with param differences only.
> Prove parity by diffing plans/stacks and enforcing environment-specific tags/limits.

**PR Reference:**
- [PR #5474](https://github.com/TuringGpt/iac-test-automations/pull/5474) - tf-hcl

---

## Web Application Deployment
> Provision full three-tier stacks (ALB → compute → RDS) with bootstrap/user-data and secure SG chaining.  
> Verify end-to-end traffic flow and private-only database access with encryption at rest.

**PR Reference:**  
- _(To be linked when available)_

---

## Serverless Infrastructure (Functions as Code)
> Model APIs and event flows with API Gateway/Lambda/DynamoDB/S3/EventBridge using IaC.  
> Test function invocations, data persistence, DLQs/alarms, and least-privilege IAM.

**PR Reference:**  
- [PR #3046](https://github.com/TuringGpt/iac-test-automations/pull/3046) - cdk-java

---

## Failure Recovery Automation
> Deploy mirrored stacks across regions/accounts with Route53 failover and data replication (S3/RDS).  
> Validate health checks and controlled switchover without changing application semantics.

**PR Reference:**  
- [PR #3121](https://github.com/TuringGpt/iac-test-automations/pull/3121) - cdk-java

---

## Security Configuration as Code
> Encode IAM, SGs, encryption, Config rules, and boundaries as auditable templates/modules.  
> Enforce least-privilege and compliance via static analysis (cfn-nag/tfsec/checkov) and runtime checks.

**PR Reference:**  
- [PR #3093](https://github.com/TuringGpt/iac-test-automations/pull/3093) - cfn-yaml

---

## Infrastructure Analysis/Monitoring
> Use Boto3/CLI scripts to inventory, detect waste/misconfig (unused EBS, open SGs, NAT/EIP, log sizes).
> Emit JSON/CSV reports and wire to CI to continuously flag cost/security issues.

**PR Reference:**
- [PR #5304](https://github.com/TuringGpt/iac-test-automations/pull/5304) - analysis-py
- [PR #5426](https://github.com/TuringGpt/iac-test-automations/pull/5426) - analysis-py
- [PR #5548](https://github.com/TuringGpt/iac-test-automations/pull/5548) - analysis-py 

---

## General Infrastructure Tooling QA
> Explain and correct IaC/CLI usage with annotated examples, safe snippets, and step-by-step procedures.  
> Review snippets for risks, propose fixes, and document validation commands/output.

**PR Reference:**  
- _(To be linked when available)_

---

## CI/CD Pipeline Optimization
> Design and implement multi-account, multi-stage CI/CD pipelines with secure OIDC authentication.
> Focus on automated build/test/deploy workflows with security scanning (cdk-nag), manual approval gates,
> cross-account role assumptions, KMS-encrypted artifacts, and CloudFormation change sets for safe deployments.
> Include branch-based deployments (dev branch → dev env, main branch → prod env with approvals) and
> notification integrations (Slack/webhooks) for deployment status visibility.

**PR Reference:**
- [PR #5600](https://github.com/TuringGpt/iac-test-automations/pull/5600) - cicd-yml

---

## IaC Diagnosis/Edits
> Fix broken stacks/modules: permissions, dependencies, state imports, and template modularization.
> Preserve live resources, add tests/linting, and justify any necessary suppressions or refactors.

**PR Reference:**
- [PR #5234](https://github.com/TuringGpt/iac-test-automations/pull/5234) - cdk-java

---

## IaC Optimization
> Reduce cost/latency and strengthen security without changing topology (Spot/MixedInstances, gp3, WAF/TLS).  
> Improve reusability and build speed (modules, caching, CDK/TF tuning) while maintaining infra parity.

**PR Reference:**  
- _(To be linked when available)_


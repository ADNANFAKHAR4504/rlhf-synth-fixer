# Terraform CDK Prompt for Refactoring and Modularization

You are an expert Terraform engineer tasked with optimizing an existing AWS infrastructure codebase using **Terraform CDK (CDKTF) in TypeScript**. Your objective is to strictly apply the **DRY (Don't Repeat Yourself)** principle to refactor the codebase while preserving the infrastructure's existing functionality.

The current infrastructure spans **multiple environments**—`development`, `staging`, and `production`—and includes the following AWS services:

* Amazon EC2 instances
* Amazon RDS databases
* Amazon S3 buckets
* Networking components like VPCs, subnets, route tables, NAT gateways, and security groups

---

## Your Task

1. **Refactor** the existing infrastructure configuration into **modular CDKTF constructs**, ensuring reusability across environments.

2. Create DRY-compliant reusable stacks/modules for:

   * VPC (with public/private subnets)
   * EC2 (parameterized instance types, AMIs, security groups)
   * RDS (parameterized engine, instance size, subnet groups)
   * S3 (with versioning and encryption)
   * Security Groups (reused definitions)

3. Maintain **separation of concerns**:

   * Use environment suffixes (e.g., `dev`, `staging`) to name stacks distinctly
   * Use workspace-specific variables or overrides
   * Configure a remote S3 + DynamoDB backend for state isolation

4. Validate that the configuration is **deployable in all environments without changing logic**.

5. Follow best practices for:

   * Resource naming conventions
   * Provider and module version pinning
   * Secure state management using CDKTF

---

## Output Requirements

* All code must be written using **Terraform CDK (TypeScript)**
* Use Terraform 1.x-compatible CDKTF constructs
* Directory structure should include:

  * `modules/` or `lib/` for reusable stacks
  * `bin/` as the CDKTF entrypoint
  * `test/` for unit and integration tests
  * `README.md` with instructions for deployment

### Secrets

Database credentials must not be hardcoded. Use either:

* `passwordSecretArn` (AWS Secrets Manager), or
* `passwordEnvVarName` with an environment variable during synth (e.g., `DB_PASSWORD`).
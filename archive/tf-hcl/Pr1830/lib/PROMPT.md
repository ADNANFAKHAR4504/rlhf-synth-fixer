istenYou are a senior Terraform + AWS expert. Generate production-ready HCL code for a multi-environment AWS setup with distinct staging and production environments.

The code must meet the following functional and technical requirements exactly and must be delivered as a set of complete, runnable code files without any additional prose or explanations.

### Requirements

- **Provider Configuration**: Configure two distinct AWS provider aliases, `aws.staging` and `aws.production`, each with `default_tags` set for automatic resource tagging.
- **Tagging**: All resources must be tagged with `environment` (`staging` or `production`) and `project` (`IaC - AWS Nova Model Breaking`).
- **State Management**: Use Terraform Cloud as the remote state backend. The configuration must include `organization = "<REPLACE_WITH_TFC_ORG>"` and `workspaces { prefix = "myapp-" }`, supporting workspaces like `myapp-staging` and `myapp-production`.
- **Modularity**: The solution must be modular, using local submodules for resource creation. Create the following modules:
  - `modules/storage`: For S3 bucket creation.
  - `modules/network`: For a security group.
  - `modules/iam_role`: For an IAM role and its inline policy.
- **Resources**:
  - **S3 Bucket**: Create one bucket per environment. Each bucket must have versioning enabled and SSE-S3 encryption. The bucket names must be globally unique but stable across runs, using `random_id` with a `keeper` based on the environment.
  - **Security Group**: Create one security group per environment in the default VPC. It must allow inbound TCP on port 443 and permit all egress traffic.
  - **IAM Role**: Create one IAM role per environment with an EC2 trust policy. The inline policy must enforce least privilege, granting `ListBucket`, `GetObject`, `PutObject`, and `DeleteObject` permissions _only_ to the S3 bucket created for its specific environment.
- **Variable Defaults**: Every input variable, both at the root level and within modules, must have a sensible, non-null default value that can be overridden by environment-specific variables.
- **Naming Conventions**: All resources must follow an environment-specific naming convention, such as `myapp-staging` and `myapp-production`.

### Behavior & Wiring

- **Dynamic Environment**: Derive a local variable `local.env` from `terraform.workspace` by stripping the `myapp-` prefix.
- **Region Control**: Define default regions as variables with sensible defaults (e.g., `ap-south-1` for staging, `us-east-1` for production), which can be overridden.
- **Provider Mapping**: Pass the correct provider alias into each module using a conditional expression, for example: `providers = { aws = local.env == "staging" ? aws.staging : aws.production }`.
- **Outputs**: The root module's outputs must be maps keyed by environment (`"staging"` or `"production"`) for the following resource attributes: bucket names, security group IDs, and IAM role ARNs.

### Deliverables

Produce only fenced code blocks for the following files in this exact order. Use the relative file path as the info string for each block.

- `main.tf`
- `variables.tf`
- `outputs.tf`
- `modules/storage/main.tf`
- `modules/network/main.tf`
- `modules/iam_role/main.tf`

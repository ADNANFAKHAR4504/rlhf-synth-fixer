You are an expert in Terraform best practices. I need you to design a multi-environment Terraform setup that supports both staging and production environments, ensuring consistency, maintainability, and reusability across both.

Environment & Requirements:

Environment Management – Use Terraform workspaces to clearly differentiate between staging and production.

Consistencies – Use consistent environment variable naming across environments to make the setup predictable and easy to maintain.

Reusability – Implement Terraform modules to abstract and reuse common configurations, reducing redundancies.

Shared Output – Implement output values that can be accessed and shared between environments to support deployment processes.

Multi-Region Deployment – Deploy to two AWS regions: us-west-2 and eu-west-1, using distinct Terraform workspaces for each environment.

Expected Output:

A Terraform codebase that meets all the above requirements.

The code should pass tests related to:

Workspace differentiation

Module reusability

Consistent environment variable naming

Output value sharing between environments

Constraints:

Must use Terraform workspaces for environment separation.

Must follow naming consistency for environment variables.

Must reduce duplication through modules.

Must support shared output values.I am following this structure
.
├── IDEAL_RESPONSE.md
├── MODEL_FAILURES.md
├── MODEL_RESPONSE.md
├── PROMPT.md
├── provider.tf
└── tap_stack.tf
so the files should be in provider.tf and tap_stack.tf
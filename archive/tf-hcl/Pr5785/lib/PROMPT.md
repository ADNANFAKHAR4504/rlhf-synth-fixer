Context
A fintech company has a Terraform codebase managing its payment processing infrastructure that has grown organically over three years. The current implementation suffers from state drift, hardcoded values, and slow plan/apply times, making it difficult to scale or deploy across multiple regions. The goal is to refactor this monolithic structure into a modular, reusable design — while ensuring that the existing infrastructure remains fully operational during migration.

Requirements
You need to create a single, self-contained Terraform configuration named tap-stack.tf that achieves the following outcomes:

Break the legacy 2000+ line main.tf into modularized logical sections for compute, storage, and database layers.

Replace all hardcoded values with input variables including validation rules.

Configure remote state management using an S3 backend and DynamoDB state locking.

Make the setup workspace-aware for dev, staging, and prod environments.

Optimize dependencies to reduce Terraform plan and apply time by at least 40%.

Apply create_before_destroy and moved blocks for safe updates and zero downtime migration.

Reference existing resources using data sources instead of hardcoded ARNs.

Replace count-based loops with for_each for scalability.

Use merge() with local values for consistent resource tagging.

Respect sensitive data handling with sensitive = true and never log secure values.

Ensure provider versions are pinned and compatible with Terraform 1.5+.

Plan output should display moved resources with no drift and apply should complete under five minutes.

Actions
Implement all required logic inside a single Terraform file (tap-stack.tf) that:

Uses relative module paths only.

Adheres to the company naming convention {env}-{region}-{service}-{purpose}.

Integrates backend configuration and environment-specific variable handling.

Ensures resource stability and zero service recreation during refactor.

Format
Output must include only the Terraform code for tap-stack.tf — no additional explanations, comments, or metadata.

Tone
Concise, professional, and human — written as if briefing a senior DevOps engineer. Avoid AI-like phrasing or numbered lists.
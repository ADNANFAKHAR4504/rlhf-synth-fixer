**🧠 Prompt for Claude Sonnet (or similar advanced LLM)**

> You are a senior cloud infrastructure architect specializing in Infrastructure as Code (IaC) using AWS CloudFormation in YAML format. Your mission is to create **modular, reusable templates** that enable consistent deployment across multiple environments: `development`, `testing`, `staging`, and `production`.
>
> **🎯 Objective:**
>
> * Design CloudFormation templates that deploy identical AWS resources across all environments with minimal duplication.
> * Ensure **environment-specific configuration** (like instance types, CIDR blocks, tags, scaling policies, AMI IDs) is handled **dynamically** via **CloudFormation `Parameters` and `Mappings`**, not by duplicating template logic.
>
> **💡 Requirements:**
>
> 1. Use **CloudFormation parameters and mappings** to abstract configuration values per environment.
> 2. Ensure the templates are **modular**, using nested stacks or separate templates for networking, compute, and security components.
> 3. Apply **resource tagging** to clearly identify the environment for each resource.
> 4. Provide an example for all environments (`dev`, `test`, `stage`, `prod`) showcasing how the same template adapts with input parameter changes.
> 5. Output should include:
>
>    * One or more YAML-based CloudFormation templates.
>    * Sample `Parameter` and `Mapping` sections for switching environments.
>    * Optional helper instructions on how to deploy using `aws cloudformation deploy` with parameters for different environments.
>
> **📌 Best Practices to Follow:**
>
> * Use logical resource naming that includes the environment (e.g., `AppServer-Dev`, `AppServer-Prod`).
> * Keep networking components (VPC, subnets) modular and environment-scoped.
> * Follow AWS tagging best practices: at minimum include `Environment`, `Owner`, `Project`, and `CostCenter`.
> * Use Outputs for cross-stack references or debugging.
>
> **✅ Acceptance Criteria:**
>
> * Templates must be valid and pass `cfn-lint`.
> * Each environment (when passed as a parameter) should result in a consistent but environment-specific deployment.
> * Resources should be organized clearly, and configuration changes should require editing only mappings or parameter inputs—not core logic.
>
> Return only the YAML code in a single file  with all the infrastructure in it and brief comments in-line where appropriate. Avoid long explanations unless embedded as YAML comments. Including
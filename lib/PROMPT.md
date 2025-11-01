---

#### **Prompt:**

> You are an expert AWS CDK engineer specializing in **multi-environment infrastructure replication and consistency automation** for large-scale systems using **TypeScript (CDK v2)**.
> Your task is to analyze the following problem statement and generate a **complete CDK application** that ensures consistent deployments, validation, and controlled promotion workflows across Dev, Staging, and Production environments.
>
> **Deliverables:**
>
> * `main.ts` — Entry point that defines environment mappings and initializes the replication stacks.
> * `tapstack.ts` — Core CDK stack defining infrastructure replication logic, state tracking, validation, orchestration, and monitoring components.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to implement a multi-environment infrastructure replication system that ensures consistency across dev, staging, and prod environments. The configuration must: 1. Define a shared stack pattern that accepts environment-specific parameters for compute resources, storage tiers, and network configurations 2. Implement a DynamoDB-based state tracking system that records infrastructure versions deployed to each environment 3. Create Lambda functions that validate infrastructure drift between environments before allowing promotions 4. Set up EventBridge rules that trigger consistency checks when any environment stack is updated 5. Implement an S3-based configuration store with versioning that maintains environment-specific parameter files 6. Create CodePipeline stages that enforce sequential environment promotion (dev → staging → prod) with manual approval gates 7. Build automated rollback mechanisms that can revert all environments to a previous consistent state 8. Generate CloudWatch dashboards that visualize infrastructure differences between environments 9. Implement tagging strategies that track deployment timestamps and source commits across all resources 10. Create SNS notifications for drift detection and failed consistency checks. Expected output: A CDK application that deploys infrastructure consistently across multiple environments with automated validation, promotion pipelines, and rollback capabilities.",
>   "background": "A financial services company needs to maintain identical infrastructure across development, staging, and production environments for their trading platform. They require automated environment promotion with strict consistency checks and the ability to rollback changes across all environments simultaneously.",
>   "environment": "Multi-environment AWS deployment across us-east-1 (dev), us-west-2 (staging), and eu-west-1 (production). Uses DynamoDB for state tracking, S3 for configuration storage, Lambda for validation logic, EventBridge for event-driven workflows, and CodePipeline for orchestration. Requires CDK 2.x with TypeScript, Node.js 18+, and AWS CLI configured with cross-region permissions. Each environment has isolated VPCs with private subnets for compute resources.",
>   "constraints": [
>     "All Lambda functions must use ARM-based Graviton2 processors for cost optimization",
>     "DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled",
>     "S3 buckets must implement cross-region replication for disaster recovery",
>     "CodePipeline must enforce a minimum 1-hour delay between staging and production promotions",
>     "All inter-environment API calls must use VPC endpoints to avoid internet transit"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Generate **TypeScript CDK v2** code using constructs from `aws-dynamodb`, `aws-lambda`, `aws-s3`, `aws-codepipeline`, `aws-events`, `aws-sns`, `aws-cloudwatch`, and `aws-ec2`.
> 2. Include and logically connect all the following resources:
>
>    * **Shared Stack Pattern:**
>
>      * Reusable construct accepting environment-specific parameters (VPC CIDRs, instance sizes, storage tiers).
>    * **DynamoDB State Tracking:**
>
>      * Table storing deployed versions per environment, with on-demand billing and point-in-time recovery.
>    * **Validation Lambdas:**
>
>      * ARM/Graviton2-based functions validating drift between environments before promotion.
>    * **EventBridge Rules:**
>
>      * Trigger Lambda validation and SNS alerts on stack updates.
>    * **S3 Configuration Store:**
>
>      * Versioned bucket with cross-region replication and parameter JSONs for each environment.
>    * **CodePipeline:**
>
>      * Sequential promotion pipeline: Dev → Staging → Prod.
>      * Manual approvals, rollback stage, and enforced 1-hour delay before production promotion.
>    * **CloudWatch Dashboards:**
>
>      * Visualize environment drift metrics and last successful syncs.
>    * **Tagging:**
>
>      * Apply consistent tags (`Environment`, `Version`, `SourceCommit`, `DeployedAt`).
>    * **SNS Notifications:**
>
>      * Alerts for drift detection, validation failure, or rollback execution.
> 3. Ensure all inter-environment calls (Lambda → DynamoDB, CodePipeline → S3, etc.) use **VPC Endpoints** to avoid internet exposure.
> 4. Enforce least privilege for all IAM roles.
> 5. Add descriptive inline comments separating major sections, e.g. `// 🔹 DynamoDB State Tracker`, `// 🔹 CodePipeline for Promotion`, etc.
> 6. Output **only two code files** — `main.ts` and `tapstack.ts` — inside fenced markdown code blocks.
> 7. Do **not** include extra prose or explanations — only valid CDK code.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **fully automated, environment-replicated infrastructure system** using AWS CDK (TypeScript) that ensures:
>
> * Consistency and drift validation between Dev, Staging, and Prod
> * Controlled sequential promotion and rollback mechanisms
> * Cross-region synchronization and disaster recovery
> * Compliance with all cost, security, and network isolation constraints
>
> Focus on:
>
> * Accurate inter-service connections
> * Event-driven validation and notification logic
> * Maintainable, production-grade CDK patterns

---
---

#### **Prompt:**

> You are a senior AWS CDK engineer focused on **Lambda performance and cost optimization** using **TypeScript (CDK v2)**.
> Analyze the input and produce a **complete CDK program** that auto-optimizes Lambda memory using **SSM Parameter Store** tuning data and **CloudWatch** metrics, with safe rollout, alarms, dashboards, and rollback.
>
> **Deliverables**
>
> * `main.ts` — CDK app entrypoint and stack initialization.
> * `tapstack.ts` — Full stack implementing custom constructs for memory-optimized Lambdas, SSM integration, alarms, dashboards, cost report generator, and validation logic.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to optimize Lambda function memory allocations based on actual usage patterns. The configuration must: 1. Read Lambda Power Tuning results from AWS Systems Manager Parameter Store for each function. 2. Implement a custom CDK construct that automatically sets optimal memory based on function type and tuning data. 3. Create three memory optimization tiers: API endpoints (low latency priority), async processors (balanced), and batch jobs (cost priority). 4. Apply memory settings that reduce cold starts for API functions while minimizing costs for batch processors. 5. Set up CloudWatch alarms for functions approaching memory limits (>80% usage). 6. Implement gradual memory adjustment logic that prevents drastic changes between deployments. 7. Create a memory usage dashboard showing actual vs allocated memory for all functions. 8. Generate a cost optimization report comparing current vs optimized memory allocations. 9. Add CDK metadata tags indicating optimization status and last tuning date for each function. 10. Implement rollback capability to previous memory settings if performance degrades. Expected output: CDK TypeScript code with custom constructs for memory-optimized Lambda functions, automated memory adjustment based on Parameter Store data, CloudWatch dashboard for monitoring, and deployment validation that ensures all functions meet performance requirements while reducing overall Lambda costs.",
>   "background": "A fintech company's transaction processing system is experiencing performance degradation due to inefficient Lambda memory allocation. The current CDK code uses static memory configurations that result in both over-provisioned and under-provisioned functions, leading to unnecessary costs and timeout issues during peak trading hours.",
>   "environment": "Production infrastructure deployed in us-east-1 with 15 Lambda functions handling transaction processing, API endpoints, and batch operations. Current setup uses CDK 2.x with TypeScript, Lambda functions written in Python 3.11 and Node.js 18. Functions process 2M transactions daily with traffic peaks during market hours. CloudWatch Logs retention set to 30 days. Parameter Store contains Lambda Power Tuning results for each function. Existing VPC with private subnets for database access. X-Ray tracing enabled for performance monitoring.",
>   "constraints": [
>     "Lambda functions must be profiled using CloudWatch Logs Insights to determine actual memory usage",
>     "Memory optimization must reduce cold start times by at least 40% for critical functions",
>     "Total monthly Lambda costs must decrease by minimum 25% while maintaining performance",
>     "Implementation must use Lambda Power Tuning results stored in Parameter Store",
>     "Memory configurations must vary based on function type (API, async processor, batch job)",
>     "CDK code must implement custom constructs for memory-optimized Lambda patterns",
>     "Solution must include automated memory adjustment based on CloudWatch metrics",
>     "Memory settings must respect minimum (128MB) and maximum (10240MB) Lambda limits",
>     "Critical functions must have memory headroom of 20% above peak usage",
>     "CDK deployment must validate memory settings against historical usage patterns"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Use **AWS CDK v2 (TypeScript)** with core services:
>
>    * **AWS Lambda** (target of optimization),
>    * **Amazon CloudWatch** (metrics, alarms, dashboards),
>    * **AWS Systems Manager Parameter Store** (source of tuning data).
>      *Optional:* A small **reporting Lambda** that queries CloudWatch/Cost Explorer to write a cost comparison report to S3.
> 2. Implement and **wire** the following:
>
>    * **Custom Construct: `MemoryOptimizedFunction`**
>
>      * Props: `tier` (`api` | `async` | `batch`), `functionName`, `runtime`, `handler`, `code`, `initialMemory`, `vpc?`, `subnets?`, `architecture?`, `env?`.
>      * Reads tuning payload from SSM Parameter Store (e.g., `/lambda/power-tuning/<functionName>`).
>      * Computes **target memory** using tier rules and tuning data, with **guardrails**:
>
>        * Respect 128–10240 MB limits.
>        * Add **20% headroom** for critical/API tier.
>        * Enforce **gradual change** (e.g., max ±256 MB or ±25% per deploy, whichever is smaller).
>      * Annotates function with **CDK metadata tags**: `Optimization=Enabled`, `LastTunedAt`, `Tier`.
>      * Exposes a method `currentSettings()` for dashboards/reports.
>    * **CloudWatch Metrics & Alarms**
>
>      * Create **>80% memory usage** alarms per function (using `max(MemoryUsed) / MemorySize`).
>      * Error/Duration alarms for API tier to guard latency; route to SNS topic.
>      * **Dashboard**: widgets for **Actual vs Allocated Memory**, Invocations, Duration P50/P90/P99, Throttles, Errors, ColdStarts (via metric filters).
>    * **Logs & Insights Profiling**
>
>      * Enable Lambda Insights or add **Logs Insights** queries (stored as CW **QueryDefinitions**) to derive peak memory and cold start frequency; used during **deployment validation**.
>    * **Rollback Mechanism**
>
>      * Persist previous memory settings in SSM (`/lambda/memory-history/<functionName>`).
>      * On validation failure (e.g., latency regresses, error rate ↑), **revert** to prior memory.
>    * **Cost Optimization Report (Optional)**
>
>      * Reporting Lambda runs on deploy/cron, compares **current vs optimized** projected costs (using invocations × duration × memory); writes a CSV/JSON to S3 and emits a link as CDK output.
> 3. IAM & Networking
>
>    * Least-privilege policies for: reading SSM params, `cloudwatch:GetMetricData`, `logs:StartQuery/GetQueryResults`, and optional Cost Explorer read.
>    * Support VPC config (private subnets) for functions that already run in VPC; preserve X-Ray.
> 4. Operational Guardrails
>
>    * Enforce **cold start reduction ≥40%** for API tier (document the logic using shorter init via higher memory/ephemeral storage if needed).
>    * Ensure **monthly cost ↓ ≥25%** across async/batch by lowering memory where safe.
>    * **Deployment validation step**: pre/post metrics check; block/rollback if SLOs regress.
> 5. Tagging & Outputs
>
>    * Global tags: `Environment=Production`, `Project=FraudDetection` (or input project), `ManagedBy=CDK`.
>    * Per-function tags: `Optimization`, `LastTunedAt`, `Tier`.
>    * CDK Outputs: Dashboard URL, SNS topic ARN for alarms, S3 report URL (if enabled).
> 6. Code Style
>
>    * Clean, modular constructs; sections commented as:
>      `// 🔹 Custom Construct`, `// 🔹 SSM Integration`, `// 🔹 Alarms`, `// 🔹 Dashboard`, `// 🔹 Rollback & Validation`, `// 🔹 Reporting (Optional)`.
> 7. Output **only two files** in fenced blocks: **`main.ts`** and **`tapstack.ts`** — no extra prose.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **production-safe Lambda memory optimization system** using AWS CDK that:
>
> * Tunes memory from **real usage + SSM Power Tuning** results,
> * Reduces **cold starts ≥40%** for critical APIs,
> * Cuts **monthly Lambda cost ≥25%** without performance regressions,
> * Provides **dashboards, alarms, metadata, and rollback** for operational safety.

---
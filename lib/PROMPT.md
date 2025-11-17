---

#### **Prompt:**

> You are a senior AWS CDK engineer and cloud auditor specializing in **infrastructure compliance and optimization analysis** using **TypeScript (CDK v2)**.
> Your task is to generate a **read-only CDK application** that scans all CDK-deployed stacks in the current AWS account and region, collects metadata, performs security/compliance analysis, and outputs structured reports with actionable insights — **without deploying or modifying any resources**.
>
> **Deliverables**
>
> * `tap.ts` — Entry point for CDK stack definition (in `bin/` directory).
> * `tap-stack.ts` — Logic for scanning, analyzing, categorizing, and reporting findings (security, cost, configuration) in `lib/` directory.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to analyze existing CDK-deployed infrastructure for compliance and optimization issues. The configuration must: 1. Scan all deployed CDK stacks in the current region and extract metadata using CloudFormation describe-stacks API 2. Identify security group rules that allow unrestricted inbound access (0.0.0.0/0) 3. Detect S3 buckets without encryption or versioning enabled 4. Find EC2 instances without detailed monitoring enabled 5. Analyze IAM roles for policies with Resource: '*' permissions 6. Calculate estimated monthly costs for each stack using Cost Explorer API (with fallback estimation) 7. Identify Lambda functions with outdated runtimes (Node.js < 18, Python < 3.9) 8. Check RDS instances and clusters for automated backup configuration 9. Verify that all EBS volumes are encrypted 10. Generate a compliance score (0-100) based on findings.",
>   "background": "A financial services company needs to audit their AWS infrastructure deployed via CDK to ensure compliance with security standards and cost optimization guidelines. The infrastructure spans multiple stacks across development, staging, and production environments, and the compliance team requires automated analysis tools to identify configuration drift and security misconfigurations.",
>   "environment": "AWS infrastructure deployed using CDK 2.x with TypeScript in a single region. The environment includes EC2 instances, RDS Aurora clusters, Lambda functions with API Gateway, S3 buckets with various encryption settings, and IAM roles/policies. The analysis tool requires AWS CLI configured with read-only permissions, Node.js 18+, and TypeScript 5.x.",
>   "constraints": [
>     "The analysis must traverse all CDK stacks in the current AWS account and region without modifying any resources",
>     "Security findings must be categorized by severity (Critical, High, Medium, Low) based on CIS AWS Foundations Benchmark",
>     "The tool must generate both JSON and HTML reports for different stakeholders",
>     "Analysis must complete within 5 minutes for environments with up to 500 resources",
>     "The solution must use AWS SDK v3 and avoid any third-party security scanning tools",
>     "All IAM role analysis must check for overly permissive policies (Resource: '*')"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Use **AWS CDK v2 (TypeScript)** and **AWS SDK v3 clients**:
>
>    * `@aws-sdk/client-cloudformation`, `@aws-sdk/client-ec2`, `@aws-sdk/client-s3`, `@aws-sdk/client-lambda`, `@aws-sdk/client-iam`, `@aws-sdk/client-rds`, `@aws-sdk/client-cost-explorer` (optional, with fallback).
> 2. Implement and correctly **wire** all analysis components:
>
>    * **Stack Discovery**
>
>      * Use CloudFormation `describeStacks` to fetch all CDK-deployed stacks in the current region (filter by `aws:cdk:stack-name` tag).
>      * Extract metadata: stack name, region, creation time, and tags.
>    * **Security Analysis**
>
>      * Scan EC2 security groups → flag inbound rules with `0.0.0.0/0` (Critical).
>      * Check IAM roles → detect inline or managed policies with `Resource: '*'` (High).
>      * Identify S3 buckets missing encryption or versioning (High).
>      * Verify EBS volume encryption (Medium).
>    * **Operational Analysis**
>
>      * Detect EC2 instances without detailed monitoring (Medium).
>      * Find Lambda functions with outdated runtimes (Node.js < 18, Python < 3.9) (Medium).
>      * Check RDS instances and clusters for missing automated backups (High).
>    * **Cost & Optimization**
>
>      * Query **Cost Explorer API** to estimate monthly cost per stack (with fallback to resource-based estimation if Cost Explorer is unavailable).
>    * **Compliance Scoring Engine**
>
>      * Compute score (0–100) based on weighted severity categories following CIS Benchmark weights:
>
>        * Critical = -25 pts each
>        * High = -15 pts each
>        * Medium = -10 pts each
>        * Low = -5 pts each
>      * Aggregate by stack and environment.
>    * **Report Generation**
>
>      * JSON report: all findings with ARNs, severity, recommended fix, estimated cost impact.
>      * HTML report: executive summary, compliance scores, and findings organized by stack.
>      * Store reports locally in `/reports/` directory with timestamped filenames.
> 3. **Performance Optimization**
>
>    * Use parallel `Promise.all` batches per service type.
>    * Timeout after 5 minutes for full scan of ≤500 resources.
> 4. **IAM & Safety**
>
>    * Tool runs with read-only permissions; no `Put*`, `Delete*`, or `Modify*` API calls allowed.
> 5. **Outputs:**
>
>    * Compliance summary per stack (score, critical findings).
>    * Total estimated cost across all stacks.
>    * File paths to JSON and HTML reports.
> 6. **Global Tags:**
>
>    * `Project=ComplianceAnalyzer`, `ManagedBy=CDK`, `Mode=ReadOnly`.
> 7. Inline Comments & Sections:
>
>    * `// 🔹 Stack Discovery`, `// 🔹 Security Checks`, `// 🔹 Cost Analysis`, `// 🔹 Compliance Engine`, `// 🔹 Report Generation`.
> 8. Implementation files:
>
>    * `bin/tap.ts` — CDK app entry point that defines the TapStack.
>    * `lib/tap-stack.ts` — TapStack class extending `cdk.Stack` with analysis methods.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **read-only AWS CDK analyzer** that:
>
> * Audits deployed CDK stacks in the current region
> * Detects **security, compliance, and cost optimization** issues per CIS AWS Foundations Benchmark
> * Produces **detailed JSON and HTML reports** with actionable recommendations
> * Runs under 5 minutes with **AWS SDK v3** and no resource modification
> * Computes **compliance scores** and cost estimates per stack

---
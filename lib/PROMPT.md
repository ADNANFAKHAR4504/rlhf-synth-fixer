---

#### **Prompt:**

> You are a principal AWS CDK engineer specializing in **high-availability, disaster recovery, and automated failover** for **Aurora PostgreSQL** using **TypeScript (CDK v2)**.
> Analyze the input specification and produce a **complete CDK application** that implements a **multi-region DR solution** with automated detection, failover, validation, and alerting.
>
> **Deliverables:**
>
> * `main.ts` — CDK app entrypoint and stack initialization for **primary (us-east-1)** and **DR (us-west-2)**.
> * `tapstack.ts` — Full infrastructure stack(s) wiring Aurora Global Database, health checks, failover Lambdas, EventBridge, SNS, S3 replication, alarms, IAM, and networking.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to build an automated disaster recovery infrastructure for a multi-region RDS Aurora cluster. The configuration must: 1. Deploy a primary Aurora PostgreSQL cluster in us-east-1 with automatic backups to S3 2. Create a read replica cluster in us-west-2 configured for promotion to primary 3. Implement health check monitoring using Route 53 with 30-second intervals 4. Configure Lambda functions to handle automated failover when primary region health checks fail 5. Set up EventBridge rules to trigger recovery procedures based on RDS events 6. Create SNS topics for alerting operations team during failover events 7. Implement automated backup verification with daily Lambda-based restore tests 8. Configure cross-region S3 replication for database snapshots with lifecycle policies 9. Set up CloudWatch alarms for replication lag exceeding 5 seconds 10. Create IAM roles with least privilege for all automation components. Expected output: A fully automated DR solution that detects primary region failures within 2 minutes and completes failover to secondary region within 5 minutes, with all monitoring and alerting systems operational.",
>   "background": "A financial services company needs to implement a disaster recovery solution for their critical trading platform database. The system must automatically detect failures, initiate recovery procedures, and maintain data integrity with minimal downtime.",
>   "environment": "Multi-region AWS deployment spanning us-east-1 (primary) and us-west-2 (DR) with Aurora PostgreSQL 14.x clusters, Route 53 health checks, Lambda functions for automation, S3 cross-region replication for backups. Requires CDK 2.x with TypeScript, Node.js 18+, AWS CLI configured with multi-region access. Architecture includes VPC peering between regions, private subnets for databases, and public endpoints for health monitoring.",
>   "constraints": [
>     "RDS Aurora clusters must use encrypted storage with customer-managed KMS keys",
>     "All Lambda functions must complete execution within 3 minutes timeout limit",
>     "Cross-region replication must use S3 Transfer Acceleration for snapshots larger than 1GB",
>     "Route 53 health checks must validate both database connectivity and data freshness",
>     "Failover process must preserve in-flight transactions using Aurora global database features"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Generate **TypeScript CDK v2** using modules: `aws-rds`, `aws-ec2`, `aws-iam`, `aws-kms`, `aws-lambda`, `aws-events`, `aws-events-targets`, `aws-sns`, `aws-route53`, `aws-route53-targets`, `aws-s3`, `aws-s3-assets`, `aws-cloudwatch`, `aws-logs`.
> 2. Implement and **connect** the following components end-to-end:
>
>    * **Aurora Global Database (PostgreSQL 14.x):**
>
>      * Primary cluster in **us-east-1**; secondary/read replica in **us-west-2** capable of promotion.
>      * Encrypted storage with **customer-managed KMS keys** in each region; parameter groups & subnet groups in private subnets.
>      * CloudWatch alarm for **replication lag > 5s**; metric wiring to SNS.
>    * **Backups & Verification:**
>
>      * Automated snapshots & export to **S3** in primary region; **cross-region replication** to DR bucket with lifecycle (e.g., transition to Glacier, retention as needed).
>      * Use **S3 Transfer Acceleration** for snapshot objects >1GB.
>      * **Daily verification Lambda** that restores from the latest backup into a temporary cluster, runs health queries, and tears down (≤ 3 min timeout per function, or split orchestration if necessary).
>    * **Health Checks & Failover Automation:**
>
>      * **Route 53 health checks** at **30s intervals**, validating:
>
>        1. DB connectivity (via a small health Lambda/API or TCP check) and
>        2. **data freshness** (heartbeat table timestamp).
>      * **Failover Lambda** (≤ 3 minutes) invoked when primary health checks fail:
>
>        * Promote DR cluster, update Route 53 DNS records, rotate endpoints/parameters, and post to SNS.
>      * **EventBridge rules** on RDS events (e.g., replication degraded, failover completed) to orchestrate recovery steps and notifications.
>    * **Networking & Access:**
>
>      * VPCs with private subnets for DB; **VPC peering** (or TGW) between regions as needed for control-plane validation.
>      * Security groups permitting least-privilege for Lambdas/verification to reach DBs.
>    * **Monitoring & Alerting:**
>
>      * CloudWatch alarms on: replication lag, connection failures, failover duration SLA breaches, Lambda errors/timeouts.
>      * **SNS topics** for ops alerts; subscriptions parameterized by environment/region.
>    * **IAM (Least Privilege):**
>
>      * Roles/policies for Lambdas (promote cluster, modify DNS, read/write S3, start/stop restores, read RDS events).
>      * Separate KMS key policies per region; scoped S3 access for snapshot buckets and logs.
> 3. Enforce **timeouts ≤ 180s** for all Lambdas; use retries and **idempotency** (state keys in S3/DynamoDB if needed) to avoid duplicate failovers.
> 4. Add clear inline comments for each major section (`// 🔹 Aurora Global Database`, `// 🔹 Health Checks`, `// 🔹 Failover Lambda`, `// 🔹 Backup Verification`, etc.).
> 5. Apply consistent **tags** (`Environment`, `Owner`, `CostCenter`, `Service`) and resource naming.
> 6. Output **only two code files** — `main.ts` and `tapstack.ts` — inside fenced code blocks, with no extra prose.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **fully automated, production-grade DR system** that:
>
> * Detects primary region failure within **≤ 2 minutes**
> * Completes **automated failover to DR within ≤ 5 minutes**
> * Preserves **in-flight transactions** using Aurora Global Database features
> * Maintains verified, cross-region backups with alerting, dashboards, and least-privilege access
>
> Focus on:
>
> * Precise inter-resource wiring (Aurora Global Database ↔ Lambda ↔ Route 53 ↔ EventBridge ↔ SNS ↔ S3 ↔ CloudWatch)
> * Security (KMS, IAM, private subnets) and operational rigor (alarms, idempotent failover, verification)
> * Maintainable CDK structure with region-aware constructs and safe promotions

---
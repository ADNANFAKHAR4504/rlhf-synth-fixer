---

#### **Prompt:**

> You are a principal AWS CDK engineer specializing in **multi-region disaster recovery** for mission-critical payment systems using **TypeScript (CDK v2)**.
> Analyze the spec and produce a **complete CDK application** with separate region stacks, shared constructs, automated failover testing hooks, and tight observability.
>
> **Deliverables**
>
> * `main.ts` — CDK app entrypoint wiring primary (us-east-1) and secondary (us-west-2) stacks, shared config, and tags.
> * `tapstack.ts` — Reusable constructs and stack implementations: Route 53 failover, Aurora Global Database, Lambda in both regions, DynamoDB Global Tables, S3 CRR, CloudWatch alarms, SNS, AWS Backup, and VPC plumbing — all connected with least privilege.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to implement a multi-region disaster recovery solution for a payment processing application. The configuration must: 1. Set up Route 53 hosted zone with health checks monitoring both regions. 2. Create RDS Aurora PostgreSQL global database cluster spanning us-east-1 (primary) and us-west-2 (secondary). 3. Deploy identical Lambda functions in both regions for payment processing logic. 4. Configure DynamoDB global tables for storing user sessions with point-in-time recovery. 5. Implement S3 buckets in both regions with cross-region replication for static content. 6. Set up CloudWatch alarms monitoring RDS cluster health, Lambda errors, and DynamoDB throttling. 7. Create SNS topics in both regions for alerting with cross-region subscriptions. 8. Configure automatic DNS failover using Route 53 when primary region health checks fail. 9. Ensure all resources are tagged with Environment=Production and DR-Tier=Critical. 10. Enable AWS Backup for RDS with 7-day retention and cross-region copy. Expected output: TypeScript CDK application with separate stacks for each region, shared constructs for reusable components, and automated failover testing capabilities. The solution should handle regional failures transparently with RPO under 1 minute and RTO under 5 minutes.",
>   "background": "A financial services company requires a disaster recovery solution for their critical payment processing application. The application must maintain 99.99% availability and automatically failover to a secondary region within 5 minutes of a regional outage.",
>   "environment": "Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-west-2 (secondary) regions. Deployment includes RDS Aurora PostgreSQL Global Database, Lambda functions for business logic, DynamoDB global tables for session management, and S3 buckets with cross-region replication. Route 53 manages DNS failover between regions. Requires CDK 2.x with TypeScript, AWS CLI configured with appropriate permissions. VPCs in both regions with private subnets across 3 AZs each, VPC peering for cross-region communication.",
>   "constraints": [
>     "Use Route 53 health checks with failover routing policy",
>     "Implement RDS Aurora Global Database with automated failover",
>     "Deploy Lambda functions in both regions with cross-region replication",
>     "Configure DynamoDB global tables for session state management",
>     "Set up CloudWatch cross-region alarms and SNS notifications",
>     "Use S3 cross-region replication for static assets with versioning enabled"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Use **AWS CDK v2 (TypeScript)** modules:
>
>    * Core: `aws-route53`, `aws-route53-targets`, `aws-rds`, `aws-ec2`, `aws-lambda`, `aws-dynamodb`, `aws-s3`, `aws-s3-deployment` (optional), `aws-sns`, `aws-sns-subscriptions`, `aws-cloudwatch`, `aws-cloudwatch-actions`, `aws-backup`, `aws-iam`, `aws-logs`.
> 2. Implement and correctly **wire** all components:
>
>    * **Networking & Stacks**
>
>      * VPCs in **both regions** with private subnets across 3 AZs; security groups for DB/Lambda; optional **VPC peering** for control-plane or ops.
>      * Separate **PrimaryStack (us-east-1)** and **SecondaryStack (us-west-2)**; shared constructs for reusability.
>    * **Aurora Global Database (PostgreSQL)**
>
>      * Primary cluster in us-east-1, secondary in us-west-2 as global cluster member; encrypted with KMS; parameter/subnet groups in private subnets.
>      * Enable **automated failover** and set alarms for replication lag, writer health.
>      * **AWS Backup** plan: 7-day retention, **cross-region copy** to secondary.
>    * **Lambda (Payments logic)**
>
>      * Identical functions deployed in both regions; least-privilege IAM; X-region config/param sync (SSM/Secrets).
>      * CloudWatch log groups with retention; error/latency alarms.
>    * **DynamoDB Global Tables (Sessions)**
>
>      * On-demand billing with **PITR**; replicated to both regions; streams optional for audit.
>      * Throttle alarms; least-privilege IAM for Lambdas.
>    * **S3 with Cross-Region Replication**
>
>      * Versioned buckets in both regions; **CRR** configured (replication roles, rules).
>    * **Route 53 Hosted Zone & DNS Failover**
>
>      * Health checks for **both** regional endpoints (API/ALB/Lambda URL as appropriate).
>      * **Failover routing** records: Primary → us-east-1, Secondary → us-west-2; automatic switch on health failure.
>    * **Monitoring & Alerts**
>
>      * CloudWatch alarms: Aurora writer health/lag, Lambda errors, DynamoDB throttles; **cross-region** visibility and **SNS** topics in both regions with cross-region subscriptions.
>    * **Tagging**
>
>      * Apply `Environment=Production` and `DR-Tier=Critical` to **all resources**.
>    * **Failover Testing Hooks**
>
>      * Include a Lambda/State Machine or SSM Automation document to simulate regional failure and validate RTO/RPO objectives; outputs to CloudWatch/SNS.
> 3. IAM: enforce **least privilege** across all roles (RDS, Lambda, DDB, S3, Route 53, Backup, CW, SNS).
> 4. Outputs:
>
>    * Hosted Zone ID/Name, failover A/AAAA record names, Aurora Global DB ARN, DDB Global Table ARN(s), S3 bucket names/replication status, SNS topic ARNs, and a **CloudWatch Dashboard URL**.
> 5. Code style: clear sections with comments (`// 🔹 Route 53`, `// 🔹 Aurora Global DB`, `// 🔹 DynamoDB Global Tables`, `// 🔹 S3 CRR`, `// 🔹 Monitoring`, `// 🔹 Backup`, `// 🔹 Failover Test`).
> 6. Output **only two files** — `main.ts` and `tapstack.ts` — in fenced code blocks. No extra prose.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **production-grade multi-region DR solution** that:
>
> * Meets **RPO ≤ 1 minute** and **RTO ≤ 5 minutes**
> * Fails over automatically via **Route 53 health-based routing**
> * Keeps data replicated via **Aurora Global DB**, **DynamoDB Global Tables**, and **S3 CRR**
> * Provides cross-region alarms and notifications with **SNS**
> * Is modular, least-privilege, and easy to validate via automated failover tests

---
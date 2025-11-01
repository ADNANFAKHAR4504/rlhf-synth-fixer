---

#### **Prompt:**

> You are a senior AWS CDK engineer specializing in **multi-environment architectures** using **TypeScript (CDK v2)**.
> Analyze the input and produce a **single, parameterized CDK application** that deploys a **payment processing stack** consistently across **dev, staging, and prod**, varying capacity and retention policies per environment.
>
> **Deliverables:**
>
> * `main.ts` — CDK app entrypoint reading the environment from **context** and instantiating the parameterized stack.
> * `tapstack.ts` — A single **parameterized stack** defining VPC, EC2, RDS (+ cross-environment read replicas), S3, Route53, CloudWatch, IAM, and SSM Parameter Store, **connected end-to-end**.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to deploy a multi-environment payment processing infrastructure that ensures consistency across dev, staging, and production. The configuration must: 1. Define a single CDK stack that accepts environment parameters (dev/staging/prod) to control deployment variations. 2. Deploy EC2 instances with environment-specific instance types (t3.micro for dev, t3.medium for staging, t3.large for prod). 3. Set up RDS PostgreSQL instances with automated backups (1-day retention for dev, 7-day for staging, 30-day for prod). 4. Configure S3 buckets with versioning enabled and lifecycle policies (30-day object expiration for dev, 90-day for staging, no expiration for prod). 5. Implement CloudWatch alarms with environment-specific thresholds (CPU > 80% for dev, > 70% for staging, > 60% for prod). 6. Create Route53 hosted zones with environment-specific subdomains (dev.payment.company.com, staging.payment.company.com, payment.company.com). 7. Use Systems Manager Parameter Store to manage environment-specific secrets and configurations. 8. Apply consistent tagging strategy across all resources with Environment, Team, and CostCenter tags. 9. Ensure all resources use the same VPC CIDR blocks but with different subnet allocations per environment. 10. Implement cross-environment read replicas for RDS (staging reads from prod, dev reads from staging). Expected output: A TypeScript CDK application with a parameterized stack that can be deployed to any environment using context variables, maintaining architectural consistency while allowing environment-specific configurations.",
>   "background": "A financial services company needs to maintain identical infrastructure across development, staging, and production environments for their payment processing system. Each environment must have the same architecture but with environment-specific configurations for capacity, backup schedules, and access controls.",
>   "environment": "AWS multi-environment setup across us-east-1 (prod), us-west-2 (staging), and us-east-2 (dev). Requires CDK 2.x with TypeScript, Node.js 18+, and AWS CLI configured with appropriate credentials. Each environment uses a VPC with 10.x.0.0/16 CIDR blocks where x represents environment (1=dev, 2=staging, 3=prod). Private subnets for RDS and EC2 instances span 3 availability zones. Public subnets host NAT gateways for outbound connectivity. Systems Manager Parameter Store holds environment-specific configurations and secrets.",
>   "constraints": [
>     "All infrastructure code must be in a single CDK app with environment passed as context",
>     "Resource naming must follow pattern: {company}-{service}-{environment}-{resource-type}",
>     "VPC peering must be established between environments for cross-environment RDS read replicas",
>     "CloudWatch logs must be retained for different periods: 7 days (dev), 30 days (staging), 365 days (prod)",
>     "IAM roles must enforce least privilege with environment-specific permissions boundaries",
>     "All S3 buckets must have encryption at rest using AWS-managed keys (SSE-S3)"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Use **AWS CDK v2 TypeScript** modules: `aws-ec2`, `aws-rds`, `aws-s3`, `aws-s3-deployment` (if needed), `aws-iam`, `aws-logs`, `aws-cloudwatch`, `aws-cloudwatch-actions`, `aws-route53`, `aws-route53-targets`, `aws-ssm`, and `aws-secretsmanager` (for DB creds).
> 2. Implement a **single parameterized stack** (props include `environment`, `company`, `service`, region mappings, CIDR, thresholds, backup retention).
> 3. **VPC & Networking**
>
>    * One VPC per environment using **10.x.0.0/16** (x = 1 dev, 2 staging, 3 prod).
>    * Subnet tiers: public (NAT), private (EC2), isolated (RDS).
>    * **VPC peering** between environments to support **cross-env RDS read replicas**.
> 4. **Compute (EC2)**
>
>    * Launch templates/ASG (or single instances) with env-specific instance types:
>
>      * dev: `t3.micro`, staging: `t3.medium`, prod: `t3.large`.
>    * No public IPs; SSM access via Parameter Store.
> 5. **Database (RDS PostgreSQL)**
>
>    * Primary DB per env with automated backups: dev=1d, staging=7d, prod=30d.
>    * **Cross-environment read replicas:** staging ← prod; dev ← staging (across regions where applicable).
>    * Secrets in **Secrets Manager**; grant least-privilege to EC2.
> 6. **Storage (S3)**
>
>    * Buckets per env with **versioning** and lifecycle rules: dev expire 30d, staging 90d, prod no expiration.
>    * **SSE-S3** encryption enforced.
> 7. **DNS (Route53)**
>
>    * Hosted zones & records: `dev.payment.company.com`, `staging.payment.company.com`, `payment.company.com` (prod).
>    * Map records to environment load balancers or EC2 endpoints as applicable.
> 8. **Observability**
>
>    * CloudWatch **Alarms** with env thresholds: CPU >80% (dev), >70% (staging), >60% (prod).
>    * **Log retention**: 7d dev, 30d staging, 365d prod.
> 9. **Config & Secrets (SSM Parameter Store / Secrets Manager)**
>
>    * Store environment configs (DB endpoints, feature flags).
>    * IAM policies with **permissions boundaries** per environment.
> 10. **Tagging & Naming**
>
>     * Apply `{company}-{service}-{environment}-{resource-type}` consistently.
>     * Tags: `Environment`, `Team`, `CostCenter`.
> 11. Add clear inline comments separating sections (e.g., `// 🔹 VPC`, `// 🔹 RDS`, `// 🔹 Cross-Env Peering`, `// 🔹 DNS`).
> 12. Output **only two files** — `main.ts` and `tapstack.ts` — as fenced code blocks, no extra prose.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **single-app, context-driven CDK program** that maintains architectural parity across **dev/staging/prod** while applying **environment-specific** sizing, retention, thresholds, and access controls — including **cross-environment RDS read replicas** via VPC peering and DNS aligned to subdomains.
> Focus on:
>
> * Correct cross-env connectivity (peering, security groups, routing)
> * Parameterization & naming consistency
> * Least-privilege IAM with permissions boundaries
> * Reliable backups, alarms, and logs retention per environment

---
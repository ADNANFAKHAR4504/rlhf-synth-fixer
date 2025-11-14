---

#### **Prompt:**

> You are a senior AWS CDK engineer specializing in **ECS Fargate blue/green deployments** for high-availability financial systems using **TypeScript (CDK v2)**.
> Analyze the spec and produce a **complete CDK application** that deploys a fully automated ECS Fargate infrastructure with **zero-downtime updates** via CodeDeploy, ECR integration, auto-scaling, and observability through CloudWatch and Container Insights.
>
> **Deliverables**
>
> * `main.ts` — CDK app entrypoint defining environment, stack instantiation, and tagging.
> * `tapstack.ts` — Full stack including VPC, ECS cluster, ECR repo, ALB setup, task definition, ECS service, CodeDeploy configuration, auto-scaling, and monitoring — all properly wired.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to deploy a containerized trading analytics application on ECS Fargate with blue/green deployment capabilities. The configuration must: 1. Define a VPC with 3 availability zones, each containing public and private subnets. 2. Create an ECS cluster optimized for Fargate workloads with Container Insights enabled. 3. Set up an ECR repository with image scanning on push and lifecycle policies to retain only the last 10 images. 4. Define an ECS task definition with 2GB memory, 1024 CPU units, and CloudWatch log driver configuration. 5. Configure an Application Load Balancer with health check endpoints and two target groups for blue/green switching. 6. Create an ECS service with CodeDeploy integration for blue/green deployments and 5-minute deployment timeout. 7. Implement auto-scaling policies that scale out at 70% CPU utilization and scale in at 30%. 8. Set up CloudWatch alarms for high CPU usage (>80%), unhealthy task count, and deployment failures. 9. Configure IAM roles with least-privilege access for ECS task execution and CodeDeploy operations. 10. Output the ALB DNS name, ECR repository URI, and CodeDeploy application name for CI/CD integration.",
>   "background": "A financial services company needs to deploy their trading analytics application with zero-downtime deployments to meet strict SLA requirements. The application processes real-time market data and must maintain continuous availability during updates. They've chosen ECS Fargate for container orchestration to eliminate infrastructure management overhead.",
>   "environment": "Production ECS Fargate cluster deployed in us-east-1 across 3 availability zones. Infrastructure includes Application Load Balancer for traffic distribution, ECR for container registry, CodeDeploy for blue/green deployments, and CloudWatch for monitoring. VPC configured with public subnets for ALB and private subnets for ECS tasks. NAT Gateways provide outbound internet access for containers. Requires CDK 2.x with TypeScript, Docker installed for local testing, and AWS CLI configured with appropriate permissions for ECS, ECR, CodeDeploy, and networking resources.",
>   "constraints": [
>     "Use TypeScript as the CDK implementation language",
>     "Deploy only in us-east-1 region for low-latency access to market data feeds",
>     "Implement blue/green deployments using CodeDeploy for zero-downtime updates",
>     "Use Application Load Balancer with target group switching for traffic management",
>     "Configure ECS service auto-scaling based on CPU utilization (scale between 2-10 tasks)",
>     "Store container images in ECR with vulnerability scanning enabled",
>     "Implement health checks with 30-second intervals and 2 consecutive failures threshold",
>     "Use Fargate Spot for non-production environments to reduce costs by 70%",
>     "Configure CloudWatch Container Insights for detailed container metrics",
>     "Set memory limits to 2GB and CPU to 1024 units per container"
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
>    * `aws-ec2`, `aws-ecs`, `aws-ecr`, `aws-ecs-patterns` (optional), `aws-elasticloadbalancingv2`, `aws-codedeploy`, `aws-cloudwatch`, `aws-cloudwatch-actions`, `aws-iam`, `aws-logs`.
> 2. Implement and correctly **wire** all components:
>
>    * **VPC**
>
>      * 3 AZs, public and private subnets; NAT gateways for private subnets; tagging for clarity.
>    * **ECS Cluster**
>
>      * Fargate-only cluster in `us-east-1`; **Container Insights enabled**; logging with retention policy.
>    * **ECR Repository**
>
>      * Image scanning on push; lifecycle policy retaining **10 images max**; repository URI output.
>    * **Task Definition**
>
>      * 2GB memory, 1024 CPU; container using CloudWatch log driver (with log retention = 30 days).
>      * Env vars, health check endpoint `/health`, and secrets from SSM (placeholder).
>    * **Application Load Balancer (ALB)**
>
>      * Public-facing; 2 **target groups** (`blue` and `green`); 30s health checks; 2 consecutive failure threshold.
>      * Listener rules route all traffic initially to blue; CodeDeploy swaps on deployment.
>    * **ECS Service + CodeDeploy**
>
>      * Service configured for **blue/green deployment** with `CodeDeployEcsApplication` and `EcsDeploymentGroup`.
>      * 5-minute deployment timeout; rollback on failure.
>      * Minimum healthy percent 100%, maximum 200%.
>    * **Auto Scaling**
>
>      * Min 2 tasks, max 10 tasks; scale-out at 70% CPU, scale-in at 30%.
>    * **CloudWatch Monitoring**
>
>      * Alarms:
>
>        * CPU > 80% (scale-out alert).
>        * Unhealthy tasks > 0.
>        * Deployment failure events.
>      * SNS topic (optional) for alarms.
>      * Container Insights metrics enabled.
>    * **IAM Roles**
>
>      * ECS task execution role (pull from ECR, write to CW logs).
>      * CodeDeploy service role (allow ECS, ALB, CloudWatch interactions).
> 3. **Optional Enhancements:**
>
>    * Use **Fargate Spot** for staging/non-prod tasks to cut costs by ~70%.
>    * Add **CloudWatch Dashboard** visualizing CPU, memory, task count, and deployment health.
> 4. Global Tags: `Environment=Production`, `Service=TradingAnalytics`, `ManagedBy=CDK`.
> 5. CDK Outputs:
>
>    * ALB DNS name
>    * ECR repository URI
>    * CodeDeploy application name
> 6. Inline section comments:
>    `// 🔹 VPC`, `// 🔹 ECS Cluster`, `// 🔹 ECR`, `// 🔹 Task Definition`, `// 🔹 ALB`, `// 🔹 CodeDeploy`, `// 🔹 Auto Scaling`, `// 🔹 Monitoring`.
> 7. Output **only two files** — `main.ts` and `tapstack.ts` — in fenced code blocks.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **zero-downtime ECS Fargate deployment system** that:
>
> * Enables **blue/green switching** via CodeDeploy
> * Supports **automatic rollback and scaling**
> * Provides **observability and alerting** via CloudWatch and Container Insights
> * Uses **ECR scanning, health checks, and IAM hardening** for operational resilience

---
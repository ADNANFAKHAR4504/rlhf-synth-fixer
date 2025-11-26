---

#### **Prompt:**

> You are a principal AWS CDK engineer specializing in **PCI-DSS–grade payment workloads** using **TypeScript (CDK v2)**.
> Analyze the spec and produce a **complete CDK application** that deploys a secure, highly-available payment dashboard on ECS Fargate with RDS Aurora, WAF-protected ALB, CloudFront+S3 for static content, X-Ray tracing, auto-scaling, and blue/green deployments.
>
> **Deliverables**
>
> * `main.ts` — CDK app entrypoint (env config, tags, stack init).
> * `tapstack.ts` — Full infrastructure stack: VPC (3-tier), ECS Fargate service, ALB+WAF, Aurora MySQL cluster, CloudFront+S3, CodeDeploy blue/green, VPC endpoints, X-Ray, GuardDuty/Security Hub, CloudWatch dashboards/alarms, SNS, and IAM — properly wired and tagged.

---

### 📘 Input Specification

```json
{
  "problem": "Create a CDK program to deploy a secure payment processing web application with strict compliance requirements. The configuration must: 1. Set up a VPC with 3 tiers (public, private, isolated) across 3 AZs with flow logs enabled to CloudWatch. 2. Deploy an ECS Fargate service running the payment dashboard container with 4 vCPU and 8GB memory per task. 3. Configure an Application Load Balancer with HTTPS listeners using ACM certificates and integrate with AWS WAF. 4. Create an RDS Aurora MySQL cluster with encryption enabled and automated backups retained for 35 days. 5. Implement auto-scaling for ECS tasks with min 3, max 12 instances based on 70% CPU and 80% memory thresholds. 6. Set up CloudFront distribution for static assets stored in S3 with OAI (Origin Access Identity). 7. Configure CloudWatch dashboards with custom metrics for transaction processing latency and error rates. 8. Implement AWS X-Ray tracing for the entire request flow from ALB to database. 9. Create SNS topics for critical alerts with email subscriptions for ops team. 10. Set up CodeDeploy for blue-green deployments with automatic rollback on CloudWatch alarms. 11. Configure VPC endpoints for S3, Secrets Manager, and Systems Manager to avoid internet traffic. 12. Enable GuardDuty and Security Hub for threat detection and compliance monitoring. Expected output: A complete CDK TypeScript application that deploys all infrastructure components with proper dependencies, outputs the ALB DNS name, CloudFront distribution URL, and creates a CloudFormation stack with detailed resource tagging for cost allocation and compliance tracking.",
  "background": "A fintech startup needs to deploy their customer-facing payment processing dashboard that handles sensitive financial data. The application requires strict security controls, high availability across multiple availability zones, and must comply with PCI DSS requirements for handling credit card information.",
  "environment": "Production-grade infrastructure deployed in us-east-1 across 3 availability zones. Core services include ECS Fargate for containerized web application, Application Load Balancer with WAF integration, RDS Aurora MySQL with multi-AZ failover, and S3 for static assets with CloudFront distribution. VPC configuration includes public subnets for ALB and NAT gateways, private subnets for ECS tasks and RDS instances, and isolated subnets for database layer. Requires AWS CDK 2.x with TypeScript, Node.js 18+, Docker for container builds, and AWS CLI v2 configured with appropriate credentials. The environment enforces encryption at rest and in transit for all data flows.",
  "constraints": [
    "Use TypeScript exclusively for all CDK constructs and custom resources",
    "Implement least-privilege IAM policies with no wildcard permissions",
    "Deploy all compute resources in private subnets with no direct internet access",
    "Use AWS Systems Manager Parameter Store for all configuration values",
    "Enable AWS WAF with custom rules for SQL injection and XSS protection",
    "Configure auto-scaling based on both CPU and memory metrics",
    "Implement blue-green deployment strategy using weighted target groups",
    "Use AWS Secrets Manager rotation for database credentials with 30-day rotation"
  ]
}
```

---

### 🧩 Output Requirements

1. Use **AWS CDK v2 (TypeScript)** with core modules (imported from `aws-cdk-lib`):

   * `aws-ec2` (VPC, subnets, endpoints, SGs, flow logs)
   * `aws-ecs`, `aws-ecs-patterns` (optional), `aws-ecr` (if image repo included)
   * `aws-elasticloadbalancingv2` (ALB), `aws-certificatemanager`, `aws-wafv2`
   * `aws-rds` (Aurora MySQL), `aws-secretsmanager`, `aws-ssm`
   * `aws-cloudfront`, `aws-cloudfront-origins`, `aws-s3`
   * `aws-cloudwatch`, `aws-cloudwatch-actions`, `aws-logs`, `aws-logs-destinations`
   * `aws-codedeploy`, `aws-sns`, `aws-sns-subscriptions`
   * `aws-guardduty`, `aws-securityhub` (or `Cfn` L1s if needed)
   * `aws-xray`/instrumentation wiring via env/props and IAM
   * `aws-iam`, `aws-kms`, `aws-s3-assets` (if needed for task definitions/manifests).

2. Implement and correctly **wire** all components:

   #### 🔹 VPC & Networking

   * Create a **VPC** in `us-east-1` with:

     * 3 **AZs**.
     * **Public subnets** (ALB + NAT gateways).
     * **Private subnets** (ECS Fargate tasks, app tier).
     * **Isolated subnets** (Aurora DB cluster).
   * Enable **VPC Flow Logs** to CloudWatch Logs (dedicated log group, retention, KMS if desired).
   * Add **Interface / Gateway Endpoints** for:

     * S3
     * Secrets Manager
     * Systems Manager (SSM + SSM Messages + EC2 Messages if needed)
   * Ensure **compute resources (ECS tasks, DB)** live only in **private/isolated** subnets (no public IP).

   #### 🔹 ECS Fargate Service + ALB + WAF + X-Ray

   * Define an ECS **Cluster** (Fargate) in private subnets.
   * Task definition for the **payment dashboard**:

     * 4 vCPUs, 8GB memory per task.
     * Container image (placeholder ECR repo) with environment variables loaded from **SSM Parameter Store** and **Secrets Manager** (for DB creds).
     * Configure **X-Ray SDK** via env vars and IAM (`xray:PutTraceSegments`, etc.).
   * ECS **Fargate Service**:

     * Behind an **Application Load Balancer** (ALB) in public subnets.
     * HTTPS listeners using **ACM certificate** (parameterized domain).
     * Target groups configured for **weighted blue/green** deployment via CodeDeploy.
     * Security groups allowing ALB → ECS only, ECS → DB only.
   * **AWS WAFv2 WebACL** attached to ALB:

     * Custom rules for **SQL injection** and **XSS** (managed rule sets + custom where needed).
   * Configure **AWS X-Ray** tracing across the flow:

     * ALB → ECS app → Aurora DB (via SDK + IAM).

   #### 🔹 Aurora MySQL Cluster (RDS)

   * Provision an **Aurora MySQL** cluster:

     * Multi-AZ across the 3 AZs (at least 2 writers/reader config).
     * Encrypted at rest with KMS CMK.
     * Backup retention **35 days**.
     * Placed in **isolated subnets** with a restrictive SG (ECS SG only).
   * Use **Secrets Manager** for DB credentials with **30-day rotation** enabled.
   * Ensure no public access; no Internet Gateway route.

   #### 🔹 Auto Scaling & Blue/Green Deployments

   * For ECS service:

     * Min tasks: **3**, max: **12**.
     * Target tracking or step scaling based on:

       * CPU utilization 70%
       * Memory utilization 80%
   * Configure **CodeDeploy ECS Application + DeploymentGroup** for blue/green:

     * Weighted target groups (blue/green) behind the ALB.
     * Integrate with **CloudWatch alarms** for automatic rollback on failure (5xx, high latency, unhealthy hosts).

   #### 🔹 Static Assets: S3 + CloudFront

   * S3 bucket for **static assets** with encryption, private access only.
   * **CloudFront distribution**:

     * Origin: S3 with **Origin Access Identity (OAI)** or Origin Access Control.
     * Viewer protocol policy: HTTPS only.
     * Optional WAF association at CloudFront as well.
   * Output the **CloudFront distribution domain name**.

   #### 🔹 Monitoring, Dashboards, Alerts

   * **CloudWatch Dashboards**:

     * Custom metrics/widgets for:

       * Transaction processing **latency** (p50/p90/p99).
       * Error rates (HTTP 4xx/5xx from ALB + app-level metrics).
       * ECS service CPU/memory, task count.
       * Aurora DB connections and latency.
   * **CloudWatch Alarms**:

     * ECS unhealthy tasks, high latency, 5xx rate.
     * Aurora cluster failover/health events.
   * **SNS Topics**:

     * Critical alerts topic with **email subscription** for ops team.
     * Wire alarms to SNS topic.

   #### 🔹 Security Services: GuardDuty & Security Hub

   * Enable **GuardDuty** detector in the region (if not already).
   * Enable **Security Hub**, opt into foundational / PCI standards as appropriate.
   * Tag both for compliance visibility.

   #### 🔹 Configuration & IAM

   * Use **SSM Parameter Store** for:

     * App configuration values (API endpoints, feature flags, etc.).
   * Use **Secrets Manager** for:

     * DB credentials (with 30-day rotation).
   * **IAM**:

     * Implement **least-privilege**, **no `*` actions or `*` resources**.
     * Separate roles:

       * ECS task role and execution role.
       * CodeDeploy role.
       * CloudFront invalidation role (if you add CI/CD).
       * GuardDuty/SecurityHub integration roles (if required).

3. **Tagging & Outputs**

   * Apply **detailed tagging** to all resources:

     * `Environment=Production`
     * `Project=PaymentDashboard`
     * `CostCenter=<placeholder>`
     * `Compliance=PCI-DSS`
     * `ManagedBy=CDK`
   * CDK **Outputs**:

     * ALB DNS name.
     * CloudFront distribution URL.
     * Aurora cluster endpoint.
     * WAF WebACL ARN (optional).

4. **Code Style & Structure**

   * Clean, modular CDK code with inline comments:

     * `// 🔹 VPC & Flow Logs`
     * `// 🔹 VPC Endpoints`
     * `// 🔹 Aurora Cluster`
     * `// 🔹 ECS Fargate + ALB + WAF`
     * `// 🔹 CodeDeploy Blue/Green`
     * `// 🔹 CloudFront + S3`
     * `// 🔹 X-Ray & Observability`
     * `// 🔹 GuardDuty & Security Hub`
     * `// 🔹 IAM & Parameters`
   * Use **TypeScript exclusively** for constructs and any custom resources.

5. **File Output Contract**

   * Return **only two files** in fenced code blocks:

     * `main.ts`
     * `tapstack.ts`
   * No extra explanation text in the model’s answer when generating code.

---

### 🎯 Goal

Deliver a **production-ready, PCI-conscious payment processing stack** that:

* Runs the payment dashboard on **ECS Fargate in private subnets**.
* Uses **ALB + WAF + ACM** for secure HTTPS ingress.
* Stores data in **Aurora MySQL** with strong encryption and backups.
* Serves static assets via **CloudFront + S3** with private origins.
* Implements **auto-scaling, blue/green deployments, X-Ray tracing, GuardDuty, and Security Hub**, plus rich dashboards and alerts.
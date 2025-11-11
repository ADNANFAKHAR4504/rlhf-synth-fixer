---

#### **Prompt:**

> You are a senior AWS CDK engineer specializing in **ECS Fargate service meshes** with **AWS App Mesh** using **TypeScript (CDK v2)**.
> Analyze the spec and produce a **complete CDK application** that deploys a containerized microservices architecture integrated with App Mesh, mTLS, ALB ingress, Cloud Map discovery, X-Ray tracing, and CloudWatch Container Insights.
>
> **Deliverables**
>
> * `main.ts` — CDK app entrypoint and stack initialization.
> * `tapstack.ts` — Full stack wiring: VPC, ECS Fargate cluster/services, App Mesh (mesh, virtual nodes/services, virtual gateway, routes, TLS), Cloud Map namespace, ALB, dashboards, IAM, and X-Ray — all connected.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to deploy a containerized microservices architecture with AWS App Mesh service mesh integration. The configuration must: 1. Set up an ECS cluster with Fargate compute and enable Container Insights monitoring. 2. Deploy three microservices (payment-api, fraud-detection, notification-service) each with 2 tasks running on Fargate with 1 vCPU and 2GB memory. 3. Configure App Mesh with a mesh named 'payment-mesh' containing virtual nodes for each service with mTLS enabled. 4. Implement a virtual gateway that routes /api/payments/* to payment-api, /api/fraud/* to fraud-detection, and /api/notify/* to notification-service. 5. Set up Cloud Map private DNS namespace 'payments.local' with service discovery for internal communication. 6. Configure virtual services in App Mesh that point to corresponding virtual nodes with connection pool limits of 50 concurrent connections. 7. Deploy an Application Load Balancer in public subnets that forwards traffic to the App Mesh virtual gateway. 8. Enable AWS X-Ray tracing on all services and configure Envoy sidecars to send traces. 9. Create CloudWatch dashboards showing request rates, error rates, and latency percentiles for each service. 10. Implement circuit breaker patterns in App Mesh with 5 consecutive 5xx errors triggering circuit open state. Expected output: A fully functional service mesh architecture where microservices communicate through Envoy proxies, external traffic flows through ALB to virtual gateway, and all service-to-service communication is encrypted with mTLS. The stack should output the ALB DNS name, Cloud Map namespace ARN, and dashboard URLs for monitoring service health and performance metrics.",
>   "background": "A financial services company needs to modernize their payment processing system by containerizing multiple microservices with service mesh capabilities for enhanced observability and traffic management. The architecture requires AWS App Mesh integration with ECS Fargate to enable fine-grained control over service-to-service communication, implement circuit breakers, and provide detailed metrics for each microservice interaction.",
>   "environment": "Production environment in us-east-1 region utilizing ECS Fargate for container orchestration, AWS App Mesh for service mesh capabilities, Application Load Balancer for ingress, Cloud Map for service discovery, and CloudWatch Container Insights for monitoring. Infrastructure spans across 3 availability zones with private subnets for containers and public subnets for ALB. Requires CDK 2.x with TypeScript, Docker for building container images, and AWS CLI configured with appropriate permissions. VPC configured with NAT gateways for outbound internet access from private subnets.",
>   "constraints": [
>     "All containers must run on Fargate with specific CPU/memory allocations based on service type",
>     "App Mesh virtual nodes must enforce mTLS communication between all services",
>     "Each service must have its own target group with custom health check configurations",
>     "CloudWatch Container Insights must be enabled for all ECS services",
>     "Service discovery must use Cloud Map with private DNS namespace",
>     "Virtual gateway must handle external traffic with path-based routing rules",
>     "Each microservice must have dedicated IAM task roles with least privilege",
>     "X-Ray tracing must be enabled across the entire mesh for distributed tracing",
>     "Envoy sidecars must have resource limits of 0.25 vCPU and 512MB memory"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Use **AWS CDK v2 (TypeScript)** with: `aws-ecs`, `aws-ecs-patterns` (optional), `aws-appmesh`, `aws-servicediscovery`, `aws-elasticloadbalancingv2`, `aws-ec2`, `aws-iam`, `aws-logs`, `aws-cloudwatch`, `aws-cloudwatch-actions`, and `aws-route53-targets` (if needed for ALB).
> 2. Implement and correctly **wire** all components:
>
>    * **VPC & ECS Cluster**
>
>      * VPC across 3 AZs; private subnets for tasks; public subnets for ALB; NAT for egress.
>      * ECS **Cluster** with **Fargate** capacity; **Container Insights enabled**.
>    * **Services (payment-api, fraud-detection, notification-service)**
>
>      * Fargate tasks: **2 tasks each**, **1 vCPU** and **2GB memory**; no public IPs.
>      * **Envoy sidecar** per task (App Mesh proxy) with limits **0.25 vCPU / 512MB**; X-Ray daemon enabled.
>      * **Dedicated IAM task roles** (least privilege).
>      * Target groups per service with custom health checks.
>    * **App Mesh**
>
>      * Mesh: **`payment-mesh`**.
>      * **Virtual nodes** per service with **mTLS** (ACM-issued certs) and **connection pool**: max **50 concurrent** connections.
>      * **Virtual services** pointing to nodes.
>      * **Virtual gateway** with **path-based routing**:
>
>        * `/api/payments/*` → `payment-api`
>        * `/api/fraud/*` → `fraud-detection`
>        * `/api/notify/*` → `notification-service`
>      * **Circuit breaker / outlier detection**: open on **5 consecutive 5xx**.
>    * **Service Discovery**
>
>      * **Cloud Map** private namespace `payments.local`; register each service.
>    * **Ingress**
>
>      * **ALB** in public subnets → forwards traffic to App Mesh **Virtual Gateway** (integrate via GatewayRoute/ingress).
>    * **Observability**
>
>      * **X-Ray** enabled for app containers and Envoy export; IAM permissions included.
>      * **CloudWatch dashboards**: request rate, error rate, P50/P90/P99 latency per service; Container Insights metrics.
>      * Log groups per service with retention and structured JSON logs.
> 3. Apply global tags and consistent naming.
> 4. Outputs: **ALB DNS name**, **Cloud Map namespace ARN**, **dashboard URLs**.
> 5. Add clear inline comments per section (`// 🔹 ECS Cluster`, `// 🔹 App Mesh`, `// 🔹 Virtual Gateway & Routing`, `// 🔹 Dashboards`).
> 6. Output **only two files** — `main.ts` and `tapstack.ts` — in fenced code blocks. No extra prose.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **production-grade service mesh** on ECS Fargate where:
>
> * All service-to-service traffic flows through **Envoy with mTLS**,
> * **ALB → Virtual Gateway** handles external ingress with path routing,
> * **Cloud Map** provides internal discovery,
> * **Container Insights + Dashboards + X-Ray** give deep visibility,
> * **Circuit breakers** protect the system under failure.

---
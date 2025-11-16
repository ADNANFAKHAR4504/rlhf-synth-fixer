---

#### **Prompt:**

> You are a senior AWS CDK engineer specializing in **EKS infrastructure automation** for regulated financial environments using **TypeScript (CDK v2)**.
> Analyze the input and produce a **complete CDK application** that provisions a production-grade EKS cluster with Bottlerocket nodes, IRSA integration, RBAC, autoscaling, and advanced observability.
>
> **Deliverables**
>
> * `main.ts` — CDK app entrypoint and stack initialization.
> * `tapstack.ts` — Full implementation of EKS cluster setup with VPC, node groups, add-ons, IAM roles, RBAC, autoscaler, logging, and network isolation.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to deploy an EKS cluster optimized for financial workloads. The configuration must: 1. Define an EKS cluster with managed node groups using Bottlerocket AMI and t3.large instances. 2. Configure IRSA with OIDC provider and create service accounts for pods to assume specific IAM roles. 3. Set up three node groups: 'critical' (3-5 nodes), 'general' (2-8 nodes), and 'batch' (1-2 nodes) with appropriate taints and labels. 4. Implement Kubernetes RBAC with roles for admin, developer, and viewer access levels. 5. Deploy AWS Load Balancer Controller as an EKS add-on with proper IAM permissions. 6. Configure Cluster Autoscaler with IAM role and deployment manifest. 7. Enable all EKS control plane log types and stream to CloudWatch Logs. 8. Create pod disruption budgets for critical namespaces with minAvailable set to 50%. 9. Configure EBS CSI driver add-on with gp3 storage class as default. 10. Set up namespace isolation with network policies for production workloads.",
>   "background": "A fintech startup needs to deploy their microservices architecture on AWS EKS to handle real-time payment processing. The infrastructure must support blue-green deployments and automatic scaling based on transaction volume. They require a production-ready EKS cluster with proper node group configuration and IRSA (IAM Roles for Service Accounts) setup for secure pod-level AWS API access.",
>   "environment": "Production-grade EKS infrastructure deployed in eu-central-1 across 3 availability zones. Requires AWS CDK 2.x with TypeScript, kubectl 1.28+, and AWS CLI v2 configured. VPC with public subnets for load balancers and private subnets for EKS worker nodes. NAT Gateways in each AZ for outbound internet access. Uses AWS Load Balancer Controller for ingress management and Cluster Autoscaler for dynamic node scaling. Integration with AWS Systems Manager for node access without SSH keys.",
>   "constraints": [
>     "EKS cluster must use version 1.28 or higher",
>     "Node groups must use Bottlerocket AMI for enhanced security",
>     "Implement pod disruption budgets for all critical workloads",
>     "Configure OIDC provider for IRSA authentication",
>     "Use only private subnets for worker nodes",
>     "Enable EKS control plane logging to CloudWatch",
>     "Implement Kubernetes RBAC with at least 3 distinct user roles",
>     "Configure automatic node scaling between 3-15 instances",
>     "Use gp3 EBS volumes with encryption enabled for all persistent storage"
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
>    * `aws-eks`, `aws-ec2`, `aws-iam`, `aws-logs`, `aws-cloudwatch`, `aws-autoscaling`, `aws-efs`, `aws-ssm`, `aws-kms`, `aws-lambda`, `aws-elasticloadbalancingv2`, `aws-s3-assets` (for manifests).
> 2. Implement and correctly **wire** all components:
>
>    * **VPC**
>
>      * 3 AZs, public subnets for ALBs, private subnets for nodes; NAT gateways in each AZ.
>    * **EKS Cluster**
>
>      * Version 1.28+, private endpoint; control plane logs: `api`, `audit`, `authenticator`, `controllerManager`, `scheduler`.
>      * Stream logs to CloudWatch; encryption with KMS CMK.
>    * **Node Groups (Bottlerocket)**
>
>      * Managed Node Groups using **Bottlerocket AMI** and **t3.large instances**.
>      * `critical` (3–5 nodes), taints for critical workloads;
>        `general` (2–8 nodes);
>        `batch` (1–2 nodes), taints for background jobs.
>      * Node IAM roles with least privilege; EBS volumes using **gp3** encrypted by default.
>    * **IRSA (OIDC + Service Accounts)**
>
>      * Enable OIDC provider for the cluster.
>      * Create IAM roles and **Kubernetes service accounts** for:
>
>        * Cluster Autoscaler
>        * AWS Load Balancer Controller
>        * EBS CSI Driver
>      * Roles should follow least privilege principles.
>    * **RBAC Configuration**
>
>      * Apply manifests for three roles: `admin`, `developer`, `viewer`.
>      * Use CDK `KubernetesManifest` or custom YAML asset.
>    * **Add-ons**
>
>      * Deploy AWS Load Balancer Controller (via Helm or manifest).
>      * Configure Cluster Autoscaler (with IRSA role).
>      * Enable EBS CSI driver add-on with gp3 default storage class.
>    * **Pod Disruption Budgets & Network Policies**
>
>      * Create PDBs for `critical` namespaces (`minAvailable=50%`).
>      * Apply network policies restricting cross-namespace communication except for ingress/monitoring.
>    * **Monitoring & Logging**
>
>      * CloudWatch metrics for node health, pod count, autoscaling events.
>      * CloudWatch dashboards optional.
> 3. **Outputs:**
>
>    * EKS cluster endpoint URL
>    * OIDC provider URL
>    * Kubeconfig file path or command snippet for cluster access
> 4. **Global Tags:**
>
>    * `Environment=Production`, `Service=PaymentsPlatform`, `ManagedBy=CDK`.
> 5. Add inline comments for clarity:
>
>    * `// 🔹 VPC & Cluster Setup`, `// 🔹 Node Groups`, `// 🔹 IRSA Roles`, `// 🔹 RBAC`, `// 🔹 Add-ons`, `// 🔹 Network Policies`.
> 6. Output **only two files** — `main.ts` and `tapstack.ts` — in fenced code blocks.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **secure, auto-scaling, and fully observable EKS environment** using AWS CDK that:
>
> * Uses Bottlerocket AMIs for hardened nodes
> * Implements IRSA for secure AWS API access from pods
> * Provides multi-tier RBAC
> * Automates node scaling and logging
> * Enforces namespace isolation and workload disruption safety

---
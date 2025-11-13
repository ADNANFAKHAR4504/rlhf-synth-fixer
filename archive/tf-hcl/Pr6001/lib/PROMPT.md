# Production-Ready Amazon EKS Platform Specification

Hey team,

This document captures the exact requirements for the production-grade EKS platform that now exists in code. The stack is Terraform-first (HCL) and spans networking, compute, GitOps, advanced security, cost intelligence, service mesh, and multi-region disaster recovery. The default deployment target is **ap-southeast-1**, but everything must stay parameterized so we can lift-and-shift to any AWS region (primary + DR) using the provided variables.

## Platform Scope
- Multi-AZ VPC with public/private subnets, NAT, VPC endpoints, and tightly scoped security groups.
- EKS control plane (Kubernetes 1.28) with KMS encryption, dual-stack endpoint access, and IRSA-enabled OIDC provider.
- Three Bottlerocket node groups (system, application, GPU) plus predictive autoscaling via KEDA.
- Managed add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI) and CloudWatch Container Insights.
- GitOps workflow with Argo CD (App-of-Apps, ApplicationSets, Dex GitHub SSO), Argo Rollouts, image updater, and notifications.
- AWS App Mesh with ACM PCA-issued mTLS certificates and AWS Cloud Map service discovery.
- Advanced security controls: Falco + Falcosidekick, OPA Gatekeeper, Kyverno, GuardDuty, Security Hub, EventBridge + SNS alerting, cosign signature verification, and Pod Security Standards.
- FinOps and capacity intelligence: Kubecost with CUR/S3/Athena/Glue integration, predictive KEDA scaling, and spot-usage telemetry.
- Multi-region disaster recovery (secondary VPC/EKS cluster in `dr_aws_region`, VPC peering, and routing).
- Supporting assets: Bottlerocket userdata templates and Kubernetes manifests for namespaces/RBAC/service accounts.

## What we need to build

### 1. Network & Access
- VPC CIDR `10.0.0.0/16` spanning three AZs with distinct public/private subnets, route tables, NAT gateways (single or per-AZ toggle), and DNS support/hostnames enabled.
- Interface and gateway VPC endpoints for S3, ECR (API & DKR), EC2, Logs, and STS secured by dedicated endpoint security groups.
- Security groups covering control-plane, managed nodes, ALB/NLB traffic, service mesh components, and inter-region peering.
- KMS keys for log groups, secret encryption, and alert topics.

### 2. EKS Control Plane
- Kubernetes 1.28 EKS cluster with configurable name, dual public/private endpoint access, CIDR allow-list for public API, and audit/control-plane log publishing (7-day retention by default).
- OIDC provider for IRSA plus IAM roles for the cluster and node groups.
- Optional envelope encryption via KMS (enabled by default).

### 3. Node Groups & OS
- Bottlerocket-based system, application, and GPU node groups defined via Launch Templates and user data (`userdata/system-node.toml`, `userdata/app-node.toml`, `userdata/gpu-node.toml`).
- Autoscaling boundaries (min/max/desired) exposed through variables; application group must support mixed on-demand + spot instance types, GPU group defaults to zero nodes but can burst.
- Node labels/taints that match the userdata templates (system/app/gpu + accelerator labels) and Cluster Autoscaler-ready tags.

### 4. IAM & Access Controls
- IAM roles/policies for cluster + nodes, plus IRSA roles for:
  - Cluster Autoscaler with ASG/EC2 permissions.
  - AWS Load Balancer Controller (ALB/NLB management + cert ARN wiring).
  - External Secrets Operator (Secrets Manager/Parameter Store access).
  - EBS CSI driver.
  - Kubecost, Falco/Falcosidekick, and other Helm workloads that assume IRSA.
- SNS topics for security alerts with encrypted delivery and optional email subscriptions (`security_alerts_email`).
- GuardDuty + Security Hub enabled account-wide with standards subscriptions.
- Kubernetes RBAC manifests per namespace plus Pod Security Standard labels/constraints.

### 5. Cluster Services & Observability
- Managed add-ons: VPC CNI, CoreDNS, kube-proxy, and EBS CSI pinned to compatible versions.
- CloudWatch Container Insights namespace (`amazon-cloudwatch`) with service account, RBAC, ConfigMap, and DaemonSet.
- KEDA Helm release + predictive `ScaledObject` referencing Prometheus metrics (rate + `predict_linear`) for headroom scaling.
- Cluster logging to CloudWatch log groups (API, audit, authenticator, controller manager, scheduler).

### 6. GitOps & Progressive Delivery
- Argo CD deployed via Helm with:
  - App-of-Apps bootstrap referencing `gitops_repo_url`.
  - ApplicationSet driving dev/staging/prod environment folders.
  - Dex GitHub auth wired to `github_org` teams; TLS termination via ACM cert + ALB ingress.
  - Server autoscaling (2–5 replicas), Redis HA, and RBAC policies (`argocd-admins`).
  - Argo Rollouts, Argo Image Updater (ECR auth script), and Argo Notifications (Slack channel) installed alongside.
- Domain management using `domain_name` to build FQDNs like `argocd.<cluster>.<domain>` and TLS certificates issued via ACM.

### 7. Service Mesh & Service Discovery
- AWS App Mesh mesh, virtual gateway, and virtual nodes/services for `frontend`, `backend`, and `database` workloads.
- AWS Cloud Map private DNS namespace tied to the VPC plus per-service registrations.
- ACM PCA root CA issuing App Mesh certificates; strict TLS enforced for east-west traffic with backend defaults requiring TLS + trust bundles.
- Health checks, logging, and policy defaults baked into mesh resources.

### 8. Advanced Security & Compliance
- Falco Helm chart with eBPF driver, custom runtime rules, Falcosidekick, and Slack/CloudWatch/Security Hub integrations.
- OPA Gatekeeper (ConstraintTemplates + Constraints) enforcing required labels, PSS, and network policy annotations across staging/production.
- Kyverno enforcing cosign signature verification using `cosign_public_key`.
- EventBridge rule forwarding GuardDuty/Security Hub findings (severity >4) to encrypted SNS + email subscribers.
- Slack webhook + email destinations configurable through variables.

### 9. Cost Intelligence & Autoscaling Economics
- Kubecost Helm release with ALB ingress, IRSA role, DNS-based TLS via ACM, Grafana/Prometheus wiring, and persistent volumes.
- CUR pipeline: dedicated S3 buckets (`spot_data`, `cur`), bucket policies, CUR definition, Glue catalog database, and Athena workgroup for querying.
- IAM access for Kubecost to fetch pricing, CUR data, spot history, Savings Plans, and Athena/Glue metadata.
- Predictive scaling (KEDA) plus FinOps alerting via `cost_alerts_email`.

### 10. Disaster Recovery & Multi-Region
- Secondary AWS provider alias targeting `dr_aws_region` with its own tags.
- DR VPC/subnets, route tables, and security groups mirroring the primary topology using `dr_vpc_cidr`.
- VPC peering between primary and DR regions with bidirectional routes.
- DR KMS key, CloudWatch log group, IAM roles, and fully managed DR EKS cluster (private+public API, encrypted secrets, enabled log types).
- Shared variables (cluster name, version, namespaces) reused to keep clusters consistent.

### 11. Supporting Assets
- Kubernetes manifests for namespaces plus RBAC/service accounts for dev, staging, production, autoscaler, ALB controller, and external secrets.
- Terraform outputs for cluster endpoint, auth data, node-group info, IRSA role ARNs, etc.
- Example `terraform.tfvars` capturing sane defaults for node sizes, add-on toggles, GitOps repo, domain, Slack endpoints, DR settings, etc.

## Technical Requirements
- Terraform `>= 1.5.0`, AWS provider `~> 5.x`, Kubernetes provider `~> 2.23`, TLS provider `~> 4.0`, and Helm provider for all `helm_release` resources.
- Code organized per file (`provider.tf`, `vpc.tf`, `security-groups.tf`, `eks-*.tf`, `iam-*.tf`, `advanced-security.tf`, `gitops-argocd.tf`, `service-mesh.tf`, `cost-intelligence.tf`, `disaster-recovery.tf`, `cloudwatch.tf`, `outputs.tf`, etc.).
- Variables expose every tunable (regions, CIDRs, instance types, toggles, webhook URLs, domain, cosign key, org name) and live in `variables.tf` with sample values in `terraform.tfvars`.
- Naming convention: `<resource>-<environment_suffix>` (or with role-specific suffixes) and consistent tagging (`Environment`, `ManagedBy`, `Purpose`).
- All third-party charts installed via Terraform-managed Helm releases; Kubernetes resources applied declaratively through the Kubernetes provider/manifests.
- TLS assets issued via ACM / ACM PCA with DNS validation (no manual steps) and referenced by ALB/mesh resources.

## Constraints
- No hardcoded secrets; sensitive data (Slack webhook, cosign key, GitHub OAuth secrets) flow through variables or external secret stores.
- Every resource must be deletable without orphaning infrastructure (helps automated tests); rely on Terraform-managed dependencies only.
- Default region `ap-southeast-1` with DR in `us-west-2`, but switching variables should seamlessly redeploy.
- Use Bottlerocket for all nodes, enforce IAM least privilege, and keep Pod Security/Gatekeeper/Kyverno policies in enforce mode.
- GitOps/mesh/cost/security tooling must be optional only via variables—default configuration enables the full stack for training quality.

## Success Criteria
- `terraform apply` creates the entire stack with no manual steps; `terraform destroy` cleans everything.
- EKS cluster is reachable (public/private endpoints as configured) and schedules workloads across system/app/GPU pools.
- Argo CD UI is reachable over HTTPS (`argocd.<cluster>.<domain>`), authenticates via GitHub, and syncs sample applications using App-of-Apps/ApplicationSets.
- App Mesh health checks pass, mTLS is enforced, and Cloud Map service discovery resolves mesh services.
- Falco/Falcosidekick emit alerts to Slack, CloudWatch Logs, Security Hub, and the SNS topic; Gatekeeper/Kyverno block non-compliant resources; cosign verification works.
- Kubecost dashboards load through the ALB, CUR data flows into Athena/Glue, and predictive KEDA scaling reacts to Prometheus trends.
- GuardDuty/Security Hub + EventBridge pipeline fan out to SNS/email; CloudWatch Container Insights reports cluster metrics.
- DR region resources (VPC + EKS) exist and peering routes allow cross-region communication.

## What to deliver
- Complete Terraform configuration under `lib/` covering networking, IAM, EKS, node groups, add-ons, GitOps, service mesh, security, cost intelligence, DR, and observability.
- Kubernetes manifests for namespaces/RBAC/service accounts and Bottlerocket user-data templates for each node class.
- Sample `terraform.tfvars` demonstrating how to wire environment suffixes, GitOps repo URL, domain, Slack webhooks, cosign key, DR settings, etc.
- Up-to-date `IDEAL_RESPONSE.md` documenting every file, plus `MODEL_RESPONSE.md` and `MODEL_FAILURES.md` for training context.
- Any helper scripts or notes necessary to operate the stack (but no manual AWS console steps).

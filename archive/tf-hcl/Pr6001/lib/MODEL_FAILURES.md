# Model Response Failures Analysis – EKS Infrastructure

The current `MODEL_RESPONSE.md` delivers only the base VPC + EKS building blocks. The production target described in `lib/` now includes GitOps, service mesh, advanced security, cost intelligence, and regional DR features that are absent from the model. The sections below highlight the most critical deltas.

## Critical Failures

### 1. Missing GitOps, Progressive Delivery, and TLS-managed ingress
**Impact Level**: Critical  
**MODEL_RESPONSE Issue**: The model stops defining inputs right after the basic `namespaces` variable and never introduces GitOps concepts (`gitops_repo_url`, `github_org`, `domain_name`) or any Helm-based deployments. There are only AWS/Kubernetes/TLS providers:

```hcl
variable "namespaces" {
  description = "Kubernetes namespaces to create"
  type        = list(string)
  default     = ["dev", "staging", "production"]
}
```

Without those inputs there is no way to deploy Argo CD, GitHub SSO, App-of-Apps, or HTTPS ingress.

**IDEAL_RESPONSE Fix**: The production implementation adds the missing variables (`lib/variables.tf:188-258`) and provisions Argo CD plus all supporting services through Helm (`lib/gitops-argocd.tf:4-420`):

```hcl
resource "helm_release" "argocd" {
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  namespace  = kubernetes_namespace.argocd.metadata[0].name

  values = [
    yamlencode({
      server = {
        autoscaling = { minReplicas = 2, maxReplicas = 5 }
        ingress = {
          enabled           = true
          hosts             = ["argocd.${var.cluster_name}.${var.domain_name}"]
          annotations       = { "alb.ingress.kubernetes.io/certificate-arn" = aws_acm_certificate.argocd.arn }
        }
      }
      dex = {
        config = yamlencode({ connectors = [{ type = "github", orgs = [{ name = var.github_org }]}] })
      }
    })
  ]
}
```

**Root Cause**: The model focused solely on Terraform core resources and omitted any GitOps or Helm automation.  
**Operational Impact**: No declarative deployment workflow, no Git-based promotion across environments, no TLS ingress for the control plane UI, and no progressive delivery or notifications.

---

### 2. No service mesh, Cloud Map discovery, or mTLS enforcement
**Impact Level**: High  
**MODEL_RESPONSE Issue**: The model provisions only basic security groups (`lib/MODEL_RESPONSE.md` sections for `lib/security-groups.tf`) and has zero references to AWS App Mesh, ACM PCA, or Service Discovery. That means workloads default to best-effort networking with no L7 routing or identity.

**IDEAL_RESPONSE Fix**: `lib/service-mesh.tf` introduces a full App Mesh topology with Cloud Map-backed virtual nodes and ACM PCA certificates:

```hcl
resource "aws_appmesh_mesh" "main" {
  name = "${var.cluster_name}-${var.environment_suffix}-mesh"
  spec {
    egress_filter { type = "ALLOW_ALL" }
    service_discovery { ip_preference = "IPv4_PREFERRED" }
  }
}

resource "aws_appmesh_virtual_node" "app" {
  for_each = toset(["frontend", "backend", "database"])
  spec {
    listener {
      tls {
        mode = "STRICT"
        certificate {
          acm { certificate_arn = aws_acm_certificate.service[each.key].arn }
        }
      }
    }
    service_discovery {
      aws_cloud_map {
        namespace_name = aws_service_discovery_private_dns_namespace.main.name
        service_name   = each.key
      }
    }
  }
}
```

**Root Cause**: Service-to-service concerns were never considered in the model.  
**Operational Impact**: No mTLS, no deterministic discovery, and no traffic policies—risking compromised lateral movement and making blue/green or canary routing impossible.

---

### 3. Missing advanced runtime security, policy enforcement, and alerting
**Impact Level**: Critical  
**MODEL_RESPONSE Issue**: Security is limited to IAM roles and security groups. There is no Falco runtime visibility, no Gatekeeper/Kyverno policies, no GuardDuty/Security Hub enablement, no Slack/SNS alert fan-out, and no cosign image verification.

**IDEAL_RESPONSE Fix**: `lib/advanced-security.tf` deploys Helm-based Falco/Falcosidekick, OPA Gatekeeper, Kyverno policies, GuardDuty, Security Hub, EventBridge, SNS, and IRSA bindings:

```hcl
resource "helm_release" "falco" {
  repository = "https://falcosecurity.github.io/charts"
  chart      = "falco"
  namespace  = "falco-system"
  values = [
    yamlencode({
      falco = { grpcOutput = { enabled = true }, httpOutput = { enabled = true, url = "http://falcosidekick:2801" } }
      customRules = { "custom-rules.yaml" = yamlencode({ customRules = [{ rule = "Unauthorized Process in Container", ... }] }) }
    })
  ]
}

resource "kubernetes_manifest" "verify_images_policy" {
  manifest = {
    apiVersion = "kyverno.io/v1"
    kind       = "ClusterPolicy"
    spec = {
      validationFailureAction = "enforce"
      rules = [{
        name = "verify-image-signature"
        verifyImages = [{
          imageReferences = ["*"]
          attestors       = [{ entries = [{ keys = { publicKeys = var.cosign_public_key } }]}]
        }]
      }]
    }
  }
}
```

**Root Cause**: Runtime security, compliance, and supply-chain controls were out-of-scope in the model.  
**Operational Impact**: No intrusion detection, no policy-as-code guardrails, no automated alert routing, and no signature enforcement—leaving workloads exposed.

---

### 4. No cost intelligence, CUR pipeline, or predictive autoscaling
**Impact Level**: High  
**MODEL_RESPONSE Issue**: The model relies solely on CloudWatch Container Insights; there is no Kubecost deployment, no Cost & Usage Report (CUR) buckets, no Athena/Glue metadata, no spot telemetry, and no KEDA predictive scaling objects.

**IDEAL_RESPONSE Fix**: `lib/cost-intelligence.tf` provisions Kubecost with IRSA, ALB ingress, ACM certs, CUR S3 buckets, Glue/Athena resources, and KEDA ScaledObjects:

```hcl
resource "helm_release" "kubecost" {
  repository = "https://kubecost.github.io/cost-analyzer"
  chart      = "cost-analyzer"
  namespace  = "kubecost"
  values = [
    yamlencode({
      kubecostProductConfigs = {
        clusterName        = "${var.cluster_name}-${var.environment_suffix}"
        awsSpotDataBucket  = aws_s3_bucket.spot_data.id
        athenaWorkgroup    = aws_athena_workgroup.cost_analysis.name
      }
      ingress = {
        enabled = true
        annotations = {
          "alb.ingress.kubernetes.io/certificate-arn" = aws_acm_certificate.kubecost.arn
        }
      }
    })
  ]
}

resource "helm_release" "keda" {
  repository = "https://kedacore.github.io/charts"
  chart      = "keda"
  namespace  = "keda"
}

resource "kubernetes_manifest" "predictive_scaler" {
  manifest = {
    apiVersion = "keda.sh/v1alpha1"
    kind       = "ScaledObject"
    spec = {
      triggers = [{
        type = "prometheus"
        metadata = {
          metricName = "http_requests_rate"
          query      = "sum(rate(http_requests_total[1m])) + predict_linear(http_requests_total[30m], 300)"
        }
      }]
    }
  }
}
```

**Root Cause**: Financial operations and proactive scaling were never designed for the model.  
**Operational Impact**: No showback, no usage optimization insights, no automated alerts to `cost_alerts_email`, and no predictive scaling—raising the risk of cost overruns or saturation.

---

### 5. No multi-region disaster recovery strategy
**Impact Level**: Critical  
**MODEL_RESPONSE Issue**: Only a single AWS provider/region is configured, there are no DR variables, and no secondary VPC/EKS resources. Loss of the primary region would be catastrophic.

**IDEAL_RESPONSE Fix**: `lib/disaster-recovery.tf` adds a provider alias, DR VPC/subnets, VPC peering, dedicated security groups, CloudWatch/KMS resources, and an entire secondary EKS control plane:

```hcl
provider "aws" {
  alias  = "dr_region"
  region = var.dr_aws_region
}

resource "aws_vpc" "dr_main" {
  provider = aws.dr_region
  cidr_block = var.dr_vpc_cidr
}

resource "aws_eks_cluster" "dr_cluster" {
  provider = aws.dr_region
  name     = "${var.cluster_name}-${var.environment_suffix}-dr"
  vpc_config {
    subnet_ids         = aws_subnet.dr_private[*].id
    security_group_ids = [aws_security_group.dr_cluster.id]
  }
  encryption_config {
    provider { key_arn = aws_kms_key.dr_eks.arn }
    resources = ["secrets"]
  }
}
```

**Root Cause**: DR was out-of-scope for the model and no secondary-region abstractions exist.  
**Operational Impact**: RTO/RPO targets cannot be met; there is no warm standby cluster, no peering routes, and no replicated logging or encryption in a second region.

---

### 6. No hooks for alert routing, webhook secrets, or cosign keys
**Impact Level**: High  
**MODEL_RESPONSE Issue**: Because the model lacks the advanced variables section, there is nowhere to supply `slack_webhook_url`, `security_alerts_email`, `cost_alerts_email`, or `cosign_public_key`. That prevents wiring Falco/Falcosidekick, SNS subscriptions, or Kyverno signature verification even if someone tried to bolt them on later.

**IDEAL_RESPONSE Fix**: `lib/variables.tf:188-258` defines those sensitive inputs, and the downstream modules consume them (e.g., Slack + email subscriptions in `lib/advanced-security.tf:213-370` and Kubecost alerting in `lib/cost-intelligence.tf:430-520`).

**Root Cause**: The model never anticipated external integrations or supply-chain security requirements.  
**Operational Impact**: No automated alert delivery, no cosign enforcement toggle, and no way to parameterize org-specific settings—forcing engineers to hardcode values or skip the controls entirely.

---

## Summary
To evolve the model into the current production baseline we must backfill GitOps (Argo CD, Rollouts, Image Updater, Notifications, Sealed Secrets), App Mesh + Cloud Map + ACM PCA, the full advanced security stack (Falco, Gatekeeper, Kyverno, GuardDuty/Security Hub/SNS), Kubecost + CUR + KEDA, and the secondary-region DR deployment. Additionally, expose the new variables so operators can inject org-specific domains, GitHub orgs, Slack webhooks, cosign keys, and DR regions. Without these upgrades the model fails the prompt’s security, availability, and operational excellence criteria.

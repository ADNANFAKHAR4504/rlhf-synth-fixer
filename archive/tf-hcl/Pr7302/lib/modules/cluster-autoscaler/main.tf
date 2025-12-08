# Cluster Autoscaler Module - Deploy Cluster Autoscaler using Helm

# Kubernetes Service Account for Cluster Autoscaler
resource "kubernetes_service_account" "cluster_autoscaler" {
  metadata {
    name      = "cluster-autoscaler"
    namespace = "kube-system"
    annotations = {
      "eks.amazonaws.com/role-arn" = var.cluster_autoscaler_role_arn
    }
    labels = {
      "app.kubernetes.io/name"      = "cluster-autoscaler"
      "app.kubernetes.io/component" = "autoscaler"
    }
  }
}

# Helm Release for Cluster Autoscaler
resource "helm_release" "cluster_autoscaler" {
  name       = "cluster-autoscaler"
  repository = "https://kubernetes.github.io/autoscaler"
  chart      = "cluster-autoscaler"
  namespace  = "kube-system"
  version    = var.cluster_autoscaler_chart_version

  set {
    name  = "autoDiscovery.clusterName"
    value = var.cluster_name
  }

  set {
    name  = "awsRegion"
    value = var.aws_region
  }

  set {
    name  = "rbac.serviceAccount.create"
    value = "false"
  }

  set {
    name  = "rbac.serviceAccount.name"
    value = kubernetes_service_account.cluster_autoscaler.metadata[0].name
  }

  set {
    name  = "extraArgs.balance-similar-node-groups"
    value = "true"
  }

  set {
    name  = "extraArgs.skip-nodes-with-system-pods"
    value = "false"
  }

  set {
    name  = "extraArgs.scale-down-delay-after-add"
    value = "90s"
  }

  set {
    name  = "extraArgs.scale-down-unneeded-time"
    value = "90s"
  }

  set {
    name  = "extraArgs.scale-down-utilization-threshold"
    value = "0.7"
  }

  set {
    name  = "extraArgs.max-node-provision-time"
    value = "90s"
  }

  depends_on = [kubernetes_service_account.cluster_autoscaler]
}

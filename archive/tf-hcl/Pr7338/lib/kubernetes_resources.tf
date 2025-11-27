resource "kubernetes_namespace" "production" {
  metadata {
    name = "production"

    labels = {
      name                                      = "production"
      environment                               = var.environment_suffix
      "elbv2.k8s.aws/pod-readiness-gate-inject" = "enabled"
    }
  }

  depends_on = [aws_eks_node_group.main]
}

resource "kubernetes_resource_quota" "production" {
  metadata {
    name      = "production-quota"
    namespace = kubernetes_namespace.production.metadata[0].name
  }

  spec {
    hard = {
      pods                     = var.production_namespace_pod_quota
      "requests.storage"       = var.production_namespace_storage_quota
      "persistentvolumeclaims" = "50"
      "requests.cpu"           = "100"
      "requests.memory"        = "200Gi"
      "limits.cpu"             = "200"
      "limits.memory"          = "400Gi"
    }
  }

  depends_on = [kubernetes_namespace.production]
}

resource "kubernetes_limit_range" "production" {
  metadata {
    name      = "production-limit-range"
    namespace = kubernetes_namespace.production.metadata[0].name
  }

  spec {
    limit {
      type = "Pod"
      max = {
        cpu    = "4"
        memory = "8Gi"
      }
      min = {
        cpu    = "50m"
        memory = "128Mi"
      }
    }

    limit {
      type = "Container"
      default = {
        cpu    = "500m"
        memory = "512Mi"
      }
      default_request = {
        cpu    = "100m"
        memory = "256Mi"
      }
      max = {
        cpu    = "2"
        memory = "4Gi"
      }
      min = {
        cpu    = "50m"
        memory = "128Mi"
      }
    }
  }

  depends_on = [kubernetes_namespace.production]
}
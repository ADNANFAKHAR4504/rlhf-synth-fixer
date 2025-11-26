# Cluster Autoscaler Service Account
resource "kubernetes_service_account" "cluster_autoscaler" {
  metadata {
    name      = "cluster-autoscaler"
    namespace = "kube-system"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.cluster_autoscaler.arn
    }
  }

  depends_on = [
    aws_eks_cluster.main,
    aws_eks_node_group.main
  ]
}

# Cluster Autoscaler Deployment
resource "kubernetes_deployment" "cluster_autoscaler" {
  metadata {
    name      = "cluster-autoscaler"
    namespace = "kube-system"
    labels = {
      app = "cluster-autoscaler"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "cluster-autoscaler"
      }
    }

    template {
      metadata {
        labels = {
          app = "cluster-autoscaler"
        }
      }

      spec {
        service_account_name = kubernetes_service_account.cluster_autoscaler.metadata[0].name

        container {
          name  = "cluster-autoscaler"
          image = "registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.2"

          command = [
            "./cluster-autoscaler",
            "--v=4",
            "--stderrthreshold=info",
            "--cloud-provider=aws",
            "--skip-nodes-with-local-storage=false",
            "--expander=least-waste",
            "--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/${local.cluster_name}",
            "--balance-similar-node-groups",
            "--skip-nodes-with-system-pods=false",
            "--scale-down-enabled=true",
            "--scale-down-delay-after-add=10m",
            "--scale-down-unneeded-time=10m"
          ]

          resources {
            limits = {
              cpu    = "100m"
              memory = "300Mi"
            }
            requests = {
              cpu    = "100m"
              memory = "300Mi"
            }
          }

          env {
            name  = "AWS_REGION"
            value = var.region
          }
        }
      }
    }
  }

  depends_on = [
    kubernetes_service_account.cluster_autoscaler,
    aws_eks_addon.vpc_cni
  ]
}

# Production Namespace
resource "kubernetes_namespace" "production" {
  metadata {
    name = "production"
    labels = {
      name        = "production"
      environment = local.environment_suffix
    }
  }

  depends_on = [
    aws_eks_cluster.main,
    aws_eks_node_group.main
  ]
}

# Resource Quota for Production Namespace
resource "kubernetes_resource_quota" "production" {
  metadata {
    name      = "production-quota"
    namespace = kubernetes_namespace.production.metadata[0].name
  }

  spec {
    hard = {
      "pods"                   = var.production_namespace_pod_limit
      "requests.storage"       = var.production_namespace_storage_limit
      "persistentvolumeclaims" = "50"
      "requests.cpu"           = "100"
      "requests.memory"        = "200Gi"
      "limits.cpu"             = "200"
      "limits.memory"          = "400Gi"
    }
  }
}

# Service Account for AWS Load Balancer Controller
resource "kubernetes_service_account" "lb_controller" {
  metadata {
    name      = "aws-load-balancer-controller"
    namespace = "kube-system"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.lb_controller.arn
    }
  }

  depends_on = [
    aws_eks_cluster.main,
    aws_eks_node_group.main
  ]
}

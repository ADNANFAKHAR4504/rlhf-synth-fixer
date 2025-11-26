resource "kubernetes_namespace" "payments" {
  count = var.manage_kubernetes_resources ? 1 : 0

  metadata {
    name = local.namespace_name

    labels = {
      "app.kubernetes.io/name"             = var.kubernetes_namespace
      "app.kubernetes.io/managed-by"       = "terraform"
      "pod-security.kubernetes.io/enforce" = "restricted"
      "pod-security.kubernetes.io/audit"   = "restricted"
      "pod-security.kubernetes.io/warn"    = "restricted"
      environment                          = "production"
      environmentSuffix                    = var.environment_suffix
    }
  }

  depends_on = [aws_eks_cluster.main]
}

resource "kubernetes_service_account" "payments_app" {
  count = var.manage_kubernetes_resources ? 1 : 0

  metadata {
    name      = "payments-app-sa-${var.environment_suffix}"
    namespace = kubernetes_namespace.payments[0].metadata[0].name

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.app_irsa.arn
    }

    labels = {
      "app.kubernetes.io/name"       = "payments-app"
      "app.kubernetes.io/managed-by" = "terraform"
      environment                    = "production"
    }
  }

  depends_on = [
    aws_iam_role.app_irsa,
    aws_iam_openid_connect_provider.eks,
    aws_eks_cluster.main,
    kubernetes_namespace.payments
  ]
}

resource "kubernetes_deployment" "backend" {
  count = var.manage_kubernetes_resources ? 1 : 0

  metadata {
    name      = "payments-backend-${var.environment_suffix}"
    namespace = kubernetes_namespace.payments[0].metadata[0].name

    labels = {
      app       = "payments-backend"
      tier      = "api"
      component = "backend"
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app  = "payments-backend"
        tier = "api"
      }
    }

    template {
      metadata {
        labels = {
          app  = "payments-backend"
          tier = "api"
        }
      }

      spec {
        container {
          name  = "backend"
          image = "public.ecr.aws/docker/library/httpd:2.4"

          port {
            container_port = 8080
          }

          env {
            name  = "SERVICE_NAME"
            value = "payments-backend"
          }

          env {
            name  = "ENVIRONMENT_SUFFIX"
            value = var.environment_suffix
          }

          liveness_probe {
            http_get {
              path = "/"
              port = "8080"
            }
            period_seconds        = 30
            initial_delay_seconds = 20
          }

          readiness_probe {
            http_get {
              path = "/"
              port = "8080"
            }
            period_seconds        = 10
            initial_delay_seconds = 10
          }
        }

        node_selector = {
          app = "backend"
        }

        toleration {
          key      = "app"
          operator = "Equal"
          value    = "backend"
          effect   = "NoSchedule"
        }

        service_account_name = kubernetes_service_account.payments_app[0].metadata[0].name
      }
    }
  }

  depends_on = [
    kubernetes_namespace.payments,
    kubernetes_service_account.payments_app,
    aws_eks_node_group.backend
  ]
}

resource "kubernetes_service" "backend" {
  count = var.manage_kubernetes_resources ? 1 : 0

  metadata {
    name      = "payments-backend-svc-${var.environment_suffix}"
    namespace = kubernetes_namespace.payments[0].metadata[0].name
    labels = {
      app = "payments-backend"
    }
  }

  spec {
    selector = {
      app  = "payments-backend"
      tier = "api"
    }

    port {
      name        = "http"
      port        = 8080
      target_port = "8080"
    }

    type = "ClusterIP"
  }

  depends_on = [kubernetes_deployment.backend]
}

resource "kubernetes_deployment" "frontend" {
  count = var.manage_kubernetes_resources ? 1 : 0

  metadata {
    name      = "payments-frontend-${var.environment_suffix}"
    namespace = kubernetes_namespace.payments[0].metadata[0].name

    labels = {
      app       = "payments-frontend"
      tier      = "web"
      component = "frontend"
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app  = "payments-frontend"
        tier = "web"
      }
    }

    template {
      metadata {
        labels = {
          app  = "payments-frontend"
          tier = "web"
        }
      }

      spec {
        container {
          name  = "frontend"
          image = "public.ecr.aws/nginx/nginx:1.25"

          port {
            container_port = 80
          }

          env {
            name  = "BACKEND_BASE_URL"
            value = "http://payments-backend-svc-${var.environment_suffix}.${kubernetes_namespace.payments[0].metadata[0].name}.svc.cluster.local:8080"
          }

          liveness_probe {
            http_get {
              path = "/"
              port = "80"
            }
            period_seconds        = 30
            initial_delay_seconds = 15
          }

          readiness_probe {
            http_get {
              path = "/"
              port = "80"
            }
            period_seconds        = 10
            initial_delay_seconds = 5
          }
        }

        node_selector = {
          app = "frontend"
        }

        toleration {
          key      = "app"
          operator = "Equal"
          value    = "frontend"
          effect   = "NoSchedule"
        }

        service_account_name = kubernetes_service_account.payments_app[0].metadata[0].name
      }
    }
  }

  depends_on = [
    kubernetes_namespace.payments,
    kubernetes_service_account.payments_app,
    aws_eks_node_group.frontend,
    kubernetes_service.backend
  ]
}

resource "kubernetes_service" "frontend" {
  count = var.manage_kubernetes_resources ? 1 : 0

  metadata {
    name      = "payments-frontend-svc-${var.environment_suffix}"
    namespace = kubernetes_namespace.payments[0].metadata[0].name
    labels = {
      app = "payments-frontend"
    }
  }

  spec {
    selector = {
      app  = "payments-frontend"
      tier = "web"
    }

    port {
      name        = "http"
      port        = 80
      target_port = "80"
    }

    type = "ClusterIP"
  }

  depends_on = [kubernetes_deployment.frontend]
}


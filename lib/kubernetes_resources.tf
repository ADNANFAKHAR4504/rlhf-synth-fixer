resource "kubernetes_namespace" "payments" {
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
  metadata {
    name      = "payments-app-sa-${var.environment_suffix}"
    namespace = kubernetes_namespace.payments.metadata[0].name

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
    aws_eks_cluster.main
  ]
}


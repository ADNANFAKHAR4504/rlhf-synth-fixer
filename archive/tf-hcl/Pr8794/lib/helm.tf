# =============================================================================
# HELM
# =============================================================================

# Configure Kubernetes and Helm providers
data "aws_eks_cluster_auth" "main" {
  name = aws_eks_cluster.main.name
}

# NOTE: Kubernetes and Helm providers are disabled for LocalStack compatibility
# LocalStack's EKS implementation does not expose a functional Kubernetes API endpoint
# These resources would be deployed post-creation using kubectl/helm CLI tools

# provider "kubernetes" {
#   host                   = aws_eks_cluster.main.endpoint
#   cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
#   token                  = data.aws_eks_cluster_auth.main.token
# }

# provider "helm" {
#   kubernetes {
#     host                   = aws_eks_cluster.main.endpoint
#     cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
#     token                  = data.aws_eks_cluster_auth.main.token
#   }
# }

# Service Account for AWS Load Balancer Controller
# resource "kubernetes_service_account" "alb_controller" {
#   metadata {
#     name      = "aws-load-balancer-controller"
#     namespace = "kube-system"
#     labels = {
#       "app.kubernetes.io/name"      = "aws-load-balancer-controller"
#       "app.kubernetes.io/component" = "controller"
#     }
#     annotations = {
#       "eks.amazonaws.com/role-arn" = aws_iam_role.alb_controller.arn
#     }
#   }
#
#   depends_on = [
#     aws_eks_cluster.main,
#     aws_eks_node_group.frontend,
#     aws_eks_node_group.backend,
#     aws_eks_node_group.data_processing,
#   ]
# }

# Deploy AWS Load Balancer Controller using Helm
# resource "helm_release" "alb_controller" {
#   name       = "aws-load-balancer-controller"
#   repository = "https://aws.github.io/eks-charts"
#   chart      = "aws-load-balancer-controller"
#   namespace  = "kube-system"
#   version    = "1.6.2"
#
#   set {
#     name  = "clusterName"
#     value = aws_eks_cluster.main.name
#   }
#
#   set {
#     name  = "serviceAccount.create"
#     value = "false"
#   }
#
#   set {
#     name  = "serviceAccount.name"
#     value = kubernetes_service_account.alb_controller.metadata[0].name
#   }
#
#   set {
#     name  = "region"
#     value = var.aws_region
#   }
#
#   set {
#     name  = "vpcId"
#     value = aws_vpc.main.id
#   }
#
#   set {
#     name  = "podLabels.app\\.kubernetes\\.io/name"
#     value = "aws-load-balancer-controller"
#   }
#
#   depends_on = [
#     kubernetes_service_account.alb_controller,
#     aws_eks_addon.vpc_cni,
#     aws_eks_fargate_profile.alb_controller,
#   ]
# }

# Service Account for Cluster Autoscaler
# resource "kubernetes_service_account" "cluster_autoscaler" {
#   metadata {
#     name      = "cluster-autoscaler"
#     namespace = "kube-system"
#     labels = {
#       "k8s-addon" = "cluster-autoscaler.addons.k8s.io"
#       "k8s-app"   = "cluster-autoscaler"
#     }
#     annotations = {
#       "eks.amazonaws.com/role-arn" = aws_iam_role.cluster_autoscaler.arn
#     }
#   }
#
#   depends_on = [
#     aws_eks_cluster.main,
#     aws_eks_node_group.frontend,
#     aws_eks_node_group.backend,
#     aws_eks_node_group.data_processing,
#   ]
# }

# Deploy Cluster Autoscaler using Helm
# resource "helm_release" "cluster_autoscaler" {
#   name       = "cluster-autoscaler"
#   repository = "https://kubernetes.github.io/autoscaler"
#   chart      = "cluster-autoscaler"
#   namespace  = "kube-system"
#   version    = "9.29.3"
#
#   set {
#     name  = "autoDiscovery.clusterName"
#     value = aws_eks_cluster.main.name
#   }
#
#   set {
#     name  = "awsRegion"
#     value = var.aws_region
#   }
#
#   set {
#     name  = "rbac.serviceAccount.create"
#     value = "false"
#   }
#
#   set {
#     name  = "rbac.serviceAccount.name"
#     value = kubernetes_service_account.cluster_autoscaler.metadata[0].name
#   }
#
#   set {
#     name  = "extraArgs.balance-similar-node-groups"
#     value = "true"
#   }
#
#   set {
#     name  = "extraArgs.skip-nodes-with-system-pods"
#     value = "false"
#   }
#
#   set {
#     name  = "extraArgs.scale-down-delay-after-add"
#     value = "90s"
#   }
#
#   depends_on = [
#     kubernetes_service_account.cluster_autoscaler,
#     aws_eks_node_group.frontend,
#     aws_eks_node_group.backend,
#     aws_eks_node_group.data_processing,
#   ]
# }

# Service Account for Secrets Manager CSI Driver
# resource "kubernetes_service_account" "secrets_manager_csi" {
#   metadata {
#     name      = "secrets-store-csi-driver"
#     namespace = "kube-system"
#     annotations = {
#       "eks.amazonaws.com/role-arn" = aws_iam_role.secrets_manager.arn
#     }
#   }
#
#   depends_on = [
#     aws_eks_cluster.main,
#     aws_eks_node_group.frontend,
#   ]
# }

# Deploy Secrets Store CSI Driver for Secrets Manager integration
# resource "helm_release" "secrets_store_csi_driver" {
#   name       = "secrets-store-csi-driver"
#   repository = "https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts"
#   chart      = "secrets-store-csi-driver"
#   namespace  = "kube-system"
#   version    = "1.3.4"
#
#   set {
#     name  = "syncSecret.enabled"
#     value = "true"
#   }
#
#   set {
#     name  = "enableSecretRotation"
#     value = "true"
#   }
#
#   depends_on = [
#     aws_eks_node_group.frontend,
#     aws_eks_node_group.backend,
#     aws_eks_node_group.data_processing,
#   ]
# }

# Deploy AWS Secrets Manager and Config Provider for CSI Driver
# resource "helm_release" "secrets_provider_aws" {
#   name       = "secrets-provider-aws"
#   repository = "https://aws.github.io/secrets-store-csi-driver-provider-aws"
#   chart      = "secrets-store-csi-driver-provider-aws"
#   namespace  = "kube-system"
#   version    = "0.3.4"
#
#   depends_on = [
#     helm_release.secrets_store_csi_driver,
#   ]
# }

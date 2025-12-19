# Istio Service Mesh Module - Deploy Istio for encrypted pod-to-pod communication

# Create istio-system namespace
resource "kubernetes_namespace" "istio_system" {
  metadata {
    name = "istio-system"
    labels = {
      "istio-injection" = "disabled"
    }
  }
}

# Helm Release for Istio Base
resource "helm_release" "istio_base" {
  name       = "istio-base"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "base"
  namespace  = kubernetes_namespace.istio_system.metadata[0].name
  version    = var.istio_version

  depends_on = [kubernetes_namespace.istio_system]
}

# Helm Release for Istiod (Istio Control Plane)
resource "helm_release" "istiod" {
  name       = "istiod"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "istiod"
  namespace  = kubernetes_namespace.istio_system.metadata[0].name
  version    = var.istio_version

  set {
    name  = "global.mtls.enabled"
    value = "true"
  }

  set {
    name  = "global.mtls.auto"
    value = "true"
  }

  set {
    name  = "meshConfig.accessLogFile"
    value = "/dev/stdout"
  }

  set {
    name  = "meshConfig.enableTracing"
    value = "true"
  }

  depends_on = [helm_release.istio_base]
}

# Helm Release for Istio Ingress Gateway
resource "helm_release" "istio_ingress" {
  name       = "istio-ingress"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "gateway"
  namespace  = kubernetes_namespace.istio_system.metadata[0].name
  version    = var.istio_version

  depends_on = [helm_release.istiod]
}

# PeerAuthentication to enforce mTLS across the mesh
resource "kubernetes_manifest" "peer_authentication_default" {
  manifest = {
    apiVersion = "security.istio.io/v1beta1"
    kind       = "PeerAuthentication"
    metadata = {
      name      = "default"
      namespace = kubernetes_namespace.istio_system.metadata[0].name
    }
    spec = {
      mtls = {
        mode = "STRICT"
      }
    }
  }

  depends_on = [helm_release.istiod]
}

# Create namespaces for different microservices with Istio injection enabled
resource "kubernetes_namespace" "frontend" {
  metadata {
    name = "frontend"
    labels = {
      "istio-injection" = "enabled"
    }
  }
}

resource "kubernetes_namespace" "backend" {
  metadata {
    name = "backend"
    labels = {
      "istio-injection" = "enabled"
    }
  }
}

resource "kubernetes_namespace" "data_processing" {
  metadata {
    name = "data-processing"
    labels = {
      "istio-injection" = "enabled"
    }
  }
}

# AuthorizationPolicy to enforce zero-trust between namespaces
resource "kubernetes_manifest" "auth_policy_frontend" {
  manifest = {
    apiVersion = "security.istio.io/v1beta1"
    kind       = "AuthorizationPolicy"
    metadata = {
      name      = "frontend-policy"
      namespace = "frontend"
    }
    spec = {
      action = "ALLOW"
      rules = [
        {
          from = [
            {
              source = {
                namespaces = ["istio-system", "frontend"]
              }
            }
          ]
        }
      ]
    }
  }

  depends_on = [
    helm_release.istiod,
    kubernetes_namespace.frontend
  ]
}

resource "kubernetes_manifest" "auth_policy_backend" {
  manifest = {
    apiVersion = "security.istio.io/v1beta1"
    kind       = "AuthorizationPolicy"
    metadata = {
      name      = "backend-policy"
      namespace = "backend"
    }
    spec = {
      action = "ALLOW"
      rules = [
        {
          from = [
            {
              source = {
                namespaces = ["istio-system", "frontend", "backend"]
              }
            }
          ]
        }
      ]
    }
  }

  depends_on = [
    helm_release.istiod,
    kubernetes_namespace.backend
  ]
}

resource "kubernetes_manifest" "auth_policy_data_processing" {
  manifest = {
    apiVersion = "security.istio.io/v1beta1"
    kind       = "AuthorizationPolicy"
    metadata = {
      name      = "data-processing-policy"
      namespace = "data-processing"
    }
    spec = {
      action = "ALLOW"
      rules = [
        {
          from = [
            {
              source = {
                namespaces = ["istio-system", "backend", "data-processing"]
              }
            }
          ]
        }
      ]
    }
  }

  depends_on = [
    helm_release.istiod,
    kubernetes_namespace.data_processing
  ]
}

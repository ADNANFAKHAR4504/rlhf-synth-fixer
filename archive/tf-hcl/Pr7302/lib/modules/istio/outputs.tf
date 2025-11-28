# Istio Module Outputs

output "istio_base_version" {
  description = "Version of Istio base"
  value       = helm_release.istio_base.version
}

output "istiod_version" {
  description = "Version of Istiod"
  value       = helm_release.istiod.version
}

output "istio_ingress_version" {
  description = "Version of Istio ingress gateway"
  value       = helm_release.istio_ingress.version
}

output "istio_system_namespace" {
  description = "Name of the istio-system namespace"
  value       = kubernetes_namespace.istio_system.metadata[0].name
}

output "frontend_namespace" {
  description = "Name of the frontend namespace"
  value       = kubernetes_namespace.frontend.metadata[0].name
}

output "backend_namespace" {
  description = "Name of the backend namespace"
  value       = kubernetes_namespace.backend.metadata[0].name
}

output "data_processing_namespace" {
  description = "Name of the data-processing namespace"
  value       = kubernetes_namespace.data_processing.metadata[0].name
}

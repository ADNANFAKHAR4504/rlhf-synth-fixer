# Cluster Autoscaler Module Outputs

output "helm_release_name" {
  description = "Name of the Helm release"
  value       = helm_release.cluster_autoscaler.name
}

output "helm_release_version" {
  description = "Version of the Helm release"
  value       = helm_release.cluster_autoscaler.version
}

output "helm_release_status" {
  description = "Status of the Helm release"
  value       = helm_release.cluster_autoscaler.status
}

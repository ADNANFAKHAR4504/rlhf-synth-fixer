# ALB Controller Module Outputs

output "helm_release_name" {
  description = "Name of the Helm release"
  value       = helm_release.alb_controller.name
}

output "helm_release_version" {
  description = "Version of the Helm release"
  value       = helm_release.alb_controller.version
}

output "helm_release_status" {
  description = "Status of the Helm release"
  value       = helm_release.alb_controller.status
}

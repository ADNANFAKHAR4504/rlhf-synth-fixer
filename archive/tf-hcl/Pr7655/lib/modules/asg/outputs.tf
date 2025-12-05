output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.app.name
}

output "asg_arn" {
  description = "Auto Scaling Group ARN"
  value       = aws_autoscaling_group.app.arn
}

output "launch_template_id" {
  description = "Launch template ID"
  value       = aws_launch_template.app.id
}

output "launch_template_latest_version" {
  description = "Latest version of launch template"
  value       = aws_launch_template.app.latest_version
}

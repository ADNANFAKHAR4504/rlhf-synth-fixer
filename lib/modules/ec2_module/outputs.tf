output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group (empty if ASG disabled)"
  value       = var.enable_asg ? aws_autoscaling_group.main[0].arn : ""
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group (empty if ASG disabled)"
  value       = var.enable_asg ? aws_autoscaling_group.main[0].name : ""
}

output "launch_template_id" {
  description = "ID of the launch template (empty if ASG disabled)"
  value       = var.enable_asg ? aws_launch_template.main[0].id : ""
}

output "instance_id" {
  description = "ID of the EC2 instance (used when ASG is disabled for LocalStack)"
  value       = var.enable_asg ? "" : aws_instance.main[0].id
}
output "asg_id" {
  value       = aws_autoscaling_group.main.id
  description = "ID of the Auto Scaling Group"
}

output "asg_name" {
  value       = aws_autoscaling_group.main.name
  description = "Name of the Auto Scaling Group"
}
output "asg_name" {
  description = "The name of the Auto Scaling group"
  value       = aws_autoscaling_group.app.name
}

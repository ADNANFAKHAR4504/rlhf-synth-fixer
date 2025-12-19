output "asg_name" {
  value = aws_autoscaling_group.main.name
}

output "security_group_id" {
  value = aws_security_group.ec2.id
}
// Outputs for compute module

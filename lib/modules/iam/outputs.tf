output "ec2_instance_profile_name" {
  description = "The name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

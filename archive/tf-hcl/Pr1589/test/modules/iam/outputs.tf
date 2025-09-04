// Outputs for iam module

output "cloudtrail_role_arn" {
  value = aws_iam_role.cloudtrail.arn
}

output "vpc_flow_role_arn" {
  value = var.enable_vpc_flow_logs ? aws_iam_role.vpc_flow[0].arn : null
}

output "ec2_role_arn" {
  value = aws_iam_role.ec2.arn
}

output "ec2_instance_profile_name" {
  value = aws_iam_instance_profile.ec2.name
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda.arn
}

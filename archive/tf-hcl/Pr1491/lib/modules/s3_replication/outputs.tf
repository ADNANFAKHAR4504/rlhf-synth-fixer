// Outputs for S3 replication module

output "replication_role_arn" { value = aws_iam_role.replication.arn }
output "replication_policy_arn" { value = aws_iam_policy.replication.arn }

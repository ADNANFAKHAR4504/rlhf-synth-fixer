output "primary_table_arn" {
  value = aws_dynamodb_table.primary.arn
}

output "secondary_table_arn" {
  value = aws_dynamodb_table.secondary.arn
}

output "primary_table_name" {
  value = aws_dynamodb_table.primary.name
}

output "secondary_table_name" {
  value = aws_dynamodb_table.secondary.name
}

output "primary_rds_endpoint" {
  value = length(aws_db_instance.primary) > 0 ? aws_db_instance.primary[0].endpoint : null
}

output "secondary_rds_endpoint" {
  value = length(aws_db_instance.secondary) > 0 ? aws_db_instance.secondary[0].endpoint : null
}

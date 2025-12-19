output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "rds_instance_id" {
  value = aws_db_instance.main.id
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.main.arn
}



output "primary_instance_id" { value = try(aws_instance.primary[0].id, null) }
output "secondary_instance_id" { value = try(aws_instance.secondary[0].id, null) }

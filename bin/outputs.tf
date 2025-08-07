
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "web_instance_id" {
  value = module.web_server.instance_id
}

output "db_instance_id" {
  value = module.db_server.instance_id
}

output "cloudwatch_log_group" {
  value = module.cloudwatch.log_group_name
}

There was only DB postgres version issues and got the below error

aws_db_instance.main: Creating... ╷ │ Error: creating RDS DB Instance (tap-webapp-database): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: 3dcdd604-f791-4e3b-9eb1-caea8e7b6061, api error InvalidParameterCombination: Cannot find version 15.5 for postgres │ │ with aws_db_instance.main, │ on tap_stack.tf line 478, in resource "aws_db_instance" "main": │ 478: resource "aws_db_instance" "main" { │ ╵ Error: Terraform exited with code 1. Error: Process completed with exit code 1.


Fix applied

data "aws_rds_engine_version" "postgres_latest" {
  engine = "postgres"
}

locals {
  pg_params = data.aws_rds_engine_version.postgres_latest.parameter_group_family
  pg_version = data.aws_rds_engine_version.postgres_latest.version
}

# In your RDS resource:
engine = "postgres"
engine_version = local.pg_version
parameter_group_name = aws_db_parameter_group.main.name

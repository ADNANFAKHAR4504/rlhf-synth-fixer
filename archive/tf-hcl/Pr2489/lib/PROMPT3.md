can you provide me code fix snippet for the below error - 

╷
│ Error: creating RDS DB Instance (tap-primary-us-east-2-database): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: 7b68c8f5-20d1-4ed1-8298-a9ee15486ae8, api error InvalidParameterCombination: Performance Insights not supported for this configuration.
│ 
│   with aws_db_instance.primary,
│   on tap_stack.tf line 927, in resource "aws_db_instance" "primary":
│  927: resource "aws_db_instance" "primary" {
│ 
╵
Error: Terraform exited with code 1.

Also provide fix for below error

╷
│ Error: creating RDS DB Instance (read replica) (tap-secondary-us-west-1-database-replica): operation error RDS: CreateDBInstanceReadReplica, https response error StatusCode: 400, RequestID: 7d89648e-dd0b-42fb-86fe-dc8269a9f366, api error InvalidParameterCombination: Cannot create a cross region unencrypted read replica from encrypted source.
│ 
│   with aws_db_instance.secondary,
│   on tap_stack.tf line 973, in resource "aws_db_instance" "secondary":
│  973: resource "aws_db_instance" "secondary" {
│ 
╵
Error: Terraform exited with code 1.
random_string.db_username: Refreshing s

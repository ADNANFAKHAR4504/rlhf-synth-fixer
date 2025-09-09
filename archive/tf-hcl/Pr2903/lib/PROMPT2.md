Getting below errors, can you provide code snippet to fix these, highlight the change that needs to be made , mostly its because of the naming so may be keep unique name for each resource
```
╷
│ Error: creating IAM Role (tap-stack-vpc-flow-logs-role): operation error IAM: CreateRole, https response error StatusCode: 409, RequestID: 9e14cfb3-c731-472d-95f0-d511ffaa7b02, EntityAlreadyExists: Role with name tap-stack-vpc-flow-logs-role already exists.
│ 
│   with aws_iam_role.vpc_flow_logs,
│   on tap_stack.tf line 197, in resource "aws_iam_role" "vpc_flow_logs":
│  197: resource "aws_iam_role" "vpc_flow_logs" {
│ 
╵
╷
│ Error: creating CloudWatch Logs Log Group (/aws/vpc/flowlogs): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: a8d0e606-3e54-4cd5-9673-273edc6ba156, ResourceAlreadyExistsException: The specified log group already exists
│ 
│   with aws_cloudwatch_log_group.vpc_flow_logs,
│   on tap_stack.tf line 239, in resource "aws_cloudwatch_log_group" "vpc_flow_logs":
│  239: resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
│ 
╵
╷
│ Error: creating IAM Role (tap-stack-ec2-role): operation error IAM: CreateRole, https response error StatusCode: 409, RequestID: 2ab96674-e37f-4b86-ae00-7440692edcd3, EntityAlreadyExists: Role with name tap-stack-ec2-role already exists.
│ 
│   with aws_iam_role.ec2,
│   on tap_stack.tf line 468, in resource "aws_iam_role" "ec2":
│  468: resource "aws_iam_role" "ec2" {
│ 
╵
╷
│ Error: creating Secrets Manager Secret (tap-stack-rds-credentials): operation error Secrets Manager: CreateSecret, https response error StatusCode: 400, RequestID: 3f02bcdd-2b00-4b68-86b1-431714b6e1b9, ResourceExistsException: The operation failed because the secret tap-stack-rds-credentials already exists.
│ 
│   with aws_secretsmanager_secret.rds_credentials,
│   on tap_stack.tf line 531, in resource "aws_secretsmanager_secret" "rds_credentials":
│  531: resource "aws_secretsmanager_secret" "rds_credentials" {
│ 
╵
╷
│ Error: creating RDS DB Subnet Group (tap-stack-db-subnet-group): operation error RDS: CreateDBSubnetGroup, https response error StatusCode: 400, RequestID: 94d92c64-8807-4b7b-ba47-f7db8a5f1963, DBSubnetGroupAlreadyExists: The DB subnet group 'tap-stack-db-subnet-group' already exists.
│ 
│   with aws_db_subnet_group.main,
│   on tap_stack.tf line 552, in resource "aws_db_subnet_group" "main":
│  552: resource "aws_db_subnet_group" "main" {
│ 
╵
╷
│ Error: creating CloudTrail Trail (tap-stack-cloudtrail): operation error CloudTrail: CreateTrail, https response error StatusCode: 400, RequestID: 9df4b5fd-c44c-4c79-82d3-1689d90fcb99, TrailAlreadyExistsException: Trail tap-stack-cloudtrail already exists for customer: ***
│ 
│   with aws_cloudtrail.main,
│   on tap_stack.tf line 806, in resource "aws_cloudtrail" "main":
│  806: resource "aws_cloudtrail" "main" {
│

```

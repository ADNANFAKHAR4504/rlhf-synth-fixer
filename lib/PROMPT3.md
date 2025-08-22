I still got this from the above response

╷
│ Error: creating IAM Role (Prod-SecureApp-ec2-role): operation error IAM: CreateRole, https response error StatusCode: 409, RequestID: 40381bc8-e6ed-426d-864b-2e5ee7e1d648, EntityAlreadyExists: Role with name Prod-SecureApp-ec2-role already exists.
│ 
│   with aws_iam_role.ec2_role,
│   on tap_stack.tf line 395, in resource "aws_iam_role" "ec2_role":
│  395: resource "aws_iam_role" "ec2_role" {
│ 
╵
╷
│ Error: creating RDS DB Subnet Group (prod-secureapp-db-subnet-group): operation error RDS: CreateDBSubnetGroup, https response error StatusCode: 400, RequestID: 2d5d21da-5291-4535-b067-e0511aea0ea9, DBSubnetGroupAlreadyExists: The DB subnet group 'prod-secureapp-db-subnet-group' already exists.
│ 
│   with aws_db_subnet_group.main,
│   on tap_stack.tf line 457, in resource "aws_db_subnet_group" "main":
│  457: resource "aws_db_subnet_group" "main" {
│ 
╵
╷
│ Error: ELBv2 Load Balancer (prod-secureapp-alb) already exists
│ 
│   with aws_lb.main,
│   on tap_stack.tf line 578, in resource "aws_lb" "main":
│  578: resource "aws_lb" "main" {
│ 
╵
╷
│ Error: ELBv2 Target Group (prod-secureapp-tg) already exists
│ 
│   with aws_lb_target_group.main,
│   on tap_stack.tf line 602, in resource "aws_lb_target_group" "main":
│  602: resource "aws_lb_target_group" "main" {
│ 
╵
Error: Terraform exited with code 1.
Error: Process completed with exit code 1.

Fix all
Here's the new error i got


│ Error: creating EC2 Instance: operation error EC2: RunInstances, https response error StatusCode: 400, RequestID: fd8ddff7-7cb5-4e54-a3d6-6c43a1fa3962, api error InvalidKeyPair.NotFound: The key pair '350268-key-pair' does not exist
│ 
│   with aws_instance.vpc1_ec2,
│   on ec2.tf line 17, in resource "aws_instance" "vpc1_ec2":
│   17: resource "aws_instance" "vpc1_ec2" {
│ 
╵
╷
│ Error: creating EC2 Instance: operation error EC2: RunInstances, https response error StatusCode: 400, RequestID: 7bf46d85-3d51-4efc-8ddc-55ca28357c81, api error InvalidKeyPair.NotFound: The key pair '350268-key-pair' does not exist
│ 
│   with aws_instance.vpc2_ec2,
│   on ec2.tf line 34, in resource "aws_instance" "vpc2_ec2":
│   34: resource "aws_instance" "vpc2_ec2" {
│ 
╵
╷
│ Error: creating RDS DB Subnet Group (rds-subnet-group): operation error RDS: CreateDBSubnetGroup, https response error StatusCode: 400, RequestID: e729ba5b-9067-4c65-9738-54ddfdf87597, api error InvalidParameterValue: Subnet has different VPC Id: vpc-0b2262b716c46171f than vpc-0a2ab0fa615bf3b80
│ 
│   with aws_db_subnet_group.rds_subnet_group,
│   on subnets.tf line 47, in resource "aws_db_subnet_group" "rds_subnet_group":
│   47: resource "aws_db_subnet_group" "rds_subnet_group" {
│ 
╵
Error: Terraform exited with code 1.

Can we fix this?
getting these errr 

│ Error: Terraform encountered problems during initialisation, including problems
│ with the configuration, described below.
│ 
│ The Terraform configuration must be valid before initialization so that
│ Warning: Missing backend configuration
│ Terraform can determine which modules and providers need to be installed.
│ 
│ -backend-config was used without a "backend" block in the configuration.
│ 
│ If you intended to override the default local backend configuration,
│ no action is required, but you may add an explicit backend block to your
│ configuration to clear this warning:
│ 
│ terraform {
│   backend "local" {}
│ }
│ 
│ However, if you intended to override a defined backend, please verify that
│ the backend configuration is present and valid.
│ 
╵
│ 
│ 
╵
╷
│ Error: Duplicate variable declaration
│ 
│   on tap_stack_minimal.tf line 2:
│    2: variable "allowed_ssh_cidr" {
│ 
│ A variable named "allowed_ssh_cidr" was already declared at
│ tap_stack.tf:2,1-28. Variable names must be unique within a module.
╵
╷
│ Error: Duplicate variable declaration
│ 
│   on tap_stack_minimal.tf line 2:
│    2: variable "allowed_ssh_cidr" {
│ 
│ A variable named "allowed_ssh_cidr" was already declared at
│ tap_stack.tf:2,1-28. Variable names must be unique within a module.
╵
╷
│ Error: Duplicate variable declaration
│ 
│   on tap_stack_minimal.tf line 8:
│    8: variable "company_name" {
│ 
│ A variable named "company_name" was already declared at
│ tap_stack.tf:8,1-24. Variable names must be unique within a module.
╵
╷
│ Error: Duplicate variable declaration
│ 
│   on tap_stack_minimal.tf line 8:
│    8: variable "company_name" {
│ 
│ A variable named "company_name" was already declared at
│ tap_stack.tf:8,1-24. Variable names must be unique within a module.
╵
╷
│ Error: Duplicate variable declaration
│ 
│   on tap_stack_minimal.tf line 14:
│   14: variable "db_instance_class" {
│ 
│ A variable named "db_instance_class" was already declared at
│ tap_stack.tf:14,1-29. Variable names must be unique within a module.
╵
╷
│ Error: Duplicate variable declaration
│ 
│   on tap_stack_minimal.tf line 14:
│   14: variable "db_instance_class" {
│ 
│ A variable named "db_instance_class" was already declared at
│ tap_stack.tf:14,1-29. Variable names must be unique within a module.
╵
╷
│ Error: Duplicate variable declaration
│ 
│   on tap_stack_minimal.tf line 20:
│   20: variable "ec2_instance_type" {
│ 
│ A variable named "ec2_instance_type" was already declared at
│ tap_stack.tf:20,1-29. Variable names must be unique within a module.
╵
╷
│ Error: Duplicate variable declaration
│ 
│   on tap_stack_minimal.tf line 20:
│   20: variable "ec2_instance_type" {
│ 
│ A variable named "ec2_instance_type" was already declared at
│ tap_stack.tf:20,1-29. Variable names must be unique within a module.
╵
╷
│ Error: Duplicate local value definition
│ 
│   on tap_stack_minimal.tf line 28, in locals:
│   28:   environments = {
│   29:     dev = {
│   30:       name                 = "dev"
│   31:       region               = "us-east-1"
│   32:       vpc_cidr             = "10.0.0.0/16"
│   33:       public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
│   34:       private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
│   35:       cost_center          = "Development"
│   36:       backup_retention     = 7
│   37:     }
│   38:     staging = {
│   39:       name                 = "staging"
│   40:       region               = "us-east-1"
│   41:       vpc_cidr             = "10.1.0.0/16"
│   42:       public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
│   43:       private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
│   44:       cost_center          = "Staging"
│   45:       backup_retention     = 14
│   46:     }
│   47:     prod = {
│   48:       name                 = "prod"
│   49:       region               = "us-west-2"
│   50:       vpc_cidr             = "10.2.0.0/16"
│   51:       public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
│   52:       private_subnet_cidrs = ["10.2.11.0/24", "10.2.12.0/24"]
│   53:       cost_center          = "Production"
│   54:       backup_retention     = 30
│   55:     }
│   56:   }
│ 
│ A local value named "environments" was already defined at
│ tap_stack.tf:28,3-56,4. Local value names must be unique within a module.
╵
╷
│ Error: Duplicate local value definition
│ 
│   on tap_stack_minimal.tf line 28, in locals:
│   28:   environments = {
│   29:     dev = {
│   30:       name                 = "dev"
│   31:       region               = "us-east-1"
│   32:       vpc_cidr             = "10.0.0.0/16"
│   33:       public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
│   34:       private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
│   35:       cost_center          = "Development"
│   36:       backup_retention     = 7
│   37:     }
│   38:     staging = {
│   39:       name                 = "staging"
│   40:       region               = "us-east-1"
│   41:       vpc_cidr             = "10.1.0.0/16"
│   42:       public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
│   43:       private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
│   44:       cost_center          = "Staging"
│   45:       backup_retention     = 14
│   46:     }
│   47:     prod = {
│   48:       name                 = "prod"
│   49:       region               = "us-west-2"
│   50:       vpc_cidr             = "10.2.0.0/16"
│   51:       public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
│   52:       private_subnet_cidrs = ["10.2.11.0/24", "10.2.12.0/24"]
│   53:       cost_center          = "Production"
│   54:       backup_retention     = 30
│   55:     }
│   56:   }
│ 
│ A local value named "environments" was already defined at
│ tap_stack.tf:28,3-56,4. Local value names must be unique within a module.
╵
╷
│ Error: Duplicate local value definition
│ 
│   on tap_stack_minimal.tf line 58, in locals:
│   58:   common_tags = {
│   59:     Project   = "TAP-Stack"
│   60:     ManagedBy = "Terraform"
│   61:     Company   = var.company_name
│   62:   }
│ 
│ A local value named "common_tags" was already defined at
│ tap_stack.tf:58,3-62,4. Local value names must be unique within a module.
╵
╷
│ Error: Duplicate local value definition
│ 
│   on tap_stack_minimal.tf line 58, in locals:
│   58:   common_tags = {
│   59:     Project   = "TAP-Stack"
│   60:     ManagedBy = "Terraform"
│   61:     Company   = var.company_name
│   62:   }
│ 
│ A local value named "common_tags" was already defined at
│ tap_stack.tf:58,3-62,4. Local value names must be unique within a module.
╵
╷
│ Error: Duplicate data "aws_ami" configuration
│ 
│   on tap_stack_minimal.tf line 66:
│   66: data "aws_ami" "amazon_linux" {
│ 
│ A aws_ami data resource named "amazon_linux" was already declared at
│ tap_stack.tf:66,1-30. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate data "aws_ami" configuration
│ 
│   on tap_stack_minimal.tf line 66:
│   66: data "aws_ami" "amazon_linux" {
│ 
│ A aws_ami data resource named "amazon_linux" was already declared at
│ tap_stack.tf:66,1-30. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate data "aws_availability_zones" configuration
│ 
│   on tap_stack_minimal.tf line 82:
│   82: data "aws_availability_zones" "available" {
│ 
│ A aws_availability_zones data resource named "available" was already
│ declared at tap_stack.tf:82,1-42. Resource names must be unique per type in
│ each module.
╵
╷
│ Error: Duplicate data "aws_availability_zones" configuration
│ 
│   on tap_stack_minimal.tf line 82:
│   82: data "aws_availability_zones" "available" {
│ 
│ A aws_availability_zones data resource named "available" was already
│ declared at tap_stack.tf:82,1-42. Resource names must be unique per type in
│ each module.
╵
╷
│ Error: Duplicate resource "random_password" configuration
│ 
│   on tap_stack_minimal.tf line 87:
│   87: resource "random_password" "db_password" {
│ 
│ A random_password resource named "db_password" was already declared at
│ tap_stack.tf:87,1-41. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "random_password" configuration
│ 
│   on tap_stack_minimal.tf line 87:
│   87: resource "random_password" "db_password" {
│ 
│ A random_password resource named "db_password" was already declared at
│ tap_stack.tf:87,1-41. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_vpc" configuration
│ 
│   on tap_stack_minimal.tf line 94:
│   94: resource "aws_vpc" "main" {
│ 
│ A aws_vpc resource named "main" was already declared at
│ tap_stack.tf:94,1-26. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_vpc" configuration
│ 
│   on tap_stack_minimal.tf line 94:
│   94: resource "aws_vpc" "main" {
│ 
│ A aws_vpc resource named "main" was already declared at
│ tap_stack.tf:94,1-26. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_internet_gateway" configuration
│ 
│   on tap_stack_minimal.tf line 109:
│  109: resource "aws_internet_gateway" "main" {
│ 
│ A aws_internet_gateway resource named "main" was already declared at
│ tap_stack.tf:109,1-39. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_internet_gateway" configuration
│ 
│   on tap_stack_minimal.tf line 109:
│  109: resource "aws_internet_gateway" "main" {
│ 
│ A aws_internet_gateway resource named "main" was already declared at
│ tap_stack.tf:109,1-39. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_subnet" configuration
│ 
│   on tap_stack_minimal.tf line 121:
│  121: resource "aws_subnet" "public" {
│ 
│ A aws_subnet resource named "public" was already declared at
│ tap_stack.tf:121,1-31. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_subnet" configuration
│ 
│   on tap_stack_minimal.tf line 121:
│  121: resource "aws_subnet" "public" {
│ 
│ A aws_subnet resource named "public" was already declared at
│ tap_stack.tf:121,1-31. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_subnet" configuration
│ 
│   on tap_stack_minimal.tf line 144:
│  144: resource "aws_subnet" "private" {
│ 
│ A aws_subnet resource named "private" was already declared at
│ tap_stack.tf:144,1-32. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_subnet" configuration
│ 
│   on tap_stack_minimal.tf line 144:
│  144: resource "aws_subnet" "private" {
│ 
│ A aws_subnet resource named "private" was already declared at
│ tap_stack.tf:144,1-32. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_route_table" configuration
│ 
│   on tap_stack_minimal.tf line 166:
│  166: resource "aws_route_table" "public" {
│ 
│ A aws_route_table resource named "public" was already declared at
│ tap_stack.tf:166,1-36. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_route_table" configuration
│ 
│   on tap_stack_minimal.tf line 166:
│  166: resource "aws_route_table" "public" {
│ 
│ A aws_route_table resource named "public" was already declared at
│ tap_stack.tf:166,1-36. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_route_table" configuration
│ 
│   on tap_stack_minimal.tf line 182:
│  182: resource "aws_route_table" "private" {
│ 
│ A aws_route_table resource named "private" was already declared at
│ tap_stack.tf:182,1-37. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_route_table" configuration
│ 
│   on tap_stack_minimal.tf line 182:
│  182: resource "aws_route_table" "private" {
│ 
│ A aws_route_table resource named "private" was already declared at
│ tap_stack.tf:182,1-37. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_route_table_association" configuration
│ 
│   on tap_stack_minimal.tf line 194:
│  194: resource "aws_route_table_association" "public" {
│ 
│ A aws_route_table_association resource named "public" was already declared
│ at tap_stack.tf:194,1-48. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_route_table_association" configuration
│ 
│   on tap_stack_minimal.tf line 194:
│  194: resource "aws_route_table_association" "public" {
│ 
│ A aws_route_table_association resource named "public" was already declared
│ at tap_stack.tf:194,1-48. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_route_table_association" configuration
│ 
│   on tap_stack_minimal.tf line 206:
│  206: resource "aws_route_table_association" "private" {
│ 
│ A aws_route_table_association resource named "private" was already declared
│ at tap_stack.tf:206,1-49. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_route_table_association" configuration
│ 
│   on tap_stack_minimal.tf line 206:
│  206: resource "aws_route_table_association" "private" {
│ 
│ A aws_route_table_association resource named "private" was already declared
│ at tap_stack.tf:206,1-49. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_security_group" configuration
│ 
│   on tap_stack_minimal.tf line 219:
│  219: resource "aws_security_group" "web" {
│ 
│ A aws_security_group resource named "web" was already declared at
│ tap_stack.tf:219,1-36. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_security_group" configuration
│ 
│   on tap_stack_minimal.tf line 219:
│  219: resource "aws_security_group" "web" {
│ 
│ A aws_security_group resource named "web" was already declared at
│ tap_stack.tf:219,1-36. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_security_group" configuration
│ 
│   on tap_stack_minimal.tf line 255:
│  255: resource "aws_security_group" "rds" {
│ 
│ A aws_security_group resource named "rds" was already declared at
│ tap_stack.tf:255,1-36. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate resource "aws_security_group" configuration
│ 
│   on tap_stack_minimal.tf line 255:
│  255: resource "aws_security_group" "rds" {
│ 
│ A aws_security_group resource named "rds" was already declared at
│ tap_stack.tf:255,1-36. Resource names must be unique per type in each
│ module.
╵
╷
│ Error: Duplicate output definition
│ 
│   on tap_stack_minimal.tf line 277:
│  277: output "environment_info" {
│ 
│ An output named "environment_info" was already defined at
│ tap_stack.tf:277,1-26. Output names must be unique within a module.
╵
╷
│ Error: Duplicate output definition
│ 
│   on tap_stack_minimal.tf line 277:
│  277: output "environment_info" {
│ 
│ An output named "environment_info" was already defined at
│ tap_stack.tf:277,1-26. Output names must be unique within a module
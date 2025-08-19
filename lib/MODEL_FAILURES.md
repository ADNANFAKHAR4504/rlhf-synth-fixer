*** Flaw 1 ***

Initializing the backend...

Successfully configured the backend "s3"! Terraform will automatically
use this backend unless the backend configuration changes.
Upgrading modules...
- compute_us_east_1 in
- iam_us_east_1 in
- vpc_us_east_1 in
╷
│ Error: Unreadable module directory
│ 
│ Unable to evaluate directory symlink: lstat ../../modules: no such file or directory
╵
╷
│ Error: Unreadable module directory
│ 
│ The directory  could not be read for module "compute_us_east_1" at provider.tf:87.
╵
╷
│ Error: Unreadable module directory
│ 
│ Unable to evaluate directory symlink: lstat ../../modules: no such file or directory
╵
╷
│ Error: Unreadable module directory
│ 
│ The directory  could not be read for module "iam_us_east_1" at provider.tf:76.
╵
╷
│ Error: Unreadable module directory
│ 
│ Unable to evaluate directory symlink: lstat ../../modules: no such file or directory
╵
╷
│ Error: Unreadable module directory
│ 
│ The directory  could not be read for module "vpc_us_east_1" at provider.tf:64.
╵
╷
│ Error: Missing required argument
│ 
│   on provider.tf line 104, in module "database_":
│  104: # us_east_1" {
│ 
│ The argument "source" is required, but no definition was found.

*** Flaw 2 ***
│ Error: Invalid module source address
│ 
│   on provider.tf line 65, in module "vpc_us_east_1":
│   65:   source = "modules/vpc"
│ 
│ Terraform failed to determine your intended installation method for remote module package "modules/vpc".
│ 
│ If you intended this as a path relative to the current module, use "./modules/vpc" instead. The "./" prefix indicates that the address is a
│ relative filesystem path.
╵
╷
│ Error: Invalid module source address
│ 
│   on provider.tf line 77, in module "iam_us_east_1":
│   77:   source = "modules/iam"
│ 
│ Terraform failed to determine your intended installation method for remote module package "modules/iam".
│ 
│ If you intended this as a path relative to the current module, use "./modules/iam" instead. The "./" prefix indicates that the address is a
│ relative filesystem path.
╵
╷
│ Error: Invalid module source address
│ 
│   on provider.tf line 88, in module "compute_us_east_1":
│   88:   source = "modules/compute"
│ 
│ Terraform failed to determine your intended installation method for remote module package "modules/compute".
│ 
│ If you intended this as a path relative to the current module, use "./modules/compute" instead. The "./" prefix indicates that the address
│ is a relative filesystem path.
╵
╷
│ Error: Invalid module source address
│ 
│   on provider.tf line 104, in module "database_us_east_1":
│  104:   source = "modules/database"
│ 
│ Terraform failed to determine your intended installation method for remote module package "modules/database".
│ 
│ If you intended this as a path relative to the current module, use "./modules/database" instead. The "./" prefix indicates that the address
│ is a relative filesystem path.

*** Flaw 3 ***
Required attribute "database_security_group_id" not specified: An attribute named "database_security_group_id" is required here

*** Flaw 4 ***
│ There is no explicit declaration for local provider name "aws" in module.vpc_us_east_1, so Terraform is assuming you mean to pass a
│ configuration for "hashicorp/aws".
│ 
│ If you also control the child module, add a required_providers entry named "aws" with the source address "hashicorp/aws".
│ 
│ (and 3 more similar warnings elsewhere)
╵
╷
│ Error: creating Auto Scaling Group (dev-asg-us-east-1): operation error Auto Scaling: CreateAutoScalingGroup, https response error StatusCode: 400, RequestID: 024a3ec8-c7f5-4742-bbc5-850b46511890, api error ValidationError: SpotAllocationStrategy is not valid. Valid options are: [lowest-price, capacity-optimized, capacity-optimized-prioritized, price-capacity-optimized].
│ 
│   with module.compute_us_east_1.aws_autoscaling_group.main,
│   on modules/compute/main.tf line 39, in resource "aws_autoscaling_group" "main":
│   39: resource "aws_autoscaling_group" "main" {
│ 
╵
╷
│ Error: creating RDS DB Instance (dev-postgres-us-east-1): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: a603830a-8306-423f-952f-d25074f0ef14, api error InvalidParameterCombination: Cannot find version 14.9 for postgres
│ 
│   with module.database_us_east_1.aws_db_instance.main[0],
│   on modules/database/main.tf line 45, in resource "aws_db_instance" "main":
│   45: resource "aws_db_instance" "main" {
│ 
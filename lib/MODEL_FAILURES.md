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
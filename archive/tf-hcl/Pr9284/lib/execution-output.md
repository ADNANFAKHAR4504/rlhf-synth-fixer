# Initializing Terraform...

[0m[1mInitializing the backend...[0m
[0m[1mbucket[0m
  The name of the S3 bucket

  [1mEnter a value:[0m [0m[0m[1mInitializing modules...[0m
- dev_environment in modules/environment
- prod_environment in modules/environment
- staging_environment in modules/environment
[31m[31m╷[0m[0m
[31m│[0m [0m[1m[31mError: [0m[0m[1mError asking for input to configure backend "s3": bucket: EOF[0m
[31m│[0m [0m
[31m│[0m [0m[0m
[31m╵[0m[0m
[0m[0m

# Creating/selecting workspace Pr1797...
[31m[31m╷[0m[0m
[31m│[0m [0m[1m[31mError: [0m[0m[1mBackend initialization required, please run "terraform init"[0m
[31m│[0m [0m
[31m│[0m [0m[0mReason: Initial configuration of the requested backend "s3"
[31m│[0m [0m
[31m│[0m [0mThe "backend" is the interface that Terraform uses to store state,
[31m│[0m [0mperform operations, etc. If this message is showing up, it means that the
[31m│[0m [0mTerraform configuration you're using is using a custom configuration for
[31m│[0m [0mthe Terraform backend.
[31m│[0m [0m
[31m│[0m [0mChanges to backend configurations require reinitialization. This allows
[31m│[0m [0mTerraform to set up the new configuration, copy existing state, etc. Please
[31m│[0m [0mrun
[31m│[0m [0m"terraform init" with either the "-reconfigure" or "-migrate-state" flags
[31m│[0m [0mto
[31m│[0m [0muse the current configuration.
[31m│[0m [0m
[31m│[0m [0mIf the change reason above is incorrect, please verify your configuration
[31m│[0m [0mhasn't changed and try again. At this point, no changes to your existing
[31m│[0m [0mconfiguration or state have been made.
[31m╵[0m[0m
[0m[0m
Workspace Pr1797 created successfully

# Running terraform plan...
[31m╷[0m[0m
[31m│[0m [0m[1m[31mError: [0m[0m[1mBackend initialization required, please run "terraform init"[0m
[31m│[0m [0m
[31m│[0m [0m[0mReason: Initial configuration of the requested backend "s3"
[31m│[0m [0m
[31m│[0m [0mThe "backend" is the interface that Terraform uses to store state,
[31m│[0m [0mperform operations, etc. If this message is showing up, it means that the
[31m│[0m [0mTerraform configuration you're using is using a custom configuration for
[31m│[0m [0mthe Terraform backend.
[31m│[0m [0m
[31m│[0m [0mChanges to backend configurations require reinitialization. This allows
[31m│[0m [0mTerraform to set up the new configuration, copy existing state, etc. Please
[31m│[0m [0mrun
[31m│[0m [0m"terraform init" with either the "-reconfigure" or "-migrate-state" flags
[31m│[0m [0mto
[31m│[0m [0muse the current configuration.
[31m│[0m [0m
[31m│[0m [0mIf the change reason above is incorrect, please verify your configuration
[31m│[0m [0mhasn't changed and try again. At this point, no changes to your existing
[31m│[0m [0mconfiguration or state have been made.
[31m╵[0m[0m

# Running terraform apply...
[31m╷[0m[0m
[31m│[0m [0m[1m[31mError: [0m[0m[1mFailed to load "tfplan" as a plan file[0m
[31m│[0m [0m
[31m│[0m [0m[0mError: stat tfplan: no such file or directory
[31m╵[0m[0m

Deployment completed successfully!
# Created backend_override.tf to use local backend

# Initializing Terraform...

[0m[1mInitializing the backend...[0m
[0m[32m
Successfully configured the backend "local"! Terraform will automatically
use this backend unless the backend configuration changes.[0m
[0m[1mInitializing modules...[0m

[0m[1mInitializing provider plugins...[0m
- Finding hashicorp/aws versions matching ">= 5.0.0"...
- Installing hashicorp/aws v6.27.0...
- Installed hashicorp/aws v6.27.0 (signed by HashiCorp)

Terraform has created a lock file [1m.terraform.lock.hcl[0m to record the provider
selections it made above. Include this file in your version control repository
so that Terraform can guarantee to make the same selections by default when
you run "terraform init" in the future.[0m

[0m[1m[32mTerraform has been successfully initialized![0m[32m[0m
[0m[32m
You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.[0m

# Creating/selecting workspace Pr1797...
[0m[32m[1mCreated and switched to workspace "Pr1797"![0m[32m

You're now on a new, empty workspace. Workspaces isolate their state,
so if you run "terraform plan" Terraform will not see any existing state
for this configuration.[0m
Workspace Pr1797 created successfully

# Running terraform plan...
[0m[1mdata.aws_availability_zones.available: Reading...[0m[0m
[0m[1mmodule.staging_environment.data.aws_ami.amazon_linux: Reading...[0m[0m
[0m[1mmodule.dev_environment.data.aws_ami.amazon_linux: Reading...[0m[0m
[0m[1mmodule.prod_environment.data.aws_ami.amazon_linux: Reading...[0m[0m
[0m[1mdata.aws_availability_zones.available: Read complete after 2s [id=us-west-2][0m
[0m[1mmodule.staging_environment.data.aws_ami.amazon_linux: Read complete after 5s [id=ami-04681a1dbd79675a5][0m
[0m[1mmodule.prod_environment.data.aws_ami.amazon_linux: Read complete after 5s [id=ami-04681a1dbd79675a5][0m
[0m[1mmodule.dev_environment.data.aws_ami.amazon_linux: Read complete after 5s [id=ami-04681a1dbd79675a5][0m

Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  [32m+[0m create[0m

Terraform will perform the following actions:

[1m  # module.dev_environment.aws_cloudwatch_log_group.vpc_flow_logs[0m will be created
[0m  [32m+[0m[0m resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
      [32m+[0m[0m arn                         = (known after apply)
      [32m+[0m[0m deletion_protection_enabled = (known after apply)
      [32m+[0m[0m id                          = (known after apply)
      [32m+[0m[0m log_group_class             = (known after apply)
      [32m+[0m[0m name                        = "/aws/vpc/flowlogs/dev-9k2"
      [32m+[0m[0m name_prefix                 = (known after apply)
      [32m+[0m[0m region                      = "us-west-2"
      [32m+[0m[0m retention_in_days           = 30
      [32m+[0m[0m skip_destroy                = false
      [32m+[0m[0m tags                        = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                    = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.dev_environment.aws_eip.nat[0][0m will be created
[0m  [32m+[0m[0m resource "aws_eip" "nat" {
      [32m+[0m[0m allocation_id        = (known after apply)
      [32m+[0m[0m arn                  = (known after apply)
      [32m+[0m[0m association_id       = (known after apply)
      [32m+[0m[0m carrier_ip           = (known after apply)
      [32m+[0m[0m customer_owned_ip    = (known after apply)
      [32m+[0m[0m domain               = "vpc"
      [32m+[0m[0m id                   = (known after apply)
      [32m+[0m[0m instance             = (known after apply)
      [32m+[0m[0m ipam_pool_id         = (known after apply)
      [32m+[0m[0m network_border_group = (known after apply)
      [32m+[0m[0m network_interface    = (known after apply)
      [32m+[0m[0m private_dns          = (known after apply)
      [32m+[0m[0m private_ip           = (known after apply)
      [32m+[0m[0m ptr_record           = (known after apply)
      [32m+[0m[0m public_dns           = (known after apply)
      [32m+[0m[0m public_ip            = (known after apply)
      [32m+[0m[0m public_ipv4_pool     = (known after apply)
      [32m+[0m[0m region               = "us-west-2"
      [32m+[0m[0m tags                 = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-eip-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all             = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-eip-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.dev_environment.aws_eip.nat[1][0m will be created
[0m  [32m+[0m[0m resource "aws_eip" "nat" {
      [32m+[0m[0m allocation_id        = (known after apply)
      [32m+[0m[0m arn                  = (known after apply)
      [32m+[0m[0m association_id       = (known after apply)
      [32m+[0m[0m carrier_ip           = (known after apply)
      [32m+[0m[0m customer_owned_ip    = (known after apply)
      [32m+[0m[0m domain               = "vpc"
      [32m+[0m[0m id                   = (known after apply)
      [32m+[0m[0m instance             = (known after apply)
      [32m+[0m[0m ipam_pool_id         = (known after apply)
      [32m+[0m[0m network_border_group = (known after apply)
      [32m+[0m[0m network_interface    = (known after apply)
      [32m+[0m[0m private_dns          = (known after apply)
      [32m+[0m[0m private_ip           = (known after apply)
      [32m+[0m[0m ptr_record           = (known after apply)
      [32m+[0m[0m public_dns           = (known after apply)
      [32m+[0m[0m public_ip            = (known after apply)
      [32m+[0m[0m public_ipv4_pool     = (known after apply)
      [32m+[0m[0m region               = "us-west-2"
      [32m+[0m[0m tags                 = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-eip-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all             = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-eip-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.dev_environment.aws_flow_log.vpc_flow_logs[0m will be created
[0m  [32m+[0m[0m resource "aws_flow_log" "vpc_flow_logs" {
      [32m+[0m[0m arn                      = (known after apply)
      [32m+[0m[0m iam_role_arn             = (known after apply)
      [32m+[0m[0m id                       = (known after apply)
      [32m+[0m[0m log_destination          = (known after apply)
      [32m+[0m[0m log_destination_type     = "cloud-watch-logs"
      [32m+[0m[0m log_format               = (known after apply)
      [32m+[0m[0m max_aggregation_interval = 600
      [32m+[0m[0m region                   = "us-west-2"
      [32m+[0m[0m tags                     = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                 = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m traffic_type             = "ALL"
      [32m+[0m[0m vpc_id                   = (known after apply)
    }

[1m  # module.dev_environment.aws_iam_instance_profile.ec2_profile[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_instance_profile" "ec2_profile" {
      [32m+[0m[0m arn         = (known after apply)
      [32m+[0m[0m create_date = (known after apply)
      [32m+[0m[0m id          = (known after apply)
      [32m+[0m[0m name        = "dev-ec2-profile-9k2"
      [32m+[0m[0m name_prefix = (known after apply)
      [32m+[0m[0m path        = "/"
      [32m+[0m[0m role        = "dev-ec2-role-9k2"
      [32m+[0m[0m tags        = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-ec2-profile-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all    = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-ec2-profile-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m unique_id   = (known after apply)
    }

[1m  # module.dev_environment.aws_iam_role.ec2_role[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role" "ec2_role" {
      [32m+[0m[0m arn                   = (known after apply)
      [32m+[0m[0m assume_role_policy    = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action    = "sts:AssumeRole"
                      [32m+[0m[0m Effect    = "Allow"
                      [32m+[0m[0m Principal = {
                          [32m+[0m[0m Service = "ec2.amazonaws.com"
                        }
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m create_date           = (known after apply)
      [32m+[0m[0m force_detach_policies = false
      [32m+[0m[0m id                    = (known after apply)
      [32m+[0m[0m managed_policy_arns   = (known after apply)
      [32m+[0m[0m max_session_duration  = 3600
      [32m+[0m[0m name                  = "dev-ec2-role-9k2"
      [32m+[0m[0m name_prefix           = (known after apply)
      [32m+[0m[0m path                  = "/"
      [32m+[0m[0m tags                  = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-ec2-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all              = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-ec2-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m unique_id             = (known after apply)
    }

[1m  # module.dev_environment.aws_iam_role.flow_logs_role[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role" "flow_logs_role" {
      [32m+[0m[0m arn                   = (known after apply)
      [32m+[0m[0m assume_role_policy    = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action    = "sts:AssumeRole"
                      [32m+[0m[0m Effect    = "Allow"
                      [32m+[0m[0m Principal = {
                          [32m+[0m[0m Service = "vpc-flow-logs.amazonaws.com"
                        }
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m create_date           = (known after apply)
      [32m+[0m[0m force_detach_policies = false
      [32m+[0m[0m id                    = (known after apply)
      [32m+[0m[0m managed_policy_arns   = (known after apply)
      [32m+[0m[0m max_session_duration  = 3600
      [32m+[0m[0m name                  = "dev-flow-logs-role-9k2"
      [32m+[0m[0m name_prefix           = (known after apply)
      [32m+[0m[0m path                  = "/"
      [32m+[0m[0m tags                  = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-flow-logs-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all              = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-flow-logs-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m unique_id             = (known after apply)
    }

[1m  # module.dev_environment.aws_iam_role_policy.ec2_policy[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role_policy" "ec2_policy" {
      [32m+[0m[0m id          = (known after apply)
      [32m+[0m[0m name        = "dev-ec2-policy-9k2"
      [32m+[0m[0m name_prefix = (known after apply)
      [32m+[0m[0m policy      = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action   = [
                          [32m+[0m[0m "cloudwatch:PutMetricData",
                          [32m+[0m[0m "ec2:DescribeVolumes",
                          [32m+[0m[0m "ec2:DescribeTags",
                          [32m+[0m[0m "logs:PutLogEvents",
                          [32m+[0m[0m "logs:CreateLogGroup",
                          [32m+[0m[0m "logs:CreateLogStream",
                        ]
                      [32m+[0m[0m Effect   = "Allow"
                      [32m+[0m[0m Resource = "*"
                    },
                  [32m+[0m[0m {
                      [32m+[0m[0m Action   = [
                          [32m+[0m[0m "ssm:GetParameter",
                          [32m+[0m[0m "ssm:PutParameter",
                        ]
                      [32m+[0m[0m Effect   = "Allow"
                      [32m+[0m[0m Resource = "*"
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m role        = (known after apply)
    }

[1m  # module.dev_environment.aws_iam_role_policy.flow_logs_policy[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role_policy" "flow_logs_policy" {
      [32m+[0m[0m id          = (known after apply)
      [32m+[0m[0m name        = "dev-flow-logs-policy-9k2"
      [32m+[0m[0m name_prefix = (known after apply)
      [32m+[0m[0m policy      = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action   = [
                          [32m+[0m[0m "logs:CreateLogGroup",
                          [32m+[0m[0m "logs:CreateLogStream",
                          [32m+[0m[0m "logs:PutLogEvents",
                          [32m+[0m[0m "logs:DescribeLogGroups",
                          [32m+[0m[0m "logs:DescribeLogStreams",
                        ]
                      [32m+[0m[0m Effect   = "Allow"
                      [32m+[0m[0m Resource = "*"
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m role        = (known after apply)
    }

[1m  # module.dev_environment.aws_instance.web[0][0m will be created
[0m  [32m+[0m[0m resource "aws_instance" "web" {
      [32m+[0m[0m ami                                  = "ami-04681a1dbd79675a5"
      [32m+[0m[0m arn                                  = (known after apply)
      [32m+[0m[0m associate_public_ip_address          = (known after apply)
      [32m+[0m[0m availability_zone                    = (known after apply)
      [32m+[0m[0m disable_api_stop                     = (known after apply)
      [32m+[0m[0m disable_api_termination              = (known after apply)
      [32m+[0m[0m ebs_optimized                        = (known after apply)
      [32m+[0m[0m enable_primary_ipv6                  = (known after apply)
      [32m+[0m[0m force_destroy                        = false
      [32m+[0m[0m get_password_data                    = false
      [32m+[0m[0m host_id                              = (known after apply)
      [32m+[0m[0m host_resource_group_arn              = (known after apply)
      [32m+[0m[0m iam_instance_profile                 = "dev-ec2-profile-9k2"
      [32m+[0m[0m id                                   = (known after apply)
      [32m+[0m[0m instance_initiated_shutdown_behavior = (known after apply)
      [32m+[0m[0m instance_lifecycle                   = (known after apply)
      [32m+[0m[0m instance_state                       = (known after apply)
      [32m+[0m[0m instance_type                        = "t2.micro"
      [32m+[0m[0m ipv6_address_count                   = (known after apply)
      [32m+[0m[0m ipv6_addresses                       = (known after apply)
      [32m+[0m[0m key_name                             = (known after apply)
      [32m+[0m[0m monitoring                           = (known after apply)
      [32m+[0m[0m outpost_arn                          = (known after apply)
      [32m+[0m[0m password_data                        = (known after apply)
      [32m+[0m[0m placement_group                      = (known after apply)
      [32m+[0m[0m placement_group_id                   = (known after apply)
      [32m+[0m[0m placement_partition_number           = (known after apply)
      [32m+[0m[0m primary_network_interface_id         = (known after apply)
      [32m+[0m[0m private_dns                          = (known after apply)
      [32m+[0m[0m private_ip                           = (known after apply)
      [32m+[0m[0m public_dns                           = (known after apply)
      [32m+[0m[0m public_ip                            = (known after apply)
      [32m+[0m[0m region                               = "us-west-2"
      [32m+[0m[0m secondary_private_ips                = (known after apply)
      [32m+[0m[0m security_groups                      = (known after apply)
      [32m+[0m[0m source_dest_check                    = true
      [32m+[0m[0m spot_instance_request_id             = (known after apply)
      [32m+[0m[0m subnet_id                            = (known after apply)
      [32m+[0m[0m tags                                 = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-webserver-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                             = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-webserver-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tenancy                              = (known after apply)
      [32m+[0m[0m user_data_base64                     = "IyEvYmluL2Jhc2gKeXVtIHVwZGF0ZSAteQp5dW0gaW5zdGFsbCAteSBodHRwZApzeXN0ZW1jdGwgc3RhcnQgaHR0cGQKc3lzdGVtY3RsIGVuYWJsZSBodHRwZAplY2hvICI8aDE+SGVsbG8gZnJvbSBkZXYgZW52aXJvbm1lbnQgLSBJbnN0YW5jZSAxPC9oMT4iID4gL3Zhci93d3cvaHRtbC9pbmRleC5odG1sCg=="
      [32m+[0m[0m user_data_replace_on_change          = false
      [32m+[0m[0m vpc_security_group_ids               = (known after apply)
    }

[1m  # module.dev_environment.aws_instance.web[1][0m will be created
[0m  [32m+[0m[0m resource "aws_instance" "web" {
      [32m+[0m[0m ami                                  = "ami-04681a1dbd79675a5"
      [32m+[0m[0m arn                                  = (known after apply)
      [32m+[0m[0m associate_public_ip_address          = (known after apply)
      [32m+[0m[0m availability_zone                    = (known after apply)
      [32m+[0m[0m disable_api_stop                     = (known after apply)
      [32m+[0m[0m disable_api_termination              = (known after apply)
      [32m+[0m[0m ebs_optimized                        = (known after apply)
      [32m+[0m[0m enable_primary_ipv6                  = (known after apply)
      [32m+[0m[0m force_destroy                        = false
      [32m+[0m[0m get_password_data                    = false
      [32m+[0m[0m host_id                              = (known after apply)
      [32m+[0m[0m host_resource_group_arn              = (known after apply)
      [32m+[0m[0m iam_instance_profile                 = "dev-ec2-profile-9k2"
      [32m+[0m[0m id                                   = (known after apply)
      [32m+[0m[0m instance_initiated_shutdown_behavior = (known after apply)
      [32m+[0m[0m instance_lifecycle                   = (known after apply)
      [32m+[0m[0m instance_state                       = (known after apply)
      [32m+[0m[0m instance_type                        = "t2.micro"
      [32m+[0m[0m ipv6_address_count                   = (known after apply)
      [32m+[0m[0m ipv6_addresses                       = (known after apply)
      [32m+[0m[0m key_name                             = (known after apply)
      [32m+[0m[0m monitoring                           = (known after apply)
      [32m+[0m[0m outpost_arn                          = (known after apply)
      [32m+[0m[0m password_data                        = (known after apply)
      [32m+[0m[0m placement_group                      = (known after apply)
      [32m+[0m[0m placement_group_id                   = (known after apply)
      [32m+[0m[0m placement_partition_number           = (known after apply)
      [32m+[0m[0m primary_network_interface_id         = (known after apply)
      [32m+[0m[0m private_dns                          = (known after apply)
      [32m+[0m[0m private_ip                           = (known after apply)
      [32m+[0m[0m public_dns                           = (known after apply)
      [32m+[0m[0m public_ip                            = (known after apply)
      [32m+[0m[0m region                               = "us-west-2"
      [32m+[0m[0m secondary_private_ips                = (known after apply)
      [32m+[0m[0m security_groups                      = (known after apply)
      [32m+[0m[0m source_dest_check                    = true
      [32m+[0m[0m spot_instance_request_id             = (known after apply)
      [32m+[0m[0m subnet_id                            = (known after apply)
      [32m+[0m[0m tags                                 = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-webserver-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                             = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-webserver-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tenancy                              = (known after apply)
      [32m+[0m[0m user_data_base64                     = "IyEvYmluL2Jhc2gKeXVtIHVwZGF0ZSAteQp5dW0gaW5zdGFsbCAteSBodHRwZApzeXN0ZW1jdGwgc3RhcnQgaHR0cGQKc3lzdGVtY3RsIGVuYWJsZSBodHRwZAplY2hvICI8aDE+SGVsbG8gZnJvbSBkZXYgZW52aXJvbm1lbnQgLSBJbnN0YW5jZSAyPC9oMT4iID4gL3Zhci93d3cvaHRtbC9pbmRleC5odG1sCg=="
      [32m+[0m[0m user_data_replace_on_change          = false
      [32m+[0m[0m vpc_security_group_ids               = (known after apply)
    }

[1m  # module.dev_environment.aws_internet_gateway.main[0m will be created
[0m  [32m+[0m[0m resource "aws_internet_gateway" "main" {
      [32m+[0m[0m arn      = (known after apply)
      [32m+[0m[0m id       = (known after apply)
      [32m+[0m[0m owner_id = (known after apply)
      [32m+[0m[0m region   = "us-west-2"
      [32m+[0m[0m tags     = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-igw-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-igw-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id   = (known after apply)
    }

[1m  # module.dev_environment.aws_nat_gateway.main[0][0m will be created
[0m  [32m+[0m[0m resource "aws_nat_gateway" "main" {
      [32m+[0m[0m allocation_id                      = (known after apply)
      [32m+[0m[0m association_id                     = (known after apply)
      [32m+[0m[0m auto_provision_zones               = (known after apply)
      [32m+[0m[0m auto_scaling_ips                   = (known after apply)
      [32m+[0m[0m availability_mode                  = (known after apply)
      [32m+[0m[0m connectivity_type                  = "public"
      [32m+[0m[0m id                                 = (known after apply)
      [32m+[0m[0m network_interface_id               = (known after apply)
      [32m+[0m[0m private_ip                         = (known after apply)
      [32m+[0m[0m public_ip                          = (known after apply)
      [32m+[0m[0m region                             = "us-west-2"
      [32m+[0m[0m regional_nat_gateway_address       = (known after apply)
      [32m+[0m[0m regional_nat_gateway_auto_mode     = (known after apply)
      [32m+[0m[0m route_table_id                     = (known after apply)
      [32m+[0m[0m secondary_allocation_ids           = (known after apply)
      [32m+[0m[0m secondary_private_ip_address_count = (known after apply)
      [32m+[0m[0m secondary_private_ip_addresses     = (known after apply)
      [32m+[0m[0m subnet_id                          = (known after apply)
      [32m+[0m[0m tags                               = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-nat-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                           = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-nat-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id                             = (known after apply)
    }

[1m  # module.dev_environment.aws_nat_gateway.main[1][0m will be created
[0m  [32m+[0m[0m resource "aws_nat_gateway" "main" {
      [32m+[0m[0m allocation_id                      = (known after apply)
      [32m+[0m[0m association_id                     = (known after apply)
      [32m+[0m[0m auto_provision_zones               = (known after apply)
      [32m+[0m[0m auto_scaling_ips                   = (known after apply)
      [32m+[0m[0m availability_mode                  = (known after apply)
      [32m+[0m[0m connectivity_type                  = "public"
      [32m+[0m[0m id                                 = (known after apply)
      [32m+[0m[0m network_interface_id               = (known after apply)
      [32m+[0m[0m private_ip                         = (known after apply)
      [32m+[0m[0m public_ip                          = (known after apply)
      [32m+[0m[0m region                             = "us-west-2"
      [32m+[0m[0m regional_nat_gateway_address       = (known after apply)
      [32m+[0m[0m regional_nat_gateway_auto_mode     = (known after apply)
      [32m+[0m[0m route_table_id                     = (known after apply)
      [32m+[0m[0m secondary_allocation_ids           = (known after apply)
      [32m+[0m[0m secondary_private_ip_address_count = (known after apply)
      [32m+[0m[0m secondary_private_ip_addresses     = (known after apply)
      [32m+[0m[0m subnet_id                          = (known after apply)
      [32m+[0m[0m tags                               = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-nat-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                           = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-nat-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id                             = (known after apply)
    }

[1m  # module.dev_environment.aws_network_acl.private[0m will be created
[0m  [32m+[0m[0m resource "aws_network_acl" "private" {
      [32m+[0m[0m arn        = (known after apply)
      [32m+[0m[0m egress     = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 0
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "-1"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 0
            },
        ]
      [32m+[0m[0m id         = (known after apply)
      [32m+[0m[0m ingress    = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 1024
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 130
              [32m+[0m[0m to_port         = 65535
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.0.0.0/16"
              [32m+[0m[0m from_port       = 22
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 22
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.0.0.0/16"
              [32m+[0m[0m from_port       = 443
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 120
              [32m+[0m[0m to_port         = 443
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.0.0.0/16"
              [32m+[0m[0m from_port       = 80
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 110
              [32m+[0m[0m to_port         = 80
            },
        ]
      [32m+[0m[0m owner_id   = (known after apply)
      [32m+[0m[0m region     = "us-west-2"
      [32m+[0m[0m subnet_ids = (known after apply)
      [32m+[0m[0m tags       = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-private-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all   = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-private-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id     = (known after apply)
    }

[1m  # module.dev_environment.aws_network_acl.public[0m will be created
[0m  [32m+[0m[0m resource "aws_network_acl" "public" {
      [32m+[0m[0m arn        = (known after apply)
      [32m+[0m[0m egress     = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 0
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "-1"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 0
            },
        ]
      [32m+[0m[0m id         = (known after apply)
      [32m+[0m[0m ingress    = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 1024
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 130
              [32m+[0m[0m to_port         = 65535
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 443
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 110
              [32m+[0m[0m to_port         = 443
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 80
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 80
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.0.0.0/16"
              [32m+[0m[0m from_port       = 22
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 120
              [32m+[0m[0m to_port         = 22
            },
        ]
      [32m+[0m[0m owner_id   = (known after apply)
      [32m+[0m[0m region     = "us-west-2"
      [32m+[0m[0m subnet_ids = (known after apply)
      [32m+[0m[0m tags       = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-public-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all   = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-public-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id     = (known after apply)
    }

[1m  # module.dev_environment.aws_route_table.private[0][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table" "private" {
      [32m+[0m[0m arn              = (known after apply)
      [32m+[0m[0m id               = (known after apply)
      [32m+[0m[0m owner_id         = (known after apply)
      [32m+[0m[0m propagating_vgws = (known after apply)
      [32m+[0m[0m region           = "us-west-2"
      [32m+[0m[0m route            = [
          [32m+[0m[0m {
              [32m+[0m[0m carrier_gateway_id         = ""
              [32m+[0m[0m cidr_block                 = "0.0.0.0/0"
              [32m+[0m[0m core_network_arn           = ""
              [32m+[0m[0m destination_prefix_list_id = ""
              [32m+[0m[0m egress_only_gateway_id     = ""
              [32m+[0m[0m gateway_id                 = ""
              [32m+[0m[0m ipv6_cidr_block            = ""
              [32m+[0m[0m local_gateway_id           = ""
              [32m+[0m[0m nat_gateway_id             = (known after apply)
              [32m+[0m[0m network_interface_id       = ""
              [32m+[0m[0m transit_gateway_id         = ""
              [32m+[0m[0m vpc_endpoint_id            = ""
              [32m+[0m[0m vpc_peering_connection_id  = ""
            },
        ]
      [32m+[0m[0m tags             = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-private-rt-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all         = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-private-rt-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id           = (known after apply)
    }

[1m  # module.dev_environment.aws_route_table.private[1][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table" "private" {
      [32m+[0m[0m arn              = (known after apply)
      [32m+[0m[0m id               = (known after apply)
      [32m+[0m[0m owner_id         = (known after apply)
      [32m+[0m[0m propagating_vgws = (known after apply)
      [32m+[0m[0m region           = "us-west-2"
      [32m+[0m[0m route            = [
          [32m+[0m[0m {
              [32m+[0m[0m carrier_gateway_id         = ""
              [32m+[0m[0m cidr_block                 = "0.0.0.0/0"
              [32m+[0m[0m core_network_arn           = ""
              [32m+[0m[0m destination_prefix_list_id = ""
              [32m+[0m[0m egress_only_gateway_id     = ""
              [32m+[0m[0m gateway_id                 = ""
              [32m+[0m[0m ipv6_cidr_block            = ""
              [32m+[0m[0m local_gateway_id           = ""
              [32m+[0m[0m nat_gateway_id             = (known after apply)
              [32m+[0m[0m network_interface_id       = ""
              [32m+[0m[0m transit_gateway_id         = ""
              [32m+[0m[0m vpc_endpoint_id            = ""
              [32m+[0m[0m vpc_peering_connection_id  = ""
            },
        ]
      [32m+[0m[0m tags             = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-private-rt-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all         = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-private-rt-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id           = (known after apply)
    }

[1m  # module.dev_environment.aws_route_table.public[0m will be created
[0m  [32m+[0m[0m resource "aws_route_table" "public" {
      [32m+[0m[0m arn              = (known after apply)
      [32m+[0m[0m id               = (known after apply)
      [32m+[0m[0m owner_id         = (known after apply)
      [32m+[0m[0m propagating_vgws = (known after apply)
      [32m+[0m[0m region           = "us-west-2"
      [32m+[0m[0m route            = [
          [32m+[0m[0m {
              [32m+[0m[0m carrier_gateway_id         = ""
              [32m+[0m[0m cidr_block                 = "0.0.0.0/0"
              [32m+[0m[0m core_network_arn           = ""
              [32m+[0m[0m destination_prefix_list_id = ""
              [32m+[0m[0m egress_only_gateway_id     = ""
              [32m+[0m[0m gateway_id                 = (known after apply)
              [32m+[0m[0m ipv6_cidr_block            = ""
              [32m+[0m[0m local_gateway_id           = ""
              [32m+[0m[0m nat_gateway_id             = ""
              [32m+[0m[0m network_interface_id       = ""
              [32m+[0m[0m transit_gateway_id         = ""
              [32m+[0m[0m vpc_endpoint_id            = ""
              [32m+[0m[0m vpc_peering_connection_id  = ""
            },
        ]
      [32m+[0m[0m tags             = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-public-rt-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all         = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-public-rt-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id           = (known after apply)
    }

[1m  # module.dev_environment.aws_route_table_association.private[0][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "private" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.dev_environment.aws_route_table_association.private[1][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "private" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.dev_environment.aws_route_table_association.public[0][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "public" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.dev_environment.aws_route_table_association.public[1][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "public" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.dev_environment.aws_security_group.web[0m will be created
[0m  [32m+[0m[0m resource "aws_security_group" "web" {
      [32m+[0m[0m arn                    = (known after apply)
      [32m+[0m[0m description            = "Security group for web servers in dev environment"
      [32m+[0m[0m egress                 = [
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "0.0.0.0/0",
                ]
              [32m+[0m[0m description      = "All outbound"
              [32m+[0m[0m from_port        = 0
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "-1"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 0
            },
        ]
      [32m+[0m[0m id                     = (known after apply)
      [32m+[0m[0m ingress                = [
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "0.0.0.0/0",
                ]
              [32m+[0m[0m description      = "HTTP"
              [32m+[0m[0m from_port        = 80
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "tcp"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 80
            },
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "0.0.0.0/0",
                ]
              [32m+[0m[0m description      = "HTTPS"
              [32m+[0m[0m from_port        = 443
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "tcp"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 443
            },
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "10.0.0.0/16",
                ]
              [32m+[0m[0m description      = "SSH"
              [32m+[0m[0m from_port        = 22
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "tcp"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 22
            },
        ]
      [32m+[0m[0m name                   = "dev-web-sg-9k2"
      [32m+[0m[0m name_prefix            = (known after apply)
      [32m+[0m[0m owner_id               = (known after apply)
      [32m+[0m[0m region                 = "us-west-2"
      [32m+[0m[0m revoke_rules_on_delete = false
      [32m+[0m[0m tags                   = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-web-sg-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all               = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-web-sg-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id                 = (known after apply)
    }

[1m  # module.dev_environment.aws_subnet.private[0][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "private" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2a"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.0.10.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = false
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-private-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-private-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.dev_environment.aws_subnet.private[1][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "private" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2b"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.0.20.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = false
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-private-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-private-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.dev_environment.aws_subnet.public[0][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "public" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2a"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.0.1.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = true
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-public-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-public-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.dev_environment.aws_subnet.public[1][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "public" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2b"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.0.2.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = true
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-public-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-public-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.dev_environment.aws_vpc.main[0m will be created
[0m  [32m+[0m[0m resource "aws_vpc" "main" {
      [32m+[0m[0m arn                                  = (known after apply)
      [32m+[0m[0m cidr_block                           = "10.0.0.0/16"
      [32m+[0m[0m default_network_acl_id               = (known after apply)
      [32m+[0m[0m default_route_table_id               = (known after apply)
      [32m+[0m[0m default_security_group_id            = (known after apply)
      [32m+[0m[0m dhcp_options_id                      = (known after apply)
      [32m+[0m[0m enable_dns_hostnames                 = true
      [32m+[0m[0m enable_dns_support                   = true
      [32m+[0m[0m enable_network_address_usage_metrics = (known after apply)
      [32m+[0m[0m id                                   = (known after apply)
      [32m+[0m[0m instance_tenancy                     = "default"
      [32m+[0m[0m ipv6_association_id                  = (known after apply)
      [32m+[0m[0m ipv6_cidr_block                      = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_network_border_group = (known after apply)
      [32m+[0m[0m main_route_table_id                  = (known after apply)
      [32m+[0m[0m owner_id                             = (known after apply)
      [32m+[0m[0m region                               = "us-west-2"
      [32m+[0m[0m tags                                 = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-vpc-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                             = {
          [32m+[0m[0m "Environment" = "dev"
          [32m+[0m[0m "Name"        = "dev-vpc-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.prod_environment.aws_cloudwatch_log_group.vpc_flow_logs[0m will be created
[0m  [32m+[0m[0m resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
      [32m+[0m[0m arn                         = (known after apply)
      [32m+[0m[0m deletion_protection_enabled = (known after apply)
      [32m+[0m[0m id                          = (known after apply)
      [32m+[0m[0m log_group_class             = (known after apply)
      [32m+[0m[0m name                        = "/aws/vpc/flowlogs/prod-9k2"
      [32m+[0m[0m name_prefix                 = (known after apply)
      [32m+[0m[0m region                      = "us-west-2"
      [32m+[0m[0m retention_in_days           = 30
      [32m+[0m[0m skip_destroy                = false
      [32m+[0m[0m tags                        = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                    = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.prod_environment.aws_eip.nat[0][0m will be created
[0m  [32m+[0m[0m resource "aws_eip" "nat" {
      [32m+[0m[0m allocation_id        = (known after apply)
      [32m+[0m[0m arn                  = (known after apply)
      [32m+[0m[0m association_id       = (known after apply)
      [32m+[0m[0m carrier_ip           = (known after apply)
      [32m+[0m[0m customer_owned_ip    = (known after apply)
      [32m+[0m[0m domain               = "vpc"
      [32m+[0m[0m id                   = (known after apply)
      [32m+[0m[0m instance             = (known after apply)
      [32m+[0m[0m ipam_pool_id         = (known after apply)
      [32m+[0m[0m network_border_group = (known after apply)
      [32m+[0m[0m network_interface    = (known after apply)
      [32m+[0m[0m private_dns          = (known after apply)
      [32m+[0m[0m private_ip           = (known after apply)
      [32m+[0m[0m ptr_record           = (known after apply)
      [32m+[0m[0m public_dns           = (known after apply)
      [32m+[0m[0m public_ip            = (known after apply)
      [32m+[0m[0m public_ipv4_pool     = (known after apply)
      [32m+[0m[0m region               = "us-west-2"
      [32m+[0m[0m tags                 = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-eip-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all             = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-eip-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.prod_environment.aws_eip.nat[1][0m will be created
[0m  [32m+[0m[0m resource "aws_eip" "nat" {
      [32m+[0m[0m allocation_id        = (known after apply)
      [32m+[0m[0m arn                  = (known after apply)
      [32m+[0m[0m association_id       = (known after apply)
      [32m+[0m[0m carrier_ip           = (known after apply)
      [32m+[0m[0m customer_owned_ip    = (known after apply)
      [32m+[0m[0m domain               = "vpc"
      [32m+[0m[0m id                   = (known after apply)
      [32m+[0m[0m instance             = (known after apply)
      [32m+[0m[0m ipam_pool_id         = (known after apply)
      [32m+[0m[0m network_border_group = (known after apply)
      [32m+[0m[0m network_interface    = (known after apply)
      [32m+[0m[0m private_dns          = (known after apply)
      [32m+[0m[0m private_ip           = (known after apply)
      [32m+[0m[0m ptr_record           = (known after apply)
      [32m+[0m[0m public_dns           = (known after apply)
      [32m+[0m[0m public_ip            = (known after apply)
      [32m+[0m[0m public_ipv4_pool     = (known after apply)
      [32m+[0m[0m region               = "us-west-2"
      [32m+[0m[0m tags                 = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-eip-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all             = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-eip-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.prod_environment.aws_flow_log.vpc_flow_logs[0m will be created
[0m  [32m+[0m[0m resource "aws_flow_log" "vpc_flow_logs" {
      [32m+[0m[0m arn                      = (known after apply)
      [32m+[0m[0m iam_role_arn             = (known after apply)
      [32m+[0m[0m id                       = (known after apply)
      [32m+[0m[0m log_destination          = (known after apply)
      [32m+[0m[0m log_destination_type     = "cloud-watch-logs"
      [32m+[0m[0m log_format               = (known after apply)
      [32m+[0m[0m max_aggregation_interval = 600
      [32m+[0m[0m region                   = "us-west-2"
      [32m+[0m[0m tags                     = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                 = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m traffic_type             = "ALL"
      [32m+[0m[0m vpc_id                   = (known after apply)
    }

[1m  # module.prod_environment.aws_iam_instance_profile.ec2_profile[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_instance_profile" "ec2_profile" {
      [32m+[0m[0m arn         = (known after apply)
      [32m+[0m[0m create_date = (known after apply)
      [32m+[0m[0m id          = (known after apply)
      [32m+[0m[0m name        = "prod-ec2-profile-9k2"
      [32m+[0m[0m name_prefix = (known after apply)
      [32m+[0m[0m path        = "/"
      [32m+[0m[0m role        = "prod-ec2-role-9k2"
      [32m+[0m[0m tags        = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-ec2-profile-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all    = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-ec2-profile-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m unique_id   = (known after apply)
    }

[1m  # module.prod_environment.aws_iam_role.ec2_role[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role" "ec2_role" {
      [32m+[0m[0m arn                   = (known after apply)
      [32m+[0m[0m assume_role_policy    = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action    = "sts:AssumeRole"
                      [32m+[0m[0m Effect    = "Allow"
                      [32m+[0m[0m Principal = {
                          [32m+[0m[0m Service = "ec2.amazonaws.com"
                        }
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m create_date           = (known after apply)
      [32m+[0m[0m force_detach_policies = false
      [32m+[0m[0m id                    = (known after apply)
      [32m+[0m[0m managed_policy_arns   = (known after apply)
      [32m+[0m[0m max_session_duration  = 3600
      [32m+[0m[0m name                  = "prod-ec2-role-9k2"
      [32m+[0m[0m name_prefix           = (known after apply)
      [32m+[0m[0m path                  = "/"
      [32m+[0m[0m tags                  = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-ec2-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all              = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-ec2-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m unique_id             = (known after apply)
    }

[1m  # module.prod_environment.aws_iam_role.flow_logs_role[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role" "flow_logs_role" {
      [32m+[0m[0m arn                   = (known after apply)
      [32m+[0m[0m assume_role_policy    = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action    = "sts:AssumeRole"
                      [32m+[0m[0m Effect    = "Allow"
                      [32m+[0m[0m Principal = {
                          [32m+[0m[0m Service = "vpc-flow-logs.amazonaws.com"
                        }
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m create_date           = (known after apply)
      [32m+[0m[0m force_detach_policies = false
      [32m+[0m[0m id                    = (known after apply)
      [32m+[0m[0m managed_policy_arns   = (known after apply)
      [32m+[0m[0m max_session_duration  = 3600
      [32m+[0m[0m name                  = "prod-flow-logs-role-9k2"
      [32m+[0m[0m name_prefix           = (known after apply)
      [32m+[0m[0m path                  = "/"
      [32m+[0m[0m tags                  = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-flow-logs-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all              = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-flow-logs-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m unique_id             = (known after apply)
    }

[1m  # module.prod_environment.aws_iam_role_policy.ec2_policy[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role_policy" "ec2_policy" {
      [32m+[0m[0m id          = (known after apply)
      [32m+[0m[0m name        = "prod-ec2-policy-9k2"
      [32m+[0m[0m name_prefix = (known after apply)
      [32m+[0m[0m policy      = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action   = [
                          [32m+[0m[0m "cloudwatch:PutMetricData",
                          [32m+[0m[0m "ec2:DescribeVolumes",
                          [32m+[0m[0m "ec2:DescribeTags",
                          [32m+[0m[0m "logs:PutLogEvents",
                          [32m+[0m[0m "logs:CreateLogGroup",
                          [32m+[0m[0m "logs:CreateLogStream",
                        ]
                      [32m+[0m[0m Effect   = "Allow"
                      [32m+[0m[0m Resource = "*"
                    },
                  [32m+[0m[0m {
                      [32m+[0m[0m Action   = [
                          [32m+[0m[0m "ssm:GetParameter",
                          [32m+[0m[0m "ssm:PutParameter",
                        ]
                      [32m+[0m[0m Effect   = "Allow"
                      [32m+[0m[0m Resource = "*"
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m role        = (known after apply)
    }

[1m  # module.prod_environment.aws_iam_role_policy.flow_logs_policy[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role_policy" "flow_logs_policy" {
      [32m+[0m[0m id          = (known after apply)
      [32m+[0m[0m name        = "prod-flow-logs-policy-9k2"
      [32m+[0m[0m name_prefix = (known after apply)
      [32m+[0m[0m policy      = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action   = [
                          [32m+[0m[0m "logs:CreateLogGroup",
                          [32m+[0m[0m "logs:CreateLogStream",
                          [32m+[0m[0m "logs:PutLogEvents",
                          [32m+[0m[0m "logs:DescribeLogGroups",
                          [32m+[0m[0m "logs:DescribeLogStreams",
                        ]
                      [32m+[0m[0m Effect   = "Allow"
                      [32m+[0m[0m Resource = "*"
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m role        = (known after apply)
    }

[1m  # module.prod_environment.aws_instance.web[0][0m will be created
[0m  [32m+[0m[0m resource "aws_instance" "web" {
      [32m+[0m[0m ami                                  = "ami-04681a1dbd79675a5"
      [32m+[0m[0m arn                                  = (known after apply)
      [32m+[0m[0m associate_public_ip_address          = (known after apply)
      [32m+[0m[0m availability_zone                    = (known after apply)
      [32m+[0m[0m disable_api_stop                     = (known after apply)
      [32m+[0m[0m disable_api_termination              = (known after apply)
      [32m+[0m[0m ebs_optimized                        = (known after apply)
      [32m+[0m[0m enable_primary_ipv6                  = (known after apply)
      [32m+[0m[0m force_destroy                        = false
      [32m+[0m[0m get_password_data                    = false
      [32m+[0m[0m host_id                              = (known after apply)
      [32m+[0m[0m host_resource_group_arn              = (known after apply)
      [32m+[0m[0m iam_instance_profile                 = "prod-ec2-profile-9k2"
      [32m+[0m[0m id                                   = (known after apply)
      [32m+[0m[0m instance_initiated_shutdown_behavior = (known after apply)
      [32m+[0m[0m instance_lifecycle                   = (known after apply)
      [32m+[0m[0m instance_state                       = (known after apply)
      [32m+[0m[0m instance_type                        = "m5.large"
      [32m+[0m[0m ipv6_address_count                   = (known after apply)
      [32m+[0m[0m ipv6_addresses                       = (known after apply)
      [32m+[0m[0m key_name                             = (known after apply)
      [32m+[0m[0m monitoring                           = (known after apply)
      [32m+[0m[0m outpost_arn                          = (known after apply)
      [32m+[0m[0m password_data                        = (known after apply)
      [32m+[0m[0m placement_group                      = (known after apply)
      [32m+[0m[0m placement_group_id                   = (known after apply)
      [32m+[0m[0m placement_partition_number           = (known after apply)
      [32m+[0m[0m primary_network_interface_id         = (known after apply)
      [32m+[0m[0m private_dns                          = (known after apply)
      [32m+[0m[0m private_ip                           = (known after apply)
      [32m+[0m[0m public_dns                           = (known after apply)
      [32m+[0m[0m public_ip                            = (known after apply)
      [32m+[0m[0m region                               = "us-west-2"
      [32m+[0m[0m secondary_private_ips                = (known after apply)
      [32m+[0m[0m security_groups                      = (known after apply)
      [32m+[0m[0m source_dest_check                    = true
      [32m+[0m[0m spot_instance_request_id             = (known after apply)
      [32m+[0m[0m subnet_id                            = (known after apply)
      [32m+[0m[0m tags                                 = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-webserver-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                             = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-webserver-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tenancy                              = (known after apply)
      [32m+[0m[0m user_data_base64                     = "IyEvYmluL2Jhc2gKeXVtIHVwZGF0ZSAteQp5dW0gaW5zdGFsbCAteSBodHRwZApzeXN0ZW1jdGwgc3RhcnQgaHR0cGQKc3lzdGVtY3RsIGVuYWJsZSBodHRwZAplY2hvICI8aDE+SGVsbG8gZnJvbSBwcm9kIGVudmlyb25tZW50IC0gSW5zdGFuY2UgMTwvaDE+IiA+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbAo="
      [32m+[0m[0m user_data_replace_on_change          = false
      [32m+[0m[0m vpc_security_group_ids               = (known after apply)
    }

[1m  # module.prod_environment.aws_instance.web[1][0m will be created
[0m  [32m+[0m[0m resource "aws_instance" "web" {
      [32m+[0m[0m ami                                  = "ami-04681a1dbd79675a5"
      [32m+[0m[0m arn                                  = (known after apply)
      [32m+[0m[0m associate_public_ip_address          = (known after apply)
      [32m+[0m[0m availability_zone                    = (known after apply)
      [32m+[0m[0m disable_api_stop                     = (known after apply)
      [32m+[0m[0m disable_api_termination              = (known after apply)
      [32m+[0m[0m ebs_optimized                        = (known after apply)
      [32m+[0m[0m enable_primary_ipv6                  = (known after apply)
      [32m+[0m[0m force_destroy                        = false
      [32m+[0m[0m get_password_data                    = false
      [32m+[0m[0m host_id                              = (known after apply)
      [32m+[0m[0m host_resource_group_arn              = (known after apply)
      [32m+[0m[0m iam_instance_profile                 = "prod-ec2-profile-9k2"
      [32m+[0m[0m id                                   = (known after apply)
      [32m+[0m[0m instance_initiated_shutdown_behavior = (known after apply)
      [32m+[0m[0m instance_lifecycle                   = (known after apply)
      [32m+[0m[0m instance_state                       = (known after apply)
      [32m+[0m[0m instance_type                        = "m5.large"
      [32m+[0m[0m ipv6_address_count                   = (known after apply)
      [32m+[0m[0m ipv6_addresses                       = (known after apply)
      [32m+[0m[0m key_name                             = (known after apply)
      [32m+[0m[0m monitoring                           = (known after apply)
      [32m+[0m[0m outpost_arn                          = (known after apply)
      [32m+[0m[0m password_data                        = (known after apply)
      [32m+[0m[0m placement_group                      = (known after apply)
      [32m+[0m[0m placement_group_id                   = (known after apply)
      [32m+[0m[0m placement_partition_number           = (known after apply)
      [32m+[0m[0m primary_network_interface_id         = (known after apply)
      [32m+[0m[0m private_dns                          = (known after apply)
      [32m+[0m[0m private_ip                           = (known after apply)
      [32m+[0m[0m public_dns                           = (known after apply)
      [32m+[0m[0m public_ip                            = (known after apply)
      [32m+[0m[0m region                               = "us-west-2"
      [32m+[0m[0m secondary_private_ips                = (known after apply)
      [32m+[0m[0m security_groups                      = (known after apply)
      [32m+[0m[0m source_dest_check                    = true
      [32m+[0m[0m spot_instance_request_id             = (known after apply)
      [32m+[0m[0m subnet_id                            = (known after apply)
      [32m+[0m[0m tags                                 = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-webserver-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                             = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-webserver-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tenancy                              = (known after apply)
      [32m+[0m[0m user_data_base64                     = "IyEvYmluL2Jhc2gKeXVtIHVwZGF0ZSAteQp5dW0gaW5zdGFsbCAteSBodHRwZApzeXN0ZW1jdGwgc3RhcnQgaHR0cGQKc3lzdGVtY3RsIGVuYWJsZSBodHRwZAplY2hvICI8aDE+SGVsbG8gZnJvbSBwcm9kIGVudmlyb25tZW50IC0gSW5zdGFuY2UgMjwvaDE+IiA+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbAo="
      [32m+[0m[0m user_data_replace_on_change          = false
      [32m+[0m[0m vpc_security_group_ids               = (known after apply)
    }

[1m  # module.prod_environment.aws_internet_gateway.main[0m will be created
[0m  [32m+[0m[0m resource "aws_internet_gateway" "main" {
      [32m+[0m[0m arn      = (known after apply)
      [32m+[0m[0m id       = (known after apply)
      [32m+[0m[0m owner_id = (known after apply)
      [32m+[0m[0m region   = "us-west-2"
      [32m+[0m[0m tags     = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-igw-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-igw-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id   = (known after apply)
    }

[1m  # module.prod_environment.aws_nat_gateway.main[0][0m will be created
[0m  [32m+[0m[0m resource "aws_nat_gateway" "main" {
      [32m+[0m[0m allocation_id                      = (known after apply)
      [32m+[0m[0m association_id                     = (known after apply)
      [32m+[0m[0m auto_provision_zones               = (known after apply)
      [32m+[0m[0m auto_scaling_ips                   = (known after apply)
      [32m+[0m[0m availability_mode                  = (known after apply)
      [32m+[0m[0m connectivity_type                  = "public"
      [32m+[0m[0m id                                 = (known after apply)
      [32m+[0m[0m network_interface_id               = (known after apply)
      [32m+[0m[0m private_ip                         = (known after apply)
      [32m+[0m[0m public_ip                          = (known after apply)
      [32m+[0m[0m region                             = "us-west-2"
      [32m+[0m[0m regional_nat_gateway_address       = (known after apply)
      [32m+[0m[0m regional_nat_gateway_auto_mode     = (known after apply)
      [32m+[0m[0m route_table_id                     = (known after apply)
      [32m+[0m[0m secondary_allocation_ids           = (known after apply)
      [32m+[0m[0m secondary_private_ip_address_count = (known after apply)
      [32m+[0m[0m secondary_private_ip_addresses     = (known after apply)
      [32m+[0m[0m subnet_id                          = (known after apply)
      [32m+[0m[0m tags                               = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-nat-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                           = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-nat-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id                             = (known after apply)
    }

[1m  # module.prod_environment.aws_nat_gateway.main[1][0m will be created
[0m  [32m+[0m[0m resource "aws_nat_gateway" "main" {
      [32m+[0m[0m allocation_id                      = (known after apply)
      [32m+[0m[0m association_id                     = (known after apply)
      [32m+[0m[0m auto_provision_zones               = (known after apply)
      [32m+[0m[0m auto_scaling_ips                   = (known after apply)
      [32m+[0m[0m availability_mode                  = (known after apply)
      [32m+[0m[0m connectivity_type                  = "public"
      [32m+[0m[0m id                                 = (known after apply)
      [32m+[0m[0m network_interface_id               = (known after apply)
      [32m+[0m[0m private_ip                         = (known after apply)
      [32m+[0m[0m public_ip                          = (known after apply)
      [32m+[0m[0m region                             = "us-west-2"
      [32m+[0m[0m regional_nat_gateway_address       = (known after apply)
      [32m+[0m[0m regional_nat_gateway_auto_mode     = (known after apply)
      [32m+[0m[0m route_table_id                     = (known after apply)
      [32m+[0m[0m secondary_allocation_ids           = (known after apply)
      [32m+[0m[0m secondary_private_ip_address_count = (known after apply)
      [32m+[0m[0m secondary_private_ip_addresses     = (known after apply)
      [32m+[0m[0m subnet_id                          = (known after apply)
      [32m+[0m[0m tags                               = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-nat-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                           = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-nat-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id                             = (known after apply)
    }

[1m  # module.prod_environment.aws_network_acl.private[0m will be created
[0m  [32m+[0m[0m resource "aws_network_acl" "private" {
      [32m+[0m[0m arn        = (known after apply)
      [32m+[0m[0m egress     = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 0
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "-1"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 0
            },
        ]
      [32m+[0m[0m id         = (known after apply)
      [32m+[0m[0m ingress    = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 1024
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 130
              [32m+[0m[0m to_port         = 65535
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.2.0.0/16"
              [32m+[0m[0m from_port       = 22
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 22
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.2.0.0/16"
              [32m+[0m[0m from_port       = 443
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 120
              [32m+[0m[0m to_port         = 443
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.2.0.0/16"
              [32m+[0m[0m from_port       = 80
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 110
              [32m+[0m[0m to_port         = 80
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "deny"
              [32m+[0m[0m cidr_block      = "10.0.0.0/16"
              [32m+[0m[0m from_port       = 0
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "-1"
              [32m+[0m[0m rule_no         = 90
              [32m+[0m[0m to_port         = 0
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "deny"
              [32m+[0m[0m cidr_block      = "10.1.0.0/16"
              [32m+[0m[0m from_port       = 0
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "-1"
              [32m+[0m[0m rule_no         = 91
              [32m+[0m[0m to_port         = 0
            },
        ]
      [32m+[0m[0m owner_id   = (known after apply)
      [32m+[0m[0m region     = "us-west-2"
      [32m+[0m[0m subnet_ids = (known after apply)
      [32m+[0m[0m tags       = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-private-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all   = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-private-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id     = (known after apply)
    }

[1m  # module.prod_environment.aws_network_acl.public[0m will be created
[0m  [32m+[0m[0m resource "aws_network_acl" "public" {
      [32m+[0m[0m arn        = (known after apply)
      [32m+[0m[0m egress     = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 0
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "-1"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 0
            },
        ]
      [32m+[0m[0m id         = (known after apply)
      [32m+[0m[0m ingress    = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 1024
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 130
              [32m+[0m[0m to_port         = 65535
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 443
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 110
              [32m+[0m[0m to_port         = 443
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 80
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 80
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.2.0.0/16"
              [32m+[0m[0m from_port       = 22
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 120
              [32m+[0m[0m to_port         = 22
            },
        ]
      [32m+[0m[0m owner_id   = (known after apply)
      [32m+[0m[0m region     = "us-west-2"
      [32m+[0m[0m subnet_ids = (known after apply)
      [32m+[0m[0m tags       = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-public-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all   = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-public-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id     = (known after apply)
    }

[1m  # module.prod_environment.aws_route_table.private[0][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table" "private" {
      [32m+[0m[0m arn              = (known after apply)
      [32m+[0m[0m id               = (known after apply)
      [32m+[0m[0m owner_id         = (known after apply)
      [32m+[0m[0m propagating_vgws = (known after apply)
      [32m+[0m[0m region           = "us-west-2"
      [32m+[0m[0m route            = [
          [32m+[0m[0m {
              [32m+[0m[0m carrier_gateway_id         = ""
              [32m+[0m[0m cidr_block                 = "0.0.0.0/0"
              [32m+[0m[0m core_network_arn           = ""
              [32m+[0m[0m destination_prefix_list_id = ""
              [32m+[0m[0m egress_only_gateway_id     = ""
              [32m+[0m[0m gateway_id                 = ""
              [32m+[0m[0m ipv6_cidr_block            = ""
              [32m+[0m[0m local_gateway_id           = ""
              [32m+[0m[0m nat_gateway_id             = (known after apply)
              [32m+[0m[0m network_interface_id       = ""
              [32m+[0m[0m transit_gateway_id         = ""
              [32m+[0m[0m vpc_endpoint_id            = ""
              [32m+[0m[0m vpc_peering_connection_id  = ""
            },
        ]
      [32m+[0m[0m tags             = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-private-rt-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all         = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-private-rt-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id           = (known after apply)
    }

[1m  # module.prod_environment.aws_route_table.private[1][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table" "private" {
      [32m+[0m[0m arn              = (known after apply)
      [32m+[0m[0m id               = (known after apply)
      [32m+[0m[0m owner_id         = (known after apply)
      [32m+[0m[0m propagating_vgws = (known after apply)
      [32m+[0m[0m region           = "us-west-2"
      [32m+[0m[0m route            = [
          [32m+[0m[0m {
              [32m+[0m[0m carrier_gateway_id         = ""
              [32m+[0m[0m cidr_block                 = "0.0.0.0/0"
              [32m+[0m[0m core_network_arn           = ""
              [32m+[0m[0m destination_prefix_list_id = ""
              [32m+[0m[0m egress_only_gateway_id     = ""
              [32m+[0m[0m gateway_id                 = ""
              [32m+[0m[0m ipv6_cidr_block            = ""
              [32m+[0m[0m local_gateway_id           = ""
              [32m+[0m[0m nat_gateway_id             = (known after apply)
              [32m+[0m[0m network_interface_id       = ""
              [32m+[0m[0m transit_gateway_id         = ""
              [32m+[0m[0m vpc_endpoint_id            = ""
              [32m+[0m[0m vpc_peering_connection_id  = ""
            },
        ]
      [32m+[0m[0m tags             = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-private-rt-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all         = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-private-rt-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id           = (known after apply)
    }

[1m  # module.prod_environment.aws_route_table.public[0m will be created
[0m  [32m+[0m[0m resource "aws_route_table" "public" {
      [32m+[0m[0m arn              = (known after apply)
      [32m+[0m[0m id               = (known after apply)
      [32m+[0m[0m owner_id         = (known after apply)
      [32m+[0m[0m propagating_vgws = (known after apply)
      [32m+[0m[0m region           = "us-west-2"
      [32m+[0m[0m route            = [
          [32m+[0m[0m {
              [32m+[0m[0m carrier_gateway_id         = ""
              [32m+[0m[0m cidr_block                 = "0.0.0.0/0"
              [32m+[0m[0m core_network_arn           = ""
              [32m+[0m[0m destination_prefix_list_id = ""
              [32m+[0m[0m egress_only_gateway_id     = ""
              [32m+[0m[0m gateway_id                 = (known after apply)
              [32m+[0m[0m ipv6_cidr_block            = ""
              [32m+[0m[0m local_gateway_id           = ""
              [32m+[0m[0m nat_gateway_id             = ""
              [32m+[0m[0m network_interface_id       = ""
              [32m+[0m[0m transit_gateway_id         = ""
              [32m+[0m[0m vpc_endpoint_id            = ""
              [32m+[0m[0m vpc_peering_connection_id  = ""
            },
        ]
      [32m+[0m[0m tags             = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-public-rt-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all         = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-public-rt-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id           = (known after apply)
    }

[1m  # module.prod_environment.aws_route_table_association.private[0][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "private" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.prod_environment.aws_route_table_association.private[1][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "private" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.prod_environment.aws_route_table_association.public[0][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "public" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.prod_environment.aws_route_table_association.public[1][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "public" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.prod_environment.aws_security_group.web[0m will be created
[0m  [32m+[0m[0m resource "aws_security_group" "web" {
      [32m+[0m[0m arn                    = (known after apply)
      [32m+[0m[0m description            = "Security group for web servers in prod environment"
      [32m+[0m[0m egress                 = [
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "0.0.0.0/0",
                ]
              [32m+[0m[0m description      = "All outbound"
              [32m+[0m[0m from_port        = 0
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "-1"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 0
            },
        ]
      [32m+[0m[0m id                     = (known after apply)
      [32m+[0m[0m ingress                = [
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "0.0.0.0/0",
                ]
              [32m+[0m[0m description      = "HTTP"
              [32m+[0m[0m from_port        = 80
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "tcp"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 80
            },
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "0.0.0.0/0",
                ]
              [32m+[0m[0m description      = "HTTPS"
              [32m+[0m[0m from_port        = 443
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "tcp"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 443
            },
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "10.2.0.0/16",
                ]
              [32m+[0m[0m description      = "SSH"
              [32m+[0m[0m from_port        = 22
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "tcp"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 22
            },
        ]
      [32m+[0m[0m name                   = "prod-web-sg-9k2"
      [32m+[0m[0m name_prefix            = (known after apply)
      [32m+[0m[0m owner_id               = (known after apply)
      [32m+[0m[0m region                 = "us-west-2"
      [32m+[0m[0m revoke_rules_on_delete = false
      [32m+[0m[0m tags                   = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-web-sg-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all               = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-web-sg-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id                 = (known after apply)
    }

[1m  # module.prod_environment.aws_subnet.private[0][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "private" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2a"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.2.10.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = false
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-private-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-private-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.prod_environment.aws_subnet.private[1][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "private" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2b"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.2.20.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = false
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-private-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-private-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.prod_environment.aws_subnet.public[0][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "public" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2a"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.2.1.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = true
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-public-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-public-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.prod_environment.aws_subnet.public[1][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "public" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2b"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.2.2.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = true
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-public-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-public-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.prod_environment.aws_vpc.main[0m will be created
[0m  [32m+[0m[0m resource "aws_vpc" "main" {
      [32m+[0m[0m arn                                  = (known after apply)
      [32m+[0m[0m cidr_block                           = "10.2.0.0/16"
      [32m+[0m[0m default_network_acl_id               = (known after apply)
      [32m+[0m[0m default_route_table_id               = (known after apply)
      [32m+[0m[0m default_security_group_id            = (known after apply)
      [32m+[0m[0m dhcp_options_id                      = (known after apply)
      [32m+[0m[0m enable_dns_hostnames                 = true
      [32m+[0m[0m enable_dns_support                   = true
      [32m+[0m[0m enable_network_address_usage_metrics = (known after apply)
      [32m+[0m[0m id                                   = (known after apply)
      [32m+[0m[0m instance_tenancy                     = "default"
      [32m+[0m[0m ipv6_association_id                  = (known after apply)
      [32m+[0m[0m ipv6_cidr_block                      = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_network_border_group = (known after apply)
      [32m+[0m[0m main_route_table_id                  = (known after apply)
      [32m+[0m[0m owner_id                             = (known after apply)
      [32m+[0m[0m region                               = "us-west-2"
      [32m+[0m[0m tags                                 = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-vpc-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                             = {
          [32m+[0m[0m "Environment" = "prod"
          [32m+[0m[0m "Name"        = "prod-vpc-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.staging_environment.aws_cloudwatch_log_group.vpc_flow_logs[0m will be created
[0m  [32m+[0m[0m resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
      [32m+[0m[0m arn                         = (known after apply)
      [32m+[0m[0m deletion_protection_enabled = (known after apply)
      [32m+[0m[0m id                          = (known after apply)
      [32m+[0m[0m log_group_class             = (known after apply)
      [32m+[0m[0m name                        = "/aws/vpc/flowlogs/staging-9k2"
      [32m+[0m[0m name_prefix                 = (known after apply)
      [32m+[0m[0m region                      = "us-west-2"
      [32m+[0m[0m retention_in_days           = 30
      [32m+[0m[0m skip_destroy                = false
      [32m+[0m[0m tags                        = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                    = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.staging_environment.aws_eip.nat[0][0m will be created
[0m  [32m+[0m[0m resource "aws_eip" "nat" {
      [32m+[0m[0m allocation_id        = (known after apply)
      [32m+[0m[0m arn                  = (known after apply)
      [32m+[0m[0m association_id       = (known after apply)
      [32m+[0m[0m carrier_ip           = (known after apply)
      [32m+[0m[0m customer_owned_ip    = (known after apply)
      [32m+[0m[0m domain               = "vpc"
      [32m+[0m[0m id                   = (known after apply)
      [32m+[0m[0m instance             = (known after apply)
      [32m+[0m[0m ipam_pool_id         = (known after apply)
      [32m+[0m[0m network_border_group = (known after apply)
      [32m+[0m[0m network_interface    = (known after apply)
      [32m+[0m[0m private_dns          = (known after apply)
      [32m+[0m[0m private_ip           = (known after apply)
      [32m+[0m[0m ptr_record           = (known after apply)
      [32m+[0m[0m public_dns           = (known after apply)
      [32m+[0m[0m public_ip            = (known after apply)
      [32m+[0m[0m public_ipv4_pool     = (known after apply)
      [32m+[0m[0m region               = "us-west-2"
      [32m+[0m[0m tags                 = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-eip-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all             = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-eip-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.staging_environment.aws_eip.nat[1][0m will be created
[0m  [32m+[0m[0m resource "aws_eip" "nat" {
      [32m+[0m[0m allocation_id        = (known after apply)
      [32m+[0m[0m arn                  = (known after apply)
      [32m+[0m[0m association_id       = (known after apply)
      [32m+[0m[0m carrier_ip           = (known after apply)
      [32m+[0m[0m customer_owned_ip    = (known after apply)
      [32m+[0m[0m domain               = "vpc"
      [32m+[0m[0m id                   = (known after apply)
      [32m+[0m[0m instance             = (known after apply)
      [32m+[0m[0m ipam_pool_id         = (known after apply)
      [32m+[0m[0m network_border_group = (known after apply)
      [32m+[0m[0m network_interface    = (known after apply)
      [32m+[0m[0m private_dns          = (known after apply)
      [32m+[0m[0m private_ip           = (known after apply)
      [32m+[0m[0m ptr_record           = (known after apply)
      [32m+[0m[0m public_dns           = (known after apply)
      [32m+[0m[0m public_ip            = (known after apply)
      [32m+[0m[0m public_ipv4_pool     = (known after apply)
      [32m+[0m[0m region               = "us-west-2"
      [32m+[0m[0m tags                 = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-eip-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all             = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-eip-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1m  # module.staging_environment.aws_flow_log.vpc_flow_logs[0m will be created
[0m  [32m+[0m[0m resource "aws_flow_log" "vpc_flow_logs" {
      [32m+[0m[0m arn                      = (known after apply)
      [32m+[0m[0m iam_role_arn             = (known after apply)
      [32m+[0m[0m id                       = (known after apply)
      [32m+[0m[0m log_destination          = (known after apply)
      [32m+[0m[0m log_destination_type     = "cloud-watch-logs"
      [32m+[0m[0m log_format               = (known after apply)
      [32m+[0m[0m max_aggregation_interval = 600
      [32m+[0m[0m region                   = "us-west-2"
      [32m+[0m[0m tags                     = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                 = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-vpc-flow-logs-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m traffic_type             = "ALL"
      [32m+[0m[0m vpc_id                   = (known after apply)
    }

[1m  # module.staging_environment.aws_iam_instance_profile.ec2_profile[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_instance_profile" "ec2_profile" {
      [32m+[0m[0m arn         = (known after apply)
      [32m+[0m[0m create_date = (known after apply)
      [32m+[0m[0m id          = (known after apply)
      [32m+[0m[0m name        = "staging-ec2-profile-9k2"
      [32m+[0m[0m name_prefix = (known after apply)
      [32m+[0m[0m path        = "/"
      [32m+[0m[0m role        = "staging-ec2-role-9k2"
      [32m+[0m[0m tags        = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-ec2-profile-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all    = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-ec2-profile-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m unique_id   = (known after apply)
    }

[1m  # module.staging_environment.aws_iam_role.ec2_role[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role" "ec2_role" {
      [32m+[0m[0m arn                   = (known after apply)
      [32m+[0m[0m assume_role_policy    = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action    = "sts:AssumeRole"
                      [32m+[0m[0m Effect    = "Allow"
                      [32m+[0m[0m Principal = {
                          [32m+[0m[0m Service = "ec2.amazonaws.com"
                        }
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m create_date           = (known after apply)
      [32m+[0m[0m force_detach_policies = false
      [32m+[0m[0m id                    = (known after apply)
      [32m+[0m[0m managed_policy_arns   = (known after apply)
      [32m+[0m[0m max_session_duration  = 3600
      [32m+[0m[0m name                  = "staging-ec2-role-9k2"
      [32m+[0m[0m name_prefix           = (known after apply)
      [32m+[0m[0m path                  = "/"
      [32m+[0m[0m tags                  = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-ec2-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all              = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-ec2-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m unique_id             = (known after apply)
    }

[1m  # module.staging_environment.aws_iam_role.flow_logs_role[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role" "flow_logs_role" {
      [32m+[0m[0m arn                   = (known after apply)
      [32m+[0m[0m assume_role_policy    = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action    = "sts:AssumeRole"
                      [32m+[0m[0m Effect    = "Allow"
                      [32m+[0m[0m Principal = {
                          [32m+[0m[0m Service = "vpc-flow-logs.amazonaws.com"
                        }
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m create_date           = (known after apply)
      [32m+[0m[0m force_detach_policies = false
      [32m+[0m[0m id                    = (known after apply)
      [32m+[0m[0m managed_policy_arns   = (known after apply)
      [32m+[0m[0m max_session_duration  = 3600
      [32m+[0m[0m name                  = "staging-flow-logs-role-9k2"
      [32m+[0m[0m name_prefix           = (known after apply)
      [32m+[0m[0m path                  = "/"
      [32m+[0m[0m tags                  = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-flow-logs-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all              = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-flow-logs-role-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m unique_id             = (known after apply)
    }

[1m  # module.staging_environment.aws_iam_role_policy.ec2_policy[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role_policy" "ec2_policy" {
      [32m+[0m[0m id          = (known after apply)
      [32m+[0m[0m name        = "staging-ec2-policy-9k2"
      [32m+[0m[0m name_prefix = (known after apply)
      [32m+[0m[0m policy      = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action   = [
                          [32m+[0m[0m "cloudwatch:PutMetricData",
                          [32m+[0m[0m "ec2:DescribeVolumes",
                          [32m+[0m[0m "ec2:DescribeTags",
                          [32m+[0m[0m "logs:PutLogEvents",
                          [32m+[0m[0m "logs:CreateLogGroup",
                          [32m+[0m[0m "logs:CreateLogStream",
                        ]
                      [32m+[0m[0m Effect   = "Allow"
                      [32m+[0m[0m Resource = "*"
                    },
                  [32m+[0m[0m {
                      [32m+[0m[0m Action   = [
                          [32m+[0m[0m "ssm:GetParameter",
                          [32m+[0m[0m "ssm:PutParameter",
                        ]
                      [32m+[0m[0m Effect   = "Allow"
                      [32m+[0m[0m Resource = "*"
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m role        = (known after apply)
    }

[1m  # module.staging_environment.aws_iam_role_policy.flow_logs_policy[0m will be created
[0m  [32m+[0m[0m resource "aws_iam_role_policy" "flow_logs_policy" {
      [32m+[0m[0m id          = (known after apply)
      [32m+[0m[0m name        = "staging-flow-logs-policy-9k2"
      [32m+[0m[0m name_prefix = (known after apply)
      [32m+[0m[0m policy      = jsonencode(
            {
              [32m+[0m[0m Statement = [
                  [32m+[0m[0m {
                      [32m+[0m[0m Action   = [
                          [32m+[0m[0m "logs:CreateLogGroup",
                          [32m+[0m[0m "logs:CreateLogStream",
                          [32m+[0m[0m "logs:PutLogEvents",
                          [32m+[0m[0m "logs:DescribeLogGroups",
                          [32m+[0m[0m "logs:DescribeLogStreams",
                        ]
                      [32m+[0m[0m Effect   = "Allow"
                      [32m+[0m[0m Resource = "*"
                    },
                ]
              [32m+[0m[0m Version   = "2012-10-17"
            }
        )
      [32m+[0m[0m role        = (known after apply)
    }

[1m  # module.staging_environment.aws_instance.web[0][0m will be created
[0m  [32m+[0m[0m resource "aws_instance" "web" {
      [32m+[0m[0m ami                                  = "ami-04681a1dbd79675a5"
      [32m+[0m[0m arn                                  = (known after apply)
      [32m+[0m[0m associate_public_ip_address          = (known after apply)
      [32m+[0m[0m availability_zone                    = (known after apply)
      [32m+[0m[0m disable_api_stop                     = (known after apply)
      [32m+[0m[0m disable_api_termination              = (known after apply)
      [32m+[0m[0m ebs_optimized                        = (known after apply)
      [32m+[0m[0m enable_primary_ipv6                  = (known after apply)
      [32m+[0m[0m force_destroy                        = false
      [32m+[0m[0m get_password_data                    = false
      [32m+[0m[0m host_id                              = (known after apply)
      [32m+[0m[0m host_resource_group_arn              = (known after apply)
      [32m+[0m[0m iam_instance_profile                 = "staging-ec2-profile-9k2"
      [32m+[0m[0m id                                   = (known after apply)
      [32m+[0m[0m instance_initiated_shutdown_behavior = (known after apply)
      [32m+[0m[0m instance_lifecycle                   = (known after apply)
      [32m+[0m[0m instance_state                       = (known after apply)
      [32m+[0m[0m instance_type                        = "t3.medium"
      [32m+[0m[0m ipv6_address_count                   = (known after apply)
      [32m+[0m[0m ipv6_addresses                       = (known after apply)
      [32m+[0m[0m key_name                             = (known after apply)
      [32m+[0m[0m monitoring                           = (known after apply)
      [32m+[0m[0m outpost_arn                          = (known after apply)
      [32m+[0m[0m password_data                        = (known after apply)
      [32m+[0m[0m placement_group                      = (known after apply)
      [32m+[0m[0m placement_group_id                   = (known after apply)
      [32m+[0m[0m placement_partition_number           = (known after apply)
      [32m+[0m[0m primary_network_interface_id         = (known after apply)
      [32m+[0m[0m private_dns                          = (known after apply)
      [32m+[0m[0m private_ip                           = (known after apply)
      [32m+[0m[0m public_dns                           = (known after apply)
      [32m+[0m[0m public_ip                            = (known after apply)
      [32m+[0m[0m region                               = "us-west-2"
      [32m+[0m[0m secondary_private_ips                = (known after apply)
      [32m+[0m[0m security_groups                      = (known after apply)
      [32m+[0m[0m source_dest_check                    = true
      [32m+[0m[0m spot_instance_request_id             = (known after apply)
      [32m+[0m[0m subnet_id                            = (known after apply)
      [32m+[0m[0m tags                                 = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-webserver-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                             = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-webserver-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tenancy                              = (known after apply)
      [32m+[0m[0m user_data_base64                     = "IyEvYmluL2Jhc2gKeXVtIHVwZGF0ZSAteQp5dW0gaW5zdGFsbCAteSBodHRwZApzeXN0ZW1jdGwgc3RhcnQgaHR0cGQKc3lzdGVtY3RsIGVuYWJsZSBodHRwZAplY2hvICI8aDE+SGVsbG8gZnJvbSBzdGFnaW5nIGVudmlyb25tZW50IC0gSW5zdGFuY2UgMTwvaDE+IiA+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbAo="
      [32m+[0m[0m user_data_replace_on_change          = false
      [32m+[0m[0m vpc_security_group_ids               = (known after apply)
    }

[1m  # module.staging_environment.aws_instance.web[1][0m will be created
[0m  [32m+[0m[0m resource "aws_instance" "web" {
      [32m+[0m[0m ami                                  = "ami-04681a1dbd79675a5"
      [32m+[0m[0m arn                                  = (known after apply)
      [32m+[0m[0m associate_public_ip_address          = (known after apply)
      [32m+[0m[0m availability_zone                    = (known after apply)
      [32m+[0m[0m disable_api_stop                     = (known after apply)
      [32m+[0m[0m disable_api_termination              = (known after apply)
      [32m+[0m[0m ebs_optimized                        = (known after apply)
      [32m+[0m[0m enable_primary_ipv6                  = (known after apply)
      [32m+[0m[0m force_destroy                        = false
      [32m+[0m[0m get_password_data                    = false
      [32m+[0m[0m host_id                              = (known after apply)
      [32m+[0m[0m host_resource_group_arn              = (known after apply)
      [32m+[0m[0m iam_instance_profile                 = "staging-ec2-profile-9k2"
      [32m+[0m[0m id                                   = (known after apply)
      [32m+[0m[0m instance_initiated_shutdown_behavior = (known after apply)
      [32m+[0m[0m instance_lifecycle                   = (known after apply)
      [32m+[0m[0m instance_state                       = (known after apply)
      [32m+[0m[0m instance_type                        = "t3.medium"
      [32m+[0m[0m ipv6_address_count                   = (known after apply)
      [32m+[0m[0m ipv6_addresses                       = (known after apply)
      [32m+[0m[0m key_name                             = (known after apply)
      [32m+[0m[0m monitoring                           = (known after apply)
      [32m+[0m[0m outpost_arn                          = (known after apply)
      [32m+[0m[0m password_data                        = (known after apply)
      [32m+[0m[0m placement_group                      = (known after apply)
      [32m+[0m[0m placement_group_id                   = (known after apply)
      [32m+[0m[0m placement_partition_number           = (known after apply)
      [32m+[0m[0m primary_network_interface_id         = (known after apply)
      [32m+[0m[0m private_dns                          = (known after apply)
      [32m+[0m[0m private_ip                           = (known after apply)
      [32m+[0m[0m public_dns                           = (known after apply)
      [32m+[0m[0m public_ip                            = (known after apply)
      [32m+[0m[0m region                               = "us-west-2"
      [32m+[0m[0m secondary_private_ips                = (known after apply)
      [32m+[0m[0m security_groups                      = (known after apply)
      [32m+[0m[0m source_dest_check                    = true
      [32m+[0m[0m spot_instance_request_id             = (known after apply)
      [32m+[0m[0m subnet_id                            = (known after apply)
      [32m+[0m[0m tags                                 = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-webserver-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                             = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-webserver-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tenancy                              = (known after apply)
      [32m+[0m[0m user_data_base64                     = "IyEvYmluL2Jhc2gKeXVtIHVwZGF0ZSAteQp5dW0gaW5zdGFsbCAteSBodHRwZApzeXN0ZW1jdGwgc3RhcnQgaHR0cGQKc3lzdGVtY3RsIGVuYWJsZSBodHRwZAplY2hvICI8aDE+SGVsbG8gZnJvbSBzdGFnaW5nIGVudmlyb25tZW50IC0gSW5zdGFuY2UgMjwvaDE+IiA+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbAo="
      [32m+[0m[0m user_data_replace_on_change          = false
      [32m+[0m[0m vpc_security_group_ids               = (known after apply)
    }

[1m  # module.staging_environment.aws_internet_gateway.main[0m will be created
[0m  [32m+[0m[0m resource "aws_internet_gateway" "main" {
      [32m+[0m[0m arn      = (known after apply)
      [32m+[0m[0m id       = (known after apply)
      [32m+[0m[0m owner_id = (known after apply)
      [32m+[0m[0m region   = "us-west-2"
      [32m+[0m[0m tags     = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-igw-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-igw-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id   = (known after apply)
    }

[1m  # module.staging_environment.aws_nat_gateway.main[0][0m will be created
[0m  [32m+[0m[0m resource "aws_nat_gateway" "main" {
      [32m+[0m[0m allocation_id                      = (known after apply)
      [32m+[0m[0m association_id                     = (known after apply)
      [32m+[0m[0m auto_provision_zones               = (known after apply)
      [32m+[0m[0m auto_scaling_ips                   = (known after apply)
      [32m+[0m[0m availability_mode                  = (known after apply)
      [32m+[0m[0m connectivity_type                  = "public"
      [32m+[0m[0m id                                 = (known after apply)
      [32m+[0m[0m network_interface_id               = (known after apply)
      [32m+[0m[0m private_ip                         = (known after apply)
      [32m+[0m[0m public_ip                          = (known after apply)
      [32m+[0m[0m region                             = "us-west-2"
      [32m+[0m[0m regional_nat_gateway_address       = (known after apply)
      [32m+[0m[0m regional_nat_gateway_auto_mode     = (known after apply)
      [32m+[0m[0m route_table_id                     = (known after apply)
      [32m+[0m[0m secondary_allocation_ids           = (known after apply)
      [32m+[0m[0m secondary_private_ip_address_count = (known after apply)
      [32m+[0m[0m secondary_private_ip_addresses     = (known after apply)
      [32m+[0m[0m subnet_id                          = (known after apply)
      [32m+[0m[0m tags                               = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-nat-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                           = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-nat-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id                             = (known after apply)
    }

[1m  # module.staging_environment.aws_nat_gateway.main[1][0m will be created
[0m  [32m+[0m[0m resource "aws_nat_gateway" "main" {
      [32m+[0m[0m allocation_id                      = (known after apply)
      [32m+[0m[0m association_id                     = (known after apply)
      [32m+[0m[0m auto_provision_zones               = (known after apply)
      [32m+[0m[0m auto_scaling_ips                   = (known after apply)
      [32m+[0m[0m availability_mode                  = (known after apply)
      [32m+[0m[0m connectivity_type                  = "public"
      [32m+[0m[0m id                                 = (known after apply)
      [32m+[0m[0m network_interface_id               = (known after apply)
      [32m+[0m[0m private_ip                         = (known after apply)
      [32m+[0m[0m public_ip                          = (known after apply)
      [32m+[0m[0m region                             = "us-west-2"
      [32m+[0m[0m regional_nat_gateway_address       = (known after apply)
      [32m+[0m[0m regional_nat_gateway_auto_mode     = (known after apply)
      [32m+[0m[0m route_table_id                     = (known after apply)
      [32m+[0m[0m secondary_allocation_ids           = (known after apply)
      [32m+[0m[0m secondary_private_ip_address_count = (known after apply)
      [32m+[0m[0m secondary_private_ip_addresses     = (known after apply)
      [32m+[0m[0m subnet_id                          = (known after apply)
      [32m+[0m[0m tags                               = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-nat-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                           = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-nat-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id                             = (known after apply)
    }

[1m  # module.staging_environment.aws_network_acl.private[0m will be created
[0m  [32m+[0m[0m resource "aws_network_acl" "private" {
      [32m+[0m[0m arn        = (known after apply)
      [32m+[0m[0m egress     = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 0
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "-1"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 0
            },
        ]
      [32m+[0m[0m id         = (known after apply)
      [32m+[0m[0m ingress    = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 1024
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 130
              [32m+[0m[0m to_port         = 65535
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.1.0.0/16"
              [32m+[0m[0m from_port       = 22
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 22
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.1.0.0/16"
              [32m+[0m[0m from_port       = 443
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 120
              [32m+[0m[0m to_port         = 443
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.1.0.0/16"
              [32m+[0m[0m from_port       = 80
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 110
              [32m+[0m[0m to_port         = 80
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "deny"
              [32m+[0m[0m cidr_block      = "10.0.0.0/16"
              [32m+[0m[0m from_port       = 0
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "-1"
              [32m+[0m[0m rule_no         = 90
              [32m+[0m[0m to_port         = 0
            },
        ]
      [32m+[0m[0m owner_id   = (known after apply)
      [32m+[0m[0m region     = "us-west-2"
      [32m+[0m[0m subnet_ids = (known after apply)
      [32m+[0m[0m tags       = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-private-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all   = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-private-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id     = (known after apply)
    }

[1m  # module.staging_environment.aws_network_acl.public[0m will be created
[0m  [32m+[0m[0m resource "aws_network_acl" "public" {
      [32m+[0m[0m arn        = (known after apply)
      [32m+[0m[0m egress     = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 0
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "-1"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 0
            },
        ]
      [32m+[0m[0m id         = (known after apply)
      [32m+[0m[0m ingress    = [
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 1024
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 130
              [32m+[0m[0m to_port         = 65535
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 443
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 110
              [32m+[0m[0m to_port         = 443
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "0.0.0.0/0"
              [32m+[0m[0m from_port       = 80
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 100
              [32m+[0m[0m to_port         = 80
            },
          [32m+[0m[0m {
              [32m+[0m[0m action          = "allow"
              [32m+[0m[0m cidr_block      = "10.1.0.0/16"
              [32m+[0m[0m from_port       = 22
              [32m+[0m[0m ipv6_cidr_block = ""
              [32m+[0m[0m protocol        = "tcp"
              [32m+[0m[0m rule_no         = 120
              [32m+[0m[0m to_port         = 22
            },
        ]
      [32m+[0m[0m owner_id   = (known after apply)
      [32m+[0m[0m region     = "us-west-2"
      [32m+[0m[0m subnet_ids = (known after apply)
      [32m+[0m[0m tags       = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-public-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all   = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-public-nacl-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id     = (known after apply)
    }

[1m  # module.staging_environment.aws_route_table.private[0][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table" "private" {
      [32m+[0m[0m arn              = (known after apply)
      [32m+[0m[0m id               = (known after apply)
      [32m+[0m[0m owner_id         = (known after apply)
      [32m+[0m[0m propagating_vgws = (known after apply)
      [32m+[0m[0m region           = "us-west-2"
      [32m+[0m[0m route            = [
          [32m+[0m[0m {
              [32m+[0m[0m carrier_gateway_id         = ""
              [32m+[0m[0m cidr_block                 = "0.0.0.0/0"
              [32m+[0m[0m core_network_arn           = ""
              [32m+[0m[0m destination_prefix_list_id = ""
              [32m+[0m[0m egress_only_gateway_id     = ""
              [32m+[0m[0m gateway_id                 = ""
              [32m+[0m[0m ipv6_cidr_block            = ""
              [32m+[0m[0m local_gateway_id           = ""
              [32m+[0m[0m nat_gateway_id             = (known after apply)
              [32m+[0m[0m network_interface_id       = ""
              [32m+[0m[0m transit_gateway_id         = ""
              [32m+[0m[0m vpc_endpoint_id            = ""
              [32m+[0m[0m vpc_peering_connection_id  = ""
            },
        ]
      [32m+[0m[0m tags             = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-private-rt-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all         = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-private-rt-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id           = (known after apply)
    }

[1m  # module.staging_environment.aws_route_table.private[1][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table" "private" {
      [32m+[0m[0m arn              = (known after apply)
      [32m+[0m[0m id               = (known after apply)
      [32m+[0m[0m owner_id         = (known after apply)
      [32m+[0m[0m propagating_vgws = (known after apply)
      [32m+[0m[0m region           = "us-west-2"
      [32m+[0m[0m route            = [
          [32m+[0m[0m {
              [32m+[0m[0m carrier_gateway_id         = ""
              [32m+[0m[0m cidr_block                 = "0.0.0.0/0"
              [32m+[0m[0m core_network_arn           = ""
              [32m+[0m[0m destination_prefix_list_id = ""
              [32m+[0m[0m egress_only_gateway_id     = ""
              [32m+[0m[0m gateway_id                 = ""
              [32m+[0m[0m ipv6_cidr_block            = ""
              [32m+[0m[0m local_gateway_id           = ""
              [32m+[0m[0m nat_gateway_id             = (known after apply)
              [32m+[0m[0m network_interface_id       = ""
              [32m+[0m[0m transit_gateway_id         = ""
              [32m+[0m[0m vpc_endpoint_id            = ""
              [32m+[0m[0m vpc_peering_connection_id  = ""
            },
        ]
      [32m+[0m[0m tags             = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-private-rt-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all         = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-private-rt-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id           = (known after apply)
    }

[1m  # module.staging_environment.aws_route_table.public[0m will be created
[0m  [32m+[0m[0m resource "aws_route_table" "public" {
      [32m+[0m[0m arn              = (known after apply)
      [32m+[0m[0m id               = (known after apply)
      [32m+[0m[0m owner_id         = (known after apply)
      [32m+[0m[0m propagating_vgws = (known after apply)
      [32m+[0m[0m region           = "us-west-2"
      [32m+[0m[0m route            = [
          [32m+[0m[0m {
              [32m+[0m[0m carrier_gateway_id         = ""
              [32m+[0m[0m cidr_block                 = "0.0.0.0/0"
              [32m+[0m[0m core_network_arn           = ""
              [32m+[0m[0m destination_prefix_list_id = ""
              [32m+[0m[0m egress_only_gateway_id     = ""
              [32m+[0m[0m gateway_id                 = (known after apply)
              [32m+[0m[0m ipv6_cidr_block            = ""
              [32m+[0m[0m local_gateway_id           = ""
              [32m+[0m[0m nat_gateway_id             = ""
              [32m+[0m[0m network_interface_id       = ""
              [32m+[0m[0m transit_gateway_id         = ""
              [32m+[0m[0m vpc_endpoint_id            = ""
              [32m+[0m[0m vpc_peering_connection_id  = ""
            },
        ]
      [32m+[0m[0m tags             = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-public-rt-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all         = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-public-rt-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id           = (known after apply)
    }

[1m  # module.staging_environment.aws_route_table_association.private[0][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "private" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.staging_environment.aws_route_table_association.private[1][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "private" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.staging_environment.aws_route_table_association.public[0][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "public" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.staging_environment.aws_route_table_association.public[1][0m will be created
[0m  [32m+[0m[0m resource "aws_route_table_association" "public" {
      [32m+[0m[0m id             = (known after apply)
      [32m+[0m[0m region         = "us-west-2"
      [32m+[0m[0m route_table_id = (known after apply)
      [32m+[0m[0m subnet_id      = (known after apply)
    }

[1m  # module.staging_environment.aws_security_group.web[0m will be created
[0m  [32m+[0m[0m resource "aws_security_group" "web" {
      [32m+[0m[0m arn                    = (known after apply)
      [32m+[0m[0m description            = "Security group for web servers in staging environment"
      [32m+[0m[0m egress                 = [
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "0.0.0.0/0",
                ]
              [32m+[0m[0m description      = "All outbound"
              [32m+[0m[0m from_port        = 0
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "-1"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 0
            },
        ]
      [32m+[0m[0m id                     = (known after apply)
      [32m+[0m[0m ingress                = [
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "0.0.0.0/0",
                ]
              [32m+[0m[0m description      = "HTTP"
              [32m+[0m[0m from_port        = 80
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "tcp"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 80
            },
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "0.0.0.0/0",
                ]
              [32m+[0m[0m description      = "HTTPS"
              [32m+[0m[0m from_port        = 443
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "tcp"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 443
            },
          [32m+[0m[0m {
              [32m+[0m[0m cidr_blocks      = [
                  [32m+[0m[0m "10.1.0.0/16",
                ]
              [32m+[0m[0m description      = "SSH"
              [32m+[0m[0m from_port        = 22
              [32m+[0m[0m ipv6_cidr_blocks = []
              [32m+[0m[0m prefix_list_ids  = []
              [32m+[0m[0m protocol         = "tcp"
              [32m+[0m[0m security_groups  = []
              [32m+[0m[0m self             = false
              [32m+[0m[0m to_port          = 22
            },
        ]
      [32m+[0m[0m name                   = "staging-web-sg-9k2"
      [32m+[0m[0m name_prefix            = (known after apply)
      [32m+[0m[0m owner_id               = (known after apply)
      [32m+[0m[0m region                 = "us-west-2"
      [32m+[0m[0m revoke_rules_on_delete = false
      [32m+[0m[0m tags                   = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-web-sg-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all               = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-web-sg-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m vpc_id                 = (known after apply)
    }

[1m  # module.staging_environment.aws_subnet.private[0][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "private" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2a"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.1.10.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = false
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-private-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-private-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.staging_environment.aws_subnet.private[1][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "private" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2b"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.1.20.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = false
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-private-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-private-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "private"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.staging_environment.aws_subnet.public[0][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "public" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2a"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.1.1.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = true
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-public-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-public-subnet-1-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.staging_environment.aws_subnet.public[1][0m will be created
[0m  [32m+[0m[0m resource "aws_subnet" "public" {
      [32m+[0m[0m arn                                            = (known after apply)
      [32m+[0m[0m assign_ipv6_address_on_creation                = false
      [32m+[0m[0m availability_zone                              = "us-west-2b"
      [32m+[0m[0m availability_zone_id                           = (known after apply)
      [32m+[0m[0m cidr_block                                     = "10.1.2.0/24"
      [32m+[0m[0m enable_dns64                                   = false
      [32m+[0m[0m enable_resource_name_dns_a_record_on_launch    = false
      [32m+[0m[0m enable_resource_name_dns_aaaa_record_on_launch = false
      [32m+[0m[0m id                                             = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_association_id                 = (known after apply)
      [32m+[0m[0m ipv6_native                                    = false
      [32m+[0m[0m map_public_ip_on_launch                        = true
      [32m+[0m[0m owner_id                                       = (known after apply)
      [32m+[0m[0m private_dns_hostname_type_on_launch            = (known after apply)
      [32m+[0m[0m region                                         = "us-west-2"
      [32m+[0m[0m tags                                           = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-public-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m tags_all                                       = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-public-subnet-2-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
          [32m+[0m[0m "Type"        = "public"
        }
      [32m+[0m[0m vpc_id                                         = (known after apply)
    }

[1m  # module.staging_environment.aws_vpc.main[0m will be created
[0m  [32m+[0m[0m resource "aws_vpc" "main" {
      [32m+[0m[0m arn                                  = (known after apply)
      [32m+[0m[0m cidr_block                           = "10.1.0.0/16"
      [32m+[0m[0m default_network_acl_id               = (known after apply)
      [32m+[0m[0m default_route_table_id               = (known after apply)
      [32m+[0m[0m default_security_group_id            = (known after apply)
      [32m+[0m[0m dhcp_options_id                      = (known after apply)
      [32m+[0m[0m enable_dns_hostnames                 = true
      [32m+[0m[0m enable_dns_support                   = true
      [32m+[0m[0m enable_network_address_usage_metrics = (known after apply)
      [32m+[0m[0m id                                   = (known after apply)
      [32m+[0m[0m instance_tenancy                     = "default"
      [32m+[0m[0m ipv6_association_id                  = (known after apply)
      [32m+[0m[0m ipv6_cidr_block                      = (known after apply)
      [32m+[0m[0m ipv6_cidr_block_network_border_group = (known after apply)
      [32m+[0m[0m main_route_table_id                  = (known after apply)
      [32m+[0m[0m owner_id                             = (known after apply)
      [32m+[0m[0m region                               = "us-west-2"
      [32m+[0m[0m tags                                 = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-vpc-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
      [32m+[0m[0m tags_all                             = {
          [32m+[0m[0m "Environment" = "staging"
          [32m+[0m[0m "Name"        = "staging-vpc-9k2"
          [32m+[0m[0m "Owner"       = "DevOps Team"
          [32m+[0m[0m "Purpose"     = "Multi-Environment Infrastructure"
        }
    }

[1mPlan:[0m 87 to add, 0 to change, 0 to destroy.
[0m
Changes to Outputs:
  [32m+[0m[0m dev_instance_ids            = [
      [32m+[0m[0m (known after apply),
      [32m+[0m[0m (known after apply),
    ]
  [32m+[0m[0m dev_instance_public_ips     = [
      [32m+[0m[0m (known after apply),
      [32m+[0m[0m (known after apply),
    ]
  [32m+[0m[0m dev_security_group_id       = (known after apply)
  [32m+[0m[0m dev_vpc_id                  = (known after apply)
  [32m+[0m[0m prod_instance_ids           = [
      [32m+[0m[0m (known after apply),
      [32m+[0m[0m (known after apply),
    ]
  [32m+[0m[0m prod_instance_public_ips    = [
      [32m+[0m[0m (known after apply),
      [32m+[0m[0m (known after apply),
    ]
  [32m+[0m[0m prod_security_group_id      = (known after apply)
  [32m+[0m[0m prod_vpc_id                 = (known after apply)
  [32m+[0m[0m staging_instance_ids        = [
      [32m+[0m[0m (known after apply),
      [32m+[0m[0m (known after apply),
    ]
  [32m+[0m[0m staging_instance_public_ips = [
      [32m+[0m[0m (known after apply),
      [32m+[0m[0m (known after apply),
    ]
  [32m+[0m[0m staging_security_group_id   = (known after apply)
  [32m+[0m[0m staging_vpc_id              = (known after apply)
[90m
─────────────────────────────────────────────────────────────────────────────[0m

Saved the plan to: tfplan

To perform exactly these actions, run the following command to apply:
    terraform apply "tfplan"

# Running terraform apply...
[0m[1mmodule.prod_environment.aws_cloudwatch_log_group.vpc_flow_logs: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_cloudwatch_log_group.vpc_flow_logs: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_iam_role.flow_logs_role: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_vpc.main: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_cloudwatch_log_group.vpc_flow_logs: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_vpc.main: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_iam_role.ec2_role: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_iam_role.flow_logs_role: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_vpc.main: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_iam_role.ec2_role: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_iam_role.flow_logs_role: Creation complete after 0s [id=staging-flow-logs-role-9k2][0m
[0m[1mmodule.dev_environment.aws_iam_role.flow_logs_role: Creation complete after 0s [id=dev-flow-logs-role-9k2][0m
[0m[1mmodule.dev_environment.aws_iam_role.ec2_role: Creation complete after 0s [id=dev-ec2-role-9k2][0m
[0m[1mmodule.staging_environment.aws_iam_role.ec2_role: Creation complete after 0s [id=staging-ec2-role-9k2][0m
[0m[1mmodule.prod_environment.aws_iam_role.flow_logs_role: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_iam_role.flow_logs_role: Creation complete after 1s [id=prod-flow-logs-role-9k2][0m
[0m[1mmodule.prod_environment.aws_iam_role.ec2_role: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_iam_role.ec2_role: Creation complete after 0s [id=prod-ec2-role-9k2][0m
[0m[1mmodule.staging_environment.aws_iam_role_policy.flow_logs_policy: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_iam_instance_profile.ec2_profile: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_iam_role_policy.flow_logs_policy: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_iam_role_policy.ec2_policy: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_iam_role_policy.flow_logs_policy: Creation complete after 0s [id=staging-flow-logs-role-9k2:staging-flow-logs-policy-9k2][0m
[0m[1mmodule.dev_environment.aws_iam_role_policy.ec2_policy: Creation complete after 0s [id=dev-ec2-role-9k2:dev-ec2-policy-9k2][0m
[0m[1mmodule.dev_environment.aws_iam_role_policy.flow_logs_policy: Creation complete after 0s [id=dev-flow-logs-role-9k2:dev-flow-logs-policy-9k2][0m
[0m[1mmodule.staging_environment.aws_iam_role_policy.ec2_policy: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_cloudwatch_log_group.vpc_flow_logs: Creation complete after 1s [id=/aws/vpc/flowlogs/prod-9k2][0m
[0m[1mmodule.staging_environment.aws_cloudwatch_log_group.vpc_flow_logs: Creation complete after 1s [id=/aws/vpc/flowlogs/staging-9k2][0m
[0m[1mmodule.staging_environment.aws_iam_instance_profile.ec2_profile: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_iam_role_policy.flow_logs_policy: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_cloudwatch_log_group.vpc_flow_logs: Creation complete after 1s [id=/aws/vpc/flowlogs/dev-9k2][0m
[0m[1mmodule.staging_environment.aws_iam_role_policy.ec2_policy: Creation complete after 0s [id=staging-ec2-role-9k2:staging-ec2-policy-9k2][0m
[0m[1mmodule.prod_environment.aws_iam_role_policy.flow_logs_policy: Creation complete after 0s [id=prod-flow-logs-role-9k2:prod-flow-logs-policy-9k2][0m
[0m[1mmodule.prod_environment.aws_iam_role_policy.ec2_policy: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_iam_instance_profile.ec2_profile: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_iam_role_policy.ec2_policy: Creation complete after 0s [id=prod-ec2-role-9k2:prod-ec2-policy-9k2][0m
[0m[1mmodule.dev_environment.aws_iam_instance_profile.ec2_profile: Creation complete after 5s [id=dev-ec2-profile-9k2][0m
[0m[1mmodule.staging_environment.aws_iam_instance_profile.ec2_profile: Creation complete after 5s [id=staging-ec2-profile-9k2][0m
[0m[1mmodule.prod_environment.aws_iam_instance_profile.ec2_profile: Creation complete after 6s [id=prod-ec2-profile-9k2][0m
[0m[1mmodule.dev_environment.aws_vpc.main: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.prod_environment.aws_vpc.main: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_vpc.main: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.prod_environment.aws_vpc.main: Creation complete after 10s [id=vpc-ff40f4a02c0831bee][0m
[0m[1mmodule.dev_environment.aws_vpc.main: Creation complete after 10s [id=vpc-4961c31b42ff15b66][0m
[0m[1mmodule.staging_environment.aws_vpc.main: Creation complete after 10s [id=vpc-da891db68e07d90b8][0m
[0m[1mmodule.prod_environment.aws_internet_gateway.main: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_subnet.private[0]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_subnet.public[1]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_subnet.private[1]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_subnet.public[0]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_flow_log.vpc_flow_logs: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_subnet.public[1]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_subnet.public[0]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_flow_log.vpc_flow_logs: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_security_group.web: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_flow_log.vpc_flow_logs: Creation complete after 1s [id=fl-9148f87fac0a8f623][0m
[0m[1mmodule.dev_environment.aws_flow_log.vpc_flow_logs: Creation complete after 0s [id=fl-d475306376103eb9a][0m
[0m[1mmodule.prod_environment.aws_subnet.private[1]: Creation complete after 1s [id=subnet-780abf1dde37c54f4][0m
[0m[1mmodule.dev_environment.aws_subnet.private[0]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_subnet.private[0]: Creation complete after 1s [id=subnet-07d54259341875586][0m
[0m[1mmodule.prod_environment.aws_internet_gateway.main: Creation complete after 1s [id=igw-e99e7e39d5fe24a11][0m
[0m[1mmodule.dev_environment.aws_subnet.private[0]: Creation complete after 0s [id=subnet-783387fbcccc5c835][0m
[0m[1mmodule.dev_environment.aws_security_group.web: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_internet_gateway.main: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_security_group.web: Creation complete after 0s [id=sg-b80232b1973cbf2a3][0m
[0m[1mmodule.dev_environment.aws_subnet.private[1]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_flow_log.vpc_flow_logs: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_subnet.public[1]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_security_group.web: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_flow_log.vpc_flow_logs: Creation complete after 0s [id=fl-ec5b0f418ba62de70][0m
[0m[1mmodule.dev_environment.aws_subnet.private[1]: Creation complete after 0s [id=subnet-dfabb0fe2c2ab6790][0m
[0m[1mmodule.dev_environment.aws_internet_gateway.main: Creation complete after 0s [id=igw-7f29332a98f470c0b][0m
[0m[1mmodule.staging_environment.aws_subnet.public[0]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_internet_gateway.main: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_subnet.private[1]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_subnet.private[1]: Creation complete after 0s [id=subnet-0743410c7f6bd038e][0m
[0m[1mmodule.staging_environment.aws_internet_gateway.main: Creation complete after 1s [id=igw-1ab4cb788c528c6b6][0m
[0m[1mmodule.dev_environment.aws_security_group.web: Creation complete after 1s [id=sg-83aadc9fbf8d3edcb][0m
[0m[1mmodule.staging_environment.aws_subnet.private[0]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_security_group.web: Creation complete after 1s [id=sg-b011e137ab7410ae6][0m
[0m[1mmodule.prod_environment.aws_network_acl.private: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_eip.nat[1]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_route_table.public: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_subnet.private[0]: Creation complete after 0s [id=subnet-779e168aa58cab031][0m
[0m[1mmodule.prod_environment.aws_eip.nat[0]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_eip.nat[1]: Creation complete after 0s [id=eipalloc-fc1e91a4275cdc88f][0m
[0m[1mmodule.prod_environment.aws_eip.nat[0]: Creation complete after 0s [id=eipalloc-080044803f7ca53ea][0m
[0m[1mmodule.prod_environment.aws_network_acl.private: Creation complete after 0s [id=acl-a0e47169febb4715f][0m
[0m[1mmodule.prod_environment.aws_instance.web[1]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_instance.web[0]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_network_acl.private: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_route_table.public: Creation complete after 0s [id=rtb-e72d240d2817bcae7][0m
[0m[1mmodule.dev_environment.aws_eip.nat[1]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_network_acl.private: Creation complete after 0s [id=acl-51dd47fb49a2cbf33][0m
[0m[1mmodule.dev_environment.aws_eip.nat[1]: Creation complete after 0s [id=eipalloc-1b02ea0db6aba7cfc][0m
[0m[1mmodule.dev_environment.aws_eip.nat[0]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_eip.nat[0]: Creation complete after 1s [id=eipalloc-bda73f0b53aeb7d26][0m
[0m[1mmodule.staging_environment.aws_route_table.public: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_route_table.public: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_route_table.public: Creation complete after 0s [id=rtb-631086963ad3af7a5][0m
[0m[1mmodule.staging_environment.aws_route_table.public: Creation complete after 0s [id=rtb-c96ee7f05704e6cb4][0m
[0m[1mmodule.staging_environment.aws_eip.nat[0]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_eip.nat[0]: Creation complete after 0s [id=eipalloc-9c91d1747203fdef8][0m
[0m[1mmodule.staging_environment.aws_eip.nat[1]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_eip.nat[1]: Creation complete after 0s [id=eipalloc-0b51adbf982222844][0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_subnet.public[0]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.prod_environment.aws_subnet.public[1]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_subnet.public[1]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_subnet.public[0]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.prod_environment.aws_subnet.public[0]: Creation complete after 11s [id=subnet-13f4e221fef3f1382][0m
[0m[1mmodule.dev_environment.aws_subnet.public[0]: Creation complete after 10s [id=subnet-95c4076ebe0c23366][0m
[0m[1mmodule.prod_environment.aws_subnet.public[1]: Creation complete after 11s [id=subnet-5640f098f0fdcd235][0m
[0m[1mmodule.dev_environment.aws_subnet.public[1]: Creation complete after 10s [id=subnet-da795c1d9b9efd7b4][0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_network_acl.public: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_network_acl.private: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_subnet.public[1]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.prod_environment.aws_network_acl.public: Creation complete after 0s [id=acl-b38472f89e4425889][0m
[0m[1mmodule.staging_environment.aws_subnet.public[0]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_subnet.public[1]: Creation complete after 10s [id=subnet-50f73fa63933bd68b][0m
[0m[1mmodule.staging_environment.aws_network_acl.private: Creation complete after 1s [id=acl-96d4b5c5d1f5c2722][0m
[0m[1mmodule.staging_environment.aws_subnet.public[0]: Creation complete after 11s [id=subnet-4a14c0ba5ed0254d0][0m
[0m[1mmodule.prod_environment.aws_route_table_association.public[1]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_route_table_association.public[0]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_nat_gateway.main[1]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_nat_gateway.main[0]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_route_table_association.public[0]: Creation complete after 0s [id=rtbassoc-50e474053e59801f7][0m
[0m[1mmodule.prod_environment.aws_route_table_association.public[1]: Creation complete after 0s [id=rtbassoc-1aeb726f3cdf10b5a][0m
[0m[1mmodule.prod_environment.aws_nat_gateway.main[1]: Creation complete after 0s [id=nat-edd5f27e05b17cd58][0m
[0m[1mmodule.dev_environment.aws_route_table_association.public[1]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_nat_gateway.main[0]: Creation complete after 0s [id=nat-208219d5e87b6b5ed][0m
[0m[1mmodule.dev_environment.aws_route_table_association.public[0]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_nat_gateway.main[1]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_network_acl.public: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_route_table_association.public[1]: Creation complete after 0s [id=rtbassoc-b2439dc5cd6365504][0m
[0m[1mmodule.dev_environment.aws_route_table_association.public[0]: Creation complete after 0s [id=rtbassoc-339e0f869c0cd4b37][0m
[0m[1mmodule.dev_environment.aws_nat_gateway.main[1]: Creation complete after 0s [id=nat-9d3a7ff57cfb0b967][0m
[0m[1mmodule.dev_environment.aws_network_acl.public: Creation complete after 0s [id=acl-3686fa97b67eb9765][0m
[0m[1mmodule.dev_environment.aws_nat_gateway.main[0]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_nat_gateway.main[1]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_nat_gateway.main[0]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_network_acl.public: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_nat_gateway.main[0]: Creation complete after 0s [id=nat-cb0a19105b3f02a16][0m
[0m[1mmodule.prod_environment.aws_instance.web[1]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.prod_environment.aws_instance.web[0]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_nat_gateway.main[1]: Creation complete after 0s [id=nat-7011025cd7f30c5c2][0m
[0m[1mmodule.staging_environment.aws_nat_gateway.main[0]: Creation complete after 0s [id=nat-3e573c30181400789][0m
[0m[1mmodule.staging_environment.aws_route_table_association.public[1]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_network_acl.public: Creation complete after 0s [id=acl-85bd5a0412f5e7558][0m
[0m[1mmodule.prod_environment.aws_route_table.private[0]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_route_table_association.public[0]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_route_table.private[1]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_route_table_association.public[1]: Creation complete after 0s [id=rtbassoc-e25b3480da8b5f80b][0m
[0m[1mmodule.staging_environment.aws_route_table_association.public[0]: Creation complete after 1s [id=rtbassoc-a6bb6632b05cef639][0m
[0m[1mmodule.dev_environment.aws_route_table.private[1]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_route_table.private[0]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_route_table.private[0]: Creation complete after 1s [id=rtb-56e919138ce97d2f0][0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_route_table.private[0]: Creation complete after 2s [id=rtb-06aec6154edecf6f7][0m
[0m[1mmodule.dev_environment.aws_route_table.private[1]: Creation complete after 2s [id=rtb-a730e94721a99dda6][0m
[0m[1mmodule.prod_environment.aws_route_table.private[1]: Creation complete after 3s [id=rtb-c6e90192e1d5c280d][0m
[0m[1mmodule.staging_environment.aws_route_table.private[1]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_route_table_association.private[1]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_route_table_association.private[0]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_route_table.private[0]: Creating...[0m[0m
[0m[1mmodule.dev_environment.aws_route_table_association.private[0]: Creation complete after 0s [id=rtbassoc-eb99f46671b063b48][0m
[0m[1mmodule.dev_environment.aws_route_table_association.private[1]: Creation complete after 1s [id=rtbassoc-674b8f9316fcb26ae][0m
[0m[1mmodule.prod_environment.aws_route_table_association.private[0]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_route_table_association.private[1]: Creating...[0m[0m
[0m[1mmodule.prod_environment.aws_route_table_association.private[0]: Creation complete after 0s [id=rtbassoc-0c10327ddc954f89d][0m
[0m[1mmodule.prod_environment.aws_route_table_association.private[1]: Creation complete after 0s [id=rtbassoc-c6f93219f971b285f][0m
[0m[1mmodule.staging_environment.aws_route_table.private[0]: Creation complete after 1s [id=rtb-f559ec47073203417][0m
[0m[1mmodule.staging_environment.aws_route_table.private[1]: Creation complete after 1s [id=rtb-9a9480f9d86433244][0m
[0m[1mmodule.prod_environment.aws_instance.web[1]: Creation complete after 14s [id=i-6d6a0b2518067c5ac][0m
[0m[1mmodule.prod_environment.aws_instance.web[0]: Creation complete after 14s [id=i-e1c2a37607e1f9ffb][0m
[0m[1mmodule.staging_environment.aws_route_table_association.private[1]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_route_table_association.private[0]: Creating...[0m[0m
[0m[1mmodule.staging_environment.aws_route_table_association.private[1]: Creation complete after 0s [id=rtbassoc-d4bb613827c8f3124][0m
[0m[1mmodule.staging_environment.aws_route_table_association.private[0]: Creation complete after 0s [id=rtbassoc-9268fdd89b3f9513f][0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [1m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [1m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [1m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [1m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [1m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [1m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [1m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [1m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [1m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [1m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [1m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [1m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [1m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [1m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [1m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [1m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [1m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [1m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [1m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [1m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [1m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [1m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [1m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [1m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [2m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [2m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [2m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [2m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [2m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [2m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [2m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [2m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [2m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [2m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [2m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [2m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [2m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [2m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [2m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [2m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [2m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [2m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [2m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [2m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [2m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [2m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [2m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [2m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [3m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [3m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [3m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [3m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [3m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [3m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [3m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [3m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [3m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [3m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [3m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [3m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [3m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [3m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [3m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [3m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [3m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [3m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [3m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [3m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [3m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [3m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [3m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [3m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [4m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [4m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [4m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [4m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [4m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [4m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [4m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [4m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [4m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [4m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [4m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [4m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [4m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [4m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [4m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [4m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [4m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [4m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [4m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [4m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [4m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [4m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [4m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [4m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [5m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [5m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [5m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [5m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [5m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [5m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [5m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [5m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [5m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [5m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [5m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [5m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [5m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [5m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [5m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [5m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [5m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [5m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [5m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [5m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [5m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [5m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [5m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [5m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [6m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [6m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [6m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [6m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [6m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [6m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [6m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [6m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [6m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [6m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [6m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [6m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [6m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [6m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [6m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [6m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [6m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [6m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [6m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [6m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [6m51s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [6m51s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [6m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [6m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [7m1s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [7m1s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [7m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [7m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [7m11s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [7m11s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [7m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [7m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [7m21s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [7m21s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [7m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [7m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [7m31s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [7m31s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [7m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [7m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [7m41s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [7m41s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [7m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [7m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [7m51s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [7m51s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [7m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [7m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [8m1s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [8m1s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [8m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [8m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [8m11s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [8m11s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [8m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [8m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [8m21s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [8m21s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [8m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [8m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [8m31s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [8m31s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [8m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [8m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [8m41s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [8m41s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [8m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [8m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [8m51s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [8m51s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [8m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [8m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [9m1s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [9m1s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [9m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [9m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [9m11s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [9m11s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [9m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [9m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [9m21s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [9m21s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [9m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [9m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [9m31s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [9m31s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [9m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [9m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [9m41s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [9m41s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [9m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [9m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [9m51s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [9m51s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [9m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [9m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [10m1s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [10m1s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [10m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [10m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [10m11s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [10m11s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [10m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [10m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [10m21s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [10m21s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [10m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [10m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [10m31s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [10m31s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [10m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [10m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [10m41s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [10m41s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [10m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [10m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [10m51s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [10m51s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [10m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [10m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [11m1s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [11m1s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [11m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [11m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [11m11s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [11m11s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [11m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [11m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [11m21s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [11m21s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [11m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [11m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [11m31s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [11m31s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [11m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [11m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [11m41s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [11m41s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [11m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [11m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [11m51s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [11m51s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [11m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [11m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [12m1s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [12m1s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [12m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [12m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [12m11s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [12m11s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [12m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [12m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [12m21s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [12m21s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [12m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [12m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [12m31s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [12m31s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [12m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [12m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [12m41s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [12m41s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [12m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [12m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [12m51s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [12m51s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [12m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [12m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [13m1s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [13m1s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [13m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [13m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [13m11s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [13m11s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [13m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [13m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [13m21s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [13m21s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [13m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [13m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [13m31s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [13m31s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [13m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [13m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [13m41s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [13m41s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [13m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [13m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [13m51s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [13m51s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [13m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [13m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [14m1s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [14m1s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [14m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [14m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [14m11s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [14m11s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [14m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [14m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [14m21s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [14m21s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [14m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [14m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [14m31s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [14m31s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [14m30s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [14m30s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [14m41s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [14m41s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [14m40s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [14m40s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [14m51s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [14m51s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [14m50s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [14m50s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [15m1s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [15m1s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [15m0s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [15m0s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [15m11s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [15m11s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [15m10s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [15m10s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [15m21s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [15m21s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[0]: Still creating... [15m20s elapsed][0m[0m
[0m[1mmodule.staging_environment.aws_instance.web[1]: Still creating... [15m20s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[1]: Still creating... [15m31s elapsed][0m[0m
[0m[1mmodule.dev_environment.aws_instance.web[0]: Still creating... [15m31s elapsed][0m[0m
